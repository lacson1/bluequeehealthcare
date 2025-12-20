import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Activity,
  Pill,
  TestTube,
  DollarSign,
  Clock,
  CheckCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface AnalyticsData {
  patientTrends: ChartDataPoint[];
  visitTrends: ChartDataPoint[];
  revenueTrends: ChartDataPoint[];
  labOrderTrends: ChartDataPoint[];
  prescriptionTrends: ChartDataPoint[];
  topDiagnoses: Array<{ name: string; count: number; percentage: number }>;
  topMedications: Array<{ name: string; count: number }>;
  departmentStats: Array<{ name: string; patients: number; visits: number }>;
}

export function DashboardCharts() {
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics/dashboard'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });

  const stats = useMemo(() => {
    if (!analytics) return null;
    
    const latestPatients = analytics.patientTrends[analytics.patientTrends.length - 1]?.value || 0;
    const previousPatients = analytics.patientTrends[analytics.patientTrends.length - 2]?.value || 0;
    const patientGrowth = previousPatients ? ((latestPatients - previousPatients) / previousPatients) * 100 : 0;

    const latestVisits = analytics.visitTrends[analytics.visitTrends.length - 1]?.value || 0;
    const previousVisits = analytics.visitTrends[analytics.visitTrends.length - 2]?.value || 0;
    const visitGrowth = previousVisits ? ((latestVisits - previousVisits) / previousVisits) * 100 : 0;

    return {
      patientGrowth: patientGrowth.toFixed(1),
      visitGrowth: visitGrowth.toFixed(1),
      totalPatients: latestPatients,
      totalVisits: latestVisits,
    };
  }, [analytics]);

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Failed to load analytics data</p>
              <p className="text-sm text-gray-500">Please try refreshing the page</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !analytics || !stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Patient Growth
            </CardTitle>
            <CardDescription>New patient registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalPatients}</div>
                  <p className="text-sm text-gray-500">Total Patients</p>
                </div>
                <div className="flex items-center gap-1">
                  {parseFloat(stats.patientGrowth) >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    parseFloat(stats.patientGrowth) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.patientGrowth}%
                  </span>
                </div>
              </div>
              <MiniLineChart data={analytics.patientTrends} color="bg-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Visit Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Visit Activity
            </CardTitle>
            <CardDescription>Patient visits and consultations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalVisits}</div>
                  <p className="text-sm text-gray-500">This Period</p>
                </div>
                <div className="flex items-center gap-1">
                  {parseFloat(stats.visitGrowth) >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    parseFloat(stats.visitGrowth) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.visitGrowth}%
                  </span>
                </div>
              </div>
              <MiniLineChart data={analytics.visitTrends} color="bg-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Lab Order Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-purple-600" />
              Laboratory Activity
            </CardTitle>
            <CardDescription>Lab orders and test completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {analytics.labOrderTrends[analytics.labOrderTrends.length - 1]?.value || 0}
                  </div>
                  <p className="text-sm text-gray-500">Recent Orders</p>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Active
                </Badge>
              </div>
              <MiniLineChart data={analytics.labOrderTrends} color="bg-purple-500" />
            </div>
          </CardContent>
        </Card>

        {/* Prescription Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-orange-600" />
              Prescription Activity
            </CardTitle>
            <CardDescription>Medications prescribed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {analytics.prescriptionTrends[analytics.prescriptionTrends.length - 1]?.value || 0}
                  </div>
                  <p className="text-sm text-gray-500">Recent Prescriptions</p>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Active
                </Badge>
              </div>
              <MiniLineChart data={analytics.prescriptionTrends} color="bg-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Diagnoses and Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-600" />
              Top Diagnoses
            </CardTitle>
            <CardDescription>Most common diagnoses this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topDiagnoses.slice(0, 5).map((diagnosis, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{diagnosis.name}</span>
                    <span className="text-gray-500">{diagnosis.count} cases</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${diagnosis.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Medications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-indigo-600" />
              Top Medications
            </CardTitle>
            <CardDescription>Most prescribed medications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topMedications.slice(0, 5).map((medication, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-indigo-600">{index + 1}</span>
                    </div>
                    <span className="font-medium text-sm">{medication.name}</span>
                  </div>
                  <Badge variant="secondary">{medication.count} Rx</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Mini Line Chart Component
function MiniLineChart({ data, color }: { data: ChartDataPoint[]; color: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="relative h-24 w-full flex items-center justify-center">
        <p className="text-sm text-gray-400">No data available</p>
      </div>
    );
  }

  const max = Math.max(...data.map(d => d.value), 1); // Ensure at least 1 to avoid division by zero
  const divisor = data.length > 1 ? data.length - 1 : 1; // Avoid division by zero
  
  const points = data.map((point, index) => {
    const x = (index / divisor) * 100;
    const y = max > 0 ? 100 - (point.value / max) * 100 : 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative h-24 w-full">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.5" />
        
        {/* Area under the line */}
        <polygon
          points={`0,100 ${points} 100,100`}
          className={`${color} opacity-20`}
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          className={`${color.replace('bg-', 'stroke-')}`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / divisor) * 100;
          const y = max > 0 ? 100 - (point.value / max) * 100 : 100;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              className={`${color}`}
              stroke="white"
              strokeWidth="1"
            />
          );
        })}
      </svg>
      
      {/* X-axis labels */}
      <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-xs text-gray-500">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}


