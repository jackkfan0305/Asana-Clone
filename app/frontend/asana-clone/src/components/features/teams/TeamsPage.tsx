import { teams, teamMembers, users, projects } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';

export function TeamsPage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ font: 'var(--font-h1)' }}>Teams</h1>
        <button style={{ background: 'var(--color-primary)', color: '#fff', padding: '8px 16px', borderRadius: 'var(--radius-btn)', fontSize: 13 }}>
          + Create Team
        </button>
      </div>

      {teams.map(team => {
        const members = teamMembers.filter(tm => tm.teamId === team.id);
        const memberUsers = members.map(m => users.find(u => u.id === m.userId)!).filter(Boolean);
        const teamProjects = projects.filter(p => p.teamId === team.id);

        return (
          <div key={team.id} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 20, marginBottom: 16, border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ font: 'var(--font-h2)', marginBottom: 4 }}>{team.name}</h2>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{team.description}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '4px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-btn)', fontSize: 12 }}>
                  + Invite
                </button>
                <button style={{ padding: '4px 8px', color: 'var(--text-secondary)' }}>⋯</button>
              </div>
            </div>

            {/* Members */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ font: 'var(--font-h3)', marginBottom: 8 }}>Members ({memberUsers.length})</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {memberUsers.map(user => {
                  const membership = members.find(m => m.userId === user.id);
                  return (
                    <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--bg-content)', borderRadius: 'var(--radius-btn)' }}>
                      <Avatar userId={user.id} size={28} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>{membership?.role}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Projects */}
            <div>
              <h3 style={{ font: 'var(--font-h3)', marginBottom: 8 }}>Projects ({teamProjects.length})</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {teamProjects.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-content)', borderRadius: 'var(--radius-pill)', fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                    {p.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
