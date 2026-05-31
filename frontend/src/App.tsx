import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getDefaultRoute, canAccessRoute } from './utils/permissions';
import LoadingSpinner from './components/common/LoadingSpinner';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import LogoutPage from './pages/LogoutPage';
import AdminDashboard from './pages/AdminDashboard';
import FieldOfficerDashboard from './pages/FieldOfficerDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import ProgramManagerDashboard from './pages/ProgramManagerDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
import WarehouseDashboard from './pages/WarehouseDashboard';
import GISDashboard from './pages/GISDashboard';
import NGODashboard from './pages/NGODashboard';
import CitizenPortal from './pages/CitizenPortal';
import AuditorDashboard from './pages/AuditorDashboard';
import UnauthorizedPage from './pages/UnauthorizedPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner size="lg" text="Loading..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function RoleRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner size="lg" text="Loading..." />;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={getDefaultRoute(user.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<RootRedirect />} />

        <Route path="/admin/*" element={
          <RoleRoute roles={['admin']}>
            <AdminDashboard />
          </RoleRoute>
        } />
        <Route path="/field-officer/*" element={
          <RoleRoute roles={['field_officer']}>
            <FieldOfficerDashboard />
          </RoleRoute>
        } />
        <Route path="/verifier/*" element={
          <RoleRoute roles={['verifier']}>
            <VerifierDashboard />
          </RoleRoute>
        } />
        <Route path="/manager/*" element={
          <RoleRoute roles={['program_manager']}>
            <ProgramManagerDashboard />
          </RoleRoute>
        } />
        <Route path="/finance/*" element={
          <RoleRoute roles={['finance_officer']}>
            <FinanceDashboard />
          </RoleRoute>
        } />
        <Route path="/warehouse/*" element={
          <RoleRoute roles={['warehouse_officer']}>
            <WarehouseDashboard />
          </RoleRoute>
        } />
        <Route path="/gis/*" element={
          <RoleRoute roles={['gis_officer']}>
            <GISDashboard />
          </RoleRoute>
        } />
        <Route path="/ngo/*" element={
          <RoleRoute roles={['ngo_partner']}>
            <NGODashboard />
          </RoleRoute>
        } />
        <Route path="/citizen/*" element={
          <RoleRoute roles={['citizen']}>
            <CitizenPortal />
          </RoleRoute>
        } />
        <Route path="/auditor/*" element={
          <RoleRoute roles={['auditor']}>
            <AuditorDashboard />
          </RoleRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
