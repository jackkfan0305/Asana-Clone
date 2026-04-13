import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Inbox, CircleCheck, FolderOpen, Briefcase, Target, LayoutGrid, Sparkles, ClipboardList, SlidersHorizontal, Zap, FileText, CircleDot, Package, ChevronRight, Plus } from 'lucide-react';
import { projects, users, currentUserId } from '../../data/seed';
import { useApp } from '../../data/AppContext';
import { Avatar } from '../common/Avatar';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, sidebarExpanded } = useApp();
  const unread = notifications.filter(n => !n.read && !n.archived).length;
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  if (!sidebarExpanded) return null;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItem = (label: string, path: string, Icon?: LucideIcon, badge?: number) => {
    const active = isActive(path);
    return (
      <button
        key={path}
        onClick={() => navigate(path)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 12px 5px 16px',
          borderRadius: 'var(--radius-btn)',
          color: active ? 'var(--text-sidebar-active)' : 'var(--text-sidebar)',
          background: active ? 'var(--bg-sidebar-selected)' : 'transparent',
          width: 'calc(100% - 12px)',
          marginLeft: 6,
          textAlign: 'left',
          fontSize: 13,
          transition: 'background 0.1s',
          height: 30,
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-sidebar-hover)'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        {Icon && <Icon size={15} strokeWidth={1.8} style={{ flexShrink: 0, opacity: 0.8 }} />}
        <span className="truncate" style={{ flex: 1 }}>{label}</span>
        {badge ? (
          <span style={{
            background: 'var(--color-create)', color: '#fff', borderRadius: 10,
            padding: '0 5px', fontSize: 10, fontWeight: 600, lineHeight: '16px', minWidth: 16, textAlign: 'center',
          }}>{badge}</span>
        ) : null}
      </button>
    );
  };

  const getActivePanel = () => {
    const p = location.pathname;
    if (p.startsWith('/goals') || p.startsWith('/portfolios') || p.startsWith('/reporting') || p.startsWith('/workload')) return 'strategy';
    if (p.startsWith('/workflow') || p.startsWith('/templates') || p.startsWith('/forms') || p.startsWith('/custom-fields')) return 'workflow';
    if (p.startsWith('/teams')) return 'people';
    return 'work';
  };

  const panel = getActivePanel();

  const sectionHeader = (label: string, showPlus?: boolean) => (
    <div style={{
      padding: '10px 12px 4px 16px', marginLeft: 6,
      fontSize: 11, color: 'var(--text-placeholder)', textTransform: 'uppercase', fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      letterSpacing: 0.5,
    }}>
      <span>{label}</span>
      {showPlus && (
        <button style={{ color: 'var(--text-placeholder)', padding: 0, display: 'flex' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-sidebar)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-placeholder)'}
        >
          <Plus size={13} strokeWidth={2} />
        </button>
      )}
    </div>
  );

  const divider = () => (
    <div style={{ height: 1, background: 'var(--border-divider)', margin: '4px 18px' }} />
  );

  return (
    <div style={{
      width: 'var(--sidebar-panel-width)',
      background: 'var(--bg-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
      borderRight: '1px solid var(--border-divider)',
    }}>
      {/* Nav items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {/* Home and Inbox always visible */}
        {navItem('Home', '/home', Home)}
        {navItem('Inbox', '/inbox', Inbox, unread > 0 ? unread : undefined)}

        {panel === 'work' && (
          <>
            {sectionHeader('Work')}
            {navItem('My tasks', '/my-tasks', CircleCheck)}
            {divider()}
            {navItem('Projects', '/projects', FolderOpen)}
            {navItem('Portfolios', '/portfolios', Briefcase)}
            {navItem('Goals', '/goals', Target)}
            {divider()}

            {/* Projects section with expand/collapse */}
            <div style={{
              padding: '10px 12px 4px 16px', marginLeft: 6,
              fontSize: 11, color: 'var(--text-placeholder)', textTransform: 'uppercase', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4, letterSpacing: 0.5,
              cursor: 'pointer',
            }}
              onClick={() => setProjectsExpanded(!projectsExpanded)}
            >
              <ChevronRight size={11} strokeWidth={2} style={{
                transform: projectsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s',
              }} />
              <span style={{ flex: 1 }}>Work</span>
              <button
                onClick={e => { e.stopPropagation(); }}
                style={{ color: 'var(--text-placeholder)', padding: 0, display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-sidebar)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-placeholder)'}
              >
                <Plus size={13} strokeWidth={2} />
              </button>
            </div>
            {projectsExpanded && projects.filter(p => !p.archived).map(p => {
              const active = isActive(`/project/${p.id}`);
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 12px 5px 28px',
                    width: 'calc(100% - 12px)',
                    marginLeft: 6,
                    textAlign: 'left',
                    fontSize: 13,
                    color: active ? 'var(--text-sidebar-active)' : 'var(--text-sidebar)',
                    background: active ? 'var(--bg-sidebar-selected)' : 'transparent',
                    borderRadius: 'var(--radius-btn)',
                    height: 28,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-sidebar-hover)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: p.color, flexShrink: 0,
                  }} />
                  <span className="truncate">{p.name}</span>
                </button>
              );
            })}
          </>
        )}

        {panel === 'strategy' && (
          <>
            {sectionHeader('Strategy')}
            {navItem('Goals', '/goals', Target)}
            {navItem('Portfolios', '/portfolios', Briefcase)}
            {navItem('Reporting', '/reporting')}
            {navItem('Workload', '/workload')}
          </>
        )}

        {panel === 'workflow' && (
          <>
            {sectionHeader('Workflow')}
            {navItem('Template gallery', '/templates', LayoutGrid)}
            {navItem('AI Teammates', '/workflow', Sparkles)}
            {navItem('Project templates', '/templates', ClipboardList)}
            {navItem('Custom fields', '/custom-fields', SlidersHorizontal)}
            {navItem('Rules', '/workflow', Zap)}
            {navItem('Forms', '/forms', FileText)}
            {navItem('Task types', '/workflow', CircleDot)}
            {navItem('Bundles', '/workflow', Package)}
          </>
        )}

        {panel === 'people' && (
          <>
            {sectionHeader('People')}
            <div style={{ padding: '8px 12px 8px 22px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar userId={currentUserId} size={28} />
              <span style={{ color: 'var(--text-sidebar)', fontSize: 13 }}>
                {users.find(u => u.id === currentUserId)?.name}
              </span>
            </div>
            {sectionHeader('Team')}
            {navItem('My workspace', '/teams')}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-divider)' }}>
        {/* Trial badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', marginBottom: 6,
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2px solid var(--color-success)', flexShrink: 0,
          }} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-sidebar)', fontWeight: 500, lineHeight: 1.2 }}>Advanced free trial</div>
            <div style={{ fontSize: 10, color: 'var(--text-placeholder)', lineHeight: 1.2 }}>14 days left</div>
          </div>
        </div>
        <button style={{
          width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-btn)',
          border: '1px solid var(--border-default)', fontSize: 12, color: 'var(--text-sidebar)',
          textAlign: 'center', marginBottom: 8,
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Add billing info
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 6px' }}>
          <Avatar userId={currentUserId} size={22} />
          <button style={{ color: 'var(--text-link)', fontSize: 12 }}>Invite teammates</button>
        </div>
      </div>
    </div>
  );
}
