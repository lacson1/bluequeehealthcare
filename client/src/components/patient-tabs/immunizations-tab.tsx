import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Syringe, Calendar, CheckCircle } from "lucide-react";
import { Patient } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";

interface Vaccination {
  id: number;
  patientId: number;
  vaccineName: string;
  vaccineType?: string;
  administrationDate: string;
  doseNumber?: number;
  lotNumber?: string;
  manufacturer?: string;
  administeredBy?: string;
  site?: string;
  route?: string;
  nextDueDate?: string;
  notes?: string;
}

interface ImmunizationsTabProps {
  patient: Patient;
}

export function ImmunizationsTab({ patient }: ImmunizationsTabProps) {
  const { data: vaccinations, isLoading } = useQuery<Vaccination[]>({
    queryKey: [`/api/patients/${patient.id}/vaccinations`],
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

  if (!vaccinations || vaccinations.length === 0) {
    return (
      <EmptyState
        icon={Syringe}
        title="No Immunizations"
        description="No immunizations have been recorded for this patient yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {vaccinations.map((vaccination) => (
        <Card key={vaccination.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Syringe className="h-5 w-5 text-green-600" />
                {vaccination.vaccineName}
              </CardTitle>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(vaccination.administrationDate), "MMM d, yyyy")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {vaccination.vaccineType && (
                <div>
                  <span className="text-xs text-gray-500">Type</span>
                  <p className="text-sm font-medium">{vaccination.vaccineType}</p>
                </div>
              )}
              {vaccination.doseNumber && (
                <div>
                  <span className="text-xs text-gray-500">Dose</span>
                  <p className="text-sm font-medium">#{vaccination.doseNumber}</p>
                </div>
              )}
              {vaccination.manufacturer && (
                <div>
                  <span className="text-xs text-gray-500">Manufacturer</span>
                  <p className="text-sm font-medium">{vaccination.manufacturer}</p>
                </div>
              )}
              {vaccination.lotNumber && (
                <div>
                  <span className="text-xs text-gray-500">Lot Number</span>
                  <p className="text-sm font-medium">{vaccination.lotNumber}</p>
                </div>
              )}
              {vaccination.site && (
                <div>
                  <span className="text-xs text-gray-500">Site</span>
                  <p className="text-sm font-medium">{vaccination.site}</p>
                </div>
              )}
              {vaccination.route && (
                <div>
                  <span className="text-xs text-gray-500">Route</span>
                  <p className="text-sm font-medium">{vaccination.route}</p>
                </div>
              )}
            </div>
            {vaccination.nextDueDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <div>
                  <span className="text-xs text-blue-600 font-medium">Next Due</span>
                  <p className="text-sm text-blue-700">
                    {format(new Date(vaccination.nextDueDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
            {vaccination.administeredBy && (
              <div className="text-xs text-gray-500">
                Administered by: {vaccination.administeredBy}
              </div>
            )}
            {vaccination.notes && (
              <div>
                <span className="text-xs text-gray-500">Notes</span>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{vaccination.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

