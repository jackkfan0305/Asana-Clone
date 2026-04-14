import { useParams } from 'react-router-dom';
import { useApp } from '../../../data/AppContext';

export function WorkflowPage() {
  const { projectId } = useParams();
  const { sections, tasks } = useApp();
  const projectSections = sections.filter(s => s.projectId === (projectId || 'p1'));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Start building your workflow in two minutes</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* Left panel - task intake */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 20, border: '1px solid var(--border-default)' }}>
          <h3 style={{ font: 'var(--font-h3)', marginBottom: 16 }}>How will tasks be added?</h3>
          {[
            { icon: '➕', label: 'Manually add tasks', desc: 'Team members create tasks directly' },
            { icon: '📋', label: 'Form submissions', desc: 'External users submit via forms' },
            { icon: '📄', label: 'Task templates', desc: 'Pre-configured task templates' },
            { icon: '🔗', label: 'From other apps', desc: 'Integrations and automations' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', gap: 12, padding: '12px', borderRadius: 'var(--radius-btn)', cursor: 'pointer', marginBottom: 4,
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-row-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Right panel - section automation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {projectSections.map(section => {
            const sectionTasks = tasks.filter(t => t.projectId === (projectId || 'p1') && t.sectionId === section.id && !t.parentTaskId);
            const incomplete = sectionTasks.filter(t => !t.completed).length;

            return (
              <div key={section.id} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 16, border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ font: 'var(--font-h3)' }}>{section.name}</h3>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{incomplete} incomplete</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  When tasks move to this section, what should happen automatically?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-content)', borderRadius: 'var(--radius-btn)', fontSize: 12 }}>
                    <span>👤</span> Set assignee to...
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-content)', borderRadius: 'var(--radius-btn)', fontSize: 12 }}>
                    <span>👥</span> Add collaborators...
                  </div>
                  <button style={{ color: 'var(--text-link)', fontSize: 12, textAlign: 'left', padding: '4px 12px' }}>
                    + More actions
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-placeholder)', padding: '16px 0', textAlign: 'center' }}>
        Workflow Builder — read-only stub. Actual automation execution not available.
      </p>
    </div>
  );
}
