import React from 'react';
import { useRoles } from '@/hooks/use-roles';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'internalAgent' | 'externalAgent';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'admin' 
}) => {
  const { userRole, loading } = useRoles();

  // Show loading state while determining user role
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If user has no role or is guest, redirect to home
  if (!userRole || userRole === 'guest') {
    return <Navigate to="/" replace />;
  }

  // Check if user has the required role
  if (requiredRole === 'admin' && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'internalAgent' && !['admin', 'internalAgent'].includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'externalAgent' && !['admin', 'internalAgent', 'externalAgent'].includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}; 