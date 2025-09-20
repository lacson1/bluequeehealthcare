import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
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
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export function StableCalendar() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { toast } = useToast();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['/api/appointments']
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Success",
        description: "Appointment status updated successfully"
      });
    }
  });

  const weekStart = startOfWeek(currentWeek);
  const weekEnd = endOfWeek(currentWeek);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt: Appointment) => {
      if (!apt.appointmentDate) return false;
      try {
        return isSameDay(parseISO(apt.appointmentDate), date);
      } catch {
        return false;
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-4 border-red-500';
      case 'high': return 'border-l-4 border-orange-500';
      case 'medium': return 'border-l-4 border-yellow-500';
      case 'low': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading appointments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Appointment Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weekDays.map((day) => {
              const dayAppointments = getAppointmentsForDay(day);
              
              return (
                <div key={day.toISOString()} className="border rounded-lg p-4">
                  <div className="font-medium text-lg mb-3">
                    {format(day, 'EEEE, MMM dd')}
                  </div>
                  
                  {dayAppointments.length === 0 ? (
                    <div className="text-gray-500 text-sm">No appointments scheduled</div>
                  ) : (
                    <div className="space-y-2">
                      {dayAppointments.map((appointment: Appointment) => (
                        <div
                          key={appointment.id}
                          className={`p-3 rounded border ${getPriorityColor(appointment.priority)} bg-white`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-sm font-medium">
                                {appointment.appointmentTime}
                              </div>
                              <div>
                                <div className="font-medium">{appointment.patientName}</div>
                                <div className="text-sm text-gray-600">{appointment.doctorName}</div>
                              </div>
                              <Badge className={`${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </Badge>
                            </div>
                            
                            <div className="flex gap-2">
                              {appointment.status === 'scheduled' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatusMutation.mutate({
                                    id: appointment.id,
                                    status: 'confirmed'
                                  })}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  Confirm
                                </Button>
                              )}
                              {appointment.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatusMutation.mutate({
                                    id: appointment.id,
                                    status: 'in-progress'
                                  })}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  Start
                                </Button>
                              )}
                              {appointment.status === 'in-progress' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatusMutation.mutate({
                                    id: appointment.id,
                                    status: 'completed'
                                  })}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm font-medium">Today's Total</div>
                <div className="text-2xl font-bold">
                  {appointments.filter((apt: Appointment) => {
                    try {
                      return apt.appointmentDate && isSameDay(parseISO(apt.appointmentDate), new Date());
                    } catch {
                      return false;
                    }
                  }).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm font-medium">Confirmed</div>
                <div className="text-2xl font-bold">
                  {appointments.filter((apt: Appointment) => apt.status === 'confirmed').length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-sm font-medium">In Progress</div>
                <div className="text-2xl font-bold">
                  {appointments.filter((apt: Appointment) => apt.status === 'in-progress').length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-sm font-medium">Urgent</div>
                <div className="text-2xl font-bold">
                  {appointments.filter((apt: Appointment) => apt.priority === 'urgent').length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}