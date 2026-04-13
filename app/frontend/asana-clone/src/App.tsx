import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './data/AppContext';
import { Shell } from './components/layout/Shell';
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
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
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
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
