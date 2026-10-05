const axios = require('axios');
const db = require('../db');

/**
 * NETRA AI Service Bridge
 * Coordinates between Node.js API Gateway and Python/FastAPI Computer Vision engine.
 * Adheres strictly to the "DO NOT FAKE AI" principle:
 * - If AI Service is reachable, streams real inference.
 * - If AI Service is offline, explicitly marks status as OFFLINE.
 * - If Demo Mode is enabled, explicitly flags all generated events as 'DEMO MODE'.
 */

class AIServiceBridge {
  constructor() {
    this.aiBaseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';
    this.isAiOnline = false;
    this.lastHealthCheck = null;
    this.healthCheckTimer = null;
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.aiBaseUrl}/health`, { timeout: 1500 });
      if (response.data && (response.data.status === 'operational' || response.data.status === 'ok')) {
        this.isAiOnline = true;
        this.lastHealthCheck = response.data;
        return { online: true, data: response.data };
      }
      this.isAiOnline = false;
      return { online: false, error: 'Unhealthy response' };
    } catch (err) {
      this.isAiOnline = false;
      return { online: false, error: 'AI Processing Service Offline (Connection refused on ' + this.aiBaseUrl + ')' };
    }
  }

  startPeriodicHealthCheck(io) {
    if (this.healthCheckTimer) return;

    const runCheck = async () => {
      const previousState = this.isAiOnline;
      const result = await this.checkHealth();
      
      if (previousState !== result.online && io) {
        io.emit('netra_ai_status', {
          ai_online: result.online,
          status_text: result.online ? 'OPERATIONAL' : 'AI PROCESSING OFFLINE',
          timestamp: new Date().toISOString()
        });
      }
    };

    runCheck();
    this.healthCheckTimer = setInterval(runCheck, 8000);
  }

  /**
   * Process Frame with AI Service
   */
  async processFrame(framePayload) {
    // 1. If real AI service is online, forward directly
    if (this.isAiOnline) {
      try {
        const response = await axios.post(`${this.aiBaseUrl}/process-frame`, framePayload, {
          timeout: 4000
        });
        return {
          ai_status: 'ACTIVE',
          is_demo: 0,
          ...response.data
        };
      } catch (err) {
        console.warn('[NETRA-AI-BRIDGE] Error during AI inference call:', err.message);
      }
    }

    // 2. Check if Demo Mode is explicitly enabled in system settings
    const demoSetting = await db.get("SELECT value FROM settings WHERE key = 'demo_mode'");
    const isDemoEnabled = demoSetting && demoSetting.value === 'true';

    if (isDemoEnabled) {
      // Return controlled demo simulation with explicit is_demo flag
      return this.generateControlledDemoInference(framePayload.camera_id || 'CAM-001');
    }

    // 3. Honest Offline State (No fake detections!)
    return {
      ai_status: 'OFFLINE',
      is_demo: 0,
      camera_id: framePayload.camera_id,
      timestamp: new Date().toISOString(),
      detections: [],
      plates: [],
      events: [],
      message: 'AI Processing Service Offline - No detections available'
    };
  }

  /**
   * Controlled Demo Inference generator
   * Explicitly labeled as DEMO MODE
   */
  generateControlledDemoInference(cameraId) {
    const demoPlates = [
      { plate: 'GJ-01-AB-1234', conf: 0.984, vehicle: 'White SUV', box: { x: 0.28, y: 0.42, w: 0.32, h: 0.28 } },
      { plate: 'GJ-01-HW-8821', conf: 0.972, vehicle: 'Black Sedan', box: { x: 0.54, y: 0.38, w: 0.28, h: 0.24 } },
      { plate: 'GJ-05-XY-9988', conf: 0.965, vehicle: 'Silver Hatchback', box: { x: 0.15, y: 0.50, w: 0.30, h: 0.26 } }
    ];

    const selected = demoPlates[Math.floor(Math.random() * demoPlates.length)];

    return {
      ai_status: 'ACTIVE',
      is_demo: 1,
      mode: 'DEMO MODE',
      camera_id: cameraId,
      timestamp: new Date().toISOString(),
      detections: [
        {
          id: `DET-${Date.now()}-1`,
          type: 'vehicle',
          label: selected.vehicle,
          confidence: selected.conf,
          bbox: selected.box,
          tracking_id: 'TRK-DEMO-901'
        },
        {
          id: `DET-${Date.now()}-2`,
          type: 'license_plate',
          label: selected.plate,
          confidence: selected.conf,
          bbox: { x: selected.box.x + 0.08, y: selected.box.y + 0.18, w: 0.14, h: 0.06 }
        }
      ],
      plates: [
        {
          plate_number: selected.plate,
          confidence: selected.conf,
          vehicle_class: selected.vehicle,
          timestamp: new Date().toISOString()
        }
      ],
      events: []
    };
  }
}

module.exports = new AIServiceBridge();
