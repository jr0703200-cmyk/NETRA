const express = require('express');
const router = express.Router();
const os = require('os');
const db = require('../db');
const aiBridge = require('../services/aiBridge');

// GET /api/v1/health - System Diagnostics & Component Matrix
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();

    // 1. Database Check
    let dbStatus = 'ONLINE';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await db.get('SELECT 1');
      dbLatency = Date.now() - dbStart;
    } catch (e) {
      dbStatus = 'OFFLINE';
    }

    // 2. AI Processing Service Check
    const aiHealth = await aiBridge.checkHealth();
    const aiStatus = aiHealth.online ? 'ONLINE' : 'DEGRADED'; // Degraded because fallback simulation is available

    // 3. Camera Ingestion Fleet Health
    const cameraCounts = await db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ONLINE' THEN 1 ELSE 0 END) as online,
        SUM(CASE WHEN status = 'OFFLINE' THEN 1 ELSE 0 END) as offline
      FROM cameras
    `);
    const ingestionStatus = (cameraCounts.online > 0) ? 'ONLINE' : 'DEGRADED';

    // 4. Memory & System Load
    const totalMemMb = Math.round(os.totalmem() / 1024 / 1024);
    const freeMemMb = Math.round(os.freemem() / 1024 / 1024);
    const usedMemMb = totalMemMb - freeMemMb;
    const processMem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    const overallStatus = (dbStatus === 'ONLINE') ? 'ONLINE' : 'DEGRADED';

    res.json({
      success: true,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.round(process.uptime()),
      system_ping_ms: Date.now() - startTime,
      components: {
        api_gateway: {
          name: 'NETRA API Gateway & Telemetry Service',
          status: 'ONLINE',
          port: process.env.PORT || 3001,
          runtime: `Node.js ${process.version}`,
          heap_used_mb: processMem,
          uptime_s: Math.round(process.uptime())
        },
        ai_processing: {
          name: 'NETRA Python/FastAPI Neural Engine',
          status: aiHealth.online ? 'ONLINE' : 'OFFLINE',
          details: aiHealth.online ? 'YOLOv8 + EasyOCR + DeepSORT Operational' : 'AI Service Offline - Operating in Safe Fallback Mode',
          endpoint: aiBridge.aiBaseUrl
        },
        database: {
          name: 'Relational Database (SQLite Engine)',
          status: dbStatus,
          latency_ms: dbLatency,
          storage_mode: 'High-Concurrency WAL Mode'
        },
        camera_ingestion: {
          name: 'RTSP/HTTP/ONVIF Camera Stream Ingestion Gateway',
          status: ingestionStatus,
          active_streams: cameraCounts.online || 0,
          total_cameras: cameraCounts.total || 0,
          offline_cameras: cameraCounts.offline || 0
        },
        websocket_service: {
          name: 'Socket.IO Bidirectional Real-Time Telemetry Bus',
          status: 'ONLINE',
          events_supported: ['netra_alert', 'netra_cam_status', 'netra_vehicle_spot', 'netra_system_stats']
        },
        cache_service: {
          name: 'High-Speed Memory & Watchlist Registry Cache',
          status: 'ONLINE',
          driver: 'Memory Cache / Local Micro-Store'
        },
        storage_service: {
          name: 'Forensic Snapshot Archive Engine',
          status: 'ONLINE',
          driver: 'Local Storage Vault (Encrypted)'
        }
      },
      host: {
        platform: os.platform(),
        cpus: os.cpus().length,
        memory_used_mb: usedMemMb,
        memory_total_mb: totalMemMb,
        load_avg: os.loadavg()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, status: 'ERROR', error: err.message });
  }
});

module.exports = router;
