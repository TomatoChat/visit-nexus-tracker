import { useState, useEffect, createContext, useContext } from 'react';
import { useRoles } from './use-roles';

interface AdminModeContextType {
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  setAdminMode: (mode: boolean) => void;
  canToggleAdminMode: boolean;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const { userRole } = useRoles();
  const isAdmin = userRole === 'admin';
  
  // Default to false (normal user mode) for admins
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  
  // Only admins can toggle admin mode
  const canToggleAdminMode = isAdmin;

  // Load admin mode preference from localStorage
  useEffect(() => {
    if (isAdmin) {
      const savedMode = localStorage.getItem('adminMode');
      if (savedMode !== null) {
        setIsAdminMode(savedMode === 'true');
      }
    }
  }, [isAdmin]);

  // Save admin mode preference to localStorage
  useEffect(() => {
    if (isAdmin) {
      localStorage.setItem('adminMode', isAdminMode.toString());
    }
  }, [isAdminMode, isAdmin]);

  const toggleAdminMode = () => {
    if (canToggleAdminMode) {
      setIsAdminMode(prev => !prev);
    }
  };

  const setAdminMode = (mode: boolean) => {
    if (canToggleAdminMode) {
      setIsAdminMode(mode);
    }
  };

  return (
    <AdminModeContext.Provider value={{
      isAdminMode,
      toggleAdminMode,
      setAdminMode,
      canToggleAdminMode
    }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (context === undefined) {
    throw new Error('useAdminMode must be used within an AdminModeProvider');
  }
  return context;
} 