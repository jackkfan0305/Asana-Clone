import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../data/AppContext';
import { AvatarGroup, Avatar } from '../../common/Avatar';

type FilterDropdown = 'owner' | 'members' | 'portfolios' | 'status' | null;
type SortOption = 'relevance' | 'due_date' | 'last_modified' | 'creation_time' | 'alpha_az' | 'alpha_za';

function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, onClose: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

export function ProjectsListPage() {
  const navigate = useNavigate();
  const { projects, tasks, seed } = useApp();
  const [search, setSearch] = useState('');
  const [openDropdown, setOpenDropdown] = useState<FilterDropdown>(null);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  useClickOutside(sortRef, () => setShowSortDropdown(false));

  // Filter state
  const [filterOwnerIds, setFilterOwnerIds] = useState<Set<string>>(new Set());
  const [filterMemberIds, setFilterMemberIds] = useState<Set<string>>(new Set());
  const [filterPortfolioIds, setFilterPortfolioIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Search within dropdowns
  const [dropdownSearch, setDropdownSearch] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => { setOpenDropdown(null); setDropdownSearch(''); });

  // Derive unique owners from projects
  const owners = useMemo(() => {
    const ownerIds = new Set(projects.filter(p => !p.archived).map(p => p.ownerId));
    return seed.users.filter(u => ownerIds.has(u.id));
  }, [projects, seed.users]);

  // Derive unique members across all projects
  const allMembers = useMemo(() => {
    const memberIds = new Set<string>();
    projects.filter(p => !p.archived).forEach(p => {
      memberIds.add(p.ownerId);
      seed.teamMembers.filter(tm => tm.teamId === p.teamId).forEach(tm => memberIds.add(tm.userId));
    });
    return seed.users.filter(u => memberIds.has(u.id));
  }, [projects, seed.users, seed.teamMembers]);

  const getProjectMemberIds = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];
    const tMembers = seed.teamMembers.filter(tm => tm.teamId === project.teamId).map(tm => tm.userId);
    const ids = new Set([project.ownerId, ...tMembers]);
    return Array.from(ids);
  };

  const getProjectPortfolios = (projectId: string) =>
    seed.portfolios.filter(port => port.projectIds.includes(projectId));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return projects.filter(p => {
      if (p.archived) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filterOwnerIds.size > 0 && !filterOwnerIds.has(p.ownerId)) return false;
      if (filterMemberIds.size > 0) {
        const memberIds = new Set<string>();
        memberIds.add(p.ownerId);
        seed.teamMembers.filter(tm => tm.teamId === p.teamId).forEach(tm => memberIds.add(tm.userId));
        const hasMatch = Array.from(filterMemberIds).some(id => memberIds.has(id));
        if (!hasMatch) return false;
      }
      if (filterPortfolioIds.size > 0) {
        const projPortfolios = seed.portfolios.filter(port => port.projectIds.includes(p.id));
        const hasMatch = projPortfolios.some(port => filterPortfolioIds.has(port.id));
        if (!hasMatch) return false;
      }
      if (filterStatus) {
        if (filterStatus === 'Active' && p.archived) return false;
        if (filterStatus === 'Closed' && !p.archived) return false;
        if (filterStatus === 'Archived' && !p.archived) return false;
      }
      return true;
    });
  }, [search, projects, filterOwnerIds, filterMemberIds, filterPortfolioIds, filterStatus, seed.teamMembers, seed.portfolios]);

  const sorted = useMemo(() => {
    if (sortBy === 'relevance') return filtered;
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'alpha_az': return a.name.localeCompare(b.name);
        case 'alpha_za': return b.name.localeCompare(a.name);
        case 'creation_time': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'due_date': {
          const aDue = tasks.filter(t => t.projectId === a.id && t.dueDate).map(t => new Date(t.dueDate!).getTime()).sort((x, y) => x - y)[0] ?? Infinity;
          const bDue = tasks.filter(t => t.projectId === b.id && t.dueDate).map(t => new Date(t.dueDate!).getTime()).sort((x, y) => x - y)[0] ?? Infinity;
          return aDue - bDue;
        }
        case 'last_modified': {
          const aMax = tasks.filter(t => t.projectId === a.id && t.createdAt).map(t => new Date(t.createdAt).getTime()).sort((x, y) => y - x)[0] ?? new Date(a.createdAt).getTime();
          const bMax = tasks.filter(t => t.projectId === b.id && t.createdAt).map(t => new Date(t.createdAt).getTime()).sort((x, y) => y - x)[0] ?? new Date(b.createdAt).getTime();
          return bMax - aMax;
        }
        default: return 0;
      }
    });
  }, [filtered, sortBy, tasks]);

  const hasActiveFilters = filterOwnerIds.size > 0 || filterMemberIds.size > 0 || filterPortfolioIds.size > 0 || filterStatus !== null;

  const toggleDropdown = (dd: FilterDropdown) => {
    setOpenDropdown(prev => prev === dd ? null : dd);
    setDropdownSearch('');
  };

  const pillStyle = (active: boolean) => ({
    padding: '4px 10px', fontSize: 12, borderRadius: 12,
    background: active ? 'rgba(78,114,202,0.2)' : 'var(--bg-input)',
    border: active ? '1px solid rgba(78,114,202,0.5)' : '1px solid var(--border-default)',
    color: active ? '#7cacf8' : 'var(--text-secondary)', cursor: 'pointer' as const,
    display: 'flex' as const, alignItems: 'center' as const, gap: 4,
  });

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 4,
    background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8,
    padding: 8, minWidth: 280, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 32px',
    background: 'var(--bg-input)', border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-btn)', color: 'var(--text-primary)',
    fontSize: 13, outline: 'none', marginBottom: 8,
  };

  const rowItemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px',
    borderRadius: 4, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
    width: '100%',
  };

  const portfolioColors: Record<string, string> = {};
  const colorPalette = ['#b48cf7', '#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#fb923c'];
  seed.portfolios.forEach((p, i) => { portfolioColors[p.id] = colorPalette[i % colorPalette.length]; });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
        <h1 style={{ font: 'var(--font-h1)', fontSize: 20, fontWeight: 600 }}>Browse projects</h1>
        <button
          onClick={() => navigate('/create-project')}
          style={{
            background: 'var(--color-primary)', color: '#fff', padding: '6px 14px',
            borderRadius: 'var(--radius-btn)', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: 15 }}>+</span> Create project
        </button>
      </div>
      {/* Full-width separator connecting to sidebar */}
      <div style={{ height: 1, background: 'var(--border-divider)', margin: '38px -24px 20px' }} />

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Find a project"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 32px',
            background: 'var(--bg-input)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-btn)', color: 'var(--text-primary)',
            fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Owner filter */}
        <div style={{ position: 'relative' }} ref={openDropdown === 'owner' ? dropdownRef : undefined}>
          <button onClick={() => toggleDropdown('owner')} style={pillStyle(filterOwnerIds.size > 0)}>
            Owner{filterOwnerIds.size > 0 && ` (${filterOwnerIds.size})`}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 4l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {openDropdown === 'owner' && (
            <div style={dropdownStyle}>
              <div style={{ position: 'relative', marginBottom: 4 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  autoFocus
                  placeholder="Filter projects by owner"
                  value={dropdownSearch}
                  onChange={e => setDropdownSearch(e.target.value)}
                  style={searchInputStyle}
                />
              </div>
              <div style={{ borderTop: '1px solid var(--border-divider)', paddingTop: 4 }}>
                {owners
                  .filter(u => !dropdownSearch || u.name.toLowerCase().includes(dropdownSearch.toLowerCase()) || u.email.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map(user => (
                    <div
                      key={user.id}
                      onClick={() => {
                        setFilterOwnerIds(prev => {
                          const next = new Set(prev);
                          if (next.has(user.id)) next.delete(user.id); else next.add(user.id);
                          return next;
                        });
                      }}
                      style={rowItemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Avatar userId={user.id} size={28} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 500 }}>{user.name}</span>
                        <span style={{ color: 'var(--text-tertiary)', marginLeft: 8, fontSize: 12 }}>{user.email}</span>
                      </div>
                      {filterOwnerIds.has(user.id) && <span style={{ color: '#4E72CA', fontSize: 14 }}>&#10003;</span>}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Members filter */}
        <div style={{ position: 'relative' }} ref={openDropdown === 'members' ? dropdownRef : undefined}>
          <button onClick={() => toggleDropdown('members')} style={pillStyle(filterMemberIds.size > 0)}>
            Members{filterMemberIds.size > 0 && ` (${filterMemberIds.size})`}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 4l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {openDropdown === 'members' && (
            <div style={dropdownStyle}>
              <div style={{ position: 'relative', marginBottom: 4 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  autoFocus
                  placeholder="Filter projects by members"
                  value={dropdownSearch}
                  onChange={e => setDropdownSearch(e.target.value)}
                  style={searchInputStyle}
                />
              </div>
              <div style={{ borderTop: '1px solid var(--border-divider)', paddingTop: 4 }}>
                {allMembers
                  .filter(u => !dropdownSearch || u.name.toLowerCase().includes(dropdownSearch.toLowerCase()) || u.email.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map(user => (
                    <div
                      key={user.id}
                      onClick={() => {
                        setFilterMemberIds(prev => {
                          const next = new Set(prev);
                          if (next.has(user.id)) next.delete(user.id); else next.add(user.id);
                          return next;
                        });
                      }}
                      style={rowItemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: 3,
                        border: filterMemberIds.has(user.id) ? 'none' : '1px solid var(--border-input)',
                        background: filterMemberIds.has(user.id) ? '#4E72CA' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: '#fff', flexShrink: 0,
                      }}>
                        {filterMemberIds.has(user.id) && <span>&#10003;</span>}
                      </div>
                      <Avatar userId={user.id} size={28} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 500 }}>{user.name}</span>
                        <span style={{ color: 'var(--text-tertiary)', marginLeft: 8, fontSize: 12 }}>{user.email}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Portfolios filter */}
        <div style={{ position: 'relative' }} ref={openDropdown === 'portfolios' ? dropdownRef : undefined}>
          <button onClick={() => toggleDropdown('portfolios')} style={pillStyle(filterPortfolioIds.size > 0)}>
            Portfolios{filterPortfolioIds.size > 0 && ` (${filterPortfolioIds.size})`}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 4l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {openDropdown === 'portfolios' && (
            <div style={dropdownStyle}>
              <div style={{ position: 'relative', marginBottom: 4 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  autoFocus
                  placeholder="Filter projects by portfolios"
                  value={dropdownSearch}
                  onChange={e => setDropdownSearch(e.target.value)}
                  style={searchInputStyle}
                />
              </div>
              <div style={{ borderTop: '1px solid var(--border-divider)', paddingTop: 4 }}>
                {seed.portfolios
                  .filter(p => !dropdownSearch || p.name.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map(portfolio => {
                    const projectCount = portfolio.projectIds.length;
                    const color = portfolioColors[portfolio.id] || '#a78bfa';
                    return (
                      <div
                        key={portfolio.id}
                        onClick={() => {
                          setFilterPortfolioIds(prev => {
                            const next = new Set(prev);
                            if (next.has(portfolio.id)) next.delete(portfolio.id); else next.add(portfolio.id);
                            return next;
                          });
                        }}
                        style={rowItemStyle}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: 16, height: 16, borderRadius: 3,
                          border: filterPortfolioIds.has(portfolio.id) ? 'none' : '1px solid var(--border-input)',
                          background: filterPortfolioIds.has(portfolio.id) ? '#4E72CA' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, color: '#fff', flexShrink: 0,
                        }}>
                          {filterPortfolioIds.has(portfolio.id) && <span>&#10003;</span>}
                        </div>
                        <div style={{
                          width: 24, height: 20, borderRadius: 3,
                          background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, flexShrink: 0,
                        }}>
                          <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                            <path d="M1 3h12v7a1 1 0 01-1 1H2a1 1 0 01-1-1V3z" fill="rgba(255,255,255,0.3)" />
                            <path d="M1 2a1 1 0 011-1h3.5l1 2H12a1 1 0 011 1v0H1V2z" fill="rgba(255,255,255,0.5)" />
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 500 }}>{portfolio.name}</span>
                          <span style={{ color: 'var(--text-tertiary)', marginLeft: 8, fontSize: 12 }}>{projectCount} project{projectCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative' }} ref={openDropdown === 'status' ? dropdownRef : undefined}>
          <button onClick={() => toggleDropdown('status')} style={pillStyle(filterStatus !== null)}>
            {filterStatus || 'Status'}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 4l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {openDropdown === 'status' && (
            <div style={{ ...dropdownStyle, minWidth: 160, padding: 8 }}>
              {['Active', 'Closed', 'Archived'].map(status => (
                <div
                  key={status}
                  onClick={() => {
                    setFilterStatus(prev => prev === status ? null : status);
                    setOpenDropdown(null);
                  }}
                  style={{
                    padding: '10px 12px', cursor: 'pointer', fontSize: 14,
                    color: filterStatus === status ? '#7cacf8' : 'var(--text-primary)',
                    borderRadius: 4,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {status}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setFilterOwnerIds(new Set());
              setFilterMemberIds(new Set());
              setFilterPortfolioIds(new Set());
              setFilterStatus(null);
            }}
            style={{
              padding: '4px 10px', fontSize: 12, borderRadius: 12,
              background: 'transparent', border: 'none',
              color: 'var(--text-link)', cursor: 'pointer',
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 140px 180px 120px',
          padding: '8px 16px', fontSize: 11, color: 'var(--text-tertiary)',
          borderBottom: '1px solid var(--border-divider)', fontWeight: 500,
        }}>
          <span>Name</span>
          <span>Members</span>
          <span>Portfolios</span>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end' }} ref={sortRef}>
            <button
              onClick={() => setShowSortDropdown(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 11, fontWeight: 500, padding: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 2v6M3 6l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {{ relevance: 'Relevance', due_date: 'Due date', last_modified: 'Last modified', creation_time: 'Creation time', alpha_az: 'A to Z', alpha_za: 'Z to A' }[sortBy]}
            </button>
            {showSortDropdown && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4,
                background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8,
                padding: 6, minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {([
                  ['relevance', 'Relevance'],
                  ['due_date', 'Due date'],
                  ['last_modified', 'Last modified'],
                  ['creation_time', 'Creation time'],
                  ['alpha_az', 'Alphabetical: A to Z'],
                  ['alpha_za', 'Alphabetical: Z to A'],
                ] as [SortOption, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => { setSortBy(value); setShowSortDropdown(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '8px 10px', fontSize: 13, background: 'none', border: 'none',
                      color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 4,
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ width: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                      {sortBy === value ? '✓' : ''}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rows */}
        {sorted.map(project => {
          const memberIds = getProjectMemberIds(project.id);
          const projectPortfolios = getProjectPortfolios(project.id);

          return (
            <div
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 180px 120px',
                padding: '10px 16px', alignItems: 'center', cursor: 'pointer',
                borderBottom: '1px solid var(--border-divider)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Name cell */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 4, background: 'var(--bg-input)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-tertiary)' }}>
                    <rect x="1" y="2" width="14" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="1" y="7" width="14" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
                    <rect x="1" y="12" width="8" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{project.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Joined</div>
                </div>
              </div>

              {/* Members cell */}
              <AvatarGroup userIds={memberIds} size={24} max={2} />

              {/* Portfolios cell */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {projectPortfolios.map(port => (
                  <span key={port.id} style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 10,
                    background: 'var(--bg-input)', color: 'var(--text-secondary)',
                    display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}>
                    <span style={{ fontSize: 10 }}>&#128188;</span>
                    {port.name}
                  </span>
                ))}
              </div>

              {/* Last modified cell */}
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right' }}>
                {/* placeholder */}
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            No projects found
          </div>
        )}
      </div>
    </div>
  );
}
