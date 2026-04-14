import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerCalendarProps {
  /** Currently selected due date (YYYY-MM-DD string or null) */
  dueDate: string | null;
  /** Currently selected start date (YYYY-MM-DD string or null) */
  startDate?: string | null;
  /** Called when a due date is selected */
  onSelectDueDate: (date: string | null) => void;
  /** Called when a start date is selected (if range mode) */
  onSelectStartDate?: (date: string | null) => void;
  /** Whether to show start+due range inputs (false = due-date-only mode) */
  rangeMode?: boolean;
  /** Position the popover */
  position?: 'below-left' | 'below-right';
  /** Called when the picker is closed */
  onClose: () => void;
}

export function DatePickerCalendar({
  dueDate,
  startDate = null,
  onSelectDueDate,
  onSelectStartDate,
  rangeMode = false,
  position = 'below-left',
  onClose,
}: DatePickerCalendarProps) {
  const ref = useRef<HTMLDivElement>(null);

  const initialMonth = (() => {
    const refDate = dueDate || startDate;
    if (refDate) {
      const d = new Date(refDate + 'T00:00:00');
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  })();

  const [calMonth, setCalMonth] = useState(initialMonth);
  const [mode, setMode] = useState<'start' | 'due'>(() => {
    if (!rangeMode) return 'due';
    if (startDate && !dueDate) return 'due';
    return 'start';
  });
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const firstDay = new Date(calMonth.year, calMonth.month, 1).getDay();
  const monthName = new Date(calMonth.year, calMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const toDateStr = (day: number) =>
    `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const toDateStrFull = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const formatInputDate = (d: string | null) => {
    if (!d) return '';
    const date = new Date(d + 'T00:00:00');
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${String(date.getFullYear()).slice(2)}`;
  };

  const prevMonth = () => setCalMonth(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const nextMonth = () => setCalMonth(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });

  // Range logic
  const effectiveStart = startDate;
  const effectiveDue = rangeMode && mode === 'due' && startDate && !dueDate && hoveredDay
    ? hoveredDay
    : dueDate;
  const isPreview = rangeMode && mode === 'due' && startDate && !dueDate && hoveredDay;

  const isInRange = (dateStr: string) => {
    if (!effectiveStart || !effectiveDue) return false;
    return dateStr >= effectiveStart && dateStr <= effectiveDue;
  };
  const isStartDate = (dateStr: string) => effectiveStart === dateStr;
  const isDueDate = (dateStr: string) => effectiveDue === dateStr;

  // Previous month trailing days info
  const prevMonthDays = new Date(calMonth.year, calMonth.month, 0).getDate();
  const prevMYear = calMonth.month === 0 ? calMonth.year - 1 : calMonth.year;
  const prevMMonth = calMonth.month === 0 ? 11 : calMonth.month - 1;

  const getDayStyle = (dateStr: string, isOtherMonth: boolean): React.CSSProperties => {
    const inRange = isInRange(dateStr);
    const start = isStartDate(dateStr);
    const due = isDueDate(dateStr);
    const isEndpoint = start || due;
    const isSingleDay = start && due;

    let bg = 'transparent';
    let borderRadius = '0';

    if (isSingleDay) {
      bg = isPreview ? 'rgba(78,130,238,0.35)' : 'var(--color-primary)';
      borderRadius = '50%';
    } else if (isEndpoint) {
      bg = isPreview ? 'rgba(78,130,238,0.35)' : 'var(--color-primary)';
      borderRadius = start ? '50% 0 0 50%' : '0 50% 50% 0';
    } else if (inRange) {
      bg = isPreview ? 'rgba(78,130,238,0.15)' : 'rgba(78,130,238,0.2)';
    }

    return {
      textAlign: 'center' as const,
      padding: '6px 0',
      fontSize: 12,
      cursor: isOtherMonth ? 'default' : 'pointer',
      borderRadius,
      background: bg,
      color: isEndpoint && !isPreview ? '#fff' : isOtherMonth ? 'var(--text-placeholder)' : 'var(--text-primary)',
      fontWeight: isEndpoint ? 600 : 400,
      opacity: isOtherMonth && !inRange ? 0.4 : 1,
      transition: 'background 0.1s',
    };
  };

  const handleDayClick = (dateStr: string) => {
    if (!rangeMode) {
      // Simple due-date-only mode
      onSelectDueDate(dateStr);
      onClose();
      return;
    }

    // Range mode
    if (mode === 'start') {
      onSelectStartDate?.(dateStr);
      onSelectDueDate(null);
      setMode('due');
    } else {
      if (startDate && dateStr < startDate) {
        onSelectStartDate?.(dateStr);
        onSelectDueDate(startDate);
      } else {
        onSelectDueDate(dateStr);
      }
      setMode('start');
    }
    setHoveredDay(null);
  };

  const positionStyle: React.CSSProperties = position === 'below-right'
    ? { right: 0 }
    : { left: 0 };

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', top: '100%', marginTop: 4, zIndex: 200,
        width: 300, background: '#232527', border: '1px solid var(--border-divider)',
        borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        padding: 0,
        ...positionStyle,
      }}
    >
      {/* Start / Due inputs (range mode only) */}
      {rangeMode && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 12px 8px' }}>
          <div
            onClick={() => setMode('start')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 6,
              border: `1px solid ${mode === 'start' ? 'var(--text-primary)' : 'var(--border-input)'}`,
              cursor: 'pointer', background: '#1a1c1e',
            }}
          >
            <span style={{ fontSize: 12, color: startDate ? 'var(--text-primary)' : 'var(--text-placeholder)', flex: 1 }}>
              {formatInputDate(startDate) || 'Start date'}
            </span>
            {startDate && (
              <button onClick={e => { e.stopPropagation(); onSelectStartDate?.(null); setMode('start'); }}
                style={{ color: 'var(--text-placeholder)', display: 'flex', padding: 0, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={12} strokeWidth={2} />
              </button>
            )}
          </div>
          <div
            onClick={() => setMode('due')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 6,
              border: `1px solid ${mode === 'due' ? 'var(--text-primary)' : 'var(--border-input)'}`,
              cursor: 'pointer', background: '#1a1c1e',
            }}
          >
            <span style={{ fontSize: 12, color: dueDate ? 'var(--text-primary)' : 'var(--text-placeholder)', flex: 1 }}>
              {formatInputDate(dueDate) || 'Due date'}
            </span>
            {dueDate && (
              <button onClick={e => { e.stopPropagation(); onSelectDueDate(null); }}
                style={{ color: 'var(--text-placeholder)', display: 'flex', padding: 0, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={12} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
        <button onClick={prevMonth} style={{ color: 'var(--text-secondary)', display: 'flex', padding: 4, cursor: 'pointer', borderRadius: 4, background: 'transparent', border: 'none' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{monthName}</span>
        <button onClick={nextMonth} style={{ color: 'var(--text-secondary)', display: 'flex', padding: 4, cursor: 'pointer', borderRadius: 4, background: 'transparent', border: 'none' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px', marginBottom: 4 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-placeholder)', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px 8px' }}
        onMouseLeave={() => setHoveredDay(null)}
      >
        {/* Trailing days from previous month */}
        {Array.from({ length: firstDay }, (_, i) => {
          const day = prevMonthDays - firstDay + 1 + i;
          const dateStr = toDateStrFull(prevMYear, prevMMonth, day);
          return (
            <div key={`prev-${i}`} style={getDayStyle(dateStr, true)}>
              {day}
            </div>
          );
        })}
        {/* Current month days */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = toDateStr(day);
          const style = getDayStyle(dateStr, false);
          return (
            <div
              key={day}
              onMouseEnter={() => setHoveredDay(dateStr)}
              onClick={() => handleDayClick(dateStr)}
              style={style}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Footer with Clear */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        padding: '8px 12px', borderTop: '1px solid var(--border-divider)',
      }}>
        <button
          onClick={() => {
            onSelectDueDate(null);
            if (rangeMode) onSelectStartDate?.(null);
            setMode('start');
            setHoveredDay(null);
            onClose();
          }}
          style={{
            fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
            padding: '4px 8px', borderRadius: 4, background: 'transparent',
            border: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
