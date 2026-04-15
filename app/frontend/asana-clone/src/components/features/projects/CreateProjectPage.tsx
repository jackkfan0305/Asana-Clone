import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../data/AppContext';
import { ChevronDown, Check, Users, Lock, ArrowLeft, X, LayoutGrid, List, Columns, Clock, BarChart3 } from 'lucide-react';

type AccessOption = 'workspace' | 'private';
type ViewType = 'overview' | 'list' | 'board' | 'timeline' | 'dashboard';

const iconBtnStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  padding: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  cursor: 'pointer',
  background: 'transparent',
  border: 'none',
};

/* ================================================================
   Main page — two-step flow
   ================================================================ */

export function CreateProjectPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [access, setAccess] = useState<AccessOption>('workspace');
  const [selectedViews, setSelectedViews] = useState<Set<ViewType>>(
    new Set(['overview', 'list', 'board', 'timeline', 'dashboard']),
  );
  const [hoveredView, setHoveredView] = useState<ViewType>('list');
  const navigate = useNavigate();
  const { addProjectAsync, addSection } = useApp();
  const [creating, setCreating] = useState(false);

  const handleClose = () => navigate(-1);

  const handleContinue = () => {
    if (!name.trim()) return;
    setStep(2);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else navigate(-1);
  };

  const handleCreateProject = async () => {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const p = await addProjectAsync(trimmed, Array.from(selectedViews));
      addSection('Untitled section', p.id);
      navigate(`/project/${p.id}`);
    } finally {
      setCreating(false);
    }
  };

  const toggleView = (v: ViewType) => {
    if (v === 'list') return; // list is required
    setSelectedViews(prev => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };

  const displayName = name || 'Your project name';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'var(--bg-content)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        flexShrink: 0,
      }}>
        <button
          onClick={handleBack}
          style={iconBtnStyle}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title="Back"
        >
          <ArrowLeft size={18} strokeWidth={1.8} />
        </button>
        <button
          onClick={handleClose}
          style={iconBtnStyle}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title="Close"
        >
          <X size={18} strokeWidth={1.8} />
        </button>
      </div>

      {step === 1 ? (
        <StepOneName
          name={name}
          setName={setName}
          access={access}
          setAccess={setAccess}
          displayName={displayName}
          onContinue={handleContinue}
        />
      ) : (
        <StepTwoViews
          displayName={displayName}
          selectedViews={selectedViews}
          hoveredView={hoveredView}
          setHoveredView={setHoveredView}
          toggleView={toggleView}
          onBack={() => setStep(1)}
          onCreateProject={handleCreateProject}
        />
      )}
    </div>
  );
}

/* ================================================================
   Step 1 — Project name + access
   ================================================================ */

function StepOneName({
  name, setName, access, setAccess, displayName, onContinue,
}: {
  name: string;
  setName: (v: string) => void;
  access: AccessOption;
  setAccess: (v: AccessOption) => void;
  displayName: string;
  onContinue: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      padding: '24px 48px 48px',
      gap: 48,
      maxWidth: 1100,
      width: '100%',
      margin: '0 auto',
    }}>
      {/* Left — form */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 28, lineHeight: 1.2 }}>
          New project
        </h1>

        <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
          Project name
        </label>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onContinue(); }}
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 6,
            border: '1px solid var(--border-input)', background: 'var(--bg-input)',
            fontSize: 14, color: 'var(--text-primary)', marginBottom: 20, outline: 'none',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border-input)'}
        />

        <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
          Project access
        </label>
        <div ref={dropdownRef} style={{ position: 'relative', marginBottom: 28 }}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 6,
              border: '1px solid var(--border-input)', background: 'var(--bg-input)',
              fontSize: 14, color: 'var(--text-primary)', display: 'flex',
              alignItems: 'center', gap: 8, cursor: 'pointer', textAlign: 'left',
            }}
          >
            {access === 'workspace'
              ? <Users size={16} strokeWidth={1.5} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
              : <Lock size={16} strokeWidth={1.5} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            }
            <span style={{ flex: 1 }}>{access === 'workspace' ? 'My workspace' : 'Private'}</span>
            <ChevronDown size={14} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              borderRadius: 8, boxShadow: 'var(--shadow-dropdown)', zIndex: 50, overflow: 'hidden',
            }}>
              {(['workspace', 'private'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => { setAccess(opt); setDropdownOpen(false); }}
                  style={{
                    width: '100%', padding: '12px 14px', display: 'flex',
                    alignItems: 'flex-start', gap: 12, cursor: 'pointer', textAlign: 'left',
                    background: access === opt ? 'var(--bg-sidebar-hover)' : 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                  onMouseLeave={e => { if (access !== opt) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    {access === opt && <Check size={16} strokeWidth={2.5} style={{ color: 'var(--text-primary)' }} />}
                  </div>
                  {opt === 'workspace'
                    ? <Users size={18} strokeWidth={1.5} style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: 1 }} />
                    : <Lock size={18} strokeWidth={1.5} style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: 1 }} />
                  }
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {opt === 'workspace' ? 'My workspace' : 'Private'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {opt === 'workspace'
                        ? 'Everyone in your workspace can find and access this project.'
                        : 'Only invited members can find and access this project.'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onContinue}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 6,
            background: 'var(--color-primary)', color: '#fff', fontSize: 14, fontWeight: 500,
            cursor: name.trim() ? 'pointer' : 'not-allowed',
            opacity: name.trim() ? 1 : 0.6,
          }}
          onMouseEnter={e => { if (name.trim()) e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = name.trim() ? '1' : '0.6'; }}
        >
          Continue
        </button>
      </div>

      {/* Right — preview */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'hidden' }}>
        <ListPreview name={displayName} />
      </div>
    </div>
  );
}

