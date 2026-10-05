import React, { useState, useEffect, useRef } from 'react';
import { 
  Sliders, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Check, 
  X, 
  Clock, 
  AlertTriangle,
  Layers,
  Camera
} from 'lucide-react';
import axios from 'axios';

export default function RestrictedZonesEditor({ camera, onClose, onZoneSaved }) {
  const [zones, setZones] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]); // [{x: 0.1, y: 0.2}]
  const [zoneName, setZoneName] = useState('Restricted Entry Perimeter');
  const [eventType, setEventType] = useState('Restricted Zone Intrusion');
  const [alertSeverity, setAlertSeverity] = useState('critical');
  const [activeHours, setActiveHours] = useState('00:00-23:59');
  const [saving, setSaving] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    if (camera?.id) {
      fetchZones();
    }
  }, [camera]);

  const fetchZones = async () => {
    try {
      const resp = await axios.get(`/api/v1/zones?camera_id=${camera.id}`);
      if (resp.data && resp.data.data) {
        setZones(resp.data.data);
      }
    } catch (e) {
      console.error('[ZONES] Error fetching zones:', e);
    }
  };

  const handleCanvasClick = (e) => {
    if (!isDrawing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = +((e.clientX - rect.left) / rect.width).toFixed(3);
    const y = +((e.clientY - rect.top) / rect.height).toFixed(3);

    setCurrentPoints(prev => [...prev, { x, y }]);
  };

  const handleResetDrawing = () => {
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  const handleSaveZone = async () => {
    if (currentPoints.length < 3) {
      alert('A polygon zone requires at least 3 vertex points.');
      return;
    }
    setSaving(true);

    try {
      const resp = await axios.post('/api/v1/zones', {
        camera_id: camera.id,
        zone_name: zoneName,
        polygon_points: currentPoints,
        event_type: eventType,
        alert_severity: alertSeverity,
        active_hours: activeHours
      });

      if (resp.data && resp.data.data) {
        setZones(prev => [resp.data.data, ...prev]);
        handleResetDrawing();
        if (onZoneSaved) onZoneSaved(resp.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save restricted zone');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (id) => {
    try {
      await axios.delete(`/api/v1/zones/${id}`);
      setZones(prev => prev.filter(z => z.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete zone');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '820px' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="var(--accent-ivory)" />
            <div>
              <h3 style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '700' }}>
                Restricted Polygon Zone Configuration
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {camera ? `${camera.name} (${camera.id})` : 'Camera Sensor Node'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm">✕</button>
        </div>

        {/* Body Split */}
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
          {/* Left: Interactive Canvas Overlay over Camera Stream */}
          <div>
            <div 
              ref={containerRef}
              onClick={handleCanvasClick}
              style={{
                width: '100%',
                height: '300px',
                background: '#040507',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                position: 'relative',
                cursor: isDrawing ? 'crosshair' : 'default',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {/* Background Video Stream */}
              <img 
                src={`/api/v1/cameras/${camera.id}/stream`}
                alt="Camera feed"
                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `/api/v1/cameras/${camera.id}/snapshot`;
                }}
              />

              {/* Existing Zones SVG Overlay */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {zones.map((zone, idx) => {
                  const pointsStr = zone.polygon_points?.map(p => `${p.x * 100}%,${p.y * 100}%`).join(' ');
                  return (
                    <g key={zone.id || idx}>
                      <polygon
                        points={pointsStr}
                        fill="rgba(255, 77, 95, 0.25)"
                        stroke="#FF4D5F"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                      {zone.polygon_points?.[0] && (
                        <text
                          x={`${zone.polygon_points[0].x * 100}%`}
                          y={`${zone.polygon_points[0].y * 100 - 2}%`}
                          fill="#FF4D5F"
                          fontFamily="monospace"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          {zone.zone_name}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Currently Drawing Polygon */}
                {currentPoints.length > 0 && (
                  <g>
                    <polygon
                      points={currentPoints.map(p => `${p.x * 100}%,${p.y * 100}%`).join(' ')}
                      fill="rgba(222, 216, 204, 0.3)"
                      stroke="#DED8CC"
                      strokeWidth="2"
                    />
                    {currentPoints.map((pt, i) => (
                      <circle
                        key={i}
                        cx={`${pt.x * 100}%`}
                        cy={`${pt.y * 100}%`}
                        r="4"
                        fill="#3DDC97"
                        stroke="#08090C"
                        strokeWidth="1.5"
                      />
                    ))}
                  </g>
                )}
              </svg>

              {/* Instructions banner */}
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                right: '8px',
                background: 'rgba(8, 9, 12, 0.85)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)'
              }}>
                {isDrawing 
                  ? `Click to place polygon vertices (${currentPoints.length} added). Min 3 points.` 
                  : 'Click "Start Drawing Polygon" to outline perimeter zone.'}
              </div>
            </div>

            {/* Drawing Controls */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {!isDrawing ? (
                <button
                  type="button"
                  onClick={() => setIsDrawing(true)}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Plus size={13} />
                  <span>Start Drawing Polygon</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleResetDrawing}
                    className="btn btn-secondary btn-sm"
                  >
                    Clear Points
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDrawing(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Finish Polygon ({currentPoints.length} pts)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: Zone Configuration Parameters & Existing Zones List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-ivory)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                ZONE PARAMETERS
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  ZONE NAME
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="e.g. Restricted VIP Gate"
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  EVENT CLASSIFICATION
                </label>
                <select
                  className="input-field select-field"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                >
                  <option value="Restricted Zone Intrusion">Restricted Zone Intrusion</option>
                  <option value="Loitering Violation (>3m)">Loitering Violation (&gt;3m)</option>
                  <option value="Crowd Surge Geofence">Crowd Surge Geofence</option>
                  <option value="Unauthorized Parking">Unauthorized Parking</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    SEVERITY
                  </label>
                  <select
                    className="input-field select-field"
                    value={alertSeverity}
                    onChange={(e) => setAlertSeverity(e.target.value)}
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    ACTIVE HOURS
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={activeHours}
                    onChange={(e) => setActiveHours(e.target.value)}
                    placeholder="00:00-23:59"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveZone}
                disabled={saving || currentPoints.length < 3}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', padding: '7px' }}
              >
                {saving ? 'Saving...' : `Save Zone (${currentPoints.length} vertices)`}
              </button>
            </div>

            {/* List of Configured Zones */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '180px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                CONFIGURED ZONES ({zones.length}):
              </div>
              {zones.length === 0 ? (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                  No restricted zones mapped yet.
                </div>
              ) : (
                zones.map(z => (
                  <div key={z.id} style={{
                    padding: '8px 10px',
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-main)' }}>{z.zone_name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{z.event_type} • {z.active_hours}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteZone(z.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 6px', color: 'var(--alert-critical)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
