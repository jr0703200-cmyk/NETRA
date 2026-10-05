const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const auditLogger = require('../services/auditLogger');

// GET /api/v1/tracking/plates/active - Recent distinct detected plates
router.get('/plates/active', async (req, res) => {
  try {
    const plates = await db.all(`
      SELECT DISTINCT plate_number, MAX(timestamp) as last_seen, COUNT(*) as sighting_count
      FROM vehicle_sightings
      GROUP BY plate_number
      ORDER BY last_seen DESC
      LIMIT 20
    `);

    res.json({ success: true, count: plates.length, data: plates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/tracking/:plate - Sequential cross-camera journey reconstruction
router.get('/:plate', async (req, res) => {
  try {
    const { plate } = req.params;
    const { start_date, end_date } = req.query;

    const normalized = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const formatted = plate.trim().toUpperCase();

    let query = `
      SELECT s.*, c.location_name, c.camera_type, c.department
      FROM vehicle_sightings s
      JOIN cameras c ON s.camera_id = c.id
      WHERE (REPLACE(REPLACE(s.plate_number, '-', ''), ' ', '') = ? OR s.plate_number = ?)
    `;
    const params = [normalized, formatted];

    if (start_date) {
      query += ' AND s.timestamp >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND s.timestamp <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY s.timestamp ASC';

    const sightings = await db.all(query, params);

    // Watchlist check for this plate
    const watchlist = await db.get(`
      SELECT * FROM watchlist_entries 
      WHERE (REPLACE(REPLACE(plate_number, '-', ''), ' ', '') = ? OR plate_number = ?)
      AND is_active = 1
    `, [normalized, formatted]);

    // Construct sequential journey metrics
    let totalDistanceKm = 0;
    let journeyDurationMinutes = 0;

    if (sightings.length > 1) {
      const startTime = new Date(sightings[0].timestamp).getTime();
      const endTime = new Date(sightings[sightings.length - 1].timestamp).getTime();
      journeyDurationMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));

      // Calculate approximate Haversine distance between consecutive cameras
      for (let i = 0; i < sightings.length - 1; i++) {
        const p1 = sightings[i];
        const p2 = sightings[i + 1];
        const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
        const dLng = (p2.lng - p1.lng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(p1.lat * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        totalDistanceKm += +(6371 * c).toFixed(2);
      }
    }

    // Sequence index mapping: 1, 2, 3, 4
    const sequencedSightings = sightings.map((s, idx) => ({
      sequence_number: idx + 1,
      ...s
    }));

    res.json({
      success: true,
      plate: formatted,
      total_checkpoints: sightings.length,
      distance_km: +totalDistanceKm.toFixed(2),
      duration_minutes: journeyDurationMinutes,
      watchlist_match: !!watchlist,
      watchlist_details: watchlist || null,
      first_seen: sightings.length > 0 ? sightings[0].timestamp : null,
      last_seen: sightings.length > 0 ? sightings[sightings.length - 1].timestamp : null,
      route: sequencedSightings
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
