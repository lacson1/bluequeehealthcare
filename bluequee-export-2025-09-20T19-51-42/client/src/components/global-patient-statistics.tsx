
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, Calendar, TrendingUp } from 'lucide-react';

interface GlobalPatientStatistics {
  totalPatients: number;
  organizationDistribution: Array<{
    organizationId: number;
    organizationName: string;
    patientCount: number;
  }>;
  recentPatients: Array<{
    id: number;
    name: string;
    organizationName: string;
    organizationId: number;
    createdAt: string;
    createdDate: string;
  }>;
}

export default function GlobalPatientStatistics() {
  const { data: stats, isLoading, error } = useQuery<GlobalPatientStatistics>({
    queryKey: ['/api/patients/global-statistics'],
    queryFn: () => fetch('/api/patients/global-statistics').then(res => {
      if (!res.ok) throw new Error('Failed to fetch global statistics');
      return res.json();
    })
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

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <p className="text-red-600">Error loading global patient statistics. You may not have permission to view this data.</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return <div>No global patient data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Global Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Users className="h-6 w-6" />
            Global Patient Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-900 mb-2">
            {stats.totalPatients.toLocaleString()}
          </div>
          <p className="text-blue-700">Total Patients Across All Organizations</p>
          <div className="mt-4 text-sm text-blue-600">
            Distributed across {stats.organizationDistribution.length} organizations
          </div>
        </CardContent>
      </Card>

      {/* Organization Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Patient Distribution by Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.organizationDistribution.map((org, index) => (
              <div key={org.organizationId} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-700">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {org.organizationName || `Organization ${org.organizationId}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {org.organizationId}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {org.patientCount} patients
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    {((org.patientCount / stats.totalPatients) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Patients Across All Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Patients (All Organizations)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recentPatients.slice(0, 10).map((patient) => (
              <div key={patient.id} className="flex items-center justify-between p-2 rounded border border-gray-100 hover:bg-gray-50">
                <div>
                  <div className="font-medium text-sm">{patient.name}</div>
                  <div className="text-xs text-gray-500">{patient.organizationName}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">{patient.createdDate}</div>
                  <Badge variant="outline" className="text-xs">
                    ID: {patient.id}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-800 mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="font-semibold">System Insights</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
            <div>
              <strong>Largest Organization:</strong> {' '}
              {stats.organizationDistribution[0]?.organizationName} ({stats.organizationDistribution[0]?.patientCount} patients)
            </div>
            <div>
              <strong>Average per Organization:</strong> {' '}
              {(stats.totalPatients / stats.organizationDistribution.length).toFixed(1)} patients
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
