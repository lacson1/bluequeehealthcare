import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Users,
  FileText,
  DollarSign,
  Settings,
  Shield,
  UserPlus,
  Building2,
  Mail,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  MoreVertical,
  ArrowRight,
  Activity
} from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRole } from "@/components/role-guard";

interface PendingTask {
  id: number;
  type: 'user_approval' | 'organization_approval' | 'payment_approval' | 'document_approval' | 'role_assignment' | 'system_config';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  createdAt: string;
  createdBy?: string;
  metadata?: Record<string, any>;
}

interface WorkflowStats {
  pendingTasks: number;
  completedToday: number;
  averageProcessingTime: number;
  tasksByType: Record<string, number>;
  tasksByPriority: Record<string, number>;
}

export default function AdminWorkflow() {
  const { user } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("pending");

  // Fetch workflow stats
  const { data: stats, isLoading: statsLoading } = useQuery<WorkflowStats>({
    queryKey: ['/api/admin/workflow/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch pending tasks
  const { data: tasks = [], isLoading: tasksLoading, refetch } = useQuery<PendingTask[]>({
    queryKey: ['/api/admin/workflow/tasks', { type: filterType, priority: filterPriority, status: filterStatus }],
    refetchInterval: 30000,
  });

  // Approve task mutation
  const approveTaskMutation = useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: number; notes?: string }) => {
      return apiRequest(`/api/admin/workflow/tasks/${taskId}/approve`, 'POST', { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/workflow'] });
      toast({
        title: "Task Approved",
        description: "The task has been approved successfully.",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve task",
        variant: "destructive",
      });
    },
  });

  // Reject task mutation
  const rejectTaskMutation = useMutation({
    mutationFn: async ({ taskId, reason }: { taskId: number; reason: string }) => {
      return apiRequest(`/api/admin/workflow/tasks/${taskId}/reject`, 'POST', { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/workflow'] });
      toast({
        title: "Task Rejected",
        description: "The task has been rejected.",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject task",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (taskId: number) => {
    approveTaskMutation.mutate({ taskId });
  };

  const handleReject = (taskId: number) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      rejectTaskMutation.mutate({ taskId, reason });
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'user_approval':
        return <UserPlus className="w-5 h-5" />;
      case 'organization_approval':
        return <Building2 className="w-5 h-5" />;
      case 'payment_approval':
        return <DollarSign className="w-5 h-5" />;
      case 'document_approval':
        return <FileText className="w-5 h-5" />;
      case 'role_assignment':
        return <Shield className="w-5 h-5" />;
      case 'system_config':
        return <Settings className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchQuery === "" || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || task.type === filterType;
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;

    return matchesSearch && matchesType && matchesPriority && matchesStatus;
  });

  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const inReviewTasks = filteredTasks.filter(t => t.status === 'in_review');
  const completedTasks = filteredTasks.filter(t => t.status === 'approved' || t.status === 'rejected');

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Workflow</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage administrative tasks, approvals, and system workflows
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending Tasks</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {statsLoading ? "..." : stats?.pendingTasks || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed Today</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {statsLoading ? "..." : stats?.completedToday || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg. Processing</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {statsLoading ? "..." : `${stats?.averageProcessingTime || 0}m`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Urgent Tasks</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {statsLoading ? "..." : filteredTasks.filter(t => t.priority === 'urgent' && t.status === 'pending').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="pending" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingTasks.length})
              </TabsTrigger>
              <TabsTrigger value="in-review">
                In Review ({inReviewTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedTasks.length})
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-sm"
              >
                <option value="all">All Types</option>
                <option value="user_approval">User Approval</option>
                <option value="organization_approval">Organization</option>
                <option value="payment_approval">Payment</option>
                <option value="document_approval">Document</option>
                <option value="role_assignment">Role Assignment</option>
                <option value="system_config">System Config</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Pending Tasks Tab */}
          <TabsContent value="pending" className="space-y-4">
            {tasksLoading ? (
              <div className="text-center py-12">Loading tasks...</div>
            ) : pendingTasks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Tasks</h3>
                  <p className="text-slate-500">All tasks are up to date!</p>
                </CardContent>
              </Card>
            ) : (
              pendingTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          task.type === 'user_approval' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          task.type === 'organization_approval' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                          task.type === 'payment_approval' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                          task.type === 'document_approval' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {getTaskIcon(task.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{task.title}</h3>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <Badge variant="outline">{getTypeLabel(task.type)}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{task.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Created {format(parseISO(task.createdAt), 'MMM d, yyyy HH:mm')}</span>
                            {task.createdBy && <span>by {task.createdBy}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(task.id)}
                          disabled={approveTaskMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(task.id)}
                          disabled={rejectTaskMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Clock className="w-4 h-4 mr-2" />
                              Mark as In Review
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* In Review Tab */}
          <TabsContent value="in-review" className="space-y-4">
            {inReviewTasks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tasks In Review</h3>
                  <p className="text-slate-500">No tasks are currently under review.</p>
                </CardContent>
              </Card>
            ) : (
              inReviewTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          task.type === 'user_approval' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {getTaskIcon(task.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{task.title}</h3>
                            <Badge variant="outline">In Review</Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{task.description}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed" className="space-y-4">
            {completedTasks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Completed Tasks</h3>
                  <p className="text-slate-500">Completed tasks will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              completedTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          task.status === 'approved' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        }`}>
                          {task.status === 'approved' ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{task.title}</h3>
                            <Badge variant={task.status === 'approved' ? 'default' : 'destructive'}>
                              {task.status === 'approved' ? 'Approved' : 'Rejected'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{task.description}</p>
                          <div className="text-xs text-slate-500 mt-2">
                            Completed {format(parseISO(task.createdAt), 'MMM d, yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

