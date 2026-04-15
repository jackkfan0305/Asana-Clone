import { useApp } from '../../data/AppContext';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Clock, Menu, Plus, HelpCircle, Sparkles } from 'lucide-react';

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

  /* Topbar always stays dark regardless of theme */
  const iconBtn = (children: React.ReactNode, title?: string, onClick?: () => void) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        color: '#a2a0a2', padding: 6, display: 'flex', borderRadius: 4,
        alignItems: 'center', justifyContent: 'center',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#3a3b3d'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {children}
    </button>
  );

  return (
    <div style={{
      height: 'var(--topbar-height)',
      background: '#2e2f31',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 6,
      borderBottom: 'none',
      flexShrink: 0,
    }}>
      {/* Left: hamburger + Create */}
      {iconBtn(<Menu size={18} strokeWidth={1.8} />, 'Toggle sidebar', () => setSidebarExpanded(v => !v))}

      <button
        onClick={() => navigate('/create-project')}
        style={{
          background: '#353638',
          color: '#f1f1f1',
          padding: '4px 16px 4px 4px',
          borderRadius: 50,
          fontWeight: 500,
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          lineHeight: 1,
          flexShrink: 0,
          cursor: 'pointer',
          letterSpacing: -0.2,
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#404142'}
        onMouseLeave={e => e.currentTarget.style.background = '#353638'}
      >
        <span style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#e86a5a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Plus size={16} strokeWidth={2.5} color="#fff" />
        </span>
        Create
      </button>

      <div style={{ flex: 1 }} />

      {/* Center: nav arrows, clock, search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {iconBtn(<ChevronLeft size={16} strokeWidth={2} />, 'Back', () => navigate(-1))}
        {iconBtn(<ChevronRight size={16} strokeWidth={2} />, 'Forward', () => navigate(1))}
        {iconBtn(<Clock size={16} strokeWidth={1.8} />, 'Recent activities')}
      </div>

      <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
        <Search size={14} strokeWidth={2} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: '#6d6e6f',
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
            background: '#353638',
            border: '1px solid #3a3b3d',
            fontSize: 13,
            color: '#f1f1f1',
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Right: asana logo + help + settings + user menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
          <AsanaLogo />
          <span style={{
            fontWeight: 500, color: '#a2a0a2', fontSize: 14,
            letterSpacing: -0.3,
          }}>asana</span>
        </div>
        <button
          title="Help"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '2px solid #6d6e6f',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#a2a0a2', cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#3a3b3d'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <HelpCircle size={18} strokeWidth={1.5} />
        </button>
        <button
          title="AI Assistant"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '2px solid #f06a6a',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#f06a6a', cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(240, 106, 106, 0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Sparkles size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
