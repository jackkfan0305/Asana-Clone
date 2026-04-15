import { useApp } from '../../../data/AppContext';
import { useAuth } from '../../../api/authStore';
export function BulkToolbar() {
  const { selectedTasks, setSelectedTasks, bulkUpdate, bulkDelete } = useApp();
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id ?? '';

  if (selectedTasks.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--bg-card)', border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-card)', padding: '8px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: 'var(--shadow-modal)', zIndex: 900,
    }}>
      <span style={{ fontWeight: 500, fontSize: 13 }}>{selectedTasks.length} selected</span>
      <div style={{ width: 1, height: 20, background: 'var(--border-divider)' }} />
      <button onClick={() => bulkUpdate(selectedTasks, { completed: true, completedAt: new Date().toISOString() })}
        style={{ fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius-btn)', background: 'var(--color-success)', color: '#fff' }}>
        ✓ Complete
      </button>
      <button onClick={() => bulkUpdate(selectedTasks, { assigneeId: currentUserId })}
        style={{ fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius-btn)', border: '1px solid var(--border-default)' }}>
        Assign
      </button>
      <button style={{ fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius-btn)', border: '1px solid var(--border-default)' }}>
        Due date
      </button>
      <button style={{ fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius-btn)', border: '1px solid var(--border-default)' }}>
        Move
      </button>
      <button style={{ fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius-btn)', border: '1px solid var(--border-default)' }}>
        Tag
      </button>
      <button onClick={() => { bulkDelete(selectedTasks); setSelectedTasks([]); }}
        style={{ fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius-btn)', color: 'var(--color-error)' }}>
        Delete
      </button>
      <div style={{ width: 1, height: 20, background: 'var(--border-divider)' }} />
      <button onClick={() => setSelectedTasks([])} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>✕</button>
    </div>
  );
}
