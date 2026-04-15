import { users } from '../../data/seed';

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const COLORS = ['#e8384f', '#fd612c', '#fd9a00', '#eec300', '#a4cf30', '#4ecbc4', '#4573d2', '#b36bd4'];

function initialsColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function Avatar({ userId, size = 24, name }: { userId: string | null; size?: number; name?: string }) {
  const user = users.find(u => u.id === userId);
  if (user) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        title={user.name}
        style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'var(--bg-input)' }}
      />
    );
  }
  // Fallback: show initials if name is provided
  if (name) {
    return (
      <div
        title={name}
        style={{
          width: size, height: size, borderRadius: '50%', flexShrink: 0,
          background: initialsColor(name),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4, fontWeight: 600, color: '#fff',
        }}
      >
        {getInitials(name)}
      </div>
    );
  }
  return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--bg-input)', flexShrink: 0 }} />;
}

export function AvatarGroup({ userIds, size = 24, max = 3 }: { userIds: string[]; size?: number; max?: number }) {
  const shown = userIds.slice(0, max);
  const extra = userIds.length - max;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((id, i) => (
        <div key={id} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: max - i }}>
          <Avatar userId={id} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -8, width: size, height: size, borderRadius: '50%',
          background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: 'var(--text-secondary)', border: '2px solid var(--bg-content)'
        }}>+{extra}</div>
      )}
    </div>
  );
}
