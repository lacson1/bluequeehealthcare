import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  User,
  Plus,
  RefreshCw as Refresh,
  Edit,
  XCircle as Cancel,
  CheckCircle as CheckIn,
  MoreVertical as Menu,
  Video,
  Phone,
  MapPin,
  AlertCircle,
  FileText,
  CalendarIcon
} from 'lucide-react';

interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  doctorName: string | null;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
  priority: string;
  organizationId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface PatientAppointmentsTabProps {
  readonly patientId: number;
}

export function PatientAppointmentsTab({ patientId }: PatientAppointmentsTabProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isSchedulingDialogOpen, setIsSchedulingDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [duration, setDuration] = useState('30');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('medium');

  const { data: appointments = [], isLoading, isError, refetch } = useQuery<Appointment[]>({
    queryKey: [`/api/patients/${patientId}/appointments`],
  });

  const { data: doctors = [] } = useQuery<Array<{ id: number; name: string; username: string }>>({
    queryKey: ['/api/users/doctors'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: number; status: string }) => {
      return apiRequest(`/api/appointments/${appointmentId}`, 'PATCH', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/appointments`] });
      toast({
        title: "Success",
        description: "Appointment status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    }
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/appointments', 'POST', data);
    },
    onSuccess: async () => {
      // Invalidate and refetch appointments to ensure calendar view updates
      await queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/appointments`] });
      await queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      await queryClient.refetchQueries({ queryKey: ['/api/appointments'] });
      setIsSchedulingDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Appointment scheduled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule appointment",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTime('');
    setSelectedDoctor('');
    setAppointmentType('');
    setDuration('30');
    setNotes('');
    setPriority('medium');
  };

  const handleCreateAppointment = () => {
    if (!selectedDate || !selectedTime || !selectedDoctor || !appointmentType) {
      const missingFields = [];
      if (!selectedDate) missingFields.push('Date');
      if (!selectedTime) missingFields.push('Time');
      if (!selectedDoctor) missingFields.push('Healthcare Provider');
      if (!appointmentType) missingFields.push('Appointment Type');

      toast({
        title: 'Validation Error',
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    const appointmentDate = format(selectedDate, 'yyyy-MM-dd');

    const appointmentData = {
      patientId: patientId,
      doctorId: Number.parseInt(selectedDoctor),
      appointmentDate: appointmentDate,
      appointmentTime: selectedTime,
      duration: Number.parseInt(duration),
      type: appointmentType,
      status: 'scheduled',
      priority: priority,
      notes: notes || undefined
    };

    createAppointmentMutation.mutate(appointmentData);
  };

  // Generate time slots
  const timeSlots = [];
  for (let hour = 8; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 17 && minute > 0) break;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointmentDate);
    return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'completed';
  });

  const pastAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointmentDate);
    return (aptDate < today || apt.status === 'completed') && apt.status !== 'cancelled';
  });

  const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      case 'no-show':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">No Show</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-gray-600">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Low</Badge>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'telemedicine':
      case 'video':
        return <Video className="w-4 h-4 text-blue-500" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-green-500" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleCheckIn = (appointmentId: number) => {
    updateStatusMutation.mutate({ appointmentId, status: 'in-progress' });
  };

  const handleComplete = (appointmentId: number) => {
    updateStatusMutation.mutate({ appointmentId, status: 'completed' });
  };

  const handleCancel = (appointmentId: number) => {
    updateStatusMutation.mutate({ appointmentId, status: 'cancelled' });
  };

  const handleMarkNoShow = (appointmentId: number) => {
    updateStatusMutation.mutate({ appointmentId, status: 'no-show' });
  };

  const renderAppointmentCard = (appointment: Appointment) => (
    <div
      key={appointment.id}
      className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
      data-testid={`appointment-card-${appointment.id}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              {getTypeIcon(appointment.type)}
              <h4 className="font-semibold text-slate-800 text-lg capitalize">
                {appointment.type.replaceAll('-', ' ')}
              </h4>
            </div>
            {getStatusBadge(appointment.status)}
            {appointment.priority !== 'medium' && getPriorityBadge(appointment.priority)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
            <div className="bg-blue-50 p-3 rounded-md">
              <span className="font-medium text-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Date
              </span>
              <p className="text-slate-800 mt-1">{formatDate(appointment.appointmentDate)}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <span className="font-medium text-slate-700 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Time
              </span>
              <p className="text-slate-800 mt-1">{formatTime(appointment.appointmentTime)}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <span className="font-medium text-slate-700 block">Duration</span>
              <p className="text-slate-800 mt-1">{appointment.duration} mins</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <span className="font-medium text-slate-700 flex items-center gap-1">
                <User className="w-3 h-3" />
                Doctor
              </span>
              <p className="text-slate-800 mt-1">{appointment.doctorName || 'Not assigned'}</p>
            </div>
          </div>

          {appointment.notes && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-100">
              <span className="font-medium text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </span>
              <p className="text-slate-800 mt-2">{appointment.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center space-x-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Created: {new Date(appointment.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {appointment.status === 'scheduled' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 hover:text-green-800 border-green-200"
                  onClick={() => handleCheckIn(appointment.id)}
                  data-testid={`button-checkin-${appointment.id}`}
                >
                  <CheckIn className="w-3 h-3 mr-1" />
                  Check In
                </Button>
              )}
              {appointment.status === 'in-progress' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-emerald-600 hover:text-emerald-800 border-emerald-200"
                  onClick={() => handleComplete(appointment.id)}
                  data-testid={`button-complete-${appointment.id}`}
                >
                  <CheckIn className="w-3 h-3 mr-1" />
                  Complete
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                    <Menu className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuItem data-testid={`menu-reschedule-${appointment.id}`}>
                    <Edit className="w-3 h-3 mr-2" />
                    Reschedule
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid={`menu-view-notes-${appointment.id}`}>
                    <FileText className="w-3 h-3 mr-2" />
                    View Notes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleMarkNoShow(appointment.id)}
                        data-testid={`menu-noshow-${appointment.id}`}
                      >
                        <AlertCircle className="w-3 h-3 mr-2 text-orange-600" />
                        Mark No-Show
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCancel(appointment.id)}
                        className="text-red-600"
                        data-testid={`menu-cancel-${appointment.id}`}
                      >
                        <Cancel className="w-3 h-3 mr-2" />
                        Cancel Appointment
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmptyState = (type: string) => {
    const messages: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
      upcoming: {
        title: "No Upcoming Appointments",
        description: "Schedule a new appointment for this patient",
        icon: <Calendar className="mx-auto h-16 w-16 text-gray-300 mb-4" />
      },
      past: {
        title: "No Past Appointments",
        description: "Past appointments will appear here after they are completed",
        icon: <Clock className="mx-auto h-16 w-16 text-gray-300 mb-4" />
      },
      cancelled: {
        title: "No Cancelled Appointments",
        description: "Cancelled appointments will appear here",
        icon: <Cancel className="mx-auto h-16 w-16 text-gray-300 mb-4" />
      }
    };

    const msg = messages[type] || messages.upcoming;

    return (
      <div className="text-center py-12 text-gray-500">
        {msg.icon}
        <h3 className="text-lg font-medium text-gray-700 mb-2">{msg.title}</h3>
        <p className="text-sm text-gray-500 mb-4">{msg.description}</p>
        {type === 'upcoming' && (
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsSchedulingDialogOpen(true)}
            data-testid="button-schedule-first-appointment"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule First Appointment
          </Button>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-500">Loading appointments...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="text-red-500">Failed to load appointments</div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
        >
          <Refresh className="w-4 h-4 mr-2" />
          Retry Loading
        </Button>
      </div>
    );
  }

  return (
    <>
      <Dialog open={isSchedulingDialogOpen} onOpenChange={setIsSchedulingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new appointment for this patient
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Healthcare Provider */}
            <div className="grid gap-2">
              <Label htmlFor="doctor">Healthcare Provider *</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor: any) => (
                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                      {doctor.name || doctor.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="grid gap-2">
              <Label>Appointment Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="time">Time *</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger id="time">
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
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Appointment Type *</Label>
                <Select value={appointmentType} onValueChange={setAppointmentType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">General Consultation</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                    <SelectItem value="check-up">Check-up</SelectItem>
                    <SelectItem value="telemedicine">Telemedicine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsSchedulingDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAppointment}
              disabled={createAppointmentMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createAppointmentMutation.isPending ? 'Scheduling...' : 'Schedule Appointment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger
              value="upcoming"
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
              data-testid="tab-upcoming-appointments"
            >
              <Calendar className="w-4 h-4" />
              Upcoming ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="flex items-center gap-2 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-700 data-[state=active]:border-gray-200"
              data-testid="tab-past-appointments"
            >
              <Clock className="w-4 h-4" />
              Past ({pastAppointments.length})
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="flex items-center gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-red-200"
              data-testid="tab-cancelled-appointments"
            >
              <Cancel className="w-4 h-4" />
              Cancelled ({cancelledAppointments.length})
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              data-testid="button-refresh-appointments"
            >
              <Refresh className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsSchedulingDialogOpen(true)}
              data-testid="button-new-appointment"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length > 0 ? (
            <div className="grid gap-4">
              {upcomingAppointments.map(renderAppointmentCard)}
            </div>
          ) : renderEmptyState('upcoming')}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastAppointments.length > 0 ? (
            <div className="grid gap-4">
              {pastAppointments.map(renderAppointmentCard)}
            </div>
          ) : renderEmptyState('past')}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledAppointments.length > 0 ? (
            <div className="grid gap-4">
              {cancelledAppointments.map(renderAppointmentCard)}
            </div>
          ) : renderEmptyState('cancelled')}
        </TabsContent>
      </Tabs>
    </>
  );
}
