import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
  Brain,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ErrorLog {
  id: number;
  errorId: string;
  type: 'NETWORK' | 'VALIDATION' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'SERVER' | 'CLIENT' | 'UNKNOWN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  stack: string | null;
  userId: number | null;
  organizationId: number | null;
  patientId: number | null;
  sessionId: string | null;
  url: string | null;
  userAgent: string | null;
  action: string | null;
  component: string | null;
  retryable: boolean;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  metadata: any;
}

interface ErrorDashboard {
  summary: {
    totalErrors: number;
    criticalErrors: number;
    unresolvedErrors: number;
  };
  errorsByType: Array<{ type: string; count: number }>;
  errorsBySeverity: Array<{ severity: string; count: number }>;
  recentErrors: ErrorLog[];
  performanceMetrics: Array<{ metric: string; avgValue: number; unit: string }>;
}

interface AIInsights {
  summary: string;
  systemHealth: {
    score: number;
    trend: string;
    riskFactors: string[];
  };
  patterns: Array<{
    type: string;
    frequency: number;
    description: string;
  }>;
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  predictions: Array<{
    type: string;
    probability: number;
    timeframe: string;
  }>;
}

export default function ErrorMonitoring() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [timeframe, setTimeframe] = useState("24h");
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch error dashboard data
  const { data: dashboardData, isLoading: isLoadingDashboard, error: dashboardError, refetch: refetchDashboard } = useQuery<ErrorDashboard>({
    queryKey: ['/api/errors/dashboard', { timeframe }],
    queryFn: async () => {
      const url = new URL('/api/errors/dashboard', window.location.origin);
      url.searchParams.set('timeframe', timeframe);
      const response = await fetch(url.toString(), {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch error dashboard: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Fetch AI insights
  const { data: aiInsights, isLoading: isLoadingInsights, error: insightsError } = useQuery<AIInsights>({
    queryKey: ['/api/errors/ai-insights', { timeframe }],
    queryFn: async () => {
      const url = new URL('/api/errors/ai-insights', window.location.origin);
      url.searchParams.set('timeframe', timeframe);
      const response = await fetch(url.toString(), {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch AI insights: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Resolve error mutation
  const resolveErrorMutation = useMutation({
    mutationFn: async (errorId: string) => {
      const response = await fetch(`/api/errors/${errorId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to resolve error');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/errors/dashboard'] });
      toast({
        title: "Success",
        description: "Error marked as resolved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve error",
        variant: "destructive",
      });
    },
  });

  const handleResolveError = (errorId: string) => {
    resolveErrorMutation.mutate(errorId);
  };

  // Filter errors
  const filteredErrors = dashboardData?.recentErrors.filter(error => {
    const matchesSearch = searchTerm === "" ||
      error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.component?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.url?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || error.type === filterType;
    const matchesSeverity = filterSeverity === "all" || error.severity === filterSeverity;

    return matchesSearch && matchesType && matchesSeverity;
  }) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-white';
      case 'LOW':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'NETWORK':
        return 'bg-purple-500 text-white';
      case 'SERVER':
        return 'bg-red-500 text-white';
      case 'CLIENT':
        return 'bg-blue-500 text-white';
      case 'AUTHENTICATION':
        return 'bg-orange-500 text-white';
      case 'VALIDATION':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoadingDashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Failed to Load Error Dashboard</h2>
              <p className="text-muted-foreground mb-4">
                {dashboardError instanceof Error ? dashboardError.message : 'An error occurred while loading the dashboard'}
              </p>
              <Button onClick={() => refetchDashboard()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Error Monitoring</h1>
          <p className="text-gray-600 mt-1">Track and analyze system errors in real-time</p>
        </div>
        <Button onClick={() => refetchDashboard()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.summary.totalErrors || 0}</div>
            <p className="text-xs text-muted-foreground">Last {timeframe}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardData?.summary.criticalErrors || 0}
            </div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardData?.summary.unresolvedErrors || 0}
            </div>
            <p className="text-xs text-muted-foreground">Pending resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {aiInsights?.systemHealth.score || 100}%
            </div>
            <p className="text-xs text-muted-foreground">
              {aiInsights?.systemHealth.trend || 'stable'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search errors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="NETWORK">Network</SelectItem>
                      <SelectItem value="SERVER">Server</SelectItem>
                      <SelectItem value="CLIENT">Client</SelectItem>
                      <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                      <SelectItem value="VALIDATION">Validation</SelectItem>
                      <SelectItem value="AUTHORIZATION">Authorization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Severity</label>
                  <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                    <SelectTrigger>
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Timeframe</label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Errors Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                {filteredErrors.length} error{filteredErrors.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredErrors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No errors found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredErrors.map((error) => (
                        <TableRow key={error.id}>
                          <TableCell className="text-sm">
                            {formatDate(error.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(error.type)}>
                              {error.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(error.severity)}>
                              {error.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {error.message}
                          </TableCell>
                          <TableCell>
                            {error.component || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {error.resolved ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Resolved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                <Clock className="w-3 h-3 mr-1" />
                                Open
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedError(error)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!error.resolved && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResolveError(error.errorId)}
                                  disabled={resolveErrorMutation.isPending}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Errors by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.errorsByType && dashboardData.errorsByType.length > 0 ? (
                  <div className="space-y-2">
                    {dashboardData.errorsByType.map((item) => (
                      <div key={item.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(item.type)}>
                            {item.type}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium">{item.count}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No errors by type found
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Errors by Severity */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.errorsBySeverity && dashboardData.errorsBySeverity.length > 0 ? (
                  <div className="space-y-2">
                    {dashboardData.errorsBySeverity.map((item) => (
                      <div key={item.severity} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(item.severity)}>
                            {item.severity}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium">{item.count}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No errors by severity found
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.performanceMetrics && dashboardData.performanceMetrics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dashboardData.performanceMetrics.map((metric) => (
                      <div key={metric.metric} className="space-y-1">
                        <div className="text-sm font-medium">{metric.metric}</div>
                        <div className="text-2xl font-bold">
                          {(Number(metric.avgValue) || 0).toFixed(2)} {metric.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No performance metrics available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {isLoadingInsights ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              </CardContent>
            </Card>
          ) : insightsError ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="w-8 h-8 text-orange-500 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {insightsError instanceof Error ? insightsError.message : 'Failed to load AI insights'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : aiInsights ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{aiInsights.summary}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Health Score</span>
                        <span className="text-lg font-bold">{aiInsights.systemHealth.score}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Trend</span>
                        <Badge variant="outline">{aiInsights.systemHealth.trend}</Badge>
                      </div>
                      {aiInsights.systemHealth.riskFactors.length > 0 && (
                        <div className="mt-4">
                          <div className="text-sm font-medium mb-2">Risk Factors</div>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {aiInsights.systemHealth.riskFactors.map((factor, idx) => (
                              <li key={idx}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Error Patterns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiInsights.patterns.map((pattern, idx) => (
                        <div key={idx} className="border-b pb-2 last:border-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{pattern.type}</span>
                            <Badge variant="outline">{pattern.frequency}x</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{pattern.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Immediate Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {aiInsights.recommendations.immediate.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Long-term Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {aiInsights.recommendations.longTerm.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No AI insights available
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Error Details Dialog */}
      <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
            <DialogDescription>
              Error ID: {selectedError?.errorId}
            </DialogDescription>
          </DialogHeader>
          {selectedError && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <div className="mt-1">
                    <Badge className={getTypeColor(selectedError.type)}>
                      {selectedError.type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <div className="mt-1">
                    <Badge className={getSeverityColor(selectedError.severity)}>
                      {selectedError.severity}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Component</label>
                  <div className="mt-1 text-sm">{selectedError.component || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">
                    {selectedError.resolved ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Open
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Created At</label>
                  <div className="mt-1 text-sm">{formatDate(selectedError.createdAt)}</div>
                </div>
                {selectedError.resolvedAt && (
                  <div>
                    <label className="text-sm font-medium">Resolved At</label>
                    <div className="mt-1 text-sm">{formatDate(selectedError.resolvedAt)}</div>
                  </div>
                )}
                {selectedError.url && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium">URL</label>
                    <div className="mt-1 text-sm break-all">{selectedError.url}</div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                  {selectedError.message}
                </div>
              </div>

              {selectedError.stack && (
                <div>
                  <label className="text-sm font-medium">Stack Trace</label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm font-mono text-xs overflow-x-auto">
                    <pre>{selectedError.stack}</pre>
                  </div>
                </div>
              )}

              {selectedError.metadata && Object.keys(selectedError.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium">Metadata</label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm font-mono text-xs overflow-x-auto">
                    <pre>{JSON.stringify(selectedError.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}

              {!selectedError.resolved && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      handleResolveError(selectedError.errorId);
                      setSelectedError(null);
                    }}
                    disabled={resolveErrorMutation.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Resolved
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

