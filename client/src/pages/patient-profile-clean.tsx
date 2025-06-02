import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  Heart,
  Clock,
  UserCheck,
  FileText,
  Edit,
  Brain,
  MessageCircle,
  Eye,
  Ear,
  Search,
  X,
  Printer
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
import ConsultationFormSelector from "@/components/consultation-form-selector";
import VaccinationManagement from "@/components/vaccination-management";
import AllergyManagement from "@/components/allergy-management";
import MedicalHistoryManagement from "@/components/medical-history-management";

import { PatientSummaryPrintable } from "@/components/patient-summary-printable";
import { ModernPatientOverview } from "@/components/modern-patient-overview";
import { FloatingActionMenu } from "@/components/floating-action-menu";
import { useRole } from "@/components/role-guard";
import type { Patient, Visit, LabResult, Prescription } from "@shared/schema";

interface Organization {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export default function PatientProfile() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id ? parseInt(params.id) : undefined;
  const { user } = useRole();
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const [selectedAssessmentType, setSelectedAssessmentType] = useState<string | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [preSelectedFormId, setPreSelectedFormId] = useState<number | null>(null);
  const [assessmentSearchTerm, setAssessmentSearchTerm] = useState('');

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

  // Fetch consultation forms for specialty assessments
  const { data: consultationForms = [] } = useQuery({
    queryKey: ["/api/consultation-forms"],
  });

  // Handler for selecting an assessment form
  const handleAssessmentFormSelect = (assessmentType: string) => {
    // Enhanced matching logic for consultation forms
    const matchingForm = consultationForms.find((form: any) => {
      const formName = (form.name || form.templateName || '').toLowerCase();
      const assessmentLower = assessmentType.toLowerCase();
      
      // Direct name matches
      if (formName.includes(assessmentLower) || assessmentLower.includes(formName)) {
        return true;
      }
      
      // Specific mapping for common assessment types
      const mappings: Record<string, string[]> = {
        'dermatological': ['dermatology', 'skin', 'dermatological'],
        'ent': ['ent', 'ear nose throat', 'otolaryngology'],
        'cardiac': ['cardiac', 'cardiology', 'heart'],
        'respiratory': ['respiratory', 'pulmonary', 'lung'],
        'neurological': ['neurological', 'neurology', 'neuro'],
        'pediatric': ['pediatric', 'paediatric', 'child', 'kids'],
        'antenatal': ['antenatal', 'prenatal', 'pregnancy', 'maternal'],
        'mental-health': ['mental', 'psychiatric', 'psychology', 'psych'],
        'orthopedic': ['orthopedic', 'orthopaedic', 'bone', 'joint'],
        'pdcntss': ['pdcntss', 'diagnostic', 'screening'],
        'ophthalmology': ['ophthalmology', 'eye', 'vision', 'ophthalmic'],
        'endocrinology': ['endocrinology', 'hormone', 'endocrine', 'diabetes'],
        'gastroenterology': ['gastroenterology', 'gastro', 'digestive', 'gi'],
        'urology': ['urology', 'urological', 'kidney', 'bladder']
      };
      
      const keywords = mappings[assessmentLower] || [assessmentLower];
      return keywords.some(keyword => formName.includes(keyword));
    });
    
    if (matchingForm) {
      // Switch to visits tab and pre-select the form
      setActiveTab("visits");
      setPreSelectedFormId(matchingForm.id);
      
      // Clear the selection after a brief delay to allow form to load
      setTimeout(() => {
        setPreSelectedFormId(null);
      }, 2000);
    } else {
      // Switch to visits tab to show form selector for creating new assessment
      setActiveTab("visits");
      setPreSelectedFormId(null);
    }
  };

