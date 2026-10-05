const db = require('../db');

/**
 * NETRA Real-Time Alert Engine
 * Correlates detections with active watchlists, restricted zones, and anomaly patterns.
 */

class AlertEngine {
  constructor() {
    this.io = null;
    this.recentAlertCooldown = new Map(); // Plate + Type -> Timestamp
  }

  setSocketIO(ioInstance) {
    this.io = ioInstance;
  }

  /**
   * Evaluate a detected license plate against the active watchlist
   */
  async checkPlateAgainstWatchlist(plateDetection, camera, isDemo = 0) {
    if (!plateDetection || !plateDetection.plate_number) return null;

    const normalizedPlate = plateDetection.plate_number.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const formattedPlate = plateDetection.plate_number.trim().toUpperCase();

    // Query active watchlist for match
    const match = await db.get(`
      SELECT * FROM watchlist_entries 
      WHERE (REPLACE(REPLACE(plate_number, '-', ''), ' ', '') = ? OR plate_number = ?)
      AND is_active = 1
    `, [normalizedPlate, formattedPlate]);

    if (!match) return null;

    // Cooldown check to prevent flooding alerts for the same camera/plate within 60 seconds
    const cooldownKey = `${camera.id}_${normalizedPlate}_${match.category}`;
    const now = Date.now();
    const lastAlertTime = this.recentAlertCooldown.get(cooldownKey) || 0;
    if (now - lastAlertTime < 60000) {
      return null;
    }
    this.recentAlertCooldown.set(cooldownKey, now);

    // Create persistent alert
    const alertId = `ALT-${Date.now().toString().slice(-6)}`;
    const alertObj = {
      id: alertId,
      type: `Watchlist Hit: ${match.category}`,
      severity: match.severity || 'critical',
      camera_id: camera.id,
      camera_location: camera.location_name || camera.name,
      plate: match.plate_number,
      confidence: plateDetection.confidence || 0.95,
      description: `AUTOMATED WATCHLIST HIT: Vehicle ${match.plate_number} identified. Category: ${match.category}. Reason: ${match.reason}`,
      source: 'NETRA_WATCHLIST_ENGINE',
      snapshot_url: plateDetection.snapshot_url || '/api/v1/cameras/' + camera.id + '/snapshot',
      acknowledged: 0,
      is_demo: isDemo,
      timestamp: new Date().toISOString()
    };

    await db.run(`
      INSERT INTO alerts 
      (id, type, severity, camera_id, camera_location, plate, confidence, description, source, snapshot_url, acknowledged, is_demo, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      alertObj.id, alertObj.type, alertObj.severity, alertObj.camera_id,
      alertObj.camera_location, alertObj.plate, alertObj.confidence,
      alertObj.description, alertObj.source, alertObj.snapshot_url,
      alertObj.acknowledged, alertObj.is_demo, alertObj.timestamp
    ]);

    // Record cross-camera sighting for trajectory tracking
    const sightingId = `SGT-${Date.now().toString().slice(-6)}`;
    await db.run(`
      INSERT INTO vehicle_sightings 
      (id, plate_number, camera_id, camera_name, lat, lng, confidence, speed_kmh, snapshot_url, is_demo, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sightingId, alertObj.plate, camera.id, camera.name,
      camera.lat || 23.0225, camera.lng || 72.5714,
      alertObj.confidence, 48.0, alertObj.snapshot_url,
      alertObj.is_demo, alertObj.timestamp
    ]);

    // Broadcast real-time alert through WebSockets
    if (this.io) {
      this.io.emit('netra_alert', alertObj);
      this.io.emit('netra_vehicle_spot', {
        sighting_id: sightingId,
        plate_number: alertObj.plate,
        camera_id: camera.id,
        camera_name: camera.name,
        lat: camera.lat,
        lng: camera.lng,
        timestamp: alertObj.timestamp
      });
    }

    return alertObj;
  }

  /**
   * Generate an alert directly (e.g. Zone breach, manual dispatch, test alert)
   */
  async createCustomAlert(alertData) {
    const alertId = `ALT-${Date.now().toString().slice(-6)}`;
    const alertObj = {
      id: alertId,
      type: alertData.type || 'Security Alert',
      severity: alertData.severity || 'high',
      camera_id: alertData.camera_id || 'CAM-001',
      camera_location: alertData.camera_location || 'Tactical Sector',
      plate: alertData.plate || null,
      confidence: alertData.confidence || 0.92,
      description: alertData.description || 'Security notification from NETRA Engine',
      source: alertData.source || 'NETRA_OPERATOR',
      snapshot_url: alertData.snapshot_url || '/api/v1/cameras/' + (alertData.camera_id || 'CAM-001') + '/snapshot',
      acknowledged: 0,
      is_demo: alertData.is_demo || 0,
      timestamp: new Date().toISOString()
    };

    await db.run(`
      INSERT INTO alerts 
      (id, type, severity, camera_id, camera_location, plate, confidence, description, source, snapshot_url, acknowledged, is_demo, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      alertObj.id, alertObj.type, alertObj.severity, alertObj.camera_id,
      alertObj.camera_location, alertObj.plate, alertObj.confidence,
      alertObj.description, alertObj.source, alertObj.snapshot_url,
      alertObj.acknowledged, alertObj.is_demo, alertObj.timestamp
    ]);

    if (this.io) {
      this.io.emit('netra_alert', alertObj);
    }

    return alertObj;
  }
}

module.exports = new AlertEngine();
