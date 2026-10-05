import React, { useState, useEffect, useRef } from 'react';
import { 
  Sliders, 
  Play, 
  Square, 
  Camera, 
  Activity, 
  Terminal, 
  Cpu, 
  Zap, 
  Search, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Download
} from 'lucide-react';
import axios from 'axios';

export default function CameraLab({ cameras = [] }) {
  const [targetUrl, setTargetUrl] = useState('rtsp://192.168.1.101:554/live/ch0');
  const [selectedCameraId, setSelectedCameraId] = useState(cameras[0]?.id || 'CAM-001');
  const [isPlaying, setIsPlaying] = useState(true);
  const [aiProcessingActive, setAiProcessingActive] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [scanningOnvif, setScanningOnvif] = useState(false);
  
  // Real-Time Telemetry
  const [fps, setFps] = useState(29.8);
  const [latencyMs, setLatencyMs] = useState(38);
  const [resolution, setResolution] = useState('3840x2160 (4K UHD)');
  const [consoleLogs, setConsoleLogs] = useState([
    { time: '12:00:01', level: 'INFO', msg: 'Camera Lab engineering testbed initialized.' },
    { time: '12:00:03', level: 'INFO', msg: 'TCP Stream socket listener bound to port 554.' },
    { time: '12:00:05', level: 'SUCCESS', msg: 'RTSP Session Established (Profile: H.264 Main / 30fps).' }
  ]);

  const addLog = (level, msg) => {
    const time = new Date().toTimeString().slice(0, 8);
    setConsoleLogs(prev => [...prev.slice(-30), { time, level, msg }]);
  };

  const handleTestStream = async () => {
    setTesting(true);
    addLog('INFO', `Initiating TCP socket handshake probe to ${targetUrl}...`);

    try {
      const resp = await axios.post('/api/v1/cameras/test-connection', {
        rtsp_url: targetUrl,
        is_demo: targetUrl.includes('demo') || targetUrl.includes('192.168.1.101')
      });

      setTestResult(resp.data);
      if (resp.data.success) {
        addLog('SUCCESS', `RTSP handshake confirmed 200 OK. Latency: ${resp.data.latency_ms}ms.`);
        setLatencyMs(resp.data.latency_ms || 42);
        setFps(resp.data.fps || 30);
      } else {
        addLog('ERROR', `Connection failed: ${resp.data.status}. ${resp.data.details}`);
      }
    } catch (err) {
      addLog('ERROR', `Probe error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleDiscoverOnvif = async () => {
    setScanningOnvif(true);
    addLog('INFO', 'Scanning local subnet interface for ONVIF WS-Discovery probes (Ports: 80, 554, 8899)...');

    try {
      const resp = await axios.post('/api/v1/cameras/discover');
      if (resp.data && resp.data.cameras) {
        setDiscoveredDevices(resp.data.cameras);
        addLog('SUCCESS', `Discovered ${resp.data.cameras.length} compatible IP/ONVIF surveillance nodes.`);
      }
    } catch (err) {
      addLog('ERROR', `Discovery failure: ${err.message}`);
    } finally {
      setScanningOnvif(false);
    }
  };

  const handleCaptureSnapshot = () => {
    addLog('INFO', `Forensic frame captured from sensor ${selectedCameraId}.`);
    const link = document.createElement('a');
    link.href = `/api/v1/cameras/${selectedCameraId}/snapshot`;
    link.download = `NETRA_SNAPSHOT_${selectedCameraId}_${Date.now()}.svg`;
    link.click();
  };

  const handleToggleAi = () => {
    const nextState = !aiProcessingActive;
    setAiProcessingActive(nextState);
    addLog('INFO', `Neural computer vision inference pipeline set to: ${nextState ? 'ACTIVE' : 'STANDBY'}`);
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Testbed Controls */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="var(--accent-ivory)" />
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
              CAMERA LAB — STREAM INGESTION & DIAGNOSTIC TESTBED
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleDiscoverOnvif}
              disabled={scanningOnvif}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 12px' }}
            >
              {scanningOnvif ? <RefreshCw size={13} className="spin" /> : <Search size={13} color="var(--accent-ivory)" />}
              <span>{scanningOnvif ? 'Scanning Subnet...' : 'Discover ONVIF Cameras'}</span>
            </button>
          </div>
        </div>

        {/* Stream URL Input Bar */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '320px', position: 'relative' }}>
            <input
              type="text"
              className="input-field"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="rtsp://admin:password@192.168.1.101:554/live/ch0"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
            />
          </div>

          <button
            onClick={handleTestStream}
            disabled={testing}
            className="btn btn-primary"
            style={{ padding: '8px 16px' }}
          >
            <Zap size={14} />
            <span>{testing ? 'Testing Protocol...' : 'Test RTSP Handshake'}</span>
          </button>
        </div>

        {/* Real-time Handshake Outcome Badge */}
        {testResult && (
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: testResult.success ? 'rgba(61, 220, 151, 0.1)' : 'rgba(255, 77, 95, 0.1)',
            border: `1px solid ${testResult.success ? 'rgba(61, 220, 151, 0.35)' : 'rgba(255, 77, 95, 0.35)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {testResult.success ? <CheckCircle2 size={16} color="var(--tech-mint)" /> : <AlertTriangle size={16} color="var(--alert-critical)" />}
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '12px', color: testResult.success ? 'var(--tech-mint)' : 'var(--alert-critical)' }}>
                  {testResult.status.toUpperCase()}:
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-main)', marginLeft: '6px' }}>
                  {testResult.details}
                </span>
              </div>
            </div>
            {testResult.latency_ms && (
              <span className="badge badge-ivory">
                {testResult.latency_ms}ms Handshake Latency
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Lab Workspace Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px', minHeight: '520px' }}>
        {/* Left: Stream Preview & Diagnostic HUD */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Preview Title Bar */}
          <div style={{
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={15} color="var(--accent-ivory)" />
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>
                Active Stream Buffer: {selectedCameraId}
              </span>
            </div>

            <select
              className="input-field select-field"
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              style={{ width: '180px', padding: '4px 10px', fontSize: '11px' }}
            >
              {cameras.map(c => (
                <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
              ))}
            </select>
          </div>

          {/* Video Preview Canvas */}
          <div style={{
            flex: 1,
            position: 'relative',
            background: '#040507',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '340px'
          }}>
            {isPlaying ? (
              <img 
                src={`/api/v1/cameras/${selectedCameraId}/stream`}
                alt="Stream preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `/api/v1/cameras/${selectedCameraId}/snapshot`;
                }}
              />
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                Stream playback paused.
              </div>
            )}

            {/* Diagnostic HUD Overlay */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(8, 9, 12, 0.85)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              backdropFilter: 'blur(4px)'
            }}>
              <span style={{ color: 'var(--accent-ivory)', fontWeight: '700' }}>CODEC: H.264 / RTSP</span>
              <span style={{ color: 'var(--tech-mint)' }}>RES: {resolution}</span>
              <span style={{ color: 'var(--text-secondary)' }}>FPS: {fps} • PING: {latencyMs}ms</span>
            </div>
          </div>

          {/* Stream Action Toolbar */}
          <div style={{
            padding: '10px 16px',
            background: 'rgba(13, 14, 18, 0.95)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`btn btn-sm ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
              >
                {isPlaying ? <Square size={12} /> : <Play size={12} />}
                <span>{isPlaying ? 'Pause Stream' : 'Play Stream'}</span>
              </button>

              <button
                onClick={handleToggleAi}
                className={`btn btn-sm ${aiProcessingActive ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Cpu size={12} />
                <span>AI Pipeline: {aiProcessingActive ? 'ACTIVE' : 'OFF'}</span>
              </button>
            </div>

            <button
              onClick={handleCaptureSnapshot}
              className="btn btn-secondary btn-sm"
              title="Capture instantaneous forensic frame"
            >
              <Download size={13} />
              <span>Capture Snapshot</span>
            </button>
          </div>
        </div>

        {/* Right: Live Connection Log & ONVIF Discovery Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Diagnostic Console Terminal */}
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Terminal size={14} color="var(--accent-ivory)" />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-main)' }}>
                STREAM CONNECTION TELEMETRY CONSOLE
              </span>
            </div>

            <div style={{
              flex: 1,
              padding: '12px',
              background: '#07080B',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              lineHeight: '1.6',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {consoleLogs.map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span>
                  <span style={{
                    color: log.level === 'SUCCESS' ? 'var(--tech-mint)' :
                           log.level === 'ERROR' ? 'var(--alert-critical)' : 'var(--accent-ivory)',
                    fontWeight: '600'
                  }}>
                    [{log.level}]
                  </span>
                  <span style={{ color: '#D4D0C5' }}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Discovered ONVIF Nodes Panel */}
          {discoveredDevices.length > 0 && (
            <div className="glass-panel" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-ivory)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                ONVIF NETWORK PROBE RESULTS ({discoveredDevices.length} DETECTED)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {discoveredDevices.map((dev, i) => (
                  <div key={i} style={{
                    padding: '8px 10px',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-main)' }}>
                        {dev.manufacturer} - {dev.model}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        IP: {dev.ip} • MAC: {dev.mac}
                      </div>
                    </div>

                    <button
                      onClick={() => setTargetUrl(dev.suggested_rtsp)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '10px', padding: '3px 8px' }}
                    >
                      Load URL
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
