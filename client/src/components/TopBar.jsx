import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  User, 
  ShieldCheck, 
  Cpu, 
  Clock, 
  Sparkles,
  ChevronDown,
  LogOut,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

export default function TopBar({
  stats,
  systemStatus,
  aiOnline,
  demoMode,
  onToggleDemoMode,
  audioEnabled,
  onToggleAudio,
  currentUser,
  onSwitchRole,
  onOpenLogin,
  onLogout,
  onSelectTab,
  recentNotifications = []
}) {
  const [timeStr, setTimeStr] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      height: '56px',
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'relative',
      zIndex: 40
    }}>
      {/* Left: Organization Badge & Live Operational Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: systemStatus === 'ONLINE' ? 'var(--tech-mint)' : 'var(--alert-high)',
            boxShadow: `0 0 8px ${systemStatus === 'ONLINE' ? 'var(--tech-mint)' : 'var(--alert-high)'}`
          }} />
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: '600',
            letterSpacing: '0.04em',
            color: 'var(--text-main)'
          }}>
            NETRA COMMAND
          </span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {systemStatus === 'ONLINE' ? 'Systems Operational' : 'Degraded Mode'}
          </span>
        </div>

        {/* DEMO MODE INDICATOR */}
        {demoMode && (
          <div 
            onClick={onToggleDemoMode}
            title="Click to toggle Demo Mode"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 9px',
              background: 'rgba(245, 196, 81, 0.12)',
              border: '1px solid rgba(245, 196, 81, 0.4)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--alert-medium)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.05em'
            }}
          >
            <Sparkles size={13} />
            DEMO MODE
          </div>
        )}
      </div>

      {/* Middle: Live Counter Telemetry Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Cameras Online Counter */}
        <div 
          onClick={() => onSelectTab('cameras')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>CAMERAS</span>
          <span style={{
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            color: 'var(--text-main)'
          }}>
            {stats.activeCameras || 7}/{stats.totalCameras || 8}
          </span>
        </div>

        {/* Active Threats Counter */}
        <div 
          onClick={() => onSelectTab('alerts')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: stats.activeThreats > 0 ? 'rgba(255, 77, 95, 0.12)' : 'var(--bg-glass)',
            border: `1px solid ${stats.activeThreats > 0 ? 'rgba(255, 77, 95, 0.4)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer'
          }}
        >
          <span style={{ 
            fontSize: '10px', 
            color: stats.activeThreats > 0 ? 'var(--alert-critical)' : 'var(--text-secondary)', 
            fontFamily: 'var(--font-mono)' 
          }}>
            THREATS
          </span>
          <span style={{
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            color: stats.activeThreats > 0 ? 'var(--alert-critical)' : 'var(--text-main)'
          }}>
            {stats.activeThreats || 0}
          </span>
        </div>

        {/* AI Engine Status Badge */}
        <div 
          onClick={() => onSelectTab('health')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: aiOnline ? 'rgba(61, 220, 151, 0.08)' : 'rgba(255, 77, 95, 0.08)',
            border: `1px solid ${aiOnline ? 'rgba(61, 220, 151, 0.3)' : 'rgba(255, 77, 95, 0.3)'}`,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer'
          }}
        >
          <Cpu size={13} color={aiOnline ? 'var(--tech-mint)' : 'var(--alert-critical)'} />
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: '600',
            color: aiOnline ? 'var(--tech-mint)' : 'var(--alert-critical)'
          }}>
            {aiOnline ? 'AI OPERATIONAL' : 'AI PROCESSING OFFLINE'}
          </span>
        </div>
      </div>

      {/* Right: Audio Chime, Clock, Notifications & User Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          title={audioEnabled ? 'Mute alert sounds' : 'Enable alert chimes'}
          style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 8px',
            color: audioEnabled ? 'var(--accent-ivory)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

        {/* Clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)'
        }}>
          <Clock size={13} />
          <span>{timeStr || '12:00:00 IST'}</span>
        </div>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 8px',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <Bell size={15} />
            {recentNotifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--alert-critical)'
              }} />
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '40px',
              right: '0',
              width: '320px',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-panel)',
              padding: '12px',
              zIndex: 100
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--accent-ivory)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '8px'
              }}>
                TACTICAL TELEMETRY STREAM
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                {recentNotifications.length === 0 ? (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                    No recent system warnings.
                  </div>
                ) : (
                  recentNotifications.map((n, i) => (
                    <div key={i} style={{
                      padding: '8px',
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px'
                    }}>
                      <div style={{ color: 'var(--accent-ivory)', fontWeight: '600' }}>{n.title}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Role Badge */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <ShieldCheck size={14} color="var(--accent-ivory)" />
            <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-ivory)' }}>
                {currentUser ? currentUser.name : 'Chief Administrator'}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                {currentUser ? currentUser.role : 'ADMIN'}
              </div>
            </div>
            <ChevronDown size={12} color="var(--text-muted)" />
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: '40px',
              right: '0',
              width: '240px',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-panel)',
              padding: '10px',
              zIndex: 100
            }}>
              <div style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                padding: '4px 6px',
                marginBottom: '4px'
              }}>
                Switch Active Role (Demo)
              </div>
              <button
                onClick={() => { onSwitchRole('admin'); setShowUserMenu(false); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 8px',
                  background: currentUser?.role === 'admin' ? 'var(--bg-glass-active)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Admin (Full Authority)</span>
                {currentUser?.role === 'admin' && <CheckCircle2 size={13} color="var(--accent-ivory)" />}
              </button>

              <button
                onClick={() => { onSwitchRole('operator'); setShowUserMenu(false); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 8px',
                  background: currentUser?.role === 'operator' ? 'var(--bg-glass-active)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Operator (Surveillance)</span>
                {currentUser?.role === 'operator' && <CheckCircle2 size={13} color="var(--accent-ivory)" />}
              </button>

              <button
                onClick={() => { onSwitchRole('auditor'); setShowUserMenu(false); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 8px',
                  background: currentUser?.role === 'auditor' ? 'var(--bg-glass-active)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Auditor (Read-Only)</span>
                {currentUser?.role === 'auditor' && <CheckCircle2 size={13} color="var(--accent-ivory)" />}
              </button>

              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 0' }} />

              <button
                onClick={() => { onOpenLogin(); setShowUserMenu(false); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <User size={13} />
                <span>Account Credentials Login</span>
              </button>

              <button
                onClick={() => { onLogout(); setShowUserMenu(false); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--alert-critical)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
