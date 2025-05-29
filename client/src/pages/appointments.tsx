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
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Clock, Plus, Search, User, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface Doctor {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  scheduledAt: string;
  duration: number;
  type: string;
  status: string;
  notes?: string;
  patient?: Patient;
  doctor?: Doctor;
}

export default function AppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [appointmentType, setAppointmentType] = useState('');
  const [duration, setDuration] = useState('30');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
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

  // Fetch doctors for selection  
  const { data: doctors = [] } = useQuery({
    queryKey: ['/api/users/doctors'],
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
    setSelectedDoctor(null);
    setAppointmentType('');
    setDuration('30');
    setNotes('');
  };

  const handleCreateAppointment = () => {
    if (!selectedDate || !selectedTime || !selectedPatient || !selectedDoctor || !appointmentType) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const scheduledAt = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    scheduledAt.setHours(parseInt(hours), parseInt(minutes));

    createAppointmentMutation.mutate({
      patientId: selectedPatient,
      doctorId: selectedDoctor,
      scheduledAt: scheduledAt.toISOString(),
      duration: parseInt(duration),
      type: appointmentType,
      status: 'scheduled',
      notes
    });
  };

  const updateAppointmentStatus = (appointmentId: number, status: string) => {
    updateAppointmentMutation.mutate({ id: appointmentId, status });
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((appointment: Appointment) => {
    if (!searchTerm) return true;
    const patient = appointment.patient;
    const doctor = appointment.doctor;
    return (
      patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
                <Label htmlFor="doctor">Doctor *</Label>
                <Select value={selectedDoctor?.toString() || ''} onValueChange={(value) => setSelectedDoctor(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor: Doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        Dr. {doctor.firstName || doctor.username} {doctor.lastName || ''}
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
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
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

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {appointmentsLoading ? (
            <div className="text-center py-8">Loading appointments...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No appointments found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment: Appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">
                          {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-green-600" />
                        <span>Dr. {appointment.doctor?.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span>{appointment.scheduledAt ? format(new Date(appointment.scheduledAt), 'MMM dd, yyyy - HH:mm') : 'No date set'}</span>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {appointment.type}
                      </span>
                      <span className={cn(
                        "px-2 py-1 rounded text-sm",
                        appointment.status === 'scheduled' && "bg-yellow-100 text-yellow-800",
                        appointment.status === 'completed' && "bg-green-100 text-green-800",
                        appointment.status === 'cancelled' && "bg-red-100 text-red-800"
                      )}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {appointment.status === 'scheduled' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          >
                            Mark Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {appointment.notes && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Notes:</strong> {appointment.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}