import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useDebounce } from "./useDebounce";
import type {
  Role,
  PermissionGroup,
  UpdatePermissionsPayload,
  Permission,
} from "@/types/role-permissions";

const QUERY_KEYS = {
  ROLES: ["/api/access-control/roles"],
  PERMISSIONS: ["/api/access-control/permissions"],
} as const;

/**
 * Custom hook for managing role permissions data and operations
 */
export function useRolePermissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch roles
  const {
    data: roles = [],
    isLoading: rolesLoading,
    error: rolesError,
  } = useQuery<Role[]>({
    queryKey: QUERY_KEYS.ROLES,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error: any) => {
      console.error('Error fetching roles:', error);
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        toast({
          title: "Network Error",
          description: "Unable to connect to the server. Please check your internet connection and try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Fetch permissions
  const {
    data: permissionsData,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = useQuery<PermissionGroup>({
    queryKey: QUERY_KEYS.PERMISSIONS,
    queryFn: async () => {
      try {
        const response = await fetch('/api/access-control/permissions', {
          credentials: 'include',
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch permissions: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        
        // Ensure data structure is correct
        if (!data.grouped || Object.keys(data.grouped).length === 0) {
          console.warn('Permissions data missing grouped structure, attempting to group manually', data);
          
          // If grouped is empty or missing, create it from all permissions
          if (data.all && Array.isArray(data.all)) {
            const grouped: Record<string, Permission[]> = {};
            
            data.all.forEach((perm: Permission) => {
              // Determine category from permission name
              let category = 'other';
              const name = perm.name.toLowerCase();
              
              if (name.includes('patient')) {
                category = 'patients';
              } else if (name.includes('visit')) {
                category = 'visits';
              } else if (name.includes('lab')) {
                category = 'lab';
              } else if (name.includes('consultation')) {
                category = 'consultations';
              } else if (name.includes('medication') || name.includes('prescription')) {
                category = 'medications';
              } else if (name.includes('referral')) {
                category = 'referrals';
              } else if (name.includes('user')) {
                category = 'users';
              } else if (name.includes('organization')) {
                category = 'organizations';
              } else if (name.includes('file')) {
                category = 'files';
              } else if (name.includes('dashboard') || name.includes('report') || name.includes('audit')) {
                category = 'dashboard';
              } else if (name.includes('appointment')) {
                category = 'appointments';
              } else if (name.includes('billing') || name.includes('invoice') || name.includes('payment')) {
                category = 'billing';
              }
              
              if (!grouped[category]) {
                grouped[category] = [];
              }
              grouped[category].push(perm);
            });
            
            return { all: data.all, grouped };
          }
        }
        
        return data;
      } catch (error: any) {
        console.error('Error fetching permissions:', error);
        // Handle network errors specifically
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          toast({
            title: "Network Error",
            description: "Unable to connect to the server. Please check your internet connection and try again.",
            variant: "destructive",
          });
        }
        throw error;
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error: any) => {
      console.error('Error fetching permissions:', error);
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        toast({
          title: "Network Error",
          description: "Unable to connect to the server. Please check your internet connection and try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Update role permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (payload: UpdatePermissionsPayload) => {
      return apiRequest(
        `/api/access-control/roles/${payload.roleId}/permissions`,
        "PUT",
        {
          permissionIds: payload.permissionIds,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES });
      toast({
        title: "Success",
        description: "Role permissions updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  return {
    roles,
    permissionsData,
    rolesLoading,
    permissionsLoading,
    rolesError,
    permissionsError,
    updatePermissions: updatePermissionsMutation.mutateAsync,
    isUpdating: updatePermissionsMutation.isPending,
  };
}

/**
 * Custom hook for managing role permissions state
 */
export function useRolePermissionsState(
  roles: Role[],
  permissionsData: PermissionGroup | undefined
) {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Debounce search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Get selected role
  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  // Initialize selected permissions when role changes
  useEffect(() => {
    if (selectedRole) {
      setSelectedPermissions(selectedRole.permissions.map((p) => p.id));
      setHasUnsavedChanges(false);
    }
  }, [selectedRole]);

  // Filter and group permissions
  const filteredPermissions = useMemo(() => {
    if (!permissionsData?.grouped) return {};

    const filtered: Record<string, typeof permissionsData.grouped[string]> = {};

    Object.entries(permissionsData.grouped).forEach(([category, perms]) => {
      const matchingPerms = perms.filter((perm) => {
        const matchesSearch =
          perm.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          perm.description
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase());
        const matchesCategory =
          filterCategory === "all" || category === filterCategory;
        return matchesSearch && matchesCategory;
      });

      if (matchingPerms.length > 0) {
        filtered[category] = matchingPerms;
      }
    });

    return filtered;
  }, [permissionsData, debouncedSearchTerm, filterCategory]);

  // Get all categories
  const categories = useMemo(() => {
    return Object.keys(filteredPermissions);
  }, [filteredPermissions]);

  // Toggle permission
  const togglePermission = useCallback(
    (permissionId: number) => {
      setSelectedPermissions((prev) => {
        const newPerms = prev.includes(permissionId)
          ? prev.filter((id) => id !== permissionId)
          : [...prev, permissionId];

        // Check if changes were made
        const originalPerms = selectedRole?.permissions.map((p) => p.id) || [];
        const hasChanges =
          newPerms.length !== originalPerms.length ||
          !newPerms.every((id) => originalPerms.includes(id)) ||
          !originalPerms.every((id) => newPerms.includes(id));

        setHasUnsavedChanges(hasChanges);
        return newPerms;
      });
    },
    [selectedRole]
  );

  // Select all permissions in category
  const selectAllInCategory = useCallback(
    (permissions: Permission[]) => {
      const permIds = permissions.map((p) => p.id);
      const allSelected = permIds.every((id) => selectedPermissions.includes(id));

      setSelectedPermissions((prev) => {
        const newPerms = allSelected
          ? prev.filter((id) => !permIds.includes(id))
          : [...new Set([...prev, ...permIds])];

        // Check if changes were made
        const originalPerms = selectedRole?.permissions.map((p) => p.id) || [];
        const hasChanges =
          newPerms.length !== originalPerms.length ||
          !newPerms.every((id) => originalPerms.includes(id)) ||
          !originalPerms.every((id) => newPerms.includes(id));

        setHasUnsavedChanges(hasChanges);
        return newPerms;
      });
    },
    [selectedPermissions, selectedRole]
  );

  // Select all permissions
  const selectAll = useCallback(() => {
    const allPermIds = permissionsData?.all.map((p) => p.id) || [];
    setSelectedPermissions(allPermIds);
    setHasUnsavedChanges(true);
  }, [permissionsData]);

  // Deselect all permissions
  const deselectAll = useCallback(() => {
    setSelectedPermissions([]);
    setHasUnsavedChanges(true);
  }, []);

  // Reset to original permissions
  const resetPermissions = useCallback(() => {
    if (selectedRole) {
      setSelectedPermissions(selectedRole.permissions.map((p) => p.id));
      setHasUnsavedChanges(false);
    }
  }, [selectedRole]);

  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Expand all categories
  const expandAll = useCallback(() => {
    setExpandedCategories(new Set(categories));
  }, [categories]);

  // Collapse all categories
  const collapseAll = useCallback(() => {
    setExpandedCategories(new Set());
  }, []);

  return {
    selectedRoleId,
    setSelectedRoleId,
    selectedRole,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    selectedPermissions,
    expandedCategories,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    filteredPermissions,
    categories,
    togglePermission,
    selectAllInCategory,
    selectAll,
    deselectAll,
    resetPermissions,
    toggleCategory,
    expandAll,
    collapseAll,
  };
}

