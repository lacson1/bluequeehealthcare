import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Shield,
  Users,
  Building,
  Settings,
  Activity,
  Database,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Bell,
  Globe,
  Zap,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Eye,
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  FileDown,
  KeyRound,
  MoreVertical,
  ArrowUpDown,
  CheckSquare,
  Square
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Organization {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email: string;
  status?: string;
  isActive?: boolean;
  userCount?: number;
  createdAt: string;
  type?: string;
}

interface SystemUser {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  organizationId: number;
  organizationName: string;
  lastLogin: string;
  createdAt: string;
}

interface SystemStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  totalPatients: number;
  systemUptime: string;
  databaseSize: string;
  memoryUsage: string;
  cpuUsage: string;
}

export default function SuperAdminControl() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'login'>('date');
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [viewingUser, setViewingUser] = useState<SystemUser | null>(null);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);
  const [editFormData, setEditFormData] = useState({
    email: '',
    role: '',
    organizationId: 0,
  });
  const [newOrgData, setNewOrgData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  });
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoBackups: true,
    emailNotifications: true,
    debugLogging: false,
  });
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordPolicy: 'strong',
  });

  // Fetch system analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/superadmin/analytics'],
  });

  // Fetch organizations
  const { data: organizations = [] } = useQuery({
    queryKey: ['/api/superadmin/organizations'],
  });

  // Fetch system users
  const { data: systemUsers = [] } = useQuery({
    queryKey: ['/api/superadmin/users'],
  });

  // Fetch system stats
  const { data: systemStats } = useQuery({
    queryKey: ['/api/superadmin/system-stats'],
  });

  // Create organization mutation
  const createOrganizationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/superadmin/organizations', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/organizations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/analytics'] });
      toast({ title: 'Success', description: 'Organization created successfully' });
      setNewOrgData({ name: '', address: '', phone: '', email: '' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create organization',
        variant: 'destructive'
      });
    },
  });

  // Update organization status mutation
  const updateOrganizationStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      apiRequest(`/api/superadmin/organizations/${id}/status`, 'PATCH', { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/organizations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/analytics'] });
      toast({ title: 'Success', description: 'Organization status updated' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update organization status',
        variant: 'destructive'
      });
    },
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      apiRequest(`/api/superadmin/users/${id}/status`, 'PATCH', { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/analytics'] });
      toast({ title: 'Success', description: 'User status updated' });
      setSelectedUserIds([]);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update user status',
        variant: 'destructive'
      });
    },
  });

  // Bulk update user status mutation
  const bulkUpdateUserStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: string }) => 
      Promise.all(ids.map(id => apiRequest(`/api/superadmin/users/${id}/status`, 'PATCH', { status }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/analytics'] });
      toast({ title: 'Success', description: `${selectedUserIds.length} users updated` });
      setSelectedUserIds([]);
      setBulkMode(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update users',
        variant: 'destructive'
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/superadmin/users/${id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/users'] });
      toast({ title: 'Success', description: 'User updated successfully' });
      setEditingUser(null);
      setEditFormData({ email: '', role: '', organizationId: 0 });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update user',
        variant: 'destructive'
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/superadmin/users/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/analytics'] });
      toast({ title: 'Success', description: 'User deleted successfully' });
      setDeletingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete user',
        variant: 'destructive'
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/superadmin/users/${id}/reset-password`, 'POST'),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Password reset email sent' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to reset password',
        variant: 'destructive'
      });
    },
  });

  // System backup mutation
  const systemBackupMutation = useMutation({
    mutationFn: () => apiRequest('/api/superadmin/backup', 'POST'),
    onSuccess: () => {
      toast({ title: 'Success', description: 'System backup initiated' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to initiate backup',
        variant: 'destructive'
      });
    },
  });

  const handleCreateOrganization = () => {
    if (!newOrgData.name || !newOrgData.email) {
      toast({
        title: 'Validation Error',
        description: 'Organization name and email are required',
        variant: 'destructive'
      });
      return;
    }
    createOrganizationMutation.mutate(newOrgData);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredOrganizations = organizations.filter((org: Organization) => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (org.email && org.email.toLowerCase().includes(searchTerm.toLowerCase()));
    // Map isActive boolean to status string for filtering
    const orgStatus = org.status || (org.isActive !== undefined ? (org.isActive ? 'active' : 'inactive') : 'active');
    const matchesStatus = statusFilter === 'all' || orgStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = systemUsers
    .filter((user: SystemUser) => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.username.localeCompare(b.username);
        case 'login':
          if (a.lastLogin === 'Never' && b.lastLogin === 'Never') return 0;
          if (a.lastLogin === 'Never') return 1;
          if (b.lastLogin === 'Never') return -1;
          return new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime();
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const uniqueRoles = Array.from(new Set(systemUsers.map((u: SystemUser) => u.role).filter(role => role && role.trim() !== ''))).sort();

  const handleSelectUser = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u: SystemUser) => u.id));
    }
  };

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedUserIds.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select users to update',
        variant: 'destructive'
      });
      return;
    }
    bulkUpdateUserStatusMutation.mutate({ ids: selectedUserIds, status });
  };

  const handleExportUsers = () => {
    const csvContent = [
      ['Username', 'Email', 'Role', 'Status', 'Organization', 'Last Login', 'Created At'],
      ...filteredUsers.map((u: SystemUser) => [
        u.username,
        u.email,
        u.role,
        u.status,
        u.organizationName,
        u.lastLogin,
        new Date(u.createdAt).toLocaleDateString()
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: 'Users exported to CSV' });
  };

  const handleViewUser = (user: SystemUser) => {
    setViewingUser(user);
  };

  const handleEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email || '',
      role: user.role || '',
      organizationId: user.organizationId || 0,
    });
  };

  const handleDeleteUser = (user: SystemUser) => {
    setDeletingUser(user);
  };

  const confirmDeleteUser = () => {
    if (deletingUser) {
      deleteUserMutation.mutate(deletingUser.id);
    }
  };

  const handleViewOrganization = (org: Organization) => {
    setViewingOrg(org);
  };

  const handleRestoreBackup = () => {
    toast({
      title: "Restore Backup",
      description: "Backup restore functionality will be available soon",
    });
  };

  const handleRestartSystem = () => {
    if (window.confirm("Are you sure you want to restart system services? This will disconnect all users.")) {
      apiRequest('/api/superadmin/system/restart', 'POST', {})
        .then(() => {
          toast({
            title: "System Restart",
            description: "System restart initiated successfully",
          });
        })
        .catch(() => {
          toast({
            title: "Restart Failed",
            description: "Failed to restart system",
            variant: "destructive",
          });
        });
    }
  };

  const handleEmergencyMaintenance = () => {
    if (window.confirm("Are you sure you want to enable emergency maintenance mode? This will disconnect all users immediately.")) {
      apiRequest('/api/superadmin/system/maintenance', 'POST', {
        enabled: true,
        message: "Emergency maintenance in progress",
        estimatedDuration: "Unknown"
      })
        .then(() => {
          toast({
            title: "Emergency Maintenance",
            description: "Emergency maintenance mode has been activated",
            variant: "destructive",
          });
        })
        .catch(() => {
          toast({
            title: "Activation Failed",
            description: "Failed to activate emergency maintenance mode",
            variant: "destructive",
          });
        });
    }
  };

  const handleUpdateSecuritySettings = () => {
    apiRequest('/api/superadmin/security/policies', 'PATCH', securitySettings)
      .then(() => {
        toast({
          title: "Security Settings Updated",
          description: "Security settings have been updated successfully",
        });
      })
      .catch(() => {
        toast({
          title: "Update Failed",
          description: "Failed to update security settings",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-white drop-shadow-sm flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Super Admin Control Center
            </h2>
            <p className="text-white/90 font-medium">System-wide administration and monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              <Activity className="h-3 w-3 mr-1" />
              System Active
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Organizations</p>
                  <p className="text-2xl font-bold">{analytics?.totalOrganizations || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{analytics?.totalUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold">{analytics?.activeSessions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Database className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">DB Size</p>
                  <p className="text-2xl font-bold">{systemStats?.databaseSize || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">CPU Usage</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Memory Usage</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '62%' }}></div>
                      </div>
                      <span className="text-sm font-medium">62%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Disk Usage</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-green-100 rounded-full">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New organization registered</p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-100 rounded-full">
                        <Users className="h-3 w-3 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">User role updated</p>
                        <p className="text-xs text-gray-500">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-yellow-100 rounded-full">
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">System backup completed</p>
                        <p className="text-xs text-gray-500">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Create New Organization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Organization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Organization Name *</Label>
                    <Input
                      id="org-name"
                      value={newOrgData.name}
                      onChange={(e) => setNewOrgData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter organization name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-email">Email *</Label>
                    <Input
                      id="org-email"
                      type="email"
                      value={newOrgData.email}
                      onChange={(e) => setNewOrgData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="admin@organization.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-phone">Phone</Label>
                    <Input
                      id="org-phone"
                      value={newOrgData.phone}
                      onChange={(e) => setNewOrgData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-address">Address</Label>
                    <Input
                      id="org-address"
                      value={newOrgData.address}
                      onChange={(e) => setNewOrgData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter address"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button 
                    onClick={handleCreateOrganization}
                    disabled={createOrganizationMutation.isPending}
                  >
                    {createOrganizationMutation.isPending ? 'Creating...' : 'Create Organization'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Organizations List */}
            <Card>
              <CardHeader>
                <CardTitle>Organizations ({filteredOrganizations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredOrganizations.map((org: Organization) => (
                    <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-gray-400" />
                          <div>
                            <h4 className="font-medium">{org.name}</h4>
                            <p className="text-sm text-gray-600">{org.email}</p>
                            <p className="text-xs text-gray-500">{org.userCount} users</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusBadgeVariant(org.status || (org.isActive !== undefined ? (org.isActive ? 'active' : 'inactive') : 'active'))}>
                          {org.status || (org.isActive !== undefined ? (org.isActive ? 'active' : 'inactive') : 'active')}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const currentIsActive = org.isActive !== undefined ? org.isActive : (org.status === 'active');
                              updateOrganizationStatusMutation.mutate({
                                id: org.id,
                                isActive: !currentIsActive
                              });
                            }}
                            disabled={updateOrganizationStatusMutation.isPending}
                            title={(org.isActive !== undefined ? org.isActive : org.status === 'active') ? 'Deactivate organization' : 'Activate organization'}
                          >
                            {(org.isActive !== undefined ? org.isActive : org.status === 'active') ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Unlock className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewOrganization(org)}
                            title="View organization details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users by name, email, role, or organization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {uniqueRoles.length > 0 && uniqueRoles.map(role => {
                      if (!role || role.trim() === '') return null;
                      return <SelectItem key={role} value={role}>{role}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date Created</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="login">Last Login</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Action Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={bulkMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setBulkMode(!bulkMode);
                      setSelectedUserIds([]);
                    }}
                  >
                    {bulkMode ? <CheckSquare className="h-4 w-4 mr-2" /> : <Square className="h-4 w-4 mr-2" />}
                    Bulk Actions
                  </Button>
                  {bulkMode && selectedUserIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedUserIds.length} selected
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkStatusUpdate('active')}
                        disabled={bulkUpdateUserStatusMutation.isPending}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkStatusUpdate('inactive')}
                        disabled={bulkUpdateUserStatusMutation.isPending}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Deactivate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkStatusUpdate('suspended')}
                        disabled={bulkUpdateUserStatusMutation.isPending}
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Suspend
                      </Button>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportUsers}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>System Users ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No users found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria' 
                        : 'No users in the system'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((user: SystemUser) => (
                      <div 
                        key={user.id} 
                        className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                          bulkMode && selectedUserIds.includes(user.id) ? 'bg-primary/5 border-primary' : ''
                        }`}
                      >
                        {bulkMode && (
                          <Checkbox
                            checked={selectedUserIds.includes(user.id)}
                            onCheckedChange={() => handleSelectUser(user.id)}
                            className="mr-3"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-full flex-shrink-0">
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-foreground truncate">{user.username}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {user.role}
                                </Badge>
                              </div>
                              {user.email && (
                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground truncate">
                                  {user.organizationName}
                                </p>
                                {user.lastLogin && user.lastLogin !== 'Never' && (
                                  <>
                                    <span className="text-muted-foreground">•</span>
                                    <p className="text-xs text-muted-foreground">
                                      Last login: {user.lastLogin}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          <Badge variant={getStatusBadgeVariant(user.status)} className="capitalize">
                            {user.status}
                          </Badge>
                          {!bulkMode && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserStatusMutation.mutate({
                                  id: user.id,
                                  status: user.status === 'active' ? 'inactive' : 'active'
                                })}
                                disabled={updateUserStatusMutation.isPending}
                                title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                              >
                                {user.status === 'active' ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => resetPasswordMutation.mutate(user.id)}>
                                    <KeyRound className="h-4 w-4 mr-2" />
                                    Reset Password
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteUser(user)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full justify-start"
                    onClick={() => systemBackupMutation.mutate()}
                    disabled={systemBackupMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {systemBackupMutation.isPending ? 'Creating Backup...' : 'Create System Backup'}
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleRestoreBackup}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Restore from Backup
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleRestartSystem}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart System Services
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="destructive"
                    onClick={handleEmergencyMaintenance}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Emergency Maintenance Mode
                  </Button>
                </CardContent>
              </Card>

              {/* System Monitoring */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">System Uptime</span>
                      <Badge variant="outline">
                        {systemStats?.systemUptime || '99.9% (7 days)'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Database Connections</span>
                      <Badge variant="outline">24/100</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Sessions</span>
                      <Badge variant="outline">{analytics?.activeSessions || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Error Rate</span>
                      <Badge variant="outline" className="text-green-600">0.01%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Usage Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{analytics?.totalUsers || 0}</p>
                      <p className="text-sm text-gray-600">Total System Users</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{analytics?.totalPatients || 0}</p>
                      <p className="text-sm text-gray-600">Total Patients</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{analytics?.totalAppointments || 0}</p>
                      <p className="text-sm text-gray-600">Total Appointments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Response Time</span>
                      <Badge variant="outline" className="text-green-600">125ms</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">API Success Rate</span>
                      <Badge variant="outline" className="text-green-600">99.8%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Daily Active Users</span>
                      <Badge variant="outline">{analytics?.dailyActiveUsers || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Peak Concurrent Users</span>
                      <Badge variant="outline">156</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Global Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Global Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-xs text-gray-500">Temporarily disable user access</p>
                    </div>
                    <Switch 
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => {
                        setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }));
                        apiRequest('/api/superadmin/system/maintenance', 'POST', {
                          enabled: checked,
                          message: "System maintenance in progress",
                          estimatedDuration: "30 minutes"
                        })
                          .then(() => {
                            toast({
                              title: "Maintenance Mode Updated",
                              description: checked ? "Maintenance mode enabled" : "Maintenance mode disabled",
                            });
                          })
                          .catch(() => {
                            toast({
                              title: "Update Failed",
                              description: "Failed to update maintenance mode",
                              variant: "destructive",
                            });
                            setSystemSettings(prev => ({ ...prev, maintenanceMode: !checked }));
                          });
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Auto Backups</Label>
                      <p className="text-xs text-gray-500">Enable automatic daily backups</p>
                    </div>
                    <Switch 
                      checked={systemSettings.autoBackups}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, autoBackups: checked }))}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-xs text-gray-500">Send system alerts via email</p>
                    </div>
                    <Switch 
                      checked={systemSettings.emailNotifications}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Debug Logging</Label>
                      <p className="text-xs text-gray-500">Enable detailed system logs</p>
                    </div>
                    <Switch 
                      checked={systemSettings.debugLogging}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, debugLogging: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input 
                      type="number" 
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings(prev => ({ 
                        ...prev, 
                        sessionTimeout: parseInt(e.target.value) || 30 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Login Attempts</Label>
                    <Input 
                      type="number" 
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings(prev => ({ 
                        ...prev, 
                        maxLoginAttempts: parseInt(e.target.value) || 5 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password Policy</Label>
                    <Select 
                      value={securitySettings.passwordPolicy}
                      onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, passwordPolicy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic (8 characters)</SelectItem>
                        <SelectItem value="strong">Strong (12 characters + symbols)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (16 characters + 2FA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={handleUpdateSecuritySettings}
                  >
                    Update Security Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* View User Details Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View complete user information</DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Username</Label>
                  <p className="font-medium">{viewingUser.username}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{viewingUser.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <Badge variant="outline">{viewingUser.role}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant={getStatusBadgeVariant(viewingUser.status)} className="capitalize">
                    {viewingUser.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Organization</Label>
                  <p className="font-medium">{viewingUser.organizationName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Last Login</Label>
                  <p className="font-medium">{viewingUser.lastLogin}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created At</Label>
                  <p className="font-medium">{new Date(viewingUser.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">User ID</Label>
                  <p className="font-medium">#{viewingUser.id}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingUser(null)}>Close</Button>
            {viewingUser && (
              <Button onClick={() => {
                setViewingUser(null);
                handleEditUser(viewingUser);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label>Username</Label>
                <Input value={editingUser.username} disabled className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={editFormData.email}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  type="email"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={editFormData.role || undefined} onValueChange={(v) => setEditFormData(prev => ({ ...prev, role: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueRoles.length > 0 ? (
                      uniqueRoles.map(role => {
                        if (!role || role.trim() === '') return null;
                        return <SelectItem key={role} value={role}>{role}</SelectItem>;
                      })
                    ) : (
                      <SelectItem value="no-roles-disabled" disabled>No roles available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Organization</Label>
                <Select 
                  value={editFormData.organizationId.toString()} 
                  onValueChange={(v) => setEditFormData(prev => ({ ...prev, organizationId: parseInt(v) }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Organization</SelectItem>
                    {organizations.map((org: Organization) => (
                      <SelectItem key={org.id} value={org.id.toString()}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingUser(null);
              setEditFormData({ email: '', role: '', organizationId: 0 });
            }}>
              Cancel
            </Button>
            {editingUser && (
              <Button 
                onClick={() => updateUserMutation.mutate({ 
                  id: editingUser.id, 
                  data: editFormData 
                })}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Organization Dialog */}
      <Dialog open={!!viewingOrg} onOpenChange={(open) => !open && setViewingOrg(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organization Details
            </DialogTitle>
            <DialogDescription>View complete organization information</DialogDescription>
          </DialogHeader>
          {viewingOrg && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Organization ID</Label>
                  <p className="font-medium">#{viewingOrg.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant={getStatusBadgeVariant(viewingOrg.status || (viewingOrg.isActive !== undefined ? (viewingOrg.isActive ? 'active' : 'inactive') : 'active'))} className="capitalize">
                    {viewingOrg.status || (viewingOrg.isActive !== undefined ? (viewingOrg.isActive ? 'active' : 'inactive') : 'active')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="font-medium">{viewingOrg.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{viewingOrg.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="font-medium">{viewingOrg.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <p className="font-medium">{viewingOrg.address || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Users</Label>
                  <p className="font-medium">{viewingOrg.userCount || 0}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created At</Label>
                  <p className="font-medium">{new Date(viewingOrg.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingOrg(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingUser && (
            <div className="space-y-2 py-4">
              <p className="font-medium">{deletingUser.username}</p>
              <p className="text-sm text-muted-foreground">{deletingUser.email}</p>
              <p className="text-sm text-muted-foreground">{deletingUser.role} • {deletingUser.organizationName}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUser(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}