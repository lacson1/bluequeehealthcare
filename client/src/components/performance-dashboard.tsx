import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  BarChart3
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

  const { data: stats, isLoading, refetch } = useQuery<PerformanceStats>({
    queryKey: ['/api/performance/stats', timeframe],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getSystemStatus = () => {
    if (!stats) return { status: 'unknown', message: 'Loading performance data...', color: 'text-gray-500', icon: Activity, label: 'Loading' };
    
    if (stats.avgResponseTime > 2000 || stats.errorRate > 5) {
      return { status: 'critical', message: 'System performance needs immediate attention', color: 'text-red-500', icon: TrendingDown, label: 'Critical' };
    }
    if (stats.avgResponseTime > 1000 || stats.errorRate > 2) {
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
        <TabsList>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
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
                    {performanceStatus && React.createElement(performanceStatus.icon, { className: `h-4 w-4 ${performanceStatus.color}` })}
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
                    <div className="text-2xl font-bold">{stats.errorRate || 0}%</div>
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
                        <Button variant="outline" size="sm">
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