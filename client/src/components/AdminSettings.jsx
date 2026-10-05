import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Shield, 
  Cpu, 
  Sliders, 
  Bell, 
  HardDrive, 
  EyeOff, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import axios from 'axios';

export default function AdminSettings({ onSettingsUpdated }) {
  const [settings, setSettings] = useState({
    system_name: 'METROPOLITAN SURVEILLANCE & TRAFFIC INTELLIGENCE COMMAND',
    organization: 'Central Surveillance Division',
    demo_mode: 'true',
    anpr_confidence_threshold: '85',
    auto_face_blur: 'true',
    data_retention_days: '90',
    alert_audio_enabled: 'true',
    ai_service_url: 'http://localhost:8001',
    heartbeat_interval_s: '10'
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const resp = await axios.get('/api/v1/settings');
      if (resp.data && resp.data.data) {
        setSettings(prev => ({ ...prev, ...resp.data.data }));
      }
    } catch (e) {
      console.error('[SETTINGS] Error loading settings:', e);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await axios.put('/api/v1/settings', settings);
      setSaveSuccess(true);
      if (onSettingsUpdated) onSettingsUpdated(settings);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={18} color="var(--accent-ivory)" />
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
            PLATFORM CONFIGURATION & SYSTEM POLICIES
          </h2>
        </div>

        {saveSuccess && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--tech-mint)', fontSize: '12px' }}>
            <CheckCircle2 size={15} />
            <span>Parameters updated successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Section 1: Command Center Identity */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-ivory)', fontFamily: 'var(--font-mono)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={15} />
            COMMAND CENTER DEPLOYMENT IDENTITY
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                SYSTEM NAME (BANNER TITLE)
              </label>
              <input
                type="text"
                className="input-field"
                value={settings.system_name}
                onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                DEPLOYMENT JURISDICTION / ORG
              </label>
              <input
                type="text"
                className="input-field"
                value={settings.organization}
                onChange={(e) => setSettings({ ...settings, organization: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 2: AI Computer Vision Thresholds */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-ivory)', fontFamily: 'var(--font-mono)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={15} />
            AI & ANPR COMPUTER VISION PARAMETERS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                ANPR CONFIDENCE THRESHOLD (%)
              </label>
              <input
                type="number"
                min="50"
                max="99"
                className="input-field"
                value={settings.anpr_confidence_threshold}
                onChange={(e) => setSettings({ ...settings, anpr_confidence_threshold: e.target.value })}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Plates below this score will not trigger automated watchlists</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                PYTHON AI SERVICE URL
              </label>
              <input
                type="text"
                className="input-field"
                value={settings.ai_service_url}
                onChange={(e) => setSettings({ ...settings, ai_service_url: e.target.value })}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>FastAPI Neural Engine endpoint</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px', fontFamily: 'var(--font-mono)' }}>
                DATA RETENTION PERIOD (DAYS)
              </label>
              <input
                type="number"
                min="7"
                max="365"
                className="input-field"
                value={settings.data_retention_days}
                onChange={(e) => setSettings({ ...settings, data_retention_days: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Privacy, Simulation & Audio Policies */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-ivory)', fontFamily: 'var(--font-mono)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={15} />
            OPERATIONAL POLICY TOGGLES
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Demo Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="var(--alert-medium)" />
                  <span>DEMO MODE SIMULATION PIPELINE</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Enables controlled simulation streams when physical IP/Wi-Fi cameras or live AI servers are offline.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.demo_mode === 'true'}
                onChange={(e) => setSettings({ ...settings, demo_mode: e.target.checked ? 'true' : 'false' })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {/* Privacy Face Blurring */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <EyeOff size={14} color="var(--accent-ivory)" />
                  <span>AUTOMATED FACE OBFUSCATION (PRIVACY COMPLIANCE)</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Automatically blurs non-target civilian facial regions before forensic snapshots are written to disk.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_face_blur === 'true'}
                onChange={(e) => setSettings({ ...settings, auto_face_blur: e.target.checked ? 'true' : 'false' })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {/* Audio Alert Chimes */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={14} color="var(--tech-mint)" />
                  <span>OPERATOR AUDIBLE CHIME ON CRITICAL THREATS</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Plays immediate synthesized radar alert sound on critical watchlist hits.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.alert_audio_enabled === 'true'}
                onChange={(e) => setSettings({ ...settings, alert_audio_enabled: e.target.checked ? 'true' : 'false' })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '9px 24px' }}>
            <Save size={15} />
            <span>{saving ? 'Persisting Policies...' : 'Save Configuration Parameters'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
