import { useApp } from '../../../data/AppContext';
import { projects, teams } from '../../../data/seed';

export function ReportingPage() {
  const { tasks } = useApp();

  const projectStats = projects.map(p => {
    const pt = tasks.filter(t => t.projectId === p.id && !t.parentTaskId);
    return { project: p, total: pt.length, completed: pt.filter(t => t.completed).length, overdue: pt.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date('2026-04-13')).length };
  });

  const teamStats = teams.map(t => {
    const teamProjects = projects.filter(p => p.teamId === t.id);
    const teamTasks = tasks.filter(tk => teamProjects.some(p => p.id === tk.projectId) && !tk.parentTaskId);
    return { team: t, total: teamTasks.length, completed: teamTasks.filter(tk => tk.completed).length };
  });

  const maxTotal = Math.max(...projectStats.map(s => s.total), 1);

  return (
    <div>
      <h1 style={{ font: 'var(--font-h1)', marginBottom: 24 }}>Reporting</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Tasks by project */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 20, border: '1px solid var(--border-default)' }}>
          <h3 style={{ font: 'var(--font-h3)', marginBottom: 16 }}>Tasks by project</h3>
          {projectStats.map(s => (
            <div key={s.project.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 100, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }} className="truncate">{s.project.name}</span>
              <div style={{ flex: 1, height: 20, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${(s.total / maxTotal) * 100}%`, height: '100%', background: s.project.color, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 24, textAlign: 'right' }}>{s.total}</span>
            </div>
          ))}
        </div>

        {/* Completion rate by team */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 20, border: '1px solid var(--border-default)' }}>
          <h3 style={{ font: 'var(--font-h3)', marginBottom: 16 }}>Completion rate by team</h3>
          {teamStats.map(s => {
            const rate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
            return (
              <div key={s.team.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{s.team.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{rate}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${rate}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Overdue trend */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 20, border: '1px solid var(--border-default)' }}>
          <h3 style={{ font: 'var(--font-h3)', marginBottom: 16 }}>Overdue tasks by project</h3>
          {projectStats.filter(s => s.overdue > 0).map(s => (
            <div key={s.project.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.project.color }} />
              <span style={{ fontSize: 13, flex: 1 }}>{s.project.name}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-error)' }}>{s.overdue}</span>
            </div>
          ))}
          {projectStats.every(s => s.overdue === 0) && (
            <p style={{ color: 'var(--text-placeholder)', fontSize: 13, textAlign: 'center', padding: 16 }}>No overdue tasks!</p>
          )}
        </div>

        {/* Summary donut */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 20, border: '1px solid var(--border-default)' }}>
          <h3 style={{ font: 'var(--font-h3)', marginBottom: 16 }}>Overall completion</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            {(() => {
              const total = tasks.filter(t => !t.parentTaskId).length;
              const completed = tasks.filter(t => !t.parentTaskId && t.completed).length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <>
                  <div style={{ position: 'relative', width: 100, height: 100 }}>
                    <svg viewBox="0 0 36 36" style={{ width: 100, height: 100, transform: 'rotate(-90deg)' }}>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg-input)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-success)" strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 18, fontWeight: 600 }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <div>{completed} completed</div>
                    <div>{total - completed} remaining</div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-placeholder)', padding: '16px 0', textAlign: 'center' }}>
        Reporting — read-only stub with preset charts. Custom report builder not available.
      </p>
    </div>
  );
}
