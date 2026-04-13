import { useApp } from '../../data/AppContext';
import { useNavigate } from 'react-router-dom';
import { Search, HelpCircle, Settings, ChevronLeft, ChevronRight, Clock, Menu, Plus } from 'lucide-react';

// Asana three-dot logo mark
function AsanaLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="7" r="5.5" fill="#f06a6a" />
      <circle cx="8" cy="22" r="5.5" fill="#f06a6a" />
      <circle cx="24" cy="22" r="5.5" fill="#f06a6a" />
    </svg>
  );
}

export function Topbar() {
  const { searchQuery, setSearchQuery, setSearchOpen, setSidebarExpanded } = useApp();
  const navigate = useNavigate();

  const iconBtn = (children: React.ReactNode, title?: string, onClick?: () => void) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        color: 'var(--text-secondary)', padding: 6, display: 'flex', borderRadius: 4,
        alignItems: 'center', justifyContent: 'center',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {children}
    </button>
  );

  return (
    <div style={{
      height: 'var(--topbar-height)',
      background: 'var(--bg-topbar)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 6,
      borderBottom: '1px solid var(--border-divider)',
      flexShrink: 0,
    }}>
      {/* Left: hamburger + Create */}
      {iconBtn(<Menu size={18} strokeWidth={1.8} />, 'Toggle sidebar', () => setSidebarExpanded(v => !v))}

      <button
        onClick={() => navigate('/home')}
        style={{
          background: 'var(--color-create)',
          color: '#fff',
          padding: '5px 14px',
          borderRadius: 'var(--radius-pill)',
          fontWeight: 500,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          lineHeight: 1,
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-create-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-create)'}
      >
        <Plus size={14} strokeWidth={2.5} />
        Create
      </button>

      <div style={{ flex: 1 }} />

      {/* Center: nav arrows, clock, search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {iconBtn(<ChevronLeft size={16} strokeWidth={2} />, 'Back')}
        {iconBtn(<ChevronRight size={16} strokeWidth={2} />, 'Forward')}
        {iconBtn(<Clock size={16} strokeWidth={1.8} />, 'History')}
      </div>

      <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
        <Search size={14} strokeWidth={2} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-placeholder)',
        }} />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setSearchOpen(true)}
          style={{
            width: '100%',
            padding: '6px 14px 6px 32px',
            borderRadius: 20,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-default)',
            fontSize: 13,
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Right: asana logo + help + settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
          <AsanaLogo />
          <span style={{
            fontWeight: 500, color: 'var(--text-secondary)', fontSize: 14,
            letterSpacing: -0.3,
          }}>asana</span>
        </div>
        {iconBtn(<HelpCircle size={16} strokeWidth={1.5} />, 'Help')}
        {iconBtn(<Settings size={16} strokeWidth={1.5} />, 'Settings')}
      </div>
    </div>
  );
}
