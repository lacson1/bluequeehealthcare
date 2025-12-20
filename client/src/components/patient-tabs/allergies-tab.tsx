import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, XCircle } from "lucide-react";
import { Patient } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";

interface Allergy {
  id: number;
  patientId: number;
  allergen: string;
  reaction?: string;
  severity?: string;
  onsetDate?: string;
  notes?: string;
  createdAt: string;
}

interface AllergiesTabProps {
  patient: Patient;
}

export function AllergiesTab({ patient }: AllergiesTabProps) {
  const { data: allergies, isLoading } = useQuery<Allergy[]>({
    queryKey: [`/api/patients/${patient.id}/allergies`],
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

  if (!allergies || allergies.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No Allergies Recorded"
        description="No allergies or adverse reactions have been documented for this patient."
      />
    );
  }

  return (
    <div className="space-y-4">
      {allergies.map((allergy) => (
        <Card key={allergy.id} className="border-red-200 bg-red-50/50 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                {allergy.allergen}
              </CardTitle>
              {allergy.severity && (
                <Badge
                  variant={allergy.severity === "severe" ? "destructive" : "secondary"}
                >
                  {allergy.severity}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {allergy.reaction && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Reaction</h4>
                <p className="text-sm text-gray-600">{allergy.reaction}</p>
              </div>
            )}

            {allergy.onsetDate && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Onset: {format(new Date(allergy.onsetDate), "MMM d, yyyy")}</span>
              </div>
            )}

            {allergy.notes && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Notes</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{allergy.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

