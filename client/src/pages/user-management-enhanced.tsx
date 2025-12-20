import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { User, InsertUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, Edit, Trash2, Shield, UserX, Users, Settings, Search, Grid3X3, List, Filter, X, Stethoscope, Pill, Heart, Activity, ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { StaffRegistrationModal } from "@/components/staff-registration-modal";
import { OrganizationRegistrationModal } from "@/components/organization-registration-modal";
import type { Role } from "@/types/role-permissions";

const USER_ROLES = [
  {
    value: "admin",
    label: "Administrator",
    color: "bg-red-100 text-red-800",
    icon: Shield,
    description: "Full system access and management",
    specialty: "System Administration"
  },
  {
    value: "doctor",
    label: "Doctor",
    color: "bg-blue-100 text-blue-800",
    icon: Stethoscope,
    description: "Patient diagnosis and treatment",
    specialty: "General Medicine"
  },
  {
    value: "nurse",
    label: "Nurse",
    color: "bg-green-100 text-green-800",
    icon: Heart,
    description: "Patient care and vital monitoring",
    specialty: "Nursing Care"
  },
  {
    value: "pharmacist",
    label: "Pharmacist",
    color: "bg-purple-100 text-purple-800",
    icon: Pill,
    description: "Medication management and dispensing",
    specialty: "Pharmaceutical Care"
  },
  {
    value: "physiotherapist",
    label: "Physiotherapist",
    color: "bg-orange-100 text-orange-800",
    icon: Activity,
    description: "Physical therapy and rehabilitation",
    specialty: "Physical Therapy"
  },
  {
    value: "receptionist",
    label: "Receptionist",
    color: "bg-teal-100 text-teal-800",
    icon: ClipboardList,
    description: "Patient registration and appointments",
    specialty: "Front Desk"
  }
];

export default function UserManagementEnhanced() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [managementTab, setManagementTab] = useState<"users" | "organizations">("users");
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for create/edit
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "",
    roleId: "",
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    photoUrl: "",
    organizationId: ""
  });

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch organizations
  const { data: organizations = [] } = useQuery({
    queryKey: ["/api/organizations"],
  });

  // Fetch RBAC roles
  const { data: rbacRoles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/access-control/roles"],
  });

  // Create a map of roleId to role for quick lookup
  const roleMap = useMemo(() => {
    const map = new Map<number, Role>();
    rbacRoles.forEach(role => {
      map.set(role.id, role);
    });
    return map;
  }, [rbacRoles]);

  // Get role name for a user (prefer RBAC role, fallback to legacy role)
  const getUserRoleName = (user: User): string => {
    if (user.roleId && roleMap.has(user.roleId)) {
      return roleMap.get(user.roleId)!.name;
    }
    return user.role || "No Role";
  };

  // Get role display info for a user
  const getUserRoleInfo = (user: User) => {
    if (user.roleId && roleMap.has(user.roleId)) {
      const role = roleMap.get(user.roleId)!;
      // Try to match with legacy role config for icon/color
      const legacyRole = USER_ROLES.find(r => r.value.toLowerCase() === role.name.toLowerCase());
      return {
        name: role.name,
        description: role.description || legacyRole?.description || "",
        icon: legacyRole?.icon || Shield,
        color: legacyRole?.color || "bg-gray-100 text-gray-800",
      };
    }
    // Fallback to legacy role
    return getRoleConfig(user.role);
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await apiRequest("/api/users", "POST", userData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to create user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "User created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive"
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: any }) => {
      try {
        console.log("Mutation: Sending update request for user", id, "with data:", userData);
        const response = await apiRequest(`/api/users/${id}`, "PATCH", userData);
        console.log("Mutation: Response received:", response.status, response.statusText);
        const data = await response.json();
        console.log("Mutation: Response data:", data);
        return data;
      } catch (error: any) {
        console.error("Mutation: Error caught:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Mutation: Success callback triggered", data);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "User updated successfully"
      });
    },
    onError: (error: any) => {
      console.error("Mutation: Error callback triggered", error);
      const errorMessage = error?.message || error?.toString() || "Failed to update user";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/users/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      role: "",
      roleId: "",
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      photoUrl: "",
      organizationId: ""
    });
  };

  const handleCreateUser = () => {
    if (!formData.username || !formData.password || !formData.organizationId) {
      toast({
        title: "Error",
        description: "Username, password, and organization are required",
        variant: "destructive"
      });
      return;
    }

    // Validate role is provided (either roleId or role)
    if (!formData.roleId && !formData.role) {
      toast({
        title: "Error",
        description: "Role is required. Please select a role for the user.",
        variant: "destructive"
      });
      return;
    }

    // Use roleId if provided, otherwise fallback to role string
    const userData: any = {
      username: formData.username,
      password: formData.password,
      organizationId: parseInt(formData.organizationId),
      title: formData.title,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      photoUrl: formData.photoUrl,
    };

    // Prefer roleId (RBAC) over role (legacy)
    if (formData.roleId && formData.roleId !== '') {
      const roleIdNum = parseInt(formData.roleId);
      if (!isNaN(roleIdNum)) {
        userData.roleId = roleIdNum;
        // Also set legacy role for backward compatibility
        const selectedRole = rbacRoles.find(r => r.id === roleIdNum);
        if (selectedRole) {
          userData.role = selectedRole.name.toLowerCase();
        } else {
          toast({
            title: "Error",
            description: "Selected role not found. Please select a valid role.",
            variant: "destructive"
          });
          return;
        }
      }
    } else if (formData.role && formData.role.trim() !== '') {
      userData.role = formData.role.trim();
    } else {
      toast({
        title: "Error",
        description: "Role cannot be empty. Please select a valid role.",
        variant: "destructive"
      });
      return;
    }

    createUserMutation.mutate(userData);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "No user selected",
        variant: "destructive"
      });
      return;
    }

    try {
      const updateData: any = {};

      // Only include fields that have values
      if (formData.username && formData.username.trim()) {
        updateData.username = formData.username.trim();
      }
      if (formData.title !== undefined) {
        updateData.title = formData.title === 'none' || formData.title === '' ? null : formData.title;
      }
      if (formData.firstName !== undefined) {
        updateData.firstName = formData.firstName.trim() || null;
      }
      if (formData.lastName !== undefined) {
        updateData.lastName = formData.lastName.trim() || null;
      }
      if (formData.email !== undefined) {
        updateData.email = formData.email.trim() || null;
      }
      if (formData.phone !== undefined) {
        updateData.phone = formData.phone.trim() || null;
      }
      if (formData.photoUrl !== undefined) {
        updateData.photoUrl = formData.photoUrl.trim() || null;
      }

      if (formData.organizationId && formData.organizationId !== '') {
        updateData.organizationId = parseInt(formData.organizationId);
      }

      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password;
      }

      // Prefer roleId (RBAC) over role (legacy)
      // IMPORTANT: If role is being updated, validate it's not empty
      if (formData.roleId && formData.roleId !== '') {
        const roleIdNum = parseInt(formData.roleId);
        if (!isNaN(roleIdNum)) {
          updateData.roleId = roleIdNum;
          // Also set legacy role for backward compatibility
          const selectedRole = rbacRoles.find(r => r.id === roleIdNum);
          if (selectedRole) {
            updateData.role = selectedRole.name.toLowerCase();
          } else {
            toast({
              title: "Error",
              description: "Selected role not found. Please select a valid role.",
              variant: "destructive"
            });
            return;
          }
        }
      } else if (formData.role !== undefined && formData.role !== null) {
        // If role field is explicitly set (even if empty), validate it
        if (formData.role === '' || formData.role.trim() === '') {
          toast({
            title: "Error",
            description: "Role cannot be empty. Users must have a role assigned.",
            variant: "destructive"
          });
          return;
        }
        updateData.role = formData.role.trim();
      }
      // If neither roleId nor role is provided, we don't update the role (preserve existing)

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      if (Object.keys(updateData).length === 0) {
        toast({
          title: "No changes",
          description: "Please make at least one change before updating",
          variant: "destructive"
        });
        return;
      }

      console.log("handleUpdateUser: Calling mutation with:", { id: selectedUser.id, userData: updateData });
      updateUserMutation.mutate(
        { id: selectedUser.id, userData: updateData },
        {
          onSuccess: (data) => {
            console.log("handleUpdateUser: Mutation success", data);
          },
          onError: (error) => {
            console.error("handleUpdateUser: Mutation error", error);
          }
        }
      );
    } catch (error: any) {
      console.error("Error in handleUpdateUser:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to prepare update data",
        variant: "destructive"
      });
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role || "",
      roleId: user.roleId?.toString() || "",
      title: user.title || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      photoUrl: user.photoUrl || "",
      organizationId: user.organizationId?.toString() || ""
    });
    setEditDialogOpen(true);
  };

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number | null }) => {
      return apiRequest(`/api/access-control/users/${userId}/role`, "PUT", { roleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/access-control/roles"] });
      setAssignRoleDialogOpen(false);
      setSelectedUserForRole(null);
      setSelectedRoleId("");
      toast({
        title: "Success",
        description: "Role assigned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    },
  });

  const handleAssignRoleClick = (user: User) => {
    setSelectedUserForRole(user);
    setSelectedRoleId(user.roleId?.toString() || "");
    setAssignRoleDialogOpen(true);
  };

  const handleAssignRole = () => {
    if (!selectedUserForRole) return;
    assignRoleMutation.mutate({
      userId: selectedUserForRole.id,
      roleId: selectedRoleId ? parseInt(selectedRoleId) : null,
    });
  };

  const handleDeleteUser = (id: number) => {
    deleteUserMutation.mutate(id);
  };

  // Photo upload handler
  const handlePhotoUpload = async (file: File, userId?: number) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiRequest("/api/upload/staff", "POST", formData);
      const photoUrl = response.url;

      if (userId) {
        await apiRequest(`/api/users/${userId}`, "PATCH", { photoUrl });
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        toast({
          title: "Success",
          description: "Profile photo updated successfully"
        });
      } else {
        setFormData(prev => ({ ...prev, photoUrl }));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Enhanced filtering logic
  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (activeTab !== "all") {
      filtered = filtered.filter(user => {
        const roleName = getUserRoleName(user).toLowerCase();
        return roleName === activeTab || user.role === activeTab;
      });
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => {
        const roleName = getUserRoleName(user).toLowerCase();
        return (
          user.username.toLowerCase().includes(searchLower) ||
          (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
          (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          roleName.includes(searchLower) ||
          (user.role && user.role.toLowerCase().includes(searchLower))
        );
      });
    }

    if (filterSpecialty && filterSpecialty !== "all") {
      filtered = filtered.filter(user => {
        const roleName = getUserRoleName(user).toLowerCase();
        return roleName === filterSpecialty || user.role === filterSpecialty;
      });
    }

    return filtered;
  }, [users, activeTab, searchTerm, filterSpecialty, getUserRoleName]);

  // Helper functions
  const getUserInitials = (user: User) => {
    const firstName = user.firstName || user.username.charAt(0);
    const lastName = user.lastName || user.username.charAt(1);
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleConfig = (role: string) => {
    return USER_ROLES.find(r => r.value === role) || USER_ROLES[0];
  };

  const getRoleCounts = () => {
    const counts: { [key: string]: number } = { all: users.length };

    // Count RBAC roles
    rbacRoles.forEach(role => {
      counts[role.name.toLowerCase()] = users.filter(u =>
        u.roleId === role.id || getUserRoleName(u).toLowerCase() === role.name.toLowerCase()
      ).length;
    });

    // Also count legacy roles for backward compatibility
    USER_ROLES.forEach(role => {
      if (!counts[role.value]) {
        counts[role.value] = users.filter(u => u.role === role.value && !u.roleId).length;
      }
    });

    return counts;
  };

  const roleCounts = getRoleCounts();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Fixed Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">User Management</h1>
              <p className="text-slate-600 mt-1">Manage clinic staff accounts and permissions</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowStaffModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
              >
                <Stethoscope className="w-4 h-4 mr-2" />
                Register Staff
              </Button>

              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add New User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Enter username"
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password"
                      />
                    </div>

                    <div>
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={formData.roleId || formData.role}
                        onValueChange={(value) => {
                          // Check if it's a roleId (numeric) or legacy role (string)
                          const isRoleId = rbacRoles.some(r => r.id.toString() === value);
                          if (isRoleId) {
                            setFormData({ ...formData, roleId: value, role: "" });
                          } else {
                            setFormData({ ...formData, role: value, roleId: "" });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {rolesLoading ? (
                            <SelectItem value="loading" disabled>Loading roles...</SelectItem>
                          ) : (
                            <>
                              {rbacRoles.length > 0 ? (
                                rbacRoles.map((role) => (
                                  <SelectItem key={role.id} value={role.id.toString()}>
                                    {role.name} {role.description && `- ${role.description}`}
                                  </SelectItem>
                                ))
                              ) : (
                                USER_ROLES.map((role) => (
                                  <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                  </SelectItem>
                                ))
                              )}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Dr."
                        />
                      </div>
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="organization">Organization *</Label>
                      <Select value={formData.organizationId} onValueChange={(value) => setFormData({ ...formData, organizationId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {(organizations as any[]).map((org) => (
                            <SelectItem key={org.id} value={org.id.toString()}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateUser}
                        disabled={createUserMutation.isPending}
                      >
                        {createUserMutation.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Enhanced Search and Filter Section */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchTerm || (filterSpecialty && filterSpecialty !== "all")) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterSpecialty("all");
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Role-based Tabs */}
          <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              All ({roleCounts.all})
            </button>
            {USER_ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.value}
                  onClick={() => setActiveTab(role.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${activeTab === role.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{role.label} ({roleCounts[role.value] || 0})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto bg-slate-50">
          <div className="p-6">
            {filteredUsers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No users found"
                description={searchTerm || filterSpecialty ? "Try adjusting your search or filters" : "No users have been added yet"}
              />
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
                {filteredUsers.map((user) => {
                  const roleInfo = getUserRoleInfo(user);
                  const Icon = roleInfo.icon;

                  if (viewMode === "grid") {
                    return (
                      <Tooltip key={user.id}>
                        <TooltipTrigger asChild>
                          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 card-selection-feedback">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="relative">
                                {user.photoUrl ? (
                                  <img
                                    src={user.photoUrl}
                                    alt={user.username}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-slate-200">
                                    {getUserInitials(user)}
                                  </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                                  <Icon className="w-3 h-3 text-slate-600" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 truncate">
                                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                                </h3>
                                <p className="text-sm text-slate-600 truncate">{user.email || user.username}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge className={roleInfo.color}>
                                {roleInfo.name}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAssignRoleClick(user)}>
                                    <Shield className="w-4 h-4 mr-2" />
                                    Assign Role
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="p-2">
                            <p className="font-medium">{roleInfo.name}</p>
                            <p className="text-xs text-slate-600">{roleInfo.description}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  } else {
                    return (
                      <div key={user.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 card-selection-feedback">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              {user.photoUrl ? (
                                <img
                                  src={user.photoUrl}
                                  alt={user.username}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-slate-200">
                                  {getUserInitials(user)}
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                                <Icon className="w-2.5 h-2.5 text-slate-600" />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">
                                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                              </h3>
                              <p className="text-sm text-slate-600">{user.email || user.username}</p>
                            </div>
                            <Badge className={roleInfo.color}>
                              {roleInfo.name}
                            </Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignRoleClick(user)}>
                                <Shield className="w-4 h-4 mr-2" />
                                Assign Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Form submit prevented, calling handleUpdateUser");
                handleUpdateUser();
                return false;
              }}
              onKeyDown={(e) => {
                // Prevent form submission on Enter key in inputs
                if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'submit') {
                  e.preventDefault();
                  // Optionally trigger update on Enter
                  // handleUpdateUser();
                }
              }}
            >
              <div>
                <Label htmlFor="edit-username">Username *</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>

              <div>
                <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <Label htmlFor="edit-role">Role *</Label>
                <Select
                  value={formData.roleId || formData.role}
                  onValueChange={(value) => {
                    const isRoleId = rbacRoles.some(r => r.id.toString() === value);
                    if (isRoleId) {
                      setFormData({ ...formData, roleId: value, role: "" });
                    } else {
                      setFormData({ ...formData, role: value, roleId: "" });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesLoading ? (
                      <SelectItem value="loading" disabled>Loading roles...</SelectItem>
                    ) : (
                      <>
                        {rbacRoles.length > 0 ? (
                          rbacRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name} {role.description && `- ${role.description}`}
                            </SelectItem>
                          ))
                        ) : (
                          USER_ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Dr."
                  />
                </div>
                <div>
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>

              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <Label htmlFor="edit-organization">Organization</Label>
                <Select value={formData.organizationId} onValueChange={(value) => setFormData({ ...formData, organizationId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {(organizations as any[]).map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={(e) => {
                    // Let form onSubmit handle it, but also prevent default just in case
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Submit button clicked");
                    handleUpdateUser();
                  }}
                  disabled={updateUserMutation.isPending || !selectedUser}
                >
                  {updateUserMutation.isPending ? "Updating..." : "Update User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Assign Role Dialog */}
        <Dialog open={assignRoleDialogOpen} onOpenChange={setAssignRoleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedUserForRole && (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Assign a role to <strong>{selectedUserForRole.firstName && selectedUserForRole.lastName
                      ? `${selectedUserForRole.firstName} ${selectedUserForRole.lastName}`
                      : selectedUserForRole.username}</strong>
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="assign-role">Select Role</Label>
                <Select
                  value={selectedRoleId}
                  onValueChange={(value) => {
                    if (value === 'no-role') {
                      setSelectedRoleId('');
                    } else {
                      setSelectedRoleId(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-role">No Role</SelectItem>
                    {rolesLoading ? (
                      <SelectItem value="loading" disabled>Loading roles...</SelectItem>
                    ) : (
                      rbacRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name} {role.description && `- ${role.description}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAssignRoleDialogOpen(false);
                    setSelectedUserForRole(null);
                    setSelectedRoleId("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignRole}
                  disabled={assignRoleMutation.isPending}
                >
                  {assignRoleMutation.isPending ? "Assigning..." : "Assign Role"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff Registration Modal */}
      <StaffRegistrationModal
        open={showStaffModal}
        onOpenChange={setShowStaffModal}
      />
    </TooltipProvider>
  );
}