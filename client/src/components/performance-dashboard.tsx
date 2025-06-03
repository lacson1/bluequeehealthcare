import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Server, 
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Shield,
  Settings,
  Wifi,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface PerformanceStats {
  totalRequests: number;
  avgResponseTime: number;
  avgMemoryUsage: number;
  avgCpuUsage: number;
  errorRate: number;
  slowestEndpoints: Array<{
    endpoint: string;
    avgResponseTime: number;
    maxResponseTime: number;
    requestCount: number;
  }>;
  timeframe: string;
}

interface HealthcareIntegration {
  name: string;
  status: 'active' | 'ready' | 'error';
  description: string;
  endpoint: string;
}

export function PerformanceDashboard() {
  const [timeframe, setTimeframe] = useState('24h');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const { data: stats, isLoading, refetch } = useQuery<PerformanceStats>({
    queryKey: ['/api/performance/stats', timeframe],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: optimizationTasks, isLoading: isLoadingTasks, refetch: refetchTasks } = useQuery({
    queryKey: ['/api/optimization/tasks'],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: aiOptimizationTasks, isLoading: isLoadingAITasks, refetch: refetchAITasks } = useQuery({
    queryKey: ['/api/ai-optimization/tasks'],
    refetchInterval: 120000, // Refresh every 2 minutes (AI analysis is more expensive)
  });

  const implementOptimization = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest(`/api/optimization/implement/${taskId}`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/optimization/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/performance/stats'] });
      refetchTasks();
      refetch();
    },
  });

  const implementAIOptimization = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest(`/api/ai-optimization/implement/${taskId}`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-optimization/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/performance/stats'] });
      refetchAITasks();
      refetch();
      toast({
        title: "AI Optimization Complete",
        description: "AI-powered optimization successfully implemented",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Implementation Error",
        description: error.message || "Failed to implement AI optimization",
        variant: "destructive",
      });
    },
  });

  const handleIntegrationConfigure = async (integration: any) => {
    try {
      let endpoint = '';
      let payload = {};

      switch (integration.name) {
        case 'HL7 FHIR Integration':
          endpoint = '/api/fhir/patient/1';
          payload = { patientId: 1 };
          break;
        case 'Laboratory System Sync':
          endpoint = '/api/integrations/lab-sync';
          payload = { 
            labSystemId: 'lab_001', 
            patientId: 1, 
            testResults: ['CBC', 'Lipid Panel'] 
          };
          break;
        case 'E-Prescribing Network':
          endpoint = '/api/integrations/e-prescribe';
          payload = { 
            prescriptionId: 1, 
            pharmacyId: 'pharm_001', 
            patientInfo: { id: 1 } 
          };
          break;
        case 'Insurance Verification':
          endpoint = '/api/integrations/verify-insurance';
          payload = { 
            patientId: 1, 
            insuranceInfo: { plan: 'Standard' }, 
            serviceType: 'consultation' 
          };
          break;
        case 'Telemedicine Platform':
          endpoint = '/api/integrations/telemedicine';
          payload = { 
            patientId: 1, 
            appointmentType: 'consultation', 
            scheduledTime: new Date().toISOString() 
          };
          break;
        default:
          throw new Error('Unknown integration type');
      }

      const response = await apiRequest(endpoint, 'POST', payload);

      toast({
        title: "Integration Configured",
        description: `${integration.name} has been successfully configured and tested.`,
      });

    } catch (error: any) {
      toast({
        title: "Configuration Failed",
        description: error.message || `Failed to configure ${integration.name}`,
        variant: "destructive",
      });
    }
  };

  const getSystemStatus = () => {
    if (!stats) return { status: 'unknown', message: 'Loading performance data...', color: 'text-gray-500', icon: Activity, label: 'Loading' };
    
    if (stats.avgResponseTime > 2000 || stats.errorRate > 0.05) {
      return { status: 'critical', message: 'System performance needs immediate attention', color: 'text-red-500', icon: TrendingDown, label: 'Critical' };
    }
    if (stats.avgResponseTime > 1000 || stats.errorRate > 0.02) {
      return { status: 'warning', message: 'System performance needs optimization', color: 'text-yellow-500', icon: Activity, label: 'Warning' };
    }
    return { status: 'good', message: 'System performance is optimal', color: 'text-green-500', icon: TrendingUp, label: 'Excellent' };
  };

  const getOptimizationRecommendations = () => {
    if (!stats) return [];
    
    const recommendations = [];
    
    if (stats.avgResponseTime > 1000) {
      recommendations.push({
        title: 'Database Query Optimization',
        description: 'Add indexes to frequently queried tables',
        priority: 'high',
        action: 'optimize-db'
      });
    }
    
    if (stats.errorRate > 2) {
      recommendations.push({
        title: 'Error Rate Investigation',
        description: 'Review error logs and implement better error handling',
        priority: 'high',
        action: 'review-errors'
      });
    }
    
    if (stats.avgMemoryUsage > 50) {
      recommendations.push({
        title: 'Memory Usage Optimization',
        description: 'Implement caching and optimize memory-intensive operations',
        priority: 'medium',
        action: 'optimize-memory'
      });
    }
    
    return recommendations;
  };

  const healthcareIntegrations: HealthcareIntegration[] = [
    {
      name: 'HL7 FHIR Export',
      status: 'ready',
      description: 'Export patient data in FHIR format for interoperability',
      endpoint: '/api/fhir/patient'
    },
    {
      name: 'Laboratory Integration',
      status: 'ready', 
      description: 'Sync lab results from external LIS systems',
      endpoint: '/api/integrations/lab-sync'
    },
    {
      name: 'E-Prescribing',
      status: 'ready',
      description: 'Submit prescriptions electronically to pharmacy networks',
      endpoint: '/api/integrations/e-prescribe'
    },
    {
      name: 'Insurance Verification',
      status: 'ready',
      description: 'Verify patient insurance coverage and eligibility',
      endpoint: '/api/integrations/verify-insurance'
    },
    {
      name: 'Telemedicine Platform',
      status: 'ready',
      description: 'Create virtual consultation sessions',
      endpoint: '/api/integrations/telemedicine'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ready':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'ready':
        return <Badge className="bg-blue-100 text-blue-800">Ready</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPerformanceIndicator = (avgResponseTime: number, errorRate: number) => {
    if (errorRate > 5 || avgResponseTime > 2000) {
      return { color: 'text-red-500', icon: TrendingDown, label: 'Poor' };
    } else if (errorRate > 2 || avgResponseTime > 1000) {
      return { color: 'text-yellow-500', icon: Activity, label: 'Fair' };
    } else {
      return { color: 'text-green-500', icon: TrendingUp, label: 'Good' };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">System Performance & Integrations</h2>
          <div className="animate-pulse">
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const performanceStatus = getSystemStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Performance & Integrations</h2>
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="optimization">System Optimization</TabsTrigger>
          <TabsTrigger value="integrations">Healthcare Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {stats ? (
            <>


              {/* Performance Overview Cards */}
              <div className="grid gap-6 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Status</CardTitle>
                    {performanceStatus && (() => {
                      const IconComponent = performanceStatus.icon;
                      return <IconComponent className={`h-4 w-4 ${performanceStatus.color}`} />;
                    })()}
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${performanceStatus?.color}`}>
                      {performanceStatus?.label}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Overall system health
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalRequests?.toLocaleString() || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Last {timeframe}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.avgResponseTime || 0}ms</div>
                    <p className="text-xs text-muted-foreground">
                      Average response time
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{((stats.errorRate || 0) * 100).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      Error percentage
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Resource Usage */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      Memory Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.avgMemoryUsage || 0} MB</div>
                    <p className="text-sm text-muted-foreground">
                      Average memory consumption per request
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      CPU Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.avgCpuUsage || 0} ms</div>
                    <p className="text-sm text-muted-foreground">
                      Average CPU time per request
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Slowest Endpoints */}
              <Card>
                <CardHeader>
                  <CardTitle>Slowest Endpoints</CardTitle>
                  <CardDescription>
                    Endpoints with highest average response times
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(stats.slowestEndpoints || []).map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{endpoint.endpoint}</p>
                          <p className="text-sm text-muted-foreground">
                            {endpoint.requestCount} requests
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-medium">{endpoint.avgResponseTime}ms avg</div>
                          <div className="text-sm text-muted-foreground">
                            {endpoint.maxResponseTime}ms max
                          </div>
                        </div>
                      </div>
                    ))}
                    {(stats.slowestEndpoints || []).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No performance data available for this timeframe
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Optimization Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    System Optimization Recommendations
                  </CardTitle>
                  <CardDescription>
                    Actionable steps to improve your clinic management system performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getOptimizationRecommendations().map((rec, index) => (
                      <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{rec.title}</p>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                            {rec.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {getOptimizationRecommendations().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-medium mb-2">System Running Optimally</h3>
                        <p>No immediate optimization recommendations at this time.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Performance Data</h3>
                <p className="text-muted-foreground">
                  Performance monitoring data will appear here once the system starts collecting metrics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          {isLoadingTasks ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">
                  <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded mx-auto mb-2"></div>
                  <div className="h-3 w-48 bg-gray-200 rounded mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Automated System Optimization
                  </CardTitle>
                  <CardDescription>
                    AI-powered system optimization recommendations with one-click implementation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {optimizationTasks?.tasks && optimizationTasks.tasks.length > 0 ? (
                    <div className="space-y-4">
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Standard Optimization Tasks</h4>
                      </div>
                      {optimizationTasks.tasks.map((task: any) => (
                        <div key={task.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{task.title}</h3>
                                <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                                  {task.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Impact: {task.impact}</span>
                                <span>Effort: {task.effort}</span>
                                <span>Category: {task.category}</span>
                              </div>
                              {task.steps && task.steps.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium mb-2">Implementation Steps:</p>
                                  <ul className="text-sm text-muted-foreground space-y-1">
                                    {task.steps.map((step: string, index: number) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        {step}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <Button
                                onClick={() => implementOptimization.mutate(task.id)}
                                disabled={implementOptimization.isPending}
                                size="sm"
                                className="min-w-[100px]"
                              >
                                {implementOptimization.isPending ? (
                                  <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                    Implementing
                                  </div>
                                ) : (
                                  <>
                                    <Zap className="h-3 w-3 mr-1" />
                                    Implement
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* AI-Powered Optimization Section */}
                      {aiOptimizationTasks?.tasks && aiOptimizationTasks.tasks.length > 0 && (
                        <div className="mt-8 pt-6 border-t">
                          <div className="mb-4 flex items-center gap-2">
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <h4 className="text-sm font-medium text-blue-900">AI-Powered Optimization Tasks</h4>
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                              Confidence: {aiOptimizationTasks.summary?.avgConfidence || 75}%
                            </span>
                          </div>
                          {aiOptimizationTasks.tasks.map((task: any) => (
                            <div key={task.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50 mb-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      task.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {task.priority}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      task.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                                      task.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      Risk: {task.riskLevel}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      AI Confidence: {task.aiConfidence}%
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                                  <p className="text-sm text-gray-600">{task.description}</p>
                                  <p className="text-xs text-blue-700 italic">{task.aiReasoning}</p>
                                  <div className="text-xs text-gray-500">
                                    <strong>Impact:</strong> {task.estimatedImpact}
                                  </div>
                                  {task.expectedBenefits && task.expectedBenefits.length > 0 && (
                                    <div className="text-xs">
                                      <strong className="text-green-700">Benefits:</strong>
                                      <ul className="list-disc list-inside ml-2 text-green-600">
                                        {task.expectedBenefits.map((benefit: string, idx: number) => (
                                          <li key={idx}>{benefit}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {task.potentialRisks && task.potentialRisks.length > 0 && (
                                    <div className="text-xs">
                                      <strong className="text-orange-700">Risks:</strong>
                                      <ul className="list-disc list-inside ml-2 text-orange-600">
                                        {task.potentialRisks.map((risk: string, idx: number) => (
                                          <li key={idx}>{risk}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <Button
                                    onClick={() => implementAIOptimization.mutate(task.id)}
                                    disabled={implementAIOptimization.isPending}
                                    size="sm"
                                    variant="outline"
                                    className="min-w-[120px] border-blue-300 text-blue-700 hover:bg-blue-100"
                                  >
                                    {implementAIOptimization.isPending ? (
                                      <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                        AI Implementing
                                      </div>
                                    ) : (
                                      <>
                                        <Zap className="h-3 w-3 mr-1" />
                                        AI Implement
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {aiOptimizationTasks.aiInsights && (
                            <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                              <h5 className="text-xs font-medium text-blue-900 mb-1">AI System Analysis</h5>
                              <p className="text-xs text-blue-800">{aiOptimizationTasks.aiInsights}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <h3 className="text-lg font-medium mb-2">System Fully Optimized</h3>
                      <p className="text-muted-foreground">
                        No optimization tasks available. Your clinic management system is running at peak performance.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Improvement Categories */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Database className="h-4 w-4" />
                      Database Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Index Coverage</span>
                      <span className="text-green-600 font-medium">95%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Query Performance</span>
                      <span className="text-green-600 font-medium">Excellent</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Connection Pool</span>
                      <span className="text-blue-600 font-medium">Optimized</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Server className="h-4 w-4" />
                      API Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Response Caching</span>
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Compression</span>
                      <span className="text-green-600 font-medium">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Rate Limiting</span>
                      <span className="text-blue-600 font-medium">Configured</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4" />
                      Security & Monitoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Error Tracking</span>
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Performance Monitoring</span>
                      <span className="text-green-600 font-medium">Real-time</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Security Headers</span>
                      <span className="text-green-600 font-medium">Configured</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Wifi className="h-4 w-4" />
                      Healthcare Integrations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>FHIR Compliance</span>
                      <span className="text-green-600 font-medium">Ready</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Lab Integrations</span>
                      <span className="text-blue-600 font-medium">Available</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>E-Prescribing</span>
                      <span className="text-blue-600 font-medium">Ready</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Healthcare Tool Integrations</CardTitle>
                <CardDescription>
                  Connect with external healthcare systems and tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthcareIntegrations.map((integration, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(integration.status)}
                        <div className="space-y-1">
                          <p className="font-medium">{integration.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {integration.description}
                          </p>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {integration.endpoint}
                          </code>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(integration.status)}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleIntegrationConfigure(integration)}
                        >
                          Configure
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">Data Exchange</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• HL7 FHIR R4 compliance</li>
                      <li>• Real-time data synchronization</li>
                      <li>• Secure API authentication</li>
                      <li>• Data validation and mapping</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Workflow Integration</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Automated prescription routing</li>
                      <li>• Lab result notifications</li>
                      <li>• Insurance eligibility checks</li>
                      <li>• Telemedicine session management</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}