import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircleCheckBig, Triangle, Workflow, Users, Settings, UserCircle, Plus, Link2, LogOut } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { currentUserId, users } from '../../data/seed';
import { useAuth } from '../../api/authStore';
import { logout } from '../../api/client';

const items = [
  { id: 'work', Icon: CircleCheckBig, label: 'Work', path: '/home' },
  { id: 'strategy', Icon: Triangle, label: 'Strategy', path: '/strategy' },
  { id: 'workflow', Icon: Workflow, label: 'Workflow', path: '/workflow' },
  { id: 'people', Icon: Users, label: 'People', path: '/teams' },
];

export function IconRail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentUser = users.find(u => u.id === currentUserId)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getActive = () => {
    const path = location.pathname;
    if (path.startsWith('/strategy') || path.startsWith('/reporting') || path.startsWith('/workload')) return 'strategy';
    if (path.startsWith('/workflow') || path.startsWith('/templates') || path.startsWith('/forms') || path.startsWith('/custom-fields')) return 'workflow';
    if (path.startsWith('/teams')) return 'people';
    return 'work';
  };

  const active = getActive();

  const handleLogout = async () => {
    setMenuOpen(false);
    try { await logout(); } catch { /* ignore */ }
    setUser(null);
  };

  /* Profile menu always stays dark to match the nav chrome */
  const menuItemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '7px 16px', width: '100%', textAlign: 'left',
    fontSize: 13, color: '#f1f1f1', cursor: 'pointer',
  };

  return (
    <div style={{
      width: 'var(--icon-rail-width)',
      minWidth: 'var(--icon-rail-width)',
      background: '#2A2C2E',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 12,
      gap: 2,
      flexShrink: 0,
    }}>
      {/* Nav icons */}
      {items.map(item => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '8px 4px 6px',
              borderRadius: 'var(--radius-btn)',
              color: isActive ? '#ffffff' : '#8a8a8a',
              background: isActive ? '#404142' : 'transparent',
              width: 48,
              transition: 'all 0.15s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#3a3b3d'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            <item.Icon size={20} strokeWidth={1.5} />
            <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: 0.2 }}>{item.label}</span>
          </button>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User avatar at bottom with profile menu */}
      <div ref={menuRef} style={{ paddingBottom: 12, position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          style={{ cursor: 'pointer', borderRadius: '50%', padding: 0, display: 'flex' }}
        >
          <Avatar userId={currentUserId} size={28} />
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute',
            bottom: 8,
            left: 'calc(100% + 8px)',
            width: 260,
            background: '#2a2b2d',
            border: '1px solid #3a3b3d',
            borderRadius: 'var(--radius-card)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 100,
            padding: '8px 0',
          }}>
            {/* User info header */}
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar userId={currentUserId} size={40} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#f1f1f1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: 12, color: '#a2a0a2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.email}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: '#353638', margin: '4px 0' }} />

            {/* Admin console */}
            <button
              style={menuItemStyle}
              onMouseEnter={e => e.currentTarget.style.background = '#3a3b3d'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => { setMenuOpen(false); navigate('/settings'); }}
            >
              <Settings size={15} strokeWidth={1.6} style={{ color: '#a2a0a2' }} />
              Admin console
            </button>

            {/* New workspace */}
            <button
              style={menuItemStyle}
              onMouseEnter={e => e.currentTarget.style.background = '#3a3b3d'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={15} strokeWidth={1.6} style={{ color: '#a2a0a2' }} />
              New workspace
            </button>

            {/* Invite */}
            <button
              style={menuItemStyle}
              onMouseEnter={e => e.currentTarget.style.background = '#3a3b3d'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Link2 size={15} strokeWidth={1.6} style={{ color: '#a2a0a2' }} />
              Invite to Asana
            </button>

            <div style={{ height: 1, background: '#353638', margin: '4px 0' }} />

            {/* Profile */}
            <button
              style={menuItemStyle}
              onMouseEnter={e => e.currentTarget.style.background = '#3a3b3d'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => { setMenuOpen(false); navigate('/settings'); }}
            >
              <UserCircle size={15} strokeWidth={1.6} style={{ color: '#a2a0a2' }} />
              Profile
            </button>

            {/* Settings */}
            <button
              style={menuItemStyle}
              onMouseEnter={e => e.currentTarget.style.background = '#3a3b3d'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => { setMenuOpen(false); navigate('/settings'); }}
            >
              <Settings size={15} strokeWidth={1.6} style={{ color: '#a2a0a2' }} />
              Settings
            </button>

            {/* Add another account */}
            <button
              style={menuItemStyle}
              onMouseEnter={e => e.currentTarget.style.background = '#3a3b3d'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={15} strokeWidth={1.6} style={{ color: '#a2a0a2' }} />
              Add another account
            </button>

            <div style={{ height: 1, background: '#353638', margin: '4px 0' }} />

            {/* Log out */}
            <button
              style={menuItemStyle}
              onMouseEnter={e => e.currentTarget.style.background = '#3a3b3d'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={handleLogout}
            >
              <LogOut size={15} strokeWidth={1.6} style={{ color: '#a2a0a2' }} />
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
