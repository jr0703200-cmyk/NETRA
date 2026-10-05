import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  User, 
  Key, 
  Building,
  CheckCircle2
} from 'lucide-react';
import axios from 'axios';

export default function AdminUsers({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'operator',
    department: 'Surveillance Operations'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const resp = await axios.get('/api/v1/users');
      if (resp.data && resp.data.data) {
        setUsers(resp.data.data);
      }
    } catch (e) {
      console.error('[USERS] Error:', e);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const resp = await axios.post('/api/v1/users', formData);
      if (resp.data && resp.data.data) {
        setUsers(prev => [resp.data.data, ...prev]);
        setShowAddModal(false);
        setFormData({
          username: '',
          password: '',
          name: '',
          role: 'operator',
          department: 'Surveillance Operations'
        });
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Revoke credentials and remove operator ${name}?`)) return;
    try {
      await axios.delete(`/api/v1/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="var(--accent-ivory)" />
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
            ROLE-BASED ACCESS CONTROL (RBAC) & OPERATOR ACCOUNTS
          </h2>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={15} />
          <span>Add Operator Account</span>
        </button>
      </div>

      {/* Users Table */}
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
              <th style={{ padding: '10px 14px' }}>Operator Name & ID</th>
              <th style={{ padding: '10px 12px' }}>Username</th>
              <th style={{ padding: '10px 12px' }}>Role Clearance</th>
              <th style={{ padding: '10px 12px' }}>Department</th>
              <th style={{ padding: '10px 12px' }}>Last Authentication</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} color="var(--accent-ivory)" />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>{u.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{u.id}</div>
                    </div>
                  </div>
                </td>

                <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-main)' }}>
                  {u.username}
                </td>

                <td style={{ padding: '12px' }}>
                  <span className={`badge ${
                    u.role === 'admin' ? 'badge-critical' :
                    u.role === 'operator' ? 'badge-ivory' : 'badge-slate'
                  }`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>

                <td style={{ padding: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {u.department}
                </td>

                <td style={{ padding: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {u.last_login ? u.last_login.slice(0, 19).replace('T', ' ') : 'Never'}
                </td>

                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  {u.id !== currentUser?.id && (
                    <button
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="btn btn-secondary btn-sm"
                      title="Deactivate Account"
                      style={{ color: 'var(--alert-critical)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="var(--accent-ivory)" />
                <h3 style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '700' }}>
                  Provision Operator Account
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                  FULL NAME / OFFICER NAME *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Officer R. Mehta"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                    USERNAME *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. r_mehta"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                    INITIAL PASSWORD *
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                    ROLE CLEARANCE
                  </label>
                  <select
                    className="input-field select-field"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="operator">Operator (Surveillance)</option>
                    <option value="admin">Administrator (Full)</option>
                    <option value="auditor">Auditor (Read-Only)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                    DEPARTMENT
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                  {saving ? 'Creating...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
