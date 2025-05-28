import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PatientTimeline } from './patient-timeline';
import { PatientAlertsPanel } from './patient-alerts-panel';
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Heart,
  Activity,
  Pill,
  FlaskRound
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Patient Info & Alerts */}
      <div className="space-y-6">
        {/* Patient Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {getPatientInitials(patient.firstName, patient.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h2>
                <p className="text-sm text-gray-500">
                  ID: HC{patient.id?.toString().padStart(6, "0")}
                </p>
                <Badge variant="outline" className="mt-1">
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
  );
}