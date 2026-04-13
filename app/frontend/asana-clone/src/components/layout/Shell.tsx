import { Outlet } from 'react-router-dom';
import { IconRail } from './IconRail';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { TaskDetailPane } from '../features/taskdetail/TaskDetailPane';
import { SearchOverlay } from '../features/search/SearchOverlay';
import { BulkToolbar } from '../features/bulk/BulkToolbar';
import { useApp } from '../../data/AppContext';

export function Shell() {
  const { selectedTaskId, searchOpen, selectedTasks } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      {/* Topbar spans full width */}
      <Topbar />

      {/* Below topbar: icon rail + sidebar + content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <IconRail />
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            flex: 1, overflow: 'auto', padding: '16px 24px',
            background: 'linear-gradient(to top right, #1a1b1d 0%, #3a3b3d 100%)',
          }}>
            <Outlet />
          </div>
          {selectedTaskId && <TaskDetailPane />}
        </div>
        {selectedTasks.length > 0 && <BulkToolbar />}
      </div>
      {searchOpen && <SearchOverlay />}
    </div>
  );
}
