import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Stethoscope, User, FileText } from "lucide-react";
import { Patient, Visit } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";

interface VisitsTabProps {
  patient: Patient;
}

export function VisitsTab({ patient }: VisitsTabProps) {
  const { data: visits, isLoading } = useQuery<Visit[]>({
    queryKey: [`/api/patients/${patient.id}/visits`],
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

  if (!visits || visits.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No Visits"
        description="No visits have been recorded for this patient yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {visits.map((visit) => (
        <Card key={visit.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                {visit.visitType || "Visit"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(visit.visitDate), "MMM d, yyyy")}
                </Badge>
                {visit.status && (
                  <Badge variant={visit.status === "final" ? "default" : "secondary"}>
                    {visit.status}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {visit.complaint && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Chief Complaint</h4>
                <p className="text-sm text-gray-600">{visit.complaint}</p>
              </div>
            )}

            {(visit.bloodPressure || visit.heartRate || visit.temperature || visit.weight) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {visit.bloodPressure && (
                  <div>
                    <span className="text-xs text-gray-500">BP</span>
                    <p className="text-sm font-medium">{visit.bloodPressure}</p>
                  </div>
                )}
                {visit.heartRate && (
                  <div>
                    <span className="text-xs text-gray-500">HR</span>
                    <p className="text-sm font-medium">{visit.heartRate} bpm</p>
                  </div>
                )}
                {visit.temperature && (
                  <div>
                    <span className="text-xs text-gray-500">Temp</span>
                    <p className="text-sm font-medium">{visit.temperature}°C</p>
                  </div>
                )}
                {visit.weight && (
                  <div>
                    <span className="text-xs text-gray-500">Weight</span>
                    <p className="text-sm font-medium">{visit.weight} kg</p>
                  </div>
                )}
              </div>
            )}

            {visit.diagnosis && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Diagnosis</h4>
                <Badge variant="secondary">{visit.diagnosis}</Badge>
              </div>
            )}

            {visit.treatment && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Treatment</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{visit.treatment}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

