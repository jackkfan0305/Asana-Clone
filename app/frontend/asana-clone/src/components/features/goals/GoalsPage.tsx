import { useState } from 'react';
import { goals, teams, currentUserId } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';
import { StatusBadge } from '../../common/Badge';
import { ProgressBar } from '../../common/ProgressBar';

type Tab = 'team' | 'my' | 'strategy';

export function GoalsPage() {
  const [tab, setTab] = useState<Tab>('team');

  const topLevel = goals.filter(g => !g.parentGoalId);
  const myGoals = goals.filter(g => g.ownerId === currentUserId);

  const renderGoal = (goal: typeof goals[0], depth = 0) => {
    const team = teams.find(t => t.id === goal.teamId);
    const children = goals.filter(g => g.parentGoalId === goal.id);

    return (
      <div key={goal.id}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 80px 120px 100px 100px 80px',
          gap: 12, padding: '10px 0 10px ' + (depth * 24 + 12) + 'px',
          borderBottom: '1px solid var(--border-divider)', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {children.length > 0 && <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>▼</span>}
            <span style={{ fontSize: 13 }}>{goal.name}</span>
          </div>
          <StatusBadge status={goal.status} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ProgressBar value={goal.progress} color={goal.status === 'on_track' ? 'var(--color-success)' : goal.status === 'at_risk' ? 'var(--color-warning)' : 'var(--color-error)'} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{goal.progress}%</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{goal.timePeriod}</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{team?.name}</span>
          <Avatar userId={goal.ownerId} size={20} />
        </div>
        {children.map(child => renderGoal(child, depth + 1))}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 10.5 }}>
        <h1 style={{ font: 'var(--font-h1)' }}>Goals</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
        {([['strategy', 'Strategy map'], ['team', 'Team goals'], ['my', 'My goals']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as Tab)} style={{
            padding: '8px 16px', fontSize: 13,
            color: tab === key ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: tab === key ? '2px solid var(--color-primary)' : '2px solid transparent',
          }}>
            {label}
          </button>
        ))}
      </div>
      {/* Full-width separator connecting to sidebar */}
      <div style={{ height: 1, background: '#404244', margin: '0.5px -24px 16px' }} />

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 80px 120px 100px 100px 80px',
        gap: 12, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-table)',
      }}>
        <span>Name</span><span>Status</span><span>Progress</span><span>Time period</span><span>Team</span><span>Owner</span>
      </div>

      {tab === 'strategy' && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-placeholder)' }}>
          <p style={{ fontSize: 14, marginBottom: 8 }}>Strategy Map</p>
          <p style={{ fontSize: 12 }}>Visual goal hierarchy — stub view</p>
          <div style={{ marginTop: 16 }}>
            {topLevel.map(g => renderGoal(g))}
          </div>
        </div>
      )}

      {tab === 'team' && topLevel.map(g => renderGoal(g))}
      {tab === 'my' && myGoals.map(g => renderGoal(g))}

      <p style={{ fontSize: 11, color: 'var(--text-placeholder)', padding: '16px 0', textAlign: 'center' }}>
        Goals — read-only stub. Create and edit functionality not available.
      </p>
    </div>
  );
}
