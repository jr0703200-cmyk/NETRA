# NETRA — Neural Eye for Threat Recognition and Analysis
### Full-Stack AI Surveillance, ANPR, Cross-Camera Trajectory Tracking & Situational Awareness Command Platform

```
                      .---.
                   .-'     '-.
                 .'  .-"""-.  '.
                /   /  ___  \   \
               |   |  /   \  |   |
               |   | (  O  ) |   |   <<< NETRA NEURAL EYE >>>
               |   |  \___/  |   |
                \   \       /   /
                 '.  '-...-'  .'
                   '-.     .-'
                      '---'
```

> **SEE → IDENTIFY → CONNECT → UNDERSTAND → ALERT → INVESTIGATE**

NETRA is an enterprise surveillance and situational-awareness platform that connects to existing IP/Wi-Fi camera infrastructure, processes video feeds using computer vision and ANPR, detects relevant security events, recognizes vehicle license plates, correlates vehicle sightings across multiple cameras into unified journey trajectories, checks real-time watchlists, broadcasts instant operator alerts, and provides operators with a unified intelligence dashboard.

---

## 🎨 Visual Aesthetics: Graphite & Ivory Command-Center Theme

NETRA is built with the **Graphite & Ivory** design system:
- **Background**: Near-black graphite (`#08090C`)
- **Panels**: Deep graphite (`#17181C`)
- **Glass Surfaces**: Multi-layered translucent charcoal with backdrop blur (`rgba(255,255,255,0.05)`)
- **Text**: Off-white high contrast (`#F2EFE8`)
- **Primary Accent**: Warm Ivory (`#DED8CC`)
- **Secondary Technical Accents**: Mint (`#3DDC97`), Cyan-Teal (`#5CE1E6`), Slate (`#64748B`)
- **Alert Tiers**: Critical (`#FF4D5F`), High (`#FF8A4C`), Medium (`#F5C451`), Success (`#3DDC97`)

---

## 🏛️ System Architecture

```
[ IP / Wi-Fi CAMERA NETWORK ] (RTSP / HTTP / ONVIF)
                │
                ▼
[ NETRA CAMERA INGESTION GATEWAY ] (Port 3001)
   ├── Real TCP Socket & RTSP Handshake Connection Probe
   ├── Credential Vault & Sanitizer
   └── Browser-Compatible Stream Transcoder / Proxy
                │
                ├──► [ NETRA REAL-TIME TELEMETRY BUS ] (Socket.IO)
                │       ├── netra_alert
                │       ├── netra_cam_status
                │       ├── netra_vehicle_spot
                │       └── netra_system_stats
                │
                ├──► [ RELATIONAL PERSISTENCE ] (SQLite / PostgreSQL)
                │       ├── cameras & credentials
                │       ├── detections & sightings
                │       ├── alerts & watchlist_entries
                │       ├── restricted_zones & audit_logs
                │       └── users & system_settings
                │
                └──► [ PYTHON/FASTAPI NEURAL ENGINE ] (Port 8001)
                        ├── YOLOv8 Vehicle & Plate Localization
                        ├── Indian License Plate Normalization & OCR
                        ├── DeepSORT Cross-Camera Persistent Tracking
                        └── Ray-Casting Polygon Geofence Breach Detector
                                │
                                ▼
        [ NETRA OPERATOR COMMAND CENTER ] (React 18 / Vite / Port 3000)
```

---

## 🚀 Quick Start (Running Locally)

### 1. Launch Backend API Gateway
```bash
cd server
npm install
node index.js
# Backend listening on http://localhost:3001
```

### 2. Launch React Command Dashboard
```bash
cd client
npm install
npm run dev
# Frontend live at http://localhost:3000
```

### 3. Launch Python AI Processing Engine (Optional)
```bash
cd ai_service
pip install -r requirements.txt
python main.py
# AI service live on http://localhost:8001
```

*Note: If the AI backend is not running, NETRA adheres to the **DO NOT FAKE AI** rule. It honestly displays `AI PROCESSING OFFLINE` and provides a safe simulation in `DEMO MODE` without fabricating fake detections as real data.*

