import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  AlertCircle, 
  History, 
  Stethoscope, 
  FlaskRound,
  Plus,
  Pill,
  Activity,
  Send,
  ChevronDown,
  FileText,
  Edit,
  MoreHorizontal,
  Heart,
  Clock,
  UserCheck,
  Monitor,
  Share
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EnhancedVisitRecording } from "@/components/enhanced-visit-recording";
import LabResultModal from "@/components/lab-result-modal";
import PrescriptionModal from "@/components/prescription-modal";
import { EditPatientModal } from "@/components/edit-patient-modal";
import PatientQRCard from "@/components/patient-qr-card";
import PatientChat from "@/components/patient-chat";
import LabOrderForm from "@/components/lab-order-form";
import LabOrdersList from "@/components/lab-orders-list";
import ConsultationHistory from "@/components/consultation-history";
import VaccinationManagement from "@/components/vaccination-management";
import AllergyManagement from "@/components/allergy-management";
import MedicalHistoryManagement from "@/components/medical-history-management";

import { PatientSummaryPrintable } from "@/components/patient-summary-printable";
import { ModernPatientOverview } from "@/components/modern-patient-overview";
import { FloatingActionMenu } from "@/components/floating-action-menu";
import { PatientVitalsChart } from "@/components/patient-vitals-chart";
import { useRole } from "@/components/role-guard";
import { formatPatientName, getPatientInitials } from "@/lib/patient-utils";
import type { Patient, Visit, LabResult, Prescription } from "@shared/schema";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface Organization {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export default function PatientProfile() {
  const [, params] = useRoute("/patients/:id");
  const [, navigate] = useLocation();
  const patientId = params?.id ? parseInt(params.id) : undefined;
  const { user } = useRole();
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);

  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  const { data: visits, isLoading: visitsLoading } = useQuery<Visit[]>({
    queryKey: [`/api/patients/${patientId}/visits`],
    enabled: !!patientId,
  });

  const { data: labResults, isLoading: labsLoading } = useQuery<LabResult[]>({
    queryKey: ["/api/patients", patientId, "labs"],
    enabled: !!patientId,
  });

  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/patients", patientId, "prescriptions"],
    enabled: !!patientId,
  });

  // Fetch organization data for branding
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  // Get current user's organization
  const currentOrganization = Array.isArray(organizations) 
    ? organizations.find(org => org.id === (user as any)?.organizationId)
    : undefined;

  if (patientLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">Patient not found</h3>
          <p className="mt-2 text-sm text-slate-500">The patient you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Enhanced Professional Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-start justify-between">
            {/* Patient Info Section */}
            <div className="flex items-start space-x-4">
              <Avatar className="w-16 h-16 ring-2 ring-blue-100">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-semibold">
                  {getPatientInitials(patient)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <h1 className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors flex items-center">
                        {formatPatientName(patient)}
                        <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
                      </h1>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      <div className="px-3 py-2 border-b bg-gray-50">
                        <p className="text-sm font-semibold text-gray-900">{formatPatientName(patient)}</p>
                        <p className="text-xs text-gray-500 font-medium">ID: HC{patient.id?.toString().padStart(6, "0")}</p>
                      </div>
                      <DropdownMenuItem onClick={() => setShowEditPatientModal(true)} className="py-2">
                        <Edit className="mr-3 h-4 w-4 text-blue-600" />
                        <span className="font-medium">Edit Patient Info</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowVisitModal(true)} className="py-2">
                        <Monitor className="mr-3 h-4 w-4 text-green-600" />
                        <span className="font-medium">Record New Visit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowPrescriptionModal(true)} className="py-2">
                        <Pill className="mr-3 h-4 w-4 text-purple-600" />
                        <span className="font-medium">Add Prescription</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="py-2">
                        <FlaskRound className="mr-3 h-4 w-4 text-orange-600" />
                        <span className="font-medium">Order Lab Tests</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="py-2">
                        <Share className="mr-3 h-4 w-4 text-gray-600" />
                        <span className="font-medium">Print/Export Records</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Status Badge */}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active Patient
                  </span>
                </div>
                
                {/* Patient Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="font-medium text-gray-500 mr-1">ID:</span>
                    <span className="font-semibold">HC{patient.id?.toString().padStart(6, "0")}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-500 mr-1">Age:</span>
                    <span className="font-semibold">{new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-500 mr-1">Gender:</span>
                    <span className="font-semibold capitalize">{patient.gender}</span>
                  </div>
                  
                  {patient.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-semibold">{patient.phone}</span>
                    </div>
                  )}
                </div>
                
                {/* Secondary Info Row */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-500 mr-1">Date of Birth:</span>
                    <span>{new Date(patient.dateOfBirth).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  
                  {patient.address && (
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="font-medium text-gray-500 mr-1">Address:</span>
                      <span className="break-words">{patient.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVisitModal(true)}
                className="hidden md:flex items-center bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Visit
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPrescriptionModal(true)}
                className="hidden md:flex items-center bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
              >
                <Pill className="w-4 h-4 mr-2" />
                Prescribe
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowVisitModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Visit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowPrescriptionModal(true)}>
                    <Pill className="mr-2 h-4 w-4" />
                    Prescribe
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="w-full px-1 py-1">
          {/* Compact Stats Row */}
          <div className="grid grid-cols-4 gap-1 mb-2">
            <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-all duration-200">
              <CardContent className="p-2">
                <div className="text-center">
                  <div className="p-1 bg-blue-100 rounded-full mx-auto w-fit mb-1">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Visits</p>
                  <p className="text-xl font-bold text-gray-900">{visits?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-all duration-200">
              <CardContent className="p-2">
                <div className="text-center">
                  <div className="p-1 bg-green-100 rounded-full mx-auto w-fit mb-1">
                    <Pill className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Active Rx</p>
                  <p className="text-xl font-bold text-gray-900">
                    {prescriptions?.filter(p => p.status === 'active').length || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-all duration-200">
              <CardContent className="p-2">
                <div className="text-center">
                  <div className="p-1 bg-orange-100 rounded-full mx-auto w-fit mb-1">
                    <FlaskRound className="h-4 w-4 text-orange-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Lab Tests</p>
                  <p className="text-xl font-bold text-gray-900">{labResults?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-all duration-200">
              <CardContent className="p-2">
                <div className="text-center">
                  <div className="p-1 bg-purple-100 rounded-full mx-auto w-fit mb-1">
                    <Heart className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Last Visit</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {visits && visits.length > 0 
                      ? new Date(visits[0].visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'None'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Optimized Content Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-2">
            {/* Main Content Area - Takes more space */}
            <div className="xl:col-span-4 space-y-2">
              {/* Vital Signs Chart - Reduced height */}
              <div className="h-64">
                <PatientVitalsChart 
                  vitals={visits?.map(visit => ({
                    date: visit.visitDate.toString(),
                    bloodPressure: visit.bloodPressure || undefined,
                    heartRate: visit.heartRate || undefined,
                    temperature: visit.temperature ? parseFloat(visit.temperature) : undefined,
                    weight: visit.weight ? parseFloat(visit.weight) : undefined
                  })) || []}
                />
              </div>
              
              {/* Patient Overview - Optimized spacing */}
              <ModernPatientOverview
                patient={patient as Patient}
                visits={visits || []}
                recentLabs={labResults || []}
                activePrescriptions={prescriptions || []}
                onAddPrescription={() => setShowPrescriptionModal(true)}
              />
            </div>

            {/* Compact Sidebar - Actions & Summary */}
            <div className="space-y-2">
              {/* Compact Quick Actions */}
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="pb-1 px-3 pt-3">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
                    <Plus className="h-3 w-3 mr-1 text-blue-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 px-3 pb-3">
                  <Button 
                    onClick={() => setShowVisitModal(true)}
                    className="w-full justify-start h-8 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    variant="outline"
                  >
                    <Monitor className="h-3 w-3 mr-1" />
                    New Visit
                  </Button>
                  
                  <Button 
                    onClick={() => navigate(`/lab-orders?patientId=${patientId}`)}
                    className="w-full justify-start h-8 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                    variant="outline"
                  >
                    <FlaskRound className="h-3 w-3 mr-1" />
                    Lab Order
                  </Button>
                  
                  <Button 
                    onClick={() => setShowPrescriptionModal(true)}
                    className="w-full justify-start h-8 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    variant="outline"
                  >
                    <Pill className="h-3 w-3 mr-1" />
                    Prescribe
                  </Button>
                  
                  <Button 
                    onClick={() => navigate(`/documents?patientId=${patientId}`)}
                    className="w-full justify-start h-8 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                    variant="outline"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Report
                  </Button>
                  
                  <Button 
                    onClick={() => navigate(`/referral-letters?patientId=${patientId}`)}
                    className="w-full justify-start h-8 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                    variant="outline"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Referral
                  </Button>
                  
                  <Button 
                    onClick={() => navigate(`/appointments?action=schedule&patientId=${patientId}`)}
                    className="w-full justify-start h-8 text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200"
                    variant="outline"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Follow-up
                  </Button>
                </CardContent>
              </Card>

              {/* Compact Patient Summary */}
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="pb-1 px-3 pt-3">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
                    <User className="h-3 w-3 mr-1 text-gray-600" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Registration</span>
                      <span className="text-xs font-medium">
                        {new Date(patient?.createdAt || '').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Blood Type</span>
                      <Badge variant="outline" className="text-xs text-red-600 border-red-200 h-5">
                        A+
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Phone</span>
                      <span className="text-xs font-medium truncate max-w-20">
                        {patient?.phone || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Insurance</span>
                      <Badge variant="outline" className="text-xs text-green-600 border-green-200 h-5">
                        Active
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <h4 className="text-xs font-medium text-gray-900 mb-1">Allergies</h4>
                    <div className="flex flex-wrap gap-1">
                      {patient?.allergies ? (
                        <Badge variant="secondary" className="text-xs bg-red-50 text-red-700 h-5">
                          {patient.allergies.length > 12 ? patient.allergies.substring(0, 12) + '...' : patient.allergies}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-500">None</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Floating Action Menu */}
        <FloatingActionMenu
          onRecordVisit={() => setShowVisitModal(true)}
          onAddLabResult={() => setShowLabModal(true)}
          onAddPrescription={() => setShowPrescriptionModal(true)}
          onCreateConsultation={() => setShowVisitModal(true)}
          userRole={user?.role || 'guest'}
        />
      </main>

      {/* Modals */}
      <EnhancedVisitRecording
        open={showVisitModal}
        onOpenChange={setShowVisitModal}
        patientId={patientId || 0}
      />
      <LabResultModal
        open={showLabModal}
        onOpenChange={setShowLabModal}
        patientId={patientId}
      />
      <PrescriptionModal
        open={showPrescriptionModal}
        onOpenChange={setShowPrescriptionModal}
        patientId={patientId}
      />

      {/* Edit Patient Modal */}
      {patient && (
        <EditPatientModal
          open={showEditPatientModal}
          onOpenChange={setShowEditPatientModal}
          patient={patient as any}
          onPatientUpdated={() => {
            // Refresh patient data after update
            window.location.reload();
          }}
        />
      )}

      {/* Hidden Printable Patient Summary */}
      <div className="hidden">
        <PatientSummaryPrintable
          patient={patient as Patient}
          visits={visits || []}
          organization={currentOrganization}
        />
      </div>
    </div>
  );
}