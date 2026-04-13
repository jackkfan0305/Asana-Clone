import { projects } from '../../../data/seed';

export function FormsPage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ font: 'var(--font-h1)' }}>Forms</h1>
        <button style={{ background: 'var(--color-primary)', color: '#fff', padding: '8px 16px', borderRadius: 'var(--radius-btn)', fontSize: 13 }}>
          + Create Form
        </button>
      </div>

      {/* Sample form */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 24, border: '1px solid var(--border-default)', maxWidth: 600, marginBottom: 24 }}>
        <h2 style={{ font: 'var(--font-h2)', marginBottom: 4 }}>Bug Report Form</h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>Linked to: {projects[0].name}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Bug Title *</label>
            <input placeholder="Enter a title for the bug" style={{ width: '100%' }} readOnly />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Description</label>
            <textarea placeholder="Describe the bug..." style={{ width: '100%', minHeight: 80, resize: 'vertical' }} readOnly />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Priority</label>
            <select style={{ width: '100%' }} disabled>
              <option>Select priority...</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Due Date</label>
            <input type="date" style={{ width: '100%' }} readOnly />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Attachments</label>
            <div style={{ padding: '20px', border: '2px dashed var(--border-default)', borderRadius: 'var(--radius-input)', textAlign: 'center', color: 'var(--text-placeholder)', fontSize: 12 }}>
              Drop files here or click to upload
            </div>
          </div>
        </div>

        <button style={{ marginTop: 20, padding: '8px 24px', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-btn)', fontSize: 13, opacity: 0.5 }} disabled>
          Submit
        </button>
      </div>

      {/* Submissions list */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 16, border: '1px solid var(--border-default)' }}>
        <h3 style={{ font: 'var(--font-h3)', marginBottom: 12 }}>Recent Submissions</h3>
        {['Login page crash on mobile', 'API timeout on large payloads', 'Dark mode text contrast issue'].map((title, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border-divider)', fontSize: 13 }}>
            <span style={{ flex: 1 }}>{title}</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Apr {10 + i}, 2026</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-placeholder)', padding: '16px 0', textAlign: 'center' }}>
        Forms — read-only stub. Form builder and real submissions not available.
      </p>
    </div>
  );
}
