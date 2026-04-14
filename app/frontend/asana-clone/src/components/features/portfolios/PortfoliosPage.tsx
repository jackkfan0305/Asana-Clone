import { useState } from 'react';
import { portfolios, projects, users } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';
import { StatusBadge } from '../../common/Badge';
import { ProgressBar } from '../../common/ProgressBar';
import { useApp } from '../../../data/AppContext';

export function PortfoliosPage() {
  const { tasks } = useApp();
  const [tab, setTab] = useState<'recent' | 'all'>('recent');

  return (
    <div>
      <div style={{ marginBottom: 10.5 }}>
        <h1 style={{ font: 'var(--font-h1)' }}>Portfolios</h1>
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
        <button onClick={() => setTab('recent')} style={{
          padding: '8px 16px', fontSize: 13,
          color: tab === 'recent' ? 'var(--text-primary)' : 'var(--text-secondary)',
          borderBottom: tab === 'recent' ? '2px solid var(--color-primary)' : '2px solid transparent',
        }}>Recent and starred</button>
        <button onClick={() => setTab('all')} style={{
          padding: '8px 16px', fontSize: 13,
          color: tab === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
          borderBottom: tab === 'all' ? '2px solid var(--color-primary)' : '2px solid transparent',
        }}>Browse all</button>
      </div>
      {/* Full-width separator connecting to sidebar */}
      <div style={{ height: 1, background: '#404244', margin: '0.5px -24px 16px' }} />

      {portfolios.map(portfolio => {
        const owner = users.find(u => u.id === portfolio.ownerId);
        const portProjects = portfolio.projectIds.map(id => projects.find(p => p.id === id)!).filter(Boolean);

        return (
          <div key={portfolio.id} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 20, marginBottom: 16, border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ font: 'var(--font-h2)' }}>{portfolio.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar userId={portfolio.ownerId} size={24} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{owner?.name}</span>
              </div>
            </div>

            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 80px 140px 80px',
              gap: 12, padding: '8px 0', fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-table)',
            }}>
              <span>Name</span><span>Status</span><span>Budget</span><span>Task Progress</span><span>Owner</span>
            </div>

            {portProjects.map(p => {
              const projectTasks = tasks.filter(t => t.projectId === p.id && !t.parentTaskId);
              const completed = projectTasks.filter(t => t.completed).length;
              const total = projectTasks.length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div key={p.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 80px 140px 80px',
                  gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-divider)', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                    <span style={{ fontSize: 13 }}>{p.name}</span>
                  </div>
                  <StatusBadge status={p.status} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>—</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ProgressBar value={pct} />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{pct}%</span>
                  </div>
                  <Avatar userId={p.ownerId} size={20} />
                </div>
              );
            })}
          </div>
        );
      })}

      <p style={{ fontSize: 11, color: 'var(--text-placeholder)', padding: '16px 0', textAlign: 'center' }}>
        Portfolios — read-only stub. Add/remove projects not available.
      </p>
    </div>
  );
}
