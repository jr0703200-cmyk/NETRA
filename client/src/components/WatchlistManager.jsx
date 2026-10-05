import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Crosshair, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  User,
  Car
} from 'lucide-react';
import axios from 'axios';

export default function WatchlistManager({ 
  onSelectPlateForTracking, 
  prefilledPlate = '', 
  onClearPrefill 
}) {
  const [entries, setEntries] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [targetType, setTargetType] = useState('vehicle');
  const [plateNumber, setPlateNumber] = useState('');
  const [personName, setPersonName] = useState('');
  const [category, setCategory] = useState('Stolen vehicle');
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState('critical');
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  useEffect(() => {
    if (prefilledPlate) {
      setPlateNumber(prefilledPlate);
      setTargetType('vehicle');
      setShowAddModal(true);
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefilledPlate]);

  const fetchWatchlist = async () => {
    try {
      const resp = await axios.get('/api/v1/watchlist');
      if (resp.data && resp.data.data) {
        setEntries(resp.data.data);
      }
    } catch (err) {
      console.error('[WATCHLIST] Error fetching entries:', err);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.patch(`/api/v1/watchlist/${id}/toggle`);
      setEntries(prev => prev.map(e => e.id === id ? { ...e, is_active: e.is_active ? 0 : 1 } : e));
    } catch (err) {
      console.error('[WATCHLIST] Error toggling status:', err);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm(`Are you sure you want to remove target ${id} from the active watchlist?`)) return;
    try {
      await axios.delete(`/api/v1/watchlist/${id}`);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('[WATCHLIST] Error deleting entry:', err);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const resp = await axios.post('/api/v1/watchlist', {
        target_type: targetType,
        plate_number: plateNumber,
        person_name: personName,
        category,
        reason,
        severity,
        expiry_date: expiryDate
      });

      if (resp.data && resp.data.data) {
        setEntries(prev => [resp.data.data, ...prev]);
        setShowAddModal(false);
        setPlateNumber('');
        setPersonName('');
        setReason('');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add watchlist entry');
    } finally {
      setSaving(false);
    }
  };

  const filteredEntries = entries.filter(e => {
    if (categoryFilter !== 'ALL' && e.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchPlate = e.plate_number?.toLowerCase().includes(q);
      const matchReason = e.reason?.toLowerCase().includes(q);
      const matchName = e.person_name?.toLowerCase().includes(q);
      if (!matchPlate && !matchReason && !matchName) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Filter & Add Toolbar */}
      <div style={{
        padding: '12px 18px',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left: Search & Categories */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '240px' }}>
            <input
              type="text"
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search target plate or reason..."
              style={{ paddingLeft: '32px' }}
            />
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {['ALL', 'Stolen vehicle', 'Wanted vehicle', 'Flagged vehicle', 'Surveillance target'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Add Watchlist Target Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ padding: '7px 14px' }}
        >
          <Plus size={15} />
          <span>Add Target Registry</span>
        </button>
      </div>

      {/* Watchlist Table */}
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
              <th style={{ padding: '10px 14px' }}>Target ID / Plate</th>
              <th style={{ padding: '10px 12px' }}>Category</th>
              <th style={{ padding: '10px 12px' }}>Threat Severity</th>
              <th style={{ padding: '10px 12px' }}>Case Background / Reason</th>
              <th style={{ padding: '10px 12px' }}>Added By</th>
              <th style={{ padding: '10px 12px' }}>Status</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No target entries match the current filter.
                </td>
              </tr>
            ) : (
              filteredEntries.map(entry => {
                const isVehicle = entry.target_type === 'vehicle';

                return (
                  <tr 
                    key={entry.id}
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    {/* Identifier */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isVehicle ? <Car size={16} color="var(--accent-ivory)" /> : <User size={16} color="var(--accent-ivory)" />}
                        <div>
                          {isVehicle ? (
                            <span className="plate-chip" style={{ fontSize: '12px' }}>
                              {entry.plate_number}
                            </span>
                          ) : (
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                              {entry.person_name}
                            </span>
                          )}
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                            {entry.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-ivory" style={{ fontSize: '10px' }}>
                        {entry.category}
                      </span>
                    </td>

                    {/* Severity */}
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${
                        entry.severity === 'critical' ? 'badge-critical' :
                        entry.severity === 'high' ? 'badge-high' : 'badge-medium'
                      }`}>
                        {entry.severity}
                      </span>
                    </td>

                    {/* Reason */}
                    <td style={{ padding: '12px', maxWidth: '320px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                        {entry.reason}
                      </div>
                      {entry.expiry_date && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                          Expires: {entry.expiry_date}
                        </div>
                      )}
                    </td>

                    {/* Added By */}
                    <td style={{ padding: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {entry.added_by}
                    </td>

                    {/* Active Toggle Switch */}
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleToggleStatus(entry.id)}
                        style={{
                          background: entry.is_active ? 'rgba(61, 220, 151, 0.12)' : 'rgba(255, 77, 95, 0.12)',
                          color: entry.is_active ? 'var(--tech-mint)' : 'var(--alert-critical)',
                          border: `1px solid ${entry.is_active ? 'rgba(61, 220, 151, 0.4)' : 'rgba(255, 77, 95, 0.4)'}`,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        {entry.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span>{entry.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {entry.plate_number && (
                          <button
                            onClick={() => onSelectPlateForTracking(entry.plate_number)}
                            className="btn btn-secondary btn-sm"
                            title="Reconstruct Trajectory"
                          >
                            <Crosshair size={12} color="var(--tech-mint)" />
                            <span>Track</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="btn btn-secondary btn-sm"
                          title="Remove from Watchlist"
                          style={{ color: 'var(--alert-critical)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="var(--alert-critical)" />
                <h3 style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '700' }}>
                  Register Watchlist Target
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="btn btn-secondary btn-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ padding: '22px' }}>
              {/* Target Type Selector */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                  TARGET CATEGORY TYPE
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setTargetType('vehicle')}
                    className={`btn btn-sm ${targetType === 'vehicle' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                  >
                    <Car size={14} />
                    <span>Vehicle Plate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('person')}
                    className={`btn btn-sm ${targetType === 'person' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                  >
                    <User size={14} />
                    <span>Individual / Person</span>
                  </button>
                </div>
              </div>

              {/* Target Identifier Input */}
              {targetType === 'vehicle' ? (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                    REGISTRATION NUMBER PLATE *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. GJ-01-AB-1234"
                    required
                  />
                </div>
              ) : (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                    PERSON IDENTIFIER / NAME *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="e.g. John Doe / Suspect ID #904"
                    required
                  />
                </div>
              )}

              {/* Category & Severity Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                    WATCHLIST CATEGORY
                  </label>
                  <select
                    className="input-field select-field"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Stolen vehicle">Stolen vehicle</option>
                    <option value="Wanted vehicle">Wanted vehicle</option>
                    <option value="Flagged vehicle">Flagged vehicle</option>
                    <option value="Surveillance target">Surveillance target</option>
                    <option value="VIP Escort">VIP Escort</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                    ALERT SEVERITY
                  </label>
                  <select
                    className="input-field select-field"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    <option value="critical">Critical (Immediate Intercept)</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Advisory</option>
                  </select>
                </div>
              </div>

              {/* Reason / Case Background */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                  REASON & CASE DOSSIER BACKGROUND *
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Reported stolen from Navrangpura. Linked to armed robbery FIR #304/2026."
                  required
                />
              </div>

              {/* Expiry Date */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                  REGISTRY EXPIRY DATE
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px' }}
                >
                  {saving ? 'Registering...' : 'Save Watchlist Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
