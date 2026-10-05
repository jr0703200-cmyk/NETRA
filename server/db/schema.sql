-- NETRA Relational Database Schema (SQLite / PostgreSQL compatible)
-- Engineered for Neural Eye for Threat Recognition and Analysis

PRAGMA foreign_keys = ON;

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'operator', 'auditor')) NOT NULL DEFAULT 'operator',
    department TEXT DEFAULT 'Surveillance Command',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- 2. CAMERAS
CREATE TABLE IF NOT EXISTS cameras (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT DEFAULT 'Traffic Enforcement',
    location_name TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    ip_address TEXT,
    port INTEGER DEFAULT 554,
    rtsp_url TEXT,
    http_url TEXT,
    camera_type TEXT DEFAULT 'PTZ-4K-ANPR',
    status TEXT CHECK(status IN ('ONLINE', 'OFFLINE', 'CONNECTING', 'DEGRADED', 'ERROR')) DEFAULT 'OFFLINE',
    fps REAL DEFAULT 0,
    resolution TEXT DEFAULT '1920x1080',
    latency_ms INTEGER DEFAULT 0,
    last_heartbeat DATETIME,
    stream_uptime_s INTEGER DEFAULT 0,
    ai_status TEXT CHECK(ai_status IN ('ACTIVE', 'OFFLINE', 'STANDBY')) DEFAULT 'STANDBY',
    error_message TEXT,
    is_demo INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. SECURE CAMERA CREDENTIALS (Never exposed to frontend)
CREATE TABLE IF NOT EXISTS camera_credentials (
    id TEXT PRIMARY KEY,
    camera_id TEXT UNIQUE NOT NULL,
    username TEXT,
    password_secret TEXT,
    onvif_port INTEGER DEFAULT 80,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(camera_id) REFERENCES cameras(id) ON DELETE CASCADE
);

-- 4. CAMERA STATUS AUDIT EVENTS
CREATE TABLE IF NOT EXISTS camera_status_events (
    id TEXT PRIMARY KEY,
    camera_id TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    reason TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(camera_id) REFERENCES cameras(id) ON DELETE CASCADE
);

-- 5. DETECTIONS
CREATE TABLE IF NOT EXISTS detections (
    id TEXT PRIMARY KEY,
    camera_id TEXT NOT NULL,
    detection_type TEXT NOT NULL, -- vehicle, plate, person, crowd, zone_breach
    confidence REAL NOT NULL,
    bbox_x REAL,
    bbox_y REAL,
    bbox_w REAL,
    bbox_h REAL,
    tracking_id TEXT,
    snapshot_url TEXT,
    plate_text TEXT,
    raw_metadata TEXT,
    is_demo INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(camera_id) REFERENCES cameras(id) ON DELETE CASCADE
);

-- 6. VEHICLES (Re-ID / Persistent tracks)
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    tracking_id TEXT UNIQUE,
    plate_number TEXT,
    make_model TEXT,
    color TEXT,
    first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_sightings INTEGER DEFAULT 1
);

-- 7. VEHICLE SIGHTINGS (Cross-camera journey checkpoints)
CREATE TABLE IF NOT EXISTS vehicle_sightings (
    id TEXT PRIMARY KEY,
    plate_number TEXT NOT NULL,
    tracking_id TEXT,
    camera_id TEXT NOT NULL,
    camera_name TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    confidence REAL NOT NULL,
    speed_kmh REAL DEFAULT 45.0,
    snapshot_url TEXT,
    is_demo INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(camera_id) REFERENCES cameras(id) ON DELETE CASCADE
);

-- 8. WATCHLIST ENTRIES
CREATE TABLE IF NOT EXISTS watchlist_entries (
    id TEXT PRIMARY KEY,
    target_type TEXT CHECK(target_type IN ('vehicle', 'person')) DEFAULT 'vehicle',
    plate_number TEXT,
    person_name TEXT,
    category TEXT NOT NULL, -- 'Stolen vehicle', 'Wanted vehicle', 'Flagged vehicle', 'High-Risk Suspect', 'VIP Escort'
    reason TEXT NOT NULL,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'high',
    added_by TEXT NOT NULL DEFAULT 'System Admin',
    expiry_date DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. ALERTS
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'Watchlist Hit: Stolen Vehicle', 'Restricted Zone Breach', 'Crowd Surge Anomaly', 'Loitering Anomaly', 'Speed Violation'
    severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) NOT NULL DEFAULT 'medium',
    camera_id TEXT NOT NULL,
    camera_location TEXT NOT NULL,
    plate TEXT,
    confidence REAL,
    description TEXT NOT NULL,
    source TEXT DEFAULT 'NETRA_AI_ENGINE',
    snapshot_url TEXT,
    acknowledged INTEGER DEFAULT 0,
    acknowledged_by TEXT,
    acknowledged_at DATETIME,
    operator_notes TEXT,
    is_demo INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(camera_id) REFERENCES cameras(id) ON DELETE CASCADE
);

-- 10. RESTRICTED ZONES (Polygon geofences on camera view)
CREATE TABLE IF NOT EXISTS restricted_zones (
    id TEXT PRIMARY KEY,
    camera_id TEXT NOT NULL,
    zone_name TEXT NOT NULL,
    polygon_points TEXT NOT NULL, -- JSON array of [{x, y}] normalized 0.0 - 1.0
    event_type TEXT DEFAULT 'Restricted Zone Intrusion',
    alert_severity TEXT DEFAULT 'high',
    active_hours TEXT DEFAULT '00:00-23:59',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(camera_id) REFERENCES cameras(id) ON DELETE CASCADE
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    username TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details TEXT,
    ip_address TEXT DEFAULT '127.0.0.1',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. SYSTEM CONFIGURATION & SETTINGS
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR HIGH-THROUGHPUT SEARCH & INTELLIGENCE QUERIES
CREATE INDEX IF NOT EXISTS idx_cameras_status ON cameras(status);
CREATE INDEX IF NOT EXISTS idx_detections_camera_time ON detections(camera_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_detections_plate ON detections(plate_text);
CREATE INDEX IF NOT EXISTS idx_sightings_plate ON vehicle_sightings(plate_number, timestamp);
CREATE INDEX IF NOT EXISTS idx_sightings_time ON vehicle_sightings(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_time ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_ack ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_watchlist_plate ON watchlist_entries(plate_number);
CREATE INDEX IF NOT EXISTS idx_zones_camera ON restricted_zones(camera_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(timestamp);
