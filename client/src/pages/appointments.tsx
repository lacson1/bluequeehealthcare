import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Clock, Plus, Search, User, Stethoscope, Filter, Grid3X3, List, CheckCircle, XCircle, Calendar as CalendarView } from 'lucide-react';
import { format, isSameDay, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { StableCalendar } from '@/components/stable-calendar';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface HealthcareStaff {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

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
  priority?: string;
}

export default function AppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [appointmentType, setAppointmentType] = useState('');
  const [duration, setDuration] = useState('30');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // New state for enhanced features
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [editingAppointment, setEditingAppointment] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Get URL params for pre-filled patient
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledPatientId = urlParams.get('patientId');

  // Fetch appointments
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['/api/appointments'],
  });

  // Fetch patients for selection
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
  });

  // Fetch healthcare staff for selection  
  const { data: healthcareStaff = [] } = useQuery({
    queryKey: ['/api/users/healthcare-staff'],
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/appointments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({ title: 'Success', description: 'Appointment scheduled successfully' });
      resetForm();
      setIsCreating(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to schedule appointment',
        variant: 'destructive'
      });
    },
  });

  // Update appointment mutation
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

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTime('');
    setSelectedPatient(null);
    setSelectedStaff(null);
    setAppointmentType('');
    setDuration('30');
    setNotes('');
  };

  const handleCreateAppointment = () => {
    if (!selectedDate || !selectedTime || !selectedPatient || !selectedStaff || !appointmentType) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    // Format date as YYYY-MM-DD for the backend
    const appointmentDate = selectedDate.toISOString().split('T')[0];

    createAppointmentMutation.mutate({
      patientId: selectedPatient,
      doctorId: selectedStaff,
      appointmentDate: appointmentDate,
      appointmentTime: selectedTime,
      duration: parseInt(duration),
      type: appointmentType,
      status: 'scheduled',
      priority: 'medium',
      notes: notes || undefined
    });
  };

  const updateAppointmentStatus = (appointmentId: number, status: string) => {
    updateAppointmentMutation.mutate({ id: appointmentId, status });
  };

  // Enhanced filtering logic
  const filteredAppointments = appointments.filter((appointment: Appointment) => {
    const matchesSearch = !searchTerm || (
      appointment.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesProvider = providerFilter === 'all' || appointment.doctorId.toString() === providerFilter;
    
    return matchesSearch && matchesStatus && matchesProvider;
  });

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'no-show': return 'outline';
      default: return 'default';
    }
  };

  // Group appointments by date for calendar view
  const appointmentsByDate = filteredAppointments.reduce((acc: any, appointment: Appointment) => {
    const date = appointment.appointmentDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(appointment);
    return acc;
  }, {});

  // Get week dates for calendar view
  const getWeekDates = (startDate: Date) => {
    const start = startOfWeek(startDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Pre-fill patient if coming from patient profile
  React.useEffect(() => {
    if (prefilledPatientId) {
      setSelectedPatient(parseInt(prefilledPatientId));
      setIsCreating(true);
    }
  }, [prefilledPatientId]);

  // Time slots for appointment scheduling
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Schedule and manage patient appointments</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Schedule Appointment
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>

              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {(healthcareStaff as HealthcareStaff[]).map((staff) => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>
                      {staff.firstName || staff.username} {staff.lastName || ''} ({staff.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="rounded-l-none"
                >
                  <CalendarView className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Appointment Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule New Appointment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient *</Label>
                <Select value={selectedPatient?.toString() || ''} onValueChange={(value) => setSelectedPatient(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient: Patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff">Healthcare Provider *</Label>
                <Select value={selectedStaff?.toString() || ''} onValueChange={(value) => setSelectedStaff(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select healthcare provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {healthcareStaff.map((staff: HealthcareStaff) => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        {staff.role === 'doctor' ? 'Dr.' : ''} {staff.firstName || staff.username} {staff.lastName || ''} ({staff.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className="rounded-md border bg-white dark:bg-gray-800"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Appointment Type *</Label>
                <Select value={appointmentType} onValueChange={setAppointmentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">General Consultation</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                    <SelectItem value="check-up">Check-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                placeholder="Additional notes for the appointment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateAppointment}
                disabled={createAppointmentMutation.isPending}
              >
                {createAppointmentMutation.isPending ? 'Scheduling...' : 'Schedule Appointment'}
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Calendar View */}
      <div className="mb-6">
        <StableCalendar />
      </div>

      {/* Appointments Display */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'calendar')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Traditional Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Appointments ({filteredAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="text-center py-8">Loading appointments...</div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No appointments found matching your filters
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((appointment: Appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">
                              {appointment.patientName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-green-600" />
                            <span>{appointment.doctorName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span>
                              {appointment.appointmentDate && appointment.appointmentTime ? 
                                `${format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')} at ${appointment.appointmentTime}` : 
                                'No date set'
                              }
                            </span>
                          </div>
                          <Badge variant="outline" className="bg-blue-50">
                            {appointment.type}
                          </Badge>
                          <Badge variant={getStatusVariant(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {appointment.status === 'scheduled' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                          {appointment.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateAppointmentStatus(appointment.id, 'scheduled')}
                            >
                              Reactivate
                            </Button>
                          )}
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <strong>Notes:</strong> {appointment.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarView className="h-5 w-5" />
                  Calendar View
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeek(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                  <div key={day} className="text-center font-semibold p-2 bg-gray-100 rounded">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {getWeekDates(currentWeek).map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const dayAppointments = appointmentsByDate[dateStr] || [];
                  return (
                    <div key={dateStr} className="border rounded-lg p-2 min-h-[120px] bg-white">
                      <div className="text-sm font-medium mb-2">
                        {format(date, 'dd')}
                      </div>
                      <div className="space-y-1">
                        {dayAppointments.map((appointment: Appointment) => (
                          <div
                            key={appointment.id}
                            className={cn(
                              "text-xs p-1 rounded cursor-pointer",
                              appointment.status === 'scheduled' && "bg-blue-100 text-blue-800",
                              appointment.status === 'completed' && "bg-green-100 text-green-800",
                              appointment.status === 'cancelled' && "bg-red-100 text-red-800"
                            )}
                            title={`${appointment.patientName} with ${appointment.doctorName} at ${appointment.appointmentTime}`}
                          >
                            <div className="font-medium">{appointment.appointmentTime}</div>
                            <div className="truncate">{appointment.patientName}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}