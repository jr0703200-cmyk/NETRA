const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// POST /api/v1/search - Deep Intelligence Search across all sightings, detections, and alerts
router.post('/', async (req, res) => {
  try {
    const {
      plate,
      camera_id,
      location,
      event_type,
      severity,
      tracking_id,
      start_date,
      end_date,
      page = 1,
      limit = 50
    } = req.body;

    let query = `
      SELECT 
        s.id,
        'sighting' as record_type,
        s.plate_number,
        s.tracking_id,
        s.camera_id,
        c.name as camera_name,
        c.location_name,
        s.lat,
        s.lng,
        s.confidence,
        s.speed_kmh,
        s.snapshot_url,
        s.timestamp,
        s.is_demo,
        COALESCE(w.category, 'Standard Vehicle') as watchlist_category,
        COALESCE(w.severity, 'low') as watchlist_severity
      FROM vehicle_sightings s
      LEFT JOIN cameras c ON s.camera_id = c.id
      LEFT JOIN watchlist_entries w ON (
        REPLACE(REPLACE(s.plate_number, '-', ''), ' ', '') = REPLACE(REPLACE(w.plate_number, '-', ''), ' ', '')
        AND w.is_active = 1
      )
      WHERE 1=1
    `;
    const params = [];

    if (plate) {
      const cleanPlate = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      query += ` AND (REPLACE(REPLACE(s.plate_number, '-', ''), ' ', '') LIKE ? OR s.plate_number LIKE ?)`;
      params.push(`%${cleanPlate}%`, `%${plate.trim()}%`);
    }

    if (camera_id) {
      query += ' AND s.camera_id = ?';
      params.push(camera_id);
    }

    if (location) {
      query += ' AND (c.location_name LIKE ? OR c.name LIKE ?)';
      params.push(`%${location}%`, `%${location}%`);
    }

    if (tracking_id) {
      query += ' AND s.tracking_id LIKE ?';
      params.push(`%${tracking_id}%`);
    }

    if (severity && severity !== 'all') {
      query += ' AND w.severity = ?';
      params.push(severity);
    }

    if (start_date) {
      query += ' AND s.timestamp >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND s.timestamp <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY s.timestamp DESC LIMIT ? OFFSET ?';
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    params.push(parseInt(limit, 10), offset);

    const results = await db.all(query, params);

    res.json({
      success: true,
      count: results.length,
      page: parseInt(page, 10),
      data: results
    });
  } catch (err) {
    console.error('[SEARCH] Query error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
