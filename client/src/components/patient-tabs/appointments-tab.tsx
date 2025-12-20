import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User, MapPin } from "lucide-react";
import { Patient } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";

interface Appointment {
  id: number;
  patientId: number;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason?: string;
  providerName?: string;
  notes?: string;
}

interface AppointmentsTabProps {
  patient: Patient;
}

export function AppointmentsTab({ patient }: AppointmentsTabProps) {
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: [`/api/patients/${patient.id}/appointments`],
    enabled: !!patient.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No Appointments"
        description="No appointments have been scheduled for this patient."
      />
    );
  }

  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.appointmentDate) >= new Date() && apt.status !== "cancelled"
  );
  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.appointmentDate) < new Date() || apt.status === "cancelled"
  );

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
      case "confirmed":
        return <Badge className="bg-blue-600">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {upcomingAppointments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Upcoming Appointments ({upcomingAppointments.length})
          </h3>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-blue-600" />
                      {format(new Date(appointment.appointmentDate), "EEEE, MMMM d, yyyy")}
                    </CardTitle>
                    {getStatusBadge(appointment.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {appointment.appointmentTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{appointment.appointmentTime}</span>
                    </div>
                  )}
                  {appointment.providerName && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{appointment.providerName}</span>
                    </div>
                  )}
                  {appointment.reason && (
                    <div>
                      <span className="text-xs text-gray-500">Reason</span>
                      <p className="text-sm text-gray-700">{appointment.reason}</p>
                    </div>
                  )}
                  {appointment.notes && (
                    <div>
                      <span className="text-xs text-gray-500">Notes</span>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{appointment.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pastAppointments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Past Appointments ({pastAppointments.length})</h3>
          <div className="space-y-4">
            {pastAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-gray-600" />
                      {format(new Date(appointment.appointmentDate), "MMM d, yyyy")}
                    </CardTitle>
                    {getStatusBadge(appointment.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {appointment.appointmentTime && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{appointment.appointmentTime}</span>
                    </div>
                  )}
                  {appointment.providerName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>{appointment.providerName}</span>
                    </div>
                  )}
                  {appointment.reason && (
                    <p className="text-sm text-gray-600">{appointment.reason}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

