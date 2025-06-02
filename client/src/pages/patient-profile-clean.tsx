import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  CheckCircle,
  Eye,
  Thermometer,
  Ear,
  Search,
  X,
  Printer,
  ChevronDown,
  BarChart3,
  Settings,
  MoreHorizontal,
  QrCode,
  RefreshCw,
  Send,
  Ban,
  StopCircle,
  RotateCcw
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VisitRecordingModal } from "@/components/visit-recording-modal";
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
import { FloatingActionMenu } from "@/components/floating-action-menu";
import { useRole } from "@/components/role-guard";
import PatientDocuments from "@/components/patient-documents";
import PatientLabResults from "@/components/patient-lab-results";
import StandaloneVitalSignsRecorder from "@/components/standalone-vital-signs-recorder";
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
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [showVisitDetails, setShowVisitDetails] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [showStandaloneVitals, setShowStandaloneVitals] = useState(false);
  const [vitalsTimeRange, setVitalsTimeRange] = useState('30'); // Days to show

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
    queryKey: [`/api/patients/${patientId}/prescriptions`],
    enabled: !!patientId,
  });

  // Fetch standalone vital signs data
  const { data: vitalSigns = [], isLoading: vitalsLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/vitals`],
    enabled: !!patientId,
  });

  // Filter visits based on selected time range
  const filterVisitsByTimeRange = (visits: any[], days: string) => {
    if (!visits) return [];
    if (days === 'all') return visits;
    
    const daysToShow = parseInt(days);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToShow);
    
    return visits.filter(visit => {
      const visitDate = new Date(visit.visitDate);
      return visitDate >= cutoffDate;
    });
  };

  const filteredVisits = filterVisitsByTimeRange(visits, vitalsTimeRange);
  
  // Helper function to determine vital sign status and color
  const getVitalStatus = (type: string, value: any) => {
    if (!value || value === 'N/A') return { status: 'No Data', color: 'text-gray-500', bgColor: 'from-gray-50 to-gray-100', borderColor: 'border-gray-500' };
    
    switch (type) {
      case 'bloodPressure':
        if (typeof value === 'string' && value.includes('/')) {
          const [systolic, diastolic] = value.split('/').map(Number);
          // European Heart Association guidelines
          if (systolic >= 180 || diastolic >= 110) {
            return { status: 'Grade 3 Hypertension', color: 'text-red-800', bgColor: 'from-red-50 to-red-100', borderColor: 'border-red-500' };
          } else if (systolic >= 160 || diastolic >= 100) {
            return { status: 'Grade 2 Hypertension', color: 'text-red-700', bgColor: 'from-red-50 to-red-100', borderColor: 'border-red-400' };
          } else if (systolic >= 140 || diastolic >= 90) {
            return { status: 'Grade 1 Hypertension', color: 'text-orange-800', bgColor: 'from-orange-50 to-orange-100', borderColor: 'border-orange-500' };
          } else if (systolic >= 130 || diastolic >= 85) {
            return { status: 'High Normal', color: 'text-yellow-800', bgColor: 'from-yellow-50 to-yellow-100', borderColor: 'border-yellow-500' };
          } else if (systolic < 90 || diastolic < 60) {
            return { status: 'Low', color: 'text-blue-800', bgColor: 'from-blue-50 to-blue-100', borderColor: 'border-blue-500' };
          }
        }
        return { status: 'Optimal', color: 'text-green-800', bgColor: 'from-green-50 to-green-100', borderColor: 'border-green-500' };
      
      case 'heartRate':
        const hr = typeof value === 'string' ? parseInt(value) : value;
        if (hr < 60) {
          return { status: 'Low', color: 'text-orange-800', bgColor: 'from-orange-50 to-orange-100', borderColor: 'border-orange-500' };
        } else if (hr > 100) {
          return { status: 'High', color: 'text-red-800', bgColor: 'from-red-50 to-red-100', borderColor: 'border-red-500' };
        }
        return { status: 'Normal', color: 'text-green-800', bgColor: 'from-green-50 to-green-100', borderColor: 'border-green-500' };
      
      case 'temperature':
        const temp = typeof value === 'string' ? parseFloat(value) : value;
        if (temp < 36.1) {
          return { status: 'Low', color: 'text-blue-800', bgColor: 'from-blue-50 to-blue-100', borderColor: 'border-blue-500' };
        } else if (temp > 37.2) {
          return { status: 'High', color: 'text-red-800', bgColor: 'from-red-50 to-red-100', borderColor: 'border-red-500' };
        }
        return { status: 'Normal', color: 'text-green-800', bgColor: 'from-green-50 to-green-100', borderColor: 'border-green-500' };
      
      default:
        return { status: 'Normal', color: 'text-green-800', bgColor: 'from-green-50 to-green-100', borderColor: 'border-green-500' };
    }
  };

  // Calculate summary statistics for filtered data
  const calculateVitalStats = (visits: any[]) => {
    const visitsWithVitals = visits?.filter(v => v.bloodPressure || v.heartRate || v.temperature) || [];
    if (visitsWithVitals.length === 0) return null;
    
    const bpValues = visitsWithVitals.filter(v => v.bloodPressure).map(v => v.bloodPressure);
    const hrValues = visitsWithVitals.filter(v => v.heartRate).map(v => parseInt(v.heartRate));
    const tempValues = visitsWithVitals.filter(v => v.temperature).map(v => parseFloat(v.temperature));
    
    const avgBp = bpValues.length > 0 ? bpValues[0] : 'N/A';
    const avgHr = hrValues.length > 0 ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : 'N/A';
    const avgTemp = tempValues.length > 0 ? (tempValues.reduce((a, b) => a + b, 0) / tempValues.length).toFixed(1) : 'N/A';
    
    return {
      bloodPressure: {
        trend: getVitalStatus('bloodPressure', avgBp).status,
        average: avgBp,
        ...getVitalStatus('bloodPressure', avgBp)
      },
      heartRate: {
        trend: getVitalStatus('heartRate', avgHr).status,
        average: avgHr,
        ...getVitalStatus('heartRate', avgHr)
      },
      temperature: {
        trend: getVitalStatus('temperature', avgTemp).status,
        average: avgTemp,
        ...getVitalStatus('temperature', avgTemp)
      }
    };
  };

  const vitalStats = calculateVitalStats(filteredVisits);

  // Fetch organization data for branding
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  // Get current user's organization
  const currentOrganization = Array.isArray(organizations) 
    ? organizations.find(org => org.id === (user as any)?.organizationId)
    : undefined;

  // Functional handlers for action buttons
  const handleViewVisit = (visit: any) => {
    setSelectedVisit(visit);
    setShowVisitDetails(true);
  };

  const handlePrintVisit = (visit: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Visit Record - ${patient?.firstName} ${patient?.lastName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Visit Record</h2>
              <p>Patient: ${patient?.firstName} ${patient?.lastName}</p>
              <p>Date: ${new Date(visit.visitDate).toLocaleDateString()}</p>
            </div>
            <div class="section">
              <div class="label">Visit Type:</div>
              <p>${visit.visitType}</p>
            </div>
            <div class="section">
              <div class="label">Chief Complaint:</div>
              <p>${visit.complaint || 'N/A'}</p>
            </div>
            <div class="section">
              <div class="label">Diagnosis:</div>
              <p>${visit.diagnosis || 'N/A'}</p>
            </div>
            <div class="section">
              <div class="label">Treatment:</div>
              <p>${visit.treatment || 'N/A'}</p>
            </div>
            <div class="section">
              <div class="label">Vital Signs:</div>
              <p>Blood Pressure: ${visit.bloodPressure || 'N/A'}</p>
              <p>Heart Rate: ${visit.heartRate || 'N/A'}</p>
              <p>Temperature: ${visit.temperature || 'N/A'}</p>
              <p>Weight: ${visit.weight || 'N/A'}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCompletePrescription = async (prescription: any) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescription.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to complete prescription:', error);
    }
  };

  const handlePrintPrescription = (prescription: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Prescription - ${patient?.firstName} ${patient?.lastName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .patient-info { margin-bottom: 20px; }
              .prescription-details { margin-bottom: 20px; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>PRESCRIPTION</h2>
              <p>Date: ${new Date(prescription.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="patient-info">
              <div class="label">Patient:</div>
              <p>${patient?.firstName} ${patient?.lastName}</p>
              <p>DOB: ${patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div class="prescription-details">
              <div class="label">Medication:</div>
              <p style="font-size: 18px; font-weight: bold;">${prescription.medicationName}</p>
              <div class="label">Dosage:</div>
              <p>${prescription.dosage}</p>
              <div class="label">Frequency:</div>
              <p>${prescription.frequency}</p>
              <div class="label">Duration:</div>
              <p>${prescription.duration}</p>
              ${prescription.instructions ? `
                <div class="label">Instructions:</div>
                <p>${prescription.instructions}</p>
              ` : ''}
            </div>
            <div style="margin-top: 40px;">
              <p>Doctor: _________________________</p>
              <p>Signature: _____________________</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-4 hover:bg-gray-50 p-2 rounded-lg transition-colors group">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                        {patient.firstName?.[0]?.toUpperCase()}{patient.lastName?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-gray-900">
                          {patient.title ? `${patient.title} ` : ''}{patient.firstName} {patient.lastName}
                        </h1>
                        <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
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
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuItem onClick={() => setActiveTab("overview")}>
                    <User className="w-4 h-4 mr-2" />
                    Patient Overview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("vitals")}>
                    <Thermometer className="w-4 h-4 mr-2" />
                    Vital Signs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("visits")}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Visits History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("specialty")}>
                    <Brain className="w-4 h-4 mr-2" />
                    Specialty Assessment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("labs")}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Lab Results
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("medications")}>
                    <Pill className="w-4 h-4 mr-2" />
                    Medications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("documents")}>
                    <FileText className="w-4 h-4 mr-2" />
                    Documents
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("chat")}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Patient Chat
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Patient Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
          {/* Professional Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-xl p-3 mb-6 shadow-sm">
              <TabsList className="grid w-full grid-cols-8 bg-transparent gap-2 h-auto p-0">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-600 
                           rounded-lg transition-all duration-300 ease-in-out text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent
                           font-medium py-3 px-4 text-sm flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <User className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="vitals"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-600 
                           rounded-lg transition-all duration-300 ease-in-out text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent
                           font-medium py-3 px-4 text-sm flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Activity className="w-4 h-4" />
                  Vitals
                </TabsTrigger>
                <TabsTrigger 
                  value="visits"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-600 
                           rounded-lg transition-all duration-300 ease-in-out text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent
                           font-medium py-3 px-4 text-sm flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Calendar className="w-4 h-4" />
                  Visits
                </TabsTrigger>
                <TabsTrigger 
                  value="specialty"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-600 
                           rounded-lg transition-all duration-300 ease-in-out text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent
                           font-medium py-3 px-4 text-sm flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Stethoscope className="w-4 h-4" />
                  Assessment
                </TabsTrigger>
                <TabsTrigger 
                  value="labs"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-600 
                           rounded-lg transition-all duration-300 ease-in-out text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent
                           font-medium py-3 px-4 text-sm flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <FlaskRound className="w-4 h-4" />
                  Lab Results
                </TabsTrigger>
                <TabsTrigger 
                  value="medications"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-600 
                           rounded-lg transition-all duration-300 ease-in-out text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent
                           font-medium py-3 px-4 text-sm flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Pill className="w-4 h-4" />
                  Medications
                </TabsTrigger>
                <TabsTrigger 
                  value="documents"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-600 
                           rounded-lg transition-all duration-300 ease-in-out text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent
                           font-medium py-3 px-4 text-sm flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <FileText className="w-4 h-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger 
                  value="chat"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-600 
                           rounded-lg transition-all duration-300 ease-in-out text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent
                           font-medium py-3 px-4 text-sm flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </TabsTrigger>
              </TabsList>
            </div>
            
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

                {/* Vital Signs Dashboard */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Latest Vitals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {visits && visits.length > 0 && (visits[0].bloodPressure || visits[0].heartRate || visits[0].temperature || visits[0].weight) ? (
                      <div className="grid grid-cols-2 gap-3">
                        {visits[0].bloodPressure && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                            <div className="text-red-600 text-xs font-medium">BP</div>
                            <div className="text-lg font-bold text-red-800">{visits[0].bloodPressure}</div>
                          </div>
                        )}
                        {visits[0].heartRate && (
                          <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg text-center">
                            <div className="text-pink-600 text-xs font-medium">HR</div>
                            <div className="text-lg font-bold text-pink-800">{visits[0].heartRate}</div>
                          </div>
                        )}
                        {visits[0].temperature && (
                          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
                            <div className="text-orange-600 text-xs font-medium">Temp</div>
                            <div className="text-lg font-bold text-orange-800">{visits[0].temperature}°C</div>
                          </div>
                        )}
                        {visits[0].weight && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                            <div className="text-blue-600 text-xs font-medium">Weight</div>
                            <div className="text-lg font-bold text-blue-800">{visits[0].weight}kg</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Heart className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">No vitals recorded</p>
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
                    <div className="grid grid-cols-1 gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowVisitModal(true)}
                        className="justify-start btn-outline hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                      >
                        <Plus className="w-4 h-4 mr-2 icon-professional text-blue-600" />
                        Record Visit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowLabModal(true)}
                        className="justify-start btn-outline hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
                      >
                        <FlaskRound className="w-4 h-4 mr-2 icon-professional text-emerald-600" />
                        Order Lab Test
                      </Button>
                      {(user?.role === 'doctor' || user?.role === 'admin') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowPrescriptionModal(true)}
                          className="justify-start btn-outline hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                        >
                          <Pill className="w-4 h-4 mr-2 icon-professional text-purple-600" />
                          Prescribe Medication
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveTab('chat')}
                        className="justify-start btn-outline hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 icon-professional text-indigo-600" />
                        Send Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="visits" className="space-y-6">
              {/* Visit Recording Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-500" />
                    Record Patient Visit
                  </CardTitle>
                  <CardDescription>
                    Record comprehensive visit details including vital signs, symptoms, diagnosis, and treatment plans.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setShowVisitModal(true)}
                    className="btn-primary shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="mr-2 h-4 w-4 icon-professional" />
                    Start New Visit Recording
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Visits & Consultations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-500" />
                    Recent Visits & Consultations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {visits && visits.length > 0 ? (
                    <div className="space-y-4">
                      {visits.map((visit: any) => (
                        <div key={visit.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-blue-600">
                                  consultation
                                </Badge>
                                <span className="text-sm text-gray-500">{visit.visitDate}</span>
                              </div>
                              <h4 className="font-semibold text-lg mb-1">{visit.reasonForVisit}</h4>
                              {visit.diagnosis && (
                                <p className="text-sm text-gray-600 mb-2">
                                  <strong>Diagnosis:</strong> {visit.diagnosis}
                                </p>
                              )}
                              {visit.vitalSigns && (
                                <div className="text-sm text-gray-600">
                                  <strong>Vitals:</strong> BP: {visit.vitalSigns.bloodPressure || 'N/A'} | HR: {visit.vitalSigns.heartRate || 'N/A'}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewVisit(visit)}
                                title="View Visit Details"
                                className="btn-icon-secondary hover:bg-blue-50 hover:border-blue-300"
                              >
                                <Eye className="w-4 h-4 icon-professional text-blue-600" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handlePrintVisit(visit)}
                                title="Print Visit Record"
                                className="btn-icon-secondary hover:bg-green-50 hover:border-green-300"
                              >
                                <FileText className="w-4 h-4 icon-professional text-green-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No visits recorded yet</p>
                      <p className="text-sm">Start by recording a new visit</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="labs" className="space-y-6">
              <PatientLabResults patientId={patient.id} />
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
                          className="btn-primary shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                        >
                          <Plus className="mr-2 h-4 w-4 icon-professional" />
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
                                  
                                  <div className="flex items-center gap-2 ml-4">
                                    {(user?.role === 'doctor' || user?.role === 'admin') && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 hover:bg-slate-100"
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                          <DropdownMenuItem onClick={() => handlePrintPrescription(prescription)}>
                                            <Printer className="mr-2 h-4 w-4" />
                                            Print Prescription
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => {
                                            const qrData = JSON.stringify({
                                              id: prescription.id,
                                              patient: `${patient?.firstName} ${patient?.lastName}`,
                                              medication: prescription.medicationName,
                                              dosage: prescription.dosage,
                                              frequency: prescription.frequency,
                                              duration: prescription.duration,
                                              prescribedDate: prescription.createdAt,
                                              verificationCode: `RX${prescription.id}${new Date().getFullYear()}`
                                            });
                                            navigator.clipboard.writeText(qrData);
                                            alert(`QR Code data copied to clipboard for ${prescription.medicationName}`);
                                          }}>
                                            <QrCode className="mr-2 h-4 w-4" />
                                            Generate QR Code
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={async () => {
                                            const reorderData = {
                                              patientId: prescription.patientId,
                                              medicationName: prescription.medicationName,
                                              dosage: prescription.dosage,
                                              frequency: prescription.frequency,
                                              duration: prescription.duration,
                                              instructions: prescription.instructions,
                                              quantity: prescription.quantity
                                            };
                                            
                                            try {
                                              const response = await fetch(`/api/patients/${patientId}/prescriptions`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(reorderData)
                                              });
                                              if (response.ok) {
                                                // Use toast instead of alert for better UX
                                                console.log(`${prescription.medicationName} reordered successfully`);
                                                window.location.reload();
                                              }
                                            } catch (error) {
                                              alert('Failed to reorder prescription');
                                            }
                                          }}>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Reorder Medication
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={async () => {
                                            try {
                                              const response = await fetch(`/api/prescriptions/${prescription.id}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ 
                                                  duration: 'Ongoing as directed',
                                                  isRepeat: true 
                                                })
                                              });
                                              if (response.ok) {
                                                console.log(`${prescription.medicationName} added to repeat prescriptions`);
                                                window.location.reload();
                                              }
                                            } catch (error) {
                                              alert('Failed to add to repeat prescriptions');
                                            }
                                          }}>
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Add to Repeat
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={async () => {
                                            try {
                                              const pharmaciesResponse = await fetch('/api/pharmacies');
                                              const pharmacies = await pharmaciesResponse.json();
                                              
                                              if (pharmacies.length === 0) {
                                                alert('No pharmacies available. Please contact administrator.');
                                                return;
                                              }
                                              
                                              // For simplicity, use the first available pharmacy
                                              // In a full implementation, you would show a selection dialog
                                              const selectedPharmacy = pharmacies[0];
                                              
                                              const response = await fetch(`/api/prescriptions/${prescription.id}/send-to-pharmacy`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ 
                                                  pharmacyId: selectedPharmacy.id,
                                                  notes: `Prescription for ${prescription.medicationName} sent from clinic`
                                                })
                                              });
                                              
                                              if (response.ok) {
                                                console.log(`Prescription for ${prescription.medicationName} sent to ${selectedPharmacy.name} successfully`);
                                                window.location.reload();
                                              } else {
                                                throw new Error('Failed to send prescription');
                                              }
                                            } catch (error) {
                                              alert('Failed to send prescription to pharmacy. Please try again.');
                                            }
                                          }}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send to Pharmacy
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => handleCompletePrescription(prescription)}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Mark Complete
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={() => {
                                              if (confirm(`Discontinue ${prescription.medicationName}?`)) {
                                                alert(`${prescription.medicationName} has been discontinued`);
                                              }
                                            }}
                                            className="text-orange-600"
                                          >
                                            <StopCircle className="mr-2 h-4 w-4" />
                                            Discontinue
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={() => {
                                              if (confirm(`Cancel ${prescription.medicationName}?`)) {
                                                alert(`${prescription.medicationName} has been cancelled`);
                                              }
                                            }}
                                            className="text-red-600"
                                          >
                                            <Ban className="mr-2 h-4 w-4" />
                                            Cancel Prescription
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
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

            <TabsContent value="vitals" className="space-y-6">
              {/* Vital Signs Monitor - Enhanced Professional Design */}
              <div className="bg-gradient-to-br from-white via-blue-50/30 to-green-50/30 rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Vital Signs Monitor</h2>
                      <p className="text-sm text-gray-600">Real-time patient monitoring dashboard</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowStandaloneVitals(true)}
                    className="btn-primary shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-700 border-0"
                    disabled={!user || (user.role !== 'nurse' && user.role !== 'doctor' && user.role !== 'admin')}
                  >
                    <Plus className="w-4 h-4 mr-2 icon-professional" />
                    Record Vital Signs
                  </Button>
                </div>
                
                {/* Enhanced Vital Signs Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  {(() => {
                    const latestVitals = vitalSigns?.[0]; // Most recent vital signs
                    
                    const getVitalStatus = (type: string, value: any) => {
                      if (!value) return { status: 'No Data', color: 'text-gray-400', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
                      
                      switch (type) {
                        case 'bloodPressure':
                          const systolic = latestVitals?.bloodPressureSystolic;
                          const diastolic = latestVitals?.bloodPressureDiastolic;
                          if (!systolic || !diastolic) return { status: 'No Data', color: 'text-gray-400', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
                          
                          // European Heart Association guidelines
                          if (systolic >= 180 || diastolic >= 110) {
                            return { status: 'Grade 3 HTN', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
                          } else if (systolic >= 160 || diastolic >= 100) {
                            return { status: 'Grade 2 HTN', color: 'text-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
                          } else if (systolic >= 140 || diastolic >= 90) {
                            return { status: 'Grade 1 HTN', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
                          } else if (systolic >= 130 || diastolic >= 85) {
                            return { status: 'High Normal', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
                          } else if (systolic < 90 || diastolic < 60) {
                            return { status: 'Low', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
                          }
                          return { status: 'Optimal', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
                          
                        case 'heartRate':
                          if (value < 60) return { status: 'Bradycardia', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
                          if (value > 100) return { status: 'Tachycardia', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
                          return { status: 'Normal', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
                          
                        case 'temperature':
                          const temp = parseFloat(value);
                          if (temp < 36.1) return { status: 'Hypothermia', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
                          if (temp > 37.2) return { status: 'Fever', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
                          return { status: 'Normal', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
                          
                        case 'oxygenSat':
                          if (value < 90) return { status: 'Critical', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
                          if (value < 95) return { status: 'Low', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
                          return { status: 'Normal', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
                          
                        default:
                          return { status: 'Normal', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
                      }
                    };

                    const bpStatus = getVitalStatus('bloodPressure', latestVitals?.bloodPressureSystolic);
                    const hrStatus = getVitalStatus('heartRate', latestVitals?.heartRate);
                    const tempStatus = getVitalStatus('temperature', latestVitals?.temperature);
                    const o2Status = getVitalStatus('oxygenSat', latestVitals?.oxygenSaturation);

                    return (
                      <>
                        {/* Blood Pressure Card */}
                        <div className={`${bpStatus.bgColor} ${bpStatus.borderColor} border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:scale-105`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                              <Heart className="w-6 h-6 text-white" />
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${bpStatus.bgColor} ${bpStatus.color} border ${bpStatus.borderColor}`}>
                              {bpStatus.status}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                              {latestVitals?.bloodPressureSystolic && latestVitals?.bloodPressureDiastolic 
                                ? `${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic}`
                                : 'N/A'
                              }
                            </div>
                            <div className="text-sm font-medium text-gray-600">Blood Pressure</div>
                            <div className="text-xs text-gray-500">mmHg</div>
                          </div>
                        </div>
                        
                        {/* Heart Rate Card */}
                        <div className={`${hrStatus.bgColor} ${hrStatus.borderColor} border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:scale-105`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                              <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${hrStatus.bgColor} ${hrStatus.color} border ${hrStatus.borderColor}`}>
                              {hrStatus.status}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                              {latestVitals?.heartRate || 'N/A'}
                            </div>
                            <div className="text-sm font-medium text-gray-600">Heart Rate</div>
                            <div className="text-xs text-gray-500">bpm</div>
                          </div>
                        </div>
                        
                        {/* Temperature Card */}
                        <div className={`${tempStatus.bgColor} ${tempStatus.borderColor} border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:scale-105`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                              <Thermometer className="w-6 h-6 text-white" />
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${tempStatus.bgColor} ${tempStatus.color} border ${tempStatus.borderColor}`}>
                              {tempStatus.status}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                              {latestVitals?.temperature ? `${parseFloat(latestVitals.temperature).toFixed(1)}°C` : 'N/A'}
                            </div>
                            <div className="text-sm font-medium text-gray-600">Temperature</div>
                            <div className="text-xs text-gray-500">Celsius</div>
                          </div>
                        </div>
                        
                        {/* Oxygen Saturation Card */}
                        <div className={`${o2Status.bgColor} ${o2Status.borderColor} border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:scale-105`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                              <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${o2Status.bgColor} ${o2Status.color} border ${o2Status.borderColor}`}>
                              {o2Status.status}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                              {latestVitals?.oxygenSaturation ? `${latestVitals.oxygenSaturation}%` : 'N/A'}
                            </div>
                            <div className="text-sm font-medium text-gray-600">Oxygen Saturation</div>
                            <div className="text-xs text-gray-500">SpO2</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Enhanced Trends Chart Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Vital Signs Trends</h3>
                        <p className="text-sm text-gray-600">Historical monitoring data</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-gray-600">Blood Pressure</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">Heart Rate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-600">Temperature</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Chart area */}
                  <div className="h-40 bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl relative overflow-hidden">
                    {/* Grid lines */}
                    <div className="absolute inset-0">
                      <div className="h-full flex flex-col justify-between">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="border-t border-slate-200/60"></div>
                        ))}
                      </div>
                      <div className="absolute inset-0 flex justify-between">
                        {[...Array(7)].map((_, i) => (
                          <div key={i} className="border-l border-slate-200/60 h-full"></div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Y-axis labels */}
                    <div className="absolute left-2 top-0 h-full flex flex-col justify-between text-xs text-gray-500 py-3">
                      <span className="bg-white px-1 rounded">140</span>
                      <span className="bg-white px-1 rounded">105</span>
                      <span className="bg-white px-1 rounded">70</span>
                      <span className="bg-white px-1 rounded">35</span>
                      <span className="bg-white px-1 rounded">0</span>
                    </div>
                    
                    {/* Chart lines with real data */}
                    <div className="ml-10 mr-4 h-full relative">
                      {(() => {
                        const vitalsData = filteredVisits
                          .filter(v => v.bloodPressure || v.heartRate || v.temperature)
                          .slice(-7) // Last 7 data points for the chart
                          .reverse(); // Most recent first
                        
                        if (vitalsData.length === 0) {
                          return <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data available for selected time range</div>;
                        }
                        
                        const chartWidth = 280;
                        const chartHeight = 140;
                        const maxDataPoints = 7;
                        const stepX = chartWidth / (maxDataPoints - 1);
                        
                        // Generate paths based on real data
                        const generatePath = (values: number[], scale: { min: number, max: number }) => {
                          if (values.length === 0) return "";
                          
                          const points = values.map((value, index) => {
                            const x = index * stepX;
                            const normalizedValue = ((value - scale.min) / (scale.max - scale.min));
                            const y = chartHeight - (normalizedValue * chartHeight * 0.8) - 20; // Keep some margin
                            return `${x},${Math.max(10, Math.min(y, chartHeight - 10))}`; // Constrain to chart bounds
                          });
                          
                          return `M ${points[0]} ` + points.slice(1).map((point, i) => {
                            const prevPoint = points[i];
                            const [prevX, prevY] = prevPoint.split(',').map(Number);
                            const [currX, currY] = point.split(',').map(Number);
                            const cpX = prevX + (currX - prevX) / 2;
                            return `Q ${cpX},${prevY} ${currX},${currY}`;
                          }).join(' ');
                        };
                        
                        // Extract and scale data
                        const bpSystolic = vitalsData.map(v => v.bloodPressure ? parseInt(v.bloodPressure.split('/')[0]) : null).filter(v => v !== null);
                        const heartRates = vitalsData.map(v => v.heartRate ? parseInt(v.heartRate) : null).filter(v => v !== null);
                        const temperatures = vitalsData.map(v => v.temperature ? parseFloat(v.temperature) : null).filter(v => v !== null);
                        
                        const bpPath = bpSystolic.length > 0 ? generatePath(bpSystolic, { min: 90, max: 180 }) : "";
                        const hrPath = heartRates.length > 0 ? generatePath(heartRates, { min: 50, max: 120 }) : "";
                        const tempPath = temperatures.length > 0 ? generatePath(temperatures, { min: 35, max: 40 }) : "";
                        
                        return (
                          <>
                            {/* Blood Pressure line */}
                            {bpPath && (
                              <svg className="absolute inset-0 w-full h-full">
                                <path 
                                  d={bpPath}
                                  stroke="url(#redGradient)" 
                                  strokeWidth="3" 
                                  fill="none"
                                  className="drop-shadow-sm"
                                />
                                <defs>
                                  <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#ef4444" />
                                    <stop offset="100%" stopColor="#dc2626" />
                                  </linearGradient>
                                </defs>
                              </svg>
                            )}
                            
                            {/* Heart Rate line */}
                            {hrPath && (
                              <svg className="absolute inset-0 w-full h-full">
                                <path 
                                  d={hrPath}
                                  stroke="url(#blueGradient)" 
                                  strokeWidth="3" 
                                  fill="none"
                                  className="drop-shadow-sm"
                                />
                                <defs>
                                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#2563eb" />
                                  </linearGradient>
                                </defs>
                              </svg>
                            )}
                            
                            {/* Temperature line */}
                            {tempPath && (
                              <svg className="absolute inset-0 w-full h-full">
                                <path 
                                  d={tempPath}
                                  stroke="url(#orangeGradient)" 
                                  strokeWidth="3" 
                                  fill="none"
                                  className="drop-shadow-sm"
                                />
                                <defs>
                                  <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#f97316" />
                                    <stop offset="100%" stopColor="#ea580c" />
                                  </linearGradient>
                                </defs>
                              </svg>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    
                    {/* X-axis time labels */}
                    <div className="absolute bottom-1 left-10 right-4 flex justify-between text-xs text-gray-500">
                      <span>6h ago</span>
                      <span>5h ago</span>
                      <span>4h ago</span>
                      <span>3h ago</span>
                      <span>2h ago</span>
                      <span>1h ago</span>
                      <span>Now</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Vitals History with Controls */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Vital Signs History</h3>
                        <p className="text-sm text-gray-600">Historical records with trend analysis</p>
                      </div>
                    </div>
                    
                    {/* Time Range Selector */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Time Range:</label>
                      <select 
                        value={vitalsTimeRange}
                        onChange={(e) => setVitalsTimeRange(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 transition-colors"
                      >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 3 months</option>
                        <option value="365">Last year</option>
                        <option value="all">All records</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {filteredVisits && filteredVisits.filter(v => v.bloodPressure || v.heartRate || v.temperature).length > 0 ? (
                    <div className="space-y-6">
                      {/* Summary Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className={`bg-gradient-to-r ${vitalStats?.bloodPressure?.bgColor || 'from-gray-50 to-gray-100'} p-4 rounded-lg border-l-4 ${vitalStats?.bloodPressure?.borderColor || 'border-gray-500'}`}>
                          <div className={`text-sm font-medium ${vitalStats?.bloodPressure?.color || 'text-gray-700'}`}>Blood Pressure Trend</div>
                          <div className={`text-lg font-bold ${vitalStats?.bloodPressure?.color || 'text-gray-800'}`}>{vitalStats?.bloodPressure?.trend || 'No Data'}</div>
                          <div className={`text-xs ${vitalStats?.bloodPressure?.color || 'text-gray-600'}`}>Average: {vitalStats?.bloodPressure?.average || 'N/A'}</div>
                        </div>
                        <div className={`bg-gradient-to-r ${vitalStats?.heartRate?.bgColor || 'from-gray-50 to-gray-100'} p-4 rounded-lg border-l-4 ${vitalStats?.heartRate?.borderColor || 'border-gray-500'}`}>
                          <div className={`text-sm font-medium ${vitalStats?.heartRate?.color || 'text-gray-700'}`}>Heart Rate Trend</div>
                          <div className={`text-lg font-bold ${vitalStats?.heartRate?.color || 'text-gray-800'}`}>{vitalStats?.heartRate?.trend || 'No Data'}</div>
                          <div className={`text-xs ${vitalStats?.heartRate?.color || 'text-gray-600'}`}>Average: {vitalStats?.heartRate?.average || 'N/A'} {typeof vitalStats?.heartRate?.average === 'number' ? 'bpm' : ''}</div>
                        </div>
                        <div className={`bg-gradient-to-r ${vitalStats?.temperature?.bgColor || 'from-gray-50 to-gray-100'} p-4 rounded-lg border-l-4 ${vitalStats?.temperature?.borderColor || 'border-gray-500'}`}>
                          <div className={`text-sm font-medium ${vitalStats?.temperature?.color || 'text-gray-700'}`}>Temperature Trend</div>
                          <div className={`text-lg font-bold ${vitalStats?.temperature?.color || 'text-gray-800'}`}>{vitalStats?.temperature?.trend || 'No Data'}</div>
                          <div className={`text-xs ${vitalStats?.temperature?.color || 'text-gray-600'}`}>Average: {vitalStats?.temperature?.average || 'N/A'} {typeof vitalStats?.temperature?.average === 'number' ? '°C' : ''}</div>
                        </div>
                      </div>

                      {/* Historical Records */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-md font-semibold text-gray-800">Recent Records</h4>
                          <div className="text-sm text-gray-500">
                            Showing {Math.min(filteredVisits.filter(v => v.bloodPressure || v.heartRate || v.temperature).length, 10)} of {filteredVisits.filter(v => v.bloodPressure || v.heartRate || v.temperature).length} records
                          </div>
                        </div>
                        
                        {filteredVisits
                          .filter(v => v.bloodPressure || v.heartRate || v.temperature)
                          .slice(0, 10)
                          .map((visit: any) => (
                            <div key={visit.id} className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-semibold text-gray-700">
                                    {new Date(visit.visitDate).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    at {new Date(visit.visitDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">{visit.status}</Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                                {visit.bloodPressure && (
                                  <div className={`bg-white p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                                    getVitalStatus('bloodPressure', visit.bloodPressure).status === 'Optimal' ? 'border-green-200 hover:border-green-300' :
                                    getVitalStatus('bloodPressure', visit.bloodPressure).status === 'High Normal' ? 'border-yellow-200 hover:border-yellow-300' :
                                    getVitalStatus('bloodPressure', visit.bloodPressure).status === 'Grade 1 Hypertension' ? 'border-orange-200 hover:border-orange-300' :
                                    getVitalStatus('bloodPressure', visit.bloodPressure).status === 'Low' ? 'border-blue-200 hover:border-blue-300' :
                                    'border-red-200 hover:border-red-300'
                                  }`}>
                                    <div className={`font-medium text-xs flex items-center justify-between`}>
                                      <span className={
                                        getVitalStatus('bloodPressure', visit.bloodPressure).status === 'Optimal' ? 'text-green-600' :
                                        getVitalStatus('bloodPressure', visit.bloodPressure).status === 'High Normal' ? 'text-yellow-600' :
                                        getVitalStatus('bloodPressure', visit.bloodPressure).status === 'Grade 1 Hypertension' ? 'text-orange-600' :
                                        getVitalStatus('bloodPressure', visit.bloodPressure).status === 'Low' ? 'text-blue-600' :
                                        'text-red-600'
                                      }>Blood Pressure</span>
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        getVitalStatus('bloodPressure', visit.bloodPressure).status === 'Optimal' ? 'bg-green-100 text-green-700' :
                                        getVitalStatus('bloodPressure', visit.bloodPressure).status === 'High Normal' ? 'bg-yellow-100 text-yellow-700' :
                                        getVitalStatus('bloodPressure', visit.bloodPressure).status === 'Grade 1 Hypertension' ? 'bg-orange-100 text-orange-700' :
                                        getVitalStatus('bloodPressure', visit.bloodPressure).status === 'Low' ? 'bg-blue-100 text-blue-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>{getVitalStatus('bloodPressure', visit.bloodPressure).status}</span>
                                    </div>
                                    <div className={`font-bold ${
                                      getVitalStatus('bloodPressure', visit.bloodPressure).status === 'Optimal' ? 'text-green-800' :
                                      getVitalStatus('bloodPressure', visit.bloodPressure).status === 'High Normal' ? 'text-yellow-800' :
                                      getVitalStatus('bloodPressure', visit.bloodPressure).status === 'Grade 1 Hypertension' ? 'text-orange-800' :
                                      getVitalStatus('bloodPressure', visit.bloodPressure).status === 'Low' ? 'text-blue-800' :
                                      'text-red-800'
                                    }`}>{visit.bloodPressure}</div>
                                  </div>
                                )}
                                {visit.heartRate && (
                                  <div className={`bg-white p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                                    getVitalStatus('heartRate', visit.heartRate).status === 'Normal' ? 'border-green-200 hover:border-green-300' :
                                    getVitalStatus('heartRate', visit.heartRate).status === 'High' ? 'border-red-200 hover:border-red-300' :
                                    'border-orange-200 hover:border-orange-300'
                                  }`}>
                                    <div className={`font-medium text-xs flex items-center justify-between`}>
                                      <span className={
                                        getVitalStatus('heartRate', visit.heartRate).status === 'Normal' ? 'text-green-600' :
                                        getVitalStatus('heartRate', visit.heartRate).status === 'High' ? 'text-red-600' :
                                        'text-orange-600'
                                      }>Heart Rate</span>
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        getVitalStatus('heartRate', visit.heartRate).status === 'Normal' ? 'bg-green-100 text-green-700' :
                                        getVitalStatus('heartRate', visit.heartRate).status === 'High' ? 'bg-red-100 text-red-700' :
                                        'bg-orange-100 text-orange-700'
                                      }`}>{getVitalStatus('heartRate', visit.heartRate).status}</span>
                                    </div>
                                    <div className={`font-bold ${
                                      getVitalStatus('heartRate', visit.heartRate).status === 'Normal' ? 'text-green-800' :
                                      getVitalStatus('heartRate', visit.heartRate).status === 'High' ? 'text-red-800' :
                                      'text-orange-800'
                                    }`}>{visit.heartRate} bpm</div>
                                  </div>
                                )}
                                {visit.temperature && (
                                  <div className={`bg-white p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                                    getVitalStatus('temperature', visit.temperature).status === 'Normal' ? 'border-green-200 hover:border-green-300' :
                                    getVitalStatus('temperature', visit.temperature).status === 'High' ? 'border-red-200 hover:border-red-300' :
                                    'border-blue-200 hover:border-blue-300'
                                  }`}>
                                    <div className={`font-medium text-xs flex items-center justify-between`}>
                                      <span className={
                                        getVitalStatus('temperature', visit.temperature).status === 'Normal' ? 'text-green-600' :
                                        getVitalStatus('temperature', visit.temperature).status === 'High' ? 'text-red-600' :
                                        'text-blue-600'
                                      }>Temperature</span>
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        getVitalStatus('temperature', visit.temperature).status === 'Normal' ? 'bg-green-100 text-green-700' :
                                        getVitalStatus('temperature', visit.temperature).status === 'High' ? 'bg-red-100 text-red-700' :
                                        'bg-blue-100 text-blue-700'
                                      }`}>{getVitalStatus('temperature', visit.temperature).status}</span>
                                    </div>
                                    <div className={`font-bold ${
                                      getVitalStatus('temperature', visit.temperature).status === 'Normal' ? 'text-green-800' :
                                      getVitalStatus('temperature', visit.temperature).status === 'High' ? 'text-red-800' :
                                      'text-blue-800'
                                    }`}>{visit.temperature}°C</div>
                                  </div>
                                )}
                                {visit.weight && (
                                  <div className="bg-white p-3 rounded-lg border-2 border-indigo-200 hover:border-indigo-300 transition-all duration-200 hover:shadow-md">
                                    <div className="text-indigo-600 font-medium text-xs">Weight</div>
                                    <div className="font-bold text-indigo-800">{visit.weight} kg</div>
                                  </div>
                                )}
                                {visit.height && (
                                  <div className="bg-white p-3 rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-all duration-200 hover:shadow-md">
                                    <div className="text-purple-600 font-medium text-xs">Height</div>
                                    <div className="font-bold text-purple-800">{visit.height} cm</div>
                                  </div>
                                )}
                              </div>
                              
                              {visit.reason && (
                                <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded border">
                                  <span className="font-medium">Visit reason:</span> {visit.reason}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No vitals history</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Vital signs will appear here when recorded during visits.
                      </p>
                      <Button 
                        onClick={() => setShowVitalsRecorder(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        Record First Vitals
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="space-y-6">
              {/* Patient Communication Hub - Exact design from screenshot */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Patient Communication Hub
                  </h2>
                </div>
                
                <div className="p-6">
                  {/* Communication Navigation Tabs */}
                  <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="text-center">
                      <div className="text-blue-600 font-medium mb-2">Messages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 font-medium mb-2">Reminders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 font-medium mb-2">Templates</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 font-medium mb-2">Notifications</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Message History */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Message History</h3>
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-500">No messages yet</p>
                      </div>
                    </div>

                    {/* Send New Message */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Send New Message</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                            <select className="w-full p-2 border border-gray-300 rounded-md">
                              <option>General</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                            <select className="w-full p-2 border border-gray-300 rounded-md">
                              <option>Normal</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Use Template (Optional)</label>
                          <select className="w-full p-2 border border-gray-300 rounded-md">
                            <option>Choose a template</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                          <textarea 
                            rows={6}
                            className="w-full p-3 border border-gray-300 rounded-md"
                            placeholder="Type your message here..."
                          />
                        </div>

                        <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="specialty">
              {/* Consultation Form Selector */}
              <ConsultationFormSelector 
                patientId={patient.id} 
                patient={patient}
                preSelectedFormId={preSelectedFormId}
              />
              
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

            <TabsContent value="labs" className="space-y-6">
              <PatientLabResults patientId={patient.id} />
            </TabsContent>

            <TabsContent value="documents">
              <PatientDocuments patientId={patient.id} patientName={`${patient.firstName} ${patient.lastName}`} />
            </TabsContent>

            <TabsContent value="chat">
              <PatientChat 
                patientId={patient.id} 
                patientName={`${patient.firstName} ${patient.lastName}`}
              />
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
      <VisitRecordingModal
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



      {/* Visit Details Modal */}
      {showVisitDetails && selectedVisit && (
        <Dialog open={showVisitDetails} onOpenChange={setShowVisitDetails}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Visit Details - {new Date(selectedVisit.visitDate).toLocaleDateString()}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Visit Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Visit Type</label>
                  <p className="text-gray-900 font-medium">{selectedVisit.visitType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <p className="text-gray-900 font-medium">{new Date(selectedVisit.visitDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <label className="text-sm font-medium text-gray-600">Chief Complaint</label>
                <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedVisit.complaint || 'Not recorded'}
                </p>
              </div>

              {/* Diagnosis */}
              <div>
                <label className="text-sm font-medium text-gray-600">Diagnosis</label>
                <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedVisit.diagnosis || 'Not recorded'}
                </p>
              </div>

              {/* Treatment */}
              <div>
                <label className="text-sm font-medium text-gray-600">Treatment Plan</label>
                <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedVisit.treatment || 'Not recorded'}
                </p>
              </div>

              {/* Vital Signs */}
              {selectedVisit.vitalSigns && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Vital Signs</label>
                  <div className="mt-2 grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600">Blood Pressure:</span>
                      <p className="font-medium">{selectedVisit.vitalSigns.bloodPressure || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Heart Rate:</span>
                      <p className="font-medium">{selectedVisit.vitalSigns.heartRate || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Temperature:</span>
                      <p className="font-medium">{selectedVisit.vitalSigns.temperature || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Weight:</span>
                      <p className="font-medium">{selectedVisit.vitalSigns.weight || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => handlePrintVisit(selectedVisit)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Visit
                </Button>
                <Button onClick={() => setShowVisitDetails(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Standalone Vital Signs Recorder */}
      {showStandaloneVitals && patient && (
        <StandaloneVitalSignsRecorder
          patientId={patientId!}
          patientName={`${patient.firstName} ${patient.lastName}`}
          isOpen={showStandaloneVitals}
          onClose={() => setShowStandaloneVitals(false)}
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
