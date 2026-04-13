import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from './data/AppContext';
import { AuthContext } from './api/authStore';
import { fetchCurrentUser, type AuthUser } from './api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});
import { Shell } from './components/layout/Shell';
import { LoginPage } from './components/features/auth/LoginPage';
import { HomePage } from './components/features/home/HomePage';
import { MyTasksPage } from './components/features/mytasks/MyTasksPage';
import { ProjectsListPage } from './components/features/projects/ProjectsListPage';
import { ProjectListView } from './components/features/projects/ProjectListView';
import { ProjectBoardView } from './components/features/projects/ProjectBoardView';
import { InboxPage } from './components/features/inbox/InboxPage';
import { CalendarPage } from './components/features/calendar/CalendarPage';
import { TeamsPage } from './components/features/teams/TeamsPage';
import { TagsPage } from './components/features/tags/TagsPage';
import { CustomFieldsPage } from './components/features/customfields/CustomFieldsPage';
import { ProjectDashboard } from './components/features/dashboard/ProjectDashboard';
import { TimelinePage } from './components/features/timeline/TimelinePage';
import { GoalsPage } from './components/features/goals/GoalsPage';
import { PortfoliosPage } from './components/features/portfolios/PortfoliosPage';
import { WorkloadPage } from './components/features/workload/WorkloadPage';
import { ReportingPage } from './components/features/reporting/ReportingPage';
import { FormsPage } from './components/features/forms/FormsPage';
import { TemplatesPage } from './components/features/templates/TemplatesPage';
import { MessagesPage } from './components/features/messages/MessagesPage';
import { ProjectOverview } from './components/features/overview/ProjectOverview';
import { WorkflowPage } from './components/features/workflow/WorkflowPage';
import { SettingsPage } from './components/features/settings/SettingsPage';
import './styles/global.css';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser().then(u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1e1f21',
        color: '#a2a0a2',
      }}>
        Loading...
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
    <AuthContext.Provider value={{ user, loading, setUser }}>
      <BrowserRouter>
        {!user ? (
          <LoginPage />
        ) : (
          <AppProvider>
            <Routes>
              <Route element={<Shell />}>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/my-tasks" element={<MyTasksPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/projects" element={<ProjectsListPage />} />
                <Route path="/project/:projectId" element={<ProjectListView />} />
                <Route path="/project/:projectId/board" element={<ProjectBoardView />} />
                <Route path="/project/:projectId/timeline" element={<TimelinePage />} />
                <Route path="/project/:projectId/dashboard" element={<ProjectDashboard />} />
                <Route path="/project/:projectId/calendar" element={<CalendarPage />} />
                <Route path="/project/:projectId/overview" element={<ProjectOverview />} />
                <Route path="/project/:projectId/workflow" element={<WorkflowPage />} />
                <Route path="/project/:projectId/messages" element={<MessagesPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/tags" element={<TagsPage />} />
                <Route path="/custom-fields" element={<CustomFieldsPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/portfolios" element={<PortfoliosPage />} />
                <Route path="/workload" element={<WorkloadPage />} />
                <Route path="/reporting" element={<ReportingPage />} />
                <Route path="/forms" element={<FormsPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/workflow" element={<WorkflowPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </AppProvider>
        )}
      </BrowserRouter>
    </AuthContext.Provider>
    </QueryClientProvider>
  );
}
