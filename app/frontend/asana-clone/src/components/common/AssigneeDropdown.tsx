import { useState, useRef, useEffect } from 'react';
import { users, currentUserId, teamMembers } from '../../data/seed';
import { Avatar } from './Avatar';
import { X, Check } from 'lucide-react';
import type { User } from '../../types';

interface AssigneeDropdownProps {
  /** Currently selected assignee ID (null = unassigned) */
  assigneeId: string | null;
  /** Called when the user selects an assignee */
  onSelect: (userId: string | null) => void;
  /** Team ID — filters the user list to that team's members */
  teamId?: string;
  /** Position the popover relative to the trigger (default: below-left) */
  position?: 'below-left' | 'below-right';
  /** Called when the dropdown is closed */
  onClose: () => void;
}

export function AssigneeDropdown({ assigneeId, onSelect, teamId, position = 'below-left', onClose }: AssigneeDropdownProps) {
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Build assignable user list
  const teamUserIds = teamId
    ? teamMembers.filter(tm => tm.teamId === teamId).map(tm => tm.userId)
    : [];

  const assignableUsers: User[] = teamUserIds.length > 0
    ? users.filter(u => teamUserIds.includes(u.id) || u.id === currentUserId)
    : users;

  const filtered = search
    ? assignableUsers.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
    : assignableUsers;

  const positionStyle: React.CSSProperties = position === 'below-right'
    ? { right: 0 }
    : { left: 0 };

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', top: '100%', marginTop: 4, zIndex: 200,
        width: 300, background: 'var(--bg-card)', border: '1px solid var(--border-divider)',
        borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        ...positionStyle,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 12px 8px',
        borderBottom: '1px solid var(--border-divider)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Assignee</span>
        <button
          onClick={onClose}
          style={{ color: 'var(--text-secondary)', display: 'flex', padding: 2, cursor: 'pointer', background: 'transparent', borderRadius: 4 }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Search + Assign to Me */}
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Name or email"
          style={{
            flex: 1, padding: '6px 10px', fontSize: 12,
            background: 'var(--bg-input)', border: '1px solid var(--border-input)',
            borderRadius: 'var(--radius-input)', color: 'var(--text-primary)',
          }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>or</span>
        <button
          onClick={() => { onSelect(currentUserId); onClose(); }}
          style={{
            padding: '6px 12px', fontSize: 12, fontWeight: 500,
            background: 'transparent', border: '1px solid var(--border-input)',
            borderRadius: 'var(--radius-input)', color: 'var(--text-primary)',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Assign to Me
        </button>
      </div>

      {/* User list */}
      <div style={{ maxHeight: 220, overflow: 'auto', padding: '4px 0' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-placeholder)', textAlign: 'center' }}>
            No teammates found
          </div>
        ) : filtered.map(user => (
          <button
            key={user.id}
            onClick={() => { onSelect(user.id); onClose(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '8px 12px', textAlign: 'left',
              background: user.id === assigneeId ? 'var(--bg-sidebar-hover)' : 'transparent',
              cursor: 'pointer', transition: 'background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = user.id === assigneeId ? 'var(--bg-sidebar-hover)' : 'transparent'}
          >
            <Avatar userId={user.id} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>{user.email}</div>
            </div>
            {user.id === assigneeId && (
              <Check size={14} strokeWidth={2} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
