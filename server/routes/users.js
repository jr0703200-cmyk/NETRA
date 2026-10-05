const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const auditLogger = require('../services/auditLogger');

// GET /api/v1/users
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const users = await db.all('SELECT id, username, name, role, department, is_active, created_at, last_login FROM users ORDER BY created_at DESC');
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/users
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { username, password, name, role, department } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ success: false, error: 'Username, password, and name are required' });
    }

    const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }

    const id = `USR-${Date.now().toString().slice(-6)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    await db.run(`
      INSERT INTO users (id, username, password_hash, name, role, department)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, username, passwordHash, name, role || 'operator', department || 'Surveillance Command']);

    await auditLogger.log({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      action: 'USER_CREATED',
      resourceType: 'USER',
      resourceId: id,
      details: { username, role, name },
      ipAddress: req.ip
    });

    const user = await db.get('SELECT id, username, name, role, department, is_active, created_at FROM users WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/users/:id
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete own account' });
    }

    const existing = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);

    await auditLogger.log({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      action: 'USER_DELETED',
      resourceType: 'USER',
      resourceId: id,
      details: { username: existing.username },
      ipAddress: req.ip
    });

    res.json({ success: true, message: `User ${existing.username} deleted` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
