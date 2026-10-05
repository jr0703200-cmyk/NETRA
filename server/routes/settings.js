const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const auditLogger = require('../services/auditLogger');

// GET /api/v1/settings
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT key, value, updated_at FROM settings');
    const settingsMap = {};
    rows.forEach(r => {
      settingsMap[r.key] = r.value;
    });

    res.json({ success: true, data: settingsMap });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/v1/settings
router.put('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await db.run('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [
        key,
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      ]);
    }

    await auditLogger.log({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      action: 'SETTINGS_UPDATED',
      resourceType: 'SYSTEM_SETTINGS',
      details: updates,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
