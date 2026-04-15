import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Inbox, CircleCheck, FolderOpen, Briefcase, Target, LayoutGrid, Sparkles, ClipboardList, SlidersHorizontal, Zap, FileText, CircleDot, Package, ChevronRight, ChevronDown, Plus, Gauge, GitFork, Users } from 'lucide-react';
import { currentUserId } from '../../data/seed';
import { useApp } from '../../data/AppContext';
import { Avatar } from '../common/Avatar';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, projects } = useApp();
  const unread = notifications.filter(n => !n.read && !n.archived).length;
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [teamExpanded, setTeamExpanded] = useState(true);

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
          color: active ? '#ffffff' : '#c8c8c8',
          background: active ? '#404142' : 'transparent',
          width: 'calc(100% - 12px)',
          marginLeft: 6,
          textAlign: 'left',
          fontSize: 13,
          transition: 'background 0.1s',
          height: 34,
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#3a3b3d'; }}
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
    if (p.startsWith('/strategy') || p.startsWith('/reporting') || p.startsWith('/workload')) return 'strategy';
    if (p.startsWith('/workflow') || p.startsWith('/templates') || p.startsWith('/forms') || p.startsWith('/custom-fields')) return 'workflow';
    if (p.startsWith('/teams')) return 'people';
    return 'work';
  };

  const panel = getActivePanel();

  const sectionHeader = (label: string, showPlus?: boolean) => (
    <div style={{
      padding: '14px 12px 6px 16px', marginLeft: 6,
      fontSize: 11, color: '#6d6e6f', textTransform: 'none', fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      letterSpacing: 0.5,
    }}>
      <span>{label}</span>
      {showPlus && (
        <button style={{ color: '#6d6e6f', padding: 0, display: 'flex' }}
          onMouseEnter={e => e.currentTarget.style.color = '#c8c8c8'}
          onMouseLeave={e => e.currentTarget.style.color = '#6d6e6f'}
        >
          <Plus size={13} strokeWidth={2} />
        </button>
      )}
    </div>
  );

  const divider = () => (
    <div style={{ height: 1, background: '#353638', margin: '8px 0' }} />
  );

  return (
    <div style={{
      width: 'var(--sidebar-panel-width)',
      minWidth: 'var(--sidebar-panel-width)',
      height: '100%',
      background: '#2A2C2E',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Nav items */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 0' }}>
        {/* Home and Inbox always visible */}
        {navItem('Home', '/home', Home)}
        {navItem('Inbox', '/inbox', Inbox, unread > 0 ? unread : undefined)}

        {/* Full-width divider — aligns with page header borders */}
        <div style={{ height: 1, background: '#353638', margin: '8px 0' }} />

        {panel === 'work' && (
          <>
            {sectionHeader('Work')}
            {navItem('My tasks', '/my-tasks', CircleCheck)}
            {divider()}
            {navItem('Projects', '/projects', FolderOpen)}
            {navItem('Portfolios', '/portfolios', Briefcase)}
            {navItem('Goals', '/goals', Target)}
            {divider()}

            {/* Collapsible Work section with projects & portfolios */}
            <div style={{
              padding: '10px 12px 4px 16px', marginLeft: 6,
              fontSize: 11, color: '#6d6e6f', textTransform: 'none', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4, letterSpacing: 0.5,
              cursor: 'pointer',
            }}
              onClick={() => setProjectsExpanded(!projectsExpanded)}
            >
              <ChevronDown size={11} strokeWidth={2} style={{
                transform: projectsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.15s',
              }} />
              <span style={{ flex: 1 }}>Work</span>
              <button
                onClick={e => { e.stopPropagation(); navigate('/create-project'); }}
                style={{ color: '#6d6e6f', padding: 0, display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.color = '#c8c8c8'}
                onMouseLeave={e => e.currentTarget.style.color = '#6d6e6f'}
              >
                <Plus size={13} strokeWidth={2} />
              </button>
            </div>
            {projectsExpanded && (
              <>
                {/* Projects */}
                {projects.filter(p => !p.archived).map(p => {
                  const active = isActive(`/project/${p.id}`);
                  return (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/project/${p.id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '5px 12px 5px 28px',
                        width: 'calc(100% - 12px)', marginLeft: 6,
                        textAlign: 'left', fontSize: 13,
                        color: active ? '#ffffff' : '#c8c8c8',
                        background: active ? '#404142' : 'transparent',
                        borderRadius: 'var(--radius-btn)', height: 28,
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#3a3b3d'; }}
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
          </>
        )}

        {panel === 'strategy' && (
          <>
            {sectionHeader('Strategy')}
            {navItem('Goals', '/strategy/goals', Target)}
            {navItem('Resourcing', '/strategy/resourcing', Gauge)}
            {navItem('Reporting', '/strategy/reporting', GitFork)}
          </>
        )}

        {panel === 'workflow' && (
          <>
            {sectionHeader('Workflow')}
            {navItem('Template gallery', '/templates', LayoutGrid)}
            {divider()}
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
            <button
              onClick={() => navigate('/profile')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 12px 5px 16px', marginLeft: 6,
                width: 'calc(100% - 12px)', textAlign: 'left',
                borderRadius: 'var(--radius-btn)', fontSize: 13,
                color: '#c8c8c8', background: 'transparent',
                height: 34,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#3a3b3d'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Avatar userId={currentUserId} size={24} />
              <span>Profile</span>
            </button>
            {divider()}
            {/* Team collapsible header */}
            <div style={{
              padding: '10px 12px 4px 16px', marginLeft: 6,
              fontSize: 11, color: '#6d6e6f', textTransform: 'none', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4, letterSpacing: 0.5,
              cursor: 'pointer',
            }}
              onClick={() => setTeamExpanded(!teamExpanded)}
            >
              <ChevronDown size={11} strokeWidth={2} style={{
                transform: teamExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.15s',
              }} />
              <span>Team</span>
            </div>
            {teamExpanded && (
              <button
                onClick={() => navigate('/teams')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 12px 5px 16px', marginLeft: 6,
                  width: 'calc(100% - 12px)', textAlign: 'left',
                  borderRadius: 'var(--radius-btn)', fontSize: 13,
                  color: isActive('/teams') ? '#ffffff' : '#c8c8c8',
                  background: isActive('/teams') ? '#404142' : 'transparent',
                  height: 34, justifyContent: 'space-between',
                }}
                onMouseEnter={e => { if (!isActive('/teams')) e.currentTarget.style.background = '#3a3b3d'; }}
                onMouseLeave={e => { if (!isActive('/teams')) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={15} strokeWidth={1.8} style={{ opacity: 0.8 }} />
                  <span>My workspace</span>
                </span>
                <ChevronRight size={13} strokeWidth={1.8} style={{ opacity: 0.5 }} />
              </button>
            )}
          </>
        )}
      </div>

    </div>
  );
}