  // Define all available assessments for filtering
  const allAssessments = [
    { type: 'antenatal', name: 'Antenatal Assessment', description: 'Prenatal care evaluation', keywords: ['pregnancy', 'prenatal', 'maternal'] },
    { type: 'pediatric', name: 'Pediatric Assessment', description: 'Child health evaluation', keywords: ['child', 'kids', 'pediatric'] },
    { type: 'cardiac', name: 'Cardiac Assessment', description: 'Heart health evaluation', keywords: ['heart', 'cardiology', 'cardiovascular'] },
    { type: 'respiratory', name: 'Respiratory Assessment', description: 'Lung function evaluation', keywords: ['lung', 'breathing', 'pulmonary'] },
    { type: 'neurological', name: 'Neurological Assessment', description: 'Nervous system evaluation', keywords: ['brain', 'nerve', 'neuro'] },
    { type: 'mental-health', name: 'Mental Health Assessment', description: 'Psychological evaluation', keywords: ['mental', 'psychology', 'psychiatric'] },
    { type: 'dermatological', name: 'Dermatological Assessment', description: 'Skin health evaluation', keywords: ['skin', 'dermatology', 'rash'] },
    { type: 'orthopedic', name: 'Orthopedic Assessment', description: 'Bone and joint evaluation', keywords: ['bone', 'joint', 'orthopedic'] },
    { type: 'ent', name: 'ENT Assessment', description: 'Ear, nose, throat evaluation', keywords: ['ear', 'nose', 'throat'] },
    { type: 'pdcntss', name: 'PDCNTSS Assessment', description: 'Specialized diagnostic screening', keywords: ['diagnostic', 'screening', 'pdcntss'] },
    { type: 'ophthalmology', name: 'Ophthalmology Assessment', description: 'Eye health examination', keywords: ['eye', 'vision', 'sight'] },
    { type: 'endocrinology', name: 'Endocrinology Assessment', description: 'Hormone and gland evaluation', keywords: ['hormone', 'diabetes', 'thyroid'] },
    { type: 'gastroenterology', name: 'Gastroenterology Assessment', description: 'Digestive system evaluation', keywords: ['stomach', 'digestive', 'gastro'] },
    { type: 'urology', name: 'Urology Assessment', description: 'Urinary system evaluation', keywords: ['kidney', 'bladder', 'urinary'] }
  ];

  // Filter assessments based on search term
  const filteredAssessments = allAssessments.filter(assessment => {
    if (!assessmentSearchTerm) return true;
    const searchLower = assessmentSearchTerm.toLowerCase();
    return (
      assessment.name.toLowerCase().includes(searchLower) ||
      assessment.description.toLowerCase().includes(searchLower) ||
      assessment.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
    );
  });

  // Handler for creating a new assessment form


