import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { useAuth }      from './hooks/useAuth';

import Landing       from './pages/Landing';
import PublicTracker from './pages/PublicTracker';
import Login         from './pages/Login';

import CitizenHome   from './pages/citizen/CitizenHome';
import ReportPage    from './pages/citizen/ReportPage';
import MyTickets     from './pages/citizen/MyTickets';
import MapPage       from './pages/citizen/MapPage';
import Leaderboard   from './pages/citizen/Leaderboard';
import Profile       from './pages/citizen/Profile';

import OfficerDashboard from './pages/officer/OfficerDashboard';
import MyQueue          from './pages/officer/MyQueue';
import QueriesInbox     from './pages/officer/QueriesInbox';
import Performance      from './pages/officer/Performance';

import AdminOverview    from './pages/admin/AdminOverview';
import UnassignedQueue  from './pages/admin/UnassignedQueue';
import AllTickets       from './pages/admin/AllTickets';
import StaffManagement  from './pages/admin/StaffManagement';
import WardMap          from './pages/admin/WardMap';
import Reports          from './pages/admin/Reports';
import Predictions      from './pages/admin/Predictions';
import SystemSettings   from './pages/admin/SystemSettings';
import AgentsPanel      from './pages/admin/AgentsPanel';
import DuplicatesManager from './pages/admin/DuplicatesManager';

const Spinner = () => (
  <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#F5F3F0' }}>
    <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#E5E2DE', borderTopColor: '#C13B2A' }} />
  </div>
);

const RoleGuard = ({ children, role }) => {
  const { user, userRole, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/login" replace />;
  if (role && userRole !== role && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          <Routes>
            {/* Public */}
            <Route path="/"         element={<Landing />} />
            <Route path="/track/:id" element={<PublicTracker />} />
            <Route path="/login"    element={<Login />} />

            {/* Citizen */}
            <Route path="/citizen"              element={<RoleGuard><CitizenHome /></RoleGuard>} />
            <Route path="/citizen/report"       element={<RoleGuard><ReportPage /></RoleGuard>} />
            <Route path="/citizen/tickets"      element={<RoleGuard><MyTickets /></RoleGuard>} />
            <Route path="/citizen/map"          element={<RoleGuard><MapPage /></RoleGuard>} />
            <Route path="/citizen/leaderboard"  element={<RoleGuard><Leaderboard /></RoleGuard>} />
            <Route path="/citizen/profile"      element={<RoleGuard><Profile /></RoleGuard>} />

            {/* Officer */}
            <Route path="/officer"             element={<RoleGuard role="officer"><OfficerDashboard /></RoleGuard>} />
            <Route path="/officer/queue"       element={<RoleGuard role="officer"><MyQueue /></RoleGuard>} />
            <Route path="/officer/queries"     element={<RoleGuard role="officer"><QueriesInbox /></RoleGuard>} />
            <Route path="/officer/performance" element={<RoleGuard role="officer"><Performance /></RoleGuard>} />

            {/* Admin */}
            <Route path="/admin"             element={<RoleGuard role="admin"><AdminOverview /></RoleGuard>} />
            <Route path="/admin/unassigned"  element={<RoleGuard role="admin"><UnassignedQueue /></RoleGuard>} />
            <Route path="/admin/tickets"     element={<RoleGuard role="admin"><AllTickets /></RoleGuard>} />
            <Route path="/admin/staff"       element={<RoleGuard role="admin"><StaffManagement /></RoleGuard>} />
            <Route path="/admin/map"         element={<RoleGuard role="admin"><WardMap /></RoleGuard>} />
            <Route path="/admin/reports"     element={<RoleGuard role="admin"><Reports /></RoleGuard>} />
            <Route path="/admin/predictions"  element={<RoleGuard role="admin"><Predictions /></RoleGuard>} />
            <Route path="/admin/settings"     element={<RoleGuard role="admin"><SystemSettings /></RoleGuard>} />
            <Route path="/admin/agents"       element={<RoleGuard role="admin"><AgentsPanel /></RoleGuard>} />
            <Route path="/admin/duplicates"   element={<RoleGuard role="admin"><DuplicatesManager /></RoleGuard>} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
