import { useParams } from 'react-router-dom';
import { projects, users, projectStatusUpdates, teamMembers } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';

export function ProjectOverview() {
  const { projectId } = useParams();
  const project = projects.find(p => p.id === projectId);
  if (!project) return <div>Project not found</div>;

  const owner = users.find(u => u.id === project.ownerId);
  const members = teamMembers.filter(tm => tm.teamId === project.teamId).map(tm => users.find(u => u.id === tm.userId)!).filter(Boolean);
  const statusUpdate = projectStatusUpdates.find(u => u.projectId === projectId);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 20 }}>{project.icon}</span>
        <h1 style={{ font: 'var(--font-h1)' }}>{project.name} — Overview</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* Main content */}
        <div>
          {/* AI Summary card */}
          <div style={{ background: 'linear-gradient(135deg, rgba(69,115,210,0.08), rgba(122,111,240,0.08))', borderRadius: 'var(--radius-card)', padding: 20, marginBottom: 24, border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span>✨</span>
              <span style={{ fontWeight: 500, fontSize: 14 }}>AI Summary</span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>Recent activity</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span>Include</span>
                  <span style={{ color: 'var(--text-placeholder)' }}>|</span>
                  <span style={{ color: 'var(--text-placeholder)' }}>Exclude</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>Risk report</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span>Include</span>
                  <span style={{ color: 'var(--text-placeholder)' }}>|</span>
                  <span style={{ color: 'var(--text-placeholder)' }}>Exclude</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button style={{ padding: '6px 16px', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-btn)', fontSize: 12 }}>Generate summary</button>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" style={{ width: 14, height: 14 }} /> Get regular updates
              </label>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ font: 'var(--font-h3)', marginBottom: 8 }}>Project description</h3>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{project.description}</p>
          </div>

          {/* Activity timeline */}
          <div>
            <h3 style={{ font: 'var(--font-h3)', marginBottom: 12 }}>Activity</h3>
            {[
              { text: `${owner?.name} created this project`, date: project.createdAt },
              { text: `${members[1]?.name || 'Team member'} joined the project`, date: '2026-03-15' },
              { text: 'Project status updated', date: '2026-04-12' },
            ].map((event, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-default)', marginTop: 6, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13 }}>{event.text}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>{event.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Status */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 16, marginBottom: 16, border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ font: 'var(--font-h3)' }}>What's the status?</h3>
              <button style={{ color: 'var(--text-secondary)' }}>⋯</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['on_track', 'at_risk', 'off_track'] as const).map(s => (
                <button key={s} style={{
                  flex: 1, padding: '6px', borderRadius: 'var(--radius-btn)', fontSize: 11, fontWeight: 500,
                  background: project.status === s ? (s === 'on_track' ? 'var(--color-success)' : s === 'at_risk' ? 'var(--color-warning)' : 'var(--color-error)') : 'var(--bg-input)',
                  color: project.status === s ? '#fff' : 'var(--text-secondary)',
                }}>
                  {s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>
            {statusUpdate && (
              <div style={{ marginTop: 12, padding: '8px', background: 'var(--bg-content)', borderRadius: 'var(--radius-btn)' }}>
                <p style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--text-secondary)' }}>{statusUpdate.text}</p>
                <div style={{ fontSize: 11, color: 'var(--text-placeholder)', marginTop: 4 }}>
                  {users.find(u => u.id === statusUpdate.authorId)?.name} · {new Date(statusUpdate.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {/* Members */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 16, border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ font: 'var(--font-h3)' }}>Project roles</h3>
              <button style={{ color: 'var(--text-link)', fontSize: 12 }}>+ Add member</button>
            </div>
            {owner && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <Avatar userId={owner.id} size={28} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{owner.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>Project Owner</div>
                </div>
              </div>
            )}
            {members.filter(m => m.id !== project.ownerId).slice(0, 3).map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <Avatar userId={m.id} size={28} />
                <div>
                  <div style={{ fontSize: 13 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>Member</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-placeholder)', padding: '16px 0', textAlign: 'center' }}>
        Project Overview — read-only stub. AI summary generation not available.
      </p>
    </div>
  );
}