  // Handler for completing an assessment
  const handleAssessmentComplete = async (assessmentData: any) => {
    try {
      // Save the assessment as a consultation record
      const consultationData = {
        patientId: patientId,
        type: 'specialty_assessment',
        specialtyType: selectedAssessmentType,
        findings: assessmentData.findings || '',
        diagnosis: assessmentData.diagnosis || '',
        treatment: assessmentData.treatment || '',
        notes: JSON.stringify(assessmentData),
        followUpDate: assessmentData.followUpDate,
      };

      // This would integrate with your existing visit recording system
      console.log('Saving specialty assessment:', consultationData);
      setShowAssessmentModal(false);
      setSelectedAssessmentType(null);
      
      // Refresh consultation history
      // The consultation would appear in the visits tab
    } catch (error) {
      console.error('Error saving assessment:', error);
    }
  };

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
      {/* Comprehensive Patient Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-6">
        <div className="space-y-4">
          {/* Patient Identity & Basic Info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                  {patient.firstName?.[0]?.toUpperCase()}{patient.lastName?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {patient.title ? `${patient.title} ` : ''}{patient.firstName} {patient.lastName}
                </h1>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Patient ID: HC{patient.id?.toString().padStart(6, "0")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years • {patient.gender}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-xs px-3 py-1">
                Active Patient
              </Badge>
            </div>
          </div>

          {/* Contact & Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            {patient.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Phone:</span>
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-green-500" />
                <span className="font-medium">Email:</span>
                <span>{patient.email}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="font-medium">Address:</span>
                <span className="truncate">{patient.address}</span>
              </div>
            )}
          </div>

          {/* Quick Stats & Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Total Visits:</span>
                <Badge variant="outline">{visits?.length || 0}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <FlaskRound className="w-4 h-4 text-green-500" />
                <span className="font-medium">Lab Results:</span>
                <Badge variant="outline">{labResults?.length || 0}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Active Prescriptions:</span>
                <Badge variant="outline">{prescriptions?.filter(p => p.status === 'active')?.length || 0}</Badge>
              </div>
            </div>
            
            {/* Edit Button moved to bottom right */}
            {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
              <Button variant="outline" onClick={() => setShowEditPatientModal(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Patient Info
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-full">
        <div className="w-full max-w-none">
          {/* Tabs for different sections */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="specialty">Specialty Assessment</TabsTrigger>
              <TabsTrigger value="labs">Lab Results</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Patient Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {visits?.slice(0, 3).map((visit: any) => (
                        <div key={visit.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{visit.reason}</p>
                            <p className="text-sm text-gray-500">{new Date(visit.visitDate).toLocaleDateString()}</p>
                          </div>
                          <Badge variant="outline">{visit.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Vital Signs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Latest Vitals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {visits && visits.length > 0 && (visits[0].bloodPressure || visits[0].heartRate || visits[0].temperature || visits[0].weight) ? (
                      <div className="space-y-3">
                        {visits[0].bloodPressure && (
                          <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                            <span className="text-red-700 font-medium">Blood Pressure:</span>
                            <span className="font-semibold text-red-900">{visits[0].bloodPressure}</span>
                          </div>
                        )}
                        {visits[0].heartRate && (
                          <div className="flex justify-between items-center p-2 bg-pink-50 rounded">
                            <span className="text-pink-700 font-medium">Heart Rate:</span>
                            <span className="font-semibold text-pink-900">{visits[0].heartRate} bpm</span>
                          </div>
                        )}
                        {visits[0].temperature && (
                          <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                            <span className="text-orange-700 font-medium">Temperature:</span>
                            <span className="font-semibold text-orange-900">{visits[0].temperature}°C</span>
                          </div>
                        )}
                        {visits[0].weight && (
                          <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                            <span className="text-blue-700 font-medium">Weight:</span>
                            <span className="font-semibold text-blue-900">{visits[0].weight} kg</span>
                          </div>
                        )}
                        {visits[0].height && (
                          <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                            <span className="text-green-700 font-medium">Height:</span>
                            <span className="font-semibold text-green-900">{visits[0].height} cm</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2 text-center">
                          Last recorded: {new Date(visits[0].visitDate).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Heart className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">No vital signs recorded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-blue-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowVisitModal(true)}
                        className="justify-start"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Record Visit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowLabModal(true)}
                        className="justify-start"
                      >
                        <FlaskRound className="w-4 h-4 mr-2" />
                        Order Lab Test
                      </Button>
                      {(user?.role === 'doctor' || user?.role === 'admin') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowPrescriptionModal(true)}
                          className="justify-start"
                        >
                          <Pill className="w-4 h-4 mr-2" />
                          Prescribe Medication
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowChatModal(true)}
                        className="justify-start"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Vitals Tracking Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    Vital Signs History
                  </CardTitle>
                  <CardDescription>Track patient vitals over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {visits && visits.filter(v => v.bloodPressure || v.heartRate || v.temperature).length > 0 ? (
                    <div className="space-y-4">
                      {visits
                        .filter(v => v.bloodPressure || v.heartRate || v.temperature)
                        .slice(0, 5)
                        .map((visit: any) => (
                          <div key={visit.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-green-50">
                            <div className="flex justify-between items-start mb-3">
                              <div className="text-sm font-medium text-gray-600">
                                {new Date(visit.visitDate).toLocaleDateString()}
                              </div>
                              <Badge variant="outline">{visit.status}</Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {visit.bloodPressure && (
                                <div className="bg-white p-2 rounded border">
                                  <div className="text-gray-600">BP</div>
                                  <div className="font-semibold text-red-600">{visit.bloodPressure}</div>
                                </div>
                              )}
                              {visit.heartRate && (
                                <div className="bg-white p-2 rounded border">
                                  <div className="text-gray-600">HR</div>
                                  <div className="font-semibold text-pink-600">{visit.heartRate} bpm</div>
                                </div>
                              )}
                              {visit.temperature && (
                                <div className="bg-white p-2 rounded border">
                                  <div className="text-gray-600">Temp</div>
                                  <div className="font-semibold text-orange-600">{visit.temperature}°C</div>
                                </div>
                              )}
                              {visit.weight && (
                                <div className="bg-white p-2 rounded border">
                                  <div className="text-gray-600">Weight</div>
                                  <div className="font-semibold text-blue-600">{visit.weight} kg</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No vitals history</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Vital signs will appear here when recorded during visits.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visits" className="space-y-6">
              <ConsultationFormSelector 
                patientId={patient.id} 
                patient={patient}
                preSelectedFormId={preSelectedFormId}
              />
              
              {/* Chat Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    Patient Communication
                  </CardTitle>
                  <CardDescription>Send messages and view communication history</CardDescription>
                </CardHeader>
                <CardContent>
                  <PatientChat patientId={patient.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="labs" className="space-y-6">
              {/* Lab Results Section */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FlaskRound className="w-5 h-5 text-green-500" />
                        Laboratory Results
                      </CardTitle>
                      <CardDescription>View and manage lab test results</CardDescription>
                    </div>
                    <Button 
                      onClick={() => setShowLabModal(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Order Lab Test
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {labResults && labResults.length > 0 ? (
                    <div className="space-y-4">
                      {labResults.map((result: any) => (
                        <div key={result.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">{result.testName}</h4>
                                <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
                                  {result.status}
                                </Badge>
                                {result.status === 'completed' && result.result && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    Results Available
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                <div className="bg-gray-50 p-3 rounded">
                                  <span className="font-medium text-gray-700 block">Test Date</span>
                                  <p className="text-gray-900">{new Date(result.testDate).toLocaleDateString()}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                  <span className="font-medium text-gray-700 block">Category</span>
                                  <p className="text-gray-900">{result.category || 'General'}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                  <span className="font-medium text-gray-700 block">Ordered By</span>
                                  <p className="text-gray-900">Dr. {result.doctorName || 'Unknown'}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                  <span className="font-medium text-gray-700 block">Priority</span>
                                  <p className="text-gray-900">{result.priority || 'Normal'}</p>
                                </div>
                              </div>
                              
                              {result.result && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                  <span className="font-medium text-blue-800 block mb-1">Results:</span>
                                  <p className="text-blue-900 text-sm">{result.result}</p>
                                  {result.normalRange && (
                                    <p className="text-blue-700 text-xs mt-1">Normal Range: {result.normalRange}</p>
                                  )}
                                </div>
                              )}
                              
                              {result.notes && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <span className="font-medium">Notes:</span> {result.notes}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-2 ml-4">
                              <Button variant="ghost" size="sm" onClick={() => console.log('View lab result:', result.id)}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => console.log('Print lab result:', result.id)}>
                                <Printer className="w-4 h-4 mr-1" />
                                Print
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FlaskRound className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No lab results yet</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Lab test results will appear here when available. Click "Order Lab Test" to request new tests.
                      </p>
                      <Button 
                        onClick={() => setShowLabModal(true)}
                        className="mt-4 bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Order First Lab Test
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-purple-500" />
                    Medications & Prescriptions
                    </CardTitle>
                  </CardHeader>
                <CardContent>
                  <Tabs defaultValue="current" className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                        <TabsTrigger value="current" className="flex items-center gap-2">
                          <Pill className="w-4 h-4" />
                          Current ({prescriptions?.filter(p => p.status === 'active')?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="past" className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Past ({prescriptions?.filter(p => p.status === 'completed')?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="repeat" className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Repeat ({prescriptions?.filter(p => p.duration?.includes('Ongoing'))?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="summary" className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Summary
                        </TabsTrigger>
                      </TabsList>
                      
                      {(user?.role === 'doctor' || user?.role === 'admin') && (
                        <Button 
                          onClick={() => setShowPrescriptionModal(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Prescribe Medication
                        </Button>
                      )}
                    </div>

                    <TabsContent value="current" className="space-y-4">
                      {prescriptions?.filter(p => p.status === 'active').length > 0 ? (
                        <div className="grid gap-4">
                          {prescriptions
                            .filter((prescription: any) => prescription.status === 'active')
                            .map((prescription: any) => (
                              <div key={prescription.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-semibold text-slate-800 text-lg">
                                        {prescription.medicationName}
                                      </h4>
                                      <Badge className="bg-green-100 text-green-800 border-green-200">
                                        Active
                                      </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                      <div className="bg-slate-50 p-3 rounded-md">
                                        <span className="font-medium text-slate-700 block">Dosage</span>
                                        <p className="text-slate-900">{prescription.dosage}</p>
                                      </div>
                                      <div className="bg-slate-50 p-3 rounded-md">
                                        <span className="font-medium text-slate-700 block">Frequency</span>
                                        <p className="text-slate-900">{prescription.frequency}</p>
                                      </div>
                                      <div className="bg-slate-50 p-3 rounded-md">
                                        <span className="font-medium text-slate-700 block">Duration</span>
                                        <p className="text-slate-900">{prescription.duration}</p>
                                      </div>
                                      <div className="bg-slate-50 p-3 rounded-md">
                                        <span className="font-medium text-slate-700 block">Start Date</span>
                                        <p className="text-slate-900">{prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : 'N/A'}</p>
                                      </div>
                                    </div>
                                    
                                    {prescription.instructions && (
                                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                        <span className="font-medium text-blue-800 block mb-1">Instructions:</span>
                                        <p className="text-blue-900 text-sm">{prescription.instructions}</p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-col gap-2 ml-4">
                                    {(user?.role === 'doctor' || user?.role === 'admin') && (
                                      <>
                                        <Button variant="outline" size="sm" onClick={() => console.log('Complete medication:', prescription.id)}>
                                          Complete
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => console.log('Print prescription:', prescription.id)}>
                                          <Printer className="w-4 h-4 mr-1" />
                                          Print
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Pill className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900">No active medications</h3>
                          <p className="mt-2 text-sm text-gray-500">This patient currently has no active medications.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="past" className="space-y-4">
                      {prescriptions?.filter(p => p.status === 'completed').length > 0 ? (
                        <div className="grid gap-4">
                          {prescriptions
                            .filter((prescription: any) => prescription.status === 'completed')
                            .map((prescription: any) => (
                              <div key={prescription.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-semibold text-gray-700">{prescription.medicationName}</h4>
                                      <Badge variant="secondary">Completed</Badge>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <p>Dosage: {prescription.dosage} • Frequency: {prescription.frequency}</p>
                                      <p>Duration: {prescription.duration}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900">No past medications</h3>
                          <p className="mt-2 text-sm text-gray-500">No completed medications found.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="repeat" className="space-y-4">
                      <div className="text-center py-8">
                        <Activity className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No repeat medications</h3>
                        <p className="mt-2 text-sm text-gray-500">No repeat prescriptions available.</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="summary" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{prescriptions?.filter(p => p.status === 'active')?.length || 0}</div>
                            <div className="text-sm text-gray-600">Active Medications</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{prescriptions?.length || 0}</div>
                            <div className="text-sm text-gray-600">Total Prescriptions</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">{patient.allergies ? 1 : 0}</div>
                            <div className="text-sm text-gray-600">Allergies Noted</div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {patient.allergies && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <h4 className="font-semibold text-red-800">Allergies</h4>
                          </div>
                          <p className="text-red-700">{patient.allergies}</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visits" className="space-y-6">
              <ConsultationFormSelector 
                patientId={patient.id} 
                patient={patient}
                preSelectedFormId={preSelectedFormId}
              />
              <ConsultationHistory patientId={patient.id} />
            </TabsContent>

            <TabsContent value="specialty">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Specialty Assessment Forms</CardTitle>
                      <CardDescription>Select and complete specialized medical assessment forms</CardDescription>
                    </div>
                    <Button 
                      onClick={() => window.location.href = '/form-builder'}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Form
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Search Input */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search assessments (e.g., heart, brain, eye, pediatric...)"
                      value={assessmentSearchTerm}
                      onChange={(e) => setAssessmentSearchTerm(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {assessmentSearchTerm && (
                      <button
                        onClick={() => setAssessmentSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Results Summary */}
                  {assessmentSearchTerm && (
                    <div className="mb-4 text-sm text-gray-600">
                      Found {filteredAssessments.length} assessment{filteredAssessments.length !== 1 ? 's' : ''} matching "{assessmentSearchTerm}"
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* Display forms from form builder */}
                    {consultationForms.map((form: any) => (
                      <Card 
                        key={form.id}
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-blue-200 hover:border-blue-400 hover:scale-105"
                        onClick={() => handleAssessmentFormSelect(form.templateName || form.name)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{form.templateName || form.name}</h3>
                              <p className="text-sm text-gray-600">Custom assessment form</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Dynamic Specialty Assessment Cards - Filtered */}
                    {filteredAssessments.map((assessment) => {
                      // Define color schemes for each assessment type
                      const colorSchemes: Record<string, {border: string, bg: string, icon: string}> = {
                        'antenatal': {border: 'border-pink-200 hover:border-pink-400', bg: 'from-pink-100 to-pink-200', icon: 'text-pink-600'},
                        'pediatric': {border: 'border-blue-200 hover:border-blue-400', bg: 'from-blue-100 to-blue-200', icon: 'text-blue-600'},
                        'cardiac': {border: 'border-red-200 hover:border-red-400', bg: 'from-red-100 to-red-200', icon: 'text-red-600'},
                        'respiratory': {border: 'border-green-200 hover:border-green-400', bg: 'from-green-100 to-green-200', icon: 'text-green-600'},
                        'neurological': {border: 'border-purple-200 hover:border-purple-400', bg: 'from-purple-100 to-purple-200', icon: 'text-purple-600'},
                        'mental-health': {border: 'border-indigo-200 hover:border-indigo-400', bg: 'from-indigo-100 to-indigo-200', icon: 'text-indigo-600'},
                        'dermatological': {border: 'border-orange-200 hover:border-orange-400', bg: 'from-orange-100 to-orange-200', icon: 'text-orange-600'},
                        'orthopedic': {border: 'border-teal-200 hover:border-teal-400', bg: 'from-teal-100 to-teal-200', icon: 'text-teal-600'},
                        'ent': {border: 'border-yellow-200 hover:border-yellow-400', bg: 'from-yellow-100 to-yellow-200', icon: 'text-yellow-600'},
                        'pdcntss': {border: 'border-cyan-200 hover:border-cyan-400', bg: 'from-cyan-100 to-cyan-200', icon: 'text-cyan-600'},
                        'ophthalmology': {border: 'border-slate-200 hover:border-slate-400', bg: 'from-slate-100 to-slate-200', icon: 'text-slate-600'},
                        'endocrinology': {border: 'border-emerald-200 hover:border-emerald-400', bg: 'from-emerald-100 to-emerald-200', icon: 'text-emerald-600'},
                        'gastroenterology': {border: 'border-amber-200 hover:border-amber-400', bg: 'from-amber-100 to-amber-200', icon: 'text-amber-600'},
                        'urology': {border: 'border-rose-200 hover:border-rose-400', bg: 'from-rose-100 to-rose-200', icon: 'text-rose-600'}
                      };

                      // Define icons for each assessment type
                      const getIcon = (type: string) => {
                        const iconMap: Record<string, any> = {
                          'antenatal': Heart,
                          'pediatric': User,
                          'cardiac': Heart,
                          'respiratory': Activity,
                          'neurological': Brain,
                          'mental-health': MessageCircle,
                          'dermatological': Eye,
                          'orthopedic': Activity,
                          'ent': Ear,
                          'pdcntss': FileText,
                          'ophthalmology': Eye,
                          'endocrinology': Activity,
                          'gastroenterology': Pill,
                          'urology': User
                        };
                        return iconMap[type] || FileText;
                      };

                      const colors = colorSchemes[assessment.type] || {border: 'border-gray-200 hover:border-gray-400', bg: 'from-gray-100 to-gray-200', icon: 'text-gray-600'};
                      const IconComponent = getIcon(assessment.type);

                      return (
                        <Card 
                          key={assessment.type}
                          className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${colors.border} hover:scale-105`}
                          onClick={() => handleAssessmentFormSelect(assessment.type)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center shadow-sm`}>
                                <IconComponent className={`w-6 h-6 ${colors.icon}`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{assessment.name}</h3>
                                <p className="text-sm text-gray-600">{assessment.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="labs">
              <Card>
                <CardHeader>
                  <CardTitle>Laboratory Results</CardTitle>
                  <CardDescription>Recent lab tests and results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {labResults?.map((lab: any) => (
                      <div key={lab.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{lab.testName}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(lab.testDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={lab.status === 'normal' ? 'default' : 'destructive'}>
                            {lab.status}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm">
                            <span className="font-medium">Result:</span> {lab.result} {lab.unit}
                          </p>
                          {lab.referenceRange && (
                            <p className="text-sm text-gray-500">
                              Reference: {lab.referenceRange}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-purple-500" />
                    Medications & Prescriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="current" className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                        <TabsTrigger value="current" className="flex items-center gap-2">
                          <Pill className="w-4 h-4" />
                          Current ({prescriptions?.filter(p => p.status === 'active')?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="past" className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Past ({prescriptions?.filter(p => p.status === 'completed')?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="repeat" className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Repeat ({prescriptions?.filter(p => p.duration?.includes('Ongoing'))?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="summary" className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Summary
                        </TabsTrigger>
                      </TabsList>
                      
                      {(user?.role === 'doctor' || user?.role === 'admin') && (
                        <Button 
                          onClick={() => setShowPrescriptionModal(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Prescribe Medication
                        </Button>
                      )}
                    </div>

                    {/* Current Medications Tab */}
                    <TabsContent value="current" className="space-y-4">
                      {prescriptions?.filter(p => p.status === 'active').length > 0 ? (
                        <div className="grid gap-4">
                          {prescriptions
                            .filter((prescription: any) => prescription.status === 'active')
                            .map((prescription: any) => (
                              <div key={prescription.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-semibold text-slate-800 text-lg">
                                        {prescription.medicationName}
                                      </h4>
                                      <Badge className="bg-green-100 text-green-800 border-green-200">
                                        Active
                                      </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                      <div className="bg-slate-50 p-3 rounded-md">
                                        <span className="font-medium text-slate-700 block">Dosage</span>
                                        <p className="text-slate-900">{prescription.dosage}</p>
                                      </div>
                                      <div className="bg-slate-50 p-3 rounded-md">
                                        <span className="font-medium text-slate-700 block">Frequency</span>
                                        <p className="text-slate-900">{prescription.frequency}</p>
                                      </div>
                                      <div className="bg-slate-50 p-3 rounded-md">
                                        <span className="font-medium text-slate-700 block">Duration</span>
                                        <p className="text-slate-900">{prescription.duration}</p>
                                      </div>
                                      <div className="bg-slate-50 p-3 rounded-md">
                                        <span className="font-medium text-slate-700 block">Start Date</span>
                                        <p className="text-slate-900">{prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : 'N/A'}</p>
                                      </div>
                                    </div>
                                    
                                    {prescription.instructions && (
                                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                        <span className="font-medium text-blue-800 block mb-1">Instructions:</span>
                                        <p className="text-blue-900 text-sm">{prescription.instructions}</p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-col gap-2 ml-4">
                                    {(user?.role === 'doctor' || user?.role === 'admin') && (
                                      <>
                                        <Button variant="outline" size="sm" onClick={() => console.log('Complete medication:', prescription.id)}>
                                          Complete
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => console.log('Print prescription:', prescription.id)}>
                                          <Printer className="w-4 h-4 mr-1" />
                                          Print
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Pill className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900">No active medications</h3>
                          <p className="mt-2 text-sm text-gray-500">This patient currently has no active medications.</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* Past Medications Tab */}
                    <TabsContent value="past" className="space-y-4">
                      {prescriptions?.filter(p => p.status === 'completed').length > 0 ? (
                        <div className="grid gap-4">
                          {prescriptions
                            .filter((prescription: any) => prescription.status === 'completed')
                            .map((prescription: any) => (
                              <div key={prescription.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-semibold text-gray-700">{prescription.medicationName}</h4>
                                      <Badge variant="secondary">Completed</Badge>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <p>Dosage: {prescription.dosage} • Frequency: {prescription.frequency}</p>
                                      <p>Duration: {prescription.duration}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900">No past medications</h3>
                          <p className="mt-2 text-sm text-gray-500">No completed medications found.</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* Repeat Medications Tab */}
                    <TabsContent value="repeat" className="space-y-4">
                      <div className="text-center py-8">
                        <Activity className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No repeat medications</h3>
                        <p className="mt-2 text-sm text-gray-500">No repeat prescriptions available.</p>
                      </div>
                    </TabsContent>

                    {/* Summary Tab */}
                    <TabsContent value="summary" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{prescriptions?.filter(p => p.status === 'active')?.length || 0}</div>
                            <div className="text-sm text-gray-600">Active Medications</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{prescriptions?.length || 0}</div>
                            <div className="text-sm text-gray-600">Total Prescriptions</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">0</div>
                            <div className="text-sm text-gray-600">Allergies Noted</div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prescriptions">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Prescription History
                      </CardTitle>
                      <CardDescription>All prescriptions (current and past)</CardDescription>
                    </div>
                    {(user?.role === 'doctor' || user?.role === 'admin') && (
                      <Button 
                        onClick={() => setShowPrescriptionModal(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Prescribe Medication
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {prescriptions && prescriptions.length > 0 ? (
                    <div className="space-y-4">
                      {prescriptions.map((prescription: any) => (
                        <div key={prescription.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">{prescription.medicationName}</h4>
                                <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                                  {prescription.status}
                                </Badge>
                                {prescription.status === 'active' && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                <div className="bg-gray-50 p-3 rounded">
                                  <span className="font-medium text-gray-700 block">Dosage</span>
                                  <p className="text-gray-900">{prescription.dosage}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                  <span className="font-medium text-gray-700 block">Frequency</span>
                                  <p className="text-gray-900">{prescription.frequency}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                  <span className="font-medium text-gray-700 block">Duration</span>
                                  <p className="text-gray-900">{prescription.duration}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                  <span className="font-medium text-gray-700 block">Prescribed By</span>
                                  <p className="text-gray-900">Dr. {prescription.doctorName || 'Unknown'}</p>
                                </div>
                              </div>
                              
                              {prescription.instructions && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                  <span className="font-medium text-blue-800 block mb-1">Special Instructions:</span>
                                  <p className="text-blue-900 text-sm">{prescription.instructions}</p>
                                </div>
                              )}
                              
                              {prescription.pharmacyId && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <span className="font-medium">Dispensed at:</span> {prescription.pharmacyName || `Pharmacy ID: ${prescription.pharmacyId}`}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-2 ml-4">
                              {prescription.status === 'active' && (user?.role === 'doctor' || user?.role === 'admin') && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // TODO: Implement discontinue prescription functionality
                                    console.log('Discontinuing prescription:', prescription.id);
                                  }}
                                >
                                  Discontinue
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  // TODO: Implement print prescription functionality
                                  console.log('Printing prescription:', prescription.id);
                                }}
                              >
                                <Printer className="w-4 h-4 mr-1" />
                                Print
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No prescriptions yet</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        This patient has no prescription history. Click "Prescribe Medication" to add the first prescription.
                      </p>
                      {(user?.role === 'doctor' || user?.role === 'admin') && (
                        <Button 
                          onClick={() => setShowPrescriptionModal(true)}
                          className="mt-4 bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Prescribe First Medication
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Documents</CardTitle>
                  <CardDescription>Medical records and patient files</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No documents yet</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Patient documents will appear here when uploaded.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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

      {/* Specialty Assessment Modal */}
      <Dialog open={showAssessmentModal} onOpenChange={setShowAssessmentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAssessmentType ? `${selectedAssessmentType.charAt(0).toUpperCase() + selectedAssessmentType.slice(1)} Assessment` : 'Specialty Assessment'}
            </DialogTitle>
            <DialogDescription>
              Complete the {selectedAssessmentType} assessment form for {patient?.firstName} {patient?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedAssessmentType && (
              <div className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedAssessmentType.charAt(0).toUpperCase() + selectedAssessmentType.slice(1)} Assessment
                  </h3>
                  <p className="text-gray-500 mb-6">
                    This would open the {selectedAssessmentType} assessment form for completion.
                    Assessment results will be saved to the patient's consultation history.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <Button 
                      onClick={() => {
                        // Simulate assessment completion
                        handleAssessmentComplete({
                          findings: `${selectedAssessmentType} assessment completed`,
                          diagnosis: 'Assessment findings recorded',
                          treatment: 'Follow-up as needed',
                          assessmentType: selectedAssessmentType
                        });
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Complete Assessment
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowAssessmentModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>



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