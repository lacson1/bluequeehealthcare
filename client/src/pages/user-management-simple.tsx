import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Building,
  RefreshCw,
} from "lucide-react";
import BulkUserOperations from "@/components/bulk-user-operations";
import { UserList } from "@/components/user-management/user-list";
import { UserFormDialog } from "@/components/user-management/user-form-dialog";
import { OrganizationList } from "@/components/user-management/organization-list";
import { OrganizationFormDialog } from "@/components/user-management/organization-form-dialog";

// Schemas
const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(["admin", "doctor", "nurse", "pharmacist", "physiotherapist"]),
  title: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  organizationId: z.string().min(1, "Organization is required")
});

const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  type: z.enum(["clinic", "hospital", "health_center"]),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal(""))
});

// Types
type User = {
  id: number;
  username: string;
  title?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  organizationId: number;
  organizationName?: string;
  isActive?: boolean;
  createdAt: string;
};

type Organization = {
  id: number;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  userCount?: number;
  createdAt: string;
};

export default function UserManagementSimple() {
  const [activeTab, setActiveTab] = useState("users");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [filterRole, setFilterRole] = useState("all");
  const [filterOrg, setFilterOrg] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/staff"],
    refetchInterval: false, // Disabled auto-refresh
    staleTime: 3 * 60 * 1000, // Cache for 3 minutes
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ["/api/organizations"],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (rarely changes)
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userSchema>) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to create user");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User Created", description: "User has been successfully created." });
      setIsCreateUserOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create user",
        variant: "destructive" 
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<User> }) => {
      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to update user");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User Updated", description: "User has been successfully updated." });
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update user",
        variant: "destructive" 
      });
    }
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: z.infer<typeof organizationSchema>) => {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create organization");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Organization Created", description: "Organization has been successfully created." });
      setIsCreateOrgOpen(false);
      setEditingOrg(null);
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    }
  });

  const updateOrgMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Organization> }) => {
      const response = await fetch(`/api/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to update organization");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Organization Updated", description: "Organization has been successfully updated." });
      setEditingOrg(null);
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization",
        variant: "destructive"
      });
    }
  });

  // Forms
  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "doctor",
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      organizationId: ""
    }
  });

  const orgForm = useForm<z.infer<typeof organizationSchema>>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      type: "clinic",
      address: "",
      phone: "",
      email: "",
      website: ""
    }
  });

  // Filter users
  const filteredUsers = users.filter((user: User) => {
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesOrg = filterOrg === "all" || user.organizationId?.toString() === filterOrg;
    const matchesSearch = searchTerm === "" || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesOrg && matchesSearch;
  });

  // Role colors
  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin": return "bg-red-100 text-red-800 border-red-200";
      case "doctor": return "bg-blue-100 text-blue-800 border-blue-200";
      case "nurse": return "bg-green-100 text-green-800 border-green-200";
      case "pharmacist": return "bg-purple-100 text-purple-800 border-purple-200";
      case "physiotherapist": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const onCreateUser = (data: z.infer<typeof userSchema>) => {
    createUserMutation.mutate(data);
  };

  const onCreateOrg = (data: z.infer<typeof organizationSchema>) => {
    createOrgMutation.mutate(data);
  };

  const onUpdateUser = (data: z.infer<typeof userSchema>) => {
    if (!editingUser) {
      toast({
        title: "Error",
        description: "No user selected for editing",
        variant: "destructive"
      });
      return;
    }

    // Validate organizationId
    if (!data.organizationId || data.organizationId.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Organization is required",
        variant: "destructive"
      });
      return;
    }

    const orgId = parseInt(data.organizationId);
    if (isNaN(orgId)) {
      toast({
        title: "Validation Error",
        description: "Invalid organization ID",
        variant: "destructive"
      });
      return;
    }

    // Build update data - only include password if provided
    const updateData: Partial<User> = {
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      organizationId: orgId
    };

    // Only include optional fields if they have values
    if (data.email && data.email.trim() !== "") {
      updateData.email = data.email;
    }
    if (data.phone && data.phone.trim() !== "") {
      updateData.phone = data.phone;
    }
    if (data.title && data.title.trim() !== "") {
      updateData.title = data.title;
    }
    // Only include password if provided (for password changes)
    if (data.password && data.password.trim() !== "") {
      updateData.password = data.password as any;
    }

    updateUserMutation.mutate({
      id: editingUser.id,
      data: updateData
    });
  };

  const toggleUserStatus = (user: User) => {
    updateUserMutation.mutate({
      id: user.id,
      data: { isActive: !user.isActive }
    });
  };

  const getOrgName = (orgId: number) => {
    const org = organizations.find((o: Organization) => o.id === orgId);
    return org?.name || "Unknown Organization";
  };

  // Effect to populate form when editing user
  useEffect(() => {
    if (editingUser) {
      userForm.reset({
        username: editingUser.username,
        password: "", // Don't populate password for security
        role: editingUser.role as any,
        title: editingUser.title || "",
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email || "",
        phone: editingUser.phone || "",
        organizationId: editingUser.organizationId ? editingUser.organizationId.toString() : ""
      });
    } else {
      userForm.reset({
        username: "",
        password: "",
        role: "doctor",
        title: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        organizationId: ""
      });
    }
  }, [editingUser, userForm]);

  // Effect to populate form when editing organization
  useEffect(() => {
    if (editingOrg) {
      orgForm.reset({
        name: editingOrg.name,
        type: editingOrg.type as any,
        address: editingOrg.address || "",
        phone: editingOrg.phone || "",
        email: editingOrg.email || "",
        website: editingOrg.website || ""
      });
    } else {
      orgForm.reset({
        name: "",
        type: "clinic",
        address: "",
        phone: "",
        email: "",
        website: ""
      });
    }
  }, [editingOrg, orgForm]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage users and organizations with access control</p>
        </div>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <BulkUserOperations 
              selectedUsers={selectedUsers}
              onComplete={() => setSelectedUsers([])}
            />
          )}
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Organizations
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <UserList
            users={users}
            filteredUsers={filteredUsers}
            usersLoading={usersLoading}
            selectedUsers={selectedUsers}
            organizations={organizations}
            searchTerm={searchTerm}
            filterRole={filterRole}
            filterOrg={filterOrg}
            onSearchChange={setSearchTerm}
            onFilterRoleChange={setFilterRole}
            onFilterOrgChange={setFilterOrg}
            onToggleUserSelection={(userId) => {
              if (selectedUsers.includes(userId)) {
                setSelectedUsers(selectedUsers.filter(id => id !== userId));
              } else {
                setSelectedUsers([...selectedUsers, userId]);
              }
            }}
            onSelectAllUsers={() => setSelectedUsers(filteredUsers.map((u: User) => u.id))}
            onClearUserSelection={() => setSelectedUsers([])}
            onEditUser={setEditingUser}
            getRoleColor={getRoleColor}
            getOrgName={getOrgName}
            onCreateUser={() => setIsCreateUserOpen(true)}
          />
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-4">
          <OrganizationList
            organizations={organizations}
            onEditOrganization={setEditingOrg}
            onCreateOrganization={() => setIsCreateOrgOpen(true)}
          />
        </TabsContent>
      </Tabs>

      {/* User Form Dialogs */}
      <UserFormDialog
        open={isCreateUserOpen}
        onOpenChange={setIsCreateUserOpen}
        form={userForm}
        onSubmit={onCreateUser}
        organizations={organizations}
        isEditing={false}
        isPending={createUserMutation.isPending}
      />

      <UserFormDialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        form={userForm}
        onSubmit={(data) => {
          onUpdateUser(data);
        }}
        organizations={organizations}
        isEditing={true}
        isPending={updateUserMutation.isPending}
      />

      {/* Organization Form Dialogs */}
      <OrganizationFormDialog
        open={isCreateOrgOpen}
        onOpenChange={setIsCreateOrgOpen}
        form={orgForm}
        onSubmit={onCreateOrg}
        isEditing={false}
        isPending={createOrgMutation.isPending}
      />

      <OrganizationFormDialog
        open={!!editingOrg}
        onOpenChange={(open) => !open && setEditingOrg(null)}
        form={orgForm}
        onSubmit={(data) => {
          if (!editingOrg) return;
          updateOrgMutation.mutate({
            id: editingOrg.id,
            data
          });
        }}
        isEditing={true}
        isPending={updateOrgMutation.isPending}
      />
    </div>
  );
}