import { useState } from 'react';
import { useApp } from '../../../data/AppContext';
import { Avatar } from '../../common/Avatar';
import { Filter, ArrowUpDown, Rows3, MoreHorizontal, Plus, X, Sparkles, ChevronDown } from 'lucide-react';

type Tab = 'activity' | 'bookmarks' | 'archive' | 'mentioned';

export function InboxPage() {
  const { notifications, markRead, archiveAll, setSelectedTaskId } = useApp();
  const [tab, setTab] = useState<Tab>('activity');
  const [showSummary, setShowSummary] = useState(true);

  const filtered = notifications.filter(n => {
    if (tab === 'activity') return !n.archived;
    if (tab === 'bookmarks') return n.bookmarked && !n.archived;
    if (tab === 'archive') return n.archived;
    if (tab === 'mentioned') return n.type === 'mentioned' && !n.archived;
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const today = filtered.filter(n => new Date(n.createdAt).toDateString() === new Date('2026-04-13').toDateString());
  const earlier = filtered.filter(n => new Date(n.createdAt).toDateString() !== new Date('2026-04-13').toDateString());

  const renderGroup = (label: string, items: typeof filtered) => {
    if (items.length === 0) return null;
    return (
      <div key={label}>
        <div style={{ padding: '16px 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        {items.map(n => (
          <div
            key={n.id}
            onClick={() => { markRead(n.id); if (n.taskId) setSelectedTaskId(n.taskId); }}
            style={{
              display: 'flex', gap: 10, padding: '8px 8px', borderRadius: 'var(--radius-btn)',
              cursor: 'pointer', alignItems: 'flex-start',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-row-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Checkbox circle */}
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              border: '1.5px solid var(--text-placeholder)',
              flexShrink: 0, marginTop: 2,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{n.preview}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Avatar userId={n.actorId} size={20} />
                <span style={{ fontSize: 12, color: 'var(--text-placeholder)' }}>
                  {new Date(n.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            </div>
            {/* Unread dot on right */}
            {!n.read && (
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#4573d2', flexShrink: 0, marginTop: 6,
              }} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ background: '#1D1F21', margin: '-16px -24px', padding: '16px 24px', minHeight: 'calc(100vh - var(--topbar-height))' }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 400 }}>Inbox</h1>
        <button
          style={{ color: 'var(--text-secondary)', fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius-btn)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Manage notifications
        </button>
      </div>

      {/* Tabs — directly below title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderBottom: '1px solid var(--border-divider)', marginBottom: 8 }}>
        {(['activity', 'bookmarks', 'archive', 'mentioned'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 12px 8px', fontSize: 13,
            color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: tab === t ? '2px solid var(--text-primary)' : '2px solid transparent',
            fontWeight: tab === t ? 500 : 400,
            marginBottom: -1,
          }}>
            {t === 'mentioned' ? '@Mentioned' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        {/* + button */}
        <button style={{
          padding: '6px 8px 8px', color: 'var(--text-placeholder)', display: 'flex', alignItems: 'center',
          marginBottom: -1,
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-placeholder)'}
        >
          <Plus size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 12 }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
          fontSize: 12, color: 'var(--text-secondary)', borderRadius: 'var(--radius-btn)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Filter size={12} strokeWidth={1.8} />
          Filter
        </button>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
          fontSize: 12, color: 'var(--text-secondary)', borderRadius: 'var(--radius-btn)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <ArrowUpDown size={12} strokeWidth={1.8} />
          Sort: Newest
        </button>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
          fontSize: 12, color: 'var(--text-secondary)', borderRadius: 'var(--radius-btn)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Rows3 size={12} strokeWidth={1.8} />
          Density: Detailed
        </button>
        <div style={{ flex: 1 }} />
        <button style={{
          display: 'flex', alignItems: 'center', padding: '4px 6px',
          color: 'var(--text-secondary)', borderRadius: 'var(--radius-btn)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <MoreHorizontal size={16} strokeWidth={1.8} />
        </button>
      </div>

      {/* Inbox Summary card */}
      {showSummary && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-card)',
          padding: '16px 20px', marginBottom: 16, marginLeft: 40, marginRight: 40,
          border: '1px solid var(--border-default)', position: 'relative',
        }}>
          {/* Close button */}
          <button
            onClick={() => setShowSummary(false)}
            style={{
              position: 'absolute', top: 12, right: 12,
              color: 'var(--text-placeholder)', display: 'flex', padding: 4, borderRadius: 4,
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-placeholder)'}
          >
            <X size={16} strokeWidth={2} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Sparkles size={16} strokeWidth={1.8} style={{ color: '#f06a6a' }} />
            <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>Inbox Summary</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
            Summarize your most important and actionable notifications with Asana AI.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: 'var(--text-secondary)', padding: '4px 8px',
              borderRadius: 'var(--radius-btn)', border: '1px solid var(--border-default)',
            }}>
              Timeframe: Past week
              <ChevronDown size={11} strokeWidth={2} />
            </button>
            <button style={{
              padding: '6px 14px', fontSize: 13, color: 'var(--text-primary)',
              borderRadius: 'var(--radius-btn)', border: '1px solid var(--border-default)',
              background: 'transparent', fontWeight: 500,
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              View summary
            </button>
          </div>
        </div>
      )}

      {/* Notification list */}
      {renderGroup('Today', today)}
      {renderGroup('Earlier', earlier)}

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-placeholder)', padding: 32 }}>No notifications</p>
      )}

      {/* Archive all */}
      {tab === 'activity' && filtered.length > 0 && (
        <button
          onClick={archiveAll}
          style={{ color: 'var(--text-link)', fontSize: 13, padding: '16px 0', display: 'block' }}
        >
          Archive all notifications
        </button>
      )}
    </div>
  );
}
