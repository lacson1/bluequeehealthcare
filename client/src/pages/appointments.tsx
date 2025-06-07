import React, { useState, useMemo } from 'react';
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
import { CalendarIcon, Clock, Plus, Search, User, Stethoscope, Filter, Grid3X3, List, CheckCircle, XCircle, Calendar as CalendarView, Brain, Zap, AlertCircle, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [isSmartScheduling, setIsSmartScheduling] = useState(false);
  
  // Enhanced filtering and sorting state
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'dateCreated' | 'appointmentDate' | 'patientName' | 'status'>('appointmentDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [editingAppointment, setEditingAppointment] = useState<number | null>(null);
  
  // Smart scheduling state
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Get URL params for pre-filled patient
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledPatientId = urlParams.get('patientId');

  // Fetch appointments
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['/api/appointments'],
    onError: (error) => {
      console.error('Failed to fetch appointments:', error);
    },
    onSuccess: (data) => {
      console.log('Appointments loaded successfully:', data);
    }
  });

  // Filtered and sorted appointments
  const filteredAndSortedAppointments = useMemo(() => {
    let filtered = appointments.filter((appointment: Appointment) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        appointment.patientName.toLowerCase().includes(searchLower) ||
        appointment.doctorName.toLowerCase().includes(searchLower) ||
        appointment.type.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

      // Provider filter
      const matchesProvider = providerFilter === 'all' || appointment.doctorId.toString() === providerFilter;

      // Date filter
      const appointmentDate = new Date(appointment.appointmentDate);
      const now = new Date();
      let matchesDate = true;

      switch (dateFilter) {
        case 'today':
          matchesDate = appointmentDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = appointmentDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = appointmentDate >= monthAgo;
          break;
        default:
          matchesDate = true;
      }

      return matchesSearch && matchesStatus && matchesProvider && matchesDate;
    });

    // Sort appointments
    return filtered.sort((a: Appointment, b: Appointment) => {
      let comparison = 0;

      switch (sortBy) {
        case 'patientName':
          comparison = a.patientName.localeCompare(b.patientName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'dateCreated':
          comparison = new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
          break;
        case 'appointmentDate':
        default:
          comparison = new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
          break;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });
  }, [appointments, searchTerm, statusFilter, providerFilter, dateFilter, sortBy, sortOrder]);

  // Fetch patients for selection
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
  });

  // Fetch healthcare staff for selection  
  const { data: healthcareStaff = [] } = useQuery({
    queryKey: ['/api/users/healthcare-staff'],
    onSuccess: (data) => {
      console.log('Healthcare staff loaded:', data);
    },
    onError: (error) => {
      console.error('Failed to load healthcare staff:', error);
    }
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('Sending appointment data:', data);
      return apiRequest('POST', '/api/appointments', data);
    },
    onSuccess: (data) => {
      console.log('Appointment created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({ title: 'Success', description: 'Appointment scheduled successfully' });
      resetForm();
      setIsCreating(false);
    },
    onError: (error: any) => {
      console.error('Appointment creation failed:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to schedule appointment';
      
      toast({
        title: 'Error',
        description: errorMessage,
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

  // Smart scheduling functions
  const generateSmartSuggestions = async () => {
    if (!selectedPatient || !selectedStaff || !appointmentType) {
      toast({
        title: 'Missing Information',
        description: 'Please select patient, provider, and appointment type first',
        variant: 'destructive'
      });
      return;
    }

    setLoadingSuggestions(true);
    try {
      // Get existing appointments for conflict detection
      const existingAppointments = Array.isArray(appointments) ? appointments : [];
      
      // Generate time suggestions based on availability
      const suggestions = [];
      const today = new Date();
      const appointmentDuration = parseInt(duration);
      
      // Generate suggestions for next 7 days
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayOffset);
        
        // Skip weekends for regular appointments (unless emergency)
        if (appointmentType !== 'emergency' && (targetDate.getDay() === 0 || targetDate.getDay() === 6)) {
          continue;
        }
        
        // Generate time slots from 9 AM to 5 PM
        for (let hour = 9; hour < 17; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const slotDateTime = new Date(targetDate);
            slotDateTime.setHours(hour, minute, 0, 0);
            
            // Check for conflicts
            const hasConflict = existingAppointments.some((apt: any) => {
              if (apt.doctorId !== selectedStaff) return false;
              
              const aptDate = new Date(apt.appointmentDate);
              const aptTime = apt.appointmentTime.split(':');
              const aptDateTime = new Date(aptDate);
              aptDateTime.setHours(parseInt(aptTime[0]), parseInt(aptTime[1]), 0, 0);
              
              const aptEndTime = new Date(aptDateTime);
              aptEndTime.setMinutes(aptEndTime.getMinutes() + apt.duration);
              
              const slotEndTime = new Date(slotDateTime);
              slotEndTime.setMinutes(slotEndTime.getMinutes() + appointmentDuration);
              
              return (slotDateTime < aptEndTime && slotEndTime > aptDateTime);
            });
            
            if (!hasConflict) {
              // Calculate priority score
              let priority = 100;
              
              // Prefer morning slots
              if (hour < 12) priority += 20;
              
              // Prefer earlier in the week
              priority += (7 - dayOffset) * 5;
              
              // Emergency appointments get highest priority on same day
              if (appointmentType === 'emergency' && dayOffset === 0) {
                priority += 50;
              }
              
              suggestions.push({
                date: targetDate,
                time: timeSlot,
                priority,
                reason: getRecommendationReason(hour, dayOffset, appointmentType)
              });
            }
          }
        }
      }
      
      // Sort by priority and take top 6 suggestions
      const topSuggestions = suggestions
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 6);
      
      setSmartSuggestions(topSuggestions);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate smart suggestions',
        variant: 'destructive'
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getRecommendationReason = (hour: number, dayOffset: number, type: string) => {
    if (type === 'emergency') return 'Available for emergency appointment';
    if (hour < 10) return 'Early morning - less crowded';
    if (hour < 12) return 'Morning slot - optimal for consultations';
    if (dayOffset === 0) return 'Available today';
    if (dayOffset === 1) return 'Available tomorrow';
    return 'Available slot';
  };

  const selectSmartSuggestion = (suggestion: any) => {
    setSelectedDate(suggestion.date);
    setSelectedTime(suggestion.time);
    setIsSmartScheduling(false);
    toast({
      title: 'Time Selected',
      description: `Selected ${format(suggestion.date, 'MMM dd, yyyy')} at ${suggestion.time}`
    });
  };

  const handleCreateAppointment = () => {
    console.log('=== APPOINTMENT CREATION DEBUG ===');
    console.log('selectedDate:', selectedDate);
    console.log('selectedTime:', selectedTime);
    console.log('selectedPatient:', selectedPatient);
    console.log('selectedStaff:', selectedStaff);
    console.log('appointmentType:', appointmentType);
    console.log('duration:', duration);
    console.log('notes:', notes);

    if (!selectedDate || !selectedTime || !selectedPatient || !selectedStaff || !appointmentType) {
      const missingFields = [];
      if (!selectedDate) missingFields.push('Date');
      if (!selectedTime) missingFields.push('Time');
      if (!selectedPatient) missingFields.push('Patient');
      if (!selectedStaff) missingFields.push('Healthcare Provider');
      if (!appointmentType) missingFields.push('Appointment Type');
      
      console.log('Missing required fields:', missingFields);
      toast({
        title: 'Validation Error',
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    // Format date as YYYY-MM-DD for the backend
    const appointmentDate = selectedDate.toISOString().split('T')[0];

    const appointmentData = {
      patientId: selectedPatient,
      doctorId: selectedStaff,
      appointmentDate: appointmentDate,
      appointmentTime: selectedTime,
      duration: parseInt(duration),
      type: appointmentType,
      status: 'scheduled',
      priority: 'medium',
      notes: notes || undefined
    };

    console.log('Final appointment data being sent:', appointmentData);
    console.log('About to call createAppointmentMutation.mutate');
    
    try {
      createAppointmentMutation.mutate(appointmentData);
      console.log('Mutation called successfully');
    } catch (error) {
      console.error('Error calling mutation:', error);
    }
  };

  const updateAppointmentStatus = (appointmentId: number, status: string) => {
    updateAppointmentMutation.mutate({ id: appointmentId, status });
  };

  // Get status badge variant
  const getStatusVariant = (status: string): any => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'in-progress': return { className: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'no-show': return 'outline';
      default: return 'default';
    }
  };

  // Group filtered appointments by date for calendar view
  const appointmentsByDate = filteredAndSortedAppointments.reduce((acc: any, appointment: Appointment) => {
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
    <div className="h-full flex flex-col">
      {/* Enhanced Fixed Header */}
      <header className="healthcare-header px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-white drop-shadow-sm">Appointment Management</h2>
            <p className="text-white/90 font-medium">Schedule and manage patient appointments</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Schedule Appointment
            </Button>
            <Button 
              onClick={() => setIsSmartScheduling(true)} 
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Brain className="h-4 w-4" />
              Smart Schedule
            </Button>
          </div>
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
                  <SelectItem value="in-progress">In Progress</SelectItem>
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

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointmentDate">Most Recent</SelectItem>
                  <SelectItem value="patientName">Patient Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="dateCreated">Date Created</SelectItem>
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

      {/* Smart Scheduling Modal */}
      {isSmartScheduling && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Smart Scheduling Assistant
            </CardTitle>
            <p className="text-sm text-gray-600">
              AI-powered scheduling that finds the best available time slots based on provider availability and appointment type
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smart-patient">Patient *</Label>
                <Select value={selectedPatient?.toString() || ''} onValueChange={(value) => setSelectedPatient(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {(patients as any[]).map((patient: Patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smart-staff">Healthcare Provider *</Label>
                <Select value={selectedStaff?.toString() || ''} onValueChange={(value) => setSelectedStaff(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {(healthcareStaff as any[]).map((staff: HealthcareStaff) => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        {staff.role === 'doctor' ? 'Dr.' : ''} {staff.firstName || staff.username} {staff.lastName || ''} ({staff.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smart-type">Appointment Type *</Label>
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
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={generateSmartSuggestions}
                disabled={loadingSuggestions}
                className="flex items-center gap-2"
              >
                {loadingSuggestions ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Generate Smart Suggestions
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsSmartScheduling(false)}>
                Cancel
              </Button>
            </div>

            {smartSuggestions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  Recommended Time Slots
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {smartSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => selectSmartSuggestion(suggestion)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-lg">
                            {format(suggestion.date, 'MMM dd, yyyy')}
                          </div>
                          <div className="text-blue-600 font-semibold">
                            {suggestion.time}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {suggestion.reason}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500">
                            Priority: {suggestion.priority}
                          </div>
                          {index === 0 && (
                            <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                              Best Match
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedDate && selectedTime && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Selected: {format(selectedDate, 'MMM dd, yyyy')} at {selectedTime}</span>
                    </div>
                    <div className="mt-2">
                      <Button onClick={handleCreateAppointment} className="mr-2">
                        Confirm Appointment
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setSelectedDate(undefined);
                        setSelectedTime('');
                      }}>
                        Change Selection
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {smartSuggestions.length === 0 && !loadingSuggestions && selectedPatient && selectedStaff && appointmentType && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  <span>No available slots found. Try adjusting the appointment type or duration.</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Calendar View - Temporarily disabled for stability */}

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
                Appointments ({filteredAndSortedAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="text-center py-8">Loading appointments...</div>
              ) : filteredAndSortedAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No appointments found matching your filters
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAndSortedAppointments.map((appointment: Appointment) => (
                    <div key={appointment.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer">
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
                          {appointment.status === 'in-progress' ? (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                              {appointment.status}
                            </Badge>
                          ) : (
                            <Badge variant={getStatusVariant(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {appointment.status === 'scheduled' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 hover:bg-blue-50"
                                onClick={() => updateAppointmentStatus(appointment.id, 'in-progress')}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Start Consultation
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
                          {appointment.status === 'in-progress' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete Consultation
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
                    className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeek(new Date())}
                    className="hover:bg-green-50 hover:border-green-200 transition-all duration-200"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                    className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
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
    </div>
  );
}