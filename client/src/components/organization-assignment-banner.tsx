import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Building2, ExternalLink, RefreshCw } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: number;
  name: string;
  type: string;
}

export function OrganizationAssignmentBanner() {
  const { user, refreshUser } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(() => {
    // Check if banner was dismissed in this session
    return sessionStorage.getItem('org-assignment-banner-dismissed') === 'true';
  });

  // Fetch available organizations
  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ['/api/organizations'],
    enabled: !!user && !user.organizationId,
    retry: false,
  });

  // Check if user needs organization assignment
  const needsAssignment = user && !user.organizationId && !dismissed;

  // Don't show on login or select-organization pages
  const shouldShow = needsAssignment && 
    !location.includes('/login') && 
    !location.includes('/select-organization') &&
    !location.includes('/signup');

  useEffect(() => {
    if (needsAssignment && shouldShow) {
      // Show a one-time toast to guide the user
      const hasSeenToast = sessionStorage.getItem('org-assignment-toast-shown');
      if (!hasSeenToast) {
        toast({
          title: 'Organization Assignment Required',
          description: 'Your account needs to be assigned to an organization. Please use the admin panel or contact an administrator.',
          variant: 'destructive',
          duration: 8000,
        });
        sessionStorage.setItem('org-assignment-toast-shown', 'true');
      }
    }
  }, [needsAssignment, shouldShow, toast]);

  if (!shouldShow) {
    return null;
  }

  const handleGoToUserManagement = () => {
    setLocation('/user-management');
  };

  const handleRefresh = async () => {
    // Refresh user data to check if organization was assigned
    await refreshUser();
    queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    toast({
      title: 'Refreshed',
      description: 'Checking for organization assignment...',
      duration: 2000,
    });
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Store dismissal for this session
    sessionStorage.setItem('org-assignment-banner-dismissed', 'true');
  };

  return (
    <Alert variant="destructive" className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-950">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Organization Assignment Required
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 px-2 text-xs"
        >
          Dismiss
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>
          Your account is not assigned to an organization. This is required to access most features of the system.
        </p>
        
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="h-8 text-xs"
            title="Refresh to check if organization was assigned"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          
          {user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'super_admin' ? (
            <>
              <Button
                size="sm"
                onClick={handleGoToUserManagement}
                className="h-8 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Assign via Admin Panel
              </Button>
              {organizations && organizations.length > 0 && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>Available organizations:</span>
                  <span className="font-medium">
                    {organizations.map(org => org.name).join(', ')}
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm">
              Please contact an administrator to assign you to an organization, or ask them to run:
              <code className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                node fix-user-organization.mjs {user?.username} [orgId]
              </code>
            </p>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-orange-200 dark:border-orange-800">
          <strong>Quick Fix:</strong> If you have admin access, go to User Management → Find your account → Edit → Select Organization → Save
        </div>
      </AlertDescription>
    </Alert>
  );
}

