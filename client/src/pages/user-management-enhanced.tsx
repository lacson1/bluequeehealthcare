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
import { UserPlus, Edit, Trash2, Shield, UserX, Settings, Search, Grid3X3, List, Filter, X, Stethoscope, Pill, Heart, Activity } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { StaffRegistrationModal } from "@/components/staff-registration-modal";
import { OrganizationRegistrationModal } from "@/components/organization-registration-modal";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for create/edit
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "",
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

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      return apiRequest("/api/users", "POST", userData);
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
      return apiRequest(`/api/users/${id}`, "PATCH", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "User updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive"
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/users/${id}`);
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
    if (!formData.username || !formData.password || !formData.role || !formData.organizationId) {
      toast({
        title: "Error",
        description: "Username, password, role, and organization are required",
        variant: "destructive"
      });
      return;
    }

    const userData = {
      ...formData,
      organizationId: parseInt(formData.organizationId)
    };
    
    createUserMutation.mutate(userData as any);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;

    const updateData: any = {
      username: formData.username,
      role: formData.role,
      title: formData.title,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      photoUrl: formData.photoUrl
    };

    if (formData.organizationId) {
      updateData.organizationId = parseInt(formData.organizationId);
    }

    if (formData.password) {
      updateData.password = formData.password;
    }

    updateUserMutation.mutate({ id: selectedUser.id, userData: updateData });
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
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

  const handleDeleteUser = (id: number) => {
    deleteUserMutation.mutate(id);
  };

  // Photo upload handler
  const handlePhotoUpload = async (file: File, userId?: number) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest("POST", "/api/upload/staff", formData);
      const photoUrl = response.url;
      
      if (userId) {
        await apiRequest("PATCH", `/api/users/${userId}`, { photoUrl });
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
      filtered = filtered.filter(user => user.role === activeTab);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchLower) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        user.role.toLowerCase().includes(searchLower)
      );
    }

    if (filterSpecialty && filterSpecialty !== "all") {
      filtered = filtered.filter(user => user.role === filterSpecialty);
    }

    return filtered;
  }, [users, activeTab, searchTerm, filterSpecialty]);

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
    USER_ROLES.forEach(role => {
      counts[role.value] = users.filter(u => u.role === role.value).length;
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
              <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
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
                      <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
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
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "all"
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
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                    activeTab === role.value
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
              <div className="text-center py-12">
                <UserX className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No users found</h3>
                <p className="text-slate-600">
                  {searchTerm || filterSpecialty ? "Try adjusting your search or filters" : "No users have been added yet"}
                </p>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
                {filteredUsers.map((user) => {
                  const roleConfig = getRoleConfig(user.role);
                  const Icon = roleConfig.icon;
                  
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
                              <Badge className={roleConfig.color}>
                                {roleConfig.label}
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
                            <p className="font-medium">{roleConfig.label}</p>
                            <p className="text-xs text-slate-600">{roleConfig.description}</p>
                            <p className="text-xs text-slate-500">Specialty: {roleConfig.specialty}</p>
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
                            <Badge className={roleConfig.color}>
                              {roleConfig.label}
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
            <div className="space-y-4">
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
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
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
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateUser}
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? "Updating..." : "Update User"}
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