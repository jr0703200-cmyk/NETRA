import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  Navigation, 
  ArrowRight, 
  ExternalLink,
  Activity,
  Layers,
  Sparkles,
  Camera
} from 'lucide-react';
import axios from 'axios';
import L from 'leaflet';

export default function VehicleTracker({ activePlate = 'GJ-01-AB-1234', onSelectPlate, onOpenInvestigation }) {
  const [plateInput, setPlateInput] = useState(activePlate || 'GJ-01-AB-1234');
  const [loading, setLoading] = useState(false);
  const [journeyData, setJourneyData] = useState(null);
  const [activePlatesList, setActivePlatesList] = useState([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const polylineLayerRef = useRef(null);

  // Fetch recent active plates for quick-selection pills
  useEffect(() => {
    fetchActivePlates();
  }, []);

  // When activePlate prop changes, synchronize
  useEffect(() => {
    if (activePlate) {
      setPlateInput(activePlate);
      fetchJourney(activePlate);
    }
  }, [activePlate]);

  const fetchActivePlates = async () => {
    try {
      const resp = await axios.get('/api/v1/tracking/plates/active');
      if (resp.data && resp.data.data) {
        setActivePlatesList(resp.data.data);
      }
    } catch (e) {
      setActivePlatesList([
        { plate_number: 'GJ-01-AB-1234', sighting_count: 4 },
        { plate_number: 'GJ-01-HW-8821', sighting_count: 3 },
        { plate_number: 'GJ-05-XY-9988', sighting_count: 2 }
      ]);
    }
  };

  const fetchJourney = async (plate) => {
    if (!plate) return;
    setLoading(true);
    try {
      const resp = await axios.get(`/api/v1/tracking/${encodeURIComponent(plate)}`);
      if (resp.data && resp.data.success) {
        setJourneyData(resp.data);
        if (resp.data.route && resp.data.route.length > 0) {
          setSelectedCheckpoint(resp.data.route[resp.data.route.length - 1]);
        }
      }
    } catch (err) {
      console.error('[TRACKER] Error fetching journey:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (plateInput.trim()) {
      fetchJourney(plateInput.trim());
      if (onSelectPlate) onSelectPlate(plateInput.trim());
    }
  };

  // Initialize and Update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to Gujarat / Ahmedabad central coordinates
      const map = L.map(mapContainerRef.current, {
        center: [23.0338, 72.5850],
        zoom: 12,
        zoomControl: true,
        attributionControl: false
      });

      // Dark Surveillance Map Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      polylineLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    markersLayerRef.current.clearLayers();
    polylineLayerRef.current.clearLayers();

    if (journeyData && journeyData.route && journeyData.route.length > 0) {
      const latLngs = [];

      journeyData.route.forEach((sighting, index) => {
        const point = [sighting.lat, sighting.lng];
        latLngs.push(point);

        const isLast = index === journeyData.route.length - 1;
        const seqNumber = index + 1;

        // Custom DivIcon with sequence number
        const customIcon = L.divIcon({
          className: 'custom-journey-marker',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background: ${isLast ? '#FF4D5F' : '#17181C'};
              border: 2px solid ${isLast ? '#FF8A4C' : '#DED8CC'};
              border-radius: 50%;
              color: #F2EFE8;
              font-family: 'JetBrains Mono', monospace;
              font-size: 13px;
              font-weight: 700;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 14px ${isLast ? 'rgba(255, 77, 95, 0.7)' : 'rgba(222, 216, 204, 0.4)'};
            ">
              ${seqNumber}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker(point, { icon: customIcon }).addTo(markersLayerRef.current);

        marker.on('click', () => {
          setSelectedCheckpoint(sighting);
        });

        // Popup dossier
        marker.bindPopup(`
          <div style="padding: 6px; min-width: 220px; font-family: 'Inter', sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #DED8CC;">
                CHECKPOINT #${seqNumber}
              </span>
              <span style="font-size: 10px; color: #3DDC97; font-family: 'JetBrains Mono', monospace;">
                ${(sighting.confidence * 100).toFixed(0)}% Match
              </span>
            </div>
            <div style="font-size: 12px; font-weight: 600; color: #F2EFE8; margin-bottom: 2px;">
              ${sighting.camera_name}
            </div>
            <div style="font-size: 10px; color: #9E9B93; margin-bottom: 8px;">
              ${sighting.location_name || sighting.camera_id} • ${sighting.timestamp ? sighting.timestamp.slice(11, 19) + ' IST' : ''}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #686762; font-family: 'JetBrains Mono', monospace;">
              <span>Speed: ${sighting.speed_kmh || 48} km/h</span>
              <span>Plate: ${sighting.plate_number}</span>
            </div>
          </div>
        `);
      });

      // Animated connecting polyline
      if (latLngs.length > 1) {
        L.polyline(latLngs, {
          color: '#DED8CC',
          weight: 3.5,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round'
        }).addTo(polylineLayerRef.current);

        map.fitBounds(latLngs, { padding: [50, 50], maxZoom: 15 });
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 14);
      }
    }
  }, [journeyData]);

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Search & Target Summary Header */}
      <div style={{
        padding: '14px 18px',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', maxWidth: '520px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="input-field"
                value={plateInput}
                onChange={(e) => setPlateInput(e.target.value)}
                placeholder="Enter plate number (e.g. GJ-01-AB-1234)"
                style={{ paddingLeft: '34px', fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: '600' }}
              />
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '8px 16px' }}>
              <Navigation size={14} />
              <span>{loading ? 'Reconstructing...' : 'Reconstruct Trajectory'}</span>
            </button>
          </form>

          {/* Target Journey Metrics */}
          {journeyData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CHECKPOINTS</div>
                <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-main)' }}>
                  {journeyData.total_checkpoints} Cams
                </div>
              </div>

              <div style={{ height: '24px', width: '1px', background: 'var(--border-subtle)' }} />

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TRANSIT DISTANCE</div>
                <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-ivory)' }}>
                  {journeyData.distance_km} km
                </div>
              </div>

              <div style={{ height: '24px', width: '1px', background: 'var(--border-subtle)' }} />

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>JOURNEY TIME</div>
                <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-main)' }}>
                  {journeyData.duration_minutes} mins
                </div>
              </div>

              {journeyData.watchlist_match && (
                <div className="badge badge-critical" style={{ padding: '4px 10px', fontSize: '11px' }}>
                  <ShieldAlert size={13} />
                  WATCHLIST TARGET
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Pick Plate Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            RECENT SIGHTINGS:
          </span>
          {activePlatesList.map(p => (
            <button
              key={p.plate_number}
              onClick={() => {
                setPlateInput(p.plate_number);
                fetchJourney(p.plate_number);
                if (onSelectPlate) onSelectPlate(p.plate_number);
              }}
              className={`btn btn-sm ${plateInput === p.plate_number ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '2px 8px', fontSize: '11px' }}
            >
              <span className="plate-chip" style={{ fontSize: '10px', padding: '1px 5px' }}>{p.plate_number}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({p.sighting_count}x)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Trajectory Split: Interactive Leaflet Map on Left, Chronological Timeline on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '14px', minHeight: '620px' }}>
        {/* Leaflet GIS Map Container */}
        <div 
          className="glass-panel" 
          style={{ position: 'relative', overflow: 'hidden', minHeight: '600px' }}
        >
          {/* Map Title HUD */}
          <div style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            background: 'rgba(13, 14, 18, 0.92)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
            zIndex: 400,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(6px)'
          }}>
            <Navigation size={13} color="var(--accent-ivory)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: '700', color: 'var(--text-main)' }}>
              SPATIO-TEMPORAL ROUTE RECONSTRUCTION
            </span>
            <span className="badge badge-ivory" style={{ fontSize: '10px', padding: '1px 6px' }}>
              {journeyData?.route?.length || 0} NODES
            </span>
          </div>

          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '600px' }} />
        </div>

        {/* Chronological Journey Timeline */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={15} color="var(--accent-ivory)" />
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Chronological Journey</h3>
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {journeyData?.plate || plateInput}
            </span>
          </div>

          {/* Timeline Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {!journeyData || !journeyData.route || journeyData.route.length === 0 ? (
              <div style={{ padding: '60px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <MapPin size={32} style={{ marginBottom: '8px' }} />
                <p>No historical sightings found for plate {plateInput}.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                {journeyData.route.map((node, index) => {
                  const isSelected = selectedCheckpoint?.id === node.id;
                  const isLast = index === journeyData.route.length - 1;

                  return (
                    <div 
                      key={node.id}
                      onClick={() => setSelectedCheckpoint(node)}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {/* Node Sequence Circle & Vertical Line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: isSelected ? 'var(--accent-ivory)' : isLast ? 'var(--alert-critical)' : '#17181C',
                          color: isSelected ? '#08090C' : '#F2EFE8',
                          border: `2px solid ${isLast ? 'var(--alert-critical)' : 'var(--border-strong)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '700',
                          fontFamily: 'var(--font-mono)',
                          flexShrink: 0
                        }}>
                          {node.sequence_number}
                        </div>
                        {index < journeyData.route.length - 1 && (
                          <div style={{
                            width: '2px',
                            flex: 1,
                            background: 'var(--border-strong)',
                            margin: '4px 0',
                            minHeight: '40px'
                          }} />
                        )}
                      </div>

                      {/* Checkpoint Card */}
                      <div className="glass-card" style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: isSelected ? '1px solid var(--accent-ivory)' : '1px solid var(--border-glass)',
                        background: isSelected ? 'rgba(222, 216, 204, 0.08)' : 'var(--bg-glass)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {node.timestamp ? node.timestamp.slice(11, 19) + ' IST' : ''}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--tech-mint)', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                            {(node.confidence * 100).toFixed(0)}% CONF
                          </span>
                        </div>

                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>
                          {node.camera_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          {node.location_name || node.camera_id}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          <span>Speed: {node.speed_kmh || 45} km/h</span>
                          <span>Lat: {node.lat.toFixed(4)}, Lng: {node.lng.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Checkpoint Snapshot Dossier Box */}
          {selectedCheckpoint && (
            <div style={{
              padding: '14px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'rgba(13, 14, 18, 0.95)'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-ivory)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                FORENSIC SIGHTING EVIDENCE: CHECKPOINT #{selectedCheckpoint.sequence_number}
              </div>
              <div style={{
                height: '140px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                background: '#08090C',
                border: '1px solid var(--border-subtle)',
                position: 'relative',
                marginBottom: '8px'
              }}>
                <img 
                  src={selectedCheckpoint.snapshot_url || `/api/v1/cameras/${selectedCheckpoint.camera_id}/snapshot`}
                  alt="Sighting snapshot"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/api/v1/cameras/${selectedCheckpoint.camera_id}/snapshot`;
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '6px',
                  background: 'rgba(8, 9, 12, 0.85)',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-ivory)'
                }}>
                  {selectedCheckpoint.camera_id} • {selectedCheckpoint.timestamp?.slice(11, 19)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
