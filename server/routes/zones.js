const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const auditLogger = require('../services/auditLogger');

// GET /api/v1/zones
router.get('/', async (req, res) => {
  try {
    const { camera_id } = req.query;
    let query = 'SELECT z.*, c.name as camera_name, c.location_name FROM restricted_zones z JOIN cameras c ON z.camera_id = c.id WHERE 1=1';
    const params = [];

    if (camera_id) {
      query += ' AND z.camera_id = ?';
      params.push(camera_id);
    }

    query += ' ORDER BY z.created_at DESC';

    const zones = await db.all(query, params);
    // Parse polygon_points JSON safely
    const formatted = zones.map(z => ({
      ...z,
      polygon_points: typeof z.polygon_points === 'string' ? JSON.parse(z.polygon_points) : z.polygon_points
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/zones - Define new polygon restricted zone
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { camera_id, zone_name, polygon_points, event_type, alert_severity, active_hours } = req.body;

    if (!camera_id || !zone_name || !polygon_points) {
      return res.status(400).json({ success: false, error: 'Camera ID, Zone Name, and Polygon Points are required' });
    }

    const id = `ZONE-${Date.now().toString().slice(-6)}`;
    const pointsStr = typeof polygon_points === 'object' ? JSON.stringify(polygon_points) : polygon_points;

    await db.run(`
      INSERT INTO restricted_zones 
      (id, camera_id, zone_name, polygon_points, event_type, alert_severity, active_hours, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      id,
      camera_id,
      zone_name,
      pointsStr,
      event_type || 'Restricted Zone Intrusion',
      alert_severity || 'high',
      active_hours || '00:00-23:59'
    ]);

    await auditLogger.log({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      action: 'ZONE_CREATED',
      resourceType: 'RESTRICTED_ZONE',
      resourceId: id,
      details: { camera_id, zone_name, event_type, alert_severity },
      ipAddress: req.ip
    });

    const created = await db.get('SELECT * FROM restricted_zones WHERE id = ?', [id]);
    res.status(201).json({
      success: true,
      data: {
        ...created,
        polygon_points: JSON.parse(created.polygon_points)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/zones/:id
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT * FROM restricted_zones WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Restricted zone not found' });
    }

    await db.run('DELETE FROM restricted_zones WHERE id = ?', [id]);

    await auditLogger.log({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      action: 'ZONE_DELETED',
      resourceType: 'RESTRICTED_ZONE',
      resourceId: id,
      details: { zone_name: existing.zone_name },
      ipAddress: req.ip
    });

    res.json({ success: true, message: `Zone ${id} deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