/* ================================================================
   Step 2 — Choose views
   ================================================================ */

const VIEW_OPTIONS: { key: ViewType; label: string; desc: string; required?: boolean; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', desc: 'Align on project info and resources', icon: <LayoutGrid size={16} strokeWidth={1.5} /> },
  { key: 'list', label: 'List', desc: 'Organize tasks in a powerful table', required: true, icon: <List size={16} strokeWidth={1.5} /> },
  { key: 'board', label: 'Board', desc: 'Track work in a Kanban view', icon: <Columns size={16} strokeWidth={1.5} /> },
  { key: 'timeline', label: 'Timeline', desc: 'Schedule work over time', icon: <Clock size={16} strokeWidth={1.5} /> },
  { key: 'dashboard', label: 'Dashboard', desc: 'Monitor project metrics and insights', icon: <BarChart3 size={16} strokeWidth={1.5} /> },
];

function StepTwoViews({
  displayName, selectedViews, hoveredView, setHoveredView, toggleView, onBack, onCreateProject,
}: {
  displayName: string;
  selectedViews: Set<ViewType>;
  hoveredView: ViewType;
  setHoveredView: (v: ViewType) => void;
  toggleView: (v: ViewType) => void;
  onBack: () => void;
  onCreateProject: () => void;
}) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      padding: '24px 48px 48px',
      gap: 48,
      maxWidth: 1100,
      width: '100%',
      margin: '0 auto',
    }}>
      {/* Left — view picker */}
      <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 24, lineHeight: 1.2 }}>
          Choose views for your project
        </h1>

        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Asana recommended
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 28 }}>
          {VIEW_OPTIONS.map(opt => {
            const selected = selectedViews.has(opt.key);
            return (
              <button
                key={opt.key}
                onClick={() => toggleView(opt.key)}
                onMouseEnter={() => setHoveredView(opt.key)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: selected ? '1.5px solid var(--color-primary)' : '1.5px solid var(--border-default)',
                  background: selected ? 'rgba(69,115,210,0.1)' : 'var(--bg-card)',
                  cursor: opt.required ? 'default' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  {selected ? (
                    <div style={{
                      width: 16, height: 16, borderRadius: 3, background: 'var(--color-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Check size={11} strokeWidth={3} style={{ color: '#fff' }} />
                    </div>
                  ) : (
                    <div style={{
                      width: 16, height: 16, borderRadius: 3,
                      border: '1.5px solid var(--border-input)', flexShrink: 0,
                    }} />
                  )}
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {opt.label}
                  </span>
                  {opt.required && (
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginLeft: 2 }}>(required)</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3, paddingLeft: 22 }}>
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom buttons */}
        <div style={{ marginTop: 'auto' }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 6,
              border: '1px solid var(--border-input)', background: 'transparent',
              color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Back
          </button>
          <button
            onClick={onCreateProject}
            style={{
              flex: 1.5, padding: '10px 0', borderRadius: 6,
              background: 'var(--color-primary)', color: '#fff', fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Create project
          </button>
        </div>
      </div>

      {/* Right — preview that changes on hover */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'hidden' }}>
        <ViewPreviewContainer name={displayName} activeView={hoveredView} />
      </div>
    </div>
  );
}

/* ================================================================
   Preview container — switches graphic based on hovered view
   ================================================================ */

function ViewPreviewContainer({ name, activeView }: { name: string; activeView: ViewType }) {
  const tabs: ViewType[] = ['overview', 'list', 'board', 'timeline', 'dashboard'];
  const tabLabels: Record<ViewType, string> = {
    overview: 'Overview', list: 'List', board: 'Board', timeline: 'Timeline', dashboard: 'Dashboard',
  };

  return (
    <div style={{
      width: '100%', maxWidth: 560, background: 'var(--bg-card)', borderRadius: 10,
      border: '1px solid var(--border-default)', overflow: 'hidden',
    }}>
      {/* Header with name + tabs */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-input)', flexShrink: 0 }} />
          <span style={{
            fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-default)' }}>
          {tabs.map(t => (
            <span key={t} style={{
              fontSize: 12, paddingBottom: 8, color: activeView === t ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeView === t ? '2px solid var(--text-primary)' : '2px solid transparent',
              fontWeight: activeView === t ? 600 : 400,
            }}>
              {tabLabels[t]}
            </span>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div style={{ padding: '16px', minHeight: 340 }}>
        {activeView === 'overview' && <OverviewPreview />}
        {activeView === 'list' && <ListPreviewContent />}
        {activeView === 'board' && <BoardPreview />}
        {activeView === 'timeline' && <TimelinePreview />}
        {activeView === 'dashboard' && <DashboardPreview />}
      </div>
    </div>
  );
}

/* ================================================================
   Shared drawing helpers
   ================================================================ */

const bar = (w: number, h: number = 8, color: string = 'var(--bg-input)') => (
  <div style={{ height: h, width: w, borderRadius: h / 2, background: color, flexShrink: 0 }} />
);

const avatar = (color: string = '#666', size: number = 22) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', background: color,
    border: '2px solid var(--border-default)', flexShrink: 0,
  }} />
);

const pill = (color: string, w: number = 48) => (
  <div style={{ height: 16, width: w, borderRadius: 8, background: color, flexShrink: 0 }} />
);

const circle = (checked: boolean = false, color: string = '#5da283') => (
  <div style={{
    width: 16, height: 16, borderRadius: '50%',
    border: checked ? 'none' : '1.5px solid var(--bg-input)',
    background: checked ? color : 'transparent', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {checked && (
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d="M2 5 L4.5 7.5 L8 3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </div>
);

const statusIcon = () => (
  <div style={{
    width: 18, height: 18, borderRadius: 4, border: '1.5px solid var(--bg-input)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }}>
    <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--bg-input)' }} />
  </div>
);

/* ================================================================
   OVERVIEW preview
   ================================================================ */

function OverviewPreview() {
  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* Left column */}
      <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Text block area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {bar(200, 10, 'var(--bg-input)')}
          {bar(180, 8, 'var(--bg-input)')}
          {bar(160, 8, 'var(--bg-input)')}
          <div style={{ height: 4 }} />
          {bar(190, 8, 'var(--bg-input)')}
          {bar(140, 8, 'var(--bg-input)')}
        </div>

        {/* Role cards — 2x2 grid */}
        <div style={{
          border: '1px solid var(--border-default)', borderRadius: 8, padding: 12,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {avatar('#666', 26)}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {bar(60, 7, 'var(--bg-input)')}
                {bar(44, 6, 'var(--bg-input)')}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bars cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        }}>
          {[['#5da283', '#5da283'], ['#5da283', '#5da283']].map((colors, i) => (
            <div key={i} style={{
              border: '1px solid var(--border-default)', borderRadius: 8, padding: 10,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {bar(80, 16, colors[0])}
              {avatar('#666', 20)}
            </div>
          ))}
        </div>
      </div>

      {/* Right column — activity timeline */}
      <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Timeline items */}
        {[
          { pillColor: null },
          { pillColor: '#f5d365' },
          { pillColor: null },
          { pillColor: null },
          { pillColor: '#e8384f' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 14 }}>
            {/* Timeline line + dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                border: '2px solid var(--bg-input)', background: 'transparent', flexShrink: 0,
              }} />
              {i < 4 && <div style={{ width: 1, flex: 1, background: 'var(--border-default)', minHeight: 20 }} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              {item.pillColor && pill(item.pillColor, 50)}
              {bar(90, 7, 'var(--bg-input)')}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                {i === 2 && <>{avatar('#666', 16)}{avatar('#666', 16)}{avatar('#666', 16)}{avatar('#666', 16)}</>}
                {i !== 2 && bar(60, 6, 'var(--bg-input)')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   LIST preview (used in step 1 and step 2)
   ================================================================ */

function ListPreviewContent() {
  const row = (nameW: number, checked: boolean, checkColor: string, avatarColors: string[], pills: { c: string; w: number }[]) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
      {circle(checked, checkColor)}
      {bar(nameW, 8)}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {avatarColors.map((c, i) => <div key={i}>{avatar(c, 20)}</div>)}
      </div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {avatarColors.length > 0 && statusIcon()}
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {pills.map((p, i) => <div key={i}>{pill(p.c, p.w)}</div>)}
      </div>
    </div>
  );

  return (
    <div>
      {/* Section 1 */}
      <div style={{ marginBottom: 4 }}>{bar(60, 8, 'var(--bg-input)')}</div>
      {row(100, false, '', ['#777'], [{ c: '#e8384f', w: 40 }, { c: '#aa62e3', w: 36 }])}
      {row(80, false, '', ['#666'], [{ c: '#5da283', w: 40 }])}
      {row(110, false, '', ['#777'], [{ c: '#5da283', w: 40 }])}

      <div style={{ height: 12 }} />

      {/* Section 2 */}
      <div style={{ marginBottom: 4 }}>{bar(55, 8, 'var(--bg-input)')}</div>
      {row(90, false, '', ['#777'], [{ c: '#4cc9f0', w: 40 }, { c: '#aa62e3', w: 36 }, { c: '#f5d365', w: 40 }])}

      <div style={{ height: 12 }} />

      {/* Section 3 */}
      <div style={{ marginBottom: 4 }}>{bar(50, 8, 'var(--bg-input)')}</div>
      {row(120, true, '#5da283', ['#777'], [{ c: '#5da283', w: 40 }, { c: '#e8384f', w: 36 }])}
      {row(95, true, '#5da283', ['#666'], [{ c: '#5da283', w: 40 }, { c: '#e362e3', w: 36 }])}
      {row(80, true, '#5da283', ['#777'], [{ c: '#5da283', w: 40 }])}
      {row(105, true, '#5da283', ['#777'], [{ c: '#e8384f', w: 36 }, { c: '#f5d365', w: 40 }])}
    </div>
  );
}

/* Step 1 standalone list preview with wrapper */
function ListPreview({ name }: { name: string }) {
  return (
    <div style={{
      width: '100%', maxWidth: 560, background: 'var(--bg-card)', borderRadius: 10,
      border: '1px solid var(--border-default)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid var(--border-default)',
      }}>
        <div style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--bg-input)' }} />
        <span style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 440,
        }}>{name}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6 }}>{bar(36, 8)}{bar(36, 8)}{bar(44, 8)}</div>
      </div>
      <div style={{ padding: 16 }}>
        <ListPreviewContent />
      </div>
    </div>
  );
}

/* ================================================================
   BOARD preview
   ================================================================ */

function BoardPreview() {
  const card = (opts: {
    nameW: number; checked?: boolean; pills?: { c: string; w: number }[];
    hasAvatar?: boolean; hasImage?: boolean;
  }) => (
    <div style={{
      background: 'var(--bg-row-hover)', borderRadius: 8, padding: 10,
      border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {opts.hasImage && (
        <div style={{
          width: '100%', height: 60, borderRadius: 6, background: 'var(--bg-input)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Mountain/image placeholder */}
          <svg width="40" height="30" viewBox="0 0 40 30" fill="none">
            <circle cx="28" cy="8" r="5" fill="#666" />
            <path d="M0 28 L12 12 L22 22 L28 16 L40 28 Z" fill="var(--bg-input)" />
          </svg>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {circle(opts.checked, '#5da283')}
        {bar(opts.nameW, 7)}
      </div>
      {opts.pills && opts.pills.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {opts.pills.map((p, i) => <div key={i}>{pill(p.c, p.w)}</div>)}
        </div>
      )}
      {opts.hasAvatar && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {avatar('#666', 20)}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {/* Column 1 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ marginBottom: 2 }}>{bar(50, 7, 'var(--bg-input)')}</div>
        {card({ nameW: 70, pills: [{ c: '#e362e3', w: 32 }, { c: '#5da283', w: 28 }] })}
        {card({ nameW: 80, pills: [{ c: '#5da283', w: 32 }, { c: '#f5d365', w: 28 }, { c: '#aa62e3', w: 28 }], hasAvatar: true })}
      </div>

      {/* Column 2 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ marginBottom: 2 }}>{bar(45, 7, 'var(--bg-input)')}</div>
        {card({ nameW: 60, hasImage: true })}
        {card({ nameW: 75, pills: [{ c: '#e8384f', w: 32 }, { c: '#e362e3', w: 28 }] })}
      </div>

      {/* Column 3 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ marginBottom: 2 }}>{bar(40, 7, 'var(--bg-input)')}</div>
        {card({ nameW: 65, pills: [{ c: '#aa62e3', w: 32 }], hasAvatar: true })}
        {card({ nameW: 70, pills: [{ c: '#f5d365', w: 32 }, { c: '#5da283', w: 28 }], hasAvatar: true })}
        <div style={{ height: 20 }} />
        {card({ nameW: 60, pills: [{ c: '#5da283', w: 32 }], hasAvatar: true })}
      </div>
    </div>
  );
}

/* ================================================================
   TIMELINE (Gantt) preview
   ================================================================ */

function TimelinePreview() {
  /* Colored bars positioned to resemble a Gantt chart with dependency lines */
  const ganttBar = (
    color: string, left: number, width: number, top: number, hasAvatar: boolean = true,
  ) => (
    <div style={{
      position: 'absolute', left: `${left}%`, width: `${width}%`, top,
      height: 28, borderRadius: 6, background: color,
      display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px',
    }}>
      {hasAvatar && avatar('#666', 18)}
      {bar(Math.max(20, width * 1.5), 6, 'rgba(0,0,0,0.2)')}
    </div>
  );

  return (
    <div style={{ position: 'relative', height: 310, overflow: 'hidden' }}>
      {/* Grid lines */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{
          position: 'absolute', left: `${i * 20}%`, top: 0, bottom: 0,
          width: 1, background: 'var(--border-default)',
        }} />
      ))}

      {/* Column headers */}
      <div style={{ display: 'flex', marginBottom: 12 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {bar(20, 6, 'var(--bg-input)')}
          </div>
        ))}
      </div>

      {/* Gantt bars */}
      {ganttBar('#7ecec0', 5, 22, 30)}
      {ganttBar('#f5d365', 32, 18, 68)}
      {ganttBar('#f0a0b0', 15, 65, 106, true)}
      {ganttBar('#c4b5e0', 18, 16, 144)}
      {ganttBar('#7ecec0', 48, 32, 182)}
      {ganttBar('#f5d365', 0, 30, 220)}
      {ganttBar('#f0a0b0', 14, 14, 258)}
      {ganttBar('#c4b5e0', 40, 35, 278)}

      {/* Dependency connector lines */}
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width="100%" height="100%">
        <path d="M 155 58 C 155 68, 175 68, 175 82" stroke="#666" strokeWidth="1.5" fill="none" />
        <path d="M 190 96 C 190 106, 120 106, 120 120" stroke="#666" strokeWidth="1.5" fill="none" />
        <path d="M 175 158 C 175 168, 260 168, 260 196" stroke="#666" strokeWidth="1.5" fill="none" />
        <path d="M 165 234 C 165 248, 105 248, 105 272" stroke="#666" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

/* ================================================================
   DASHBOARD preview
   ================================================================ */

function DashboardPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 4 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            border: '1px solid var(--border-default)', borderRadius: 8, padding: '14px 10px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            {bar(40, 6, 'var(--bg-input)')}
            {bar(30, 10, 'var(--bg-input)')}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Bar chart */}
        <div style={{
          border: '1px solid var(--border-default)', borderRadius: 8, padding: 16,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, justifyContent: 'center' }}>
            {[45, 55, 70, 90, 80, 60, 75].map((h, i) => (
              <div key={i} style={{
                width: 18, height: `${h}%`, borderRadius: '3px 3px 0 0',
                background: i % 2 === 0 ? '#b8a9e8' : '#9b8ad4',
              }} />
            ))}
          </div>
        </div>

        {/* Donut chart */}
        <div style={{
          border: '1px solid var(--border-default)', borderRadius: 8, padding: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="35" fill="none" stroke="#7a3d6e" strokeWidth="16" />
            <circle cx="45" cy="45" r="35" fill="none" stroke="#e07ab0" strokeWidth="16"
              strokeDasharray="155 220" strokeDashoffset="0"
              transform="rotate(-90 45 45)" />
            <circle cx="45" cy="45" r="35" fill="none" stroke="#7a3d6e" strokeWidth="16"
              strokeDasharray="55 220" strokeDashoffset="-155"
              transform="rotate(-90 45 45)" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#e07ab0' }} />
              {bar(40, 6, 'var(--bg-input)')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#7a3d6e' }} />
              {bar(40, 6, 'var(--bg-input)')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
