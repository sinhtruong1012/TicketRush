import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children, adminOnly = false, customerOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin-only route: block non-admins
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Customer-only route: block admins from booking flows
  if (customerOnly && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
