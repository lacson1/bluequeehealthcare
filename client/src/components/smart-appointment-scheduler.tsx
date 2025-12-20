import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  Plus,
  Bell,
  Users,
  Stethoscope
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface SmartAppointmentSchedulerProps {
  patientId?: number;
  defaultDate?: string;
}

export default function SmartAppointmentScheduler({ patientId, defaultDate }: SmartAppointmentSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [isBooking, setIsBooking] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patientId: patientId || '',
    doctorId: '',
    appointmentTime: '',
    duration: '30',
    type: 'consultation',
    notes: '',
    priority: 'medium'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", selectedDate],
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["/api/users/doctors"],
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"],
    enabled: !patientId, // Only fetch if we don't have a specific patient
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/appointments", "POST", {
      ...data,
      patientId: parseInt(data.patientId),
      doctorId: parseInt(data.doctorId),
      duration: parseInt(data.duration),
      appointmentDate: selectedDate,
      status: 'scheduled'
    }),
    onSuccess: async () => {
      // Invalidate and refetch appointments to ensure calendar view updates
      await queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/appointments"] });
      setIsBooking(false);
      setNewAppointment({
        patientId: patientId || '',
        doctorId: '',
        appointmentTime: '',
        duration: '30',
        type: 'consultation',
        notes: '',
        priority: 'medium'
      });
      toast({
        title: "Success",
        description: "Appointment scheduled successfully",
      });
    },
    onError: async (error: any) => {
      let errorTitle = "Error";
      let errorMessage = "Failed to schedule appointment";

      if (error?.message) {
        const errorText = error.message;

        // Check for time slot conflict (409 error)
        if (errorText.includes('409') || errorText.includes('Time slot conflict') || errorText.includes('conflicts with an existing appointment')) {
          errorTitle = 'Time Slot Conflict';
          const match = errorText.match(/{"message":"([^"]+)","error":"([^"]+)"/);
          if (match && match[2]) {
            errorMessage = match[2];
          } else if (errorText.includes('conflicts with an existing appointment')) {
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
          try {
            const jsonMatch = errorText.match(/\{.*\}/);
            if (jsonMatch) {
              const errorData = JSON.parse(jsonMatch[0]);
              if (errorData.details && Array.isArray(errorData.details)) {
                const validationErrors = errorData.details.map((d: any) => 
                  `${d.path?.join('.') || 'Field'}: ${d.message || 'Invalid value'}`
                ).join(', ');
                errorMessage = `Please check: ${validationErrors}`;
              } else if (errorData.message) {
                errorMessage = errorData.message;
              }
            }
          } catch (e) {
            errorMessage = errorText.replace(/^\d+:\s*/, '').replace(/^Validation error:\s*/i, '');
          }
        }
        // Check for permission errors (403)
        else if (errorText.includes('403') || errorText.includes('permission') || errorText.includes('Access denied')) {
          errorTitle = 'Access Denied';
          errorMessage = 'You do not have permission to schedule appointments.';
        }
        // Generic error handling
        else {
          errorMessage = errorText.replace(/^\d+:\s*/, '');
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateAppointmentStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      apiRequest(`/api/appointments/${id}`, "PATCH", { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment status updated",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAvailableTimeSlots = () => {
    const bookedTimes = appointments.map(apt => apt.appointmentTime);
    const slots = [];
    
    for (let hour = 8; hour < 18; hour++) {
      for (let minutes of ['00', '30']) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minutes}`;
        if (!bookedTimes.includes(timeSlot)) {
          slots.push(timeSlot);
        }
      }
    }
    
    return slots;
  };

  const handleBookAppointment = () => {
    if (!newAppointment.patientId || !newAppointment.doctorId || !newAppointment.appointmentTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    bookAppointmentMutation.mutate(newAppointment);
  };

  const todayAppointments = appointments.filter(apt => 
    new Date(apt.appointmentDate).toDateString() === new Date().toDateString()
  );

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointmentDate) > new Date() && apt.status !== 'cancelled'
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{todayAppointments.length}</div>
                <div className="text-sm text-gray-600">Today's Appointments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{getAvailableTimeSlots().length}</div>
                <div className="text-sm text-gray-600">Available Slots</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {appointments.filter(apt => apt.status === 'in-progress').length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">
                  {appointments.filter(apt => apt.priority === 'urgent').length}
                </div>
                <div className="text-sm text-gray-600">Urgent Cases</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Scheduler */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Smart Appointment Scheduler
          </CardTitle>
          <Button
            onClick={() => setIsBooking(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Schedule Appointment
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Selector */}
          <div className="flex items-center space-x-4">
            <Label>Select Date:</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>

          {/* Appointments List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Appointments for {new Date(selectedDate).toLocaleDateString()}
            </h3>
            
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No appointments scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-2">
                {appointments
                  .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
                  .map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-center">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {appointment.appointmentTime}
                          </span>
                          <span className="text-xs text-gray-500">
                            {appointment.duration}min
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{appointment.patientName}</span>
                            <Badge className={getPriorityColor(appointment.priority)}>
                              {appointment.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Stethoscope className="w-3 h-3" />
                            <span>Dr. {appointment.doctorName}</span>
                            <span>•</span>
                            <span>{appointment.type}</span>
                          </div>
                          {appointment.notes && (
                            <p className="text-xs text-gray-500 mt-1">{appointment.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        
                        {appointment.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus.mutate({
                              id: appointment.id,
                              status: 'confirmed'
                            })}
                          >
                            Confirm
                          </Button>
                        )}
                        
                        {appointment.status === 'confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => updateAppointmentStatus.mutate({
                              id: appointment.id,
                              status: 'in-progress'
                            })}
                          >
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Book Appointment Modal */}
      {isBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Schedule New Appointment</h3>
            
            <div className="space-y-4">
              {!patientId && (
                <div>
                  <Label htmlFor="patient">Patient</Label>
                  <Select
                    value={newAppointment.patientId}
                    onValueChange={(value) => setNewAppointment(prev => ({ ...prev, patientId: value }))}
                  >
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
              )}

              <div>
                <Label htmlFor="doctor">Doctor</Label>
                <Select
                  value={newAppointment.doctorId}
                  onValueChange={(value) => setNewAppointment(prev => ({ ...prev, doctorId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor: any) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        Dr. {doctor.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="time">Time</Label>
                <Select
                  value={newAppointment.appointmentTime}
                  onValueChange={(value) => setNewAppointment(prev => ({ ...prev, appointmentTime: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTimeSlots().map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select
                  value={newAppointment.duration}
                  onValueChange={(value) => setNewAppointment(prev => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Appointment Type</Label>
                <Select
                  value={newAppointment.type}
                  onValueChange={(value) => setNewAppointment(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="check-up">Check-up</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="vaccination">Vaccination</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newAppointment.priority}
                  onValueChange={(value) => setNewAppointment(prev => ({ ...prev, priority: value }))}
                >
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

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsBooking(false)}>
                Cancel
              </Button>
              <Button onClick={handleBookAppointment} disabled={bookAppointmentMutation.isPending}>
                {bookAppointmentMutation.isPending ? "Scheduling..." : "Schedule Appointment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Appointments Preview */}
      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{appointment.patientName}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                    </span>
                  </div>
                  <Badge className={getPriorityColor(appointment.priority)}>
                    {appointment.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}