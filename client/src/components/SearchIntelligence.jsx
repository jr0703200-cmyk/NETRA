import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Crosshair, 
  ExternalLink, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Calendar,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import axios from 'axios';

export default function SearchIntelligence({ 
  onSelectPlateForTracking, 
  onOpenInvestigation,
  onAddPlateToWatchlist,
  cameras = [] 
}) {
  const [plate, setPlate] = useState('');
  const [cameraId, setCameraId] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState('all');
  const [trackingId, setTrackingId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);

    try {
      const resp = await axios.post('/api/v1/search', {
        plate: plate.trim() || undefined,
        camera_id: cameraId || undefined,
        location: location.trim() || undefined,
        severity: severity !== 'all' ? severity : undefined,
        tracking_id: trackingId.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });

      if (resp.data && resp.data.data) {
        setResults(resp.data.data);
      }
    } catch (err) {
      console.error('[SEARCH] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPlate('');
    setCameraId('');
    setLocation('');
    setSeverity('all');
    setTrackingId('');
    setStartDate('');
    setEndDate('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Search Filter Header Panel */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Search size={18} color="var(--accent-ivory)" />
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '0.02em' }}>
            NETRA INTELLIGENCE SEARCH ENGINE
          </h2>
          <span className="badge badge-ivory" style={{ marginLeft: 'auto' }}>
            MULTI-SENSOR CORRELATION
          </span>
        </div>

        <form onSubmit={handleSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            {/* Plate Number (Exact or Partial Wildcard) */}
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                LICENSE PLATE (FULL / PARTIAL)
              </label>
              <input
                type="text"
                className="input-field"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="e.g. GJ-01 or 1234"
              />
            </div>

            {/* Camera Sensor Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                CAMERA SENSOR NODE
              </label>
              <select
                className="input-field select-field"
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
              >
                <option value="">All Surveillance Cameras</option>
                {cameras.map(c => (
                  <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
                ))}
              </select>
            </div>

            {/* Geographical Location */}
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                LOCATION / JUNCTION NAME
              </label>
              <input
                type="text"
                className="input-field"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Highway, Ring Road, Market"
              />
            </div>

            {/* Tracking ID */}
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                DEEPSORT TRACKING ID
              </label>
              <input
                type="text"
                className="input-field"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="e.g. TRK-2026-9041"
              />
            </div>

            {/* Severity Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                WATCHLIST SEVERITY
              </label>
              <select
                className="input-field select-field"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                FROM DATE / TIME
              </label>
              <input
                type="datetime-local"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Date Range End */}
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                TO DATE / TIME
              </label>
              <input
                type="datetime-local"
                className="input-field"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={handleReset} className="btn btn-secondary">
              Reset Filters
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '8px 20px' }}>
              <Search size={14} />
              <span>{loading ? 'Scanning Forensic Database...' : 'Execute Deep Search'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '12px 18px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={15} color="var(--accent-ivory)" />
            <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Forensic Search Dossiers</h3>
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            {results.length} MATCHING SIGHTINGS
          </span>
        </div>

        {results.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Search size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
            <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {hasSearched ? 'No Detections Match Current Query' : 'Ready for Search Query'}
            </h4>
            <p style={{ fontSize: '12px' }}>
              {hasSearched ? 'Try expanding the date range or loosening plate partial patterns.' : 'Enter a license plate or select a sensor node above to scan forensics.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '14px',
            padding: '16px'
          }}>
            {results.map(item => (
              <div 
                key={item.id} 
                className="glass-card" 
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                {/* Snapshot Header */}
                <div style={{ height: '160px', background: '#08090C', position: 'relative' }}>
                  <img 
                    src={item.snapshot_url || `/api/v1/cameras/${item.camera_id}/snapshot`}
                    alt="Sighting snapshot"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `/api/v1/cameras/${item.camera_id}/snapshot`;
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    display: 'flex',
                    gap: '6px'
                  }}>
                    <span className="plate-chip" style={{ fontSize: '11px', padding: '2px 6px' }}>
                      {item.plate_number}
                    </span>
                    {item.confidence && (
                      <span className="badge badge-success" style={{ fontSize: '10px' }}>
                        {(item.confidence * 100).toFixed(0)}% CONF
                      </span>
                    )}
                  </div>

                  {item.watchlist_category !== 'Standard Vehicle' && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px'
                    }}>
                      <span className="badge badge-critical" style={{ fontSize: '10px' }}>
                        {item.watchlist_category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Dossier Details */}
                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>
                    {item.camera_name || item.camera_id}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {item.location_name}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    marginTop: '4px',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-subtle)'
                  }}>
                    <span>{item.timestamp ? item.timestamp.replace('T', ' ').slice(0, 19) : ''}</span>
                    <span>{item.tracking_id || 'TRK-901'}</span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '10px'
                  }}>
                    <button
                      onClick={() => onSelectPlateForTracking(item.plate_number)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, padding: '5px 8px', fontSize: '11px' }}
                    >
                      <Crosshair size={12} color="var(--tech-mint)" />
                      <span>Track Vehicle</span>
                    </button>

                    <button
                      onClick={() => onAddPlateToWatchlist(item.plate_number)}
                      className="btn btn-secondary btn-sm"
                      title="Add target to Watchlist"
                      style={{ padding: '5px 8px' }}
                    >
                      <ShieldAlert size={12} color="var(--alert-high)" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
