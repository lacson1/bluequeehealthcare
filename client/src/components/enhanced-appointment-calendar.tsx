import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Bell, 
  AlertCircle, 
  CheckCircle,
  X,
  Edit,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/components/role-guard";

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

interface TimeSlot {
  time: string;
  available: boolean;
  appointment?: Appointment;
}

export function EnhancedAppointmentCalendar() {
  const { user } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [conflictCheck, setConflictCheck] = useState<string[]>([]);

  // Fetch appointments for selected date
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['/api/appointments', selectedDate, selectedDoctor],
    queryFn: () => apiRequest(`/api/appointments?date=${selectedDate}${selectedDoctor ? `&doctorId=${selectedDoctor}` : ''}`),
    refetchInterval: 30000
  });

  // Fetch doctors
  const { data: doctors = [] } = useQuery({
    queryKey: ['/api/users/doctors'],
    queryFn: () => apiRequest('/api/users?role=doctor')
  });

  // Fetch patients
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
  });

  // Fetch availability slots
  const { data: availabilitySlots = [] } = useQuery({
    queryKey: ['/api/availability-slots', selectedDoctor],
    queryFn: () => apiRequest(`/api/availability-slots${selectedDoctor ? `?doctorId=${selectedDoctor}` : ''}`),
    enabled: !!selectedDoctor
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: (appointmentData: any) => apiRequest('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      setShowNewAppointment(false);
      toast({
        title: "Success",
        description: "Appointment created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create appointment"
      });
    }
  });

  // Update appointment status mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      apiRequest(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Success",
        description: "Appointment updated successfully"
      });
    }
  });

  // Generate time slots for the day
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 17;
    const slotDuration = 30;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const appointment = appointments.find((apt: Appointment) => apt.appointmentTime === time);
        
        slots.push({
          time,
          available: !appointment,
          appointment
        });
      }
    }
    return slots;
  };

  // Check for appointment conflicts
  const checkConflicts = (newAppointment: any) => {
    const conflicts: string[] = [];
    const newStart = new Date(`${newAppointment.appointmentDate}T${newAppointment.appointmentTime}`);
    const newEnd = new Date(newStart.getTime() + (newAppointment.duration || 30) * 60000);

    appointments.forEach((apt: Appointment) => {
      if (apt.doctorId === newAppointment.doctorId && apt.status !== 'cancelled') {
        const existingStart = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
        const existingEnd = new Date(existingStart.getTime() + apt.duration * 60000);

        if ((newStart < existingEnd && newEnd > existingStart)) {
          conflicts.push(`Conflicts with existing appointment: ${apt.patientName} at ${apt.appointmentTime}`);
        }
      }
    });

    setConflictCheck(conflicts);
    return conflicts.length === 0;
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
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Appointment Calendar</h2>
          <div className="flex gap-2">
            {['day', 'week', 'month'].map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode(mode as any)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="date">Date:</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="doctor">Doctor:</Label>
            <Select value={selectedDoctor?.toString() || ''} onValueChange={(value) => setSelectedDoctor(value ? parseInt(value) : null)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Doctors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Doctors</SelectItem>
                {doctors.map((doctor: any) => (
                  <SelectItem key={doctor.id} value={doctor.id.toString()}>
                    {doctor.firstName} {doctor.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
              </DialogHeader>
              <NewAppointmentForm 
                onSubmit={(data) => {
                  if (checkConflicts(data)) {
                    createAppointmentMutation.mutate(data);
                  }
                }}
                conflicts={conflictCheck}
                patients={patients}
                doctors={doctors}
                selectedDate={selectedDate}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Time Slots */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Schedule for {new Date(selectedDate).toLocaleDateString()}</span>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Booked</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <div
                      key={slot.time}
                      className={`p-3 rounded-lg border transition-all ${
                        slot.available 
                          ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-gray-900">{slot.time}</div>
                          {slot.appointment ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">{slot.appointment.patientName}</span>
                              <Badge className={getStatusColor(slot.appointment.status)}>
                                {slot.appointment.status}
                              </Badge>
                              <Badge className={getPriorityColor(slot.appointment.priority)}>
                                {slot.appointment.priority}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-green-600 font-medium">Available</span>
                          )}
                        </div>
                        
                        {slot.appointment && (
                          <div className="flex gap-2">
                            {slot.appointment.status === 'scheduled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateAppointmentMutation.mutate({
                                  id: slot.appointment!.id,
                                  status: 'confirmed'
                                })}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Confirm
                              </Button>
                            )}
                            {slot.appointment.status === 'confirmed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateAppointmentMutation.mutate({
                                  id: slot.appointment!.id,
                                  status: 'in-progress'
                                })}
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                Start
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => updateAppointmentMutation.mutate({
                                id: slot.appointment!.id,
                                status: 'cancelled'
                              })}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {slot.appointment?.notes && (
                        <div className="mt-2 text-sm text-gray-600 bg-white p-2 rounded">
                          <strong>Notes:</strong> {slot.appointment.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Today's Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Total Appointments:</span>
                <span className="font-medium">{appointments.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Confirmed:</span>
                <span className="font-medium text-green-600">
                  {appointments.filter((apt: Appointment) => apt.status === 'confirmed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pending:</span>
                <span className="font-medium text-yellow-600">
                  {appointments.filter((apt: Appointment) => apt.status === 'scheduled').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>In Progress:</span>
                <span className="font-medium text-blue-600">
                  {appointments.filter((apt: Appointment) => apt.status === 'in-progress').length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Urgent Appointments */}
          {appointments.filter((apt: Appointment) => apt.priority === 'urgent').length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Urgent Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {appointments
                    .filter((apt: Appointment) => apt.priority === 'urgent')
                    .map((apt: Appointment) => (
                      <div key={apt.id} className="p-2 bg-red-50 rounded border border-red-200">
                        <div className="font-medium">{apt.patientName}</div>
                        <div className="text-sm text-red-600">{apt.appointmentTime}</div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// New Appointment Form Component
interface NewAppointmentFormProps {
  onSubmit: (data: any) => void;
  conflicts: string[];
  patients: any[];
  doctors: any[];
  selectedDate: string;
}

function NewAppointmentForm({ onSubmit, conflicts, patients, doctors, selectedDate }: NewAppointmentFormProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: selectedDate,
    appointmentTime: '',
    duration: 30,
    type: 'consultation',
    priority: 'medium',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      patientId: parseInt(formData.patientId),
      doctorId: parseInt(formData.doctorId)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {conflicts.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertCircle className="w-5 h-5" />
            Scheduling Conflicts Detected
          </div>
          {conflicts.map((conflict, index) => (
            <div key={index} className="text-sm text-red-600">{conflict}</div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="patient">Patient</Label>
          <Select value={formData.patientId} onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient: any) => (
                <SelectItem key={patient.id} value={patient.id.toString()}>
                  {patient.firstName} {patient.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="doctor">Doctor</Label>
          <Select value={formData.doctorId} onValueChange={(value) => setFormData(prev => ({ ...prev, doctorId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor: any) => (
                <SelectItem key={doctor.id} value={doctor.id.toString()}>
                  {doctor.firstName} {doctor.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.appointmentDate}
            onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={formData.appointmentTime}
            onChange={(e) => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="duration">Duration (min)</Label>
          <Select value={formData.duration.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 min</SelectItem>
              <SelectItem value="30">30 min</SelectItem>
              <SelectItem value="45">45 min</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="follow-up">Follow-up</SelectItem>
              <SelectItem value="procedure">Procedure</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger>
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

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes for the appointment..."
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={conflicts.length > 0}>
          Schedule Appointment
        </Button>
        <Button type="button" variant="outline" onClick={() => setFormData({
          patientId: '',
          doctorId: '',
          appointmentDate: selectedDate,
          appointmentTime: '',
          duration: 30,
          type: 'consultation',
          priority: 'medium',
          notes: ''
        })}>
          Clear Form
        </Button>
      </div>
    </form>
  );
}