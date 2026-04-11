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
    const isAdminRoute = allowedRoles && (allowedRoles.includes('admin') || allowedRoles.includes('superadmin') || allowedRoles.includes('audit'));
    return <Navigate to={isAdminRoute ? "/pandityatra/hidden/login" : "/login"} replace />;
  }

  // If authenticated, check if role is allowed (if specified)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // 👑 RBAC HARDENING: Ensure all admin-like roles can access 'admin' routes
    const isAdmin = role === 'admin' || role === 'superadmin' || role === 'audit';
    const isTargetingAdmin = allowedRoles.includes('admin') || allowedRoles.includes('superadmin') || allowedRoles.includes('audit');
    
    if (isAdmin && isTargetingAdmin) {
      return <>{children}</>;
    }

    // Redirect based on role if truly unauthorized
    if (role === 'pandit') {
      return <Navigate to="/pandit/dashboard" replace />;
    } else if (role === 'vendor') {
      return <Navigate to="/vendor/dashboard" replace />;
    } else if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Final check: if we have a token but NO role yet (syncing), 
  // and it's a restricted route, wait for role to avoid mis-redirection
  if (token && !role && allowedRoles && allowedRoles.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={50} />
      </div>
    );
  }

  return <>{children}</>;
};

