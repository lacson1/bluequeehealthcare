import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, TestTube, Pill, Activity, AlertTriangle } from "lucide-react";
import { Patient } from "@shared/schema";
import { format } from "date-fns";

interface OverviewTabProps {
  patient: Patient;
}

export function OverviewTab({ patient }: OverviewTabProps) {
  // Fetch summary data
  const { data: visits } = useQuery({
    queryKey: [`/api/patients/${patient.id}/visits`],
    enabled: !!patient.id,
  });

  const { data: prescriptions } = useQuery({
    queryKey: [`/api/patients/${patient.id}/prescriptions`],
    enabled: !!patient.id,
  });

  const { data: labResults } = useQuery({
    queryKey: [`/api/patients/${patient.id}/lab-results`],
    enabled: !!patient.id,
  });

  const { data: vitals } = useQuery({
    queryKey: [`/api/patients/${patient.id}/vitals`],
    enabled: !!patient.id,
  });

  const { data: allergies } = useQuery({
    queryKey: [`/api/patients/${patient.id}/allergies`],
    enabled: !!patient.id,
  });

  const { data: appointments } = useQuery({
    queryKey: [`/api/patients/${patient.id}/appointments`],
    enabled: !!patient.id,
  });

  const activePrescriptions = prescriptions?.filter((p: any) => p.status === "active") || [];
  const upcomingAppointments = appointments?.filter(
    (a: any) => new Date(a.appointmentDate) >= new Date() && a.status !== "cancelled"
  ) || [];
  const recentVisits = visits?.slice(0, 3) || [];
  const recentLabs = labResults?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Patient Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-gray-500">Date of Birth</span>
              <p className="text-sm font-medium">
                {patient.dateOfBirth ? format(new Date(patient.dateOfBirth), "MMM d, yyyy") : "N/A"}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Age</span>
              <p className="text-sm font-medium">
                {patient.dateOfBirth
                  ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years`
                  : "N/A"}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Gender</span>
              <p className="text-sm font-medium capitalize">{patient.gender || "N/A"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Phone</span>
              <p className="text-sm font-medium">{patient.phone || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Visits</p>
                <p className="text-2xl font-bold">{visits?.length || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Medications</p>
                <p className="text-2xl font-bold">{activePrescriptions.length}</p>
              </div>
              <Pill className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Lab Results</p>
                <p className="text-2xl font-bold">{labResults?.length || 0}</p>
              </div>
              <TestTube className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Upcoming Appointments</p>
                <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allergies Alert */}
      {allergies && allergies.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Allergies & Reactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(allergies) ? allergies : []).map((allergy: any) => (
                <Badge key={allergy.id} variant="destructive">
                  {allergy.allergen}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Visits */}
      {recentVisits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(Array.isArray(recentVisits) ? recentVisits : []).map((visit: any) => (
                <div key={visit.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{visit.visitType || "Visit"}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(visit.visitDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  {visit.diagnosis && (
                    <Badge variant="secondary">{visit.diagnosis}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Lab Results */}
      {recentLabs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Recent Lab Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(Array.isArray(recentLabs) ? recentLabs : []).map((lab: any) => (
                <div key={lab.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{lab.testName || lab.testType}</p>
                    {lab.resultDate && (
                      <p className="text-sm text-gray-500">
                        {format(new Date(lab.resultDate), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      lab.status === "abnormal" || lab.isAbnormal ? "destructive" : "default"
                    }
                  >
                    {lab.status || (lab.isAbnormal ? "Abnormal" : "Normal")}
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

