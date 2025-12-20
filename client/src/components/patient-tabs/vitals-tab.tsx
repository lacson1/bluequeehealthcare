import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, TrendingUp } from "lucide-react";
import { Patient } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";

interface VitalSign {
  id: number;
  patientId: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: string;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: string;
  height?: string;
  recordedAt: string;
  recordedBy: string;
}

interface VitalsTabProps {
  patient: Patient;
}

export function VitalsTab({ patient }: VitalsTabProps) {
  const { data: vitals, isLoading } = useQuery<VitalSign[]>({
    queryKey: [`/api/patients/${patient.id}/vitals`],
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

  if (!vitals || vitals.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No Vital Signs"
        description="No vital signs have been recorded for this patient yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {vitals.map((vital) => (
        <Card key={vital.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                Vital Signs
              </CardTitle>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(vital.recordedAt), "MMM d, yyyy HH:mm")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(vital.bloodPressureSystolic || vital.bloodPressureDiastolic) && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500">Blood Pressure</span>
                  <p className="text-lg font-semibold text-blue-700">
                    {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic} mmHg
                  </p>
                </div>
              )}
              {vital.heartRate && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500">Heart Rate</span>
                  <p className="text-lg font-semibold text-red-700">{vital.heartRate} bpm</p>
                </div>
              )}
              {vital.temperature && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500">Temperature</span>
                  <p className="text-lg font-semibold text-orange-700">{vital.temperature}°C</p>
                </div>
              )}
              {vital.respiratoryRate && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500">Respiratory Rate</span>
                  <p className="text-lg font-semibold text-green-700">{vital.respiratoryRate} /min</p>
                </div>
              )}
              {vital.oxygenSaturation && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500">O2 Saturation</span>
                  <p className="text-lg font-semibold text-purple-700">{vital.oxygenSaturation}%</p>
                </div>
              )}
              {vital.weight && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500">Weight</span>
                  <p className="text-lg font-semibold">{vital.weight} kg</p>
                </div>
              )}
              {vital.height && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500">Height</span>
                  <p className="text-lg font-semibold">{vital.height} cm</p>
                </div>
              )}
            </div>
            {vital.recordedBy && (
              <div className="mt-4 text-xs text-gray-500">
                Recorded by: {vital.recordedBy}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

