import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Save, RefreshCw, AlertCircle, Search, Plus, Stethoscope, Heart, Pill, Activity, ClipboardList, FlaskConical, Eye } from "lucide-react";

// Helper function to get role icon
const getRoleIcon = (roleName: string) => {
  const icons: Record<string, string> = {
    doctor: "👨‍⚕️",
    nurse: "👩‍⚕️",
    pharmacist: "💊",
    physiotherapist: "🏃",
    receptionist: "📞",
    admin: "⚙️",
    superadmin: "👑",
  };
  return icons[roleName.toLowerCase()] || "👤";
};
import {
  useRolePermissions,
  useRolePermissionsState,
} from "@/hooks/useRolePermissions";
import { RoleList } from "@/components/role-permissions/RoleList";
import { SearchAndFilters } from "@/components/role-permissions/SearchAndFilters";
import { QuickActions } from "@/components/role-permissions/QuickActions";
import { PermissionCategory } from "@/components/role-permissions/PermissionCategory";
import { UnsavedChangesDialog } from "@/components/role-permissions/UnsavedChangesDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ROLE_TEMPLATES, getTemplatePermissionIds, type RoleTemplate } from "@/utils/role-templates";

/**
 * Role-Based Permission Management Page
 * 
 * Industry-standard implementation with:
 * - Separated concerns (custom hooks, components)
 * - Accessibility (ARIA labels, keyboard navigation)
 * - Performance optimizations (debouncing, memoization)
 * - Type safety (TypeScript interfaces)
 * - Error handling and loading states
 * - Reusable components
 */
