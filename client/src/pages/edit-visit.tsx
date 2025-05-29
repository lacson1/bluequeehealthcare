import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  ArrowLeft,
  Save,
  Stethoscope,
  Activity,
  Heart,
  Thermometer,
  Scale,
  Calendar,
  Clock,
  User,
  FileText,
  AlertCircle
} from 'lucide-react';

interface Visit {
  id: number;
  patientId: number;
  visitDate: string;
  visitType: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  complaint?: string;
  diagnosis?: string;
  treatment?: string;
  followUpDate?: string;
  status: string;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
}

export default function EditVisit() {
  const { patientId, visitId } = useParams<{ patientId: string; visitId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    visitType: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    complaint: '',
    diagnosis: '',
    treatment: '',
    followUpDate: '',
    status: 'completed'
  });

  // Fetch patient data
  const { data: patient } = useQuery<Patient>({
    queryKey: ['/api/patients', patientId],
    enabled: !!patientId,
  });

  // Fetch visit data
  const { data: visit, isLoading: visitLoading } = useQuery<Visit>({
    queryKey: ['/api/patients', patientId, 'visits', visitId],
    enabled: !!patientId && !!visitId,
  });

  // Populate form when visit data is loaded
  useEffect(() => {
    if (visit) {
      setFormData({
        visitType: visit.visitType || '',
        bloodPressure: visit.bloodPressure || '',
        heartRate: visit.heartRate?.toString() || '',
        temperature: visit.temperature?.toString() || '',
        weight: visit.weight?.toString() || '',
        complaint: visit.complaint || '',
        diagnosis: visit.diagnosis || '',
        treatment: visit.treatment || '',
        followUpDate: visit.followUpDate ? new Date(visit.followUpDate).toISOString().split('T')[0] : '',
        status: visit.status || 'completed'
      });
    }
  }, [visit]);

  // Update visit mutation
  const updateVisitMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/patients/${patientId}/visits/${visitId}`, data),
    onSuccess: () => {
      toast({
        title: "Visit updated",
        description: "Visit record has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'visits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'activity-trail'] });
      navigate(`/patients/${patientId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update visit record",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData = {
      ...formData,
      heartRate: formData.heartRate ? parseInt(formData.heartRate) : null,
      temperature: formData.temperature ? parseFloat(formData.temperature) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      followUpDate: formData.followUpDate || null
    };

    updateVisitMutation.mutate(updateData);
  };

  if (visitLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading visit details...</p>
        </div>
      </div>
    );
  }

  if (!visit || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2 items-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Visit Not Found</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              The visit record you're looking for doesn't exist or you don't have permission to access it.
            </p>
            <Button 
              onClick={() => navigate('/patients')} 
              className="mt-4 w-full"
            >
              Back to Patients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(`/patients/${patientId}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Patient
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <Stethoscope className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Edit Visit</h1>
                  <p className="text-sm text-gray-500">
                    {patient.firstName} {patient.lastName} • {new Date(visit.visitDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              Visit ID: {visit.id}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Name:</span>
                  <p className="text-gray-900">{patient.firstName} {patient.lastName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Date of Birth:</span>
                  <p className="text-gray-900">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Gender:</span>
                  <p className="text-gray-900 capitalize">{patient.gender}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visit Type & Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Visit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visitType">Visit Type</Label>
                  <Input
                    id="visitType"
                    value={formData.visitType}
                    onChange={(e) => handleInputChange('visitType', e.target.value)}
                    placeholder="e.g., Consultation, Follow-up, Emergency"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vital Signs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Vital Signs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="bloodPressure" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Blood Pressure
                  </Label>
                  <Input
                    id="bloodPressure"
                    value={formData.bloodPressure}
                    onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                  <Input
                    id="heartRate"
                    type="number"
                    value={formData.heartRate}
                    onChange={(e) => handleInputChange('heartRate', e.target.value)}
                    placeholder="72"
                  />
                </div>
                <div>
                  <Label htmlFor="temperature" className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    Temperature (°C)
                  </Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => handleInputChange('temperature', e.target.value)}
                    placeholder="36.5"
                  />
                </div>
                <div>
                  <Label htmlFor="weight" className="flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    placeholder="70.0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Clinical Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="complaint">Chief Complaint</Label>
                <Textarea
                  id="complaint"
                  value={formData.complaint}
                  onChange={(e) => handleInputChange('complaint', e.target.value)}
                  placeholder="Patient's main concern or reason for visit"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  placeholder="Clinical diagnosis and assessment"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="treatment">Treatment Plan</Label>
                <Textarea
                  id="treatment"
                  value={formData.treatment}
                  onChange={(e) => handleInputChange('treatment', e.target.value)}
                  placeholder="Treatment recommendations and prescriptions"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="followUpDate" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Follow-up Date
                </Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/patients/${patientId}`)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateVisitMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateVisitMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Visit
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}