---

## 🛡️ Default Credentials & Roles

| Role | Username | Password | Authority |
|---|---|---|---|
| **Chief Administrator** | `admin` | `netra2026` | Full command authority, add/remove cameras, watchlist management, zone geofencing, system configuration |
| **Surveillance Operator** | `operator` | `netra2026` | Real-time monitoring, alert acknowledgment, vehicle tracking, forensic search |
| **Vigilance Auditor** | `auditor` | `netra2026` | Read-only access to camera telemetry, alerts, and tamper-evident audit logs |

---

## 📹 Core Modules in NETRA

1. **Live Monitor (`COMMAND`)**:
   - 1x1, 2x2, 3x3, and 4x4 matrix layouts.
   - Real-time video feeds with tactical HUD overlay (FPS, latency, AI badge, timestamp).
   - Neural bounding boxes and Indian license plate tags (e.g. `GJ-01-AB-1234` 98.4%).
   - Honest `AI PROCESSING OFFLINE` indicator when AI is disconnected.
   - Audible synthesizer chimes on critical alerts.

2. **Alert Center (`INTELLIGENCE`)**:
   - Real-time threat queue with severity badges (Critical, High, Medium, Low).
   - Multi-filtering by camera, date/time, type, plate, and acknowledgement status.
   - Single & bulk acknowledgement with operator notes.
   - Forensic investigation dossier view with snapshots and related events.
   - One-click CSV export.

3. **Vehicle Tracker (`INTELLIGENCE`)**:
   - Input license plate to reconstruct multi-camera vehicle trajectory.
   - Interactive Leaflet GIS map with numbered sequence nodes: `1 → 2 → 3 → 4`.
   - Animated route polyline connecting camera checkpoints.
   - Chronological timeline showing transit duration, speed estimate, and forensic snapshots.

4. **Intelligence Search (`INTELLIGENCE`)**:
   - Deep search across detections and alerts by full/partial plate wildcard, camera node, geofence location, tracking ID, severity, and date range.
   - Direct jump to "Track Vehicle" or "Add to Watchlist".

5. **Watchlist Manager (`INTELLIGENCE`)**:
   - Registry for vehicles and persons.
   - Categories: Stolen vehicle, Wanted vehicle, Flagged vehicle, Surveillance target, VIP Escort.
   - Automatic real-time alert trigger when a camera detection matches an active entry.

6. **Camera Network (`INFRASTRUCTURE`)**:
   - **Table View**: Live fleet status, FPS, resolution, latency, AI status.
   - **Map View**: Geospatial placement of all cameras with status pins.
   - **Add Camera Modal**: Includes **real TCP connection test** validating RTSP/HTTP handshakes before saving. Sensitive credentials sanitized from frontend.

7. **Camera Lab (`INFRASTRUCTURE`)**:
   - Dedicated engineering testbed to test RTSP URLs and HTTP streams.
   - Live stream preview with latency ping, FPS counter, and resolution detection.
   - Instant forensic snapshot capture.
   - Subnet ONVIF camera discovery.
   - Real-time connection log terminal.

8. **Restricted Zones Editor (`INFRASTRUCTURE`)**:
   - Interactive polygon drawing directly on camera streams.
   - Configurable event type (Intrusion, Loitering, Crowd Surge), severity, and active hours.
   - Stored in database and synchronized with the AI service.

9. **Analytics (`ANALYTICS`)**:
   - Real database-driven charts: Sightings trend over time, peak hourly traffic density, security incidents by classification, top active cameras, fleet uptime.

10. **System Health (`INFRASTRUCTURE`)**:
    - Live health matrix for Camera Ingestion, AI Neural Engine, API Gateway, Relational Database, WebSocket Bus, Cache Store, and Forensic Storage Vault.

11. **Admin Tools (`ADMIN`)**:
    - User management & RBAC.
    - System settings, AI confidence thresholds, data retention days, face blurring toggle, demo mode switch.
    - Cryptographic tamper-evident audit logs.
