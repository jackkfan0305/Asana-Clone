export function Badge({ label, color, size = 'sm' }: { label: string; color: string; size?: 'sm' | 'md' }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      borderRadius: 'var(--radius-pill)',
      fontSize: size === 'sm' ? 11 : 12,
      fontWeight: 500,
      background: `${color}22`,
      color,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'On track': '#6bb5e0',
    'At risk': '#f0d26b',
    'Off track': '#f09a9a',
    'on_track': '#6bb5e0',
    'at_risk': '#f0d26b',
    'off_track': '#f09a9a',
    'High': '#c27aeb',
    'Medium': '#f0b849',
    'Low': '#5da283',
  };
  const display = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <Badge label={display} color={map[status] || 'var(--text-secondary)'} />;
}
