import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Activity, Shield, Brain } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AIInsightsDisplay } from "@/components/ai-insights-display";
import { ErrorChatbot } from "@/components/error-chatbot";

interface ErrorLog {
  id: number;
  errorId: string;
  type: string;
  severity: string;
  message: string;
  userId: number | null;
  organizationId: number | null;
  patientId: number | null;
  url: string | null;
  component: string | null;
  resolved: boolean;
  retryable: boolean;
  createdAt: string;
  resolvedAt: string | null;
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
  performanceMetrics: Array<{ metric: string; avgValue: string; unit: string }>;
}

export default function ErrorMonitoring() {
  const [timeframe, setTimeframe] = useState("24h");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading } = useQuery<ErrorDashboard>({
    queryKey: ["/api/errors/dashboard", timeframe],
    queryParams: { timeframe }
  });

  const { data: healthStatus } = useQuery({
    queryKey: ["/api/health"]
  });

  const resolveErrorMutation = useMutation({
    mutationFn: async (errorId: string) => {
      await apiRequest(`/api/errors/${errorId}/resolve`, "PATCH");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/errors/dashboard"] });
      toast({
        title: "Error Resolved",
        description: "The error has been marked as resolved."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve error.",
        variant: "destructive"
      });
    }
  });

  const generateTestErrorsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/errors/test-generate", "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/errors/dashboard"] });
      toast({
        title: "Test Errors Generated",
        description: "Sample errors have been created for debugging purposes."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate test errors.",
        variant: "destructive"
      });
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'network': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'validation': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'authentication': return 'bg-red-100 text-red-800 border-red-200';
      case 'authorization': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'server': return 'bg-red-100 text-red-800 border-red-200';
      case 'client': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Error Monitoring</h1>
            <p className="text-gray-600 mt-1">System health and error tracking dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => generateTestErrorsMutation.mutate()}
              disabled={generateTestErrorsMutation.isPending}
              variant="outline"
              size="sm"
            >
              {generateTestErrorsMutation.isPending ? "Generating..." : "Generate Test Errors"}
            </Button>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            {healthStatus && (
              <Badge 
                variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                <Activity className="h-3 w-3" />
                {healthStatus.status === 'healthy' ? 'System Healthy' : 'System Issues'}
              </Badge>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.summary.totalErrors || 0}</div>
              <p className="text-xs text-muted-foreground">
                In the last {timeframe}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
              <Shield className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {dashboard?.summary.criticalErrors || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {dashboard?.summary.unresolvedErrors || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Need investigation
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="errors" className="space-y-6">
          <TabsList>
            <TabsTrigger value="errors">Error Logs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="ai-insights">
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="errors" className="space-y-6">
            {/* Recent Errors */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>
                  Latest errors reported by the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard?.recentErrors.map((error) => (
                    <div
                      key={error.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(error.severity)}>
                              {error.severity}
                            </Badge>
                            <Badge className={getTypeColor(error.type)}>
                              {error.type}
                            </Badge>
                            {error.resolved ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Open
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-gray-900">{error.message}</p>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Error ID: {error.errorId}</div>
                            <div>Time: {format(new Date(error.createdAt), 'PPp')}</div>
                            {error.url && <div>URL: {error.url}</div>}
                            {error.component && <div>Component: {error.component}</div>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {!error.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveErrorMutation.mutate(error.errorId)}
                              disabled={resolveErrorMutation.isPending}
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!dashboard?.recentErrors || dashboard.recentErrors.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No errors found in the selected timeframe</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Errors by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Errors by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboard?.errorsByType.map(({ type, count }) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Badge className={getTypeColor(type)}>{type}</Badge>
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                    {(!dashboard?.errorsByType || dashboard.errorsByType.length === 0) && (
                      <p className="text-gray-500 text-center py-4">No data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Errors by Severity */}
              <Card>
                <CardHeader>
                  <CardTitle>Errors by Severity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboard?.errorsBySeverity.map(({ severity, count }) => (
                      <div key={severity} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Badge className={getSeverityColor(severity)}>{severity}</Badge>
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                    {(!dashboard?.errorsBySeverity || dashboard.errorsBySeverity.length === 0) && (
                      <p className="text-gray-500 text-center py-4">No data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  System performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {dashboard?.performanceMetrics.map(({ metric, avgValue, unit }) => (
                    <Card key={metric}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium capitalize">
                          {metric.replace('_', ' ')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {parseFloat(avgValue).toFixed(1)} {unit}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!dashboard?.performanceMetrics || dashboard.performanceMetrics.length === 0) && (
                    <div className="col-span-3 text-center py-8 text-gray-500">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                      <p>No performance data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-insights">
            <AIInsightsDisplay />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* AI Error Chatbot - Floating Assistant */}
      <ErrorChatbot />
    </div>
  );
}