import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  ShieldCheck, 
  RefreshCw, 
  User, 
  Clock, 
  Globe,
  Database
} from 'lucide-react';
import axios from 'axios';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [userQuery, setUserQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const resp = await axios.get('/api/v1/audit-logs');
      if (resp.data && resp.data.data) {
        setLogs(resp.data.data);
      }
    } catch (e) {
      console.error('[AUDIT] Error fetching audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (actionFilter && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
    if (userQuery && !log.username.toLowerCase().includes(userQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--accent-ivory)" />
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '0.02em' }}>
              CRYPTOGRAPHIC SYSTEM AUDIT LOGS
            </h2>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Immutable forensic audit trail of operator logins, watchlist adjustments, camera changes, and alerts.
          </p>
        </div>

        <button onClick={fetchLogs} disabled={loading} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        padding: '10px 16px',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', width: '220px' }}>
          <input
            type="text"
            className="input-field"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Filter by operator username..."
            style={{ paddingLeft: '32px' }}
          />
          <User size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {['', 'LOGIN', 'WATCHLIST', 'CAMERA', 'ALERT', 'SETTINGS'].map(act => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`btn btn-sm ${actionFilter === act ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 8px', fontSize: '11px' }}
            >
              {act || 'ALL ACTIONS'}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase'
            }}>
              <th style={{ padding: '10px 14px' }}>Log ID & Timestamp</th>
              <th style={{ padding: '10px 12px' }}>Operator Username</th>
              <th style={{ padding: '10px 12px' }}>Role</th>
              <th style={{ padding: '10px 12px' }}>Action Type</th>
              <th style={{ padding: '10px 12px' }}>Resource Target</th>
              <th style={{ padding: '10px 12px' }}>Details / Metadata</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No audit logs recorded matching current filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-main)', fontWeight: '600' }}>
                      {log.id}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {log.timestamp ? log.timestamp.replace('T', ' ').slice(0, 19) : ''}
                    </div>
                  </td>

                  <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-main)' }}>
                    {log.username}
                  </td>

                  <td style={{ padding: '10px 12px' }}>
                    <span className="badge badge-ivory" style={{ fontSize: '9px' }}>
                      {log.role}
                    </span>
                  </td>

                  <td style={{ padding: '10px 12px' }}>
                    <span className="badge badge-cyan" style={{ fontSize: '10px' }}>
                      {log.action}
                    </span>
                  </td>

                  <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {log.resource_type} {log.resource_id ? `(${log.resource_id})` : ''}
                  </td>

                  <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                  </td>

                  <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
