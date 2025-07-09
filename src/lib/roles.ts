import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type UserRole = 'admin' | 'internalAgent' | 'externalAgent' | 'guest';

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Get the current user's role
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('userRoles')
      .select('role')
      .eq('userId', user.id)
      .eq('isActive', true)
      .single();

    if (error || !data) return null;
    return data.role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Get the current user with their role
 */
export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('userRoles')
      .select('role')
      .eq('userId', user.id)
      .eq('isActive', true)
      .single();

    if (error || !data) return null;
    
    return {
      id: user.id,
      email: user.email || '',
      role: data.role
    };
  } catch (error) {
    console.error('Error getting user with role:', error);
    return null;
  }
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  return userRole === role;
}

/**
 * Check if the current user has any of the specified roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  return userRole ? roles.includes(userRole) : false;
}

/**
 * Check if the current user has admin privileges
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

/**
 * Check if the current user has internal agent privileges
 */
export async function isInternalAgent(): Promise<boolean> {
  return hasAnyRole(['admin', 'internalAgent']);
}

/**
 * Check if the current user can create visits
 */
export async function canCreateVisits(): Promise<boolean> {
  return hasAnyRole(['admin', 'internalAgent', 'externalAgent']);
}

/**
 * Check if the current user can manage data
 */
export async function canManageData(): Promise<boolean> {
  return hasAnyRole(['admin']);
}

/**
 * Check if the current user can view all visits
 */
export async function canViewAllVisits(): Promise<boolean> {
  return hasAnyRole(['admin']);
}

/**
 * Assign a role to a user (admin only)
 */
export async function assignUserRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    // First, deactivate any existing role for this user
    await supabase
      .from('userRoles')
      .update({ isActive: false })
      .eq('userId', userId);

    // Then insert the new role
    const { error } = await supabase
      .from('userRoles')
      .insert({
        userId,
        role,
        isActive: true
      });

    return !error;
  } catch (error) {
    console.error('Error assigning user role:', error);
    return false;
  }
}

/**
 * Get all users with their roles (admin only)
 */
export async function getAllUsersWithRoles(): Promise<UserWithRole[]> {
  try {
    const { data, error } = await supabase
      .from('userRoles')
      .select(`
        userId,
        role,
        users:userId (
          id,
          email
        )
      `)
      .eq('isActive', true);

    if (error || !data) return [];

    return data.map(item => ({
      id: item.userId,
      email: (item.users as any)?.email || '',
      role: item.role
    }));
  } catch (error) {
    console.error('Error getting all users with roles:', error);
    return [];
  }
}

/**
 * Role hierarchy for permission checking
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'admin': 4,
  'internalAgent': 3,
  'externalAgent': 2,
  'guest': 1
};

/**
 * Check if a role has permission over another role
 */
export function hasPermissionOver(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2];
} 