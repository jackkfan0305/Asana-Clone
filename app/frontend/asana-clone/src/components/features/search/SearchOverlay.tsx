import { useApp } from '../../../data/AppContext';
import { users, savedSearches } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';
import { Badge } from '../../common/Badge';

export function SearchOverlay() {
  const { searchQuery, setSearchQuery, setSearchOpen, tasks, setSelectedTaskId, seed } = useApp();

  const results = searchQuery.trim().length > 0 ? tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.parentTaskId
  ).slice(0, 15) : [];

  const projectResults = searchQuery.trim().length > 0 ? seed.projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const userResults = searchQuery.trim().length > 0 ? users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'var(--bg-modal-overlay)', zIndex: 1000,
        display: 'flex', justifyContent: 'center', paddingTop: 80,
      }}
      onClick={() => setSearchOpen(false)}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: 560, maxHeight: '70vh', background: 'var(--bg-card)', borderRadius: 'var(--radius-modal)',
        boxShadow: 'var(--shadow-modal)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border-divider)' }}>
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks, projects, people..."
            style={{ width: '100%', padding: '8px 12px', fontSize: 14, background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 'var(--radius-input)' }}
          />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {searchQuery.trim().length === 0 && (
            <>
              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-placeholder)', fontWeight: 600 }}>SAVED SEARCHES</div>
              {savedSearches.map(ss => (
                <div key={ss.id} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 'var(--radius-btn)', fontSize: 13 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-row-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setSearchQuery(ss.name)}
                >
                  🔍 {ss.name}
                </div>
              ))}
              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-placeholder)', fontWeight: 600, marginTop: 8 }}>RECENT</div>
              <p style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-placeholder)' }}>No recent searches</p>
            </>
          )}

          {projectResults.length > 0 && (
            <>
              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-placeholder)', fontWeight: 600 }}>PROJECTS</div>
              {projectResults.map(p => (
                <div key={p.id} onClick={() => { setSearchOpen(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', borderRadius: 'var(--radius-btn)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-row-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 14 }}>{p.icon}</span>
                  <span style={{ fontSize: 13 }}>{p.name}</span>
                  <Badge label={p.status.replace(/_/g, ' ')} color={p.status === 'on_track' ? '#5da283' : p.status === 'at_risk' ? '#f1bd6c' : '#e8384f'} size="sm" />
                </div>
              ))}
            </>
          )}

          {userResults.length > 0 && (
            <>
              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-placeholder)', fontWeight: 600 }}>PEOPLE</div>
              {userResults.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', borderRadius: 'var(--radius-btn)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-row-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar userId={u.id} size={24} />
                  <span style={{ fontSize: 13 }}>{u.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>{u.email}</span>
                </div>
              ))}
            </>
          )}

          {results.length > 0 && (
            <>
              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-placeholder)', fontWeight: 600 }}>TASKS</div>
              {results.map(task => {
                const project = seed.projects.find(p => p.id === task.projectId);
                return (
                  <div key={task.id} onClick={() => { setSelectedTaskId(task.id); setSearchOpen(false); }} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', borderRadius: 'var(--radius-btn)',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-row-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${task.completed ? 'var(--color-success)' : 'var(--border-input)'}`, background: task.completed ? 'var(--color-success)' : 'transparent', flexShrink: 0 }} />
                    <span className="truncate" style={{ flex: 1, fontSize: 13 }}>{task.title}</span>
                    {project && <span style={{ fontSize: 11, color: project.color }}>{project.name}</span>}
                  </div>
                );
              })}
            </>
          )}

          {searchQuery.trim().length > 0 && results.length === 0 && projectResults.length === 0 && userResults.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-placeholder)', padding: 24 }}>No results found</p>
          )}
        </div>

        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-divider)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>↵ to select · esc to close</span>
          <a style={{ color: 'var(--text-link)', fontSize: 12, cursor: 'pointer' }}>Advanced Search</a>
        </div>
      </div>
    </div>
  );
}
