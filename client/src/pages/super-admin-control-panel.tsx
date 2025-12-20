import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Database, 
  Settings, 
  Users, 
  Building2, 
  Key, 
  AlertTriangle,
  Activity,
  Lock,
  Unlock,
  UserX,
  RefreshCw,
  Download,
  Upload,
  Server,
  Bell,
  Eye,
  Ban,
  Play,
  Pause,
  Trash2,
  UserPlus,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Zap,
  Clock
} from "lucide-react";
import GlobalPatientStatistics from '@/components/global-patient-statistics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function SuperAdminControlPanel() {
  const [systemMaintenance, setSystemMaintenance] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceDuration, setMaintenanceDuration] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organizations data
  const { data: organizations = [], isLoading: organizationsLoading } = useQuery({
    queryKey: ['/api/organizations'],
  });

  // Fetch system analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/superadmin/analytics'],
  });

  // Fetch system health
  const { data: systemHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/superadmin/analytics/system-health'],
  });

  // Fetch features
  const { data: features = [], isLoading: featuresLoading } = useQuery({
    queryKey: ['/api/superadmin/features'],
  });

  // Maintenance mode mutation
  const maintenanceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/superadmin/system/maintenance', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Maintenance Mode Updated",
        description: "System maintenance mode has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update maintenance mode",
        variant: "destructive",
      });
    },
  });

  // Backup creation mutation
  const backupMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/superadmin/data/backup', 'POST', data),
    onSuccess: (data: any) => {
      toast({
        title: "Backup Initiated",
        description: `Backup ${data.backupId} has been started`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initiate backup",
        variant: "destructive",
      });
    },
  });

  // Feature toggle mutation
  const featureMutation = useMutation({
    mutationFn: ({ featureId, enabled }: { featureId: string; enabled: boolean }) => 
      apiRequest(`/api/superadmin/features/${featureId}`, 'PATCH', { enabled }),
    onSuccess: () => {
      toast({
        title: "Feature Updated",
        description: "Feature toggle has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/features'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feature",
        variant: "destructive",
      });
    },
  });

  const handleMaintenanceToggle = () => {
    const enabled = !systemMaintenance;
    setSystemMaintenance(enabled);
    
    maintenanceMutation.mutate({
      enabled,
      message: maintenanceMessage || 'System maintenance in progress',
      estimatedDuration: maintenanceDuration || '30 minutes'
    });
  };

  const handleBackup = (backupType: string) => {
    backupMutation.mutate({
      backupType,
      includeFiles: true
    });
  };

  const handleFeatureToggle = (featureId: string, enabled: boolean) => {
    featureMutation.mutate({ featureId, enabled });
  };

  // Organization management state
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showSuspensions, setShowSuspensions] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [showOrgManage, setShowOrgManage] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [editOrgData, setEditOrgData] = useState({
    name: '',
    type: 'clinic',
    email: '',
    phone: '',
    address: '',
    website: '',
    isActive: true
  });
  const [newOrgData, setNewOrgData] = useState({
    name: '',
    type: 'clinic',
    email: '',
    phone: '',
    address: ''
  });

  // Organization creation mutation
  const createOrgMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/organizations', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Organization Created",
        description: "New healthcare organization has been created successfully",
      });
      setShowCreateOrg(false);
      setNewOrgData({ name: '', type: 'clinic', email: '', phone: '', address: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/analytics'] });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create organization",
        variant: "destructive",
      });
    },
  });

  // Organization suspension mutation
  const suspendOrgMutation = useMutation({
    mutationFn: ({ orgId, suspended }: { orgId: number; suspended: boolean }) => 
      apiRequest(`/api/organizations/${orgId}/suspend`, 'PATCH', { suspended }),
    onSuccess: () => {
      toast({
        title: "Organization Updated",
        description: "Organization status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update organization status",
        variant: "destructive",
      });
    },
  });

  // Organization update mutation
  const updateOrgMutation = useMutation({
    mutationFn: ({ orgId, data }: { orgId: number; data: any }) => 
      apiRequest(`/api/superadmin/organizations/${orgId}`, 'PATCH', data),
    onSuccess: () => {
      toast({
        title: "Organization Updated",
        description: "Organization details have been updated successfully",
      });
      setShowOrgManage(false);
      setSelectedOrg(null);
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/analytics'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update organization",
        variant: "destructive",
      });
    },
  });

  // Organization management handlers
  const handleCreateOrganization = () => {
    setShowCreateOrg(true);
  };

  const handleManageSuspensions = () => {
    setShowSuspensions(true);
  };

  const handleGlobalPolicies = () => {
    setShowPolicies(true);
  };

  const handleManageOrganization = (org: any) => {
    setSelectedOrg(org);
    setEditOrgData({
      name: org.name || '',
      type: org.type || 'clinic',
      email: org.email || '',
      phone: org.phone || '',
      address: org.address || '',
      website: org.website || '',
      isActive: org.isActive !== undefined ? org.isActive : true
    });
    setShowOrgManage(true);
  };

  const handleUpdateOrganization = () => {
    if (!selectedOrg) return;
    
    if (!editOrgData.name || !editOrgData.email) {
      toast({
        title: "Validation Error",
        description: "Organization name and email are required",
        variant: "destructive",
      });
      return;
    }

    updateOrgMutation.mutate({
      orgId: selectedOrg.id,
      data: editOrgData
    });
  };

  const handleCreateOrgSubmit = () => {
    if (!newOrgData.name || !newOrgData.email) {
      toast({
        title: "Validation Error",
        description: "Organization name and email are required",
        variant: "destructive",
      });
      return;
    }
    createOrgMutation.mutate(newOrgData);
  };

  const handleSuspendOrganization = (orgId: number, suspended: boolean) => {
    suspendOrgMutation.mutate({ orgId, suspended });
  };

  // System maintenance handlers
  const handleMaintenanceMode = () => {
    maintenanceMutation.mutate({ 
      enabled: !systemMaintenance, 
      message: "System is under maintenance. Please check back later.",
      estimatedDuration: "30 minutes"
    });
  };

  const handleSystemRestart = () => {
    if (window.confirm("Are you sure you want to restart the system? This will disconnect all users.")) {
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

  const handleManageFeatures = () => {
    toast({
      title: "Feature Management",
      description: "Feature toggle interface is already available in the Features section",
    });
  };

  const handleCreateAnnouncement = () => {
    const title = prompt("Enter announcement title:");
    const message = prompt("Enter announcement message:");
    
    if (title && message) {
      apiRequest('/api/superadmin/system/announcements', 'POST', {
        title,
        message,
        priority: 'normal',
        targetOrganizations: []
      })
      .then(() => {
        toast({
          title: "Announcement Sent",
          description: "System announcement has been sent to all organizations",
        });
      })
      .catch(() => {
        toast({
          title: "Send Failed",
          description: "Failed to send system announcement",
          variant: "destructive",
        });
      });
    }
  };

  // Fetch active sessions
  const { data: sessionsData, refetch: refetchSessions } = useQuery({
    queryKey: ['/api/superadmin/sessions'],
    enabled: false, // Only fetch when needed
  });

  // Fetch security policies
  const { data: securityPolicies, refetch: refetchPolicies } = useQuery({
    queryKey: ['/api/superadmin/security/policies'],
    enabled: false,
  });

  // Fetch audit config
  const { data: auditConfig, refetch: refetchAuditConfig } = useQuery({
    queryKey: ['/api/superadmin/audit/config'],
    enabled: false,
  });

  // Sessions modal state
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeoutMinutes: 30,
    maxLoginAttempts: 5,
    passwordPolicy: 'strong',
    requireMFA: false,
  });
  const [auditSettings, setAuditSettings] = useState({
    retentionDays: 90,
    logLevel: 'detailed',
  });

  // Security and monitoring handlers
  const handleViewSessions = async () => {
    await refetchSessions();
    setShowSessionsModal(true);
  };

  const handleSecuritySettings = async () => {
    await refetchPolicies();
    if (securityPolicies) {
      setSecuritySettings(securityPolicies as any);
    }
    setShowSecurityModal(true);
  };

  const handleAuditConfiguration = async () => {
    await refetchAuditConfig();
    if (auditConfig) {
      setAuditSettings(auditConfig as any);
    }
    setShowAuditModal(true);
  };

  // Update security policies mutation
  const updateSecurityMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/superadmin/security/policies', 'PATCH', data),
    onSuccess: () => {
      toast({
        title: "Security Policies Updated",
        description: "Security settings have been updated successfully",
      });
      setShowSecurityModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update security policies",
        variant: "destructive",
      });
    },
  });

  // Update audit config mutation
  const updateAuditMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/superadmin/audit/config', 'PATCH', data),
    onSuccess: () => {
      toast({
        title: "Audit Configuration Updated",
        description: "Audit settings have been updated successfully",
      });
      setShowAuditModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update audit configuration",
        variant: "destructive",
      });
    },
  });

  // Force logout mutation
  const forceLogoutMutation = useMutation({
    mutationFn: (sessionId: string) => apiRequest(`/api/superadmin/sessions/${sessionId}`, 'DELETE'),
    onSuccess: () => {
      toast({
        title: "Session Terminated",
        description: "User session has been forcefully terminated",
      });
      refetchSessions();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to terminate session",
        variant: "destructive",
      });
    },
  });

  const handleCreateBackup = () => {
    apiRequest('/api/superadmin/data/backup', 'POST', {
      backupType: 'full',
      includeFiles: true
    })
    .then(() => {
      toast({
        title: "Backup Started",
        description: "System backup process has been initiated",
      });
    })
    .catch(() => {
      toast({
        title: "Backup Failed",
        description: "Failed to create system backup",
        variant: "destructive",
      });
    });
  };

  const handleMigrationTools = () => {
    setDataModalType('export');
    setShowDataModal(true);
  };

  const handleDatabaseAdmin = () => {
    if (window.confirm("Are you sure you want to access database administration? This requires advanced technical knowledge.")) {
      toast({
        title: "Database Admin",
        description: "Direct database management interface would open here",
        variant: "destructive",
      });
    }
  };

  const handleCleanupTools = () => {
    if (window.confirm("Are you sure you want to run data cleanup? This will remove orphaned and old data.")) {
      apiRequest('/api/superadmin/data/cleanup', 'POST', {})
        .then(() => {
          toast({
            title: "Cleanup Started",
            description: "Data cleanup process has been initiated",
          });
        })
        .catch(() => {
          toast({
            title: "Cleanup Failed",
            description: "Failed to start data cleanup",
            variant: "destructive",
          });
        });
    }
  };

  // Activity and logs modal state
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

  // Fetch activity data
  const { data: activityData, refetch: refetchActivity } = useQuery({
    queryKey: ['/api/superadmin/activity'],
    enabled: false,
  });

  // Fetch logs data
  const { data: logsData, refetch: refetchLogs } = useQuery({
    queryKey: ['/api/superadmin/logs'],
    enabled: false,
  });

  const handleHealthDashboard = () => {
    toast({
      title: "System Health",
      description: "System health monitoring is displayed in the Monitoring tab",
    });
  };

  const handleActivityMonitor = async () => {
    await refetchActivity();
    setShowActivityModal(true);
  };

  const handleLogViewer = async () => {
    await refetchLogs();
    setShowLogsModal(true);
  };

  // User management state
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalType, setUserModalType] = useState<'lock' | 'reset' | 'impersonate'>('lock');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userSearchResults, setUserSearchResults] = useState([]);

  // Fetch all users for management
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/superadmin/users'],
    enabled: searchTerm.length > 2,
  });

  // User management mutations
  const lockUserMutation = useMutation({
    mutationFn: ({ userId, locked }: { userId: number; locked: boolean }) => 
      apiRequest(`/api/superadmin/users/${userId}/lock`, 'PATCH', { locked }),
    onSuccess: () => {
      toast({
        title: "Account Updated",
        description: "User account status has been updated successfully",
      });
      setShowUserModal(false);
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/users'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user account status",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest(`/api/superadmin/users/${userId}/reset-password`, 'POST', {}),
    onSuccess: () => {
      toast({
        title: "Password Reset",
        description: "Password reset email has been sent to the user",
      });
      setShowUserModal(false);
    },
    onError: () => {
      toast({
        title: "Reset Failed",
        description: "Failed to reset user password",
        variant: "destructive",
      });
    },
  });

  const impersonateUserMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest(`/api/superadmin/users/${userId}/impersonate`, 'POST', {}),
    onSuccess: (data: any) => {
      toast({
        title: "Impersonation Started",
        description: "You are now logged in as the selected user",
      });
      // Redirect or update auth context
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Impersonation Failed",
        description: "Failed to impersonate user",
        variant: "destructive",
      });
    },
  });

  // User management handlers
  const handleLockAccount = () => {
    setUserModalType('lock');
    setShowUserModal(true);
  };

  const handleResetPassword = () => {
    setUserModalType('reset');
    setShowUserModal(true);
  };

  const handleImpersonateUser = () => {
    setUserModalType('impersonate');
    setShowUserModal(true);
  };

  const handleUserAction = () => {
    if (!selectedUserId) {
      toast({
        title: "No User Selected",
        description: "Please search and select a user first",
        variant: "destructive",
      });
      return;
    }

    switch (userModalType) {
      case 'lock':
        lockUserMutation.mutate({ userId: selectedUserId, locked: true });
        break;
      case 'reset':
        resetPasswordMutation.mutate(selectedUserId);
        break;
      case 'impersonate':
        impersonateUserMutation.mutate(selectedUserId);
        break;
    }
  };

  const handleUserSearch = async () => {
    if (searchTerm.length < 2) {
      toast({
        title: "Search Term Too Short",
        description: "Please enter at least 2 characters to search",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await apiRequest(`/api/superadmin/users/search?q=${encodeURIComponent(searchTerm)}`, 'GET');
      setUserSearchResults(response || []);
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Failed to search users",
        variant: "destructive",
      });
    }
  };

  // Data management state
  const [showDataModal, setShowDataModal] = useState(false);
  const [dataModalType, setDataModalType] = useState<'import' | 'export'>('import');
  const [importFile, setImportFile] = useState<File | null>(null);

  // Data management mutations
  const importDataMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest('/api/superadmin/data/import', 'POST', formData);
    },
    onSuccess: () => {
      toast({
        title: "Data Import Started",
        description: "Data import process has been initiated successfully",
      });
      setShowDataModal(false);
      setImportFile(null);
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to import data",
        variant: "destructive",
      });
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: (exportType: string) => 
      apiRequest(`/api/superadmin/data/export?type=${exportType}`, 'GET'),
    onSuccess: (data: any) => {
      toast({
        title: "Export Started",
        description: "Data export has been initiated",
      });
      // Handle download
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
      setShowDataModal(false);
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    },
  });

  // Data management handlers
  const handleImportData = () => {
    setDataModalType('import');
    setShowDataModal(true);
  };

  const handleExportData = () => {
    setDataModalType('export');
    setShowDataModal(true);
  };

  const handleDataAction = () => {
    if (dataModalType === 'import') {
      if (!importFile) {
        toast({
          title: "No File Selected",
          description: "Please select a file to import",
          variant: "destructive",
        });
        return;
      }
      importDataMutation.mutate(importFile);
    } else {
      exportDataMutation.mutate('full');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-red-600">Super Admin Control Panel</h1>
          <p className="text-muted-foreground">System-wide controls and administrative functions</p>
        </div>
        <Badge variant="destructive" className="text-sm">
          <Shield className="w-4 h-4 mr-1" />
          SYSTEM ADMIN
        </Badge>
      </div>

      <Tabs defaultValue="organizations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="users">User Control</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data Control</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Organization Management */}
        <TabsContent value="organizations" className="space-y-4">
          {/* Organization Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Organizations</p>
                    <p className="text-2xl font-bold">{analyticsLoading ? '...' : (analytics as any)?.totalOrganizations || 0}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Organizations</p>
                    <p className="text-2xl font-bold text-green-600">{analyticsLoading ? '...' : analytics?.activeOrganizations || 0}</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{analyticsLoading ? '...' : analytics?.totalUsers || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                    <p className="text-2xl font-bold">{analyticsLoading ? '...' : analytics?.totalPatients || 0}</p>
                  </div>
                  <UserPlus className="w-8 h-8 text-cyan-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Organization Management Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Create Organization
                </CardTitle>
                <CardDescription>Add new healthcare organizations to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCreateOrganization} className="w-full">Create New Organization</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="w-5 h-5" />
                  Suspend Organizations
                </CardTitle>
                <CardDescription>Temporarily disable organization access</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleManageSuspensions} variant="destructive" className="w-full">Manage Suspensions</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Organization Settings
                </CardTitle>
                <CardDescription>Configure global organization policies</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGlobalPolicies} variant="outline" className="w-full">Global Policies</Button>
              </CardContent>
            </Card>
          </div>

          {/* Organizations List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organizations Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {organizationsLoading ? (
                <div className="text-center py-8">Loading organizations...</div>
              ) : (
                <div className="space-y-4">
                  {organizations.map((org: any) => (
                    <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{org.name}</h3>
                          <p className="text-sm text-muted-foreground">{org.type} • {org.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={org.isActive ? "default" : "secondary"}>
                          {org.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleManageOrganization(org)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Control */}
        <TabsContent value="system" className="space-y-4">
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">System Status</p>
                    <p className="text-2xl font-bold text-green-600">Operational</p>
                  </div>
                  <Server className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                    <p className="text-2xl font-bold">{healthLoading ? '...' : Math.floor((systemHealth?.uptime || 0) / 3600)}h</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Connections</p>
                    <p className="text-2xl font-bold">{healthLoading ? '...' : systemHealth?.activeConnections || 0}</p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                System Maintenance Mode
              </CardTitle>
              <CardDescription>Control system-wide maintenance and scheduled downtime</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Maintenance Mode</h3>
                  <p className="text-sm text-muted-foreground">Temporarily disable user access for system maintenance</p>
                </div>
                <Switch
                  checked={systemMaintenance}
                  onCheckedChange={handleMaintenanceToggle}
                  disabled={maintenanceMutation.isPending}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maintenance-message">Maintenance Message</Label>
                  <Textarea
                    id="maintenance-message"
                    placeholder="System is undergoing scheduled maintenance..."
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maintenance-duration">Estimated Duration</Label>
                  <Input
                    id="maintenance-duration"
                    placeholder="30 minutes"
                    value={maintenanceDuration}
                    onChange={(e) => setMaintenanceDuration(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Toggles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Feature Management
              </CardTitle>
              <CardDescription>Enable or disable system features across all organizations</CardDescription>
            </CardHeader>
            <CardContent>
              {featuresLoading ? (
                <div className="text-center py-8">Loading features...</div>
              ) : (
                <div className="space-y-4">
                  {features.map((feature: any) => (
                    <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{feature.name}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={(enabled) => handleFeatureToggle(feature.id, enabled)}
                        disabled={featureMutation.isPending}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Control */}
        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  System Backup
                </CardTitle>
                <CardDescription>Create comprehensive system backups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleBackup('full')}
                  disabled={backupMutation.isPending}
                  className="w-full"
                >
                  {backupMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating Backup...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Create Full Backup
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={() => handleBackup('database')}
                  disabled={backupMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Database Only
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Data Migration
                </CardTitle>
                <CardDescription>Import and export system data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleImportData} variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
                
                <Button onClick={handleExportData} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Memory Usage:</span>
                      <span className="text-sm font-medium">
                        {Math.round((systemHealth?.memoryUsage?.used || 0) / 1024 / 1024)}MB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Response Time:</span>
                      <span className="text-sm font-medium">{systemHealth?.responseTime || 0}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Error Rate:</span>
                      <span className="text-sm font-medium">{((systemHealth?.errorRate || 0) * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">CPU Usage:</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Disk Usage:</span>
                    <span className="text-sm font-medium">{systemHealth?.diskUsage?.percentage || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Network I/O:</span>
                    <span className="text-sm font-medium">Normal</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    All systems operational
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Scheduled maintenance: None
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Last backup: {systemHealth?.lastBackup ? new Date(systemHealth.lastBackup).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Control */}
        <TabsContent value="users" className="space-y-4">
          {/* User Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>Search and manage user accounts across all organizations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search users by username, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUserSearch();
                    }
                  }}
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleUserSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Account Control
                </CardTitle>
                <CardDescription>Lock or unlock user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleLockAccount} variant="destructive" className="w-full">
                  <Lock className="w-4 h-4 mr-2" />
                  Lock Account
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Password Reset
                </CardTitle>
                <CardDescription>Force password reset for user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleResetPassword} variant="outline" className="w-full">
                  <Key className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="w-5 h-5" />
                  Impersonate Users
                </CardTitle>
                <CardDescription>Login as any user for troubleshooting</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleImpersonateUser} variant="outline" className="w-full">
                  <UserX className="w-4 h-4 mr-2" />
                  Impersonate User
                </Button>
              </CardContent>
            </Card>

          </div>
        </TabsContent>
      </Tabs>

      {/* Organization Creation Modal */}
      <Dialog open={showCreateOrg} onOpenChange={setShowCreateOrg}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Add a new healthcare organization to the system
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newOrgData.name}
                onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select 
                value={newOrgData.type} 
                onValueChange={(value) => setNewOrgData({ ...newOrgData, type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="health_center">Health Center</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newOrgData.email}
                onChange={(e) => setNewOrgData({ ...newOrgData, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={newOrgData.phone}
                onChange={(e) => setNewOrgData({ ...newOrgData, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleCreateOrgSubmit}
              disabled={createOrgMutation.isPending}
            >
              {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Management Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {userModalType === 'lock' && 'Lock User Account'}
              {userModalType === 'reset' && 'Reset User Password'}
              {userModalType === 'impersonate' && 'Impersonate User'}
            </DialogTitle>
            <DialogDescription>
              {userModalType === 'lock' && 'Lock or unlock user account access'}
              {userModalType === 'reset' && 'Send password reset email to user'}
              {userModalType === 'impersonate' && 'Login as this user for troubleshooting'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="userSearch" className="text-right">
                Search User
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="userSearch"
                  placeholder="Enter username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button 
                  onClick={handleUserSearch}
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  Search Users
                </Button>
              </div>
            </div>
            {userSearchResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-2">
                {userSearchResults.map((user: any) => (
                  <div 
                    key={user.id}
                    className={`p-2 border rounded cursor-pointer ${
                      selectedUserId === user.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={handleUserAction}
              disabled={!selectedUserId || lockUserMutation.isPending || resetPasswordMutation.isPending || impersonateUserMutation.isPending}
              variant={userModalType === 'lock' ? 'destructive' : 'default'}
            >
              {userModalType === 'lock' && 'Lock Account'}
              {userModalType === 'reset' && 'Reset Password'}
              {userModalType === 'impersonate' && 'Start Impersonation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Management Modal */}
      <Dialog open={showDataModal} onOpenChange={setShowDataModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {dataModalType === 'import' ? 'Import Data' : 'Export Data'}
            </DialogTitle>
            <DialogDescription>
              {dataModalType === 'import' 
                ? 'Upload and import data into the system'
                : 'Export system data for backup or migration'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {dataModalType === 'import' ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file" className="text-right">
                  File
                </Label>
                <Input
                  id="file"
                  type="file"
                  accept=".json,.csv,.sql"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="col-span-3"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-900 mb-3">
                  Select what data to export:
                </p>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-3 px-4 hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => {
                      exportDataMutation.mutate('full');
                      setShowDataModal(false);
                    }}
                  >
                    <div className="flex flex-col items-start w-full">
                      <span className="font-medium">Full System Export</span>
                      <span className="text-xs text-muted-foreground mt-1">All system data including organizations, users, and settings</span>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-3 px-4 hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => {
                      exportDataMutation.mutate('organizations');
                      setShowDataModal(false);
                    }}
                  >
                    <div className="flex flex-col items-start w-full">
                      <span className="font-medium">Organizations Only</span>
                      <span className="text-xs text-muted-foreground mt-1">Export organization data and settings</span>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-3 px-4 hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => {
                      exportDataMutation.mutate('users');
                      setShowDataModal(false);
                    }}
                  >
                    <div className="flex flex-col items-start w-full">
                      <span className="font-medium">Users Only</span>
                      <span className="text-xs text-muted-foreground mt-1">Export user accounts and profile information</span>
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={handleDataAction}
              disabled={importDataMutation.isPending || exportDataMutation.isPending}
            >
              {dataModalType === 'import' ? 'Import Data' : 'Export Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sessions Monitoring Modal */}
      <Dialog open={showSessionsModal} onOpenChange={setShowSessionsModal}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Active User Sessions
            </DialogTitle>
            <DialogDescription>
              Monitor and manage active user sessions across all organizations
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {(sessionsData as any)?.sessions?.map((session: any) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">{session.username}</span>
                    <Badge variant="outline">{session.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    IP: {session.ipAddress} • Duration: {session.sessionDuration}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last activity: {new Date(session.lastActivity).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => forceLogoutMutation.mutate(session.id)}
                  disabled={forceLogoutMutation.isPending}
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Force Logout
                </Button>
              </div>
            )) || (
              <div className="text-center py-8 text-muted-foreground">
                No active sessions found
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => refetchSessions()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Security Settings Modal */}
      <Dialog open={showSecurityModal} onOpenChange={setShowSecurityModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Policy Configuration
            </DialogTitle>
            <DialogDescription>
              Configure global security settings for all organizations
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Session Timeout</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  type="number"
                  value={securitySettings.sessionTimeoutMinutes}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    sessionTimeoutMinutes: Number(e.target.value)
                  })}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Max Login Attempts</Label>
              <Input
                type="number"
                value={securitySettings.maxLoginAttempts}
                onChange={(e) => setSecuritySettings({
                  ...securitySettings,
                  maxLoginAttempts: Number(e.target.value)
                })}
                className="col-span-3 w-20"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Password Policy</Label>
              <Select 
                value={securitySettings.passwordPolicy}
                onValueChange={(value) => setSecuritySettings({
                  ...securitySettings,
                  passwordPolicy: value
                })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (8 characters)</SelectItem>
                  <SelectItem value="strong">Strong (12 characters + symbols)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (16 characters + MFA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Require MFA</Label>
              <div className="col-span-3">
                <Switch
                  checked={securitySettings.requireMFA}
                  onCheckedChange={(checked) => setSecuritySettings({
                    ...securitySettings,
                    requireMFA: checked
                  })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSecurityModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateSecurityMutation.mutate(securitySettings)}
              disabled={updateSecurityMutation.isPending}
            >
              {updateSecurityMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Configuration Modal */}
      <Dialog open={showAuditModal} onOpenChange={setShowAuditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Audit Log Configuration
            </DialogTitle>
            <DialogDescription>
              Configure system-wide audit logging settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Retention Period</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  type="number"
                  value={auditSettings.retentionDays}
                  onChange={(e) => setAuditSettings({
                    ...auditSettings,
                    retentionDays: Number(e.target.value)
                  })}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Log Level</Label>
              <Select 
                value={auditSettings.logLevel}
                onValueChange={(value) => setAuditSettings({
                  ...auditSettings,
                  logLevel: value
                })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal (login/logout only)</SelectItem>
                  <SelectItem value="standard">Standard (critical actions)</SelectItem>
                  <SelectItem value="detailed">Detailed (all actions)</SelectItem>
                  <SelectItem value="debug">Debug (with request data)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Audit logs older than the retention period will be automatically deleted during cleanup.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuditModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateAuditMutation.mutate(auditSettings)}
              disabled={updateAuditMutation.isPending}
            >
              {updateAuditMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Monitor Modal */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Activity Monitor
            </DialogTitle>
            <DialogDescription>
              Track user activity across all organizations
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">Action</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">User</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Details</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(activityData as any)?.activities?.map((activity: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Badge variant="outline">{activity.action}</Badge>
                    </td>
                    <td className="px-4 py-2 text-sm">User #{activity.userId}</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {typeof activity.details === 'object' 
                        ? JSON.stringify(activity.details).substring(0, 50) + '...'
                        : activity.details || '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground">
                      No activity data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => refetchActivity()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Viewer Modal */}
      <Dialog open={showLogsModal} onOpenChange={setShowLogsModal}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Log Viewer
            </DialogTitle>
            <DialogDescription>
              View and analyze system logs
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[500px] overflow-y-auto font-mono text-sm bg-gray-900 text-gray-100 rounded-lg p-4">
            {(logsData as any)?.logs?.map((log: any, index: number) => (
              <div key={index} className={`py-1 border-b border-gray-800 ${
                log.level === 'error' ? 'text-red-400' :
                log.level === 'warning' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                <span className="text-gray-500">[{new Date(log.timestamp).toISOString()}]</span>
                {' '}
                <span className={`font-bold ${
                  log.level === 'error' ? 'text-red-500' :
                  log.level === 'warning' ? 'text-yellow-500' :
                  'text-blue-500'
                }`}>
                  [{log.level?.toUpperCase() || 'INFO'}]
                </span>
                {' '}
                <span>{log.action}</span>
                {log.userId && <span className="text-gray-500"> (User #{log.userId})</span>}
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">
                No logs available
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-1" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
            <Button variant="outline" onClick={() => refetchLogs()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Organization Suspensions Modal */}
      <Dialog open={showSuspensions} onOpenChange={setShowSuspensions}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5" />
              Manage Organization Suspensions
            </DialogTitle>
            <DialogDescription>
              Suspend or unsuspend organizations to temporarily disable access
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[500px] overflow-y-auto space-y-3">
            {organizationsLoading ? (
              <div className="text-center py-8">Loading organizations...</div>
            ) : (
              organizations.map((org: any) => (
                <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{org.name}</h4>
                    <p className="text-sm text-muted-foreground">{org.email}</p>
                    <Badge variant={org.isActive ? "default" : "destructive"} className="mt-2">
                      {org.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant={org.isActive ? "destructive" : "default"}
                    onClick={() => handleSuspendOrganization(org.id, !org.isActive)}
                    disabled={suspendOrgMutation.isPending}
                  >
                    {org.isActive ? "Suspend" : "Unsuspend"}
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspensions(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Organization Management Modal */}
      <Dialog open={showOrgManage} onOpenChange={setShowOrgManage}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Manage Organization
            </DialogTitle>
            <DialogDescription>
              Edit organization details and settings
            </DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              {/* Organization Statistics */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Organization ID</p>
                  <p className="font-semibold">#{selectedOrg.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedOrg.isActive ? "default" : "secondary"}>
                    {selectedOrg.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {selectedOrg.userCount !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="font-semibold">{selectedOrg.userCount}</p>
                  </div>
                )}
                {selectedOrg.createdAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-semibold text-sm">
                      {new Date(selectedOrg.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Edit Form */}
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-org-name" className="text-right">Name *</Label>
                  <Input
                    id="edit-org-name"
                    value={editOrgData.name}
                    onChange={(e) => setEditOrgData({ ...editOrgData, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-org-type" className="text-right">Type</Label>
                  <Select 
                    value={editOrgData.type} 
                    onValueChange={(value) => setEditOrgData({ ...editOrgData, type: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinic">Clinic</SelectItem>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="health_center">Health Center</SelectItem>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-org-email" className="text-right">Email *</Label>
                  <Input
                    id="edit-org-email"
                    type="email"
                    value={editOrgData.email}
                    onChange={(e) => setEditOrgData({ ...editOrgData, email: e.target.value })}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-org-phone" className="text-right">Phone</Label>
                  <Input
                    id="edit-org-phone"
                    value={editOrgData.phone}
                    onChange={(e) => setEditOrgData({ ...editOrgData, phone: e.target.value })}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-org-address" className="text-right">Address</Label>
                  <Input
                    id="edit-org-address"
                    value={editOrgData.address}
                    onChange={(e) => setEditOrgData({ ...editOrgData, address: e.target.value })}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-org-website" className="text-right">Website</Label>
                  <Input
                    id="edit-org-website"
                    type="url"
                    value={editOrgData.website}
                    onChange={(e) => setEditOrgData({ ...editOrgData, website: e.target.value })}
                    className="col-span-3"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Status</Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Switch
                      checked={editOrgData.isActive}
                      onCheckedChange={(checked) => setEditOrgData({ ...editOrgData, isActive: checked })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {editOrgData.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowOrgManage(false);
                setSelectedOrg(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateOrganization}
              disabled={updateOrgMutation.isPending}
            >
              {updateOrgMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Policies Modal */}
      <Dialog open={showPolicies} onOpenChange={setShowPolicies}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Global Organization Policies
            </DialogTitle>
            <DialogDescription>
              Configure system-wide policies that apply to all organizations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Patient Self-Registration</h4>
                <p className="text-sm text-muted-foreground">Allow patients to register themselves</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Email Verification</h4>
                <p className="text-sm text-muted-foreground">Require email verification for new users</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Data Sharing</h4>
                <p className="text-sm text-muted-foreground">Allow data sharing between organizations</p>
              </div>
              <Switch />
            </div>
            <div className="space-y-2">
              <Label>Default User Role</Label>
              <Select defaultValue="nurse">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPolicies(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Policies Updated",
                description: "Global policies have been updated successfully",
              });
              setShowPolicies(false);
            }}>
              Save Policies
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}