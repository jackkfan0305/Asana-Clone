import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { IconRail } from './IconRail';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { TaskDetailPane } from '../features/taskdetail/TaskDetailPane';
import { SearchOverlay } from '../features/search/SearchOverlay';
import { BulkToolbar } from '../features/bulk/BulkToolbar';
import { useApp } from '../../data/AppContext';

export function Shell() {
  const { selectedTaskId, searchOpen, selectedTasks, sidebarExpanded } = useApp();
  const location = useLocation();
  const isHome = location.pathname === '/home' || location.pathname === '/';
  const [showPane, setShowPane] = useState(false);
  const [closing, setClosing] = useState(false);
  const prevTaskId = useRef<string | null>(null);

  useEffect(() => {
    if (selectedTaskId) {
      setShowPane(true);
      setClosing(false);
    } else if (prevTaskId.current) {
      // Was open, now closing
      setClosing(true);
      const timer = setTimeout(() => {
        setShowPane(false);
        setClosing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
    prevTaskId.current = selectedTaskId;
  }, [selectedTaskId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      {/* Topbar spans full width */}
      <Topbar />

      {/* Below topbar: icon rail + (sidebar + content) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <IconRail />
        {/* Sidebar + content wrapper with border and rounded corner */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          borderTopLeftRadius: 10,
          background: 'var(--bg-sidebar)',
        }}>
          <div style={{
            width: sidebarExpanded ? 'var(--sidebar-panel-width)' : 0,
            overflow: 'hidden',
            flexShrink: 0,
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
          }}>
            <Sidebar />
          </div>
          <div style={{
            flex: 1, display: 'flex', overflow: 'hidden', position: 'relative',
            background: isHome ? 'linear-gradient(to top right, #1a1b1d 0%, #3a3b3d 100%)' : '#1D1F21',
          }}>
            <div style={{
              flex: 1, overflow: 'auto', padding: '16px 24px',
            }}>
              <Outlet />
            </div>
            {showPane && <TaskDetailPane closing={closing} />}
          </div>
        </div>
        {selectedTasks.length > 0 && <BulkToolbar />}
      </div>
      {searchOpen && <SearchOverlay />}
    </div>
  );
}
