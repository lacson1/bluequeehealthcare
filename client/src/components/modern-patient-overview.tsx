import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientTimeline } from './patient-timeline';
import { PatientAlertsPanel } from './patient-alerts-panel';
import { PatientSafetyAlerts, QuickSafetyIndicator } from './patient-safety-alerts';
import PatientVitalSignsTracker from './patient-vital-signs-tracker';
import SmartAppointmentScheduler from './smart-appointment-scheduler';
import { PatientCommunicationHub } from './patient-communication-hub';
import ConsultationFormSelector from './consultation-form-selector';
import { useLocation } from "wouter";
import { Button } from '@/components/ui/button';
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Heart,
  Activity,
  Pill,
  FlaskRound,
  MessageSquare,
  CalendarDays,
  Monitor,
  FileText,
  Stethoscope
} from 'lucide-react';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  allergies?: string;
  medicalHistory?: string;
}

interface Visit {
  id: number;
  visitDate: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  complaint?: string;
  diagnosis?: string;
  treatment?: string;
  visitType: string;
}

interface ModernPatientOverviewProps {
  patient: Patient;
  visits: Visit[];
  recentLabs?: any[];
  activePrescriptions?: any[];
}

export function ModernPatientOverview({ 
  patient, 
  visits, 
  recentLabs = [], 
  activePrescriptions = [] 
}: ModernPatientOverviewProps) {
  const getPatientAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
    return age;
  };

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Use comprehensive activity trail data instead of just visits
  const [activityTrail, setActivityTrail] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchActivityTrail = async () => {
      try {
        const response = await fetch(`/api/patients/${patient.id}/activity-trail`);
        if (response.ok) {
          const data = await response.json();
          setActivityTrail(data);
        }
      } catch (error) {
        console.error('Error fetching activity trail:', error);
        // Fallback to visits if activity trail fails
        const fallbackEvents = visits.map(visit => ({
          id: visit.id,
          type: 'visit' as const,
          date: visit.visitDate,
          title: `${visit.visitType} Visit`,
          description: visit.complaint || visit.diagnosis || 'Routine visit',
          status: visit.diagnosis ? 'Completed' : 'Draft',
          details: {
            bloodPressure: visit.bloodPressure,
            heartRate: visit.heartRate,
            temperature: visit.temperature,
            weight: visit.weight
          }
        }));
        setActivityTrail(fallbackEvents);
      }
    };
    
    fetchActivityTrail();
  }, [patient.id, visits]);

  return (
    <div className="space-y-4 min-h-screen w-full">
      {/* Patient Quick Info Header - Compact */}
      <Card className="w-full">
        <CardContent className="p-3">
          <div className="flex items-center space-x-4">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                {getPatientInitials(patient.firstName, patient.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <p className="text-xs text-gray-500">
                    ID: HC{patient.id?.toString().padStart(6, "0")} • {getPatientAge(patient.dateOfBirth)} years old • {patient.gender}
                  </p>
                </div>
                <QuickSafetyIndicator patient={patient} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Tabbed Interface - Full Width */}
      <Tabs defaultValue="overview" className="w-full h-full">
        <TabsList className="grid w-full grid-cols-8 mb-2 h-9">
          <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
            <User className="w-3 h-3" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-1 text-xs">
            <Activity className="w-3 h-3" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="safety" className="flex items-center gap-1 text-xs">
            <Heart className="w-3 h-3" />
            Safety
          </TabsTrigger>
          <TabsTrigger value="vitals" className="flex items-center gap-1 text-xs">
            <Monitor className="w-3 h-3" />
            Vitals
          </TabsTrigger>
          <TabsTrigger value="record-visit" className="flex items-center gap-1 text-xs">
            <Calendar className="w-3 h-3" />
            Visit
          </TabsTrigger>
          <TabsTrigger value="consultation" className="flex items-center gap-1 text-xs">
            <FileText className="w-3 h-3" />
            Forms
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-1 text-xs">
            <CalendarDays className="w-3 h-3" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-1 text-xs">
            <MessageSquare className="w-3 h-3" />
            Chat
          </TabsTrigger>
        </TabsList>

        {/* Safety Alerts Tab */}
        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Patient Safety Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PatientSafetyAlerts 
                patientId={patient.id} 
                patient={patient}
                compact={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab - Optimized Layout */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Patient Card - Enhanced */}
            <Card className="lg:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                      {getPatientInitials(patient.firstName, patient.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </h2>
                    <p className="text-sm text-gray-500">
                      ID: HC{patient.id?.toString().padStart(6, "0")}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        Active Patient
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {getPatientAge(patient.dateOfBirth)} years • {patient.gender}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{patient.phone}</span>
                  </div>
                  
                  {patient.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}

                  {patient.address && (
                    <div className="flex items-center space-x-2 md:col-span-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{patient.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats - Enhanced */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Medical Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Total Visits</span>
                  </div>
                  <Badge variant="secondary">{visits.length}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FlaskRound className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Lab Results</span>
                  </div>
                  <Badge variant="secondary">{recentLabs.length}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Pill className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Active Meds</span>
                  </div>
                  <Badge variant="secondary">{activePrescriptions.length}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Patient Safety Indicator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  Safety Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuickSafetyIndicator patient={patient} />
              </CardContent>
            </Card>
          </div>

          {/* Patient Alerts - Full Width */}
          <PatientAlertsPanel
            patient={patient}
            upcomingAppointments={[]}
            criticalMedications={activePrescriptions}
          />
        </TabsContent>

        {/* Dedicated Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Timeline Filters/Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Filter Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Event Types</label>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="w-2 h-2 text-blue-600" />
                      </div>
                      <span className="text-xs">Visits</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center">
                        <FlaskRound className="w-2 h-2 text-green-600" />
                      </div>
                      <span className="text-xs">Lab Results</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-100 rounded-full flex items-center justify-center">
                        <FileText className="w-2 h-2 text-orange-600" />
                      </div>
                      <span className="text-xs">Consultations</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Content - Main Area */}
            <div className="lg:col-span-3">
              <PatientTimeline events={activityTrail} />
            </div>
          </div>
        </TabsContent>

          {/* Vital Signs Tab */}
          <TabsContent value="vitals" className="space-y-6">
            <PatientVitalSignsTracker patientId={patient.id} />
          </TabsContent>

          {/* Record Visit Tab */}
          <TabsContent value="record-visit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Record Patient Visit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Document a new visit for {patient.firstName} {patient.lastName}
                  </p>
                  <Button 
                    onClick={() => window.location.href = `/patients/${patient.id}/record-visit`}
                    className="w-full"
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Open Comprehensive Visit Recording
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consultation Forms Tab */}
          <TabsContent value="consultation" className="space-y-6">
            <ConsultationFormSelector patientId={patient.id} />
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <SmartAppointmentScheduler patientId={patient.id} />
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="space-y-6">
            <PatientCommunicationHub
              patientId={patient.id}
              patientName={`${patient.firstName} ${patient.lastName}`}
              patientPhone={patient.phone}
              patientEmail={patient.email}
            />
          </TabsContent>
        </Tabs>
    </div>
  );
}