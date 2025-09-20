import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export function useRole() {
  const { user } = useAuth();
  
  const hasRole = (role: string) => user?.role === role;
  const hasAnyRole = (roles: string[]) => user?.role ? roles.includes(user.role) : false;
  
  return {
    user,
    hasRole,
    hasAnyRole,
    isAdmin: hasRole('admin'),
    isDoctor: hasRole('doctor'),
    isNurse: hasRole('nurse'),
    isPharmacist: hasRole('pharmacist'),
    isPhysiotherapist: hasRole('physiotherapist'),
  };
}