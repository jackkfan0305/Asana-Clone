import { useState } from 'react';
import { useApp } from '../../data/AppContext';
import { useAuth } from '../../api/authStore';
import { logout } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { Search, HelpCircle, Settings, ChevronLeft, ChevronRight, Clock, Menu, Plus, LogOut, User } from 'lucide-react';

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

      {/* Right: asana logo + help + settings + user menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
          <AsanaLogo />
          <span style={{
            fontWeight: 500, color: 'var(--text-secondary)', fontSize: 14,
            letterSpacing: -0.3,
          }}>asana</span>
        </div>
        {iconBtn(<HelpCircle size={16} strokeWidth={1.5} />, 'Help')}
        {iconBtn(<Settings size={16} strokeWidth={1.5} />, 'Settings', () => navigate('/settings'))}
        <UserMenu />
      </div>
    </div>
  );
}

function UserMenu() {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title={user.name}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
          borderRadius: 'var(--radius-btn)', color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {user.avatar_url
          ? <img src={user.avatar_url} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
          : <User size={16} strokeWidth={1.5} />
        }
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4,
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-card)', padding: 4, minWidth: 180,
            boxShadow: 'var(--shadow-dropdown)', zIndex: 100,
          }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-divider)' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '8px 12px', borderRadius: 4, fontSize: 13,
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={14} strokeWidth={1.5} />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
