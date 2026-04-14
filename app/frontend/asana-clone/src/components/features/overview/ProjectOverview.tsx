import { useParams } from 'react-router-dom';
import { users, projectStatusUpdates, teamMembers } from '../../../data/seed';
import { useApp } from '../../../data/AppContext';
import { Avatar } from '../../common/Avatar';
import { Plus, Target, Briefcase, FileText, Link, Circle, Users, User, ClipboardList } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const statusOptions = [
  { value: 'on_track', label: 'On track', color: 'var(--color-success)' },
  { value: 'at_risk', label: 'At risk', color: 'var(--color-warning)' },
  { value: 'off_track', label: 'Off track', color: 'var(--color-error)' },
] as const;

export function ProjectOverview() {
  const { projectId } = useParams();
  const { projects, updateProject } = useApp();
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [projectMembers, setProjectMembers] = useState<string[]>([]);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const addMemberRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const project = projects.find(p => p.id === projectId);

  // Initialize project members from team when project changes
  useEffect(() => {
    if (project) {
      const teamMemberIds = teamMembers
        .filter(tm => tm.teamId === project.teamId)
        .map(tm => tm.userId);
      // Start with owner if not already included
      const initial = new Set([project.ownerId, ...teamMemberIds.slice(0, 2)]);
      setProjectMembers(Array.from(initial));
    }
  }, [project?.id, project?.teamId, project?.ownerId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (addMemberRef.current && !addMemberRef.current.contains(e.target as Node)) {
        setShowAddMember(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus textarea when editing description
  useEffect(() => {
    if (editingDescription && descriptionRef.current) {
      descriptionRef.current.focus();
      descriptionRef.current.selectionStart = descriptionRef.current.value.length;
    }
  }, [editingDescription]);

  if (!project) return <div>Project not found</div>;

  const owner = users.find(u => u.id === project.ownerId);
  const statusColor = statusOptions.find(s => s.value === project.status)?.color || 'var(--text-secondary)';
  const statusLabel = statusOptions.find(s => s.value === project.status)?.label || 'Set status';

  // Team members available to add (not already project members)
  const availableTeamMembers = teamMembers
    .filter(tm => tm.teamId === project.teamId && !projectMembers.includes(tm.userId))
    .map(tm => users.find(u => u.id === tm.userId)!)
    .filter(Boolean);

  const handleDescriptionSave = () => {
    const trimmed = descriptionDraft.trim();
    updateProject(project.id, { description: trimmed });
    setEditingDescription(false);
  };

  const handleAddMember = (userId: string) => {
    setProjectMembers(prev => [...prev, userId]);
    setShowAddMember(false);
  };

  const emptyCard = (children: React.ReactNode) => (
    <div style={{
      border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)',
      padding: '32px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5,
    }}>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
      {/* Left column */}
      <div>
        {/* Project description */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Project description</h3>
          {editingDescription ? (
            <div>
              <textarea
                ref={descriptionRef}
                value={descriptionDraft}
                onChange={e => setDescriptionDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleDescriptionSave(); }
                  if (e.key === 'Escape') { setEditingDescription(false); }
                }}
                style={{
                  width: '100%', minHeight: 80, fontSize: 13, lineHeight: 1.5,
                  background: 'var(--bg-input)', color: 'var(--text-primary)',
                  border: '1px solid var(--color-primary)', borderRadius: 6,
                  padding: '8px 10px', resize: 'vertical', outline: 'none',
                }}
                placeholder="What's this project about?"
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={handleDescriptionSave}
                  style={{
                    padding: '4px 12px', fontSize: 12, borderRadius: 4,
                    background: 'var(--color-primary)', color: '#fff',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingDescription(false)}
                  style={{ padding: '4px 12px', fontSize: 12, borderRadius: 4, color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              onClick={() => { setDescriptionDraft(project.description || ''); setEditingDescription(true); }}
              style={{
                fontSize: 13, color: project.description ? 'var(--text-primary)' : 'var(--text-placeholder)',
                lineHeight: 1.5, cursor: 'pointer', padding: '4px 0',
              }}
            >
              {project.description || "What's this project about? Click to add a description."}
            </p>
          )}
        </div>

        {/* Project roles */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Project roles</h3>
          {/* Owner */}
          {owner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Avatar userId={owner.id} size={28} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{owner.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>Project owner</div>
              </div>
            </div>
          )}
          {/* Other members */}
          {projectMembers
            .filter(uid => uid !== project.ownerId)
            .map(uid => {
              const u = users.find(usr => usr.id === uid);
              if (!u) return null;
              return (
                <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Avatar userId={u.id} size={28} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>Member</div>
                  </div>
                </div>
              );
            })}
          {/* Add member button */}
          <div style={{ position: 'relative' }} ref={addMemberRef}>
            <button
              onClick={() => setShowAddMember(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', padding: '6px 0' }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', border: '1.5px dashed var(--text-placeholder)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus size={14} strokeWidth={2} color="var(--text-placeholder)" />
              </div>
              Add member
            </button>
            {showAddMember && (
              <div style={{
                position: 'absolute', left: 0, top: '100%', marginTop: 4,
                background: '#2a2b2d', border: '1px solid #3a3b3d', borderRadius: 8,
                padding: 4, zIndex: 100, minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                <div style={{ padding: '6px 10px', fontSize: 11, color: 'var(--text-placeholder)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Team members
                </div>
                {availableTeamMembers.length === 0 ? (
                  <div style={{ padding: '8px 10px', fontSize: 13, color: 'var(--text-placeholder)' }}>
                    All team members added
                  </div>
                ) : (
                  availableTeamMembers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleAddMember(u.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', width: '100%',
                        borderRadius: 4, fontSize: 13, color: 'var(--text-primary)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Avatar userId={u.id} size={24} />
                      {u.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Connected goals */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Connected goals</h3>
          {emptyCard(
            <>
              <p style={{ marginBottom: 12 }}>Connect or create a goal to link this project to a larger purpose.</p>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                <Target size={14} strokeWidth={1.8} /> Add goal
              </button>
            </>
          )}
        </div>

        {/* Connected portfolios */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Connected portfolios</h3>
          {emptyCard(
            <>
              <p style={{ marginBottom: 12 }}>Connect a portfolio to link this project to a larger body of work.</p>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                <Briefcase size={14} strokeWidth={1.8} /> Add to portfolio
              </button>
            </>
          )}
        </div>

        {/* Key resources */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Key resources</h3>
          {emptyCard(
            <>
              <p style={{ marginBottom: 12 }}>Align your team around a shared vision with a project brief and supporting resources.</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <FileText size={14} strokeWidth={1.8} /> Create project brief
                </button>
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <Link size={14} strokeWidth={1.8} /> Add links & files
                </button>
              </div>
            </>
          )}
        </div>

        {/* Milestones */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Milestones</h3>
            <button style={{ color: 'var(--text-placeholder)', display: 'flex', alignItems: 'center' }}>
              <Plus size={14} strokeWidth={2} />
            </button>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-placeholder)', padding: '4px 0' }}>
            <Circle size={14} strokeWidth={1.5} /> Add milestone...
          </button>
        </div>
      </div>

      {/* Right column */}
      <div>
        {/* Status section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>What's the status?</span>
            <div style={{ position: 'relative' }} ref={statusDropdownRef}>
              <button
                onClick={() => setShowStatusDropdown(v => !v)}
                style={{
                  padding: '4px 12px', borderRadius: 'var(--radius-btn)', fontSize: 12,
                  border: '1px solid var(--border-default)',
                  color: statusColor,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                {statusLabel} <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>&#9662;</span>
              </button>
              {showStatusDropdown && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 4,
                  background: '#2a2b2d', border: '1px solid #3a3b3d', borderRadius: 8,
                  padding: 4, zIndex: 100, minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}>
                  {statusOptions.map(opt => (
                    <button key={opt.value} onClick={() => {
                      updateProject(project.id, { status: opt.value });
                      setShowStatusDropdown(false);
                    }} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', width: '100%',
                      borderRadius: 4, fontSize: 13, color: opt.color,
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Due date */}
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Circle size={16} strokeWidth={1.5} /> No due date
          </div>

          {/* Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { icon: 'team' as const, title: 'My workspace team joined', userId: null, date: 'Yesterday at 5:01pm' },
              { icon: 'user' as const, title: 'You joined', userId: owner?.id || null, date: 'Yesterday at 5:01pm' },
              { icon: 'project' as const, title: 'Project created', userId: owner?.id || null, date: 'Yesterday at 5:01pm' },
            ].map((event, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 20, position: 'relative' }}>
                {/* Timeline line */}
                {i < 2 && (
                  <div style={{
                    position: 'absolute', left: 11, top: 28, bottom: 0, width: 1,
                    background: 'var(--border-divider)',
                  }} />
                )}
                {/* Icon - use avatar if user, otherwise Lucide icon */}
                {event.userId ? (
                  <div style={{ zIndex: 1, flexShrink: 0 }}>
                    <Avatar userId={event.userId} size={24} />
                  </div>
                ) : (
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: '#2a8a8a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    zIndex: 1,
                  }}>
                    <Users size={12} strokeWidth={2} color="#fff" />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{event.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>{event.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
