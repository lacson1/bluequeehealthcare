import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Heart, 
  Thermometer, 
  Activity, 
  Gauge, 
  Weight,
  Ruler,
  Wind,
  Droplets,
  Save,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/components/role-guard";

interface VitalSignsData {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  temperature: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
}

interface StandaloneVitalSignsRecorderProps {
  patientId: number;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StandaloneVitalSignsRecorder({ 
  patientId, 
  patientName, 
  isOpen, 
  onClose 
}: StandaloneVitalSignsRecorderProps) {
  const { toast } = useToast();
  const { user } = useRole();
  const queryClient = useQueryClient();

  const [vitalSigns, setVitalSigns] = useState<VitalSignsData>({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: ''
  });

  const [isRecording, setIsRecording] = useState(false);

  const recordVitalsMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        return await apiRequest('POST', `/api/patients/${patientId}/vitals`, data);
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      setIsRecording(false);
      toast({
        title: "Vital Signs Recorded",
        description: "Patient vital signs have been successfully recorded.",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/vitals`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}`] });
      
      // Reset form and close
      setVitalSigns({
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        temperature: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        weight: '',
        height: ''
      });
      onClose();
    },
    onError: (error: any) => {
      setIsRecording(false);
      console.error('Mutation error:', error);
      toast({
        title: "Error Recording Vitals",
        description: error.message || "Failed to record vital signs. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!vitalSigns.bloodPressureSystolic || !vitalSigns.bloodPressureDiastolic) {
        toast({
          title: "Missing Information",
          description: "Blood pressure is required. Please enter both systolic and diastolic values.",
          variant: "destructive",
        });
        return;
      }

      const vitalData = {
        bloodPressureSystolic: parseInt(vitalSigns.bloodPressureSystolic) || null,
        bloodPressureDiastolic: parseInt(vitalSigns.bloodPressureDiastolic) || null,
        heartRate: parseInt(vitalSigns.heartRate) || null,
        temperature: parseFloat(vitalSigns.temperature) || null,
        respiratoryRate: parseInt(vitalSigns.respiratoryRate) || null,
        oxygenSaturation: parseInt(vitalSigns.oxygenSaturation) || null,
        weight: parseFloat(vitalSigns.weight) || null,
        height: parseFloat(vitalSigns.height) || null,
      };

      setIsRecording(true);
      recordVitalsMutation.mutate(vitalData);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  };

  const updateVitalSign = (field: keyof VitalSignsData, value: string) => {
    setVitalSigns(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getVitalStatus = (type: string, value: string) => {
    const numValue = parseFloat(value);
    if (!numValue || isNaN(numValue)) return { status: 'Enter value', color: 'text-gray-400' };

    switch (type) {
      case 'systolic':
        // European Heart Association guidelines for systolic
        if (numValue >= 180) return { status: 'Grade 3 HTN', color: 'text-red-600' };
        if (numValue >= 160) return { status: 'Grade 2 HTN', color: 'text-red-500' };
        if (numValue >= 140) return { status: 'Grade 1 HTN', color: 'text-orange-600' };
        if (numValue >= 130) return { status: 'High Normal', color: 'text-yellow-600' };
        if (numValue < 90) return { status: 'Low', color: 'text-blue-600' };
        return { status: 'Optimal', color: 'text-green-600' };
      
      case 'diastolic':
        // European Heart Association guidelines for diastolic
        if (numValue >= 110) return { status: 'Grade 3 HTN', color: 'text-red-600' };
        if (numValue >= 100) return { status: 'Grade 2 HTN', color: 'text-red-500' };
        if (numValue >= 90) return { status: 'Grade 1 HTN', color: 'text-orange-600' };
        if (numValue >= 85) return { status: 'High Normal', color: 'text-yellow-600' };
        if (numValue < 60) return { status: 'Low', color: 'text-blue-600' };
        return { status: 'Optimal', color: 'text-green-600' };
      
      case 'heartRate':
        if (numValue < 60) return { status: 'Bradycardia', color: 'text-orange-600' };
        if (numValue > 100) return { status: 'Tachycardia', color: 'text-red-600' };
        return { status: 'Normal', color: 'text-green-600' };
      
      case 'temperature':
        if (numValue < 36.1) return { status: 'Hypothermia', color: 'text-blue-600' };
        if (numValue > 37.2) return { status: 'Fever', color: 'text-red-600' };
        return { status: 'Normal', color: 'text-green-600' };
      
      case 'oxygenSat':
        if (numValue < 90) return { status: 'Critical', color: 'text-red-600' };
        if (numValue < 95) return { status: 'Low', color: 'text-orange-600' };
        return { status: 'Normal', color: 'text-green-600' };
      
      default:
        return { status: 'Normal', color: 'text-gray-600' };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-blue-50 to-white">
        <DialogHeader className="pb-6 border-b border-blue-100">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-gray-800">Record Vital Signs</span>
              <p className="text-sm font-normal text-gray-600 mt-1">{patientName}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Critical Vitals Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Blood Pressure Card */}
            <Card className="border-2 border-red-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span>Blood Pressure</span>
                    <p className="text-xs font-normal text-gray-500">mmHg</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-600 mb-1 block">Systolic</Label>
                    <Input
                      placeholder="120"
                      value={vitalSigns.bloodPressureSystolic}
                      onChange={(e) => updateVitalSign('bloodPressureSystolic', e.target.value)}
                      className="text-center text-lg font-semibold h-12 border-2 focus:border-red-400"
                    />
                  </div>
                  <div className="text-2xl font-bold text-gray-400 self-end pb-3">/</div>
                  <div className="flex-1">
                    <Label className="text-xs text-gray-600 mb-1 block">Diastolic</Label>
                    <Input
                      placeholder="80"
                      value={vitalSigns.bloodPressureDiastolic}
                      onChange={(e) => updateVitalSign('bloodPressureDiastolic', e.target.value)}
                      className="text-center text-lg font-semibold h-12 border-2 focus:border-red-400"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className={`px-2 py-1 rounded-full text-xs ${getVitalStatus('systolic', vitalSigns.bloodPressureSystolic).color.replace('text-', 'bg-').replace('-600', '-100 text-').replace('-500', '-100 text-').replace('-100 text-text-', '-600 ')}`}>
                    {getVitalStatus('systolic', vitalSigns.bloodPressureSystolic).status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getVitalStatus('diastolic', vitalSigns.bloodPressureDiastolic).color.replace('text-', 'bg-').replace('-600', '-100 text-').replace('-500', '-100 text-').replace('-100 text-text-', '-600 ')}`}>
                    {getVitalStatus('diastolic', vitalSigns.bloodPressureDiastolic).status}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Heart Rate Card */}
            <Card className="border-2 border-red-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span>Heart Rate</span>
                    <p className="text-xs font-normal text-gray-500">beats per minute</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="72"
                  value={vitalSigns.heartRate}
                  onChange={(e) => updateVitalSign('heartRate', e.target.value)}
                  className="text-center text-2xl font-bold h-16 border-2 focus:border-red-400"
                />
                <div className="text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVitalStatus('heartRate', vitalSigns.heartRate).color.replace('text-', 'bg-').replace('-600', '-100 text-').replace('-500', '-100 text-').replace('-100 text-text-', '-600 ')}`}>
                    {getVitalStatus('heartRate', vitalSigns.heartRate).status}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Vitals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Temperature */}
            <Card className="border border-orange-200 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded">
                    <Thermometer className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm">Temperature</span>
                    <p className="text-xs font-normal text-gray-500">°C</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="36.5"
                  value={vitalSigns.temperature}
                  onChange={(e) => updateVitalSign('temperature', e.target.value)}
                  className="text-center text-lg font-semibold h-10 border-2 focus:border-orange-400"
                />
                <div className="text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVitalStatus('temperature', vitalSigns.temperature).color.replace('text-', 'bg-').replace('-600', '-100 text-').replace('-500', '-100 text-').replace('-100 text-text-', '-600 ')}`}>
                    {getVitalStatus('temperature', vitalSigns.temperature).status}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Oxygen Saturation */}
            <Card className="border border-blue-200 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded">
                    <Droplets className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm">O2 Saturation</span>
                    <p className="text-xs font-normal text-gray-500">%</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="98"
                  value={vitalSigns.oxygenSaturation}
                  onChange={(e) => updateVitalSign('oxygenSaturation', e.target.value)}
                  className="text-center text-lg font-semibold h-10 border-2 focus:border-blue-400"
                />
                <div className="text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVitalStatus('oxygenSat', vitalSigns.oxygenSaturation).color.replace('text-', 'bg-').replace('-600', '-100 text-').replace('-500', '-100 text-').replace('-100 text-text-', '-600 ')}`}>
                    {getVitalStatus('oxygenSat', vitalSigns.oxygenSaturation).status}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Respiratory Rate */}
            <Card className="border border-cyan-200 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 rounded">
                    <Wind className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm">Respiratory</span>
                    <p className="text-xs font-normal text-gray-500">/min</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="16"
                  value={vitalSigns.respiratoryRate}
                  onChange={(e) => updateVitalSign('respiratoryRate', e.target.value)}
                  className="text-center text-lg font-semibold h-10 border-2 focus:border-cyan-400"
                />
              </CardContent>
            </Card>

            {/* BMI Calculator (Weight + Height) */}
            <Card className="border border-purple-200 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded">
                    <Gauge className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm">BMI Calculator</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-600">Weight (kg)</Label>
                    <Input
                      placeholder="70"
                      value={vitalSigns.weight}
                      onChange={(e) => updateVitalSign('weight', e.target.value)}
                      className="text-center text-sm h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Height (cm)</Label>
                    <Input
                      placeholder="170"
                      value={vitalSigns.height}
                      onChange={(e) => updateVitalSign('height', e.target.value)}
                      className="text-center text-sm h-8"
                    />
                  </div>
                </div>
                {vitalSigns.weight && vitalSigns.height && (
                  <div className="text-center pt-1">
                    <span className="text-xs text-gray-600">BMI: </span>
                    <span className="font-semibold text-sm">
                      {(parseFloat(vitalSigns.weight) / Math.pow(parseFloat(vitalSigns.height) / 100, 2)).toFixed(1)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={recordVitalsMutation.isPending}
              className="px-6 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={recordVitalsMutation.isPending}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Save className="w-4 h-4 mr-2" />
              {recordVitalsMutation.isPending ? 'Recording Vitals...' : 'Record Vital Signs'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}