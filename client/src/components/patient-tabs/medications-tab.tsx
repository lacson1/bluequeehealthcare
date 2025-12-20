import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, Calendar, Clock, AlertCircle } from "lucide-react";
import { Patient, Prescription } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";

interface MedicationsTabProps {
  patient: Patient;
}

export function MedicationsTab({ patient }: MedicationsTabProps) {
  const { data: prescriptions, isLoading } = useQuery<Prescription[]>({
    queryKey: [`/api/patients/${patient.id}/prescriptions`],
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

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <EmptyState
        icon={Pill}
        title="No Medications"
        description="No medications have been prescribed for this patient yet."
      />
    );
  }

  const activePrescriptions = prescriptions.filter((p) => p.status === "active");
  const inactivePrescriptions = prescriptions.filter((p) => p.status !== "active");

  return (
    <div className="space-y-6">
      {activePrescriptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-green-600" />
            Active Medications ({activePrescriptions.length})
          </h3>
          <div className="space-y-4">
            {activePrescriptions.map((prescription) => (
              <Card key={prescription.id} className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Pill className="h-5 w-5 text-green-600" />
                      {prescription.medicationName}
                    </CardTitle>
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Dosage</span>
                      <p className="text-sm font-medium">{prescription.dosage}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Frequency</span>
                      <p className="text-sm font-medium">{prescription.frequency}</p>
                    </div>
                    {prescription.duration && (
                      <div>
                        <span className="text-xs text-gray-500">Duration</span>
                        <p className="text-sm font-medium">{prescription.duration}</p>
                      </div>
                    )}
                    {prescription.startDate && (
                      <div>
                        <span className="text-xs text-gray-500">Start Date</span>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(prescription.startDate), "MMM d, yyyy")}
                        </p>
                      </div>
                    )}
                  </div>
                  {prescription.instructions && (
                    <div>
                      <span className="text-xs text-gray-500">Instructions</span>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{prescription.instructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {inactivePrescriptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Past Medications ({inactivePrescriptions.length})</h3>
          <div className="space-y-4">
            {inactivePrescriptions.map((prescription) => (
              <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Pill className="h-5 w-5 text-gray-600" />
                      {prescription.medicationName}
                    </CardTitle>
                    <Badge variant="secondary">{prescription.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Dosage</span>
                      <p className="text-sm font-medium">{prescription.dosage}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Frequency</span>
                      <p className="text-sm font-medium">{prescription.frequency}</p>
                    </div>
                  </div>
                  {prescription.endDate && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Ended: {format(new Date(prescription.endDate), "MMM d, yyyy")}
                    </div>
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

