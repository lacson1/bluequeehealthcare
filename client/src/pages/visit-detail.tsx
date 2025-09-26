import React from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Stethoscope,
  Activity,
  Heart,
  Thermometer,
  Scale,
  Calendar,
  Clock,
  User,
  FileText
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

export default function VisitDetail() {
  const { patientId, visitId } = useParams<{ patientId: string; visitId: string }>();
  const [, navigate] = useLocation();

  // Fetch patient data
  const { data: patient } = useQuery<Patient>({
    queryKey: ['/api/patients', patientId],
    enabled: !!patientId
  });

  // Fetch visit data
  const { data: visit, isLoading } = useQuery<Visit>({
    queryKey: ['/api/patients', patientId, 'visits', visitId],
    enabled: !!patientId && !!visitId
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!visit || !patient) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-700">Visit not found</h2>
        <p className="text-gray-500 mt-2">The requested visit could not be found.</p>
        <Button 
          onClick={() => navigate(`/patients/${patientId}`)} 
          className="mt-4"
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patient
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => navigate(`/patients/${patientId}`)} 
              variant="outline" 
              size="sm"
              data-testid="button-back-to-patient"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Patient
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-visit-title">
                Visit Details
              </h1>
              <p className="text-gray-600" data-testid="text-patient-name">
                {patient.firstName} {patient.lastName} - {formatDate(visit.visitDate)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge className={getStatusColor(visit.status)} data-testid="badge-visit-status">
              {visit.status}
            </Badge>
            <Button 
              onClick={() => navigate(`/patients/${patientId}/visits/${visitId}/edit`)}
              data-testid="button-edit-visit"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Visit
            </Button>
          </div>
        </div>

        {/* Visit Information */}
        <Card data-testid="card-visit-info">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Visit Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Visit Type:</span>
                <p className="text-lg" data-testid="text-visit-type">{visit.visitType}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Date:</span>
                <p className="text-lg" data-testid="text-visit-date">{formatDate(visit.visitDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vital Signs */}
        <Card data-testid="card-vital-signs">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Vital Signs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {visit.bloodPressure && (
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                  <Heart className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Blood Pressure</p>
                    <p className="font-semibold" data-testid="text-blood-pressure">{visit.bloodPressure}</p>
                  </div>
                </div>
              )}
              
              {visit.heartRate && (
                <div className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
                  <Activity className="w-5 h-5 text-pink-600" />
                  <div>
                    <p className="text-sm text-gray-600">Heart Rate</p>
                    <p className="font-semibold" data-testid="text-heart-rate">{visit.heartRate} bpm</p>
                  </div>
                </div>
              )}
              
              {visit.temperature && (
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <Thermometer className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Temperature</p>
                    <p className="font-semibold" data-testid="text-temperature">{visit.temperature}°C</p>
                  </div>
                </div>
              )}
              
              {visit.weight && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="font-semibold" data-testid="text-weight">{visit.weight} kg</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clinical Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-complaint">
            <CardHeader>
              <CardTitle>Chief Complaint</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700" data-testid="text-complaint">
                {visit.complaint || 'No complaint recorded'}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-diagnosis">
            <CardHeader>
              <CardTitle>Diagnosis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700" data-testid="text-diagnosis">
                {visit.diagnosis || 'No diagnosis recorded'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-treatment">
          <CardHeader>
            <CardTitle>Treatment Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700" data-testid="text-treatment">
              {visit.treatment || 'No treatment plan recorded'}
            </p>
          </CardContent>
        </Card>

        {/* Follow-up */}
        {visit.followUpDate && (
          <Card data-testid="card-followup">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700" data-testid="text-followup-date">
                Scheduled for: {formatDate(visit.followUpDate)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}