import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  Crosshair, 
  Download, 
  Filter, 
  Search, 
  Calendar, 
  MapPin, 
  Clock, 
  ExternalLink,
  MessageSquare,
  Check,
  CheckCheck
} from 'lucide-react';
import axios from 'axios';

export default function AlertCenter({ 
  alerts = [], 
  onAcknowledge, 
  onBulkAcknowledge, 
  onSelectPlateForTracking,
  onOpenInvestigation
}) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('UNACKNOWLEDGED'); // 'ALL', 'UNACKNOWLEDGED', 'ACKNOWLEDGED'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [ackModalAlert, setAckModalAlert] = useState(null);
  const [operatorNotes, setOperatorNotes] = useState('');

  // Filtering
  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter.toLowerCase()) return false;
    if (statusFilter === 'UNACKNOWLEDGED' && a.acknowledged) return false;
    if (statusFilter === 'ACKNOWLEDGED' && !a.acknowledged) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchPlate = a.plate?.toLowerCase().includes(q);
      const matchDesc = a.description?.toLowerCase().includes(q);
      const matchCam = a.camera_location?.toLowerCase().includes(q) || a.camera_id?.toLowerCase().includes(q);
      const matchType = a.type?.toLowerCase().includes(q);
      if (!matchPlate && !matchDesc && !matchCam && !matchType) return false;
    }
    return true;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAlerts(filteredAlerts.filter(a => !a.acknowledged).map(a => a.id));
    } else {
      setSelectedAlerts([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedAlerts(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkAckSubmit = () => {
    if (selectedAlerts.length === 0) return;
    onBulkAcknowledge(selectedAlerts, 'Batch verified and acknowledged by operator');
    setSelectedAlerts([]);
  };

  const handleSingleAckSubmit = () => {
    if (!ackModalAlert) return;
    onAcknowledge(ackModalAlert.id, operatorNotes || 'Incident verified by operator desk');
    setAckModalAlert(null);
    setOperatorNotes('');
  };

  const exportToCSV = () => {
    const headers = ['Alert ID', 'Type', 'Severity', 'Camera ID', 'Location', 'Plate', 'Confidence', 'Description', 'Timestamp', 'Acknowledged'];
    const rows = filteredAlerts.map(a => [
      a.id,
      `"${a.type}"`,
      a.severity,
      a.camera_id,
      `"${a.camera_location}"`,
      a.plate || 'N/A',
      a.confidence ? `${(a.confidence * 100).toFixed(1)}%` : 'N/A',
      `"${a.description.replace(/"/g, '""')}"`,
      a.timestamp,
      a.acknowledged ? 'Yes' : 'No'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NETRA_ALERTS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Filter & Action Bar */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left: Search & Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
            <input
              type="text"
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plate, camera, type..."
              style={{ paddingLeft: '32px' }}
            />
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-glass)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
            {[
              { id: 'UNACKNOWLEDGED', label: 'Unacknowledged' },
              { id: 'ACKNOWLEDGED', label: 'Acknowledged' },
              { id: 'ALL', label: 'All Alerts' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  background: statusFilter === tab.id ? 'var(--accent-ivory)' : 'transparent',
                  color: statusFilter === tab.id ? '#08090C' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Severity Filters */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(s => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`btn btn-sm ${severityFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 8px', fontSize: '10px' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Bulk Action & CSV Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedAlerts.length > 0 && (
            <button
              onClick={handleBulkAckSubmit}
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 12px' }}
            >
              <CheckCheck size={14} />
              <span>Acknowledge ({selectedAlerts.length})</span>
            </button>
          )}

          <button
            onClick={exportToCSV}
            className="btn btn-secondary btn-sm"
            title="Export filtered alerts to CSV"
            style={{ padding: '6px 12px' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Alerts Table & Queue */}
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
              <th style={{ padding: '10px 14px', width: '36px' }}>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll} 
                  checked={filteredAlerts.length > 0 && selectedAlerts.length === filteredAlerts.filter(a => !a.acknowledged).length}
                />
              </th>
              <th style={{ padding: '10px 12px' }}>Severity</th>
              <th style={{ padding: '10px 12px' }}>Timestamp</th>
              <th style={{ padding: '10px 12px' }}>Threat Classification</th>
              <th style={{ padding: '10px 12px' }}>Target Identifier</th>
              <th style={{ padding: '10px 12px' }}>Location & Sensor</th>
              <th style={{ padding: '10px 12px' }}>Status</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No alerts match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredAlerts.map(alert => {
                const isSelected = selectedAlerts.includes(alert.id);
                const isCritical = alert.severity === 'critical';

                return (
                  <tr 
                    key={alert.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(222, 216, 204, 0.05)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '12px 14px' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleToggleSelect(alert.id)}
                        disabled={alert.acknowledged}
                      />
                    </td>

                    {/* Severity Badge */}
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${
                        alert.severity === 'critical' ? 'badge-critical' :
                        alert.severity === 'high' ? 'badge-high' :
                        alert.severity === 'medium' ? 'badge-medium' : 'badge-slate'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {alert.timestamp ? alert.timestamp.slice(11, 19) + ' IST' : 'Live'}
                    </td>

                    {/* Threat Type & Description */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '600', color: isCritical ? 'var(--alert-critical)' : 'var(--text-main)', fontSize: '12px' }}>
                        {alert.type}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {alert.description}
                      </div>
                    </td>

                    {/* Target Plate */}
                    <td style={{ padding: '12px' }}>
                      {alert.plate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="plate-chip" style={{ fontSize: '11px' }}>
                            {alert.plate}
                          </span>
                          {alert.confidence && (
                            <span style={{ fontSize: '10px', color: 'var(--tech-mint)', fontFamily: 'var(--font-mono)' }}>
                              {(alert.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic' }}>Perimeter Anomaly</span>
                      )}
                    </td>

                    {/* Location */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-main)' }}>
                        {alert.camera_location}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {alert.camera_id}
                      </div>
                    </td>

                    {/* Acknowledged Status */}
                    <td style={{ padding: '12px' }}>
                      {alert.acknowledged ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--tech-mint)' }}>
                          <CheckCircle size={13} />
                          <span>Ack by {alert.acknowledged_by || 'Operator'}</span>
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--alert-critical)' }}>
                          <AlertTriangle size={13} />
                          <span>Pending Action</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {/* Investigate Dossier */}
                        <button
                          onClick={() => onOpenInvestigation(alert)}
                          className="btn btn-secondary btn-sm"
                          title="Open detailed investigation dossier"
                        >
                          <ExternalLink size={12} />
                          <span>Inspect</span>
                        </button>

                        {/* Track Plate */}
                        {alert.plate && (
                          <button
                            onClick={() => onSelectPlateForTracking(alert.plate)}
                            className="btn btn-secondary btn-sm"
                            title="Reconstruct cross-camera vehicle trajectory"
                          >
                            <Crosshair size={12} color="var(--tech-mint)" />
                            <span>Track</span>
                          </button>
                        )}

                        {/* Acknowledge Button */}
                        {!alert.acknowledged && (
                          <button
                            onClick={() => setAckModalAlert(alert)}
                            className="btn btn-primary btn-sm"
                            title="Acknowledge with notes"
                          >
                            <Check size={12} />
                            <span>Ack</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Single Alert Acknowledge Modal */}
      {ackModalAlert && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="var(--tech-mint)" />
                <h3 style={{ fontSize: '14px', color: 'var(--text-main)' }}>Acknowledge Threat Alert</h3>
              </div>
              <span className="badge badge-ivory">{ackModalAlert.id}</span>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: '600', color: 'var(--accent-ivory)', marginBottom: '4px' }}>{ackModalAlert.type}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ackModalAlert.description}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                  Location: {ackModalAlert.camera_location} ({ackModalAlert.camera_id})
                </div>
              </div>

              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                OPERATOR INVESTIGATION NOTES & DISPATCH ACTION
              </label>
              <textarea
                className="input-field"
                rows={3}
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                placeholder="e.g. Verified target identity. PCR Patrol Unit 14 dispatched for intercept at junction."
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button 
                  onClick={() => setAckModalAlert(null)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSingleAckSubmit} 
                  className="btn btn-primary"
                >
                  Confirm Acknowledged
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
