import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientTimeline } from './patient-timeline';
import { PatientAlertsPanel } from './patient-alerts-panel';
import PatientVitalSignsTracker from './patient-vital-signs-tracker';
import SmartAppointmentScheduler from './smart-appointment-scheduler';
import PatientCommunicationHub from './patient-communication-hub';
import ConsultationFormSelector from './consultation-form-selector';
import VisitRecordingModal from './visit-recording-modal';
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
  };

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Convert visits to timeline events
  const timelineEvents = visits.map(visit => ({
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
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h2>
              <p className="text-xs text-gray-500">
                ID: HC{patient.id?.toString().padStart(6, "0")} • {getPatientAge(patient.dateOfBirth)} years old • {patient.gender}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Tabbed Interface - Full Width */}
      <Tabs defaultValue="overview" className="w-full h-full">
        <TabsList className="grid w-full grid-cols-6 mb-2 h-9">
          <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
            <User className="w-3 h-3" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="vitals" className="flex items-center gap-1 text-xs">
            <Monitor className="w-3 h-3" />
            Vital Signs
          </TabsTrigger>
          <TabsTrigger value="record-visit" className="flex items-center gap-1 text-xs">
            <Calendar className="w-3 h-3" />
            Record Visit
          </TabsTrigger>
          <TabsTrigger value="consultation" className="flex items-center gap-1 text-xs">
            <FileText className="w-3 h-3" />
            Consultation
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-1 text-xs">
            <CalendarDays className="w-3 h-3" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-1 text-xs">
            <MessageSquare className="w-3 h-3" />
            Communication
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Compact Layout */}
        <TabsContent value="overview" className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Panel - Patient Info & Alerts */}
            <div className="space-y-3">
        {/* Patient Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {getPatientInitials(patient.firstName, patient.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h2>
                <p className="text-xs text-gray-500">
                  ID: HC{patient.id?.toString().padStart(6, "0")}
                </p>
                <Badge variant="outline" className="mt-0.5 text-xs">
                  Active Patient
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{getPatientAge(patient.dateOfBirth)} years old</span>
                <span className="text-gray-400">•</span>
                <span className="capitalize">{patient.gender}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{patient.phone}</span>
              </div>
              
              {patient.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{patient.email}</span>
                </div>
              )}
              
              {patient.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-xs">{patient.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Patient Alerts */}
        <PatientAlertsPanel
          patient={patient}
          upcomingAppointments={[]}
          criticalMedications={activePrescriptions}
        />

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
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
      </div>

              {/* Middle Panel - Timeline & Main Content */}
              <div className="lg:col-span-2">
                <PatientTimeline events={timelineEvents} />
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
                  <VisitRecordingModal 
                    open={true} 
                    onOpenChange={() => {}} 
                    patientId={patient.id} 
                  />
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