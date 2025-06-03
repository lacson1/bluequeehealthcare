import { useQuery } from "@tanstack/react-query";
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
  Download
} from "lucide-react";
import { Link } from "wouter";
import { format, isToday, isYesterday, startOfDay, endOfDay } from "date-fns";
import type { Appointment, Prescription } from "@shared/schema";

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
  // Fetch today's appointments
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<ExtendedAppointment[]>({
    queryKey: ["/api/appointments"],
  });

  // Fetch recent prescriptions
  const { data: prescriptions = [], isLoading: prescriptionsLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
  });

  // Fetch recent lab orders
  const { data: labOrders = [], isLoading: labOrdersLoading } = useQuery<LabOrderData[]>({
    queryKey: ["/api/lab-orders"],
  });

  // Filter data for different time periods
  const todayAppointments = appointments.filter((apt: ExtendedAppointment) => 
    isToday(new Date(apt.appointmentDate))
  );

  const completedToday = todayAppointments.filter((apt: ExtendedAppointment) => apt.status === 'completed');
  const pendingToday = todayAppointments.filter((apt: ExtendedAppointment) => apt.status === 'scheduled');
  const inProgressToday = todayAppointments.filter((apt: ExtendedAppointment) => apt.status === 'in-progress');

  const recentPrescriptions = prescriptions.slice(0, 5);
  const pendingLabOrders = labOrders.filter((order: LabOrderData) => order.status === 'pending').slice(0, 5);

  // Calculate statistics
  const todayStats = {
    totalPatients: todayAppointments.length,
    completed: completedToday.length,
    pending: pendingToday.length,
    inProgress: inProgressToday.length,
    completionRate: todayAppointments.length > 0 ? Math.round((completedToday.length / todayAppointments.length) * 100) : 0
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

  if (appointmentsLoading || prescriptionsLoading || labOrdersLoading) {
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Clinical Activity Center</h1>
            <p className="text-sm text-slate-500">Monitor daily operations and clinical performance</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
              <Activity className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Today's Patients</p>
                  <p className="text-2xl font-bold text-slate-900">{todayStats.totalPatients}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{todayStats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">In Progress</p>
                  <p className="text-2xl font-bold text-orange-600">{todayStats.inProgress}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{todayStats.completionRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Today's Activity</TabsTrigger>
            <TabsTrigger value="prescriptions">Recent Prescriptions</TabsTrigger>
            <TabsTrigger value="lab-orders">Pending Lab Orders</TabsTrigger>
            <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
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
                          <Link href={`/patients/${appointment.patientId}`}>
                            <Button variant="ghost" size="sm">
                              <ArrowRight className="w-4 h-4" />
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
                          <p className="text-sm text-slate-600">Patient ID: {prescription.patientId}</p>
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
                          <p className="text-sm text-slate-600">Patient ID: {order.patientId}</p>
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

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/consultation-dashboard">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1">
                  <Activity className="w-5 h-5" />
                  <span className="text-xs">Start Consultation</span>
                </Button>
              </Link>
              
              <Link href="/patients">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1">
                  <Users className="w-5 h-5" />
                  <span className="text-xs">View Patients</span>
                </Button>
              </Link>
              
              <Link href="/lab-orders">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1">
                  <TestTube className="w-5 h-5" />
                  <span className="text-xs">Lab Orders</span>
                </Button>
              </Link>
              
              <Link href="/analytics">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-1">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-xs">Analytics</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
