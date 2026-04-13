export function ProgressBar({ value, max = 100, color = 'var(--color-primary)' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{
      height: 6, borderRadius: 3, background: 'var(--bg-input)', overflow: 'hidden', width: '100%', minWidth: 60
    }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
  );
}
