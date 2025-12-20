import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  FileText,
  Printer,
  Download,
  Clipboard,
  AlertCircle,
  CheckCircle2,
  Wind,
  Droplets,
  Ruler,
  Pill,
  FlaskRound,
  TrendingUp,
  TrendingDown,
  Minus,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Share2,
  History,
  Eye,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { formatDateLong, formatDateMedium, formatDateOfBirth } from '@/lib/date-utils';
import { t } from '@/lib/i18n';

interface Visit {
  id: number;
  patientId: number;
  visitDate: string;
  visitType: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  complaint?: string;
  diagnosis?: string;
  treatment?: string;
  followUpDate?: string;
  status: string;
  notes?: string;
  providerId?: number;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
}

interface Prescription {
  id: number;
  visitId: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  status: string;
}

interface LabResult {
  id: number;
  patientId: number;
  testName: string;
  result: string;
  normalRange?: string;
  status: string;
  orderedDate: string;
}

// Vital Signs Component with visual gauge
function VitalCard({ 
  icon: Icon, 
  label, 
  value, 
  unit, 
  color, 
  normalRange,
  trend 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  unit?: string;
  color: string;
  normalRange?: string;
  trend?: 'up' | 'down' | 'stable';
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-amber-500' : trend === 'down' ? 'text-blue-500' : 'text-emerald-500';
  
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group`}>
      <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all duration-500" />
      <div className="absolute bottom-0 left-0 w-24 h-24 -mb-6 -ml-6 rounded-full bg-black/5 blur-xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trendColor} bg-white/90 px-2 py-1 rounded-full`}>
              <TrendIcon className="w-3 h-3" />
              <span className="capitalize">{trend}</span>
            </div>
          )}
        </div>
        
        <p className="text-white/80 text-sm font-medium mb-1">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
          {unit && <span className="text-white/70 text-sm font-medium">{unit}</span>}
        </div>
        
        {normalRange && (
          <p className="text-white/60 text-xs mt-2">Normal: {normalRange}</p>
        )}
      </div>
    </div>
  );
}

// Timeline item component
function TimelineItem({ visit, isActive }: { visit: Visit; isActive: boolean }) {
  const [, navigate] = useLocation();
  
  return (
    <button
      onClick={() => navigate(`/patients/${visit.patientId}/visits/${visit.id}`)}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full text-left ${
        isActive 
          ? 'bg-primary/10 border-2 border-primary shadow-sm' 
          : 'hover:bg-muted/50 border-2 border-transparent'
      }`}
    >
      <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
          {visit.visitType || 'General Visit'}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDateMedium(visit.visitDate)}
        </p>
      </div>
      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`} />
    </button>
  );
}

