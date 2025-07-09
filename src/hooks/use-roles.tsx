import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrentUserRole, 
  getCurrentUserWithRole, 
  hasRole, 
  hasAnyRole, 
  isAdmin, 
  isInternalAgent, 
  canCreateVisits, 
  canManageData, 
  canViewAllVisits,
  type UserRole,
  type UserWithRole
} from '@/lib/roles';

export function useRoles() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userWithRole, setUserWithRole] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshRole = useCallback(async () => {
    setLoading(true);
    try {
      const role = await getCurrentUserRole();
      const user = await getCurrentUserWithRole();
      setUserRole(role);
      setUserWithRole(user);
    } catch (error) {
      console.error('Error refreshing role:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRole();
  }, [refreshRole]);

  const checkRole = useCallback(async (role: UserRole): Promise<boolean> => {
    return await hasRole(role);
  }, []);

  const checkAnyRole = useCallback(async (roles: UserRole[]): Promise<boolean> => {
    return await hasAnyRole(roles);
  }, []);

  const checkIsAdmin = useCallback(async (): Promise<boolean> => {
    return await isAdmin();
  }, []);

  const checkIsInternalAgent = useCallback(async (): Promise<boolean> => {
    return await isInternalAgent();
  }, []);

  const checkCanCreateVisits = useCallback(async (): Promise<boolean> => {
    return await canCreateVisits();
  }, []);

  const checkCanManageData = useCallback(async (): Promise<boolean> => {
    return await canManageData();
  }, []);

  const checkCanViewAllVisits = useCallback(async (): Promise<boolean> => {
    return await canViewAllVisits();
  }, []);

  return {
    userRole,
    userWithRole,
    loading,
    refreshRole,
    checkRole,
    checkAnyRole,
    checkIsAdmin,
    checkIsInternalAgent,
    checkCanCreateVisits,
    checkCanManageData,
    checkCanViewAllVisits,
  };
} 