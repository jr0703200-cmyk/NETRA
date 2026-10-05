const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/v1/audit-logs
router.get('/', authenticateToken, requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    const { action, username, resource_type, page = 1, limit = 50 } = req.query;
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }
    if (username) {
      query += ' AND username LIKE ?';
      params.push(`%${username}%`);
    }
    if (resource_type) {
      query += ' AND resource_type = ?';
      params.push(resource_type);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    params.push(parseInt(limit, 10), offset);

    const logs = await db.all(query, params);
    const totalCount = await db.get('SELECT COUNT(*) as count FROM audit_logs');

    res.json({
      success: true,
      total: totalCount.count,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
