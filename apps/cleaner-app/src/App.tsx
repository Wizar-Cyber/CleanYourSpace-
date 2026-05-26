import { Routes, Route, Navigate } from 'react-router-dom';
import { CleanerLayout } from './layouts/CleanerLayout';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { AssignmentDetail } from './pages/AssignmentDetail';
import { Checklist } from './pages/Checklist';
import { Photos } from './pages/Photos';
import { Profile } from './pages/Profile';
import { Performance } from './pages/Performance';
import { Login } from './pages/Login';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-offwhite">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-display text-[13px] text-navy">Loading...</p>
        </div>
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
            <CleanerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="history" element={<History />} />
        <Route path="assignment/:id" element={<AssignmentDetail />} />
        <Route path="assignment/:id/checklist" element={<Checklist />} />
        <Route path="assignment/:id/photos" element={<Photos />} />
        <Route path="performance" element={<Performance />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
