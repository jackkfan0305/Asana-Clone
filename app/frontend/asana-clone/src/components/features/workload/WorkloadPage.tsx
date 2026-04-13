import { useApp } from '../../../data/AppContext';
import { users } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';

export function WorkloadPage() {
  const { tasks } = useApp();

  const assigneeStats = users.map(user => {
    const userTasks = tasks.filter(t => t.assigneeId === user.id && !t.completed && !t.parentTaskId);
    return { user, count: userTasks.length, capacity: 8 };
  }).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ font: 'var(--font-h1)' }}>Workload</h1>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Weekly view</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {assigneeStats.map(({ user, count, capacity }) => {
          const pct = (count / capacity) * 100;
          const color = pct > 100 ? 'var(--color-error)' : pct > 75 ? 'var(--color-warning)' : 'var(--color-success)';
          const label = pct > 100 ? 'Over capacity' : pct > 75 ? 'At capacity' : 'Under capacity';
          return (
            <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-default)' }}>
              <Avatar userId={user.id} size={32} />
              <div style={{ width: 120 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{count} tasks</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 24, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>
              <span style={{ fontSize: 11, color, minWidth: 90, textAlign: 'right' }}>{label}</span>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-placeholder)', padding: '16px 0', textAlign: 'center' }}>
        Workload — read-only stub. Task reassignment not available.
      </p>
    </div>
  );
}
