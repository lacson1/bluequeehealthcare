import { useState, useEffect, useMemo } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Clock, Plus, Search, User, Stethoscope, Filter, Grid3X3, List, CheckCircle, XCircle, Calendar as CalendarView, Brain, Zap, AlertCircle, Play, Pause, ChevronLeft, ChevronRight, X, Scissors } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, startOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval } from 'date-fns';
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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Changed to 'asc' to show earliest dates first
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
          // Sort by date first, then by time if same date
          const dateA = new Date(a.appointmentDate).getTime();
          const dateB = new Date(b.appointmentDate).getTime();
          if (dateA !== dateB) {
            comparison = dateB - dateA; // Newer dates first (descending)
          } else {
            // If same date, sort by time
            const timeA = a.appointmentTime || '00:00';
            const timeB = b.appointmentTime || '00:00';
            const [hoursA, minutesA] = timeA.split(':').map(Number);
            const [hoursB, minutesB] = timeB.split(':').map(Number);
            const timeValueA = hoursA * 60 + minutesA;
            const timeValueB = hoursB * 60 + minutesB;
            comparison = timeValueA - timeValueB; // Earlier times first
          }
          break;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });
  }, [appointments, searchTerm, statusFilter, providerFilter, dateFilter, sortBy, sortOrder]);

  // Fetch patients for selection
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    staleTime: 10 * 60 * 1000, // 10 minutes - static data
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch healthcare staff for selection  
  const { data: healthcareStaff = [] } = useQuery<HealthcareStaff[]>({
    queryKey: ['/api/users/healthcare-staff'],
    staleTime: 10 * 60 * 1000, // 10 minutes - static data
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/appointments', 'POST', data);
      return await response.json();
    },
    onSuccess: async () => {
      // Invalidate and refetch appointments to ensure calendar view updates
      await queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      await queryClient.refetchQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: 'Success',
        description: 'Appointment scheduled successfully',
        variant: 'default'
      });
      resetForm();
      setIsCreating(false);
    },
    onError: async (error: any) => {
      // Parse error message - check if it's a 409 conflict error
      let errorTitle = 'Scheduling Error';
      let errorMessage = 'Failed to schedule appointment';

      if (error?.message) {
        const errorText = error.message;

        // Check for time slot conflict (409 error)
        if (errorText.includes('409') || errorText.includes('Time slot conflict') || errorText.includes('conflicts with an existing appointment')) {
          errorTitle = 'Time Slot Conflict';
          // Extract the detailed error message from the JSON response
          const match = errorText.match(/{"message":"([^"]+)","error":"([^"]+)"/);
          if (match && match[2]) {
            errorMessage = match[2];
          } else if (errorText.includes('conflicts with an existing appointment')) {
            // Extract conflict details from error message
            const conflictMatch = errorText.match(/conflicts with an existing appointment at ([0-9:]+)/);
            if (conflictMatch) {
              errorMessage = `This time slot conflicts with an existing appointment at ${conflictMatch[1]}. Please choose a different time.`;
            } else {
              errorMessage = 'This time slot is already booked. Please choose a different time.';
            }
          } else {
            errorMessage = 'This time slot is already booked. Please choose a different time.';
          }
        } 
        // Check for validation errors (400)
        else if (errorText.includes('400') || errorText.includes('Validation error') || errorText.includes('required')) {
          errorTitle = 'Validation Error';
          // Try to extract validation details
          try {
            const jsonMatch = errorText.match(/\{.*\}/);
            if (jsonMatch) {
              const errorData = JSON.parse(jsonMatch[0]);
              if (errorData.details && Array.isArray(errorData.details)) {
                const validationErrors = errorData.details.map((d: any) => 
                  `${d.path?.join('.') || 'Field'}: ${d.message || 'Invalid value'}`
                ).join(', ');
                errorMessage = `Please check the following fields: ${validationErrors}`;
              } else if (errorData.message) {
                errorMessage = errorData.message;
              }
            }
          } catch (e) {
            // If parsing fails, use the cleaned error text
            errorMessage = errorText.replace(/^\d+:\s*/, '').replace(/^Validation error:\s*/i, '');
          }
        }
        // Check for permission errors (403)
        else if (errorText.includes('403') || errorText.includes('permission') || errorText.includes('Access denied')) {
          errorTitle = 'Access Denied';
          errorMessage = 'You do not have permission to schedule appointments. Please contact an administrator.';
        }
        // Check for server errors (500)
        else if (errorText.includes('500') || errorText.includes('Failed to create appointment')) {
          errorTitle = 'Server Error';
          errorMessage = 'An error occurred while scheduling the appointment. Please try again later.';
        }
        // Generic error handling
        else {
          errorMessage = errorText.replace(/^\d+:\s*/, ''); // Remove status code prefix
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive'
      });
    },
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => {
      return apiRequest(`/api/appointments/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({ title: 'Success', description: 'Appointment updated successfully' });
    },
    onError: (error: any) => {
      console.error('Appointment update error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update appointment',
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
    if (!selectedDate || !selectedTime || !selectedPatient || !selectedStaff || !appointmentType) {
      const missingFields = [];
      if (!selectedDate) missingFields.push('Date');
      if (!selectedTime) missingFields.push('Time');
      if (!selectedPatient) missingFields.push('Patient');
      if (!selectedStaff) missingFields.push('Healthcare Provider');
      if (!appointmentType) missingFields.push('Appointment Type');

      toast({
        title: 'Validation Error',
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    // Format date as YYYY-MM-DD for the backend (use local timezone to avoid date shifts)
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const appointmentDate = `${year}-${month}-${day}`;

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

    createAppointmentMutation.mutate(appointmentData);
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
  const appointmentsByDate = useMemo(() => {
    return filteredAndSortedAppointments.reduce((acc: any, appointment: Appointment) => {
      const date = appointment.appointmentDate;
      if (!acc[date]) acc[date] = [];
      acc[date].push(appointment);
      return acc;
    }, {});
  }, [filteredAndSortedAppointments]);

  // Get month dates for calendar view (including leading/trailing days to fill weeks)
  const getMonthDates = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = startOfWeek(monthEnd);
    calendarEnd.setDate(calendarEnd.getDate() + 6); // Complete the last week

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  // Pre-fill patient if coming from patient profile
  useEffect(() => {
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
        <div className="flex items-center justify-between gap-3">
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-2.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setIsCreating(true)} 
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <Plus className="h-5 w-5" strokeWidth={2.5} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-medium">
                  <p>Schedule Appointment</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsSmartScheduling(true)}
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 rounded-xl border-2 border-primary/20 bg-background/80 backdrop-blur-sm hover:bg-primary/5 hover:border-primary/40 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <Brain className="h-5 w-5 text-primary" strokeWidth={2.5} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-medium">
                  <p>Smart Schedule</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-sm border-slate-200/60">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search appointments by patient name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm"
                />
              </div>

              {/* Filters Row - Compact Layout */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="All Status" />
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

                {/* Provider Filter */}
                <Select value={providerFilter} onValueChange={setProviderFilter}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="All Providers" />
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

                {/* Date Filter */}
                <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as 'all' | 'today' | 'week' | 'month')}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Filter */}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'dateCreated' | 'appointmentDate' | 'patientName' | 'status')}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Most Recent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointmentDate">Most Recent</SelectItem>
                    <SelectItem value="patientName">Patient Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="dateCreated">Date Created</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="flex border rounded-md overflow-hidden ml-auto">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none border-0 h-8 px-2.5"
                  >
                    <List className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">List</span>
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className="rounded-none border-0 border-l h-8 px-2.5"
                  >
                    <CalendarView className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Calendar</span>
                  </Button>
                </div>

                {/* Clear Filters Button */}
                {(statusFilter !== 'all' || providerFilter !== 'all' || dateFilter !== 'all' || searchTerm) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setProviderFilter('all');
                      setDateFilter('all');
                      setSearchTerm('');
                    }}
                    className="h-8 text-xs px-2.5"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
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
                    <SelectTrigger data-testid="select-patient">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.length === 0 ? (
                        <SelectItem value="no-patients" disabled>
                          No patients available
                        </SelectItem>
                      ) : (
                        patients.map((patient: Patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.firstName} {patient.lastName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff">Healthcare Provider *</Label>
                  <Select value={selectedStaff?.toString() || ''} onValueChange={(value) => setSelectedStaff(parseInt(value))}>
                    <SelectTrigger data-testid="select-provider">
                      <SelectValue placeholder="Select healthcare provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {healthcareStaff.length === 0 ? (
                        <SelectItem value="no-staff" disabled>
                          No healthcare staff available
                        </SelectItem>
                      ) : (
                        healthcareStaff.map((staff: HealthcareStaff) => (
                          <SelectItem key={staff.id} value={staff.id.toString()}>
                            {staff.role === 'doctor' ? 'Dr.' : ''} {staff.firstName || staff.username} {staff.lastName || ''} ({staff.role})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        data-testid="select-date"
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
                        data-testid="calendar-picker"
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
                    <SelectTrigger data-testid="select-time">
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
                    <SelectTrigger data-testid="select-appointment-type">
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
                    <SelectTrigger data-testid="select-duration">
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
                  data-testid="input-notes"
                  placeholder="Additional notes for the appointment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  data-testid="button-schedule-appointment"
                  onClick={handleCreateAppointment}
                  disabled={createAppointmentMutation.isPending}
                >
                  {createAppointmentMutation.isPending ? 'Scheduling...' : 'Schedule Appointment'}
                </Button>
                <Button
                  data-testid="button-cancel-appointment"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Smart Scheduling Modal */}
        <Dialog open={isSmartScheduling} onOpenChange={setIsSmartScheduling}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Brain className="h-6 w-6 text-primary" />
                Smart Scheduling Assistant
              </DialogTitle>
              <DialogDescription>
                AI-powered scheduling that finds the best available time slots based on provider availability and appointment type
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
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
            </div>
          </DialogContent>
        </Dialog>

        {/* Appointments Display */}
        {viewMode === 'list' ? (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-6">
              <CardTitle className="text-base font-semibold text-slate-900">
                Appointments ({filteredAndSortedAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {appointmentsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading appointments...</p>
                </div>
              ) : filteredAndSortedAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarView className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-medium text-slate-600 mb-1">No appointments found</p>
                  <p className="text-xs text-muted-foreground">Try adjusting your filters or schedule a new appointment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedAppointments.map((appointment: Appointment) => {
                    const appointmentDate = appointment.appointmentDate ? new Date(appointment.appointmentDate) : null;
                    const isToday = appointmentDate && format(appointmentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    const isPast = appointmentDate && appointmentDate < new Date() && appointment.status !== 'completed' && appointment.status !== 'cancelled';
                    
                    // Get patient initials
                    const patientInitials = appointment.patientName
                      ?.split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || '??';

                    // Status colors
                    const statusColors = {
                      scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
                      'in-progress': 'bg-green-50 text-green-700 border-green-200',
                      completed: 'bg-gray-50 text-gray-700 border-gray-200',
                      cancelled: 'bg-red-50 text-red-700 border-red-200',
                      'no-show': 'bg-orange-50 text-orange-700 border-orange-200',
                    };

                    // Type icons and colors
                    const typeConfig = {
                      consultation: { icon: Stethoscope, color: 'text-blue-600 bg-blue-50' },
                      'follow-up': { icon: Clock, color: 'text-purple-600 bg-purple-50' },
                      emergency: { icon: AlertCircle, color: 'text-red-600 bg-red-50' },
                      procedure: { icon: Scissors, color: 'text-indigo-600 bg-indigo-50' },
                      'check-up': { icon: CheckCircle, color: 'text-green-600 bg-green-50' },
                    };
                    const typeInfo = typeConfig[appointment.type as keyof typeof typeConfig] || { icon: CalendarIcon, color: 'text-gray-600 bg-gray-50' };
                    const TypeIcon = typeInfo.icon;

                    return (
                      <Card
                        key={appointment.id}
                        className={`group border transition-all duration-200 hover:shadow-md ${
                          isPast ? 'border-orange-200 bg-orange-50/30' :
                          isToday ? 'border-blue-200 bg-blue-50/30' :
                          'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Patient Avatar */}
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
                                <span className="text-sm font-semibold text-primary">{patientInitials}</span>
                              </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1 min-w-0">
                                  {/* Patient Name */}
                                  <h3 className="font-semibold text-base text-slate-900 mb-1 truncate">
                                    {appointment.patientName || 'Unknown Patient'}
                                  </h3>
                                  
                                  {/* Provider and Date/Time */}
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-2">
                                    <div className="flex items-center gap-1.5">
                                      <User className="h-3.5 w-3.5 text-slate-400" />
                                      <span className="truncate">{appointment.doctorName || 'No provider'}</span>
                                    </div>
                                    {appointment.appointmentDate && appointment.appointmentTime && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                                          <span className="whitespace-nowrap">
                                            {isToday ? 'Today' : format(appointmentDate, 'MMM dd, yyyy')} at {appointment.appointmentTime}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* Appointment Type and Duration */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className={`${typeInfo.color} border-0 text-xs font-medium px-2.5 py-0.5`}>
                                      <TypeIcon className="h-3 w-3 mr-1.5 inline" />
                                      {appointment.type?.replace('-', ' ') || 'Appointment'}
                                    </Badge>
                                    {appointment.duration && (
                                      <span className="text-xs text-slate-500">
                                        {appointment.duration} min
                                      </span>
                                    )}
                                  </div>

                                  {/* Notes */}
                                  {appointment.notes && (
                                    <div className="mt-2 text-xs text-slate-600 bg-slate-50/50 border border-slate-100 rounded-md p-2.5">
                                      <p className="line-clamp-2">{appointment.notes}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Status Badge and Actions */}
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                  <Badge 
                                    variant="outline" 
                                    className={`${statusColors[appointment.status as keyof typeof statusColors] || 'bg-gray-50 text-gray-700 border-gray-200'} text-xs font-medium px-2.5 py-1 border`}
                                  >
                                    {appointment.status?.replace('-', ' ') || 'Unknown'}
                                  </Badge>

                                  {/* Action Buttons */}
                                  <div className="flex gap-1.5">
                                    {appointment.status === 'scheduled' && (
                                      <>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  updateAppointmentStatus(appointment.id, 'in-progress');
                                                }}
                                              >
                                                <Play className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Start Appointment</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  updateAppointmentStatus(appointment.id, 'cancelled');
                                                }}
                                              >
                                                <XCircle className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Cancel Appointment</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </>
                                    )}
                                    {appointment.status === 'in-progress' && (
                                      <>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  updateAppointmentStatus(appointment.id, 'completed');
                                                }}
                                              >
                                                <CheckCircle className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Complete Appointment</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  updateAppointmentStatus(appointment.id, 'scheduled');
                                                }}
                                              >
                                                <Pause className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Pause Appointment</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </>
                                    )}
                                    {appointment.status === 'completed' && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 w-8 p-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/patients/${appointment.patientId}`);
                                              }}
                                            >
                                              <User className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>View Patient</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
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
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="text-sm font-semibold px-4 flex items-center">
                    {format(currentMonth, 'MMMM yyyy')}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                    className="hover:bg-green-50 hover:border-green-200 transition-all duration-200"
                  >
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
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
                {getMonthDates(currentMonth).map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const dayAppointments = appointmentsByDate[dateStr] || [];
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        "border rounded-lg p-2 min-h-[100px] transition-all duration-200",
                        isCurrentMonth ? "bg-white" : "bg-gray-50",
                        isToday && "ring-2 ring-blue-500 bg-blue-50"
                      )}
                    >
                      <div className={cn(
                        "text-sm font-medium mb-2",
                        isCurrentMonth ? "text-gray-900" : "text-gray-400",
                        isToday && "text-blue-600 font-bold"
                      )}>
                        {format(date, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayAppointments.map((appointment: Appointment) => (
                          <div
                            key={appointment.id}
                            className={cn(
                              "text-xs p-1 rounded cursor-pointer transition-all hover:opacity-80 hover:scale-105 hover:shadow-md",
                              appointment.status === 'scheduled' && "bg-blue-100 text-blue-800 hover:bg-blue-200",
                              appointment.status === 'in-progress' && "bg-green-100 text-green-800 hover:bg-green-200",
                              appointment.status === 'completed' && "bg-gray-100 text-gray-800 hover:bg-gray-200",
                              appointment.status === 'cancelled' && "bg-red-100 text-red-800 hover:bg-red-200"
                            )}
                            title={`Click to view: ${appointment.patientName} with ${appointment.doctorName} at ${appointment.appointmentTime} - ${appointment.status}`}
                            onClick={() => navigate(`/patients/${appointment.patientId}`)}
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
        )}
      </div>
    </div>
  );
}