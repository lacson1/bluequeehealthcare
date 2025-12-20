import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestTube, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { Patient, LabResult } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";

interface LabResultsTabProps {
  patient: Patient;
}

export function LabResultsTab({ patient }: LabResultsTabProps) {
  const { data: labResults, isLoading } = useQuery<LabResult[]>({
    queryKey: [`/api/patients/${patient.id}/lab-results`],
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

  if (!labResults || labResults.length === 0) {
    return (
      <EmptyState
        icon={TestTube}
        title="No Lab Results"
        description="No lab results have been recorded for this patient yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {labResults.map((lab) => (
        <Card key={lab.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TestTube className="h-5 w-5 text-purple-600" />
                {lab.testName || lab.testType || "Lab Test"}
              </CardTitle>
              <div className="flex items-center gap-2">
                {lab.resultDate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(lab.resultDate), "MMM d, yyyy")}
                  </Badge>
                )}
                {lab.status && (
                  <Badge
                    variant={
                      lab.status === "abnormal" || lab.isAbnormal
                        ? "destructive"
                        : lab.status === "normal"
                        ? "default"
                        : "secondary"
                    }
                    className="flex items-center gap-1"
                  >
                    {lab.status === "abnormal" || lab.isAbnormal ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    {lab.status || (lab.isAbnormal ? "Abnormal" : "Normal")}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lab.result && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Result</h4>
                <p className="text-lg font-medium">
                  {lab.result} {lab.units && <span className="text-sm text-gray-500">{lab.units}</span>}
                </p>
              </div>
            )}

            {lab.referenceRange && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Reference Range</h4>
                <p className="text-sm text-gray-600">{lab.referenceRange}</p>
              </div>
            )}

            {lab.notes && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Notes</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{lab.notes}</p>
              </div>
            )}

            {lab.dateOrdered && (
              <div className="text-xs text-gray-500">
                Ordered: {format(new Date(lab.dateOrdered), "MMM d, yyyy")}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

