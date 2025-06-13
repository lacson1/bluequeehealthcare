import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus,
  Settings,
  Shield,
  Users,
  Building,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  Crown
} from "lucide-react";

// Schemas
const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleId: z.string().min(1, "Role is required"),
  title: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  organizationId: z.string().min(1, "Organization is required")
});

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string())
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
  roleId?: number;
  roleName?: string;
  organizationId: number;
  organizationName?: string;
  isActive?: boolean;
  createdAt: string;
};

type Role = {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
  userCount?: number;
};

type Permission = {
  id: number;
  name: string;
  description?: string;
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

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [filterRole, setFilterRole] = useState("all");
  const [filterOrg, setFilterOrg] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users/management"],
    refetchInterval: 30000
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["/api/roles"]
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ["/api/permissions"]
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ["/api/organizations"]
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userSchema>) => {
      return apiRequest("/api/users", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "User Created", description: "User has been successfully created." });
      setIsCreateUserOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users/management"] });
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
      return apiRequest(`/api/users/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      toast({ title: "User Updated", description: "User has been successfully updated." });
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users/management"] });
    }
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roleSchema>) => {
      return apiRequest("/api/roles", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Role Created", description: "Role has been successfully created." });
      setIsCreateRoleOpen(false);
      setEditingRole(null);
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
    }
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: z.infer<typeof organizationSchema>) => {
      return apiRequest("/api/organizations", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Organization Created", description: "Organization has been successfully created." });
      setIsCreateOrgOpen(false);
      setEditingOrg(null);
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    }
  });

  // Forms
  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      roleId: "",
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      organizationId: ""
    }
  });

  const roleForm = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: []
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
    const matchesRole = filterRole === "all" || user.roleId?.toString() === filterRole;
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
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const onCreateUser = (data: z.infer<typeof userSchema>) => {
    createUserMutation.mutate(data);
  };

  const onCreateRole = (data: z.infer<typeof roleSchema>) => {
    createRoleMutation.mutate(data);
  };

  const onCreateOrg = (data: z.infer<typeof organizationSchema>) => {
    createOrgMutation.mutate(data);
  };

  const toggleUserStatus = (user: User) => {
    updateUserMutation.mutate({
      id: user.id,
      data: { isActive: !user.isActive }
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage users, roles, and organizations with granular access control</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Organizations
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Controls */}
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role: Role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterOrg} onValueChange={setFilterOrg}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map((org: Organization) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(onCreateUser)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={userForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter username" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="Enter password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={userForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select title" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Dr.">Dr.</SelectItem>
                                <SelectItem value="Mr.">Mr.</SelectItem>
                                <SelectItem value="Mrs.">Mrs.</SelectItem>
                                <SelectItem value="Ms.">Ms.</SelectItem>
                                <SelectItem value="Prof.">Prof.</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter first name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter last name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={userForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="Enter email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter phone number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={userForm.control}
                        name="roleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles.map((role: Role) => (
                                  <SelectItem key={role.id} value={role.id.toString()}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="organizationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select organization" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {organizations.map((org: Organization) => (
                                  <SelectItem key={org.id} value={org.id.toString()}>
                                    {org.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.title} {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.roleName || user.role)}>
                            {user.roleName || user.role}
                            {(user.role === 'admin' || user.roleName === 'admin') && (
                              <Crown className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.organizationName || "No organization"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.email && <div>{user.email}</div>}
                            {user.phone && <div className="text-gray-500">{user.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive !== false ? "default" : "secondary"}>
                            {user.isActive !== false ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleUserStatus(user)}
                            >
                              {user.isActive !== false ? (
                                <UserX className="h-3 w-3" />
                              ) : (
                                <UserCheck className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUser(user)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Role Management</h3>
              <p className="text-sm text-gray-600">Define roles and assign granular permissions</p>
            </div>
            <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Shield className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                </DialogHeader>
                <Form {...roleForm}>
                  <form onSubmit={roleForm.handleSubmit(onCreateRole)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={roleForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter role name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={roleForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter role description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={roleForm.control}
                      name="permissions"
                      render={() => (
                        <FormItem>
                          <FormLabel>Permissions</FormLabel>
                          <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 max-h-60 overflow-y-auto">
                            {permissions.map((permission: Permission) => (
                              <FormField
                                key={permission.id}
                                control={roleForm.control}
                                name="permissions"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={permission.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(permission.id.toString())}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, permission.id.toString()])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== permission.id.toString()
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="text-sm font-normal">
                                          {permission.name}
                                        </FormLabel>
                                        {permission.description && (
                                          <p className="text-xs text-gray-500">
                                            {permission.description}
                                          </p>
                                        )}
                                      </div>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createRoleMutation.isPending}>
                        {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role: Role) => (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      {role.description && (
                        <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setEditingRole(role)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Users:</span>
                      <span className="font-medium">{role.userCount || 0}</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions?.slice(0, 3).map((permission) => (
                          <Badge key={permission.id} variant="secondary" className="text-xs">
                            {permission.name.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                        {role.permissions && role.permissions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Organization Management</h3>
              <p className="text-sm text-gray-600">Manage multi-tenant organizations and their settings</p>
            </div>
            <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Building className="h-4 w-4 mr-2" />
                  Add Organization
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                </DialogHeader>
                <Form {...orgForm}>
                  <form onSubmit={orgForm.handleSubmit(onCreateOrg)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={orgForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter organization name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={orgForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="clinic">Clinic</SelectItem>
                                <SelectItem value="hospital">Hospital</SelectItem>
                                <SelectItem value="health_center">Health Center</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={orgForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={orgForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter phone number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={orgForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="Enter email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={orgForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter website URL" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateOrgOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createOrgMutation.isPending}>
                        {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org: Organization) => (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <p className="text-sm text-gray-600 capitalize">{org.type.replace('_', ' ')}</p>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant={org.isActive ? "default" : "secondary"}>
                        {org.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => setEditingOrg(org)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {org.address && (
                      <p className="text-gray-600">{org.address}</p>
                    )}
                    {org.phone && (
                      <p className="text-gray-600">📞 {org.phone}</p>
                    )}
                    {org.email && (
                      <p className="text-gray-600">✉️ {org.email}</p>
                    )}
                    <div className="flex justify-between pt-2">
                      <span className="text-gray-600">Users:</span>
                      <span className="font-medium">{org.userCount || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}