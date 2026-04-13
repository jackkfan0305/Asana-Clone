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
    'On track': 'var(--color-success)',
    'At risk': 'var(--color-warning)',
    'Off track': 'var(--color-error)',
    'on_track': 'var(--color-success)',
    'at_risk': 'var(--color-warning)',
    'off_track': 'var(--color-error)',
    'High': 'var(--color-error)',
    'Medium': 'var(--color-warning)',
    'Low': 'var(--color-success)',
  };
  const display = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <Badge label={display} color={map[status] || 'var(--text-secondary)'} />;
}
