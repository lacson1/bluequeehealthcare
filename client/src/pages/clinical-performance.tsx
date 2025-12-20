import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import {
  Activity,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Heart,
  Stethoscope,
  Pill,
  FlaskRound,
  AlertCircle,
  CheckCircle,
  Target,
  Download,
  Filter
} from "lucide-react";

interface ClinicalMetrics {
  totalVisits: number;
  avgVisitDuration: number;
  patientSatisfaction: number;
  treatmentSuccess: number;
  followUpCompliance: number;
  diagnosisAccuracy: number;
}

interface PerformanceData {
  period: string;
  visits: number;
  successRate: number;
  avgDuration: number;
  satisfaction: number;
}

interface DiagnosisMetrics {
  condition: string;
  count: number;
  successRate: number;
  avgTreatmentDays: number;
  color: string;
}

interface StaffPerformance {
  staffId: number;
  name: string;
  role: string;
  visits: number;
  satisfaction: number;
  efficiency: number;
  specialization: string;
}

export default function ClinicalPerformance() {
  const [timeRange, setTimeRange] = useState("30");
  const [selectedMetric, setSelectedMetric] = useState("visits");
  
  // Fetch live clinical data from API endpoints
  const { data: clinicalMetrics, isLoading: metricsLoading } = useQuery<ClinicalMetrics>({
    queryKey: ["/api/clinical/metrics", { timeRange }],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery<PerformanceData[]>({
    queryKey: ["/api/clinical/performance", { timeRange }],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: diagnosisMetrics, isLoading: diagnosisLoading } = useQuery<DiagnosisMetrics[]>({
    queryKey: ["/api/clinical/diagnosis-metrics", { timeRange }],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: staffPerformance, isLoading: staffLoading } = useQuery<StaffPerformance[]>({
    queryKey: ["/api/clinical/staff-performance", { timeRange }],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Use live data with proper loading states and error handling
  const metrics = clinicalMetrics || {
    totalVisits: 0,
    avgVisitDuration: 0,
    patientSatisfaction: 0,
    treatmentSuccess: 0,
    followUpCompliance: 0,
    diagnosisAccuracy: 0
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value >= threshold) return "text-green-600";
    if (value >= threshold * 0.8) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceBadge = (value: number, threshold: number) => {
    if (value >= threshold) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (value >= threshold * 0.8) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>;
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Clinical Performance</h2>
            <p className="text-sm text-slate-500">Monitor treatment outcomes and staff efficiency</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance Trends</TabsTrigger>
            <TabsTrigger value="diagnosis">Diagnosis Analysis</TabsTrigger>
            <TabsTrigger value="staff">Staff Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total Visits</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">
                        {metricsLoading ? "..." : metrics.totalVisits}
                      </p>
                      <p className="text-sm text-secondary mt-1">
                        <TrendingUp className="inline w-3 h-3" /> +15% from last period
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Stethoscope className="text-blue-600 h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Avg Visit Duration</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">
                        {metricsLoading ? "..." : `${metrics.avgVisitDuration} min`}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        <TrendingUp className="inline w-3 h-3" /> -2 min improvement
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Clock className="text-green-600 h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Treatment Success</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">
                        {metricsLoading ? "..." : `${metrics.treatmentSuccess}%`}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        <CheckCircle className="inline w-3 h-3" /> Above target
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Heart className="text-green-600 h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Patient Satisfaction</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">
                        {metricsLoading ? "..." : `${metrics.patientSatisfaction}/5.0`}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        <TrendingUp className="inline w-3 h-3" /> +0.2 from last month
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Users className="text-yellow-600 h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Follow-up Compliance</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">
                        {metricsLoading ? "..." : `${metrics.followUpCompliance}%`}
                      </p>
                      <p className="text-sm text-yellow-600 mt-1">
                        <AlertCircle className="inline w-3 h-3" /> Needs improvement
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Calendar className="text-orange-600 h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Diagnosis Accuracy</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">
                        {metricsLoading ? "..." : `${metrics.diagnosisAccuracy}%`}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        <Target className="inline w-3 h-3" /> Excellent performance
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Activity className="text-purple-600 h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Performance Trends
                </CardTitle>
                <CardDescription>Weekly performance metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : performanceData && performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="visits" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="successRate" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-500">
                    No performance data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnosis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FlaskRound className="h-5 w-5 mr-2" />
                    Most Common Conditions
                  </CardTitle>
                  <CardDescription>Distribution of diagnoses in your clinic</CardDescription>
                </CardHeader>
                <CardContent>
                  {diagnosisLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : diagnosisMetrics && diagnosisMetrics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={diagnosisMetrics}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ condition, count }) => `${condition}: ${count}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {diagnosisMetrics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-slate-500">
                      No diagnosis data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Treatment Success by Condition
                  </CardTitle>
                  <CardDescription>Success rates and treatment duration</CardDescription>
                </CardHeader>
                <CardContent>
                  {diagnosisLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : diagnosisMetrics && diagnosisMetrics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={diagnosisMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="condition" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="successRate" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-slate-500">
                      No treatment success data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Staff Performance Overview
                </CardTitle>
                <CardDescription>Individual performance metrics for healthcare providers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-slate-200 rounded-lg"></div>
                      </div>
                    ))
                  ) : staffPerformance && staffPerformance.length > 0 ? staffPerformance.map((member) => (
                    <Card key={member.staffId} className="border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-800">{member.name}</h4>
                            <p className="text-sm text-slate-500">{member.role}</p>
                          </div>
                          <Badge variant="outline">{member.specialization}</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Visits</span>
                            <span className="font-medium">{member.visits}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Satisfaction</span>
                            <span className={`font-medium ${getPerformanceColor(member.satisfaction, 4.5)}`}>
                              {member.satisfaction}/5.0
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Efficiency</span>
                            <span className={`font-medium ${getPerformanceColor(member.efficiency, 85)}`}>
                              {member.efficiency}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          {getPerformanceBadge(member.efficiency, 85)}
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="col-span-full text-center py-8 text-slate-500">
                      No staff performance data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}