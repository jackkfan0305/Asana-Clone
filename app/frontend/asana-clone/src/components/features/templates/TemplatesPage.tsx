const templates = [
  { name: 'Product Launch', icon: '🚀', category: 'Product', description: 'Plan and execute a successful product launch with cross-functional teams.' },
  { name: 'Sprint Planning', icon: '🏃', category: 'Engineering', description: 'Organize sprint backlogs, assign tasks, and track velocity.' },
  { name: 'Marketing Campaign', icon: '📣', category: 'Marketing', description: 'End-to-end campaign management from brief to launch.' },
  { name: 'Bug Tracking', icon: '🐛', category: 'Engineering', description: 'Track, prioritize, and resolve software bugs systematically.' },
  { name: 'Design Review', icon: '🎨', category: 'Design', description: 'Structured design review process with feedback collection.' },
  { name: 'Employee Onboarding', icon: '👋', category: 'HR', description: 'New hire onboarding checklist and resource guide.' },
  { name: 'Content Calendar', icon: '📅', category: 'Marketing', description: 'Plan and schedule content across channels.' },
  { name: 'Event Planning', icon: '🎉', category: 'Operations', description: 'Organize events from venue selection to post-event follow-up.' },
];

export function TemplatesPage() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ font: 'var(--font-h1)', marginBottom: 8 }}>Project Templates</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Start with a pre-built template to get your project up and running quickly.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {templates.map(t => (
          <div key={t.name} style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', overflow: 'hidden',
            border: '1px solid var(--border-default)', cursor: 'pointer', transition: 'border-color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
          >
            <div style={{ height: 80, background: 'linear-gradient(135deg, var(--bg-sidebar), var(--bg-topbar))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
              {t.icon}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{t.name}</span>
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-pill)', color: 'var(--text-secondary)' }}>
                {t.category}
              </span>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.4 }}>{t.description}</p>
              <button style={{ marginTop: 12, padding: '6px 16px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-btn)', fontSize: 12, color: 'var(--text-primary)' }}>
                Use template
              </button>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-placeholder)', padding: '16px 0', textAlign: 'center' }}>
        Templates — read-only stub. Clicking "Use template" does not create a project.
      </p>
    </div>
  );
}
