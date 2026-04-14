import { useState } from 'react';
import { useApp } from '../../../data/AppContext';

export function CalendarPage() {
  const { tasks, setSelectedTaskId, projects, seed } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date('2026-04-01'));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date('2026-04-13');

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.dueDate && t.dueDate.startsWith(dateStr) && !t.parentTaskId);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date('2026-04-01'));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
        <h1 style={{ font: 'var(--font-h1)' }}>Calendar</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevMonth} style={{ padding: '4px 8px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-btn)' }}>◀</button>
          <button onClick={goToday} style={{ padding: '4px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-btn)', fontSize: 12 }}>Today</button>
          <button onClick={nextMonth} style={{ padding: '4px 8px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-btn)' }}>▶</button>
          <span style={{ fontWeight: 500, minWidth: 120, textAlign: 'center' }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Filter</button>
          <button style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Project: All</button>
        </div>
      </div>
      {/* Full-width separator connecting to sidebar */}
      <div style={{ height: 1, background: '#404244', margin: '12px -24px 16px' }} />

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 1 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ padding: '8px', textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border-divider)' }}>
        {days.map((day, i) => {
          if (day === null) return <div key={i} style={{ background: 'var(--bg-content)', minHeight: 100 }} />;
          const dayTasks = getTasksForDay(day);
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
            <div key={i} style={{ background: 'var(--bg-content)', minHeight: 100, padding: 4 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: isToday ? 600 : 400,
                background: isToday ? 'var(--color-primary)' : 'transparent',
                color: isToday ? '#fff' : 'var(--text-primary)',
                marginBottom: 4,
              }}>
                {day}
              </div>
              {dayTasks.slice(0, 3).map(task => {
                const project = projects.find(p => p.id === task.projectId);
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    style={{
                      padding: '2px 6px', marginBottom: 2, borderRadius: 4, fontSize: 11,
                      background: `${project?.color || 'var(--color-primary)'}22`,
                      color: project?.color || 'var(--color-primary)',
                      cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {task.title}
                  </div>
                );
              })}
              {dayTasks.length > 3 && (
                <div style={{ fontSize: 10, color: 'var(--text-placeholder)', padding: '2px 6px' }}>
                  +{dayTasks.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
