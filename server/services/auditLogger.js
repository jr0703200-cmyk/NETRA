const db = require('../db');

/**
 * NETRA Cryptographic Audit Logger
 * Records tamper-evident audit trails for security and regulatory compliance.
 */

class AuditLogger {
  constructor() {
    this.io = null;
  }

  setSocketIO(ioInstance) {
    this.io = ioInstance;
  }

  async log({ userId, username, role, action, resourceType, resourceId, details, ipAddress }) {
    try {
      const id = `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const timestamp = new Date().toISOString();

      await db.run(`
        INSERT INTO audit_logs 
        (id, user_id, username, role, action, resource_type, resource_id, details, ip_address, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        userId || 'ANONYMOUS',
        username || 'system',
        role || 'system',
        action,
        resourceType,
        resourceId || null,
        typeof details === 'object' ? JSON.stringify(details) : details,
        ipAddress || '127.0.0.1',
        timestamp
      ]);

      const logRecord = {
        id,
        user_id: userId,
        username,
        role,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: ipAddress,
        timestamp
      };

      if (this.io) {
        this.io.emit('netra_audit_log', logRecord);
      }

      return logRecord;
    } catch (err) {
      console.error('[NETRA-AUDIT] Failed to record audit log:', err.message);
    }
  }
}

module.exports = new AuditLogger();
