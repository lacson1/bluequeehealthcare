import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Calendar, Stethoscope, ArrowRight } from "lucide-react";
import { Patient } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";

interface CarePlan {
  id: number;
  visitDate: string;
  treatment: string | null;
  diagnosis: string | null;
  followUpDate: string | null;
  visitType: string;
  doctorId: number | null;
}

interface CarePlansTabProps {
  patient: Patient;
}

export function CarePlansTab({ patient }: CarePlansTabProps) {
  const { data: carePlans, isLoading } = useQuery<CarePlan[]>({
    queryKey: [`/api/patients/${patient.id}/care-plans`],
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

  if (!carePlans || carePlans.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No Care Plans"
        description="No care plans have been documented for this patient yet."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-green-600" />
            Care Plans
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Treatment plans and care documentation from patient visits
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {carePlans.length} {carePlans.length === 1 ? 'Plan' : 'Plans'}
        </Badge>
      </div>

      {/* Care Plans List */}
      <div className="space-y-4">
        {carePlans.map((plan) => (
          <Card key={plan.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-green-600" />
                  Care Plan
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {plan.visitType && (
                    <Badge variant="outline" className="capitalize">
                      {plan.visitType}
                    </Badge>
                  )}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(plan.visitDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.diagnosis && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    Diagnosis
                  </h4>
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <Badge variant="secondary" className="text-sm font-medium">{plan.diagnosis}</Badge>
                  </div>
                </div>
              )}

              {plan.treatment && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-green-600" />
                    Treatment Plan
                  </h4>
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{plan.treatment}</p>
                  </div>
                </div>
              )}

              {plan.followUpDate && (
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Follow-up Date: <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {new Date(plan.followUpDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

