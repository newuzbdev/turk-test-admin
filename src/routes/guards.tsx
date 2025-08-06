// src/routes/guards.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../providers/auth-provider";
import { useEffect } from "react";

export const ProtectedRoute = () => {
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check auth status when route changes
    checkAuthStatus();
  }, [location.pathname, checkAuthStatus]);

  if (!isAuthenticated) {
    // Redirect to login with the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check auth status when route changes
    checkAuthStatus();
  }, [location.pathname, checkAuthStatus]);

  if (isAuthenticated) {
    // Redirect to the intended destination or default route
    const from = location.state?.from?.pathname || "/test";
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
};
