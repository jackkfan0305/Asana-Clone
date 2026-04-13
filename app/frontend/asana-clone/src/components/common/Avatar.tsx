import { users } from '../../data/seed';

export function Avatar({ userId, size = 24 }: { userId: string | null; size?: number }) {
  const user = users.find(u => u.id === userId);
  if (!user) return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--bg-input)', flexShrink: 0 }} />;
  return (
    <img
      src={user.avatarUrl}
      alt={user.name}
      title={user.name}
      style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'var(--bg-input)' }}
    />
  );
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
