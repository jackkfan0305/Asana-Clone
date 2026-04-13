import { useState } from 'react';
import { useApp } from '../../../data/AppContext';
import { users, currentUserId, dependencies } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';
import { StatusBadge } from '../../common/Badge';
import { X, Calendar, Share2, Plus, Info, ChevronDown } from 'lucide-react';

export function TaskDetailPane() {
  const { tasks, selectedTaskId, setSelectedTaskId, updateTask, completeTask, comments, addComment, likeComment, seed } = useApp();
  const [commentText, setCommentText] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const task = tasks.find(t => t.id === selectedTaskId);
  if (!task) return null;

  const assignee = users.find(u => u.id === task.assigneeId);
  const project = seed.projects.find(p => p.id === task.projectId);
  const section = seed.sections.find(s => s.id === task.sectionId);
  const taskComments = comments.filter(c => c.taskId === task.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const taskDeps = dependencies.filter(d => d.taskId === task.id || d.dependsOnTaskId === task.id);

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    addComment(task.id, commentText.trim());
    setCommentText('');
  };

  const startEditTitle = () => {
    setTitleValue(task.title);
    setEditingTitle(true);
  };

  const saveTitle = () => {
    if (titleValue.trim() && titleValue !== task.title) {
      updateTask(task.id, { title: titleValue.trim() });
    }
    setEditingTitle(false);
  };

  const formatDate = () => {
    if (!task.dueDate) return null;
    const due = new Date(task.dueDate);
    const dueFmt = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (task.startDate) {
      const start = new Date(task.startDate);
      const startFmt = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startFmt} – ${dueFmt}`;
    }
    return dueFmt;
  };

  const fieldLabelStyle: React.CSSProperties = {
    fontSize: 12, color: 'var(--text-secondary)', minWidth: 90, paddingTop: 2,
  };

  const fieldRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0',
  };

  return (
    <div style={{
      width: '50%',
      minWidth: 400,
      maxWidth: 600,
      borderLeft: '1px solid var(--border-divider)',
      background: '#1D1F21',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--border-divider)' }}>
        {/* Mark complete button */}
        <button
          onClick={() => completeTask(task.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 'var(--radius-btn)', fontSize: 12, fontWeight: 400,
            border: `1px solid ${task.completed ? '#5da283' : 'var(--border-input)'}`,
            color: task.completed ? '#5da283' : 'var(--text-primary)',
            background: task.completed ? 'rgba(93,162,131,0.1)' : 'transparent',
          }}
        >
          {task.completed ? '✓ Completed' : '✓ Mark complete'}
        </button>

        <div style={{ flex: 1 }} />

        {/* Assignee avatar + add */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar userId={task.assigneeId} size={24} />
          <button style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
            <Plus size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* Share */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', fontSize: 12, color: 'var(--text-secondary)',
          borderRadius: 'var(--radius-btn)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Share2 size={12} strokeWidth={1.8} />
          Share
        </button>

        {/* Close */}
        <button onClick={() => setSelectedTaskId(null)} style={{ color: 'var(--text-secondary)', display: 'flex', padding: 4, borderRadius: 4 }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {/* Visibility notice */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
          This task is visible to everyone in My workspace.
          <Info size={12} strokeWidth={1.8} style={{ color: 'var(--text-placeholder)' }} />
        </div>

        {/* Title */}
        {editingTitle ? (
          <input autoFocus value={titleValue} onChange={e => setTitleValue(e.target.value)}
            onBlur={saveTitle} onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
            style={{ fontSize: 20, fontWeight: 500, width: '100%', background: 'transparent', border: 'none', padding: 0, marginBottom: 20, color: 'var(--text-primary)' }}
          />
        ) : (
          <h2 onClick={startEditTitle} style={{ fontSize: 20, fontWeight: 500, marginBottom: 20, cursor: 'text' }}>{task.title}</h2>
        )}

        {/* Fields */}
        <div style={{ marginBottom: 20 }}>
          {/* Assignee */}
          <div style={fieldRowStyle}>
            <span style={fieldLabelStyle}>Assignee</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar userId={task.assigneeId} size={22} />
              <span style={{ fontSize: 13 }}>{assignee?.name || 'Unassigned'}</span>
              {assignee && (
                <button
                  onClick={() => updateTask(task.id, { assigneeId: undefined })}
                  style={{ color: 'var(--text-placeholder)', display: 'flex', padding: 2 }}
                >
                  <X size={12} strokeWidth={2} />
                </button>
              )}
              <span style={{ fontSize: 12, color: 'var(--text-placeholder)' }}>
                Recently assigned
                <ChevronDown size={10} strokeWidth={2} style={{ marginLeft: 2, verticalAlign: 'middle' }} />
              </span>
            </div>
          </div>

          {/* Due date */}
          <div style={fieldRowStyle}>
            <span style={fieldLabelStyle}>Due date</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={13} strokeWidth={1.8} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: 13 }}>
                {formatDate() || 'No due date'}
              </span>
              {task.dueDate && (
                <button
                  onClick={() => updateTask(task.id, { dueDate: null })}
                  style={{ color: 'var(--text-placeholder)', display: 'flex', padding: 2 }}
                >
                  <X size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          {/* Dependencies */}
          <div style={fieldRowStyle}>
            <span style={fieldLabelStyle}>Dependencies</span>
            <div>
              {taskDeps.length > 0 ? taskDeps.map((d, i) => {
                const depTask = tasks.find(t => t.id === (d.taskId === task.id ? d.dependsOnTaskId : d.taskId));
                return <span key={i} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.type === 'blocked_by' ? 'Blocked by' : 'Blocking'}: {depTask?.title}</span>;
              }) : <span style={{ color: 'var(--text-placeholder)', fontSize: 13, cursor: 'pointer' }}>Add dependencies</span>}
            </div>
          </div>
        </div>

        {/* Projects section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Projects</span>
              {project && <span style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-input)', borderRadius: 8, padding: '0 5px' }}>1</span>}
              <button style={{ color: 'var(--text-placeholder)', display: 'flex' }}>
                <Plus size={13} strokeWidth={2} />
              </button>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-link)', cursor: 'pointer' }}>Send feedback</span>
          </div>

          {project && (
            <div style={{ paddingLeft: 4 }}>
              {/* Project name row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: project.color }} />
                <span style={{ fontSize: 13 }}>{project.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {section?.name || 'No section'}
                  <ChevronDown size={10} strokeWidth={2} style={{ marginLeft: 2, verticalAlign: 'middle' }} />
                </span>
              </div>

              {/* Custom fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 16 }}>
                {task.customFieldValues.cf1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 60 }}>Priority</span>
                    <StatusBadge status={task.customFieldValues.cf1} />
                  </div>
                )}
                {task.customFieldValues.cf2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 60 }}>Status</span>
                    <StatusBadge status={task.customFieldValues.cf2} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border-divider)', margin: '8px 0 16px' }} />

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Description</div>
          <textarea
            placeholder="What is this task about?"
            value={task.description}
            onChange={e => updateTask(task.id, { description: e.target.value })}
            style={{
              width: '100%', minHeight: 60, resize: 'vertical',
              background: 'transparent', border: '1px solid transparent', borderRadius: 'var(--radius-input)',
              padding: 8, fontSize: 13, color: 'var(--text-primary)',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
            onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
          />
        </div>

        {/* Comments & Activity */}
        {taskComments.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {taskComments.map(comment => {
              const author = users.find(u => u.id === comment.authorId);
              return (
                <div key={comment.id} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <Avatar userId={comment.authorId} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{author?.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>
                        {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--text-primary)', marginBottom: 4 }}>{comment.body}</p>
                    <button onClick={() => likeComment(comment.id)} style={{ fontSize: 12, color: comment.likes.includes(currentUserId) ? 'var(--color-primary)' : 'var(--text-placeholder)' }}>
                      👍 {comment.likes.length > 0 && comment.likes.length}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comment input — fixed at bottom */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-divider)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Avatar userId={currentUserId} size={28} />
        <div style={{ flex: 1 }}>
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitComment(); }}
            placeholder="Add a comment"
            style={{
              width: '100%', minHeight: 36, resize: 'none', fontSize: 13,
              background: 'var(--bg-input)', border: '1px solid var(--border-input)',
              borderRadius: 'var(--radius-input)', padding: 8, color: 'var(--text-primary)',
            }}
          />
          {commentText.trim() && (
            <button onClick={handleSubmitComment} style={{
              marginTop: 4, padding: '4px 12px',
              background: 'var(--color-primary)', color: '#fff',
              borderRadius: 'var(--radius-btn)', fontSize: 12,
            }}>
              Comment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
