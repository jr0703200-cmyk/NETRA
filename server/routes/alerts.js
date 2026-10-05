const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const auditLogger = require('../services/auditLogger');
const alertEngine = require('../services/alertEngine');

// GET /api/v1/alerts
router.get('/', async (req, res) => {
  try {
    const { severity, camera_id, plate, type, acknowledged, start_date, end_date, page = 1, limit = 50 } = req.query;
    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params = [];

    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }
    if (camera_id) {
      query += ' AND camera_id = ?';
      params.push(camera_id);
    }
    if (plate) {
      query += ' AND plate LIKE ?';
      params.push(`%${plate}%`);
    }
    if (type) {
      query += ' AND type LIKE ?';
      params.push(`%${type}%`);
    }
    if (acknowledged !== undefined && acknowledged !== '') {
      query += ' AND acknowledged = ?';
      params.push(parseInt(acknowledged, 10));
    }
    if (start_date) {
      query += ' AND timestamp >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND timestamp <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    params.push(parseInt(limit, 10), offset);

    const alerts = await db.all(query, params);
    const totalCount = await db.get('SELECT COUNT(*) as count FROM alerts');
    const unackCount = await db.get('SELECT COUNT(*) as count FROM alerts WHERE acknowledged = 0');

    res.json({
      success: true,
      total: totalCount.count,
      unacknowledged: unackCount.count,
      count: alerts.length,
      data: alerts
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/alerts/:id - Full investigation dossier
router.get('/:id', async (req, res) => {
  try {
    const alert = await db.get('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    // Related camera information
    const camera = await db.get('SELECT id, name, location_name, lat, lng, camera_type FROM cameras WHERE id = ?', [alert.camera_id]);

    // Check if plate matches watchlist
    let watchlistInfo = null;
    let vehicleJourney = [];
    if (alert.plate) {
      watchlistInfo = await db.get('SELECT * FROM watchlist_entries WHERE plate_number = ?', [alert.plate]);
      vehicleJourney = await db.all(`
        SELECT * FROM vehicle_sightings 
        WHERE plate_number = ? 
        ORDER BY timestamp ASC
      `, [alert.plate]);
    }

    // Related events around this time/camera
    const relatedAlerts = await db.all(`
      SELECT id, type, severity, plate, timestamp 
      FROM alerts 
      WHERE (camera_id = ? OR plate = ?) AND id != ?
      ORDER BY timestamp DESC LIMIT 5
    `, [alert.camera_id, alert.plate || '', alert.id]);

    res.json({
      success: true,
      data: {
        ...alert,
        camera,
        watchlist: watchlistInfo,
        journey: vehicleJourney,
        related_alerts: relatedAlerts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/alerts/:id/ack - Acknowledge alert with operator notes
router.post('/:id/ack', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { operator_notes } = req.body;
    const alert = await db.get('SELECT * FROM alerts WHERE id = ?', [id]);

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    const acknowledgedBy = req.user.name || req.user.username;
    const acknowledgedAt = new Date().toISOString();

    await db.run(`
      UPDATE alerts 
      SET acknowledged = 1, acknowledged_by = ?, acknowledged_at = ?, operator_notes = ?
      WHERE id = ?
    `, [acknowledgedBy, acknowledgedAt, operator_notes || 'Incident reviewed and acknowledged by operator', id]);

    await auditLogger.log({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      action: 'ALERT_ACKNOWLEDGED',
      resourceType: 'ALERT',
      resourceId: id,
      details: { operator_notes, acknowledgedBy },
      ipAddress: req.ip
    });

    const updated = await db.get('SELECT * FROM alerts WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/alerts/bulk-ack
router.post('/bulk-ack', authenticateToken, async (req, res) => {
  try {
    const { alertIds, operator_notes } = req.body;
    if (!Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({ success: false, error: 'alertIds array required' });
    }

    const acknowledgedBy = req.user.name || req.user.username;
    const acknowledgedAt = new Date().toISOString();

    for (const id of alertIds) {
      await db.run(`
        UPDATE alerts 
        SET acknowledged = 1, acknowledged_by = ?, acknowledged_at = ?, operator_notes = ?
        WHERE id = ?
      `, [acknowledgedBy, acknowledgedAt, operator_notes || 'Bulk acknowledged', id]);
    }

    await auditLogger.log({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      action: 'ALERTS_BULK_ACKNOWLEDGED',
      resourceType: 'ALERT',
      resourceId: alertIds.join(','),
      details: { count: alertIds.length },
      ipAddress: req.ip
    });

    res.json({ success: true, message: `Acknowledged ${alertIds.length} alerts` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/alerts/test - Trigger simulated operator test alert
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { type, severity, camera_id, description, plate } = req.body;
    const alert = await alertEngine.createCustomAlert({
      type: type || 'Watchlist Hit: Stolen Vehicle',
      severity: severity || 'critical',
      camera_id: camera_id || 'CAM-001',
      camera_location: 'Central Plaza & Main Expressway Junction',
      plate: plate || 'GJ-01-AB-1234',
      confidence: 0.992,
      description: description || 'Immediate tactical intercept alert triggered by operator test.',
      source: 'MANUAL_DISPATCH_TEST',
      is_demo: 1
    });

    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
