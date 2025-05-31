import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Ban
} from "lucide-react";

export default function SuperAdminControlPanel() {
  const [systemMaintenance, setSystemMaintenance] = useState(false);
  
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Create Organization
                </CardTitle>
                <CardDescription>Add new healthcare organizations to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Create New Organization</Button>
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
                <Button variant="destructive" className="w-full">Manage Suspensions</Button>
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
                <Button variant="outline" className="w-full">Global Policies</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Control */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="w-5 h-5" />
                  Impersonate Users
                </CardTitle>
                <CardDescription>Login as any user for troubleshooting</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">User Impersonation</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Account Controls
                </CardTitle>
                <CardDescription>Lock/unlock user accounts system-wide</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full">Account Management</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Password Resets
                </CardTitle>
                <CardDescription>Force password resets for any user</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Password Controls</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Controls */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Maintenance Mode
                </CardTitle>
                <CardDescription>Enable system-wide maintenance mode</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Maintenance Mode</span>
                  <Switch 
                    checked={systemMaintenance} 
                    onCheckedChange={setSystemMaintenance}
                  />
                </div>
                <Button variant="destructive" className="w-full" disabled={!systemMaintenance}>
                  Activate Maintenance
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  System Restart
                </CardTitle>
                <CardDescription>Restart system services and clear caches</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full">Restart System</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Feature Toggles
                </CardTitle>
                <CardDescription>Enable/disable features system-wide</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Manage Features</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  System Announcements
                </CardTitle>
                <CardDescription>Send notifications to all organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Create Announcement</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Controls */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Session Monitoring
                </CardTitle>
                <CardDescription>View and control active user sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">View Sessions</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Policies
                </CardTitle>
                <CardDescription>Configure global security settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Security Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Audit Controls
                </CardTitle>
                <CardDescription>Configure system-wide audit logging</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Audit Configuration</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  System Backup
                </CardTitle>
                <CardDescription>Create full system backups</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Create Backup</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Data Migration
                </CardTitle>
                <CardDescription>Import/export data between systems</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Migration Tools</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Controls
                </CardTitle>
                <CardDescription>Direct database management tools</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full">Database Admin</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Data Cleanup
                </CardTitle>
                <CardDescription>Clean up orphaned or old data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Cleanup Tools</Button>
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
                  <Activity className="w-5 h-5" />
                  System Health
                </CardTitle>
                <CardDescription>Monitor system performance and health</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Health Dashboard</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Activity
                </CardTitle>
                <CardDescription>Track user activity across all organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Activity Monitor</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  System Logs
                </CardTitle>
                <CardDescription>View and analyze system logs</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Log Viewer</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}