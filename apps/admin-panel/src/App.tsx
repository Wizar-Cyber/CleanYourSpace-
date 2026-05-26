import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { Services } from './pages/Services';
import { JobsCalendar } from './pages/JobsCalendar';
import { ServiceHistory } from './pages/ServiceHistory';
import { Checklists } from './pages/Checklists';
import { Users } from './pages/Users';
import { Assignments } from './pages/Assignments';
import { Reports } from './pages/Reports';
import { Performance } from './pages/Performance';
import { Inventory } from './pages/Inventory';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-offwhite dark:bg-navy-dark">
        <div className="animate-pulse font-display text-navy dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="services" element={<Services />} />
        <Route path="jobs" element={<Services />} />
        <Route path="jobs/calendar" element={<JobsCalendar />} />
        <Route path="jobs/history" element={<ServiceHistory />} />
        <Route path="checklists" element={<Checklists />} />
        <Route path="users" element={<Users />} />
        <Route path="cleaners" element={<Users />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="performance" element={<Performance />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