export default function RolePermissions() {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingRoleId, setPendingRoleId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<RoleTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Icon mapping for templates
  const templateIcons: Record<string, any> = {
    Stethoscope,
    Heart,
    Pill,
    Activity,
    ClipboardList,
    Shield,
    FlaskConical,
    Eye,
  };

  const {
    roles,
    permissionsData,
    rolesLoading,
    permissionsLoading,
    rolesError,
    permissionsError,
    updatePermissions,
    isUpdating,
  } = useRolePermissions();

  const {
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
  } = useRolePermissionsState(roles, permissionsData);

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; permissionIds: number[] }) => {
      const response = await apiRequest("/api/access-control/roles", "POST", data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create role: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: async (newRole) => {
      // Invalidate and refetch roles to get the updated list
      await queryClient.invalidateQueries({ queryKey: ["/api/access-control/roles"] });
      setCreateDialogOpen(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedTemplate(null);
      
      // Select the newly created role after a short delay to ensure it's in the list
      setTimeout(() => {
        if (newRole?.id) {
          setSelectedRoleId(newRole.id);
        }
      }, 100);
      
      toast({
        title: "Success",
        description: `Role "${newRole.name || newRoleName}" created successfully`,
      });
    },
    onError: (error: any) => {
      console.error("Error creating role:", error);
      toast({
        title: "Error Creating Role",
        description: error.message || "Failed to create role. Please check your connection and try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateRole = () => {
    // Validate role name
    const trimmedName = newRoleName.trim();
    if (!trimmedName) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    // Check if role name already exists
    const roleNameExists = roles.some(
      (role) => role.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (roleNameExists) {
      toast({
        title: "Validation Error",
        description: `A role with the name "${trimmedName}" already exists`,
        variant: "destructive",
      });
      return;
    }

    // If template is selected, use template permissions, otherwise use currently selected permissions
    const permissionIds = selectedTemplate && permissionsData?.all
      ? getTemplatePermissionIds(selectedTemplate, permissionsData.all)
      : selectedPermissions;

    createRoleMutation.mutate({
      name: trimmedName,
      description: newRoleDescription.trim(),
      permissionIds: permissionIds || [],
    });
  };

  const handleTemplateSelect = (template: RoleTemplate) => {
    setSelectedTemplate(template);
    setNewRoleName(template.name);
    setNewRoleDescription(template.description);
    
    // Pre-select permissions based on template
    if (permissionsData?.all) {
      const templatePermIds = getTemplatePermissionIds(template, permissionsData.all);
      // Note: We can't directly set selectedPermissions here as it's managed by the hook
      // The permissions will be set when the role is created
    }
  };

  // Handle role selection with unsaved changes check
  const handleRoleSelect = useCallback(
    (roleId: number) => {
      if (hasUnsavedChanges && selectedRoleId !== roleId) {
        setPendingRoleId(roleId);
        setShowSaveDialog(true);
        return;
      }
      setSelectedRoleId(roleId);
    },
    [hasUnsavedChanges, selectedRoleId]
  );

  // Save permissions
  const handleSave = useCallback(async () => {
    if (!selectedRoleId) return;

    try {
      await updatePermissions({
        roleId: selectedRoleId,
        permissionIds: selectedPermissions,
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [selectedRoleId, selectedPermissions, updatePermissions, setHasUnsavedChanges]);

  // Handle discard changes
  const handleDiscard = useCallback(() => {
    setShowSaveDialog(false);
    setHasUnsavedChanges(false);
    if (pendingRoleId) {
      setSelectedRoleId(pendingRoleId);
      setPendingRoleId(null);
    }
  }, [pendingRoleId, setSelectedRoleId, setHasUnsavedChanges]);

  // Handle save and switch
  const handleSaveAndSwitch = useCallback(async () => {
    if (!selectedRoleId) return;

    try {
      await updatePermissions({
        roleId: selectedRoleId,
        permissionIds: selectedPermissions,
      });
      setShowSaveDialog(false);
      setHasUnsavedChanges(false);
      if (pendingRoleId) {
        setSelectedRoleId(pendingRoleId);
        setPendingRoleId(null);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [
    selectedRoleId,
    selectedPermissions,
    pendingRoleId,
    updatePermissions,
    setSelectedRoleId,
    setHasUnsavedChanges,
  ]);

  // Debug: Log permissions data (must be before early returns)
  useEffect(() => {
    if (permissionsData) {
      console.log('Permissions Data:', {
        allCount: permissionsData.all?.length || 0,
        groupedCount: Object.keys(permissionsData.grouped || {}).length,
        categories: Object.keys(permissionsData.grouped || {}),
        grouped: permissionsData.grouped,
      });
    }
    if (permissionsError) {
      console.error('Permissions Error:', permissionsError);
    }
  }, [permissionsData, permissionsError]);

  // Note: Error toasts are handled in the useRolePermissions hook to avoid duplicates

  // Loading state (must be after all hooks)
  if (rolesLoading || permissionsLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (rolesError || permissionsError) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="space-y-4">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Error Loading Data
              </CardTitle>
              <CardDescription>
                {rolesError && permissionsError 
                  ? "Failed to load both roles and permissions"
                  : rolesError 
                  ? "Failed to load roles"
                  : "Failed to load permissions"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {rolesError instanceof Error && rolesError.message.includes('Failed to fetch')
                    ? "Network error: Please check your internet connection and ensure the server is running."
                    : permissionsError instanceof Error && permissionsError.message.includes('Failed to fetch')
                    ? "Network error: Please check your internet connection and ensure the server is running."
                    : "An error occurred while loading data. Please try refreshing the page."}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/access-control/roles"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/access-control/permissions"] });
                    }}
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="default"
                  >
                    Refresh Page
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <header className="space-y-4">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            Role-Based Permission Management
          </h1>
          <p className="text-muted-foreground text-base pl-[52px]">
            Select and manage function permissions for each role. Use checkboxes to grant or revoke access to specific features.
          </p>
        </div>
        {selectedRole && (
          <div className="bg-muted/50 border rounded-lg p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <div className="font-semibold text-sm text-muted-foreground">Managing Permissions For</div>
                <div className="text-lg font-bold">{selectedRole.name.charAt(0).toUpperCase() + selectedRole.name.slice(1)}</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="space-y-1">
                <div className="font-semibold text-sm text-muted-foreground">Current Selection</div>
                <div className="text-lg font-bold">
                  {selectedPermissions.length} / {permissionsData?.all.length || 0} permissions
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50">
                  <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                  Unsaved Changes
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={resetPermissions}
                disabled={!hasUnsavedChanges}
                aria-label="Reset unsaved changes"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isUpdating}
                aria-label="Save permission changes"
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles List */}
        <RoleList
          roles={roles}
          selectedRoleId={selectedRoleId}
          onRoleSelect={handleRoleSelect}
          onCreateRole={() => setCreateDialogOpen(true)}
        />

        {/* Permissions Management */}
        <Card className="lg:col-span-3 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-muted/30 to-muted/10 px-6 py-5">
            <div className="space-y-2">
              <CardTitle className="text-xl flex items-center gap-2">
                {selectedRole ? (
                  <>
                    <span className="text-2xl">{getRoleIcon(selectedRole.name)}</span>
                    <span>Permissions for {selectedRole.name.charAt(0).toUpperCase() + selectedRole.name.slice(1)}</span>
                  </>
                ) : (
                  "Select a Role"
                )}
              </CardTitle>
              <CardDescription>
                {selectedRole
                  ? `Use the checkboxes below to grant or revoke permissions. Each permission controls access to specific features in the system.`
                  : "Choose a role from the left panel to manage its permissions"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!selectedRole ? (
              <div
                className="flex flex-col items-center justify-center h-[500px] text-center bg-muted/20 rounded-lg border-2 border-dashed p-8"
                role="status"
                aria-live="polite"
              >
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Shield
                    className="h-16 w-16 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Role Selected</h3>
                <p className="text-muted-foreground max-w-md">
                  Select a role from the left panel to view and manage its permissions. 
                  You can grant or revoke access to specific features using the checkboxes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <SearchAndFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filterCategory={filterCategory}
                    onFilterChange={setFilterCategory}
                    categories={categories}
                  />
                </div>

                {/* Quick Actions */}
                {permissionsData?.all.length === 0 && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-amber-800 mb-1">No Permissions Found</h3>
                        <p className="text-sm text-amber-700">The permissions database is empty. Click below to seed permissions.</p>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            // Use GET endpoint which has auto-seed built in
                            const response = await fetch('/api/access-control/permissions', {
                              credentials: 'include',
                              cache: 'no-cache',
                              headers: {
                                'Cache-Control': 'no-cache'
                              }
                            });
                            
                            if (!response.ok) {
                              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }
                            
                            const data = await response.json();
                            
                            if (data.all && data.all.length > 0) {
                              toast({
                                title: "Success",
                                description: `Loaded ${data.all.length} permissions successfully`,
                              });
                              // Refresh permissions data
                              queryClient.invalidateQueries({ queryKey: ["/api/access-control/permissions"] });
                            } else {
                              toast({
                                title: "Info",
                                description: "Permissions table is empty. Auto-seed may have run. Please refresh the page.",
                              });
                              // Force refresh after a delay
                              setTimeout(() => {
                                queryClient.invalidateQueries({ queryKey: ["/api/access-control/permissions"] });
                                window.location.reload();
                              }, 2000);
                            }
                          } catch (error: any) {
                            console.error('Error loading permissions:', error);
                            toast({
                              title: "Error",
                              description: error.message || "Failed to load permissions. Check server logs for details.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Load Permissions
                      </Button>
                    </div>
                  </div>
                )}
                <QuickActions
                  onExpandAll={expandAll}
                  onCollapseAll={collapseAll}
                  onSelectAll={selectAll}
                  onDeselectAll={deselectAll}
                  selectedCount={selectedPermissions.length}
                  totalCount={permissionsData?.all.length || 0}
                />

                {/* Permissions List */}
                <ScrollArea className="h-[calc(100vh-550px)] border-2 rounded-lg p-5 bg-muted/10">
                  {Object.keys(filteredPermissions).length === 0 ? (
                    <div
                      className="text-center py-16 text-muted-foreground"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="p-4 bg-muted rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <Search
                          className="h-10 w-10 opacity-50"
                          aria-hidden="true"
                        />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No Permissions Found</h3>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  ) : (
                    <div className="space-y-3" role="list" aria-label="Permission categories">
                      {Object.entries(filteredPermissions).map(
                        ([category, perms]) => (
                          <PermissionCategory
                            key={category}
                            category={category}
                            permissions={perms}
                            isExpanded={expandedCategories.has(category)}
                            selectedPermissions={selectedPermissions}
                            onToggleCategory={() => toggleCategory(category)}
                            onTogglePermission={togglePermission}
                            onSelectAllInCategory={selectAllInCategory}
                          />
                        )
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Role Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) {
          setNewRoleName("");
          setNewRoleDescription("");
          setSelectedTemplate(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Start from a template or create a custom role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Template Selection */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Role Templates</Label>
              <ScrollArea className="h-48 border rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_TEMPLATES.map((template) => {
                    const Icon = templateIcons[template.icon] || Shield;
                    const isSelected = selectedTemplate?.id === template.id;
                    return (
                      <div
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={`
                          p-3 rounded-lg border cursor-pointer transition-all
                          ${isSelected 
                            ? `${template.color} border-2` 
                            : 'bg-card hover:bg-accent border-border'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isSelected ? '' : 'text-muted-foreground'}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm ${isSelected ? '' : ''}`}>
                              {template.name}
                            </div>
                            <div className={`text-xs mt-0.5 ${isSelected ? 'opacity-90' : 'text-muted-foreground'}`}>
                              {template.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Role Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-role-name">Role Name *</Label>
                <Input
                  id="new-role-name"
                  value={newRoleName}
                  onChange={(e) => {
                    setNewRoleName(e.target.value);
                    if (selectedTemplate && e.target.value !== selectedTemplate.name) {
                      setSelectedTemplate(null);
                    }
                  }}
                  placeholder="e.g., Senior Doctor"
                  className="mt-1"
                  disabled={createRoleMutation.isPending}
                  maxLength={100}
                />
                {newRoleName.trim() && roles.some(
                  (role) => role.name.toLowerCase() === newRoleName.trim().toLowerCase()
                ) && (
                  <p className="text-xs text-destructive mt-1">
                    A role with this name already exists
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="new-role-description">Description</Label>
                <Input
                  id="new-role-description"
                  value={newRoleDescription}
                  onChange={(e) => {
                    setNewRoleDescription(e.target.value);
                    if (selectedTemplate && e.target.value !== selectedTemplate.description) {
                      setSelectedTemplate(null);
                    }
                  }}
                  placeholder="Brief description of the role"
                  className="mt-1"
                  disabled={createRoleMutation.isPending}
                  maxLength={255}
                />
              </div>
              {selectedTemplate && permissionsData?.all && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <div className="text-sm font-medium">
                      Template will include {getTemplatePermissionIds(selectedTemplate, permissionsData.all).length} permissions
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    You can customize permissions after creating the role
                  </div>
                </div>
              )}
              {!selectedTemplate && selectedPermissions.length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-1">
                    {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''} will be assigned
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Based on current selection
                  </div>
                </div>
              )}
              {!selectedTemplate && selectedPermissions.length === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-sm font-medium text-amber-800 mb-1">
                    No permissions selected
                  </div>
                  <div className="text-xs text-amber-700">
                    The role will be created without permissions. You can add them later.
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setNewRoleName("");
                  setNewRoleDescription("");
                  setSelectedTemplate(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRole}
                disabled={createRoleMutation.isPending || !newRoleName.trim()}
              >
                {createRoleMutation.isPending ? "Creating..." : "Create Role"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onDiscard={handleDiscard}
        onSave={handleSaveAndSwitch}
        isSaving={isUpdating}
      />
    </div>
  );
}
