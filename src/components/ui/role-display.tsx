import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useRoles } from '@/hooks/use-roles';
import { Shield, UserCheck, Users, UserX } from 'lucide-react';

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  internalAgent: 'bg-blue-100 text-blue-800 border-blue-200',
  externalAgent: 'bg-green-100 text-green-800 border-green-200',
  guest: 'bg-muted text-muted-foreground border-gray-200'
};

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield className="w-3 h-3" />,
  internalAgent: <UserCheck className="w-3 h-3" />,
  externalAgent: <Users className="w-3 h-3" />,
  guest: <UserX className="w-3 h-3" />
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  internalAgent: 'Internal Agent',
  externalAgent: 'External Agent',
  guest: 'Guest'
};

interface RoleDisplayProps {
  showIcon?: boolean;
  className?: string;
}

export function RoleDisplay({ showIcon = true, className = '' }: RoleDisplayProps) {
  const { userRole, loading } = useRoles();

  if (loading) {
    return (
      <Badge variant="outline" className={`animate-pulse ${className}`}>
        Caricamento...
      </Badge>
    );
  }

  if (!userRole) {
    return (
      <Badge variant="outline" className={`text-muted-foreground ${className}`}>
        Nessun ruolo
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`${roleColors[userRole]} ${className}`}
    >
      {showIcon && <span className="mr-1">{roleIcons[userRole]}</span>}
      {roleLabels[userRole]}
    </Badge>
  );
} 