import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, User, Stethoscope, CheckCircle, Play, Pause, Timer, Activity, Users, Calendar, Plus, FileText, Pill, ArrowRight, Eye } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  type: string;
  status: string;
  notes?: string;
  startedAt?: string;
}

export default function ConsultationDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Fetch appointments data
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['/api/appointments'],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  const { data: currentUser } = useQuery({
    queryKey: ['/api/profile'],
  });

  // Update appointment status mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest('PATCH', `/api/appointments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({ title: 'Success', description: 'Appointment updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to update appointment',
        variant: 'destructive'
      });
    },
  });

  const updateAppointmentStatus = (appointmentId: number, status: string, additionalData?: any) => {
    const updateData = { status, ...additionalData };
    if (status === 'in-progress') {
      updateData.startedAt = new Date().toISOString();
    }
    updateAppointmentMutation.mutate({ id: appointmentId, ...updateData });
  };

  // Filter appointments by status
  const scheduledAppointments = appointments.filter((apt: Appointment) => apt.status === 'scheduled');
  const inProgressAppointments = appointments.filter((apt: Appointment) => apt.status === 'in-progress');
  const completedTodayAppointments = appointments.filter((apt: Appointment) => 
    apt.status === 'completed' && 
    new Date(apt.appointmentDate).toDateString() === new Date().toDateString()
  );

  // Calculate consultation duration for in-progress appointments
  const getConsultationDuration = (appointment: Appointment) => {
    if (!appointment.startedAt) return 0;
    return differenceInMinutes(new Date(), new Date(appointment.startedAt));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in-progress': return 'bg-green-100 text-green-800 border-green-300';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-red-50 text-red-700 border-red-200';
      case 'consultation': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'follow-up': return 'bg-green-50 text-green-700 border-green-200';
      case 'procedure': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultation dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consultation Dashboard</h1>
          <p className="text-gray-600">Real-time overview of patient consultations and queue management</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="h-4 w-4" />
          <span>Last updated: {format(new Date(), 'HH:mm:ss')}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Waiting Queue</p>
                <p className="text-2xl font-bold text-blue-900">{scheduledAppointments.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">In Progress</p>
                <p className="text-2xl font-bold text-green-900">{inProgressAppointments.length}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Completed Today</p>
                <p className="text-2xl font-bold text-purple-900">{completedTodayAppointments.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Avg. Duration</p>
                <p className="text-2xl font-bold text-orange-900">
                  {inProgressAppointments.length > 0 
                    ? Math.round(inProgressAppointments.reduce((acc, apt) => acc + getConsultationDuration(apt), 0) / inProgressAppointments.length)
                    : 0
                  }m
                </p>
              </div>
              <Timer className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue">Patient Queue</TabsTrigger>
          <TabsTrigger value="active">Active Consultations</TabsTrigger>
          <TabsTrigger value="completed">Completed Today</TabsTrigger>
        </TabsList>

        {/* Patient Queue */}
        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Waiting Queue ({scheduledAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No patients in queue</p>
                  <p className="text-sm">All scheduled appointments have been started or completed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledAppointments.map((appointment: Appointment, index: number) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {appointment.patientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">{appointment.patientName}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.appointmentTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {appointment.duration}min
                            </span>
                            <Badge className={getTypeColor(appointment.type)} variant="outline">
                              {appointment.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        <Button
                          size="sm"
                          className="text-white bg-green-600 hover:bg-green-700"
                          onClick={() => updateAppointmentStatus(appointment.id, 'in-progress')}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Consultations */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-green-600" />
                Active Consultations ({inProgressAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inProgressAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No active consultations</p>
                  <p className="text-sm">Start a consultation from the patient queue</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inProgressAppointments.map((appointment: Appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-green-100 text-green-600">
                              {appointment.patientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{appointment.patientName}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Dr. {appointment.doctorName}
                            </span>
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              <Timer className="h-3 w-3" />
                              {getConsultationDuration(appointment)}min elapsed
                            </span>
                            <Badge className={getTypeColor(appointment.type)} variant="outline">
                              {appointment.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          In Progress
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/patients/${appointment.patientId}`)}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-yellow-600 hover:bg-yellow-50"
                          onClick={() => updateAppointmentStatus(appointment.id, 'scheduled')}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                        <Button
                          size="sm"
                          className="text-white bg-blue-600 hover:bg-blue-700"
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Today */}
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                Completed Today ({completedTodayAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedTodayAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No completed consultations</p>
                  <p className="text-sm">Completed consultations will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedTodayAppointments.map((appointment: Appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gray-100 text-gray-600">
                            {appointment.patientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">{appointment.patientName}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.appointmentTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Dr. {appointment.doctorName}
                            </span>
                            <Badge className={getTypeColor(appointment.type)} variant="outline">
                              {appointment.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                          Completed
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateAppointmentStatus(appointment.id, 'scheduled')}
                        >
                          Reactivate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}