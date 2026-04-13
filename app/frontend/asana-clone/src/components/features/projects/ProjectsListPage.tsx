import { useNavigate } from 'react-router-dom';
import { projects, teams, users } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';
import { StatusBadge } from '../../common/Badge';

export function ProjectsListPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ font: 'var(--font-h1)' }}>Projects</h1>
        <button style={{
          background: 'var(--color-primary)', color: '#fff', padding: '8px 16px',
          borderRadius: 'var(--radius-btn)', fontSize: 13, fontWeight: 500,
        }}>+ New Project</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {projects.filter(p => !p.archived).map(project => {
          const team = teams.find(t => t.id === project.teamId);
          const owner = users.find(u => u.id === project.ownerId);
          return (
            <div
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
              style={{
                background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', cursor: 'pointer',
                overflow: 'hidden', border: '1px solid var(--border-default)',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
            >
              <div style={{ height: 4, background: project.color }} />
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{project.icon}</span>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{project.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <StatusBadge status={project.status} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{team?.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {owner && <Avatar userId={owner.id} size={20} />}
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{owner?.name}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
