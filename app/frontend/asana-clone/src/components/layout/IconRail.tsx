import { useLocation, useNavigate } from 'react-router-dom';
import { CircleCheckBig, Triangle, Workflow, Users } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { currentUserId } from '../../data/seed';

const items = [
  { id: 'work', Icon: CircleCheckBig, label: 'Work', path: '/home' },
  { id: 'strategy', Icon: Triangle, label: 'Strategy', path: '/strategy' },
  { id: 'workflow', Icon: Workflow, label: 'Workflow', path: '/workflow' },
  { id: 'people', Icon: Users, label: 'People', path: '/teams' },
];

export function IconRail() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActive = () => {
    const path = location.pathname;
    if (path.startsWith('/strategy') || path.startsWith('/reporting') || path.startsWith('/workload')) return 'strategy';
    if (path.startsWith('/workflow') || path.startsWith('/templates') || path.startsWith('/forms') || path.startsWith('/custom-fields')) return 'workflow';
    if (path.startsWith('/teams')) return 'people';
    return 'work';
  };

  const active = getActive();

  return (
    <div style={{
      width: 'var(--icon-rail-width)',
      minWidth: 'var(--icon-rail-width)',
      background: 'var(--bg-icon-rail)',
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
              color: isActive ? '#fff' : 'var(--text-icon-rail)',
              background: isActive ? 'var(--bg-sidebar-selected)' : 'transparent',
              width: 48,
              transition: 'all 0.15s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-sidebar-hover)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            <item.Icon size={20} strokeWidth={1.5} />
            <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: 0.2 }}>{item.label}</span>
          </button>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User avatar at bottom */}
      <div style={{ paddingBottom: 12 }}>
        <Avatar userId={currentUserId} size={28} />
      </div>
    </div>
  );
}
