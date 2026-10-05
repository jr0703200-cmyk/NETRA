import React from 'react';
import { 
  Tv, 
  AlertTriangle, 
  MapPin, 
  Search, 
  ShieldAlert, 
  Video, 
  Sliders, 
  Activity, 
  BarChart2, 
  Users, 
  Settings, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, unacknowledgedAlertsCount, isCollapsed, onToggleCollapse }) {
  const navGroups = [
    {
      group: 'COMMAND',
      items: [
        { id: 'live', label: 'Live Monitor', icon: Tv, badge: null }
      ]
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { 
          id: 'alerts', 
          label: 'Alert Center', 
          icon: AlertTriangle, 
          badge: unacknowledgedAlertsCount > 0 ? unacknowledgedAlertsCount : null,
          badgeColor: 'var(--alert-critical)'
        },
        { id: 'tracker', label: 'Vehicle Tracker', icon: MapPin, badge: null },
        { id: 'search', label: 'Intelligence Search', icon: Search, badge: null },
        { id: 'watchlist', label: 'Watchlist', icon: ShieldAlert, badge: null }
      ]
    },
    {
      group: 'INFRASTRUCTURE',
      items: [
        { id: 'cameras', label: 'Camera Network', icon: Video, badge: null },
        { id: 'lab', label: 'Camera Lab', icon: Sliders, badge: null },
        { id: 'health', label: 'System Health', icon: Activity, badge: null }
      ]
    },
    {
      group: 'ANALYTICS',
      items: [
        { id: 'analytics', label: 'Analytics', icon: BarChart2, badge: null }
      ]
    },
    {
      group: 'ADMIN',
      items: [
        { id: 'users', label: 'Users & RBAC', icon: Users, badge: null },
        { id: 'settings', label: 'Settings', icon: Settings, badge: null },
        { id: 'audit', label: 'Audit Logs', icon: FileText, badge: null }
      ]
    }
  ];

  return (
    <aside style={{
      width: isCollapsed ? '68px' : '240px',
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 50,
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: isCollapsed ? '16px 12px' : '20px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative'
      }}>
        {/* Eye Symbol Emblem */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(222, 216, 204, 0.08)',
          border: '1px solid var(--border-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--accent-ivory)'
        }}>
          <Eye size={20} strokeWidth={2.2} />
        </div>

        {!isCollapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '16px',
              fontWeight: '700',
              letterSpacing: '0.12em',
              color: 'var(--accent-ivory)'
            }}>
              NETRA
            </div>
            <div style={{
              fontSize: '9px',
              color: 'var(--text-secondary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              Neural Threat Intel
            </div>
          </div>
        )}
      </div>

      {/* Nav List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: isCollapsed ? '12px 6px' : '16px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {navGroups.map((group) => (
          <div key={group.group}>
            {!isCollapsed && (
              <div style={{
                fontSize: '10px',
                fontWeight: '700',
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                padding: '0 8px 6px 8px',
                fontFamily: 'var(--font-mono)'
              }}>
                {group.group}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: isCollapsed ? '10px 0' : '9px 12px',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      width: '100%',
                      background: isActive ? 'var(--bg-glass-active)' : 'transparent',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--border-strong)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent-ivory)' : '1px solid transparent',
                      borderRadius: varRadius(isCollapsed),
                      color: isActive ? 'var(--text-main)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-glass)';
                        e.currentTarget.style.color = 'var(--text-main)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <Icon size={17} color={isActive ? 'var(--accent-ivory)' : 'currentColor'} strokeWidth={isActive ? 2.2 : 1.8} />

                    {!isCollapsed && (
                      <span style={{
                        flex: 1,
                        fontSize: '12px',
                        fontWeight: isActive ? 600 : 400,
                        letterSpacing: '0.01em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.label}
                      </span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span style={{
                        background: item.badgeColor || 'var(--accent-ivory)',
                        color: '#08090C',
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer & Collapse Toggle */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)'
      }}>
        {!isCollapsed && <span>v2.4-TACTICAL</span>}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            padding: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}

function varRadius(isCollapsed) {
  return isCollapsed ? 'var(--radius-sm)' : 'var(--radius-sm)';
}
