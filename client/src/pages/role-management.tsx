import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Users, Plus, Edit, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Permission {
  id: number;
  name: string;
  description: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  userCount: number;
  permissions: Permission[];
  createdAt: string;
}

interface PermissionGroup {
  all: Permission[];
  grouped: Record<string, Permission[]>;
}

export default function RoleManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/access-control/roles"],
  });

  // Fetch permissions
  const { data: permissionsData } = useQuery<PermissionGroup>({
    queryKey: ["/api/access-control/permissions"],
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; permissionIds: number[] }) => {
      return apiRequest("/api/access-control/roles", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-control/roles"] });
      setCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Role created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });

  // Update role permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { roleId: number; permissionIds: number[] }) => {
      return apiRequest(`/api/access-control/roles/${data.roleId}/permissions`, "PUT", {
        permissionIds: data.permissionIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-control/roles"] });
      setEditDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Role permissions updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      return apiRequest(`/api/access-control/roles/${roleId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-control/roles"] });
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setSelectedRole(null);
  };

  const handleCreateRole = () => {
    if (!roleName.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    createRoleMutation.mutate({
      name: roleName,
      description: roleDescription,
      permissionIds: selectedPermissions,
    });
  };

  const handleUpdatePermissions = () => {
    if (!selectedRole) return;

    updatePermissionsMutation.mutate({
      roleId: selectedRole.id,
      permissionIds: selectedPermissions,
    });
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setSelectedPermissions(role.permissions.map(p => p.id));
    setEditDialogOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (role.userCount > 0) {
      toast({
        title: "Cannot Delete",
        description: `This role is assigned to ${role.userCount} user(s). Please reassign them first.`,
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const selectAllInCategory = (permissions: Permission[]) => {
    const permIds = permissions.map(p => p.id);
    const allSelected = permIds.every(id => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !permIds.includes(id)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...permIds])]);
    }
  };

  if (rolesLoading) {
    return (
      <div className="h-full flex flex-col">
        <header className="healthcare-header px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-white drop-shadow-sm">Role Management</h2>
              <p className="text-white/90 font-medium">Manage roles and permissions for your staff members</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <div className="text-center">Loading roles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Fixed Header */}
      <header className="healthcare-header px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-white drop-shadow-sm flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Role Management
            </h2>
            <p className="text-white/90 font-medium">Manage roles and permissions for your staff members</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                data-testid="button-create-role"
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role and assign permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  data-testid="input-role-name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Senior Doctor"
                />
              </div>
              <div>
                <Label htmlFor="role-description">Description</Label>
                <Input
                  id="role-description"
                  data-testid="input-role-description"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Brief description of the role"
                />
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Permissions</Label>
                <ScrollArea className="h-[400px] border rounded-md p-4">
                  {permissionsData?.grouped && Object.entries(permissionsData.grouped).map(([category, perms]) => (
                    <div key={category} className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold capitalize text-sm">{category}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-select-all-${category}`}
                          onClick={() => selectAllInCategory(perms)}
                        >
                          {perms.every(p => selectedPermissions.includes(p.id)) ? "Deselect All" : "Select All"}
                        </Button>
                      </div>
                      <div className="space-y-2 ml-4">
                        {perms.map((perm) => (
                          <div key={perm.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`perm-${perm.id}`}
                              data-testid={`checkbox-permission-${perm.name}`}
                              checked={selectedPermissions.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <Label htmlFor={`perm-${perm.id}`} className="text-sm cursor-pointer flex-1">
                              <div className="font-medium">{perm.name}</div>
                              <div className="text-xs text-muted-foreground">{perm.description}</div>
                            </Label>
                          </div>
                        ))}
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    resetForm();
                  }}
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRole}
                  disabled={createRoleMutation.isPending}
                  data-testid="button-confirm-create"
                >
                  {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} data-testid={`card-role-${role.id}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{role.name}</span>
                <Badge variant="secondary" data-testid={`badge-user-count-${role.id}`}>
                  <Users className="h-3 w-3 mr-1" />
                  {role.userCount}
                </Badge>
              </CardTitle>
              <CardDescription>{role.description || "No description"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Permissions ({role.permissions.length})
                  </Label>
                  <ScrollArea className="h-24">
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 10).map((perm) => (
                        <Badge key={perm.id} variant="outline" className="text-xs">
                          {perm.name.split('.')[1] || perm.name}
                        </Badge>
                      ))}
                      {role.permissions.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditRole(role)}
                    data-testid={`button-edit-role-${role.id}`}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRole(role)}
                    disabled={role.userCount > 0}
                    data-testid={`button-delete-role-${role.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>

        {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Update permissions for this role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium">{selectedRole?.name}</p>
              <p className="text-xs text-muted-foreground">{selectedRole?.description}</p>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">Permissions</Label>
              <ScrollArea className="h-[400px] border rounded-md p-4">
                {permissionsData?.grouped && Object.entries(permissionsData.grouped).map(([category, perms]) => (
                  <div key={category} className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold capitalize text-sm">{category}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAllInCategory(perms)}
                      >
                        {perms.every(p => selectedPermissions.includes(p.id)) ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    <div className="space-y-2 ml-4">
                      {perms.map((perm) => (
                        <div key={perm.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-perm-${perm.id}`}
                            checked={selectedPermissions.includes(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                          <Label htmlFor={`edit-perm-${perm.id}`} className="text-sm cursor-pointer flex-1">
                            <div className="font-medium">{perm.name}</div>
                            <div className="text-xs text-muted-foreground">{perm.description}</div>
                          </Label>
                        </div>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </ScrollArea>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePermissions}
                disabled={updatePermissionsMutation.isPending}
              >
                {updatePermissionsMutation.isPending ? "Updating..." : "Update Permissions"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
