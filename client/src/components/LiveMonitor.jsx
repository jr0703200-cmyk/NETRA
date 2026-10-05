import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Maximize2, 
  Minimize2, 
  Cpu, 
  AlertTriangle, 
  Radio, 
  Sparkles, 
  Crosshair,
  ExternalLink,
  ShieldAlert,
  Zap,
  RefreshCw,
  Camera
} from 'lucide-react';
import axios from 'axios';

export default function LiveMonitor({ 
  cameras = [], 
  alerts = [], 
  aiOnline, 
  demoMode, 
  onSelectPlateForTracking,
  onOpenAlertDossier,
  onTriggerCameraAlert
}) {
  const [layout, setLayout] = useState('2x2'); // '1x1', '2x2', '3x3', '4x4'
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [fullscreenCamId, setFullscreenCamId] = useState(null);
  const [activeDetections, setActiveDetections] = useState({});
  const [cameraFilter, setCameraFilter] = useState('ALL');

  // Filter cameras based on department or status
  const filteredCameras = cameras.filter(c => {
    if (cameraFilter === 'ALL') return true;
    if (cameraFilter === 'ONLINE') return c.status === 'ONLINE';
    if (cameraFilter === 'ANPR') return c.camera_type?.includes('ANPR');
    return c.department?.toLowerCase().includes(cameraFilter.toLowerCase());
  });

  // Calculate layout slice
  const getDisplayCameras = () => {
    if (fullscreenCamId) {
      return cameras.filter(c => c.id === fullscreenCamId);
    }
    if (layout === '1x1') {
      const active = cameras.find(c => c.id === selectedCameraId) || filteredCameras[0];
      return active ? [active] : [];
    }
    if (layout === '2x2') return filteredCameras.slice(0, 4);
    if (layout === '3x3') return filteredCameras.slice(0, 9);
    if (layout === '4x4') return filteredCameras.slice(0, 16);
    return filteredCameras.slice(0, 4);
  };

  const displayCameras = getDisplayCameras();

  // Determine grid template columns
  const getGridTemplate = () => {
    if (fullscreenCamId || layout === '1x1') return '1fr';
    if (layout === '2x2') return 'repeat(2, 1fr)';
    if (layout === '3x3') return 'repeat(3, 1fr)';
    if (layout === '4x4') return 'repeat(4, 1fr)';
    return 'repeat(2, 1fr)';
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', minHeight: 'calc(100vh - 120px)' }}>
      {/* Top Monitor Controls & Feed Selectors */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 14px',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)'
      }}>
        {/* Left: Feed Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            FEED MATRIX:
          </span>
          {['ALL', 'ONLINE', 'ANPR', 'Traffic', 'Highway'].map(f => (
            <button
              key={f}
              onClick={() => setCameraFilter(f)}
              className={`btn btn-sm ${cameraFilter === f ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '3px 9px', fontSize: '11px' }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Right: Matrix Layout Switches & Global Diagnostics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* AI Banner / Status */}
          {!aiOnline && !demoMode ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'rgba(255, 77, 95, 0.15)',
              border: '1px solid rgba(255, 77, 95, 0.4)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--alert-critical)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: '700'
            }}>
              <AlertTriangle size={13} />
              AI PROCESSING OFFLINE
            </div>
          ) : demoMode ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'rgba(245, 196, 81, 0.12)',
              border: '1px solid rgba(245, 196, 81, 0.4)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--alert-medium)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: '700'
            }}>
              <Sparkles size={13} />
              DEMO SIMULATION ACTIVE
            </div>
          ) : null}

          {/* Grid Layout Switchers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--bg-glass)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
            {['1x1', '2x2', '3x3', '4x4'].map(mode => (
              <button
                key={mode}
                onClick={() => { setLayout(mode); setFullscreenCamId(null); }}
                style={{
                  background: layout === mode && !fullscreenCamId ? 'var(--accent-ivory)' : 'transparent',
                  color: layout === mode && !fullscreenCamId ? '#08090C' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Surveillance Camera Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: getGridTemplate(),
        gap: '14px',
        flex: 1
      }}>
        {displayCameras.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            padding: '80px 20px',
            textAlign: 'center',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)'
          }}>
            <Camera size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '6px' }}>No Connected Cameras Match Filter</h3>
            <p style={{ fontSize: '12px' }}>Check Camera Network settings or add a compatible RTSP/HTTP feed in Infrastructure.</p>
          </div>
        ) : (
          displayCameras.map(cam => {
            const isOnline = cam.status === 'ONLINE';
            const isFullscreen = fullscreenCamId === cam.id;
            const camAlerts = alerts.filter(a => a.camera_id === cam.id && !a.acknowledged);
            const hasCritical = camAlerts.some(a => a.severity === 'critical');

            return (
              <div 
                key={cam.id}
                className={`glass-panel hud-frame ${hasCritical ? 'pulse-alert' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#0D0E12',
                  border: `1px solid ${hasCritical ? 'rgba(255, 77, 95, 0.6)' : 'var(--border-subtle)'}`,
                  overflow: 'hidden',
                  minHeight: layout === '1x1' || isFullscreen ? '700px' : layout === '3x3' ? '280px' : '360px',
                  position: 'relative'
                }}
              >
                {/* Tile Top Bar Telemetry */}
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(13, 14, 18, 0.95)',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  zIndex: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: isOnline ? 'var(--tech-mint)' : 'var(--alert-critical)',
                      boxShadow: `0 0 6px ${isOnline ? 'var(--tech-mint)' : 'var(--alert-critical)'}`
                    }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: '700', color: 'var(--accent-ivory)' }}>
                      {cam.id}
                    </span>
                    <span style={{ color: 'var(--border-strong)' }}>|</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-main)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cam.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Live FPS & Latency */}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                      {cam.fps ? `${cam.fps} FPS` : '0 FPS'} • {cam.latency_ms ? `${cam.latency_ms}ms` : '0ms'}
                    </span>

                    {/* AI Badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 5px',
                      borderRadius: '2px',
                      background: aiOnline || demoMode ? 'rgba(61, 220, 151, 0.12)' : 'rgba(255, 77, 95, 0.12)',
                      color: aiOnline || demoMode ? 'var(--tech-mint)' : 'var(--alert-critical)',
                      border: `1px solid ${aiOnline || demoMode ? 'rgba(61, 220, 151, 0.3)' : 'rgba(255, 77, 95, 0.3)'}`
                    }}>
                      <Cpu size={10} />
                      {aiOnline || demoMode ? 'NETRA AI' : 'AI OFF'}
                    </span>

                    {/* Tile Fullscreen Button */}
                    <button
                      onClick={() => setFullscreenCamId(isFullscreen ? null : cam.id)}
                      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Camera'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                    </button>
                  </div>
                </div>

                {/* Video Feed Area with Neural Bounding Boxes and HUD Overlays */}
                <div style={{
                  flex: 1,
                  position: 'relative',
                  background: '#040507',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {isOnline ? (
                    <img 
                      src={`/api/v1/cameras/${cam.id}/stream`}
                      alt={cam.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `/api/v1/cameras/${cam.id}/snapshot`;
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <AlertTriangle size={32} color="var(--alert-critical)" style={{ marginBottom: '8px' }} />
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--alert-critical)', fontWeight: '700' }}>
                        CAMERA OFFLINE
                      </div>
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>
                        {cam.error_message || 'Stream connection failed or host unreachable'}
                      </div>
                    </div>
                  )}

                  {/* Offline AI Warning Overlay */}
                  {!aiOnline && !demoMode && isOnline && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(8, 9, 12, 0.88)',
                      border: '1px solid rgba(255, 77, 95, 0.5)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '10px',
                      color: 'var(--alert-critical)',
                      fontFamily: 'var(--font-mono)',
                      backdropFilter: 'blur(4px)'
                    }}>
                      <AlertTriangle size={12} />
                      AI ENGINE OFFLINE
                    </div>
                  )}

                  {/* Active Plate Recognition Chip on Camera */}
                  {isOnline && (aiOnline || demoMode) && (
                    <div 
                      onClick={() => onSelectPlateForTracking('GJ-01-AB-1234')}
                      title="Click to reconstruct cross-camera vehicle trajectory"
                      style={{
                        position: 'absolute',
                        bottom: '48px',
                        left: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 10px',
                        background: 'rgba(8, 9, 12, 0.90)',
                        border: '1px solid var(--accent-ivory)',
                        borderRadius: 'var(--radius-sm)',
                        backdropFilter: 'blur(6px)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.7)'
                      }}
                    >
                      <Crosshair size={13} color="var(--tech-mint)" />
                      <span className="plate-chip" style={{ fontSize: '11px', padding: '2px 6px' }}>
                        GJ-01-AB-1234
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--tech-mint)', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                        98.4%
                      </span>
                    </div>
                  )}

                  {/* Alert Ping Overlay */}
                  {camAlerts.length > 0 && (
                    <div 
                      onClick={() => onOpenAlertDossier(camAlerts[0])}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 9px',
                        background: 'rgba(255, 77, 95, 0.90)',
                        color: '#FFFFFF',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: '700',
                        fontFamily: 'var(--font-mono)',
                        boxShadow: 'var(--shadow-glow-critical)'
                      }}
                    >
                      <ShieldAlert size={12} />
                      <span>{camAlerts[0].type.toUpperCase()}</span>
                    </div>
                  )}
                </div>

                {/* Tile Bottom Action Toolbar */}
                <div style={{
                  padding: '6px 12px',
                  background: 'rgba(13, 14, 18, 0.95)',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px'
                }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cam.location_name}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => onTriggerCameraAlert(cam.id)}
                      className="btn btn-secondary btn-sm"
                      title="Trigger simulated AI watchlist match on this camera"
                      style={{ padding: '3px 8px', fontSize: '10px' }}
                    >
                      <Zap size={11} color="var(--accent-ivory)" />
                      <span>Simulate Trigger</span>
                    </button>

                    <button
                      onClick={() => onSelectPlateForTracking('GJ-01-AB-1234')}
                      className="btn btn-secondary btn-sm"
                      title="Track vehicle detected on this camera"
                      style={{ padding: '3px 8px', fontSize: '10px' }}
                    >
                      <Crosshair size={11} color="var(--tech-mint)" />
                      <span>Track Plate</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
