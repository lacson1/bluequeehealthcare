import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  Activity, 
  Thermometer, 
  Droplets,
  X,
  Calendar,
  AlertTriangle
} from "lucide-react";

interface VitalSignsTrendsProps {
  patientId: number;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface VitalSignRecord {
  id: number;
  recordedAt: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  weight?: number;
  height?: number;
  recordedBy: string;
}

export default function VitalSignsTrends({ 
  patientId, 
  patientName, 
  isOpen, 
  onClose 
}: VitalSignsTrendsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  
  const { data: vitalSigns = [], isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/vitals`],
    enabled: isOpen,
  });

  // Process data for charts
  const processedData = vitalSigns
    .filter((vital: VitalSignRecord) => {
      const recordDate = new Date(vital.recordedAt);
      const now = new Date();
      const daysAgo = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      return recordDate >= cutoffDate;
    })
    .sort((a: VitalSignRecord, b: VitalSignRecord) => 
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    )
    .map((vital: VitalSignRecord) => ({
      ...vital,
      date: new Date(vital.recordedAt).toLocaleDateString(),
      time: new Date(vital.recordedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      dateTime: new Date(vital.recordedAt).toLocaleString()
    }));

  // Calculate trends
  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 'stable';
    const recent = values.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, values.length);
    const older = values.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, values.length - 3);
    const change = ((recent - older) / older) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  };

  const bpSystolicValues = processedData
    .filter(d => d.bloodPressureSystolic)
    .map(d => d.bloodPressureSystolic!);
  const heartRateValues = processedData
    .filter(d => d.heartRate)
    .map(d => d.heartRate!);
  const temperatureValues = processedData
    .filter(d => d.temperature)
    .map(d => d.temperature!);

  const trends = {
    bloodPressure: calculateTrend(bpSystolicValues),
    heartRate: calculateTrend(heartRateValues),
    temperature: calculateTrend(temperatureValues)
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'temperature' ? '°C' : 
               entry.dataKey.includes('bloodPressure') ? ' mmHg' :
               entry.dataKey === 'heartRate' ? ' bpm' :
               entry.dataKey === 'oxygenSaturation' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl">Vital Signs Trends</span>
              <p className="text-sm font-normal text-gray-600 mt-1">{patientName}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Time Range Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Time Range:</span>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { value: '7d', label: '7 Days' },
                { value: '30d', label: '30 Days' },
                { value: '90d', label: '90 Days' }
              ].map((option) => (
                <Button
                  key={option.value}
                  onClick={() => setSelectedTimeRange(option.value)}
                  variant={selectedTimeRange === option.value ? "default" : "ghost"}
                  size="sm"
                  className={`${
                    selectedTimeRange === option.value 
                      ? 'bg-white shadow-sm' 
                      : 'hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Trend Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-gray-900">Blood Pressure</span>
                  </div>
                  <Badge className={`${
                    trends.bloodPressure === 'increasing' ? 'bg-red-100 text-red-700 border-red-200' :
                    trends.bloodPressure === 'decreasing' ? 'bg-green-100 text-green-700 border-green-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {trends.bloodPressure === 'increasing' && <TrendingUp className="w-3 h-3 mr-1" />}
                    {trends.bloodPressure === 'decreasing' && <TrendingDown className="w-3 h-3 mr-1" />}
                    {trends.bloodPressure}
                  </Badge>
                </div>
                {bpSystolicValues.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Latest: {bpSystolicValues[bpSystolicValues.length - 1]} mmHg (systolic)
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-pink-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-pink-600" />
                    <span className="font-medium text-gray-900">Heart Rate</span>
                  </div>
                  <Badge className={`${
                    trends.heartRate === 'increasing' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    trends.heartRate === 'decreasing' ? 'bg-green-100 text-green-700 border-green-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {trends.heartRate === 'increasing' && <TrendingUp className="w-3 h-3 mr-1" />}
                    {trends.heartRate === 'decreasing' && <TrendingDown className="w-3 h-3 mr-1" />}
                    {trends.heartRate}
                  </Badge>
                </div>
                {heartRateValues.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Latest: {heartRateValues[heartRateValues.length - 1]} bpm
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-gray-900">Temperature</span>
                  </div>
                  <Badge className={`${
                    trends.temperature === 'increasing' ? 'bg-red-100 text-red-700 border-red-200' :
                    trends.temperature === 'decreasing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {trends.temperature === 'increasing' && <TrendingUp className="w-3 h-3 mr-1" />}
                    {trends.temperature === 'decreasing' && <TrendingDown className="w-3 h-3 mr-1" />}
                    {trends.temperature}
                  </Badge>
                </div>
                {temperatureValues.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Latest: {temperatureValues[temperatureValues.length - 1]}°C
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="bloodPressure" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="bloodPressure">Blood Pressure</TabsTrigger>
              <TabsTrigger value="heartRate">Heart Rate</TabsTrigger>
              <TabsTrigger value="temperature">Temperature</TabsTrigger>
              <TabsTrigger value="oxygen">Oxygen Saturation</TabsTrigger>
            </TabsList>

            <TabsContent value="bloodPressure">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    Blood Pressure Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={processedData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          stroke="#666"
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          stroke="#666"
                          domain={['dataMin - 10', 'dataMax + 10']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        
                        {/* Reference lines for normal ranges */}
                        <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="5 5" label="Normal Systolic" />
                        <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" label="Normal Diastolic" />
                        <ReferenceLine y={140} stroke="#f59e0b" strokeDasharray="5 5" label="High Systolic" />
                        <ReferenceLine y={90} stroke="#f59e0b" strokeDasharray="5 5" label="High Diastolic" />
                        
                        <Line 
                          type="monotone" 
                          dataKey="bloodPressureSystolic" 
                          stroke="#dc2626" 
                          strokeWidth={3}
                          dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                          name="Systolic"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="bloodPressureDiastolic" 
                          stroke="#b91c1c" 
                          strokeWidth={3}
                          dot={{ fill: '#b91c1c', strokeWidth: 2, r: 4 }}
                          name="Diastolic"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="heartRate">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-pink-600" />
                    Heart Rate Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={processedData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          stroke="#666"
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          stroke="#666"
                          domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        
                        {/* Reference lines for heart rate ranges */}
                        <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="5 5" label="Min Normal" />
                        <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="5 5" label="Max Normal" />
                        
                        <Area
                          type="monotone"
                          dataKey="heartRate"
                          stroke="#ec4899"
                          fill="#fce7f3"
                          strokeWidth={3}
                          name="Heart Rate"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="temperature">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-orange-600" />
                    Temperature Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={processedData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          stroke="#666"
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          stroke="#666"
                          domain={[35, 40]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        
                        {/* Reference lines for temperature ranges */}
                        <ReferenceLine y={36.1} stroke="#22c55e" strokeDasharray="5 5" label="Normal Min" />
                        <ReferenceLine y={37.2} stroke="#22c55e" strokeDasharray="5 5" label="Normal Max" />
                        <ReferenceLine y={38} stroke="#ef4444" strokeDasharray="5 5" label="Fever" />
                        
                        <Line 
                          type="monotone" 
                          dataKey="temperature" 
                          stroke="#f97316" 
                          strokeWidth={3}
                          dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                          name="Temperature"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="oxygen">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    Oxygen Saturation Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={processedData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          stroke="#666"
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          stroke="#666"
                          domain={[85, 100]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        
                        {/* Reference lines for oxygen saturation */}
                        <ReferenceLine y={95} stroke="#22c55e" strokeDasharray="5 5" label="Normal Min" />
                        <ReferenceLine y={90} stroke="#f59e0b" strokeDasharray="5 5" label="Low" />
                        <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="5 5" label="Critical" />
                        
                        <Area
                          type="monotone"
                          dataKey="oxygenSaturation"
                          stroke="#2563eb"
                          fill="#dbeafe"
                          strokeWidth={3}
                          name="Oxygen Saturation"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Historical Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Measurements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date & Time</th>
                      <th className="text-left p-2">Blood Pressure</th>
                      <th className="text-left p-2">Heart Rate</th>
                      <th className="text-left p-2">Temperature</th>
                      <th className="text-left p-2">O2 Sat</th>
                      <th className="text-left p-2">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.slice(-10).reverse().map((vital: any) => (
                      <tr key={vital.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{vital.dateTime}</td>
                        <td className="p-2">
                          {vital.bloodPressureSystolic && vital.bloodPressureDiastolic
                            ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`
                            : '--'
                          }
                        </td>
                        <td className="p-2">{vital.heartRate || '--'} {vital.heartRate && 'bpm'}</td>
                        <td className="p-2">{vital.temperature || '--'} {vital.temperature && '°C'}</td>
                        <td className="p-2">{vital.oxygenSaturation || '--'} {vital.oxygenSaturation && '%'}</td>
                        <td className="p-2 text-gray-600">{vital.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}