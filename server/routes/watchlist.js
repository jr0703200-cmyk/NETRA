const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const auditLogger = require('../services/auditLogger');

// GET /api/v1/watchlist
router.get('/', async (req, res) => {
  try {
    const { category, severity, is_active, search } = req.query;
    let query = 'SELECT * FROM watchlist_entries WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }
    if (is_active !== undefined && is_active !== '') {
      query += ' AND is_active = ?';
      params.push(parseInt(is_active, 10));
    }
    if (search) {
      query += ' AND (plate_number LIKE ? OR person_name LIKE ? OR reason LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const entries = await db.all(query, params);
    res.json({ success: true, count: entries.length, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/watchlist
router.post('/', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
  try {
    const { target_type, plate_number, person_name, category, reason, severity, expiry_date } = req.body;

    if (!category || !reason) {
      return res.status(400).json({ success: false, error: 'Category and Reason are required' });
    }

    if (target_type === 'vehicle' && !plate_number) {
      return res.status(400).json({ success: false, error: 'Plate number is required for vehicle watchlist' });
    }

    const id = `WL-${Date.now().toString().slice(-6)}`;
    const addedBy = req.user.name || req.user.username;

    await db.run(`
      INSERT INTO watchlist_entries 
      (id, target_type, plate_number, person_name, category, reason, severity, added_by, expiry_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      id,
      target_type || 'vehicle',
      plate_number ? plate_number.trim().toUpperCase() : null,
      person_name || null,
      category,
      reason,
      severity || 'high',
      addedBy,
      expiry_date || null
    ]);

    await auditLogger.log({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      action: 'WATCHLIST_ENTRY_ADDED',
      resourceType: 'WATCHLIST',
      resourceId: id,
      details: { plate_number, category, reason, severity },
      ipAddress: req.ip
    });

    const saved = await db.get('SELECT * FROM watchlist_entries WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/v1/watchlist/:id/toggle - Toggle active status
router.patch('/:id/toggle', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await db.get('SELECT * FROM watchlist_entries WHERE id = ?', [id]);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Watchlist entry not found' });
    }

    const newStatus = entry.is_active ? 0 : 1;
    await db.run('UPDATE watchlist_entries SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, id]);

    await auditLogger.log({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      action: 'WATCHLIST_STATUS_TOGGLED',
      resourceType: 'WATCHLIST',
      resourceId: id,
      details: { new_status: newStatus },
      ipAddress: req.ip
    });

    const updated = await db.get('SELECT * FROM watchlist_entries WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/watchlist/:id
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await db.get('SELECT * FROM watchlist_entries WHERE id = ?', [id]);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Watchlist entry not found' });
    }

    await db.run('DELETE FROM watchlist_entries WHERE id = ?', [id]);

    await auditLogger.log({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      action: 'WATCHLIST_ENTRY_REMOVED',
      resourceType: 'WATCHLIST',
      resourceId: id,
      details: { plate_number: entry.plate_number, category: entry.category },
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Watchlist entry removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
