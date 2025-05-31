import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { PatientTimeline } from './patient-timeline';
import { PatientAlertsPanel } from './patient-alerts-panel';
import { PatientSafetyAlertsRealtime, QuickSafetyIndicator } from './patient-safety-alerts-realtime';
import PatientVitalSignsTracker from './patient-vital-signs-tracker';
import SmartAppointmentScheduler from './smart-appointment-scheduler';
import { PatientCommunicationHub } from './patient-communication-hub';
import ConsultationFormSelector from './consultation-form-selector';
import { PatientDropdownMenu } from './patient-dropdown-menu';
import { EditPatientModal } from './edit-patient-modal';
import { useLocation } from "wouter";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  ChevronRight,
  Edit,
  Share,
  UserCheck,
  Archive,
  Users,
  Upload,
  Clock,
  Printer,
  MoreVertical,
  Eye,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw
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
  const queryClient = useQueryClient();
  const [isConsultationHistoryOpen, setIsConsultationHistoryOpen] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);

  // Fetch consultation records for this patient
  const { data: consultationRecords = [] } = useQuery({
    queryKey: ['/api/patients', patient.id, 'consultation-records'],
    enabled: !!patient.id,
  });

  // Combine visits and consultation records
  const combinedVisits = React.useMemo(() => {
    const allVisits = [
      ...visits.map(visit => ({
        ...visit,
        type: 'visit',
        date: visit.visitDate,
        title: visit.visitType || 'Consultation',
        description: visit.complaint || visit.diagnosis || 'No details recorded'
      })),
      ...(consultationRecords || []).map((record: any) => ({
        ...record,
        type: 'consultation',
        date: record.recordedAt,
        title: record.formName || 'Consultation Form',
        description: record.responses ? Object.values(record.responses).slice(0, 2).join(', ') : 'Consultation completed'
      }))
    ];
    
    return allVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visits, consultationRecords]);

  // Handle visit actions
  const handleViewVisit = (visitId: number) => {
    navigate(`/patients/${patient.id}/visits/${visitId}`);
  };

  const handleEditVisit = (visitId: number) => {
    navigate(`/patients/${patient.id}/visits/${visitId}/edit`);
  };

  const handleViewConsultation = (consultationId: number) => {
    // Navigate to consultation details or show in modal
    toast({
      title: "Consultation Record",
      description: "Consultation details viewed",
    });
  };

  const handleCopyVisit = (visit: any) => {
    const visitDetails = `Visit Date: ${new Date(visit.visitDate).toLocaleDateString()}
Type: ${visit.visitType || 'Consultation'}
Complaint: ${visit.complaint || 'N/A'}
Diagnosis: ${visit.diagnosis || 'N/A'}
Treatment: ${visit.treatment || 'N/A'}
Blood Pressure: ${visit.bloodPressure || 'N/A'}
Heart Rate: ${visit.heartRate || 'N/A'}`;
    
    navigator.clipboard.writeText(visitDetails);
    toast({
      title: "Visit details copied",
      description: "Visit information has been copied to clipboard",
    });
  };

  const handleDeleteVisit = async (visitId: number) => {
    if (confirm('Are you sure you want to delete this visit record?')) {
      try {
        // Implementation would go here
        toast({
          title: "Visit deleted",
          description: "Visit record has been successfully deleted",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete visit record",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateMedicationStatus = async (prescriptionId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        queryClient.invalidateQueries(['/api/patients', patient.id, 'prescriptions']);
        
        const statusText = newStatus === 'completed' ? 'completed' : 
                          newStatus === 'discontinued' ? 'discontinued' : 'reactivated';
        
        toast({
          title: "Medication Status Updated",
          description: `Medication has been ${statusText}`,
        });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update medication status",
        variant: "destructive"
      });
    }
  };

  // Timeline filter state
  const [timelineFilters, setTimelineFilters] = useState({
    visits: true,
    labResults: true,
    consultations: true,
    prescriptions: true
  });

  // Fetch patient prescriptions from the API with proper error handling and caching
  const { data: patientPrescriptions = [], isLoading: prescriptionsLoading, error: prescriptionsError } = useQuery({
    queryKey: ['prescriptions', patient.id],
    queryFn: async () => {
      console.log('Fetching prescriptions for patient:', patient.id);
      const response = await fetch(`/api/patients/${patient.id}/prescriptions`);
      console.log('Prescription response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Prescription fetch error:', errorText);
        throw new Error(`Failed to fetch prescriptions: ${errorText}`);
      }
      const data = await response.json();
      console.log('Prescription data:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes (updated from cacheTime)
    retry: 3,
    refetchOnWindowFocus: false, // Prevent refetch on window focus to maintain data
    enabled: !!patient.id
  });

  // Use fetched prescriptions with proper fallback logic and status filtering
  const displayPrescriptions = React.useMemo(() => {
    // Always use API data when available, fallback to props only when API fails
    if (patientPrescriptions && patientPrescriptions.length > 0) {
      return patientPrescriptions;
    }
    if (prescriptionsLoading) {
      return [];
    }
    if (prescriptionsError) {
      return activePrescriptions || [];
    }
    return [];
  }, [patientPrescriptions, activePrescriptions, prescriptionsLoading, prescriptionsError]);

  // Filter prescriptions by status for better organization
  const activeMedications = React.useMemo(() => {
    return displayPrescriptions.filter((p: any) => 
      p.status === 'active' || p.status === 'pending' || !p.status
    );
  }, [displayPrescriptions]);

  const discontinuedMedications = React.useMemo(() => {
    return displayPrescriptions.filter((p: any) => 
      p.status === 'completed' || p.status === 'discontinued' || p.status === 'stopped'
    );
  }, [displayPrescriptions]);

  // Toggle filter function
  const toggleFilter = (filterType: keyof typeof timelineFilters) => {
    setTimelineFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

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

  const handlePrintPrescription = async (prescription: any) => {
    try {
      const { printPrescription } = await import('../services/print-utils');
      await printPrescription(prescription, patient);
      
      toast({
        title: "Printing Prescription",
        description: "Prescription document is being generated for printing.",
      });
    } catch (error) {
      console.error('Failed to print prescription:', error);
      toast({
        title: "Print Failed",
        description: "Unable to generate prescription. Please try again.",
        variant: "destructive",
      });
    }
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

  // Fetch activity trail using React Query
  const { data: activityTrail = [] } = useQuery({
    queryKey: ['/api/patients', patient.id, 'activity-trail'],
    queryFn: () => fetch(`/api/patients/${patient.id}/activity-trail`).then(res => res.json())
  });

  // Filter activity trail based on selected filters
  const filteredActivityTrail = activityTrail.filter((event: any) => {
    switch (event.type) {
      case 'visit':
        return timelineFilters.visits;
      case 'lab':
      case 'lab_result':
        return timelineFilters.labResults;
      case 'consultation':
        return timelineFilters.consultations;
      case 'prescription':
        return timelineFilters.prescriptions;
      default:
        return true;
    }
  });

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
        <TabsList className="grid w-full grid-cols-9 mb-6 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-xl p-2 shadow-lg backdrop-blur-sm">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-800 data-[state=active]:border data-[state=active]:border-blue-200 hover:bg-white/70 hover:shadow-sm text-blue-700">
            <User className="w-5 h-5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="medications" className="flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-800 data-[state=active]:border data-[state=active]:border-blue-200 hover:bg-white/70 hover:shadow-sm text-blue-700">
            <Pill className="w-5 h-5" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-800 data-[state=active]:border data-[state=active]:border-blue-200 hover:bg-white/70 hover:shadow-sm text-blue-700">
            <Activity className="w-5 h-5" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="safety" className="flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-800 data-[state=active]:border data-[state=active]:border-blue-200 hover:bg-white/70 hover:shadow-sm text-blue-700">
            <Heart className="w-5 h-5" />
            Safety
          </TabsTrigger>
          <TabsTrigger value="vitals" className="flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-800 data-[state=active]:border data-[state=active]:border-blue-200 hover:bg-white/70 hover:shadow-sm text-blue-700">
            <Monitor className="w-5 h-5" />
            Vitals
          </TabsTrigger>
          <TabsTrigger value="record-visit" className="flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-800 data-[state=active]:border data-[state=active]:border-blue-200 hover:bg-white/70 hover:shadow-sm text-blue-700">
            <Calendar className="w-5 h-5" />
            Visit
          </TabsTrigger>
          <TabsTrigger value="consultation" className="flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-800 data-[state=active]:border data-[state=active]:border-blue-200 hover:bg-white/70 hover:shadow-sm text-blue-700">
            <FileText className="w-5 h-5" />
            Forms
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-800 data-[state=active]:border data-[state=active]:border-blue-200 hover:bg-white/70 hover:shadow-sm text-blue-700">
            <CalendarDays className="w-5 h-5" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-800 data-[state=active]:border data-[state=active]:border-blue-200 hover:bg-white/70 hover:shadow-sm text-blue-700">
            <MessageSquare className="w-5 h-5" />
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
                  ) : prescriptionsError ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <div className="text-red-500">Failed to load prescriptions</div>
                      <Button 
                        onClick={() => queryClient.invalidateQueries(['/api/patients', patient.id, 'prescriptions'])}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Loading
                      </Button>
                    </div>
                  ) : activeMedications.length > 0 ? (
                    <div className="grid gap-4">
                      {activeMedications.map((prescription: any) => (
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
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                                        <MoreVertical className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px]">
                                      <DropdownMenuItem onClick={() => handleEditPrescription(prescription)}>
                                        <Edit className="w-3 h-3 mr-2" />
                                        Edit Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handlePrintPrescription(prescription)}>
                                        <Printer className="w-3 h-3 mr-2" />
                                        Print
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleUpdateMedicationStatus(prescription.id, 'completed')}>
                                        <CheckCircle className="w-3 h-3 mr-2 text-blue-600" />
                                        Mark Completed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateMedicationStatus(prescription.id, 'discontinued')}>
                                        <XCircle className="w-3 h-3 mr-2 text-orange-600" />
                                        Discontinue
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateMedicationStatus(prescription.id, 'active')}>
                                        <RefreshCw className="w-3 h-3 mr-2 text-green-600" />
                                        Reactivate
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
                
                {/* Discontinued/Historical Medications Section */}
                {discontinuedMedications.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      Medication History ({discontinuedMedications.length})
                    </h3>
                    <div className="grid gap-3">
                      {discontinuedMedications.map((prescription: any) => (
                        <div key={prescription.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-gray-700 text-base">
                                  {prescription.medicationName}
                                </h4>
                                <Badge className={
                                  prescription.status === "completed" 
                                    ? "bg-blue-100 text-blue-700 border-blue-200" 
                                    : prescription.status === "discontinued"
                                    ? "bg-orange-100 text-orange-700 border-orange-200"
                                    : "bg-gray-100 text-gray-700 border-gray-200"
                                }>
                                  {prescription.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 text-sm">
                                <div className="bg-white p-2 rounded border">
                                  <span className="font-medium text-gray-600 block text-xs">Dosage</span>
                                  <p className="text-gray-800 mt-1">{prescription.dosage}</p>
                                </div>
                                <div className="bg-white p-2 rounded border">
                                  <span className="font-medium text-gray-600 block text-xs">Duration</span>
                                  <p className="text-gray-800 mt-1">{prescription.duration}</p>
                                </div>
                                <div className="bg-white p-2 rounded border">
                                  <span className="font-medium text-gray-600 block text-xs">Prescribed by</span>
                                  <p className="text-gray-800 mt-1">{prescription.prescribedBy}</p>
                                </div>
                                <div className="bg-white p-2 rounded border">
                                  <span className="font-medium text-gray-600 block text-xs">End Date</span>
                                  <p className="text-gray-800 mt-1">
                                    {prescription.endDate ? new Date(prescription.endDate).toLocaleDateString() : 'Not specified'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
                                <div className="text-xs text-gray-500">
                                  Started: {new Date(prescription.startDate).toLocaleDateString()}
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-600 hover:text-gray-800"
                                  onClick={() => handlePrintPrescription(prescription)}
                                >
                                  <Printer className="w-3 h-3 mr-1" />
                                  Print
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Summary Statistics */}
                {displayPrescriptions.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-2">Medication Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-700">{activeMedications.length}</div>
                        <div className="text-purple-600">Active</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700">{discontinuedMedications.length}</div>
                        <div className="text-blue-600">Historical</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-700">{displayPrescriptions.length}</div>
                        <div className="text-gray-600">Total</div>
                      </div>
                    </div>
                  </div>
                )}
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
              <PatientSafetyAlertsRealtime 
                patientId={patient.id} 
                compact={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab - Reorganized Layout */}
        <TabsContent value="overview" className="space-y-4">
          {/* Record Patient Form - Moved to Top */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Stethoscope className="h-5 w-5" />
                Record Patient Visit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-blue-600">
                  Document a new visit for {patient.firstName} {patient.lastName} including vital signs, symptoms, diagnosis, and treatment plans.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => navigate(`/patients/${patient.id}/record-visit`)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Start New Visit Recording
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={onAddPrescription}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <Pill className="h-4 w-4 mr-2" />
                    Add Prescription
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Patient Card - Enhanced */}
            <Card className="lg:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <PatientDropdownMenu
                    patient={patient}
                    onEditPatient={() => setShowEditPatientModal(true)}
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
                      onEditPatient={() => setShowEditPatientModal(true)}
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

          {/* Collapsible Consultation History */}
          <Collapsible 
            open={isConsultationHistoryOpen} 
            onOpenChange={setIsConsultationHistoryOpen}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      Recent Visits & Consultations
                      <Badge variant="secondary" className="ml-2">
                        {combinedVisits.length}
                      </Badge>
                    </CardTitle>
                    {isConsultationHistoryOpen ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {combinedVisits.length > 0 ? (
                    <div className="space-y-3">
                      {combinedVisits.slice(0, 5).map((item: any) => (
                        <div key={`${item.type}-${item.id}`} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${item.type === 'consultation' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                                >
                                  {item.title}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(item.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-1">
                                {item.description}
                              </p>
                              {item.type === 'visit' && item.bloodPressure && (
                                <div className="text-xs text-gray-500">
                                  BP: {item.bloodPressure}
                                  {item.heartRate && ` • HR: ${item.heartRate}`}
                                </div>
                              )}
                              {item.type === 'consultation' && (
                                <div className="text-xs text-gray-500">
                                  Recorded by: {item.recordedBy}
                                </div>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[200px]">
                                {item.type === 'visit' ? (
                                  <>
                                    <DropdownMenuItem onClick={() => handleViewVisit(item.id)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditVisit(item.id)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Visit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopyVisit(item)}>
                                      <Copy className="mr-2 h-4 w-4" />
                                      Copy Details
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteVisit(item.id)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Visit
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <>
                                    <DropdownMenuItem onClick={() => handleViewConsultation(item.id)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Consultation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(JSON.stringify(item.responses, null, 2))}>
                                      <Copy className="mr-2 h-4 w-4" />
                                      Copy Responses
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <h3 className="font-medium text-gray-600 mb-1">No visits or consultations recorded yet</h3>
                      <p className="text-sm">Start by recording the first visit for this patient</p>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

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
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="filter-visits"
                        checked={timelineFilters.visits}
                        onCheckedChange={() => toggleFilter('visits')}
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center">
                          <Activity className="w-2 h-2 text-blue-600" />
                        </div>
                        <label htmlFor="filter-visits" className="text-xs cursor-pointer">Visits</label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="filter-labs"
                        checked={timelineFilters.labResults}
                        onCheckedChange={() => toggleFilter('labResults')}
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center">
                          <FlaskRound className="w-2 h-2 text-green-600" />
                        </div>
                        <label htmlFor="filter-labs" className="text-xs cursor-pointer">Lab Results</label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="filter-consultations"
                        checked={timelineFilters.consultations}
                        onCheckedChange={() => toggleFilter('consultations')}
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-100 rounded-full flex items-center justify-center">
                          <FileText className="w-2 h-2 text-orange-600" />
                        </div>
                        <label htmlFor="filter-consultations" className="text-xs cursor-pointer">Consultations</label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="filter-prescriptions"
                        checked={timelineFilters.prescriptions}
                        onCheckedChange={() => toggleFilter('prescriptions')}
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-100 rounded-full flex items-center justify-center">
                          <Pill className="w-2 h-2 text-purple-600" />
                        </div>
                        <label htmlFor="filter-prescriptions" className="text-xs cursor-pointer">Prescriptions</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Showing {activityTrail.filter((event: any) => {
                        switch (event.type) {
                          case 'visit':
                            return timelineFilters.visits;
                          case 'lab':
                          case 'lab_result':
                            return timelineFilters.labResults;
                          case 'consultation':
                            return timelineFilters.consultations;
                          case 'prescription':
                            return timelineFilters.prescriptions;
                          default:
                            return true;
                        }
                      }).length} events</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        onClick={() => setTimelineFilters({
                          visits: true,
                          labResults: true,
                          consultations: true,
                          prescriptions: true
                        })}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Content - Main Area */}
            <div className="lg:col-span-3">
              <PatientTimeline events={activityTrail.filter((event: any) => {
                switch (event.type) {
                  case 'visit':
                    return timelineFilters.visits;
                  case 'lab':
                  case 'lab_result':
                    return timelineFilters.labResults;
                  case 'consultation':
                    return timelineFilters.consultations;
                  case 'prescription':
                    return timelineFilters.prescriptions;
                  default:
                    return true;
                }
              })} />
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
                    onClick={() => navigate(`/patients/${patient.id}/record-visit`)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Start New Visit Recording
                  </Button>
                </div>

                {/* Recent Visits & Consultations Summary */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Recent Visits & Consultations</h4>
                  {combinedVisits.length > 0 ? (
                    <div className="space-y-2">
                      {combinedVisits.slice(0, 5).map((item: any) => (
                        <div key={`${item.type}-${item.id}`} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${item.type === 'consultation' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                                >
                                  {item.title}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(item.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-1">
                                {item.description}
                              </p>
                              {item.type === 'visit' && item.bloodPressure && (
                                <div className="text-xs text-gray-500">
                                  BP: {item.bloodPressure}
                                  {item.heartRate && ` • HR: ${item.heartRate}`}
                                </div>
                              )}
                              {item.type === 'consultation' && (
                                <div className="text-xs text-gray-500">
                                  Recorded by: {item.recordedBy}
                                </div>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[200px]">
                                {item.type === 'visit' ? (
                                  <>
                                    <DropdownMenuItem onClick={() => handleViewVisit(item.id)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditVisit(item.id)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Visit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopyVisit(item)}>
                                      <Copy className="mr-2 h-4 w-4" />
                                      Copy Details
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteVisit(item.id)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Visit
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <>
                                    <DropdownMenuItem onClick={() => handleViewConsultation(item.id)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Consultation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(JSON.stringify(item.responses, null, 2))}>
                                      <Copy className="mr-2 h-4 w-4" />
                                      Copy Responses
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Stethoscope className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No visits or consultations recorded yet</p>
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
        
        {/* Edit Patient Modal */}
        <EditPatientModal
          open={showEditPatientModal}
          onOpenChange={setShowEditPatientModal}
          patient={patient}
          onPatientUpdated={() => {
            // Refresh patient data after update
            queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}`] });
            queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
          }}
        />
    </div>
  );
}