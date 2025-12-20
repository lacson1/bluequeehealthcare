import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Calendar,
  BarChart3,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface LabAnalytics {
  timeframe: string;
  metrics: {
    totalOrders: number;
    completedOrders: number;
    urgentOrders: number;
    completionRate: string;
    avgTurnaroundHours: number;
  };
}

export default function LabReportsDashboard() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch lab analytics
  const { data: analytics, isLoading } = useQuery<LabAnalytics>({
    queryKey: ['/api/lab-analytics', timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/lab-analytics?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  const metrics = analytics?.metrics || {
    totalOrders: 0,
    completedOrders: 0,
    urgentOrders: 0,
    completionRate: '0.0',
    avgTurnaroundHours: 0
  };

  const pendingOrders = metrics.totalOrders - metrics.completedOrders;
  const completionRate = parseFloat(metrics.completionRate);

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export functionality coming soon');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lab Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive lab performance metrics and reporting</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={(value: '7d' | '30d' | '90d') => setTimeframe(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalOrders}</p>
                    <p className="text-xs text-gray-500 mt-1">All lab orders</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{metrics.completedOrders}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {completionRate >= 80 ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {completionRate}% completion rate
                        </span>
                      ) : (
                        <span className="text-orange-600 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          {completionRate}% completion rate
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">{pendingOrders}</p>
                    <p className="text-xs text-gray-500 mt-1">Awaiting results</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Urgent Orders</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{metrics.urgentOrders}</p>
                    <p className="text-xs text-gray-500 mt-1">High priority</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Average Turnaround Time</p>
                      <p className="text-sm text-gray-600">Time from order to completion</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.avgTurnaroundHours > 0 
                        ? `${metrics.avgTurnaroundHours.toFixed(1)}h`
                        : 'N/A'
                      }
                    </p>
                    {metrics.avgTurnaroundHours > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {metrics.avgTurnaroundHours < 24 ? 'Excellent' : 
                         metrics.avgTurnaroundHours < 48 ? 'Good' : 'Needs Improvement'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Completion Rate</p>
                      <p className="text-sm text-gray-600">Orders completed successfully</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
                    <Badge 
                      variant={completionRate >= 80 ? "default" : completionRate >= 60 ? "secondary" : "destructive"}
                      className="mt-1"
                    >
                      {completionRate >= 80 ? 'Excellent' : completionRate >= 60 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Summary Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Lab Orders</span>
                    <span className="font-medium text-gray-900">{metrics.totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed Orders</span>
                    <span className="font-medium text-green-600">{metrics.completedOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending Orders</span>
                    <span className="font-medium text-orange-600">{pendingOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Urgent Orders</span>
                    <span className="font-medium text-red-600">{metrics.urgentOrders}</span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Completion Rate</span>
                      <span className="font-bold text-lg text-gray-900">{completionRate}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Reports Section */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex-col items-start">
                  <FileText className="w-5 h-5 mb-2 text-gray-400" />
                  <span className="font-medium">Test Volume Report</span>
                  <span className="text-xs text-gray-500 mt-1">Coming soon</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col items-start">
                  <TrendingUp className="w-5 h-5 mb-2 text-gray-400" />
                  <span className="font-medium">Trend Analysis</span>
                  <span className="text-xs text-gray-500 mt-1">Coming soon</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col items-start">
                  <BarChart3 className="w-5 h-5 mb-2 text-gray-400" />
                  <span className="font-medium">Quality Metrics</span>
                  <span className="text-xs text-gray-500 mt-1">Coming soon</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