export default function VisitDetail() {
  const { patientId, visitId } = useParams<{ patientId: string; visitId: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch patient data - FIXED: Use proper string URL format
  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId
  });

  // Fetch visit data - FIXED: Use proper string URL format
  const { data: visit, isLoading: visitLoading } = useQuery<Visit>({
    queryKey: [`/api/patients/${patientId}/visits/${visitId}`],
    enabled: !!patientId && !!visitId
  });

  // Fetch all patient visits for timeline
  const { data: allVisits } = useQuery<Visit[]>({
    queryKey: [`/api/patients/${patientId}/visits`],
    enabled: !!patientId
  });

  // Fetch prescriptions for this visit
  const { data: prescriptions } = useQuery<Prescription[]>({
    queryKey: [`/api/patients/${patientId}/prescriptions`],
    enabled: !!patientId
  });

  // Fetch lab results
  const { data: labResults } = useQuery<LabResult[]>({
    queryKey: [`/api/patients/${patientId}/lab-results`],
    enabled: !!patientId
  });

  const isLoading = patientLoading || visitLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Skeleton Header */}
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-32 bg-muted rounded-lg" />
              <div className="h-8 w-48 bg-muted rounded-lg" />
            </div>
            
            {/* Hero Skeleton */}
            <div className="h-64 bg-gradient-to-r from-muted to-muted/50 rounded-3xl" />
            
            {/* Cards Skeleton */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!visit || !patient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 shadow-xl border border-border bg-card">
          <div className="w-16 h-16 bg-warning-light rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-warning" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Visit Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested visit record could not be located in the system.</p>
          <Button
            onClick={() => navigate(`/patients/${patientId}`)}
            className="bg-primary hover:bg-primary-hover"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Patient Profile
          </Button>
        </Card>
      </div>
    );
  }


  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'final':
      case 'completed':
        return { 
          bg: 'bg-emerald-500', 
          text: 'text-emerald-700',
          light: 'bg-emerald-50',
          border: 'border-emerald-200',
          label: 'Completed',
          icon: CheckCircle2 
        };
      case 'draft':
      case 'in-progress':
        return { 
          bg: 'bg-amber-500', 
          text: 'text-amber-700',
          light: 'bg-amber-50',
          border: 'border-amber-200',
          label: 'In Progress',
          icon: Clock 
        };
      case 'cancelled':
        return { 
          bg: 'bg-red-500', 
          text: 'text-red-700',
          light: 'bg-red-50',
          border: 'border-red-200',
          label: 'Cancelled',
          icon: AlertCircle 
        };
      default:
        return { 
          bg: 'bg-muted-foreground', 
          text: 'text-muted-foreground',
          light: 'bg-muted',
          border: 'border-border',
          label: status || 'Unknown',
          icon: Clock 
        };
    }
  };

  const calculateBMI = () => {
    if (visit?.weight && visit?.height) {
      const heightInMeters = visit.height / 100;
      const bmi = visit.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { text: 'Underweight', color: 'text-info', progress: 25 };
    if (bmi < 25) return { text: 'Normal', color: 'text-success', progress: 50 };
    if (bmi < 30) return { text: 'Overweight', color: 'text-warning', progress: 75 };
    return { text: 'Obese', color: 'text-destructive', progress: 100 };
  };

  const parseNotesJSON = (notes: string | undefined) => {
    if (!notes) return null;
    try {
      return JSON.parse(notes);
    } catch {
      return null;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const visitText = `
CLINICAL VISIT SUMMARY
${'='.repeat(50)}

PATIENT INFORMATION
Name: ${patient?.firstName} ${patient?.lastName}
Date of Birth: ${formatDateOfBirth(patient?.dateOfBirth || '')}
Gender: ${patient?.gender || 'N/A'}
Contact: ${patient?.phone || 'N/A'}

VISIT DETAILS
Visit ID: #${visit.id}
Date: ${formatDateLong(visit.visitDate)}
Type: ${visit.visitType || 'General Consultation'}
Status: ${statusConfig.label}

VITAL SIGNS
${visit.bloodPressure ? `Blood Pressure: ${visit.bloodPressure} mmHg` : ''}
${visit.heartRate ? `Heart Rate: ${visit.heartRate} bpm` : ''}
${visit.temperature ? `Temperature: ${visit.temperature}°C` : ''}
${visit.weight ? `Weight: ${visit.weight} kg` : ''}
${visit.height ? `Height: ${visit.height} cm` : ''}
${bmi ? `BMI: ${bmi} (${getBMICategory(parseFloat(bmi)).text})` : ''}

CHIEF COMPLAINT
${visit.complaint || 'Not documented'}

DIAGNOSIS
${visit.diagnosis || 'Not documented'}

TREATMENT PLAN
${visit.treatment || 'Not documented'}

${visit.followUpDate ? `FOLLOW-UP: ${formatDateLong(visit.followUpDate)}` : ''}

${'='.repeat(50)}
Generated: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([visitText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visit-${visit.id}-${patient?.lastName || 'patient'}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bmi = calculateBMI();
  const parsedNotes = parseNotesJSON(visit?.notes);
  const statusConfig = getStatusConfig(visit.status);
  const StatusIcon = statusConfig.icon;

  // Get age from DOB
  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Filter prescriptions for this visit
  const visitPrescriptions = prescriptions?.filter(p => p.visitId === parseInt(visitId || '0')) || [];
  
  // Sort visits by date for timeline
  const sortedVisits = [...(allVisits || [])].sort((a, b) => 
    new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Actions Bar */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(`/patients/${patientId}`)}
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Patient
              </Button>
              
              <div className="h-6 w-px bg-border" />
              
              <nav className="flex items-center gap-1.5 text-sm">
                <button onClick={() => navigate('/patients')} className="text-muted-foreground hover:text-primary transition-colors">
                  Patients
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                <button onClick={() => navigate(`/patients/${patientId}`)} className="text-muted-foreground hover:text-primary transition-colors">
                  {patient.firstName} {patient.lastName}
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-foreground font-medium">Visit #{visit.id}</span>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                onClick={() => navigate(`/patients/${patientId}/visits/${visitId}/edit`)}
                className="gap-2 bg-primary hover:bg-primary-hover"
                size="sm"
              >
                <Edit className="w-4 h-4" />
                Edit Visit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Compact Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary-dark p-6 mb-6 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mt-32 -mr-32 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Patient Info - Compact */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white shadow-md">
                  {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">
                    {patient.firstName} {patient.lastName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-white/90 text-sm">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {calculateAge(patient.dateOfBirth)} yrs, {patient.gender || 'N/A'}
                    </span>
                    {patient.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {patient.phone}
                      </span>
                    )}
                    {patient.bloodType && (
                      <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                        <Droplets className="w-3 h-3" />
                        {patient.bloodType}
                      </span>
                    )}
                    {patient.allergies && (
                      <span className="flex items-center gap-1 text-warning-light text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {patient.allergies}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Visit Info - Compact */}
              <div className="flex items-center gap-6 sm:gap-8">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${statusConfig.light}`}>
                    <StatusIcon className={`w-4 h-4 ${statusConfig.text}`} />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs">Status</p>
                    <p className="text-white font-semibold text-sm">{statusConfig.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/80" />
                  <div>
                    <p className="text-white/70 text-xs">Date</p>
                    <p className="text-white font-medium text-sm">{formatDateMedium(visit.visitDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-white/80" />
                  <div>
                    <p className="text-white/70 text-xs">Type</p>
                    <p className="text-white font-medium text-sm">{visit.visitType || 'Consultation'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-5">
          {/* Main Content - Left Side */}
          <div className="col-span-12 lg:col-span-8 space-y-5">
            {/* Vital Signs Grid */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-primary">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Vital Signs</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {visit.bloodPressure && (
                  <VitalCard
                    icon={Heart}
                    label="Blood Pressure"
                    value={visit.bloodPressure}
                    unit="mmHg"
                    color="from-rose-500 to-pink-600"
                    normalRange="120/80"
                    trend="stable"
                  />
                )}
                
                {visit.heartRate && (
                  <VitalCard
                    icon={Activity}
                    label="Heart Rate"
                    value={visit.heartRate}
                    unit="bpm"
                    color="from-fuchsia-500 to-purple-600"
                    normalRange="60-100"
                    trend="stable"
                  />
                )}
                
                {visit.temperature && (
                  <VitalCard
                    icon={Thermometer}
                    label="Temperature"
                    value={visit.temperature}
                    unit="°C"
                    color="from-orange-500 to-amber-600"
                    normalRange="36.5-37.5"
                    trend={visit.temperature > 37.5 ? 'up' : visit.temperature < 36 ? 'down' : 'stable'}
                  />
                )}
                
                {visit.weight && (
                  <VitalCard
                    icon={Scale}
                    label="Weight"
                    value={visit.weight}
                    unit="kg"
                    color="from-blue-500 to-cyan-600"
                  />
                )}

                {parsedNotes?.vitalSigns?.respiratoryRate && (
                  <VitalCard
                    icon={Wind}
                    label="Respiratory Rate"
                    value={parsedNotes.vitalSigns.respiratoryRate}
                    unit="/min"
                    color="from-teal-500 to-emerald-600"
                    normalRange="12-20"
                  />
                )}

                {parsedNotes?.vitalSigns?.oxygenSaturation && (
                  <VitalCard
                    icon={Droplets}
                    label="SpO₂"
                    value={parsedNotes.vitalSigns.oxygenSaturation}
                    unit="%"
                    color="from-indigo-500 to-blue-600"
                    normalRange="95-100"
                  />
                )}

                {visit.height && (
                  <VitalCard
                    icon={Ruler}
                    label="Height"
                    value={visit.height}
                    unit="cm"
                    color="from-violet-500 to-purple-600"
                  />
                )}

                {bmi && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5">
                    <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                          <Scale className="w-5 h-5 text-white" />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full bg-white/90 ${getBMICategory(parseFloat(bmi)).color}`}>
                          {getBMICategory(parseFloat(bmi)).text}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm font-medium mb-1">BMI</p>
                      <span className="text-3xl font-bold text-white tracking-tight">{bmi}</span>
                      <div className="mt-3">
                        <Progress value={getBMICategory(parseFloat(bmi)).progress} className="h-1.5 bg-white/20" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {!visit.bloodPressure && !visit.heartRate && !visit.temperature && !visit.weight && (
                <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
                  <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground font-medium text-sm">No vital signs recorded</p>
                </div>
              )}
            </div>

            {/* Tabs for Clinical Details */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
              <TabsList className="bg-muted/80 p-1 rounded-xl w-full justify-start gap-1">
                <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="examination" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Examination
                </TabsTrigger>
                <TabsTrigger value="prescriptions" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Pill className="w-4 h-4 mr-2" />
                  Prescriptions
                </TabsTrigger>
                <TabsTrigger value="labs" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <FlaskRound className="w-4 h-4 mr-2" />
                  Lab Results
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-3 mt-3">
                {/* Chief Complaint */}
                <Card className="border border-border shadow-sm bg-card overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-primary to-accent" />
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-1.5 rounded-lg bg-primary-light">
                        <Clipboard className="w-4 h-4 text-primary" />
                      </div>
                      Chief Complaint
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-foreground text-sm leading-relaxed">
                      {visit.complaint || (
                        <span className="text-muted-foreground italic">No chief complaint documented</span>
                      )}
                    </p>
                  </CardContent>
                </Card>

                {/* History of Present Illness */}
                {parsedNotes?.historyOfPresentIllness && (
                  <Card className="border border-border shadow-sm bg-card overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-primary/80 to-accent/80" />
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 rounded-lg bg-primary-light">
                          <History className="w-4 h-4 text-primary" />
                        </div>
                        History of Present Illness
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                        {parsedNotes.historyOfPresentIllness}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Diagnosis */}
                <Card className="border border-border shadow-sm bg-card overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-primary to-primary-dark" />
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-1.5 rounded-lg bg-primary-light">
                        <Stethoscope className="w-4 h-4 text-primary" />
                      </div>
                      Diagnosis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Primary</p>
                      <p className="text-foreground font-medium">
                        {visit.diagnosis || (
                          <span className="text-muted-foreground italic font-normal text-sm">No diagnosis recorded</span>
                        )}
                      </p>
                    </div>
                    {parsedNotes?.secondaryDiagnoses && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Secondary</p>
                        <p className="text-foreground text-sm">{parsedNotes.secondaryDiagnoses}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Treatment Plan */}
                <Card className="border border-border shadow-sm bg-card overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-accent to-accent-hover" />
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-1.5 rounded-lg bg-accent-light">
                        <FileText className="w-4 h-4 text-accent" />
                      </div>
                      Treatment Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                      {visit.treatment || (
                        <span className="text-muted-foreground italic">No treatment plan documented</span>
                      )}
                    </p>
                  </CardContent>
                </Card>

                {/* Patient Instructions */}
                {parsedNotes?.patientInstructions && (
                  <Card className="border border-border shadow-sm bg-warning-light overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-warning to-warning/80" />
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 rounded-lg bg-warning/20">
                          <AlertCircle className="w-4 h-4 text-warning" />
                        </div>
                        Patient Instructions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                        {parsedNotes.patientInstructions}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Examination Tab */}
              <TabsContent value="examination" className="space-y-3 mt-3">
                {parsedNotes?.physicalExamination && Object.values(parsedNotes.physicalExamination).some(v => v) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parsedNotes.physicalExamination.generalAppearance && (
                      <Card className="border border-border shadow-sm bg-card">
                        <CardHeader className="pb-2 pt-3 px-4">
                          <CardTitle className="text-xs font-medium text-muted-foreground uppercase">General Appearance</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                          <p className="text-foreground text-sm">{parsedNotes.physicalExamination.generalAppearance}</p>
                        </CardContent>
                      </Card>
                    )}
                    {parsedNotes.physicalExamination.cardiovascularSystem && (
                      <Card className="border border-border shadow-sm bg-card">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Cardiovascular System</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-foreground">{parsedNotes.physicalExamination.cardiovascularSystem}</p>
                        </CardContent>
                      </Card>
                    )}
                    {parsedNotes.physicalExamination.respiratorySystem && (
                      <Card className="border border-border shadow-sm bg-card">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Respiratory System</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-foreground">{parsedNotes.physicalExamination.respiratorySystem}</p>
                        </CardContent>
                      </Card>
                    )}
                    {parsedNotes.physicalExamination.gastrointestinalSystem && (
                      <Card className="border border-border shadow-sm bg-card">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Gastrointestinal System</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-foreground">{parsedNotes.physicalExamination.gastrointestinalSystem}</p>
                        </CardContent>
                      </Card>
                    )}
                    {parsedNotes.physicalExamination.neurologicalSystem && (
                      <Card className="border border-border shadow-sm bg-card">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Neurological System</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-foreground">{parsedNotes.physicalExamination.neurologicalSystem}</p>
                        </CardContent>
                      </Card>
                    )}
                    {parsedNotes.physicalExamination.musculoskeletalSystem && (
                      <Card className="border border-border shadow-sm bg-card">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Musculoskeletal System</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-foreground">{parsedNotes.physicalExamination.musculoskeletalSystem}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="border border-border shadow-sm bg-card">
                    <CardContent className="py-8 text-center">
                      <Stethoscope className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium text-sm">No physical examination documented</p>
                    </CardContent>
                  </Card>
                )}

                {/* Clinical Assessment */}
                {parsedNotes?.assessment && (
                  <Card className="border border-border shadow-sm bg-card overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-primary to-accent" />
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 rounded-lg bg-primary-light">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        Clinical Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                        {parsedNotes.assessment}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Prescriptions Tab */}
              <TabsContent value="prescriptions" className="mt-3">
                {visitPrescriptions.length > 0 ? (
                  <div className="space-y-2">
                    {visitPrescriptions.map((prescription) => (
                      <Card key={prescription.id} className="border border-border shadow-sm bg-card overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-warning to-warning/80" />
                        <CardContent className="p-3">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-warning">
                              <Pill className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{prescription.medicationName}</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary">{prescription.dosage}</Badge>
                                <Badge variant="secondary">{prescription.frequency}</Badge>
                                <Badge variant="secondary">{prescription.duration}</Badge>
                              </div>
                              {prescription.instructions && (
                                <p className="text-sm text-muted-foreground mt-2">{prescription.instructions}</p>
                              )}
                            </div>
                            <Badge className={prescription.status === 'active' ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'}>
                              {prescription.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : parsedNotes?.medications ? (
                  <Card className="border border-border shadow-sm bg-card overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-warning to-warning/80" />
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 rounded-lg bg-warning-light">
                          <Pill className="w-5 h-5 text-warning" />
                        </div>
                        Prescribed Medications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {parsedNotes.medications.split(',').map((med: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-warning-light rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-warning flex-shrink-0" />
                            <span className="text-foreground">{med.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-border shadow-sm bg-card">
                    <CardContent className="py-8 text-center">
                      <Pill className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium text-sm">No prescriptions for this visit</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Lab Results Tab */}
              <TabsContent value="labs" className="mt-3">
                {labResults && labResults.length > 0 ? (
                  <div className="space-y-2">
                    {labResults.slice(0, 5).map((lab) => (
                      <Card key={lab.id} className="border border-border shadow-sm bg-card overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-accent to-accent-hover" />
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="p-3 rounded-xl bg-accent">
                                <FlaskRound className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground">{lab.testName}</h4>
                                <p className="text-sm text-muted-foreground mt-1">Result: <span className="font-medium text-foreground">{lab.result}</span></p>
                                {lab.normalRange && (
                                  <p className="text-xs text-muted-foreground mt-0.5">Normal range: {lab.normalRange}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={lab.status === 'completed' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}>
                                {lab.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">{formatDateMedium(lab.orderedDate)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border border-border shadow-sm bg-card">
                    <CardContent className="py-8 text-center">
                      <FlaskRound className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium text-sm">No lab results available</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Right Side */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Follow-up Card */}
            {visit.followUpDate && (
              <Card className="border border-border shadow-sm bg-warning-light overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-warning to-warning/80" />
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <div className="p-1.5 rounded-lg bg-warning/20">
                      <Calendar className="w-4 h-4 text-warning" />
                    </div>
                    Follow-up Scheduled
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-base font-semibold text-foreground">{formatDateLong(visit.followUpDate)}</p>
                  {parsedNotes?.followUpInstructions && (
                    <p className="text-xs text-muted-foreground mt-2">{parsedNotes.followUpInstructions}</p>
                  )}
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    <Calendar className="w-3.5 h-3.5 mr-2" />
                    Add to Calendar
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Visit Timeline */}
            <Card className="border border-border shadow-sm bg-card">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <History className="w-4 h-4 text-muted-foreground" />
                  </div>
                  Recent Visits
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {sortedVisits.length > 0 ? (
                  <div className="space-y-1.5">
                    {sortedVisits.map((v) => (
                      <TimelineItem 
                        key={v.id} 
                        visit={v} 
                        isActive={v.id === parseInt(visitId || '0')} 
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs text-center py-3">No visit history</p>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-primary text-xs"
                  onClick={() => navigate(`/patients/${patientId}`)}
                >
                  View All Visits
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-border shadow-sm bg-card">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => navigate(`/patients/${patientId}/visits/new`)}
                >
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Record New Visit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => navigate(`/patients/${patientId}/prescriptions/new`)}
                >
                  <Pill className="w-4 h-4 mr-2" />
                  Create Prescription
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => navigate(`/patients/${patientId}/lab-orders/new`)}
                >
                  <FlaskRound className="w-4 h-4 mr-2" />
                  Order Lab Test
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => navigate(`/appointments/new?patientId=${patientId}`)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Appointment
                </Button>
              </CardContent>
            </Card>

            {/* Additional Notes */}
            {parsedNotes?.additionalNotes && (
              <Card className="border border-border shadow-sm bg-card">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <div className="p-1.5 rounded-lg bg-muted">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-muted-foreground text-xs whitespace-pre-wrap">{parsedNotes.additionalNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
