import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatPatientName } from '@/lib/patient-utils';
import { User, Heart, Thermometer, Weight, Activity } from 'lucide-react';

interface NursingAssessmentProps {
  patientId: number;
  visitId?: number;
}

export default function NursingAssessment({ patientId, visitId }: NursingAssessmentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch patient data to display name
  const { data: patient } = useQuery({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  const [assessmentData, setAssessmentData] = useState({
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: ''
    },
    assessment: '',
    medicationsAdministered: '',
    painLevel: '',
    mobilityStatus: '',
    skinCondition: '',
    nursingNotes: '',
    interventions: '',
    patientEducation: ''
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/patients/${patientId}/nursing-assessment`, 'POST', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Nursing assessment saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/consultation-records`] });
      setAssessmentData({
        vitalSigns: {
          bloodPressure: '',
          heartRate: '',
          temperature: '',
          respiratoryRate: '',
          oxygenSaturation: '',
          weight: '',
          height: ''
        },
        assessment: '',
        medicationsAdministered: '',
        painLevel: '',
        mobilityStatus: '',
        skinCondition: '',
        nursingNotes: '',
        interventions: '',
        patientEducation: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save nursing assessment",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...assessmentData,
      visitId,
      recordedAt: new Date().toISOString()
    });
  };

  const updateVitalSign = (field: string, value: string) => {
    setAssessmentData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [field]: value
      }
    }));
  };

  const updateField = (field: string, value: string) => {
    setAssessmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-green-50 border-b border-green-200">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <User className="w-5 h-5" />
          Nursing Assessment
          <Badge variant="outline" className="ml-auto bg-green-100 text-green-700">
            {patient ? formatPatientName(patient) : `Patient #${patientId}`}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vital Signs Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Vital Signs
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodPressure" className="text-sm font-medium flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  Blood Pressure
                </Label>
                <Input
                  id="bloodPressure"
                  placeholder="120/80"
                  value={assessmentData.vitalSigns.bloodPressure}
                  onChange={(e) => updateVitalSign('bloodPressure', e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heartRate" className="text-sm font-medium">Heart Rate</Label>
                <Input
                  id="heartRate"
                  placeholder="72 bpm"
                  value={assessmentData.vitalSigns.heartRate}
                  onChange={(e) => updateVitalSign('heartRate', e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature" className="text-sm font-medium flex items-center gap-1">
                  <Thermometer className="w-3 h-3" />
                  Temperature
                </Label>
                <Input
                  id="temperature"
                  placeholder="36.5°C"
                  value={assessmentData.vitalSigns.temperature}
                  onChange={(e) => updateVitalSign('temperature', e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="respiratoryRate" className="text-sm font-medium">Respiratory Rate</Label>
                <Input
                  id="respiratoryRate"
                  placeholder="16/min"
                  value={assessmentData.vitalSigns.respiratoryRate}
                  onChange={(e) => updateVitalSign('respiratoryRate', e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oxygenSaturation" className="text-sm font-medium">O2 Saturation</Label>
                <Input
                  id="oxygenSaturation"
                  placeholder="98%"
                  value={assessmentData.vitalSigns.oxygenSaturation}
                  onChange={(e) => updateVitalSign('oxygenSaturation', e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium flex items-center gap-1">
                  <Weight className="w-3 h-3" />
                  Weight
                </Label>
                <Input
                  id="weight"
                  placeholder="70 kg"
                  value={assessmentData.vitalSigns.weight}
                  onChange={(e) => updateVitalSign('weight', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Assessment Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assessment" className="text-sm font-medium">Patient Assessment</Label>
                <Textarea
                  id="assessment"
                  placeholder="General condition, appearance, consciousness level..."
                  value={assessmentData.assessment}
                  onChange={(e) => updateField('assessment', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="painLevel" className="text-sm font-medium">Pain Level (0-10)</Label>
                <Input
                  id="painLevel"
                  placeholder="0-10 scale"
                  value={assessmentData.painLevel}
                  onChange={(e) => updateField('painLevel', e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobilityStatus" className="text-sm font-medium">Mobility Status</Label>
                <Input
                  id="mobilityStatus"
                  placeholder="Ambulatory, bed rest, assistance needed..."
                  value={assessmentData.mobilityStatus}
                  onChange={(e) => updateField('mobilityStatus', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medicationsAdministered" className="text-sm font-medium">Medications Administered</Label>
                <Textarea
                  id="medicationsAdministered"
                  placeholder="List medications given, time, route, patient response..."
                  value={assessmentData.medicationsAdministered}
                  onChange={(e) => updateField('medicationsAdministered', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skinCondition" className="text-sm font-medium">Skin Condition</Label>
                <Input
                  id="skinCondition"
                  placeholder="Color, temperature, moisture, integrity..."
                  value={assessmentData.skinCondition}
                  onChange={(e) => updateField('skinCondition', e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interventions" className="text-sm font-medium">Nursing Interventions</Label>
                <Textarea
                  id="interventions"
                  placeholder="Actions taken, procedures performed..."
                  value={assessmentData.interventions}
                  onChange={(e) => updateField('interventions', e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nursingNotes" className="text-sm font-medium">Additional Nursing Notes</Label>
              <Textarea
                id="nursingNotes"
                placeholder="Observations, patient behavior, family concerns, discharge planning..."
                value={assessmentData.nursingNotes}
                onChange={(e) => updateField('nursingNotes', e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientEducation" className="text-sm font-medium">Patient Education Provided</Label>
              <Textarea
                id="patientEducation"
                placeholder="Health education topics discussed, materials provided..."
                value={assessmentData.patientEducation}
                onChange={(e) => updateField('patientEducation', e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssessmentData({
                vitalSigns: {
                  bloodPressure: '',
                  heartRate: '',
                  temperature: '',
                  respiratoryRate: '',
                  oxygenSaturation: '',
                  weight: '',
                  height: ''
                },
                assessment: '',
                medicationsAdministered: '',
                painLevel: '',
                mobilityStatus: '',
                skinCondition: '',
                nursingNotes: '',
                interventions: '',
                patientEducation: ''
              })}
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Assessment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}