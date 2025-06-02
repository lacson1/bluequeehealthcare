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
  X
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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="specialty">Specialty Assessment</TabsTrigger>
              <TabsTrigger value="labs">Lab Results</TabsTrigger>
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
                      <Heart className="w-5 h-5" />
                      Latest Vitals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {visits && visits.length > 0 && visits[0].bloodPressure ? (
                      <div className="space-y-2 text-sm">
                        {visits[0].bloodPressure && (
                          <div className="flex justify-between">
                            <span>Blood Pressure:</span>
                            <span className="font-medium">{visits[0].bloodPressure}</span>
                          </div>
                        )}
                        {visits[0].heartRate && (
                          <div className="flex justify-between">
                            <span>Heart Rate:</span>
                            <span className="font-medium">{visits[0].heartRate} bpm</span>
                          </div>
                        )}
                        {visits[0].temperature && (
                          <div className="flex justify-between">
                            <span>Temperature:</span>
                            <span className="font-medium">{visits[0].temperature}°C</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No vital signs recorded yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* Allergies & Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Health Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patient.allergies ? (
                      <div className="space-y-2">
                        <Badge variant="destructive" className="w-full justify-center">
                          Allergies: {patient.allergies}
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No known allergies</p>
                    )}
                  </CardContent>
                </Card>
              </div>
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

            <TabsContent value="prescriptions">
              <Card>
                <CardHeader>
                  <CardTitle>Medications & Prescriptions</CardTitle>
                  <CardDescription>Current and past prescriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {prescriptions?.map((prescription: any) => (
                      <div key={prescription.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{prescription.medicationName}</h4>
                            <p className="text-sm text-gray-500">
                              {prescription.dosage} - {prescription.frequency}
                            </p>
                            <p className="text-sm">Duration: {prescription.duration}</p>
                          </div>
                          <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                            {prescription.status}
                          </Badge>
                        </div>
                        {prescription.instructions && (
                          <p className="text-sm text-gray-600 mt-2">
                            Instructions: {prescription.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
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