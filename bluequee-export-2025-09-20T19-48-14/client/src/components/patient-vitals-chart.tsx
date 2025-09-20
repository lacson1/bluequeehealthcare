import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Heart, Thermometer } from 'lucide-react';

interface VitalSign {
  date: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
}

interface PatientVitalsChartProps {
  vitals: VitalSign[];
  className?: string;
}

export const PatientVitalsChart: React.FC<PatientVitalsChartProps> = ({ 
  vitals, 
  className = "" 
}) => {
  // Get the most recent vital signs
  const latestVitals = vitals && vitals.length > 0 ? vitals[0] : null;
  
  // Simple trend calculation (comparing last two readings)
  const getTrend = (current: number | undefined, previous: number | undefined) => {
    if (!current || !previous) return 'stable';
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  const getVitalStatus = (value: number | undefined, normalRange: [number, number]) => {
    if (!value) return 'unknown';
    if (value < normalRange[0]) return 'low';
    if (value > normalRange[1]) return 'high';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-50 border-green-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!vitals || vitals.length === 0) {
    return (
      <Card className={`bg-white shadow-sm border-0 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Vital Signs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No vital signs recorded</p>
            <p className="text-sm text-gray-400 mt-1">Record a visit to track vital signs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const heartRateStatus = getVitalStatus(latestVitals?.heartRate, [60, 100]);
  const previousHeartRate = vitals.length > 1 ? vitals[1].heartRate : undefined;
  const heartRateTrend = getTrend(latestVitals?.heartRate, previousHeartRate);

  return (
    <Card className={`bg-white shadow-sm border-0 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-blue-600" />
          Latest Vital Signs
        </CardTitle>
        {latestVitals && (
          <p className="text-sm text-gray-500">
            Recorded on {new Date(latestVitals.date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Blood Pressure */}
        {latestVitals?.bloodPressure && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Blood Pressure</p>
                <p className="text-lg font-semibold text-gray-700">{latestVitals.bloodPressure}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200">
              Normal
            </Badge>
          </div>
        )}

        {/* Heart Rate */}
        {latestVitals?.heartRate && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Activity className="h-4 w-4 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Heart Rate</p>
                <div className="flex items-center space-x-2">
                  <p className="text-lg font-semibold text-gray-700">{latestVitals.heartRate} bpm</p>
                  <TrendIcon trend={heartRateTrend} />
                </div>
              </div>
            </div>
            <Badge variant="outline" className={getStatusColor(heartRateStatus)}>
              {heartRateStatus === 'normal' ? 'Normal' : 
               heartRateStatus === 'high' ? 'High' : 
               heartRateStatus === 'low' ? 'Low' : 'Unknown'}
            </Badge>
          </div>
        )}

        {/* Temperature */}
        {latestVitals?.temperature && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Thermometer className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Temperature</p>
                <p className="text-lg font-semibold text-gray-700">{latestVitals.temperature}°C</p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200">
              Normal
            </Badge>
          </div>
        )}

        {/* Weight */}
        {latestVitals?.weight && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Weight</p>
                <p className="text-lg font-semibold text-gray-700">{latestVitals.weight} kg</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{vitals.length}</p>
              <p className="text-sm text-gray-500">Total Records</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {vitals.filter(v => v.heartRate && v.heartRate >= 60 && v.heartRate <= 100).length}
              </p>
              <p className="text-sm text-gray-500">Normal Readings</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientVitalsChart;