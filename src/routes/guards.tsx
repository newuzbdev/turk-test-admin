// src/routes/guards.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/auth-provider';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export const PublicRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/listening" /> : <Outlet />;
};
