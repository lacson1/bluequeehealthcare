import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield,
  User,
  Calendar,
  Activity,
  Filter,
  Download,
  Eye,
  UserCheck,
  FileText,
  Settings,
  AlertCircle,
  Clock,
  Search
} from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId?: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditResponse {
  data: AuditLog[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

interface AuditStats {
  todayCount: number;
  activeUsers: number;
  patientActions: number;
  criticalActions: number;
}

export function AuditLogsDashboard() {
  const [filterAction, setFilterAction] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("today");

  const { data: auditResponse, isLoading } = useQuery<AuditResponse>({
    queryKey: ["/api/audit-logs", filterAction, filterUser, dateRange],
    refetchInterval: false, // Disabled auto-refresh
    staleTime: 3 * 60 * 1000, // Cache for 3 minutes
  });

  const auditLogs = auditResponse?.data || [];

  const { data: auditStats } = useQuery<AuditStats>({
    queryKey: ["/api/audit-logs/stats"],
    refetchInterval: false, // Disabled auto-refresh
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter logs based on search and filters
  const filteredLogs = auditLogs.filter((log: AuditLog) => {
    const matchesSearch = searchTerm === "" || 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesUser = filterUser === "all" || log.userId.toString() === filterUser;
    
    return matchesSearch && matchesAction && matchesUser;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
      case "create_patient":
      case "create_visit":
        return <UserCheck className="w-4 h-4 text-green-600" />;
      case "update":
      case "update_patient":
      case "edit_patient":
        return <Settings className="w-4 h-4 text-blue-600" />;
      case "view":
      case "view_patient":
        return <Eye className="w-4 h-4 text-gray-600" />;
      case "delete":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "login":
      case "logout":
        return <User className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "create":
      case "create_patient":
      case "create_visit":
        return "default";
      case "update":
      case "update_patient":
      case "edit_patient":
        return "secondary";
      case "delete":
        return "destructive";
      case "view":
      case "view_patient":
        return "outline";
      default:
        return "secondary";
    }
  };

  const formatActionDescription = (log: AuditLog) => {
    const entityName = log.entityType.replace('_', ' ');
    const actionName = log.action.replace('_', ' ');
    
    if (log.entityId) {
      return `${actionName} ${entityName} #${log.entityId}`;
    }
    return `${actionName} ${entityName}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-600">Track all system activities and user actions</p>
          </div>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Logs
        </Button>
      </div>

      {/* Stats Cards */}
      {auditStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Actions</p>
                  <p className="text-2xl font-bold">{auditStats.todayCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold">{auditStats.activeUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Patient Records</p>
                  <p className="text-2xl font-bold">{auditStats.patientActions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Critical Actions</p>
                  <p className="text-2xl font-bold">{auditStats.criticalActions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users, actions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action Type</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {Array.from(new Set(auditLogs.map((log: AuditLog) => ({
                    id: log.userId,
                    name: log.userName
                  })))).map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity ({filteredLogs.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No audit logs found matching your criteria</p>
              </div>
            ) : (
              filteredLogs.map((log: AuditLog) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    {getActionIcon(log.action)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{log.userName}</span>
                        <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                          {log.action.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-600">{formatActionDescription(log)}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(log.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                        </span>
                        <span>Role: {log.userRole}</span>
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                  </div>
                  
                  {log.details && (
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}