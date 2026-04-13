import { useParams } from 'react-router-dom';
import { useApp } from '../../../data/AppContext';
import { Avatar } from '../../common/Avatar';

export function TimelinePage() {
  const { projectId } = useParams();
  const { tasks, sections, seed } = useApp();

  const project = seed.projects.find(p => p.id === (projectId || 'p1'));
  const projectTasks = tasks.filter(t => t.projectId === (projectId || 'p1') && !t.parentTaskId && t.dueDate);
  const projectSections = sections.filter(s => s.projectId === (projectId || 'p1'));

  // Generate week columns
  const weeks: { start: Date; end: Date; label: string }[] = [];
  const start = new Date('2026-04-06');
  for (let i = 0; i < 8; i++) {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weeks.push({ start: weekStart, end: weekEnd, label: `W${15 + i} ${weekStart.getDate()}-${weekEnd.getDate()}` });
  }

  const getBarPosition = (task: typeof projectTasks[0]) => {
    const taskStart = task.startDate ? new Date(task.startDate) : new Date(task.dueDate!);
    const taskEnd = new Date(task.dueDate!);
    const timelineStart = weeks[0].start.getTime();
    const timelineEnd = weeks[weeks.length - 1].end.getTime();
    const totalWidth = timelineEnd - timelineStart;
    const left = Math.max(0, ((taskStart.getTime() - timelineStart) / totalWidth) * 100);
    const width = Math.max(3, ((taskEnd.getTime() - taskStart.getTime()) / totalWidth) * 100);
    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {project && <span style={{ fontSize: 20 }}>{project.icon}</span>}
        <h1 style={{ font: 'var(--font-h1)' }}>{project?.name || 'Timeline'}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button style={{ padding: '4px 8px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-btn)', fontSize: 12 }}>◀</button>
        <button style={{ padding: '4px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-btn)', fontSize: 12 }}>Today</button>
        <button style={{ padding: '4px 8px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-btn)', fontSize: 12 }}>▶</button>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Weeks</span>
        <button style={{ fontSize: 12, color: 'var(--text-secondary)' }}>+</button>
        <button style={{ fontSize: 12, color: 'var(--text-secondary)' }}>−</button>
        <div style={{ flex: 1 }} />
        <button style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Filter</button>
        <button style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sort</button>
      </div>

      {/* Timeline header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-divider)' }}>
        <div style={{ width: 200, flexShrink: 0, padding: '8px', fontSize: 12, color: 'var(--text-secondary)' }}>Task</div>
        <div style={{ flex: 1, display: 'flex' }}>
          {weeks.map((w, i) => (
            <div key={i} style={{ flex: 1, padding: '8px 4px', fontSize: 11, color: 'var(--text-placeholder)', textAlign: 'center', borderLeft: '1px solid var(--border-divider)' }}>
              {w.label}
            </div>
          ))}
        </div>
      </div>

      {/* Sections and tasks */}
      {projectSections.map(section => {
        const sectionTasks = projectTasks.filter(t => t.sectionId === section.id);
        return (
          <div key={section.id}>
            <div style={{ padding: '8px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid var(--border-divider)' }}>
              {section.name}
            </div>
            {sectionTasks.map(task => {
              const pos = getBarPosition(task);
              return (
                <div key={task.id} style={{ display: 'flex', borderBottom: '1px solid var(--border-divider)', minHeight: 36 }}>
                  <div style={{ width: 200, flexShrink: 0, padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <Avatar userId={task.assigneeId} size={18} />
                    <span className="truncate">{task.title}</span>
                  </div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    {weeks.map((_, i) => (
                      <div key={i} style={{ position: 'absolute', left: `${(i / weeks.length) * 100}%`, top: 0, bottom: 0, borderLeft: '1px solid var(--border-divider)' }} />
                    ))}
                    <div style={{
                      position: 'absolute',
                      left: pos.left,
                      width: pos.width,
                      top: 6,
                      height: 24,
                      background: project?.color || 'var(--color-primary)',
                      borderRadius: 4,
                      opacity: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 6,
                      fontSize: 10,
                      color: '#fff',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}>
                      {task.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <p style={{ fontSize: 11, color: 'var(--text-placeholder)', padding: '16px 0', textAlign: 'center' }}>
        Timeline view — read-only stub. Drag-to-resize and dependency editing not available.
      </p>
    </div>
  );
}
