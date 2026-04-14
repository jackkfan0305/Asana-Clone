import { users } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';

const sampleMessages = [
  { id: 'm1', authorId: 'usr_005', subject: 'Sprint kickoff notes', body: 'Here are the key items we discussed in today\'s sprint kickoff...', date: '2026-04-12' },
  { id: 'm2', authorId: 'usr_002', subject: 'Design review feedback', body: 'Shared some thoughts on the latest mockups. Please review when you get a chance.', date: '2026-04-11' },
  { id: 'm3', authorId: 'usr_003', subject: 'API schema changes', body: 'Heads up — we\'re making some breaking changes to the v2 endpoints.', date: '2026-04-10' },
];

export function MessagesPage() {
  return (
    <div>
      {/* Compose area */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 16, marginBottom: 24, border: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar userId="usr_005" size={28} />
          <input placeholder="Send message to members" style={{ flex: 1 }} readOnly />
          <button style={{ padding: '6px 16px', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-btn)', fontSize: 12, opacity: 0.5 }} disabled>
            Send
          </button>
        </div>
      </div>

      {/* Message threads */}
      {sampleMessages.map(msg => {
        const author = users.find(u => u.id === msg.authorId);
        return (
          <div key={msg.id} style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 16, marginBottom: 8,
            border: '1px solid var(--border-default)', cursor: 'pointer',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Avatar userId={msg.authorId} size={28} />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{author?.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-placeholder)', marginLeft: 8 }}>{msg.date}</span>
              </div>
            </div>
            <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{msg.subject}</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{msg.body}</p>
          </div>
        );
      })}

      {sampleMessages.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-placeholder)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
          <h3 style={{ font: 'var(--font-h3)', marginBottom: 8, color: 'var(--text-secondary)' }}>Connect with your team</h3>
          <p style={{ fontSize: 13 }}>Send messages to keep your team aligned.</p>
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-placeholder)', padding: '16px 0', textAlign: 'center' }}>
        Messages — read-only stub. Compose and reply not available.
      </p>
    </div>
  );
}
