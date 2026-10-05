import React, { useState } from 'react';
import { Eye, Shield, Lock, User, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('netra2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/v1/auth/login', { username, password });
      if (response.data && response.data.token) {
        localStorage.setItem('netra_token', response.data.token);
        localStorage.setItem('netra_user', JSON.stringify(response.data.user));
        onLoginSuccess(response.data.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failure. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = (roleUser) => {
    setUsername(roleUser);
    setPassword('netra2026');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(222, 216, 204, 0.08)',
            border: '1px solid var(--border-strong)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            color: 'var(--accent-ivory)'
          }}>
            <Eye size={26} strokeWidth={2.2} />
          </div>

          <h2 style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '0.1em',
            color: 'var(--accent-ivory)',
            marginBottom: '4px'
          }}>
            NETRA
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Neural Eye for Threat Recognition and Analysis
          </p>
          <div style={{
            marginTop: '8px',
            display: 'inline-block',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--tech-mint)',
            background: 'rgba(61, 220, 151, 0.1)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(61, 220, 151, 0.25)'
          }}>
            SECURE TERMINAL ACCESS
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              background: 'rgba(255, 77, 95, 0.12)',
              border: '1px solid rgba(255, 77, 95, 0.4)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--alert-critical)',
              fontSize: '12px',
              marginBottom: '16px'
            }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
              OPERATOR IDENTIFIER / EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or operator"
                required
                style={{ paddingLeft: '34px' }}
              />
              <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
              ENCRYPTED CREDENTIAL / PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{ paddingLeft: '34px' }}
              />
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            </div>
          </div>

          {/* Quick Demo Role Picker */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
              PRE-CONFIGURED ROLES (QUICK SWITCH):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleQuickRole('admin')}
                className={`btn btn-sm ${username === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('operator')}
                className={`btn btn-sm ${username === 'operator' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Operator
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('auditor')}
                className={`btn btn-sm ${username === 'auditor' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Auditor
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px' }}
          >
            <Shield size={16} />
            <span>{loading ? 'Authenticating Terminal...' : 'Authenticate & Enter Command Center'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
