import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];  // Optional: restrict to specific roles
  isPublic?: boolean;       // If true, allows unauthenticated users but restricts roles if authenticated
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, isPublic }) => {
  const { token, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={50} />
      </div>
    );
  }

  // Handle unauthenticated state
  if (!token) {
    if (isPublic) {
      return <>{children}</>;
    }
    // If trying to access admin routes, redirect to admin login
    const isAdminRoute = allowedRoles && (allowedRoles.includes('admin') || allowedRoles.includes('superadmin'));
    return <Navigate to={isAdminRoute ? "/pandityatra/hidden/login" : "/login"} replace />;
  }

  // If authenticated, check if role is allowed (if specified)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // superadmin can access all admin routes
    if (role === 'superadmin' && allowedRoles.includes('admin')) {
      return <>{children}</>;
    }
    // Redirect based on role
    if (role === 'pandit') {
      return <Navigate to="/pandit/dashboard" replace />;
    } else if (role === 'vendor') {
      return <Navigate to="/vendor/dashboard" replace />;
    } else if (role === 'admin' || role === 'superadmin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

