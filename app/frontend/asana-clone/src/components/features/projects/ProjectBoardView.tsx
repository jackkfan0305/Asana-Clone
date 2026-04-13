import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../../../data/AppContext';
import { Checkbox } from '../../common/Checkbox';
import { Avatar } from '../../common/Avatar';
import { StatusBadge } from '../../common/Badge';

export function ProjectBoardView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { tasks, sections, completeTask, addTask, moveTask, setSelectedTaskId, seed } = useApp();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const project = seed.projects.find(p => p.id === projectId);
  if (!project) return <div>Project not found</div>;

  const projectSections = sections.filter(s => s.projectId === projectId).sort((a, b) => a.position - b.position);
  const projectTasks = tasks.filter(t => t.projectId === projectId && !t.parentTaskId);

  const handleAdd = (sectionId: string) => {
    if (!newTitle.trim()) return;
    addTask({ title: newTitle.trim(), sectionId, projectId: project.id });
    setNewTitle('');
    setAddingTo(null);
  };

  const handleDrop = (sectionId: string) => {
    if (draggedTask) {
      moveTask(draggedTask, sectionId);
      setDraggedTask(null);
    }
  };

  return (
    <div>
      {/* Project header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 20 }}>{project.icon}</span>
        <h1 style={{ font: 'var(--font-h1)' }}>{project.name}</h1>
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-divider)', marginBottom: 16 }}>
        <button onClick={() => navigate(`/project/${projectId}`)} style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>List</button>
        <button style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Board</button>
        <button onClick={() => navigate(`/project/${projectId}/timeline`)} style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>Timeline</button>
      </div>

      {/* Board */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, minHeight: 400 }}>
        {projectSections.map(section => {
          const sectionTasks = projectTasks.filter(t => t.sectionId === section.id);
          return (
            <div
              key={section.id}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(section.id)}
              style={{
                minWidth: 'var(--board-col-width)',
                maxWidth: 'var(--board-col-width)',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-card)',
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, padding: '8px 8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{section.name}</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 12 }}>{sectionTasks.length}</span>
              </div>

              <div style={{ flex: 1 }}>
                {sectionTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTask(task.id)}
                    onClick={() => setSelectedTaskId(task.id)}
                    style={{
                      padding: 12,
                      background: 'var(--bg-content)',
                      borderRadius: 'var(--radius-card)',
                      marginBottom: 8,
                      cursor: 'pointer',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: 8, marginBottom: 8 }}>
                      <Checkbox checked={task.completed} onChange={() => completeTask(task.id)} />
                      <span style={{ fontSize: 13, lineHeight: 1.3 }}>{task.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      {task.customFieldValues.cf1 && <StatusBadge status={task.customFieldValues.cf1} />}
                      {task.customFieldValues.cf2 && <StatusBadge status={task.customFieldValues.cf2} />}
                      <div style={{ flex: 1 }} />
                      {task.dueDate && (
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {task.assigneeId && <Avatar userId={task.assigneeId} size={20} />}
                    </div>
                  </div>
                ))}
              </div>

              {addingTo === section.id ? (
                <div style={{ padding: 8 }}>
                  <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(section.id); if (e.key === 'Escape') setAddingTo(null); }}
                    onBlur={() => { if (newTitle.trim()) handleAdd(section.id); else setAddingTo(null); }}
                    placeholder="Write a task name" style={{ width: '100%', padding: '8px', fontSize: 13, background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 'var(--radius-input)' }}
                  />
                </div>
              ) : (
                <button onClick={() => setAddingTo(section.id)} style={{ color: 'var(--text-placeholder)', fontSize: 12, padding: '8px', textAlign: 'left' }}>
                  + Add task
                </button>
              )}
            </div>
          );
        })}

        {/* Add section column */}
        <div style={{
          minWidth: 'var(--board-col-width)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 16,
        }}>
          <button style={{ color: 'var(--text-placeholder)', fontSize: 13, padding: '8px 16px', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-card)' }}>
            + Add section
          </button>
        </div>
      </div>
    </div>
  );
}
