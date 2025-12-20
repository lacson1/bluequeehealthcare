import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, User, Stethoscope, CheckCircle, Play, Pause, Timer, Activity, Users, Calendar, Plus, FileText, Pill, ArrowRight, Eye } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import { formatTime } from '@/lib/date-utils';

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
    refetchInterval: 5 * 60 * 1000, // 5 minutes - reduced frequency
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['/api/profile'],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (user profile rarely changes)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Update appointment status mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/appointments/${id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({ 
        title: t('toast.success'), 
        description: t('consultation.appointmentUpdated') 
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.error'),
        description: error?.response?.data?.error || t('consultation.appointmentUpdateFailed'),
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
  const scheduledAppointments = (appointments as Appointment[]).filter((apt: Appointment) => apt.status === 'scheduled');
  const inProgressAppointments = (appointments as Appointment[]).filter((apt: Appointment) => apt.status === 'in-progress');
  const completedTodayAppointments = (appointments as Appointment[]).filter((apt: Appointment) => 
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return t('consultation.status.scheduled');
      case 'in-progress': return t('consultation.status.inProgress');
      case 'completed': return t('consultation.status.completed');
      case 'cancelled': return t('consultation.status.cancelled');
      default: return status;
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'emergency': return t('consultation.type.emergency');
      case 'consultation': return t('consultation.type.consultation');
      case 'follow-up': return t('consultation.type.followUp');
      case 'procedure': return t('consultation.type.procedure');
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-600">{t('consultation.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('consultation.title')}</h1>
          <p className="text-gray-600">{t('consultation.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500" aria-live="polite">
          <Activity className="h-4 w-4" aria-hidden="true" />
          <span>{t('consultation.lastUpdated')}: {formatTime(new Date())}</span>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" role="region" aria-label={t('consultation.title')}>
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">{t('consultation.waitingQueue')}</p>
                <p className="text-2xl font-bold text-blue-900" aria-live="polite">{scheduledAppointments.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">{t('consultation.inProgress')}</p>
                <p className="text-2xl font-bold text-green-900" aria-live="polite">{inProgressAppointments.length}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-green-600" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">{t('consultation.completedToday')}</p>
                <p className="text-2xl font-bold text-purple-900" aria-live="polite">{completedTodayAppointments.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">{t('consultation.avgDuration')}</p>
                <p className="text-2xl font-bold text-orange-900" aria-live="polite">
                  {inProgressAppointments.length > 0 
                    ? Math.round(inProgressAppointments.reduce((acc, apt) => acc + getConsultationDuration(apt), 0) / inProgressAppointments.length)
                    : 0
                  }{t('consultation.minutes')}
                </p>
              </div>
              <Timer className="h-8 w-8 text-orange-600" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3" role="tablist">
          <TabsTrigger value="queue" role="tab">{t('consultation.patientQueue')}</TabsTrigger>
          <TabsTrigger value="active" role="tab">{t('consultation.activeConsultations')}</TabsTrigger>
          <TabsTrigger value="completed" role="tab">{t('consultation.completedTodayTab')}</TabsTrigger>
        </TabsList>

        {/* Patient Queue */}
        <TabsContent value="queue" role="tabpanel">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" aria-hidden="true" />
                {t('consultation.waitingQueue')} ({scheduledAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-500" role="status">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
                  <p className="text-lg font-medium">{t('consultation.noPatientsInQueue')}</p>
                  <p className="text-sm">{t('consultation.noPatientsInQueueDesc')}</p>
                </div>
              ) : (
                <div className="space-y-3" role="list">
                  {scheduledAppointments.map((appointment: Appointment, index: number) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors" role="listitem">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm" aria-label={`Position ${index + 1} in queue`}>
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600" aria-label={appointment.patientName}>
                            {appointment.patientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">{appointment.patientName}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {appointment.appointmentTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3" aria-hidden="true" />
                              {appointment.duration}{t('consultation.minutes')}
                            </span>
                            <Badge className={getTypeColor(appointment.type)} variant="outline" aria-label={t('consultation.type.consultation')}>
                              {getTypeLabel(appointment.type)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(appointment.status)} aria-label={getStatusLabel(appointment.status)}>
                          {getStatusLabel(appointment.status)}
                        </Badge>
                        <Button
                          size="sm"
                          className="text-white bg-green-600 hover:bg-green-700"
                          onClick={() => updateAppointmentStatus(appointment.id, 'in-progress')}
                          aria-label={`${t('consultation.start')} consultation for ${appointment.patientName}`}
                        >
                          <Play className="h-4 w-4 mr-1" aria-hidden="true" />
                          {t('consultation.start')}
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
        <TabsContent value="active" role="tabpanel">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-green-600" aria-hidden="true" />
                {t('consultation.activeConsultations')} ({inProgressAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inProgressAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-500" role="status">
                  <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
                  <p className="text-lg font-medium">{t('consultation.noActiveConsultations')}</p>
                  <p className="text-sm">{t('consultation.noActiveConsultationsDesc')}</p>
                </div>
              ) : (
                <div className="space-y-3" role="list">
                  {inProgressAppointments.map((appointment: Appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200" role="listitem">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-green-100 text-green-600" aria-label={appointment.patientName}>
                              {appointment.patientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" aria-label="Active consultation indicator" role="status"></div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{appointment.patientName}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" aria-hidden="true" />
                              Dr. {appointment.doctorName}
                            </span>
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              <Timer className="h-3 w-3" aria-hidden="true" />
                              {getConsultationDuration(appointment)}{t('consultation.minutes')} {t('consultation.elapsed')}
                            </span>
                            <Badge className={getTypeColor(appointment.type)} variant="outline" aria-label={t('consultation.type.consultation')}>
                              {getTypeLabel(appointment.type)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 border-green-300" aria-label={t('consultation.status.inProgress')}>
                          {t('consultation.status.inProgress')}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/patients/${appointment.patientId}`)}
                          className="text-blue-600 hover:bg-blue-50"
                          aria-label={`${t('consultation.view')} ${appointment.patientName}`}
                        >
                          <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                          {t('consultation.view')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-yellow-600 hover:bg-yellow-50"
                          onClick={() => updateAppointmentStatus(appointment.id, 'scheduled')}
                          aria-label={`${t('consultation.pause')} consultation for ${appointment.patientName}`}
                        >
                          <Pause className="h-4 w-4 mr-1" aria-hidden="true" />
                          {t('consultation.pause')}
                        </Button>
                        <Button
                          size="sm"
                          className="text-white bg-blue-600 hover:bg-blue-700"
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          aria-label={`${t('consultation.complete')} consultation for ${appointment.patientName}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                          {t('consultation.complete')}
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
        <TabsContent value="completed" role="tabpanel">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-purple-600" aria-hidden="true" />
                {t('consultation.completedTodayTab')} ({completedTodayAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedTodayAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-500" role="status">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
                  <p className="text-lg font-medium">{t('consultation.noCompletedConsultations')}</p>
                  <p className="text-sm">{t('consultation.noCompletedConsultationsDesc')}</p>
                </div>
              ) : (
                <div className="space-y-3" role="list">
                  {completedTodayAppointments.map((appointment: Appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50" role="listitem">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gray-100 text-gray-600" aria-label={appointment.patientName}>
                            {appointment.patientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">{appointment.patientName}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {appointment.appointmentTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" aria-hidden="true" />
                              Dr. {appointment.doctorName}
                            </span>
                            <Badge className={getTypeColor(appointment.type)} variant="outline" aria-label={t('consultation.type.consultation')}>
                              {getTypeLabel(appointment.type)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-800 border-gray-300" aria-label={t('consultation.status.completed')}>
                          {t('consultation.status.completed')}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateAppointmentStatus(appointment.id, 'scheduled')}
                          aria-label={`${t('consultation.reactivate')} consultation for ${appointment.patientName}`}
                        >
                          {t('consultation.reactivate')}
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