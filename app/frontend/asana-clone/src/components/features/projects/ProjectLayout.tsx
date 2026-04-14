import { useState, useRef, useEffect } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../../data/AppContext';
import { Avatar } from '../../common/Avatar';
import type { ViewType } from '../../../types';

const viewTabs: { key: string; label: string; path: string }[] = [
  { key: 'overview', label: 'Overview', path: 'overview' },
  { key: 'list', label: 'List', path: '' },
  { key: 'board', label: 'Board', path: 'board' },
  { key: 'timeline', label: 'Timeline', path: 'timeline' },
  { key: 'dashboard', label: 'Dashboard', path: 'dashboard' },
  { key: 'calendar', label: 'Calendar', path: 'calendar' },
  { key: 'workflow', label: 'Workflow', path: 'workflow' },
];

const statusOptions = [
  { value: 'on_track', label: 'On track', color: 'var(--color-success)' },
  { value: 'at_risk', label: 'At risk', color: 'var(--color-warning)' },
  { value: 'off_track', label: 'Off track', color: 'var(--color-error)' },
  { value: 'on_hold', label: 'On hold', color: '#4573d2' },
  { value: 'complete', label: 'Complete', color: 'var(--color-success)' },
  { value: 'dropped', label: 'Dropped', color: '#6a6b6d' },
] as const;

function ProjectIcon({ color }: { color: string }) {
  return (
    <div style={{
      width: 24, height: 24, borderRadius: 4, background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
        <rect x={0} y={0} width={5} height={5} rx={1} fill="rgba(255,255,255,0.8)" />
        <rect x={7} y={0} width={5} height={5} rx={1} fill="rgba(255,255,255,0.8)" />
        <rect x={0} y={7} width={5} height={5} rx={1} fill="rgba(255,255,255,0.8)" />
        <rect x={7} y={7} width={5} height={5} rx={1} fill="rgba(255,255,255,0.8)" />
      </svg>
    </div>
  );
}

function StatusDropdown({ currentStatus, onSelect, onClose }: {
  currentStatus: string;
  onSelect: (status: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 4,
      background: '#2a2b2d', border: '1px solid var(--border-default)', borderRadius: 8,
      padding: 12, width: 280, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>Draft an update</div>
      {statusOptions.map(opt => (
        <button key={opt.value} onClick={() => { onSelect(opt.value); onClose(); }} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', width: '100%',
          borderRadius: 6, fontSize: 14, color: opt.color,
          background: opt.value === 'complete' ? 'rgba(93,162,131,0.15)' : 'transparent',
          fontWeight: opt.value === 'complete' ? 600 : 400,
          marginBottom: 4,
        }}
          onMouseEnter={e => e.currentTarget.style.background = opt.value === 'complete' ? 'rgba(93,162,131,0.25)' : 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = opt.value === 'complete' ? 'rgba(93,162,131,0.15)' : 'transparent'}
        >
          {opt.value === 'complete' ? (
            <span style={{ color: opt.color, fontSize: 16 }}>&#10003;</span>
          ) : (
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: opt.color, flexShrink: 0 }} />
          )}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ProjectLayout() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, updateProject, seed } = useApp();
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const project = projects.find(p => p.id === projectId);
  if (!project) return <div style={{ padding: 32, color: 'var(--text-secondary)' }}>Project not found</div>;

  const members = seed.teamMembers.filter(tm => tm.teamId === project.teamId).map(tm => tm.userId);
  const statusColor = project.status === 'on_track' ? 'var(--color-success)' : project.status === 'at_risk' ? 'var(--color-warning)' : 'var(--color-error)';
  const statusLabel = project.status === 'on_track' ? 'On track' : project.status === 'at_risk' ? 'At risk' : 'Off track';

  // Filter tabs to only show enabled views for this project
  const enabledViews = project.enabledViews || ['overview', 'list', 'board', 'timeline', 'dashboard'];
  const filteredTabs = viewTabs.filter(vt => enabledViews.includes(vt.key));

  // Determine active tab from URL
  const pathSuffix = location.pathname.replace(`/project/${projectId}`, '').replace(/^\//, '');
  const activeTab = filteredTabs.find(vt => vt.path === pathSuffix)?.key || 'list';

  const handleViewChange = (key: string) => {
    const tab = viewTabs.find(vt => vt.key === key);
    if (!tab) return;
    const path = tab.path ? `/project/${projectId}/${tab.path}` : `/project/${projectId}`;
    navigate(path);
  };

  const handleStatusSelect = (status: string) => {
    const mappedStatus = status === 'on_track' || status === 'at_risk' || status === 'off_track'
      ? status : status === 'on_hold' ? 'on_track' : status === 'complete' ? 'on_track' : 'off_track';
    updateProject(project.id, { status: mappedStatus as 'on_track' | 'at_risk' | 'off_track' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Project header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <ProjectIcon color={project.color} />
        <h1 style={{ font: 'var(--font-h1)' }}>{project.name}</h1>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowStatusDropdown(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer',
              padding: '3px 10px', borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-default)', background: 'transparent',
              color: statusColor,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
            {statusLabel}
          </button>
          {showStatusDropdown && (
            <StatusDropdown
              currentStatus={project.status}
              onSelect={handleStatusSelect}
              onClose={() => setShowStatusDropdown(false)}
            />
          )}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {members.slice(0, 3).map(uid => <Avatar key={uid} userId={uid} size={24} />)}
        </div>
        <button style={{ padding: '4px 8px', color: 'var(--text-secondary)' }}>...</button>
      </div>

      {/* View tabs — full-width border connects to sidebar divider */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #404244', marginBottom: 0, margin: '4.5px -24px 0', padding: '0 24px' }}>
        {filteredTabs.map(vt => (
          <button key={vt.key} onClick={() => handleViewChange(vt.key)} style={{
            padding: '8px 12px', fontSize: 13,
            color: activeTab === vt.key ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === vt.key ? '2px solid var(--color-primary)' : '2px solid transparent',
          }}>
            {vt.label}
          </button>
        ))}
      </div>

      {/* Sub-view content */}
      <div style={{ flex: 1, overflow: 'auto', paddingTop: 32 }}>
        <Outlet />
      </div>
    </div>
  );
}
