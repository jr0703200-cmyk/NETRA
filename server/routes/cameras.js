const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const cameraIngestion = require('../services/cameraIngestion');
const auditLogger = require('../services/auditLogger');
const alertEngine = require('../services/alertEngine');

// GET /api/v1/cameras - List all cameras (credentials sanitized)
router.get('/', async (req, res) => {
  try {
    const { status, department, search } = req.query;
    let query = 'SELECT id, name, department, location_name, lat, lng, ip_address, port, rtsp_url, http_url, camera_type, status, fps, resolution, latency_ms, last_heartbeat, stream_uptime_s, ai_status, error_message, is_demo, created_at FROM cameras WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }
    if (search) {
      query += ' AND (name LIKE ? OR location_name LIKE ? OR id LIKE ? OR ip_address LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const cameras = await db.all(query, params);
    res.json({ success: true, count: cameras.length, data: cameras });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/cameras/:id
router.get('/:id', async (req, res) => {
  try {
    const cam = await db.get(`
      SELECT id, name, department, location_name, lat, lng, ip_address, port, rtsp_url, http_url, camera_type, status, fps, resolution, latency_ms, last_heartbeat, stream_uptime_s, ai_status, error_message, is_demo, created_at 
      FROM cameras WHERE id = ?
    `, [req.params.id]);

    if (!cam) {
      return res.status(404).json({ success: false, error: 'Camera not found' });
    }

    // Fetch zones associated with this camera
    const zones = await db.all('SELECT * FROM restricted_zones WHERE camera_id = ? AND is_active = 1', [cam.id]);

    res.json({ success: true, data: { ...cam, zones } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/cameras/test-connection - Real socket & RTSP validation
router.post('/test-connection', async (req, res) => {
  try {
    const { ip_address, port, rtsp_url, http_url, username, password, is_demo } = req.body;

    const result = await cameraIngestion.testConnection({
      ip_address,
      port: port || 554,
      rtsp_url,
      http_url,
      username,
      password,
      is_demo: !!is_demo
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 'Error',
      code: 'INTERNAL_ERROR',
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/v1/cameras/discover - ONVIF & Subnet Camera Discovery
router.post('/discover', async (req, res) => {
  try {
    const discovered = await cameraIngestion.discoverCameras();
    res.json({
      success: true,
      count: discovered.length,
      cameras: discovered,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/cameras - Add a new camera
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      id,
      department,
      location_name,
      lat,
      lng,
      ip_address,
      port,
      rtsp_url,
      http_url,
      camera_type,
      username,
      password,
      save_offline,
      is_demo
    } = req.body;

    if (!name || !location_name) {
      return res.status(400).json({ success: false, error: 'Camera Name and Location are required' });
    }

    const cameraId = id || `CAM-${Math.floor(100 + Math.random() * 900)}`;

    // Verify connection unless administrator explicitly opted to save offline
    let connectionStatus = 'OFFLINE';
    let errorMessage = null;

    if (!save_offline) {
      const testResult = await cameraIngestion.testConnection({
        ip_address,
        port: port || 554,
        rtsp_url,
        http_url,
        username,
        password,
        is_demo: !!is_demo
      });

      if (!testResult.success) {
        return res.status(400).json({
          success: false,
          error: `Connection test failed: ${testResult.status}. ${testResult.details}. Check credentials or toggle "Save as Offline Camera".`,
          connection_test: testResult
        });
      }
      connectionStatus = testResult.status === 'Connected' ? 'ONLINE' : 'OFFLINE';
      errorMessage = testResult.details;
    }

    // Save camera record
    await db.run(`
      INSERT INTO cameras 
      (id, name, department, location_name, lat, lng, ip_address, port, rtsp_url, http_url, camera_type, status, fps, resolution, latency_ms, ai_status, error_message, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cameraId,
      name,
      department || 'General Surveillance',
      location_name,
      parseFloat(lat) || 23.0225,
      parseFloat(lng) || 72.5714,
      ip_address || '',
      parseInt(port, 10) || 554,
      rtsp_url || '',
      http_url || `/api/v1/cameras/${cameraId}/stream`,
      camera_type || 'PTZ-4K-ANPR',
      connectionStatus,
      connectionStatus === 'ONLINE' ? 25 : 0,
      '1920x1080',
      connectionStatus === 'ONLINE' ? 45 : 0,
      'STANDBY',
      errorMessage,
      is_demo ? 1 : 0
    ]);

    // Store credentials securely (never returned to frontend)
    if (username || password) {
      await db.run(`
        INSERT OR REPLACE INTO camera_credentials (id, camera_id, username, password_secret, onvif_port)
        VALUES (?, ?, ?, ?, ?)
      `, [`CRED-${cameraId}`, cameraId, username || 'admin', password || '', 80]);
    }

    // Audit log
    await auditLogger.log({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      action: 'CAMERA_ADDED',
      resourceType: 'CAMERA',
      resourceId: cameraId,
      details: { name, location: location_name, ip: ip_address },
      ipAddress: req.ip
    });

    const saved = await db.get('SELECT * FROM cameras WHERE id = ?', [cameraId]);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('[CAMERAS] Add camera error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/cameras/:id
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT * FROM cameras WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Camera not found' });
    }

    await db.run('DELETE FROM cameras WHERE id = ?', [id]);
    await db.run('DELETE FROM camera_credentials WHERE camera_id = ?', [id]);

    await auditLogger.log({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      action: 'CAMERA_DELETED',
      resourceType: 'CAMERA',
      resourceId: id,
      details: { name: existing.name },
      ipAddress: req.ip
    });

    res.json({ success: true, message: `Camera ${id} removed successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/cameras/:id/trigger-demo-event - Operator Test Trigger
router.post('/:id/trigger-demo-event', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const camera = await db.get('SELECT * FROM cameras WHERE id = ?', [id]);
    if (!camera) {
      return res.status(404).json({ success: false, error: 'Camera not found' });
    }

    const testPlates = ['GJ-01-AB-1234', 'GJ-01-HW-8821', 'GJ-05-XY-9988'];
    const selectedPlate = testPlates[Math.floor(Math.random() * testPlates.length)];

    const alert = await alertEngine.checkPlateAgainstWatchlist(
      { plate_number: selectedPlate, confidence: 0.985 },
      camera,
      1
    );

    res.json({
      success: true,
      message: alert ? 'Watchlist match triggered alert!' : 'Detection recorded (No active watchlist match)',
      plate: selectedPlate,
      alert
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/cameras/:id/stream - Browser-compatible live stream endpoint
router.get('/:id/stream', (req, res) => {
  const { id } = req.params;

  // Set multipart/x-mixed-replace MJPEG stream header
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=--netraboundary',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Connection': 'close',
    'Expires': '0'
  });

  let frameCounter = 0;
  const interval = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(interval);
      return;
    }

    frameCounter++;
    // Generate synthetic SVG/JPEG frame buffer with live tactical HUD
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const svgFrame = `
      <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
        <rect width="640" height="360" fill="#08090C" />
        <!-- Road / Lane Grid -->
        <path d="M 0 360 L 260 180 L 380 180 L 640 360" fill="#121317" stroke="#25262B" stroke-width="1.5" />
        <line x1="320" y1="180" x2="320" y2="360" stroke="#38393F" stroke-dasharray="10 10" stroke-width="2" />
        <!-- Moving Vehicle Simulation -->
        <g transform="translate(${240 + Math.sin(frameCounter * 0.1) * 30}, ${220 + (frameCounter % 60) * 1.5})">
          <rect width="140" height="70" rx="6" fill="#1C1E24" stroke="#DED8CC" stroke-width="1.5" />
          <rect x="25" y="10" width="90" height="30" rx="3" fill="#101115" />
          <!-- License plate -->
          <rect x="45" y="48" width="50" height="14" fill="#F2EFE8" stroke="#08090C" />
          <text x="70" y="59" fill="#08090C" font-family="monospace" font-size="8" font-weight="bold" text-anchor="middle">GJ-01-AB-1234</text>
          <!-- Neural Bounding Box -->
          <rect x="-8" y="-8" width="156" height="86" fill="none" stroke="#3DDC97" stroke-width="1.5" stroke-dasharray="6 3" />
          <text x="-4" y="-12" fill="#3DDC97" font-family="monospace" font-size="9" font-weight="bold">VEHICLE 98.4% [TRK-901]</text>
        </g>
        <!-- Tactical HUD -->
        <rect x="15" y="15" width="220" height="36" fill="rgba(8, 9, 12, 0.75)" stroke="#25262B" rx="4" />
        <circle cx="28" cy="33" r="5" fill="#3DDC97" />
        <text x="40" y="29" fill="#F2EFE8" font-family="monospace" font-size="11" font-weight="bold">${id} • LIVE FEED</text>
        <text x="40" y="43" fill="#A19E95" font-family="monospace" font-size="9">${timestamp} | 29.5 FPS</text>
        <!-- Reticle -->
        <circle cx="320" cy="180" r="12" fill="none" stroke="rgba(222, 216, 204, 0.25)" stroke-width="1" />
        <line x1="300" y1="180" x2="340" y2="180" stroke="rgba(222, 216, 204, 0.25)" stroke-width="1" />
        <line x1="320" y1="160" x2="320" y2="200" stroke="rgba(222, 216, 204, 0.25)" stroke-width="1" />
      </svg>
    `;

    const frameData = Buffer.from(svgFrame);
    res.write(`--netraboundary\r\n`);
    res.write(`Content-Type: image/svg+xml\r\n`);
    res.write(`Content-Length: ${frameData.length}\r\n\r\n`);
    res.write(frameData);
    res.write(`\r\n`);
  }, 100);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// GET /api/v1/cameras/:id/snapshot
router.get('/:id/snapshot', (req, res) => {
  const { id } = req.params;
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 19);

  const svgSnapshot = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <rect width="640" height="360" fill="#08090C" />
      <path d="M 0 360 L 260 180 L 380 180 L 640 360" fill="#14151A" stroke="#25262B" stroke-width="1.5" />
      <rect x="250" y="210" width="140" height="70" rx="6" fill="#1C1E24" stroke="#DED8CC" stroke-width="1.5" />
      <rect x="275" y="220" width="90" height="30" rx="3" fill="#101115" />
      <rect x="295" y="258" width="50" height="14" fill="#F2EFE8" stroke="#08090C" />
      <text x="320" y="269" fill="#08090C" font-family="monospace" font-size="8" font-weight="bold" text-anchor="middle">GJ-01-AB-1234</text>
      <!-- Bounding Box -->
      <rect x="242" y="202" width="156" height="86" fill="none" stroke="#FF4D5F" stroke-width="2" />
      <rect x="242" y="184" width="168" height="18" fill="#FF4D5F" rx="2" />
      <text x="246" y="196" fill="#FFFFFF" font-family="monospace" font-size="10" font-weight="bold">TARGET IDENTIFIED: 98.4%</text>
      <rect x="15" y="15" width="220" height="36" fill="rgba(8, 9, 12, 0.85)" stroke="#25262B" rx="4" />
      <circle cx="28" cy="33" r="5" fill="#FF4D5F" />
      <text x="40" y="29" fill="#F2EFE8" font-family="monospace" font-size="11" font-weight="bold">${id} • EVIDENCE SNAPSHOT</text>
      <text x="40" y="43" fill="#A19E95" font-family="monospace" font-size="9">${timestamp} | FORENSIC ARCHIVE</text>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svgSnapshot);
});

module.exports = router;
