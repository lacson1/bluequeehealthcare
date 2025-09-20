import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, Activity, TrendingUp, AlertTriangle, CheckCircle, 
  Calendar, Clock, FileText, Users, Stethoscope, Pill,
  BarChart3, LineChart, Target, Shield, Brain, Zap
} from 'lucide-react';

interface VitalTrend {
  date: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  temperature: number;
  weight: number;
}

interface HealthMetric {
  name: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: string;
}

interface CareAlert {
  id: string;
  type: 'medication' | 'appointment' | 'vital' | 'lab';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  actionRequired: boolean;
}

interface AdvancedPatientCareProps {
  patientId: number;
}

export function AdvancedPatientCare({ patientId }: AdvancedPatientCareProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  // Fetch comprehensive patient health data
  const { data: healthMetrics = [], isLoading: loadingMetrics } = useQuery<HealthMetric[]>({
    queryKey: ['/api/patients', patientId, 'health-metrics', selectedTimeframe],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${patientId}/health-metrics?timeframe=${selectedTimeframe}`);
      if (!response.ok) throw new Error('Failed to fetch health metrics');
      return response.json();
    }
  });

  const { data: vitalTrends = [], isLoading: loadingTrends } = useQuery<VitalTrend[]>({
    queryKey: ['/api/patients', patientId, 'vital-trends', selectedTimeframe],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${patientId}/vital-trends?timeframe=${selectedTimeframe}`);
      if (!response.ok) throw new Error('Failed to fetch vital trends');
      return response.json();
    }
  });

  const { data: careAlerts = [], isLoading: loadingAlerts } = useQuery<CareAlert[]>({
    queryKey: ['/api/patients', patientId, 'care-alerts'],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${patientId}/care-alerts`);
      if (!response.ok) throw new Error('Failed to fetch care alerts');
      return response.json();
    }
  });

  // Health Score Calculation
  const calculateHealthScore = () => {
    if (!healthMetrics.length) return 0;
    
    const normalCount = healthMetrics.filter(m => m.status === 'normal').length;
    return Math.round((normalCount / healthMetrics.length) * 100);
  };

  const healthScore = calculateHealthScore();

  // Health Risk Assessment
  const getRiskLevel = () => {
    const criticalCount = careAlerts.filter(a => a.priority === 'critical').length;
    const highCount = careAlerts.filter(a => a.priority === 'high').length;
    
    if (criticalCount > 0) return { level: 'High Risk', color: 'destructive' };
    if (highCount > 1) return { level: 'Moderate Risk', color: 'warning' };
    return { level: 'Low Risk', color: 'default' };
  };

  const riskAssessment = getRiskLevel();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const markAlertAsResolved = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/patients/${patientId}/care-alerts/${alertId}/resolve`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to resolve alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'care-alerts'] });
      toast({
        title: "Alert Resolved",
        description: "Care alert has been marked as resolved",
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* Health Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Score Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{healthScore}</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{healthScore}%</div>
                <Progress value={healthScore} className="w-24 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Assessment Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <Badge variant={riskAssessment.color as any}>{riskAssessment.level}</Badge>
                <p className="text-sm text-gray-600 mt-1">
                  {careAlerts.length} active alerts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Care Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Priority Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {careAlerts.filter(a => a.priority === 'critical' || a.priority === 'high').slice(0, 2).map(alert => (
                <div key={alert.id} className={`p-2 rounded-lg border ${getPriorityColor(alert.priority)}`}>
                  <div className="flex items-center justify-between">
                    <AlertTriangle className="h-4 w-4" />
                    <Badge variant="outline" size="sm">{alert.priority}</Badge>
                  </div>
                  <p className="text-xs font-medium mt-1">{alert.title}</p>
                </div>
              ))}
              {careAlerts.filter(a => a.priority === 'critical' || a.priority === 'high').length === 0 && (
                <div className="text-center text-green-600">
                  <CheckCircle className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-xs">No priority alerts</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Health Analysis */}
      <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Comprehensive Health Analysis</h3>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
            <TabsTrigger value="1y">1 Year</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={selectedTimeframe} className="space-y-6">
          {/* Health Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {healthMetrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                      <p className="text-lg font-bold">{metric.value}</p>
                      <p className="text-xs text-gray-500">
                        Updated {new Date(metric.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {getTrendIcon(metric.trend)}
                      <Badge className={getStatusColor(metric.status)} variant="outline">
                        {metric.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Care Alerts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Active Care Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {careAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No active care alerts</p>
                  <p className="text-sm text-gray-500">Patient care is on track</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {careAlerts.map(alert => (
                    <div key={alert.id} className={`p-4 rounded-lg border ${getPriorityColor(alert.priority)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline">{alert.type}</Badge>
                            <Badge variant={alert.priority === 'critical' ? 'destructive' : 'default'}>
                              {alert.priority}
                            </Badge>
                            {alert.actionRequired && (
                              <Badge variant="secondary">Action Required</Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900">{alert.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAlertAsResolved.mutate(alert.id)}
                          disabled={markAlertAsResolved.isPending}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Quick Care Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Stethoscope className="h-6 w-6" />
                  <span className="text-sm">New Visit</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Pill className="h-6 w-6" />
                  <span className="text-sm">Prescribe</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">Lab Order</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">Schedule</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}