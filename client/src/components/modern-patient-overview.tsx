import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { PatientTimeline } from './patient-timeline';
import { PatientAlertsPanel } from './patient-alerts-panel';
import { PatientSafetyAlerts, QuickSafetyIndicator } from './patient-safety-alerts';
import PatientVitalSignsTracker from './patient-vital-signs-tracker';
import SmartAppointmentScheduler from './smart-appointment-scheduler';
import { PatientCommunicationHub } from './patient-communication-hub';
import ConsultationFormSelector from './consultation-form-selector';
import { PatientDropdownMenu } from './patient-dropdown-menu';
import { useLocation } from "wouter";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
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
  Stethoscope,
  Plus,
  ChevronDown,
  Edit,
  Share,
  UserCheck,
  Archive,
  Users,
  Upload,
  Clock,
  Printer
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
  onAddPrescription?: () => void;
  onRecordVisit?: () => void;
  onEditPatient?: () => void;
  onPrintRecord?: () => void;
}

export function ModernPatientOverview({ 
  patient, 
  visits, 
  recentLabs = [], 
  activePrescriptions = [],
  onAddPrescription,
  onRecordVisit,
  onEditPatient,
  onPrintRecord
}: ModernPatientOverviewProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch patient prescriptions from the API
  const { data: patientPrescriptions = [], isLoading: prescriptionsLoading } = useQuery({
    queryKey: ['/api/patients', patient.id, 'prescriptions'],
    queryFn: () => fetch(`/api/patients/${patient.id}/prescriptions`).then(res => res.json())
  });

  // Use fetched prescriptions if available, otherwise use passed activePrescriptions
  const displayPrescriptions = patientPrescriptions.length > 0 ? patientPrescriptions : activePrescriptions;

  const handleEditPrescription = (prescription: any) => {
    toast({
      title: "Edit Prescription",
      description: `Opening edit form for ${prescription.medicationName}`,
    });
    // Open prescription add modal which can be used for editing
    if (onAddPrescription) {
      onAddPrescription();
    }
  };

  const handlePrintPrescription = (prescription: any) => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Prescription</h2>
        <hr>
        <p><strong>Patient:</strong> ${patient.firstName} ${patient.lastName}</p>
        <p><strong>Patient ID:</strong> HC${patient.id?.toString().padStart(6, "0")}</p>
        <p><strong>Date:</strong> ${new Date(prescription.startDate).toLocaleDateString()}</p>
        <hr>
        <h3>Medication Details</h3>
        <p><strong>Medication:</strong> ${prescription.medicationName}</p>
        <p><strong>Dosage:</strong> ${prescription.dosage}</p>
        <p><strong>Frequency:</strong> ${prescription.frequency}</p>
        <p><strong>Duration:</strong> ${prescription.duration}</p>
        <p><strong>Instructions:</strong> ${prescription.instructions || 'None'}</p>
        <p><strong>Prescribed by:</strong> ${prescription.prescribedBy}</p>
        <hr>
        <p style="margin-top: 30px;"><strong>Doctor's Signature:</strong> _________________</p>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    
    toast({
      title: "Printing Prescription",
      description: `Prescription for ${prescription.medicationName} sent to printer`,
    });
  };
  
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
            <PatientDropdownMenu
              patient={patient}
              onEditPatient={onEditPatient}
              onRecordVisit={onRecordVisit}
              onAddPrescription={onAddPrescription}
              onPrintRecord={onPrintRecord}
            >
              <Button variant="ghost" className="h-auto p-0 rounded-full hover:scale-105 transition-transform">
                <Avatar className="w-10 h-10 cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                    {getPatientInitials(patient.firstName, patient.lastName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </PatientDropdownMenu>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div>
                  <PatientDropdownMenu
                    patient={patient}
                    onEditPatient={onEditPatient}
                    onRecordVisit={onRecordVisit}
                    onAddPrescription={onAddPrescription}
                    onPrintRecord={onPrintRecord}
                    showHeader={false}
                  >
                    <Button variant="ghost" className="h-auto p-0 hover:bg-gray-100 rounded-md px-2 py-1">
                      <div className="text-left">
                        <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap flex items-center gap-1">
                          {patient.firstName} {patient.lastName}
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </h2>
                        <p className="text-xs text-gray-500">
                          ID: HC{patient.id?.toString().padStart(6, "0")} • {getPatientAge(patient.dateOfBirth)} years old • {patient.gender}
                        </p>
                      </div>
                    </Button>
                  </PatientDropdownMenu>
                </div>
                <QuickSafetyIndicator patient={patient} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Tabbed Interface - Full Width */}
      <Tabs defaultValue="overview" className="w-full h-full">
        <TabsList className="grid w-full grid-cols-9 mb-4 h-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-1 shadow-sm">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 hover:bg-white/60">
            <User className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="medications" className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 hover:bg-white/60">
            <Pill className="w-4 h-4" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 hover:bg-white/60">
            <Activity className="w-4 h-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="safety" className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 hover:bg-white/60">
            <Heart className="w-4 h-4" />
            Safety
          </TabsTrigger>
          <TabsTrigger value="vitals" className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 hover:bg-white/60">
            <Monitor className="w-4 h-4" />
            Vitals
          </TabsTrigger>
          <TabsTrigger value="record-visit" className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 hover:bg-white/60">
            <Calendar className="w-4 h-4" />
            Visit
          </TabsTrigger>
          <TabsTrigger value="consultation" className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 hover:bg-white/60">
            <FileText className="w-4 h-4" />
            Forms
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 hover:bg-white/60">
            <CalendarDays className="w-4 h-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 hover:bg-white/60">
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-purple-500" />
                Medications & Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Current Active Medications */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Current Medications</h3>
                    <Button 
                      onClick={onAddPrescription} 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Medication
                    </Button>
                  </div>
                  
                  {prescriptionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-slate-500">Loading prescriptions...</div>
                    </div>
                  ) : displayPrescriptions.length > 0 ? (
                    <div className="grid gap-4">
                      {displayPrescriptions.map((prescription: any) => (
                        <div key={prescription.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-slate-800 text-lg">
                                  {prescription.medicationName}
                                </h4>
                                {prescription.medicationId && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    ✓ Verified
                                  </Badge>
                                )}
                                <Badge className={
                                  prescription.status === "active" 
                                    ? "bg-green-100 text-green-800 border-green-200" 
                                    : prescription.status === "completed"
                                    ? "bg-blue-100 text-blue-800 border-blue-200"
                                    : "bg-gray-100 text-gray-800 border-gray-200"
                                }>
                                  {prescription.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                <div className="bg-slate-50 p-3 rounded-md">
                                  <span className="font-medium text-slate-700 block">Dosage</span>
                                  <p className="text-slate-800 mt-1">{prescription.dosage}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-md">
                                  <span className="font-medium text-slate-700 block">Frequency</span>
                                  <p className="text-slate-800 mt-1">{prescription.frequency}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-md">
                                  <span className="font-medium text-slate-700 block">Duration</span>
                                  <p className="text-slate-800 mt-1">{prescription.duration}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-md">
                                  <span className="font-medium text-slate-700 block">Prescribed by</span>
                                  <p className="text-slate-800 mt-1">{prescription.prescribedBy}</p>
                                </div>
                              </div>
                              
                              {prescription.instructions && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                                  <span className="font-medium text-slate-700 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Special Instructions
                                  </span>
                                  <p className="text-slate-800 mt-2">{prescription.instructions}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                                <div className="flex items-center space-x-4 text-xs text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Started: {new Date(prescription.startDate).toLocaleDateString()}</span>
                                  </div>
                                  {prescription.endDate && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>Ends: {new Date(prescription.endDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-slate-600 hover:text-slate-800"
                                    onClick={() => handleEditPrescription(prescription)}
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-slate-600 hover:text-slate-800"
                                    onClick={() => handlePrintPrescription(prescription)}
                                  >
                                    <Printer className="w-3 h-3 mr-1" />
                                    Print
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Pill className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Active Prescriptions</h3>
                    <p className="text-sm text-gray-500 mb-4">Start by adding the first prescription for this patient</p>
                    <Button onClick={onAddPrescription} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Prescription
                    </Button>
                  </div>
                )}
                </div>
                
                {/* Medication History Section */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Medication History</h3>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">Previous prescriptions and completed medications will appear here.</p>
                    <div className="text-xs text-slate-500">
                      Track medication adherence, side effects, and treatment outcomes for better patient care.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                  <PatientDropdownMenu
                    patient={patient}
                    onEditPatient={onEditPatient}
                    onRecordVisit={onRecordVisit}
                    onAddPrescription={onAddPrescription}
                    onPrintRecord={onPrintRecord}
                  >
                    <Avatar className="w-16 h-16 cursor-pointer hover:scale-105 transition-transform">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                        {getPatientInitials(patient.firstName, patient.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </PatientDropdownMenu>
                  <div className="flex-1">
                    <PatientDropdownMenu
                      patient={patient}
                      onEditPatient={onEditPatient}
                      onRecordVisit={onRecordVisit}
                      onAddPrescription={onAddPrescription}
                      onPrintRecord={onPrintRecord}
                      showHeader={false}
                    >
                      <h2 className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
                        {patient.firstName} {patient.lastName}
                      </h2>
                    </PatientDropdownMenu>
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
                  <Badge variant="secondary">{displayPrescriptions.length}</Badge>
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

        {/* Record Visit Tab - Dedicated */}
        <TabsContent value="record-visit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-500" />
                Record Patient Visit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">Visit Recording Interface</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Record comprehensive visit details including vital signs, symptoms, diagnosis, and treatment plans.
                  </p>
                  <Button 
                    onClick={onRecordVisit}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Start New Visit Recording
                  </Button>
                </div>

                {/* Recent Visits Summary */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Recent Visits</h4>
                  {visits.length > 0 ? (
                    <div className="space-y-2">
                      {visits.slice(0, 5).map((visit: any) => (
                        <div key={visit.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {visit.visitType || 'Consultation'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(visit.visitDate).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-1">
                                {visit.complaint || visit.diagnosis || 'No details recorded'}
                              </p>
                              {visit.bloodPressure && (
                                <div className="text-xs text-gray-500">
                                  BP: {visit.bloodPressure}
                                  {visit.heartRate && ` • HR: ${visit.heartRate}`}
                                </div>
                              )}
                            </div>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Stethoscope className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No visits recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
                    onClick={() => navigate(`/patients/${patient.id}/record-visit`)}
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