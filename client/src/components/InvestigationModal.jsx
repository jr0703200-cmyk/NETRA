import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Calendar, 
  Crosshair, 
  ExternalLink, 
  Check, 
  CheckCircle2, 
  AlertTriangle,
  Car,
  Camera,
  Navigation,
  FileText
} from 'lucide-react';
import axios from 'axios';

export default function InvestigationModal({ 
  alert, 
  onClose, 
  onSelectPlateForTracking, 
  onAddPlateToWatchlist,
  onAcknowledge 
}) {
  const [detailedAlert, setDetailedAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [operatorNotes, setOperatorNotes] = useState('');

  useEffect(() => {
    if (alert?.id) {
      fetchAlertDetails(alert.id);
    }
  }, [alert]);

  const fetchAlertDetails = async (id) => {
    setLoading(true);
    try {
      const resp = await axios.get(`/api/v1/alerts/${id}`);
      if (resp.data && resp.data.data) {
        setDetailedAlert(resp.data.data);
      }
    } catch (e) {
      console.error('[INVESTIGATION] Error fetching alert details:', e);
      setDetailedAlert(alert);
    } finally {
      setLoading(false);
    }
  };

  if (!alert) return null;

  const current = detailedAlert || alert;
  const isCritical = current.severity === 'critical';

  const handleAck = () => {
    if (onAcknowledge) {
      onAcknowledge(current.id, operatorNotes || 'Verified during forensic investigation session');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '840px' }}>
        {/* Modal Top Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(23, 24, 28, 0.95)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: isCritical ? 'rgba(255, 77, 95, 0.15)' : 'rgba(222, 216, 204, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isCritical ? 'var(--alert-critical)' : 'var(--accent-ivory)'
            }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: '700' }}>
                  FORENSIC INVESTIGATION DOSSIER
                </h3>
                <span className={`badge ${isCritical ? 'badge-critical' : 'badge-high'}`}>
                  {current.severity?.toUpperCase()} THREAT
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Case File ID: {current.id} • Protocol Reference: NCRB-INTERCEPT-2026
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary btn-sm">✕</button>
        </div>

        {/* Modal Body Grid */}
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Left: Forensic Snapshot & Target Identification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              height: '240px',
              background: '#040507',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid var(--border-subtle)'
            }}>
              <img 
                src={current.snapshot_url || `/api/v1/cameras/${current.camera_id}/snapshot`}
                alt="Forensic Evidence"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `/api/v1/cameras/${current.camera_id}/snapshot`;
                }}
              />
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                display: 'flex',
                gap: '6px'
              }}>
                {current.plate && (
                  <span className="plate-chip" style={{ fontSize: '12px' }}>
                    {current.plate}
                  </span>
                )}
                {current.confidence && (
                  <span className="badge badge-success" style={{ fontSize: '10px' }}>
                    {(current.confidence * 100).toFixed(1)}% CONF
                  </span>
                )}
              </div>
              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(8, 9, 12, 0.85)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '10px',
                color: 'var(--accent-ivory)',
                fontFamily: 'var(--font-mono)'
              }}>
                {current.camera_id} • {current.timestamp?.slice(11, 19)}
              </div>
            </div>

            {/* Incident Summary Card */}
            <div className="glass-card" style={{ padding: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-ivory)', marginBottom: '4px' }}>
                {current.type}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                {current.description}
              </p>
            </div>

            {/* Watchlist Cross-Check Info */}
            {current.watchlist ? (
              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 77, 95, 0.1)',
                border: '1px solid rgba(255, 77, 95, 0.35)'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--alert-critical)', fontFamily: 'var(--font-mono)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={13} />
                  CONFIRMED ACTIVE WATCHLIST HIT
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-main)' }}>
                  Category: <strong>{current.watchlist.category}</strong>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Case Reason: {current.watchlist.reason}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  Enrolled By: {current.watchlist.added_by}
                </div>
              </div>
            ) : (
              <div style={{ padding: '10px 12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                Target plate is not currently enrolled on an active law-enforcement watchlist registry.
              </div>
            )}
          </div>

          {/* Right: Camera Telemetry, Related Journey, & Action Console */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Sensor & Geolocation Card */}
            <div className="glass-card" style={{ padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-ivory)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                SURVEILLANCE SENSOR CONTEXT
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Camera Node:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{current.camera_location}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Sensor ID:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{current.camera_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Timestamp:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{current.timestamp?.replace('T', ' ').slice(0, 19)} IST</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Detection Source:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--tech-mint)' }}>{current.source || 'NETRA_AI_ENGINE'}</span>
                </div>
              </div>
            </div>

            {/* Related Historical Sightings (Journey Preview) */}
            {current.journey && current.journey.length > 0 && (
              <div className="glass-card" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-ivory)', fontFamily: 'var(--font-mono)' }}>
                    TRAJECTORY SIGHTINGS ({current.journey.length})
                  </div>
                  {current.plate && (
                    <button
                      onClick={() => { onSelectPlateForTracking(current.plate); onClose(); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--tech-mint)',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <span>Open Full Map</span>
                      <ExternalLink size={10} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                  {current.journey.map((s, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '10px',
                      padding: '4px 6px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '2px'
                    }}>
                      <span style={{ color: 'var(--accent-ivory)', fontWeight: '600' }}>#{idx + 1} {s.camera_name}</span>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{s.timestamp?.slice(11, 19)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Operator Notes & Actions */}
            <div style={{ padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                OPERATOR CASE NOTES & DISPATCH RECORD
              </label>
              <textarea
                className="input-field"
                rows={2}
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                placeholder="Log dispatch orders, patrol intercept status..."
                disabled={current.acknowledged}
              />

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                {current.plate && (
                  <button
                    onClick={() => { onSelectPlateForTracking(current.plate); onClose(); }}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Crosshair size={12} color="var(--tech-mint)" />
                    <span>Track Vehicle</span>
                  </button>
                )}

                {current.plate && onAddPlateToWatchlist && (
                  <button
                    onClick={() => { onAddPlateToWatchlist(current.plate); onClose(); }}
                    className="btn btn-secondary btn-sm"
                    title="Add plate to active Watchlist"
                  >
                    <ShieldAlert size={12} color="var(--alert-high)" />
                    <span>Watchlist</span>
                  </button>
                )}

                {!current.acknowledged && (
                  <button
                    onClick={handleAck}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Check size={12} />
                    <span>Acknowledge</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
