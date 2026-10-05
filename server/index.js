/**
 * NETRA — Neural Eye for Threat Recognition and Analysis
 * Core API Gateway, Camera Ingestion Engine & Real-Time Telemetry Bus
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const db = require('./db');
const cameraIngestion = require('./services/cameraIngestion');
const aiBridge = require('./services/aiBridge');
const alertEngine = require('./services/alertEngine');
const auditLogger = require('./services/auditLogger');

// Import Route Handlers
const authRoutes = require('./routes/auth');
const camerasRoutes = require('./routes/cameras');
const alertsRoutes = require('./routes/alerts');
const watchlistRoutes = require('./routes/watchlist');
const trackingRoutes = require('./routes/tracking');
const searchRoutes = require('./routes/search');
const zonesRoutes = require('./routes/zones');
const analyticsRoutes = require('./routes/analytics');
const healthRoutes = require('./routes/health');
const settingsRoutes = require('./routes/settings');
const auditLogsRoutes = require('./routes/auditLogs');
const usersRoutes = require('./routes/users');

const PORT = process.env.PORT || 3001;

const app = express();
const server = http.createServer(app);

// Socket.IO configuration with cross-origin support
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

// Pass Socket.IO instance to background services
cameraIngestion.setSocketIO(io);
alertEngine.setSocketIO(io);
auditLogger.setSocketIO(io);

// Core Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  if (!req.originalUrl.includes('/stream')) {
    console.log(`[NETRA-GATEWAY] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Mount Versioned API Routes (/api/v1/...)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/cameras', camerasRoutes);
app.use('/api/v1/alerts', alertsRoutes);
app.use('/api/v1/watchlist', watchlistRoutes);
app.use('/api/v1/tracking', trackingRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/zones', zonesRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/audit-logs', auditLogsRoutes);
app.use('/api/v1/users', usersRoutes);

// Backwards-compatibility aliases for legacy routes
app.use('/api/cameras', camerasRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/auth', authRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({
    platform: 'NETRA — Neural Eye for Threat Recognition and Analysis',
    version: '2.4-TACTICAL',
    status: 'OPERATIONAL',
    api_documentation: '/api/v1/health',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log(`[NETRA-SOCKET] Operator terminal connected: ${socket.id}`);

  socket.emit('netra_connected', {
    status: 'CONNECTED',
    session_id: socket.id,
    timestamp: new Date().toISOString()
  });

  socket.on('disconnect', () => {
    console.log(`[NETRA-SOCKET] Operator terminal disconnected: ${socket.id}`);
  });

  // Client requests test alert injection
  socket.on('request_demo_alert', async (data) => {
    try {
      const alert = await alertEngine.createCustomAlert({
        type: data.type || 'Watchlist Hit: Stolen Vehicle',
        severity: data.severity || 'critical',
        camera_id: data.camera_id || 'CAM-001',
        camera_location: 'Central Plaza & Main Expressway Junction',
        plate: data.plate || 'GJ-01-AB-1234',
        confidence: 0.992,
        description: data.description || 'Simulated surveillance threat trigger',
        is_demo: 1
      });
      socket.emit('demo_alert_created', alert);
    } catch (err) {
      socket.emit('demo_alert_error', { error: err.message });
    }
  });
});

// Startup Sequence
async function startServer() {
  try {
    // 1. Initialize SQLite schema & seed data
    await db.initializeDatabase();

    // 2. Start Camera fleet monitoring
    cameraIngestion.startMonitoring();

    // 3. Start AI Service health monitoring
    aiBridge.startPeriodicHealthCheck(io);

    // 4. Start HTTP & Socket server
    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  NETRA COMMAND & SURVEILLANCE GATEWAY ONLINE`);
      console.log(`  Port: ${PORT} | Architecture: Production Relational`);
      console.log(`  REST API: http://localhost:${PORT}/api/v1/health`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[NETRA-GATEWAY] Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();
