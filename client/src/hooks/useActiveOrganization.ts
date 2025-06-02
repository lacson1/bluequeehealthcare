import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface Organization {
  organizationId: number;
  name: string;
  type: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  registrationNumber?: string;
  licenseNumber?: string;
  description?: string;
  themeColor?: string;
  logoUrl?: string;
}

export function useActiveOrganization() {
  const { user } = useAuth();

  const { data: organization, isLoading, error } = useQuery<Organization>({
    queryKey: ['/api/user-organization'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });

  return {
    organization,
    isLoading,
    error,
    hasOrganization: !!organization?.organizationId
  };
}