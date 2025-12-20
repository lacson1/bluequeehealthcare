import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Clock, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  FileText, 
  Pill, 
  TestTube,
  ArrowRight,
  Eye,
  Download,
  Play,
  User,
  Shield,
  UserPlus,
  Building2,
  Settings,
  Check,
  X,
  Search
} from "lucide-react";
import { Link } from "wouter";
import { format, isToday, isYesterday, startOfDay, endOfDay, parseISO } from "date-fns";
import type { Appointment, Prescription } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useRole } from "@/components/role-guard";

interface ExtendedAppointment extends Appointment {
  patientName?: string;
  appointmentType?: string;
}

interface LabOrderData {
  id: number;
  patientId: number;
  status: string;
  createdAt: string;
}

export default function ClinicalActivityCenter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useRole();
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'super_admin';

  // Fetch integrated clinical activity dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/clinical-activity/dashboard"],
    refetchInterval: 5 * 60 * 1000, // 5 minutes - reduced frequency
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Extract data from integrated response
  const appointments = dashboardData?.appointments?.today || [];
  const completedToday = dashboardData?.appointments?.completed || [];
  const pendingToday = dashboardData?.appointments?.pending || [];
  const inProgressToday = dashboardData?.appointments?.inProgress || [];
  const recentPrescriptions = dashboardData?.prescriptions || [];
  const pendingLabOrders = dashboardData?.labOrders || [];
  const todayStats = dashboardData?.metrics || {
    totalPatients: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    completionRate: 0,
    prescriptionsToday: 0,
    pendingLabOrders: 0
  };

  // Quick action handlers
  const handleStartConsultation = async (appointmentId: number) => {
    try {
      await apiRequest(`/api/appointments/${appointmentId}/start-consultation`, 'POST');
      
      toast({
        title: "Consultation Started",
        description: "The appointment has been updated to in-progress status.",
      });
      
      // Refresh the dashboard data
      queryClient.invalidateQueries({ queryKey: ["/api/clinical-activity/dashboard"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start consultation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteConsultation = async (appointmentId: number, notes?: string) => {
    try {
      await apiRequest(`/api/appointments/${appointmentId}/complete-consultation`, 'POST', { notes, followUpRequired: false });
      
      toast({
        title: "Consultation Completed",
        description: "The appointment has been marked as completed.",
      });
      
      // Refresh the dashboard data
      queryClient.invalidateQueries({ queryKey: ["/api/clinical-activity/dashboard"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete consultation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM dd, yyyy');
  };

  const formatTime = (date: string | Date) => {
    return format(new Date(date), 'h:mm a');
  };

  if (dashboardLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading clinical activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Workflow</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Monitor daily operations and clinical performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5">
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              Live
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Today's Patients</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{todayStats.totalPatients}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{todayStats.completed}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">In Progress</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{todayStats.inProgress}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Completion Rate</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{todayStats.completionRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-sm h-auto`}>
            <TabsTrigger 
              value="today" 
              className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition-all duration-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/50 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm py-2.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Today's Activity</span>
              <span className="sm:hidden">Today</span>
            </TabsTrigger>
            <TabsTrigger 
              value="prescriptions" 
              className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition-all duration-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-950/50 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm py-2.5"
            >
              <Pill className="w-4 h-4" />
              <span className="hidden sm:inline">Prescriptions</span>
              <span className="sm:hidden">Rx</span>
            </TabsTrigger>
            <TabsTrigger 
              value="lab-orders" 
              className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition-all duration-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 data-[state=active]:bg-amber-50 dark:data-[state=active]:bg-amber-950/50 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400 data-[state=active]:shadow-sm py-2.5"
            >
              <TestTube className="w-4 h-4" />
              <span className="hidden sm:inline">Lab Orders</span>
              <span className="sm:hidden">Labs</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger 
                value="admin-tasks" 
                className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition-all duration-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 data-[state=active]:bg-purple-50 dark:data-[state=active]:bg-purple-950/50 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400 data-[state=active]:shadow-sm py-2.5"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Tasks</span>
                <span className="sm:hidden">Admin</span>
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="follow-ups" 
              className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition-all duration-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 data-[state=active]:bg-slate-50 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm py-2.5"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Follow-ups</span>
              <span className="sm:hidden">Follow</span>
            </TabsTrigger>
          </TabsList>

          {/* Today's Activity */}
          <TabsContent value="today" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Completed Consultations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Completed Today ({completedToday.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {completedToday.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">No completed consultations yet</p>
                  ) : (
                    completedToday.map((appointment: ExtendedAppointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{appointment.patientName || `Patient #${appointment.patientId}`}</p>
                          <p className="text-sm text-slate-600">{formatTime(appointment.appointmentDate)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {appointment.type || 'Consultation'}
                          </Badge>
                          <Link href={`/patients/${appointment.patientId}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Pending/In Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-700">
                    <Clock className="w-5 h-5 mr-2" />
                    Current Activity ({pendingToday.length + inProgressToday.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...inProgressToday, ...pendingToday].length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">No pending appointments</p>
                  ) : (
                    [...inProgressToday, ...pendingToday].map((appointment: ExtendedAppointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{appointment.patientName || `Patient #${appointment.patientId}`}</p>
                          <p className="text-sm text-slate-600">{formatTime(appointment.appointmentDate)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={appointment.status === 'in-progress' ? 'default' : 'secondary'}
                            className={appointment.status === 'in-progress' ? 'bg-orange-100 text-orange-800' : ''}
                          >
                            {appointment.status === 'in-progress' ? 'Active' : 'Waiting'}
                          </Badge>
                          {appointment.status === 'scheduled' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStartConsultation(appointment.id)}
                              className="text-blue-700 border-blue-200 hover:bg-blue-50"
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </Button>
                          )}
                          {appointment.status === 'in-progress' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCompleteConsultation(appointment.id)}
                              className="text-green-700 border-green-200 hover:bg-green-50"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                          )}
                          <Link href={`/patients/${appointment.patientId}`}>
                            <Button variant="ghost" size="sm">
                              <User className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recent Prescriptions */}
          <TabsContent value="prescriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Pill className="w-5 h-5 mr-2" />
                  Recent Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPrescriptions.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">No recent prescriptions</p>
                  ) : (
                    recentPrescriptions.map((prescription: Prescription) => (
                      <div key={prescription.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{prescription.medicationName || 'Medication'}</p>
                          <p className="text-sm text-slate-600">{(prescription as any).patientName || `Patient #${prescription.patientId}`}</p>
                          <p className="text-xs text-slate-500">{prescription.dosage} - {prescription.frequency}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={prescription.status === 'active' ? 'default' : 'secondary'}
                            className={prescription.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {prescription.status}
                          </Badge>
                          <p className="text-xs text-slate-500">{formatDate(prescription.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Lab Orders */}
          <TabsContent value="lab-orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TestTube className="w-5 h-5 mr-2" />
                  Pending Lab Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingLabOrders.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">No pending lab orders</p>
                  ) : (
                    pendingLabOrders.map((order: LabOrderData) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">Lab Order #{order.id}</p>
                          <p className="text-sm text-slate-600">{(order as any).patientName || `Patient #${order.patientId}`}</p>
                          <p className="text-xs text-slate-500">Ordered: {formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-orange-700 border-orange-200">
                            {order.status}
                          </Badge>
                          <Link href={`/lab-orders`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tasks Tab */}
          {isAdmin && (
            <TabsContent value="admin-tasks" className="space-y-4">
              <AdminWorkflowSection />
            </TabsContent>
          )}

          {/* Follow-ups */}
          <TabsContent value="follow-ups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Follow-up Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="mx-auto w-12 h-12 text-slate-400" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">Follow-up System</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    This section will track patients requiring follow-up appointments and callback reminders.
                  </p>
                  <Button variant="outline" className="mt-4">
                    Configure Follow-ups
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Workflow Integration Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Consultation Workflow */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <Activity className="w-5 h-5 mr-2" />
                Consultation Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/consultation-dashboard">
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1 hover:bg-blue-50">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span className="text-xs">Start Consultation</span>
                  </Button>
                </Link>
                
                <Link href="/appointments">
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1 hover:bg-green-50">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="text-xs">Appointments</span>
                  </Button>
                </Link>
                
                <Link href="/patients">
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1 hover:bg-purple-50">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="text-xs">Patient Records</span>
                  </Button>
                </Link>
                
                <Link href="/referrals">
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1 hover:bg-orange-50">
                    <ArrowRight className="w-5 h-5 text-orange-600" />
                    <span className="text-xs">Referrals</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <TestTube className="w-5 h-5 mr-2" />
                Clinical Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/lab-orders">
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1 hover:bg-blue-50">
                    <TestTube className="w-5 h-5 text-blue-600" />
                    <span className="text-xs">Lab Orders</span>
                  </Button>
                </Link>
                
                <Link href="/pharmacy">
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1 hover:bg-green-50">
                    <Pill className="w-5 h-5 text-green-600" />
                    <span className="text-xs">Pharmacy</span>
                  </Button>
                </Link>
                
                <Link href="/documents">
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1 hover:bg-purple-50">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="text-xs">Documents</span>
                  </Button>
                </Link>
                
                <Link href="/analytics">
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1 hover:bg-orange-50">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    <span className="text-xs">Analytics</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Workflow Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Today's Workflow Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{todayStats.totalPatients}</p>
                <p className="text-sm text-blue-700">Total Patients Scheduled</p>
                <Link href="/appointments">
                  <Button variant="ghost" size="sm" className="mt-2 text-blue-600 hover:bg-blue-100">
                    View Schedule
                  </Button>
                </Link>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{recentPrescriptions.length}</p>
                <p className="text-sm text-green-700">Prescriptions Today</p>
                <Link href="/pharmacy">
                  <Button variant="ghost" size="sm" className="mt-2 text-green-600 hover:bg-green-100">
                    View Pharmacy
                  </Button>
                </Link>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{pendingLabOrders.length}</p>
                <p className="text-sm text-orange-700">Pending Lab Orders</p>
                <Link href="/lab-orders">
                  <Button variant="ghost" size="sm" className="mt-2 text-orange-600 hover:bg-orange-100">
                    Process Orders
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Admin Workflow Section Component - Full featured
function AdminWorkflowSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("pending");

  // Fetch workflow stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/workflow/stats'],
    refetchInterval: 30000,
    enabled: true,
  });

  // Fetch pending tasks with filters
  const { data: tasks = [], isLoading: tasksLoading, refetch } = useQuery({
    queryKey: ['/api/admin/workflow/tasks', { type: filterType, priority: filterPriority, status: filterStatus }],
    refetchInterval: 30000,
    enabled: true,
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
      case 'system_config':
        return <Settings className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
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

  const urgentTasks = tasks.filter((t: any) => t.priority === 'urgent' && t.status === 'pending');

  // Filter tasks based on search query and filters
  const filteredTasks = tasks.filter((task: any) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.type?.toLowerCase().includes(query) ||
        task.createdBy?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filterType !== 'all' && task.type !== filterType) {
      return false;
    }

    // Priority filter
    if (filterPriority !== 'all' && task.priority !== filterPriority) {
      return false;
    }

    // Status filter
    if (filterStatus !== 'all' && task.status !== filterStatus) {
      return false;
    }

    return true;
  });

  return (
    <>
      {/* Admin Stats Cards */}
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
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Urgent Tasks</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {urgentTasks.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
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
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Admin Workflow Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-sm"
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
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-sm"
            >
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Status</option>
            </select>
          </div>

          {/* Tasks List */}
          {tasksLoading ? (
            <div className="text-center py-12">Loading admin tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tasks Found</h3>
              <p className="text-slate-500">
                {searchQuery || filterType !== 'all' || filterPriority !== 'all' || filterStatus !== 'pending'
                  ? "Try adjusting your filters"
                  : "All administrative tasks are up to date!"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow"
                >
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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{task.title}</h3>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline">{getTypeLabel(task.type)}</Badge>
                        {task.status !== 'pending' && (
                          <Badge variant={task.status === 'approved' ? 'default' : 'destructive'}>
                            {task.status === 'approved' ? 'Approved' : task.status === 'rejected' ? 'Rejected' : 'In Review'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{task.description}</p>
                      <div className="text-xs text-slate-500">
                        Created {format(parseISO(task.createdAt), 'MMM d, yyyy HH:mm')}
                        {task.createdBy && ` • by ${task.createdBy}`}
                      </div>
                    </div>
                  </div>
                  {task.status === 'pending' && (
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
