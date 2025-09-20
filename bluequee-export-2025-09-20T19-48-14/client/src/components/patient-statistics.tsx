
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Clock, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PatientStatistics {
  totalPatients: number;
  patientsThisMonth: number;
  patientsThisWeek: number;
  patients: Array<{
    id: number;
    name: string;
    phone: string;
    email: string;
    gender: string;
    dateOfBirth: string;
    createdAt: string;
    createdDate: string;
    createdTime: string;
  }>;
}

export default function PatientStatistics() {
  const { data: stats, isLoading } = useQuery<PatientStatistics>({
    queryKey: ['/api/patients/statistics'],
    queryFn: () => apiRequest('/api/patients/statistics')
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div>No patient data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Patients</p>
                <p className="text-2xl font-bold text-blue-800">{stats.totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">This Month</p>
                <p className="text-2xl font-bold text-green-800">{stats.patientsThisMonth}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">This Week</p>
                <p className="text-2xl font-bold text-purple-800">{stats.patientsThisWeek}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Growth Rate</p>
                <p className="text-2xl font-bold text-orange-800">
                  {stats.totalPatients > 0 ? Math.round((stats.patientsThisMonth / stats.totalPatients) * 100) : 0}%
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Patient List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Patient Registration Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.patients.map((patient, index) => (
              <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{patient.id}</Badge>
                  <div>
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-gray-600">
                      {patient.phone} • {patient.gender} • Born: {patient.dateOfBirth}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">
                    {patient.createdDate}
                  </div>
                  <div className="text-xs text-gray-500">
                    {patient.createdTime}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
