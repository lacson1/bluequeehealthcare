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
      return await apiRequest(`/api/patients/${patientId}/vitals`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
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
      toast({
        title: "Error Recording Vitals",
        description: error.message || "Failed to record vital signs. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Record Vital Signs - {patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Primary Vitals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Primary Vital Signs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Blood Pressure */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-medium">
                    <Heart className="w-4 h-4 text-red-500" />
                    Blood Pressure (mmHg)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="120"
                      value={vitalSigns.bloodPressureSystolic}
                      onChange={(e) => updateVitalSign('bloodPressureSystolic', e.target.value)}
                      className="text-center"
                    />
                    <span className="self-center text-gray-500">/</span>
                    <Input
                      placeholder="80"
                      value={vitalSigns.bloodPressureDiastolic}
                      onChange={(e) => updateVitalSign('bloodPressureDiastolic', e.target.value)}
                      className="text-center"
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={getVitalStatus('systolic', vitalSigns.bloodPressureSystolic).color}>
                      {getVitalStatus('systolic', vitalSigns.bloodPressureSystolic).status}
                    </span>
                    <span className={getVitalStatus('diastolic', vitalSigns.bloodPressureDiastolic).color}>
                      {getVitalStatus('diastolic', vitalSigns.bloodPressureDiastolic).status}
                    </span>
                  </div>
                </div>

                {/* Heart Rate */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-medium">
                    <Activity className="w-4 h-4 text-red-500" />
                    Heart Rate (bpm)
                  </Label>
                  <Input
                    placeholder="72"
                    value={vitalSigns.heartRate}
                    onChange={(e) => updateVitalSign('heartRate', e.target.value)}
                    className="text-center"
                  />
                  <div className={`text-xs text-center ${getVitalStatus('heartRate', vitalSigns.heartRate).color}`}>
                    {getVitalStatus('heartRate', vitalSigns.heartRate).status}
                  </div>
                </div>

                {/* Temperature */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-medium">
                    <Thermometer className="w-4 h-4 text-orange-500" />
                    Temperature (°C)
                  </Label>
                  <Input
                    placeholder="36.5"
                    value={vitalSigns.temperature}
                    onChange={(e) => updateVitalSign('temperature', e.target.value)}
                    className="text-center"
                  />
                  <div className={`text-xs text-center ${getVitalStatus('temperature', vitalSigns.temperature).color}`}>
                    {getVitalStatus('temperature', vitalSigns.temperature).status}
                  </div>
                </div>

                {/* Oxygen Saturation */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-medium">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    O2 Saturation (%)
                  </Label>
                  <Input
                    placeholder="98"
                    value={vitalSigns.oxygenSaturation}
                    onChange={(e) => updateVitalSign('oxygenSaturation', e.target.value)}
                    className="text-center"
                  />
                  <div className={`text-xs text-center ${getVitalStatus('oxygenSat', vitalSigns.oxygenSaturation).color}`}>
                    {getVitalStatus('oxygenSat', vitalSigns.oxygenSaturation).status}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Measurements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gauge className="w-5 h-5 text-green-500" />
                Additional Measurements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Respiratory Rate */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-medium">
                    <Wind className="w-4 h-4 text-cyan-500" />
                    Respiratory Rate (/min)
                  </Label>
                  <Input
                    placeholder="16"
                    value={vitalSigns.respiratoryRate}
                    onChange={(e) => updateVitalSign('respiratoryRate', e.target.value)}
                    className="text-center"
                  />
                </div>

                {/* Weight */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-medium">
                    <Weight className="w-4 h-4 text-purple-500" />
                    Weight (kg)
                  </Label>
                  <Input
                    placeholder="70.0"
                    value={vitalSigns.weight}
                    onChange={(e) => updateVitalSign('weight', e.target.value)}
                    className="text-center"
                  />
                </div>

                {/* Height */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-medium">
                    <Ruler className="w-4 h-4 text-indigo-500" />
                    Height (cm)
                  </Label>
                  <Input
                    placeholder="170.0"
                    value={vitalSigns.height}
                    onChange={(e) => updateVitalSign('height', e.target.value)}
                    className="text-center"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Action Buttons */}
          <div className="form-button-group">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={recordVitalsMutation.isPending}
              className="btn-ghost hover:bg-gray-50 transition-all duration-200 border-gray-300"
            >
              <X className="w-4 h-4 mr-2 icon-professional text-gray-600" />
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={recordVitalsMutation.isPending}
              className="btn-primary shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-700 border-0"
            >
              <Save className="w-4 h-4 mr-2 icon-professional" />
              {recordVitalsMutation.isPending ? 'Recording...' : 'Record Vitals'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}