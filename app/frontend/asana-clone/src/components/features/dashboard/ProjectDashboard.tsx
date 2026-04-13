import { useParams } from 'react-router-dom';
import { useApp } from '../../../data/AppContext';
import { projectStatusUpdates, users } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';
import { StatusBadge } from '../../common/Badge';

export function ProjectDashboard() {
  const { projectId } = useParams();
  const { tasks, sections, seed } = useApp();

  const project = seed.projects.find(p => p.id === projectId);
  if (!project) return <div>Project not found</div>;

  const projectTasks = tasks.filter(t => t.projectId === projectId && !t.parentTaskId);
  const projectSections = sections.filter(s => s.projectId === projectId);

  const completed = projectTasks.filter(t => t.completed).length;
  const incomplete = projectTasks.filter(t => !t.completed).length;
  const overdue = projectTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date('2026-04-13')).length;
  const total = projectTasks.length;

  // Assignee stats
  const assigneeMap = new Map<string, number>();
  projectTasks.filter(t => !t.completed && t.assigneeId).forEach(t => {
    assigneeMap.set(t.assigneeId!, (assigneeMap.get(t.assigneeId!) || 0) + 1);
  });

  // Section stats
  const sectionStats = projectSections.map(s => ({
    name: s.name,
    count: projectTasks.filter(t => t.sectionId === s.id && !t.completed).length,
  }));
  const maxSectionCount = Math.max(...sectionStats.map(s => s.count), 1);

  const statusUpdate = projectStatusUpdates.find(u => u.projectId === projectId);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 20 }}>{project.icon}</span>
        <h1 style={{ font: 'var(--font-h1)' }}>{project.name} — Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total completed', value: completed, color: 'var(--color-success)' },
          { label: 'Total incomplete', value: incomplete, color: 'var(--color-warning)' },
          { label: 'Total overdue', value: overdue, color: 'var(--color-error)' },
          { label: 'Total tasks', value: total, color: 'var(--color-primary)' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 20, border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: 36, fontWeight: 600, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Bar chart - incomplete by section */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 20, border: '1px solid var(--border-default)' }}>
          <h3 style={{ font: 'var(--font-h3)', marginBottom: 16 }}>Incomplete tasks by section</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sectionStats.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 80, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>{s.name}</span>
                <div style={{ flex: 1, height: 24, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(s.count / maxSectionCount) * 100}%`, height: '100%', background: project.color, borderRadius: 4, transition: 'width 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4 }}>
                    <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{s.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Donut chart - completion status */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 20, border: '1px solid var(--border-default)' }}>
          <h3 style={{ font: 'var(--font-h3)', marginBottom: 16 }}>Tasks by completion status</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <svg viewBox="0 0 36 36" style={{ width: 120, height: 120, transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg-input)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-success)" strokeWidth="3"
                  strokeDasharray={`${(completed / Math.max(total, 1)) * 100} ${100 - (completed / Math.max(total, 1)) * 100}`} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: 20, fontWeight: 600 }}>{total}</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>total</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-success)' }} />
                Completed ({completed})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--bg-input)' }} />
                Incomplete ({incomplete})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* By assignee */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 20, border: '1px solid var(--border-default)', marginBottom: 24 }}>
        <h3 style={{ font: 'var(--font-h3)', marginBottom: 16 }}>Upcoming tasks by assignee</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {Array.from(assigneeMap.entries()).map(([userId, count]) => {
            const user = users.find(u => u.id === userId);
            return (
              <div key={userId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-content)', borderRadius: 'var(--radius-btn)' }}>
                <Avatar userId={userId} size={24} />
                <span style={{ fontSize: 13 }}>{user?.name}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)' }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status update */}
      {statusUpdate && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 20, border: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <h3 style={{ font: 'var(--font-h3)' }}>Latest Status Update</h3>
            <StatusBadge status={statusUpdate.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Avatar userId={statusUpdate.authorId} size={24} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {users.find(u => u.id === statusUpdate.authorId)?.name} · {new Date(statusUpdate.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.5 }}>{statusUpdate.text}</p>
        </div>
      )}

      <button style={{ color: 'var(--text-link)', fontSize: 13, padding: '16px 0' }}>+ Add widget</button>
    </div>
  );
}
