const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/v1/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    // 1. Alerts by Severity
    const alertsBySeverity = await db.all(`
      SELECT severity, COUNT(*) as count 
      FROM alerts 
      GROUP BY severity
    `);

    // 2. Alerts by Type
    const alertsByType = await db.all(`
      SELECT type, COUNT(*) as count 
      FROM alerts 
      GROUP BY type 
      ORDER BY count DESC 
      LIMIT 6
    `);

    // 3. Most Active Cameras
    const topCameras = await db.all(`
      SELECT c.id, c.name, c.location_name, COUNT(a.id) as alert_count
      FROM cameras c
      LEFT JOIN alerts a ON c.id = a.camera_id
      GROUP BY c.id
      ORDER BY alert_count DESC
      LIMIT 5
    `);

    // 4. Vehicle Sightings Trend (recent 7 days or mock hours if short)
    const sightingsTrend = await db.all(`
      SELECT substr(timestamp, 1, 10) as day, COUNT(*) as total_sightings, COUNT(DISTINCT plate_number) as unique_plates
      FROM vehicle_sightings
      GROUP BY day
      ORDER BY day DESC
      LIMIT 7
    `);

    // 5. Hourly Peak Activity Density (00 to 23 hours)
    const hourlyDensity = await db.all(`
      SELECT substr(timestamp, 12, 2) as hour, COUNT(*) as detections
      FROM vehicle_sightings
      GROUP BY hour
      ORDER BY hour ASC
    `);

    // 6. Camera Fleet Health
    const cameraHealth = await db.get(`
      SELECT 
        COUNT(*) as total_cameras,
        SUM(CASE WHEN status = 'ONLINE' THEN 1 ELSE 0 END) as online_cameras,
        SUM(CASE WHEN status = 'DEGRADED' THEN 1 ELSE 0 END) as degraded_cameras,
        SUM(CASE WHEN status = 'OFFLINE' THEN 1 ELSE 0 END) as offline_cameras,
        AVG(fps) as avg_fps,
        AVG(latency_ms) as avg_latency
      FROM cameras
    `);

    // 7. Watchlist Match Rate
    const watchlistStats = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM watchlist_entries WHERE is_active = 1) as active_targets,
        (SELECT COUNT(*) FROM alerts WHERE type LIKE '%Watchlist%') as total_hits,
        (SELECT COUNT(*) FROM vehicle_sightings) as total_scans
    `);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        fleet: cameraHealth,
        alerts_by_severity: alertsBySeverity,
        alerts_by_type: alertsByType,
        top_cameras: topCameras,
        sightings_trend: sightingsTrend,
        hourly_density: hourlyDensity,
        watchlist: watchlistStats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
