import { useState } from 'react';
import { useApp } from '../../../data/AppContext';
import { Badge } from '../../common/Badge';

export function TagsPage() {
  const { tags, addTag, tasks } = useApp();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4186e0');

  const colors = ['#e8384f', '#fd612c', '#fd9a00', '#eec300', '#a4cf30', '#62d26f', '#37c5ab', '#20aaea', '#4186e0', '#7a6ff0', '#aa62e3', '#e362e3'];

  const handleCreate = () => {
    if (name.trim()) {
      addTag(name.trim(), color);
      setName('');
      setCreating(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ font: 'var(--font-h1)' }}>Tags</h1>
        <button onClick={() => setCreating(true)} style={{ background: 'var(--color-primary)', color: '#fff', padding: '8px 16px', borderRadius: 'var(--radius-btn)', fontSize: 13 }}>
          + Create Tag
        </button>
      </div>

      {creating && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 16, marginBottom: 16, border: '1px solid var(--border-default)' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Tag name"
            autoFocus onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            style={{ marginBottom: 12, width: '100%' }}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {colors.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 24, height: 24, borderRadius: '50%', background: c,
                border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCreate} style={{ padding: '6px 16px', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-btn)', fontSize: 12 }}>Create</button>
            <button onClick={() => setCreating(false)} style={{ padding: '6px 16px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-btn)', fontSize: 12 }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tags.map(tag => {
          const tagTasks = tasks.filter(t => t.tagIds.includes(tag.id) && !t.parentTaskId);
          return (
            <div key={tag.id} style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: '12px 16px',
              border: '1px solid var(--border-default)', minWidth: 160,
            }}>
              <Badge label={tag.name} color={tag.color} size="md" />
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
                {tagTasks.length} task{tagTasks.length !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
