import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  Thermometer, 
  Activity, 
  Gauge, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VitalSigns {
  id: number;
  patientId: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  weight: number;
  height: number;
  recordedAt: string;
  recordedBy: string;
}

interface PatientVitalSignsTrackerProps {
  patientId: number;
}

export default function PatientVitalSignsTracker({ patientId }: PatientVitalSignsTrackerProps) {
  const [isAddingVitals, setIsAddingVitals] = useState(false);
  const [newVitals, setNewVitals] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vitals = [], isLoading } = useQuery<VitalSigns[]>({
    queryKey: [`/api/patients/${patientId}/vitals`],
    enabled: !!patientId,
  });

  const addVitalsMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/patients/${patientId}/vitals`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/vitals`] });
      queryClient.refetchQueries({ queryKey: [`/api/patients/${patientId}/vitals`] });
      setIsAddingVitals(false);
      setNewVitals({
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        temperature: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        weight: '',
        height: ''
      });
      toast({
        title: "Success",
        description: "Vital signs recorded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record vital signs",
        variant: "destructive",
      });
    },
  });

  const handleAddVitals = () => {
    const vitalsData = {
      bloodPressureSystolic: newVitals.bloodPressureSystolic ? parseInt(newVitals.bloodPressureSystolic) : null,
      bloodPressureDiastolic: newVitals.bloodPressureDiastolic ? parseInt(newVitals.bloodPressureDiastolic) : null,
      heartRate: newVitals.heartRate ? parseInt(newVitals.heartRate) : null,
      temperature: newVitals.temperature ? parseFloat(newVitals.temperature) : null,
      respiratoryRate: newVitals.respiratoryRate ? parseInt(newVitals.respiratoryRate) : null,
      oxygenSaturation: newVitals.oxygenSaturation ? parseInt(newVitals.oxygenSaturation) : null,
      weight: newVitals.weight ? parseFloat(newVitals.weight) : null,
      height: newVitals.height ? parseFloat(newVitals.height) : null
    };

    addVitalsMutation.mutate(vitalsData);
  };

  const getVitalStatus = (type: string, value: number) => {
    switch (type) {
      case 'bloodPressure':
        const systolic = vitals[0]?.bloodPressureSystolic || 0;
        const diastolic = vitals[0]?.bloodPressureDiastolic || 0;
        if (systolic > 140 || diastolic > 90) return { status: 'high', color: 'text-red-600' };
        if (systolic < 90 || diastolic < 60) return { status: 'low', color: 'text-blue-600' };
        return { status: 'normal', color: 'text-green-600' };
      
      case 'heartRate':
        if (value > 100) return { status: 'high', color: 'text-red-600' };
        if (value < 60) return { status: 'low', color: 'text-blue-600' };
        return { status: 'normal', color: 'text-green-600' };
      
      case 'temperature':
        if (value > 38) return { status: 'fever', color: 'text-red-600' };
        if (value < 36) return { status: 'low', color: 'text-blue-600' };
        return { status: 'normal', color: 'text-green-600' };
      
      case 'oxygenSaturation':
        if (value < 95) return { status: 'low', color: 'text-red-600' };
        return { status: 'normal', color: 'text-green-600' };
      
      default:
        return { status: 'normal', color: 'text-green-600' };
    }
  };

  const latestVitals = vitals[0];
  const chartData = vitals.slice(0, 7).reverse().map((vital, index) => ({
    date: new Date(vital.recordedAt).toLocaleDateString(),
    systolic: vital.bloodPressureSystolic,
    diastolic: vital.bloodPressureDiastolic,
    heartRate: vital.heartRate,
    temperature: vital.temperature,
    oxygenSat: vital.oxygenSaturation
  }));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Vital Signs Monitor
        </CardTitle>
        <Button
          onClick={() => setIsAddingVitals(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Record Vitals
        </Button>
      </CardHeader>
      <CardContent>
        {/* Current Vitals Overview */}
        {latestVitals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-5 h-5 text-red-600" />
                <Badge variant="outline" className={getVitalStatus('bloodPressure', 0).color}>
                  {getVitalStatus('bloodPressure', 0).status}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic}
              </div>
              <div className="text-sm text-gray-600">Blood Pressure</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-5 h-5 text-blue-600" />
                <Badge variant="outline" className={getVitalStatus('heartRate', latestVitals.heartRate).color}>
                  {getVitalStatus('heartRate', latestVitals.heartRate).status}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {latestVitals.heartRate}
              </div>
              <div className="text-sm text-gray-600">Heart Rate (bpm)</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Thermometer className="w-5 h-5 text-orange-600" />
                <Badge variant="outline" className={getVitalStatus('temperature', latestVitals.temperature).color}>
                  {getVitalStatus('temperature', latestVitals.temperature).status}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {latestVitals.temperature}°C
              </div>
              <div className="text-sm text-gray-600">Temperature</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Gauge className="w-5 h-5 text-green-600" />
                <Badge variant="outline" className={getVitalStatus('oxygenSaturation', latestVitals.oxygenSaturation).color}>
                  {getVitalStatus('oxygenSaturation', latestVitals.oxygenSaturation).status}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {latestVitals.oxygenSaturation}%
              </div>
              <div className="text-sm text-gray-600">Oxygen Saturation</div>
            </div>
          </div>
        )}

        {/* Charts and History */}
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trends" className="space-y-4">
            {chartData.length > 1 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} name="Systolic BP" />
                    <Line type="monotone" dataKey="heartRate" stroke="#3b82f6" strokeWidth={2} name="Heart Rate" />
                    <Line type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} name="Temperature" />
                    <Line type="monotone" dataKey="oxygenSaturation" stroke="#10b981" strokeWidth={2} name="Oxygen Saturation" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Need at least 2 recordings to show trends
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {vitals.map((vital) => (
                <div key={vital.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      {new Date(vital.recordedAt).toLocaleDateString()} {new Date(vital.recordedAt).toLocaleTimeString()}
                    </div>
                    <div className="text-sm">
                      BP: {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic} | 
                      HR: {vital.heartRate} | 
                      Temp: {vital.temperature}°C | 
                      O2: {vital.oxygenSaturation}%
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    by {vital.recordedBy}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Vitals Modal */}
        {isAddingVitals && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Record Vital Signs</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="systolic">Systolic BP</Label>
                  <Input
                    id="systolic"
                    type="number"
                    placeholder="120"
                    value={newVitals.bloodPressureSystolic}
                    onChange={(e) => setNewVitals(prev => ({ ...prev, bloodPressureSystolic: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="diastolic">Diastolic BP</Label>
                  <Input
                    id="diastolic"
                    type="number"
                    placeholder="80"
                    value={newVitals.bloodPressureDiastolic}
                    onChange={(e) => setNewVitals(prev => ({ ...prev, bloodPressureDiastolic: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="heartRate">Heart Rate</Label>
                  <Input
                    id="heartRate"
                    type="number"
                    placeholder="72"
                    value={newVitals.heartRate}
                    onChange={(e) => setNewVitals(prev => ({ ...prev, heartRate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder="36.5"
                    value={newVitals.temperature}
                    onChange={(e) => setNewVitals(prev => ({ ...prev, temperature: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="respiratoryRate">Respiratory Rate</Label>
                  <Input
                    id="respiratoryRate"
                    type="number"
                    placeholder="16"
                    value={newVitals.respiratoryRate}
                    onChange={(e) => setNewVitals(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="oxygenSaturation">Oxygen Saturation (%)</Label>
                  <Input
                    id="oxygenSaturation"
                    type="number"
                    placeholder="98"
                    value={newVitals.oxygenSaturation}
                    onChange={(e) => setNewVitals(prev => ({ ...prev, oxygenSaturation: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    value={newVitals.weight}
                    onChange={(e) => setNewVitals(prev => ({ ...prev, weight: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    value={newVitals.height}
                    onChange={(e) => setNewVitals(prev => ({ ...prev, height: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsAddingVitals(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVitals} disabled={addVitalsMutation.isPending}>
                  {addVitalsMutation.isPending ? "Recording..." : "Record Vitals"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}