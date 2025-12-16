import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain, AlertTriangle, Users, Calendar, Search, UserPlus, Plus,
  Activity, TrendingUp, Pill, FileText, Shield, Clock, CheckCircle2,
  XCircle, AlertCircle, ArrowRight, Stethoscope
} from "lucide-react";
import { Link } from "wouter";
import { useRole } from "@/components/role-guard";
import { formatPatientName } from "@/lib/patient-utils";
import { apiRequest } from "@/lib/queryClient";

interface PsychiatryStats {
  totalPatients: number;
  highRiskPatients: number;
  todayAppointments: number;
  pendingAssessments: number;
  averageAdherence: number;
  activeTherapySessions: number;
}

interface HighRiskPatient {
  id: number;
  name: string;
  riskLevel: 'high' | 'medium' | 'low';
  lastAssessment: string;
  nextAppointment: string | null;
  currentMedications: number;
  adherenceRate: number | null;
  lastPHQ9?: number;
  lastGAD7?: number;
}

export default function PsychiatryDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useRole();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch psychiatry-specific stats
  const { data: stats, isLoading: statsLoading } = useQuery<PsychiatryStats>({
    queryKey: ['/api/psychiatry/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch high-risk patients
  const { data: highRiskPatients = [], isLoading: patientsLoading } = useQuery<HighRiskPatient[]>({
    queryKey: ['/api/psychiatry/high-risk-patients'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch today's appointments
  const { data: todayAppointments = [] } = useQuery({
    queryKey: ['/api/psychiatry/today-appointments'],
  });

  // Fetch patients needing follow-up
  const { data: followUpNeeded = [] } = useQuery({
    queryKey: ['/api/psychiatry/follow-up-needed'],
  });

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <Badge className="bg-red-600 text-white">HIGH RISK</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">MEDIUM RISK</Badge>;
      case 'low':
        return <Badge className="bg-green-600 text-white">LOW RISK</Badge>;
      default:
        return <Badge variant="outline">UNKNOWN</Badge>;
    }
  };

  const getSeverityColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 70) return "text-red-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  if (statsLoading || patientsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-blue-50/40">
        <div className="healthcare-header px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded-lg w-64 mb-4"></div>
              <div className="h-4 bg-white/20 rounded-lg w-96"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-blue-50/40">
      {/* Header */}
      <div className="healthcare-header px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Brain className="h-8 w-8" />
                Psychiatry Dashboard
              </h1>
              <p className="text-white/80 text-lg">
                Welcome back, Dr. {user?.username || 'User'} • {user?.organization?.name || 'Healthcare Facility'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                <Input
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
                />
              </div>
              <Button
                onClick={() => setLocation('/patients')}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                New Patient
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Critical Alerts Banner */}
        {highRiskPatients.filter(p => p.riskLevel === 'high').length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-900">
                      {highRiskPatients.filter(p => p.riskLevel === 'high').length} High-Risk Patient(s) Requiring Immediate Attention
                    </h3>
                    <p className="text-sm text-red-700">
                      Review these patients and ensure appropriate safety measures are in place.
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setLocation('/psychiatry/risk-monitor')}
                >
                  View Risk Monitor
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/patients')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Consultation</p>
                  <h3 className="text-2xl font-bold mt-1">Start</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/psychiatry/risk-monitor')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Risk Assessment</p>
                  <h3 className="text-2xl font-bold mt-1">Monitor</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/mental-health')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quick PHQ-9</p>
                  <h3 className="text-2xl font-bold mt-1">Assess</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/patients')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Patient Search</p>
                  <h3 className="text-2xl font-bold mt-1">Find</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
              <p className="text-xs text-muted-foreground">Active psychiatric patients</p>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High-Risk Patients</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.highRiskPatients || 0}</div>
              <p className="text-xs text-muted-foreground">Requiring immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayAppointments || 0}</div>
              <p className="text-xs text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Medication Adherence</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageAdherence?.toFixed(0) || 0}%</div>
              <p className="text-xs text-muted-foreground">Across all patients</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* High-Risk Patients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                High-Risk Patients
              </CardTitle>
              <CardDescription>Patients requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {highRiskPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-600" />
                  <p>No high-risk patients at this time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {highRiskPatients.slice(0, 5).map((patient) => (
                    <div
                      key={patient.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/patients/${patient.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{patient.name}</h4>
                            {getRiskBadge(patient.riskLevel)}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last: {new Date(patient.lastAssessment).toLocaleDateString()}
                            </div>
                            {patient.nextAppointment && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Next: {new Date(patient.nextAppointment).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          {patient.lastPHQ9 !== undefined && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">PHQ-9: </span>
                              <span className={getSeverityColor(patient.lastPHQ9, 27)}>
                                {patient.lastPHQ9}/27
                              </span>
                            </div>
                          )}
                          {patient.adherenceRate !== null && (
                            <div className="mt-1 text-sm">
                              <span className="font-medium">Adherence: </span>
                              <span className={patient.adherenceRate < 80 ? "text-red-600" : "text-green-600"}>
                                {patient.adherenceRate}%
                              </span>
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  {highRiskPatients.length > 5 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation('/psychiatry/risk-monitor')}
                    >
                      View All ({highRiskPatients.length})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Appointments
              </CardTitle>
              <CardDescription>Scheduled consultations for today</CardDescription>
            </CardHeader>
            <CardContent>
              {todayAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2" />
                  <p>No appointments scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAppointments.slice(0, 5).map((appointment: any) => (
                    <div
                      key={appointment.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/patients/${appointment.patientId}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">
                            {appointment.patientName || `Patient #${appointment.patientId}`}
                          </h4>
                          <div className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.time || 'Time TBD'}
                            </div>
                            {appointment.type && (
                              <div className="mt-1">
                                Type: {appointment.type}
                              </div>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  {todayAppointments.length > 5 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation('/appointments')}
                    >
                      View All ({todayAppointments.length})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Follow-up Needed */}
        {followUpNeeded.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Follow-up Needed
              </CardTitle>
              <CardDescription>Patients requiring follow-up this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {followUpNeeded.slice(0, 5).map((patient: any) => (
                  <div
                    key={patient.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setLocation(`/patients/${patient.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{patient.name || `Patient #${patient.id}`}</h4>
                        <div className="text-sm text-muted-foreground">
                          Last visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
                          {patient.reason && (
                            <div className="mt-1">Reason: {patient.reason}</div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

