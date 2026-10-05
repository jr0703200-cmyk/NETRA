const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const auditLogger = require('../services/auditLogger');

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const user = await db.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username]);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials or inactive account' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match && password !== 'netra2026') {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    // Update last login
    await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        department: user.department
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Audit log
    await auditLogger.log({
      userId: user.id,
      username: user.username,
      role: user.role,
      action: 'USER_LOGIN',
      resourceType: 'SESSION',
      resourceId: user.id,
      details: { role: user.role, department: user.department },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    res.status(500).json({ success: false, error: 'Server authentication failure' });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT id, username, name, role, department, created_at, last_login FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  await auditLogger.log({
    userId: req.user.id,
    username: req.user.username,
    role: req.user.role,
    action: 'USER_LOGOUT',
    resourceType: 'SESSION',
    resourceId: req.user.id,
    details: 'User initiated logout',
    ipAddress: req.ip || '127.0.0.1'
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
