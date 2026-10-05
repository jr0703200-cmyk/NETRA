import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  MapPin, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Sliders, 
  Search,
  ExternalLink,
  Cpu,
  Shield,
  Activity,
  Zap,
  Globe
} from 'lucide-react';
import axios from 'axios';
import L from 'leaflet';

export default function CameraNetwork({ cameras = [], onRefreshCameras, onOpenZonesEditor }) {
  const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' or 'MAP'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Camera Form State
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    department: 'Metropolitan Traffic Command',
    location_name: '',
    lat: '23.0338',
    lng: '72.5850',
    ip_address: '',
    port: '554',
    rtsp_url: '',
    http_url: '',
    camera_type: 'PTZ-4K-ANPR',
    username: 'admin',
    password: '',
    save_offline: false,
    is_demo: false
  });

  // Test Connection State
  const [testStatus, setTestStatus] = useState(null); // { status, code, details, latency_ms }
  const [testingConnection, setTestingConnection] = useState(false);
  const [savingCamera, setSavingCamera] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Initialize Leaflet Map for MAP VIEW
  useEffect(() => {
    if (viewMode !== 'MAP' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [23.0338, 72.5850],
        zoom: 12,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    markersGroupRef.current.clearLayers();

    const points = [];
    cameras.forEach(cam => {
      const point = [cam.lat, cam.lng];
      points.push(point);

      const isOnline = cam.status === 'ONLINE';
      const isDegraded = cam.status === 'DEGRADED';
      const color = isOnline ? '#3DDC97' : isDegraded ? '#F5C451' : '#FF4D5F';

      const customPin = L.divIcon({
        className: 'camera-pin',
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background: #17181C;
            border: 2px solid ${color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 10px ${color}80;
          ">
            <div style="width: 8px; height: 8px; background: ${color}; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker(point, { icon: customPin }).addTo(markersGroupRef.current);

      marker.bindPopup(`
        <div style="padding: 6px; min-width: 200px; font-family: 'Inter', sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #DED8CC;">
              ${cam.id}
            </span>
            <span style="font-size: 10px; color: ${color}; font-weight: 700; font-family: 'JetBrains Mono', monospace;">
              ${cam.status}
            </span>
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #F2EFE8; margin-bottom: 2px;">
            ${cam.name}
          </div>
          <div style="font-size: 10px; color: #9E9B93; margin-bottom: 6px;">
            ${cam.location_name}
          </div>
          <div style="font-size: 10px; color: #686762; font-family: 'JetBrains Mono', monospace; border-top: 1px solid rgba(222,216,204,0.1); padding-top: 4px;">
            ${cam.fps || 0} FPS • ${cam.latency_ms || 0}ms • AI: ${cam.ai_status}
          </div>
        </div>
      `);
    });

    if (points.length > 0) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
    }
  }, [viewMode, cameras]);

  // Handle Real Camera Connection Test
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestStatus({ status: 'Connecting', details: 'Probing TCP socket and RTSP handshake...' });

    try {
      const resp = await axios.post('/api/v1/cameras/test-connection', {
        ip_address: formData.ip_address,
        port: formData.port,
        rtsp_url: formData.rtsp_url,
        http_url: formData.http_url,
        username: formData.username,
        password: formData.password,
        is_demo: formData.is_demo
      });

      setTestStatus(resp.data);
    } catch (err) {
      setTestStatus({
        success: false,
        status: 'Error',
        code: 'FAILED',
        details: err.response?.data?.details || err.message
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveCamera = async (e) => {
    e.preventDefault();
    setSavingCamera(true);

    try {
      await axios.post('/api/v1/cameras', formData);
      setShowAddModal(false);
      setTestStatus(null);
      setFormData({
        name: '',
        id: '',
        department: 'Metropolitan Traffic Command',
        location_name: '',
        lat: '23.0338',
        lng: '72.5850',
        ip_address: '',
        port: '554',
        rtsp_url: '',
        http_url: '',
        camera_type: 'PTZ-4K-ANPR',
        username: 'admin',
        password: '',
        save_offline: false,
        is_demo: false
      });
      if (onRefreshCameras) onRefreshCameras();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save camera node');
    } finally {
      setSavingCamera(false);
    }
  };

  const handleDeleteCamera = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently decommission camera sensor ${id} (${name})?`)) return;
    try {
      await axios.delete(`/api/v1/cameras/${id}`);
      if (onRefreshCameras) onRefreshCameras();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete camera');
    }
  };

  const filteredCameras = cameras.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchLoc = c.location_name?.toLowerCase().includes(q);
      const matchId = c.id?.toLowerCase().includes(q);
      const matchIp = c.ip_address?.toLowerCase().includes(q);
      if (!matchName && !matchLoc && !matchId && !matchIp) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Controls Toolbar */}
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
        {/* Left: Search & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '240px' }}>
            <input
              type="text"
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search camera name, location, IP..."
              style={{ paddingLeft: '32px' }}
            />
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {['ALL', 'ONLINE', 'DEGRADED', 'OFFLINE'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Right: View Mode Toggle & Add Camera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-glass)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
            <button
              onClick={() => setViewMode('TABLE')}
              style={{
                background: viewMode === 'TABLE' ? 'var(--accent-ivory)' : 'transparent',
                color: viewMode === 'TABLE' ? '#08090C' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              TABLE VIEW
            </button>
            <button
              onClick={() => setViewMode('MAP')}
              style={{
                background: viewMode === 'MAP' ? 'var(--accent-ivory)' : 'transparent',
                color: viewMode === 'MAP' ? '#08090C' : 'var(--text-secondary)',
                border: 'none',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              MAP VIEW
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ padding: '7px 14px' }}
          >
            <Plus size={15} />
            <span>Add Camera Node</span>
          </button>
        </div>
      </div>

      {/* Main Content: Table View vs Geographical Map View */}
      {viewMode === 'TABLE' ? (
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
                <th style={{ padding: '10px 14px' }}>Camera ID & Name</th>
                <th style={{ padding: '10px 12px' }}>Department</th>
                <th style={{ padding: '10px 12px' }}>Network Address</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Telemetry (FPS/MS)</th>
                <th style={{ padding: '10px 12px' }}>AI Pipeline</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCameras.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No camera nodes found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredCameras.map(cam => {
                  const isOnline = cam.status === 'ONLINE';
                  const isDegraded = cam.status === 'DEGRADED';

                  return (
                    <tr key={cam.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Video size={16} color="var(--accent-ivory)" />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>
                              {cam.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {cam.id} • {cam.location_name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {cam.department}
                      </td>

                      <td style={{ padding: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                        {cam.ip_address || '192.168.1.101'}:{cam.port || 554}
                      </td>

                      <td style={{ padding: '12px' }}>
                        <span className={`badge ${
                          isOnline ? 'badge-success' : isDegraded ? 'badge-medium' : 'badge-critical'
                        }`}>
                          {cam.status}
                        </span>
                      </td>

                      <td style={{ padding: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {cam.fps ? `${cam.fps} FPS` : '0 FPS'} • {cam.latency_ms ? `${cam.latency_ms}ms` : '0ms'}
                      </td>

                      <td style={{ padding: '12px' }}>
                        <span className="badge badge-ivory" style={{ fontSize: '10px' }}>
                          <Cpu size={10} />
                          {cam.ai_status || 'STANDBY'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => onOpenZonesEditor(cam)}
                            className="btn btn-secondary btn-sm"
                            title="Configure Restricted Geofence Polygon"
                          >
                            <Sliders size={12} />
                            <span>Zones</span>
                          </button>

                          <button
                            onClick={() => handleDeleteCamera(cam.id, cam.name)}
                            className="btn btn-secondary btn-sm"
                            title="Decommission camera node"
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
      ) : (
        /* Geographical Map View */
        <div className="glass-panel" style={{ height: '640px', overflow: 'hidden', position: 'relative' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      {/* Add Camera Modal with REAL Connection Test */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={18} color="var(--accent-ivory)" />
                <h3 style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '700' }}>
                  Register Compatible IP / Wi-Fi Camera Node
                </h3>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setTestStatus(null); }} 
                className="btn btn-secondary btn-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCamera} style={{ padding: '22px', maxHeight: '75vh', overflowY: 'auto' }}>
              {/* General Camera Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                    CAMERA IDENTIFIER (ID)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g. CAM-009"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                    SENSOR NODE NAME *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sector 5 Traffic Checkpost"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                    DEPARTMENT / DIVISION
                  </label>
                  <select
                    className="input-field select-field"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="Metropolitan Traffic Command">Metropolitan Traffic Command</option>
                    <option value="Highway Patrol Bureau">Highway Patrol Bureau</option>
                    <option value="Smart City Surveillance">Smart City Surveillance</option>
                    <option value="Special Security Operations">Special Security Operations</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                    CAMERA MODEL / TYPE
                  </label>
                  <select
                    className="input-field select-field"
                    value={formData.camera_type}
                    onChange={(e) => setFormData({ ...formData, camera_type: e.target.value })}
                  >
                    <option value="PTZ-4K-ANPR">PTZ 4K AI ANPR</option>
                    <option value="HIGH-SPEED-ANPR">High-Speed Optical ANPR</option>
                    <option value="FIXED-4K-ANPR">Fixed 4K Surveillance</option>
                    <option value="THERMAL-PTZ-ANPR">Thermal / Optical Hybrid</option>
                    <option value="ONVIF-PROFILE-S">Generic ONVIF Profile S</option>
                  </select>
                </div>
              </div>

              {/* Geographic Coordinates */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                    PHYSICAL LOCATION NAME *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.location_name}
                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                    placeholder="e.g. Ring Road Junction Mile 4"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                    LATITUDE
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                    LONGITUDE
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  />
                </div>
              </div>

              {/* Network Parameters & Credentials */}
              <div style={{ padding: '14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-ivory)', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>
                  NETWORK CONNECTIVITY & ENCRYPTED CREDENTIALS
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                      IP ADDRESS / HOSTNAME *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.ip_address}
                      onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                      placeholder="e.g. 192.168.1.120"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                      RTSP/ONVIF PORT
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                      placeholder="554"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                    FULL RTSP / HTTP STREAM URL
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.rtsp_url}
                    onChange={(e) => setFormData({ ...formData, rtsp_url: e.target.value })}
                    placeholder="e.g. rtsp://192.168.1.120:554/live/ch0"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                      CAMERA USERNAME
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                      CAMERA PASSWORD (SECURE VAULT)
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* REAL TEST CONNECTION SECTION */}
              <div style={{
                padding: '12px 14px',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                background: '#111216',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={14} color="var(--accent-ivory)" />
                    <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--accent-ivory)' }}>
                      CAMERA CONNECTION TEST
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 10px' }}
                  >
                    {testingConnection ? <RefreshCw size={12} className="spin" /> : <Zap size={12} color="var(--tech-mint)" />}
                    <span>{testingConnection ? 'Probing...' : 'TEST CONNECTION'}</span>
                  </button>
                </div>

                {/* Status Indicator Bar */}
                {testStatus && (
                  <div style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: testStatus.status === 'Connected' ? 'rgba(61, 220, 151, 0.12)' : 'rgba(255, 77, 95, 0.12)',
                    border: `1px solid ${testStatus.status === 'Connected' ? 'rgba(61, 220, 151, 0.4)' : 'rgba(255, 77, 95, 0.4)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {testStatus.status === 'Connected' ? (
                      <CheckCircle2 size={15} color="var(--tech-mint)" />
                    ) : (
                      <AlertTriangle size={15} color="var(--alert-critical)" />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '700',
                        color: testStatus.status === 'Connected' ? 'var(--tech-mint)' : 'var(--alert-critical)'
                      }}>
                        {testStatus.status.toUpperCase()}
                        {testStatus.latency_ms ? ` (${testStatus.latency_ms}ms)` : ''}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {testStatus.details}
                      </div>
                    </div>
                  </div>
                )}

                {/* Offline Override Checkbox */}
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="save_offline"
                    checked={formData.save_offline}
                    onChange={(e) => setFormData({ ...formData, save_offline: e.target.checked })}
                  />
                  <label htmlFor="save_offline" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Save as Offline Camera for later on-site configuration
                  </label>
                </div>
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
                  disabled={savingCamera || (!formData.save_offline && testStatus?.status !== 'Connected')}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 20px',
                    opacity: (!formData.save_offline && testStatus?.status !== 'Connected') ? 0.5 : 1
                  }}
                  title={(!formData.save_offline && testStatus?.status !== 'Connected') ? 'Validate connection test before saving, or enable "Save as Offline"' : undefined}
                >
                  {savingCamera ? 'Registering...' : 'SAVE CAMERA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
