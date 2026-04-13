export function Checkbox({ checked, onChange, color }: { checked: boolean; onChange: () => void; color?: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        border: `2px solid ${checked ? (color || 'var(--color-success)') : 'var(--border-input)'}`,
        background: checked ? (color || 'var(--color-success)') : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}
