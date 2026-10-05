const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'netra.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('[NETRA-DB] Error opening SQLite database:', err.message);
      } else {
        console.log('[NETRA-DB] Connected to SQLite database at:', DB_PATH);
      }
    });
  }
  return db;
}

// Promise wrappers
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    getDb().exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Database Initialization & Seeding
async function initializeDatabase() {
  try {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    await exec(schemaSql);
    console.log('[NETRA-DB] Schema executed successfully');

    // Seed default users if empty
    const userCount = await get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      const passwordHash = await bcrypt.hash('netra2026', 10);
      
      await run(`
        INSERT INTO users (id, username, password_hash, name, role, department)
        VALUES 
        ('USR-ADM-001', 'admin', ?, 'Chief Administrator', 'admin', 'Central Command'),
        ('USR-OPR-002', 'operator', ?, 'Surveillance Operator Desk 1', 'operator', 'Traffic Operations'),
        ('USR-AUD-003', 'auditor', ?, 'Vigilance & Oversight Officer', 'auditor', 'Internal Audit')
      `, [passwordHash, passwordHash, passwordHash]);
      
      console.log('[NETRA-DB] Default command center users seeded (admin, operator, auditor / pass: netra2026)');
    }

    // Seed default settings
    const settingsCount = await get('SELECT COUNT(*) as count FROM settings');
    if (settingsCount.count === 0) {
      const defaultSettings = [
        ['system_name', 'METROPOLITAN SURVEILLANCE & TRAFFIC INTELLIGENCE COMMAND'],
        ['organization', 'Central Surveillance Division'],
        ['demo_mode', 'true'],
        ['anpr_confidence_threshold', '85'],
        ['auto_face_blur', 'true'],
        ['data_retention_days', '90'],
        ['alert_audio_enabled', 'true'],
        ['ai_service_url', 'http://localhost:8001'],
        ['heartbeat_interval_s', '10']
      ];
      for (const [key, value] of defaultSettings) {
        await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
      }
      console.log('[NETRA-DB] Default system settings seeded');
    }

    // Seed default cameras if empty
    const cameraCount = await get('SELECT COUNT(*) as count FROM cameras');
    if (cameraCount.count === 0) {
      const sampleCameras = [
        {
          id: 'CAM-001',
          name: 'Central Plaza & Main Expressway Junction',
          department: 'Metropolitan Traffic Command',
          location_name: 'Central Junction Sector 1',
          lat: 23.0338,
          lng: 72.5850,
          ip_address: '192.168.1.101',
          port: 554,
          rtsp_url: 'rtsp://192.168.1.101:554/live/ch0',
          http_url: '/api/v1/cameras/CAM-001/stream',
          camera_type: 'PTZ-4K-ANPR',
          status: 'ONLINE',
          fps: 28.5,
          resolution: '3840x2160',
          latency_ms: 42,
          ai_status: 'ACTIVE',
          is_demo: 1
        },
        {
          id: 'CAM-002',
          name: 'Outer Ring Road Toll Expressway Exit 4',
          department: 'Highway Patrol Bureau',
          location_name: 'Ring Road Toll South',
          lat: 23.0722,
          lng: 72.5186,
          ip_address: '192.168.1.102',
          port: 554,
          rtsp_url: 'rtsp://192.168.1.102:554/live/ch0',
          http_url: '/api/v1/cameras/CAM-002/stream',
          camera_type: 'HIGH-SPEED-ANPR',
          status: 'ONLINE',
          fps: 30.0,
          resolution: '1920x1080',
          latency_ms: 38,
          ai_status: 'ACTIVE',
          is_demo: 1
        },
        {
          id: 'CAM-003',
          name: 'Commercial Boulevard & Metro Interchange',
          department: 'Smart City Surveillance',
          location_name: 'Commercial District Axis',
          lat: 23.0189,
          lng: 72.5592,
          ip_address: '192.168.1.103',
          port: 554,
          rtsp_url: 'rtsp://192.168.1.103:554/live/ch0',
          http_url: '/api/v1/cameras/CAM-003/stream',
          camera_type: 'PTZ-4K-ANPR',
          status: 'ONLINE',
          fps: 29.2,
          resolution: '3840x2160',
          latency_ms: 49,
          ai_status: 'ACTIVE',
          is_demo: 1
        },
        {
          id: 'CAM-004',
          name: 'VIP Perimeter & Government Enclave Gate 2',
          department: 'Special Security Operations',
          location_name: 'Government Avenue Gate 2',
          lat: 23.2185,
          lng: 72.6391,
          ip_address: '192.168.1.104',
          port: 554,
          rtsp_url: 'rtsp://192.168.1.104:554/live/ch0',
          http_url: '/api/v1/cameras/CAM-004/stream',
          camera_type: 'THERMAL-PTZ-ANPR',
          status: 'ONLINE',
          fps: 27.8,
          resolution: '1920x1080',
          latency_ms: 35,
          ai_status: 'ACTIVE',
          is_demo: 1
        },
        {
          id: 'CAM-005',
          name: 'Interstate Freight Transit Terminal West',
          department: 'Border & Transport Security',
          location_name: 'Freight Corridor Mile 12',
          lat: 22.9810,
          lng: 72.6105,
          ip_address: '192.168.1.105',
          port: 554,
          rtsp_url: 'rtsp://192.168.1.105:554/live/ch0',
          http_url: '/api/v1/cameras/CAM-005/stream',
          camera_type: 'FIXED-4K-ANPR',
          status: 'ONLINE',
          fps: 29.5,
          resolution: '1920x1080',
          latency_ms: 55,
          ai_status: 'ACTIVE',
          is_demo: 1
        },
        {
          id: 'CAM-006',
          name: 'Airport Approach Flyover & Slip Road',
          department: 'Metropolitan Traffic Command',
          location_name: 'Airport Bypass North',
          lat: 23.0789,
          lng: 72.6288,
          ip_address: '192.168.1.106',
          port: 554,
          rtsp_url: 'rtsp://192.168.1.106:554/live/ch0',
          http_url: '/api/v1/cameras/CAM-006/stream',
          camera_type: 'HIGH-SPEED-ANPR',
          status: 'ONLINE',
          fps: 30.0,
          resolution: '1920x1080',
          latency_ms: 41,
          ai_status: 'ACTIVE',
          is_demo: 1
        },
        {
          id: 'CAM-007',
          name: 'Old Town Heritage Market Square (Pedestrian)',
          department: 'Municipal Corporation',
          location_name: 'Heritage Market Plaza',
          lat: 23.0245,
          lng: 72.5922,
          ip_address: '192.168.1.107',
          port: 554,
          rtsp_url: 'rtsp://192.168.1.107:554/live/ch0',
          http_url: '/api/v1/cameras/CAM-007/stream',
          camera_type: 'DOME-360-CROWD',
          status: 'ONLINE',
          fps: 25.0,
          resolution: '1920x1080',
          latency_ms: 60,
          ai_status: 'ACTIVE',
          is_demo: 1
        },
        {
          id: 'CAM-008',
          name: 'Harbor Gateway & Industrial Freight Gate',
          department: 'Port & Industrial Security',
          location_name: 'Industrial Port Entry',
          lat: 21.1702,
          lng: 72.8311,
          ip_address: '192.168.1.108',
          port: 554,
          rtsp_url: 'rtsp://192.168.1.108:554/live/ch0',
          http_url: '/api/v1/cameras/CAM-008/stream',
          camera_type: 'FIXED-4K-ANPR',
          status: 'DEGRADED',
          fps: 14.2,
          resolution: '1280x720',
          latency_ms: 180,
          ai_status: 'ACTIVE',
          error_message: 'Bandwidth throttled on 4G cellular uplink',
          is_demo: 1
        }
      ];

      for (const cam of sampleCameras) {
        await run(`
          INSERT INTO cameras 
          (id, name, department, location_name, lat, lng, ip_address, port, rtsp_url, http_url, camera_type, status, fps, resolution, latency_ms, ai_status, error_message, is_demo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          cam.id, cam.name, cam.department, cam.location_name, cam.lat, cam.lng,
          cam.ip_address, cam.port, cam.rtsp_url, cam.http_url, cam.camera_type,
          cam.status, cam.fps, cam.resolution, cam.latency_ms, cam.ai_status,
          cam.error_message || null, cam.is_demo
        ]);

        // Secure credential entry
        await run(`
          INSERT INTO camera_credentials (id, camera_id, username, password_secret, onvif_port)
          VALUES (?, ?, 'admin', 'SECURE_VAULT_ENCRYPTED_KEY_9921', 80)
        `, [`CRED-${cam.id}`, cam.id]);
      }
      console.log(`[NETRA-DB] ${sampleCameras.length} production-grade sample cameras initialized`);
    }

    // Seed Watchlist entries
    const watchlistCount = await get('SELECT COUNT(*) as count FROM watchlist_entries');
    if (watchlistCount.count === 0) {
      const sampleWatchlist = [
        {
          id: 'WL-2026-001',
          target_type: 'vehicle',
          plate_number: 'GJ-01-AB-1234',
          category: 'Stolen vehicle',
          reason: 'Stolen White Hyundai Creta reported in armed robbery case FIR #304/2026',
          severity: 'critical',
          added_by: 'Inspector V. Sharma (Crime Branch)',
          expiry_date: '2026-12-31'
        },
        {
          id: 'WL-2026-002',
          target_type: 'vehicle',
          plate_number: 'GJ-01-HW-8821',
          category: 'Wanted vehicle',
          reason: 'Flagged vehicle associated with interstate contraband smuggling ring',
          severity: 'critical',
          added_by: 'Special Operations Group',
          expiry_date: '2026-11-15'
        },
        {
          id: 'WL-2026-003',
          target_type: 'vehicle',
          plate_number: 'GJ-05-XY-9988',
          category: 'Flagged vehicle',
          reason: 'Hit-and-run fatal collision suspect vehicle on South Ring Road',
          severity: 'high',
          added_by: 'Traffic Investigation Bureau',
          expiry_date: '2026-10-30'
        },
        {
          id: 'WL-2026-004',
          target_type: 'vehicle',
          plate_number: 'DL-03-CC-4455',
          category: 'Surveillance target',
          reason: 'Non-resident vehicle flagged by National Crime Records Bureau advisory',
          severity: 'medium',
          added_by: 'Central Intelligence Cell',
          expiry_date: '2026-12-01'
        }
      ];

      for (const item of sampleWatchlist) {
        await run(`
          INSERT INTO watchlist_entries 
          (id, target_type, plate_number, category, reason, severity, added_by, expiry_date, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [item.id, item.target_type, item.plate_number, item.category, item.reason, item.severity, item.added_by, item.expiry_date]);
      }
      console.log(`[NETRA-DB] Watchlist registry seeded with ${sampleWatchlist.length} target vehicles`);
    }

    // Seed Cross-Camera Vehicle Sightings for Journey Reconstruction
    const sightingsCount = await get('SELECT COUNT(*) as count FROM vehicle_sightings');
    if (sightingsCount.count === 0) {
      const journeySightings = [
        {
          id: 'SGT-01',
          plate_number: 'GJ-01-AB-1234',
          tracking_id: 'TRK-2026-9041',
          camera_id: 'CAM-001',
          camera_name: 'Central Plaza & Main Expressway Junction',
          lat: 23.0338,
          lng: 72.5850,
          confidence: 0.984,
          speed_kmh: 52.4,
          timestamp: new Date(Date.now() - 42 * 60000).toISOString(),
          snapshot_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
          is_demo: 1
        },
        {
          id: 'SGT-02',
          plate_number: 'GJ-01-AB-1234',
          tracking_id: 'TRK-2026-9041',
          camera_id: 'CAM-003',
          camera_name: 'Commercial Boulevard & Metro Interchange',
          lat: 23.0189,
          lng: 72.5592,
          confidence: 0.991,
          speed_kmh: 46.8,
          timestamp: new Date(Date.now() - 31 * 60000).toISOString(),
          snapshot_url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=600&q=80',
          is_demo: 1
        },
        {
          id: 'SGT-03',
          plate_number: 'GJ-01-AB-1234',
          tracking_id: 'TRK-2026-9041',
          camera_id: 'CAM-002',
          camera_name: 'Outer Ring Road Toll Expressway Exit 4',
          lat: 23.0722,
          lng: 72.5186,
          confidence: 0.978,
          speed_kmh: 74.2,
          timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
          snapshot_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
          is_demo: 1
        },
        {
          id: 'SGT-04',
          plate_number: 'GJ-01-AB-1234',
          tracking_id: 'TRK-2026-9041',
          camera_id: 'CAM-004',
          camera_name: 'VIP Perimeter & Government Enclave Gate 2',
          lat: 23.2185,
          lng: 72.6391,
          confidence: 0.995,
          speed_kmh: 38.0,
          timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
          snapshot_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
          is_demo: 1
        }
      ];

      for (const s of journeySightings) {
        await run(`
          INSERT INTO vehicle_sightings 
          (id, plate_number, tracking_id, camera_id, camera_name, lat, lng, confidence, speed_kmh, timestamp, snapshot_url, is_demo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [s.id, s.plate_number, s.tracking_id, s.camera_id, s.camera_name, s.lat, s.lng, s.confidence, s.speed_kmh, s.timestamp, s.snapshot_url, s.is_demo]);
      }
      console.log(`[NETRA-DB] Sighted cross-camera vehicle trajectory initialized (4 checkpoints)`);
    }

    // Seed Initial Alerts
    const alertsCount = await get('SELECT COUNT(*) as count FROM alerts');
    if (alertsCount.count === 0) {
      const sampleAlerts = [
        {
          id: 'ALT-1001',
          type: 'Watchlist Hit: Stolen Vehicle',
          severity: 'critical',
          camera_id: 'CAM-004',
          camera_location: 'VIP Perimeter & Government Enclave Gate 2',
          plate: 'GJ-01-AB-1234',
          confidence: 0.995,
          description: 'CRITICAL: Stolen White Hyundai Creta detected breaching VIP Government Enclave perimeter. Intercept squad dispatched.',
          source: 'NETRA_WATCHLIST_ENGINE',
          snapshot_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
          acknowledged: 0,
          is_demo: 1,
          timestamp: new Date(Date.now() - 4 * 60000).toISOString()
        },
        {
          id: 'ALT-1002',
          type: 'Restricted Zone Breach',
          severity: 'high',
          camera_id: 'CAM-005',
          camera_location: 'Interstate Freight Transit Terminal West',
          plate: null,
          confidence: 0.942,
          description: 'Restricted high-security loading dock perimeter breached by unauthorized individual after hours.',
          source: 'NETRA_ZONE_AI',
          snapshot_url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=600&q=80',
          acknowledged: 0,
          is_demo: 1,
          timestamp: new Date(Date.now() - 15 * 60000).toISOString()
        },
        {
          id: 'ALT-1003',
          type: 'Speed Violation',
          severity: 'medium',
          camera_id: 'CAM-002',
          camera_location: 'Outer Ring Road Toll Expressway Exit 4',
          plate: 'GJ-01-HW-8821',
          confidence: 0.978,
          description: 'Flagged vehicle clocked at 138 km/h in an 80 km/h deceleration expressway lane.',
          source: 'NETRA_RADAR_ANPR',
          snapshot_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
          acknowledged: 1,
          acknowledged_by: 'Senior Operator Desk 1',
          acknowledged_at: new Date(Date.now() - 10 * 60000).toISOString(),
          operator_notes: 'Challan issued and intercept patrol alerted at Toll Plaza Gate 3.',
          is_demo: 1,
          timestamp: new Date(Date.now() - 25 * 60000).toISOString()
        },
        {
          id: 'ALT-1004',
          type: 'Crowd Surge Anomaly',
          severity: 'medium',
          camera_id: 'CAM-007',
          camera_location: 'Old Town Heritage Market Square (Pedestrian)',
          plate: null,
          confidence: 0.915,
          description: 'Anomalous person concentration (>35 persons/100m²) detected near north gate.',
          source: 'NETRA_CROWD_AI',
          snapshot_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
          acknowledged: 0,
          is_demo: 1,
          timestamp: new Date(Date.now() - 35 * 60000).toISOString()
        }
      ];

      for (const a of sampleAlerts) {
        await run(`
          INSERT INTO alerts 
          (id, type, severity, camera_id, camera_location, plate, confidence, description, source, snapshot_url, acknowledged, acknowledged_by, acknowledged_at, operator_notes, is_demo, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          a.id, a.type, a.severity, a.camera_id, a.camera_location, a.plate,
          a.confidence, a.description, a.source, a.snapshot_url,
          a.acknowledged, a.acknowledged_by || null, a.acknowledged_at || null,
          a.operator_notes || null, a.is_demo, a.timestamp
        ]);
      }
      console.log(`[NETRA-DB] Operational alerts initialized (${sampleAlerts.length} entries)`);
    }

    // Seed Restricted Zones
    const zonesCount = await get('SELECT COUNT(*) as count FROM restricted_zones');
    if (zonesCount.count === 0) {
      const sampleZones = [
        {
          id: 'ZONE-001',
          camera_id: 'CAM-004',
          zone_name: 'VIP Enclave Inner Security Perimeter',
          polygon_points: JSON.stringify([
            { x: 0.15, y: 0.20 },
            { x: 0.85, y: 0.20 },
            { x: 0.90, y: 0.75 },
            { x: 0.10, y: 0.75 }
          ]),
          event_type: 'Restricted Zone Intrusion',
          alert_severity: 'critical',
          active_hours: '00:00-23:59'
        },
        {
          id: 'ZONE-002',
          camera_id: 'CAM-005',
          zone_name: 'Freight Dock Restricted Cargo Area',
          polygon_points: JSON.stringify([
            { x: 0.30, y: 0.40 },
            { x: 0.70, y: 0.40 },
            { x: 0.75, y: 0.90 },
            { x: 0.25, y: 0.90 }
          ]),
          event_type: 'Loitering & Intrusion Zone',
          alert_severity: 'high',
          active_hours: '20:00-06:00'
        }
      ];

      for (const z of sampleZones) {
        await run(`
          INSERT INTO restricted_zones (id, camera_id, zone_name, polygon_points, event_type, alert_severity, active_hours, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `, [z.id, z.camera_id, z.zone_name, z.polygon_points, z.event_type, z.alert_severity, z.active_hours]);
      }
      console.log(`[NETRA-DB] ${sampleZones.length} restricted polygon zones initialized`);
    }

  } catch (err) {
    console.error('[NETRA-DB] Initialization failed:', err);
  }
}

module.exports = {
  getDb,
  run,
  get,
  all,
  exec,
  initializeDatabase
};
