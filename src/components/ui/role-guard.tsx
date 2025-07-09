import React, { ReactNode } from 'react';
import { useRoles } from '@/hooks/use-roles';
import type { UserRole } from '../../lib/index';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback = null, 
  loadingFallback = null 
}: RoleGuardProps) {
  const { userRole, loading } = useRoles();

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

interface InternalAgentOrAdminProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function InternalAgentOrAdmin({ children, fallback = null }: InternalAgentOrAdminProps) {
  return (
    <RoleGuard allowedRoles={['admin', 'internalAgent']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

interface AgentOrAboveProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AgentOrAbove({ children, fallback = null }: AgentOrAboveProps) {
  return (
    <RoleGuard allowedRoles={['admin', 'internalAgent', 'externalAgent']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

interface GuestOrAboveProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function GuestOrAbove({ children, fallback = null }: GuestOrAboveProps) {
  return (
    <RoleGuard allowedRoles={['admin', 'internalAgent', 'externalAgent', 'guest']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
} 