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
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  Droplets,
  Wind,
  Gauge
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
import PatientLabOrdersSummary from "@/components/patient-lab-orders-summary";
import StandaloneVitalSignsRecorder from "@/components/standalone-vital-signs-recorder";
import VitalSignsTrends from "@/components/vital-signs-trends";
import VitalSignsAlerts from "@/components/vital-signs-alerts";
import PatientTimeline from "@/components/patient-timeline";
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
  const [showVitalsTrends, setShowVitalsTrends] = useState(false);
  const [showVitalsAlerts, setShowVitalsAlerts] = useState(false);
  const [vitalsTimeRange, setVitalsTimeRange] = useState('30'); // Days to show

  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  const { data: visits, isLoading: visitsLoading } = useQuery<Visit[]>({
    queryKey: [`/api/patients/${patientId}/visits`],
    enabled: !!patientId,
  });

  const { data: labOrders, isLoading: labOrdersLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/lab-orders`],
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      {/* Premium Compact Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Patient Identity & Actions Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12 ring-2 ring-blue-100 ring-offset-2">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-lg font-semibold">
                  {patient.firstName?.[0]?.toUpperCase()}{patient.lastName?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {patient.title ? `${patient.title} ` : ''}{patient.firstName} {patient.lastName}
                  </h1>
                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    HC{patient.id?.toString().padStart(6, "0")}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(patient.dateOfBirth).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years
                  </span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {patient.gender}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/50">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
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
                <Badge variant="outline">{labOrders?.length || 0}</Badge>
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
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-6 h-full">
          {/* Professional Compact Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl px-4 py-3 mb-6 shadow-sm">
              <TabsList className="grid w-full grid-cols-8 bg-slate-50/50 gap-1 h-11 p-1 rounded-lg">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm 
                           rounded-md transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/50
                           font-medium py-2 px-3 text-sm flex items-center justify-center gap-2 h-9"
                >
                  <User className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="timeline"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-600 
                           rounded-lg transition-all duration-300 ease-in-out text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent
                           font-medium py-3 px-4 text-sm flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Clock className="w-4 h-4" />
                  Timeline
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
            
            <TabsContent value="overview" className="flex-1 space-y-6 overflow-y-auto">
              {/* Compact Overview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Timeline Summary */}
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200/50 hover:shadow-md transition-all duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Timeline Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-600">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                        Visits
                      </span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                        {visits?.length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-600">
                        <FlaskRound className="w-3.5 h-3.5 text-green-600" />
                        Lab Orders
                      </span>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        {labOrders?.length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-600">
                        <Pill className="w-3.5 h-3.5 text-purple-600" />
                        Prescriptions
                      </span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                        {prescriptions?.length || 0}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-3 text-blue-600 hover:bg-blue-50 h-8"
                      onClick={() => setActiveTab("timeline")}
                    >
                      View Timeline
                    </Button>
                  </CardContent>
                </Card>

                {/* Lab Orders Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FlaskRound className="w-5 h-5 text-green-500" />
                      Lab Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PatientLabOrdersSummary patientId={patient.id} />
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
                    {vitalSigns && vitalSigns.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {vitalSigns[0].bloodPressureSystolic && vitalSigns[0].bloodPressureDiastolic && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                            <div className="text-red-600 text-xs font-medium">BP</div>
                            <div className="text-lg font-bold text-red-800">{vitalSigns[0].bloodPressureSystolic}/{vitalSigns[0].bloodPressureDiastolic}</div>
                          </div>
                        )}
                        {vitalSigns[0].heartRate && (
                          <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg text-center">
                            <div className="text-pink-600 text-xs font-medium">HR</div>
                            <div className="text-lg font-bold text-pink-800">{vitalSigns[0].heartRate}</div>
                          </div>
                        )}
                        {vitalSigns[0].temperature && (
                          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
                            <div className="text-orange-600 text-xs font-medium">Temp</div>
                            <div className="text-lg font-bold text-orange-800">{vitalSigns[0].temperature}°C</div>
                          </div>
                        )}
                        {vitalSigns[0].weight && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                            <div className="text-blue-600 text-xs font-medium">Weight</div>
                            <div className="text-lg font-bold text-blue-800">{vitalSigns[0].weight}kg</div>
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
              {/* Nursing Quick Actions Panel */}
              {(user?.role === 'nurse' || user?.role === 'admin') && (
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-green-600" />
                      Nursing Actions
                    </CardTitle>
                    <CardDescription>
                      Quick access to common nursing tasks and patient care activities.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowStandaloneVitals(true)}
                        className="justify-start btn-outline hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                      >
                        <Activity className="w-4 h-4 mr-2 text-green-600" />
                        Record Vitals
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveTab('prescriptions')}
                        className="justify-start btn-outline hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                      >
                        <Pill className="w-4 h-4 mr-2 text-blue-600" />
                        Check Medications
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveTab('lab')}
                        className="justify-start btn-outline hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                      >
                        <FlaskRound className="w-4 h-4 mr-2 text-purple-600" />
                        Lab Preparation
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveTab('chat')}
                        className="justify-start btn-outline hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-orange-600" />
                        Patient Notes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

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
              {/* Pharmacist Quick Actions Panel */}
              {(user?.role === 'pharmacist' || user?.role === 'admin') && (
                <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="w-5 h-5 text-purple-600" />
                      Pharmacy Actions
                    </CardTitle>
                    <CardDescription>
                      Quick access to pharmacy verification, dispensing, and patient counseling tools.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start btn-outline hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                      >
                        <CheckSquare className="w-4 h-4 mr-2 text-purple-600" />
                        Verify Prescriptions
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start btn-outline hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                      >
                        <Package className="w-4 h-4 mr-2 text-green-600" />
                        Mark Dispensed
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start btn-outline hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                        Check Interactions
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start btn-outline hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                      >
                        <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
                        Patient Counseling
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                                      {/* Pharmacy Status Badge */}
                                      {prescription.pharmacyStatus && (
                                        <Badge 
                                          className={`
                                            ${prescription.pharmacyStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                                            ${prescription.pharmacyStatus === 'sent' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                                            ${prescription.pharmacyStatus === 'dispensed' ? 'bg-purple-100 text-purple-800 border-purple-200' : ''}
                                            ${prescription.pharmacyStatus === 'ready' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}
                                            ${prescription.pharmacyStatus === 'collected' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                                          `}
                                        >
                                          {prescription.pharmacyStatus === 'pending' && 'Pending Pharmacy'}
                                          {prescription.pharmacyStatus === 'sent' && 'Sent to Pharmacy'}
                                          {prescription.pharmacyStatus === 'dispensed' && 'Dispensed'}
                                          {prescription.pharmacyStatus === 'ready' && 'Ready for Pickup'}
                                          {prescription.pharmacyStatus === 'collected' && 'Collected'}
                                        </Badge>
                                      )}
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

                                    {/* Pharmacy Communication Section */}
                                    {(prescription.pharmacyId || prescription.pharmacistNotes) && (
                                      <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium text-purple-800 block">Pharmacy Information</span>
                                          {prescription.dispensedAt && (
                                            <span className="text-xs text-purple-600">
                                              Dispensed: {new Date(prescription.dispensedAt).toLocaleDateString()}
                                            </span>
                                          )}
                                        </div>
                                        {prescription.pharmacistNotes && (
                                          <div className="mb-2">
                                            <span className="text-sm font-medium text-purple-700">Pharmacist Notes:</span>
                                            <p className="text-purple-900 text-sm mt-1">{prescription.pharmacistNotes}</p>
                                          </div>
                                        )}
                                        {prescription.sentToPharmacyAt && (
                                          <div className="flex items-center text-xs text-purple-600">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Sent to pharmacy: {new Date(prescription.sentToPharmacyAt).toLocaleString()}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 ml-4">
                                    {/* Pharmacist Actions */}
                                    {(user?.role === 'pharmacist' || user?.role === 'admin') && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 hover:bg-purple-100"
                                          >
                                            <Pill className="h-4 w-4 text-purple-600" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-64">
                                          <DropdownMenuItem>
                                            <CheckSquare className="mr-2 h-4 w-4 text-green-600" />
                                            Mark as Verified
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>
                                            <Package className="mr-2 h-4 w-4 text-blue-600" />
                                            Mark as Dispensed
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>
                                            <Clock className="mr-2 h-4 w-4 text-orange-600" />
                                            Mark Ready for Pickup
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>
                                            <User className="mr-2 h-4 w-4 text-purple-600" />
                                            Mark as Collected
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem>
                                            <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                                            Flag Drug Interaction
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>
                                            <MessageSquare className="mr-2 h-4 w-4 text-blue-600" />
                                            Add Pharmacist Notes
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem>
                                            <Phone className="mr-2 h-4 w-4 text-green-600" />
                                            Contact Patient
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}

                                    {/* Doctor Actions */}
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

            <TabsContent value="timeline" className="space-y-6">
              <PatientTimeline patientId={patient.id} />
            </TabsContent>

            <TabsContent value="vitals" className="space-y-6">
              {/* Vital Signs Dashboard - Modern Medical Interface */}
              <div className="bg-gradient-to-br from-slate-50 via-blue-50/50 to-emerald-50/30 rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                {/* Header Section with Live Status */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Vital Signs Monitor</h2>
                        <p className="text-blue-100 text-sm">
                          {vitalSigns && vitalSigns.length > 0 
                            ? `Last updated: ${new Date(vitalSigns[0].recordedAt).toLocaleString()}`
                            : 'No vital signs recorded yet'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => setActiveTab('specialty')}
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Assessment
                      </Button>
                      <Button 
                        onClick={() => setShowStandaloneVitals(true)}
                        className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        disabled={!user || (user.role !== 'nurse' && user.role !== 'doctor' && user.role !== 'admin')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Record New Vitals
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-8">
                  {/* Critical Vitals Dashboard */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Blood Pressure Monitor */}
                    <Card className="border-2 border-red-100 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-red-50/30">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg">
                              <Heart className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">Blood Pressure</h3>
                              <p className="text-sm text-gray-600">Systolic / Diastolic (mmHg)</p>
                            </div>
                          </div>
                          {vitalSigns && vitalSigns.length > 0 && (
                            <Badge className={`
                              ${(() => {
                                const systolic = vitalSigns[0]?.bloodPressureSystolic;
                                const diastolic = vitalSigns[0]?.bloodPressureDiastolic;
                                if (!systolic || !diastolic) return 'bg-gray-100 text-gray-600';
                                if (systolic >= 180 || diastolic >= 110) return 'bg-red-100 text-red-700 border-red-200';
                                if (systolic >= 160 || diastolic >= 100) return 'bg-red-100 text-red-600 border-red-200';
                                if (systolic >= 140 || diastolic >= 90) return 'bg-orange-100 text-orange-700 border-orange-200';
                                if (systolic >= 130 || diastolic >= 85) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                                if (systolic < 90 || diastolic < 60) return 'bg-blue-100 text-blue-700 border-blue-200';
                                return 'bg-green-100 text-green-700 border-green-200';
                              })()}
                            `}>
                              {(() => {
                                const systolic = vitalSigns[0]?.bloodPressureSystolic;
                                const diastolic = vitalSigns[0]?.bloodPressureDiastolic;
                                if (!systolic || !diastolic) return 'No Data';
                                if (systolic >= 180 || diastolic >= 110) return 'Grade 3 HTN';
                                if (systolic >= 160 || diastolic >= 100) return 'Grade 2 HTN';
                                if (systolic >= 140 || diastolic >= 90) return 'Grade 1 HTN';
                                if (systolic >= 130 || diastolic >= 85) return 'High Normal';
                                if (systolic < 90 || diastolic < 60) return 'Low';
                                return 'Optimal';
                              })()}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center space-y-4">
                          <div className="text-4xl font-bold text-gray-900">
                            {vitalSigns && vitalSigns.length > 0 && vitalSigns[0]?.bloodPressureSystolic && vitalSigns[0]?.bloodPressureDiastolic
                              ? `${vitalSigns[0].bloodPressureSystolic}/${vitalSigns[0].bloodPressureDiastolic}`
                              : '-- / --'
                            }
                          </div>
                          {vitalSigns && vitalSigns.length > 0 && vitalSigns[0]?.recordedAt && (
                            <p className="text-xs text-gray-500">
                              Recorded: {new Date(vitalSigns[0].recordedAt).toLocaleDateString()} at {new Date(vitalSigns[0].recordedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          )}
                          <div className="flex justify-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => setShowVitalsTrends(true)}
                            >
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Trends
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => setShowVitalsAlerts(true)}
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Alerts
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Heart Rate Monitor */}
                    <Card className="border-2 border-pink-100 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-pink-50/30">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl shadow-lg">
                              <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">Heart Rate</h3>
                              <p className="text-sm text-gray-600">Beats per minute (BPM)</p>
                            </div>
                          </div>
                          {vitalSigns && vitalSigns.length > 0 && vitalSigns[0]?.heartRate && (
                            <Badge className={`
                              ${(() => {
                                const hr = vitalSigns[0]?.heartRate;
                                if (!hr) return 'bg-gray-100 text-gray-600';
                                if (hr < 60) return 'bg-orange-100 text-orange-700 border-orange-200';
                                if (hr > 100) return 'bg-red-100 text-red-700 border-red-200';
                                return 'bg-green-100 text-green-700 border-green-200';
                              })()}
                            `}>
                              {(() => {
                                const hr = vitalSigns[0]?.heartRate;
                                if (!hr) return 'No Data';
                                if (hr < 60) return 'Bradycardia';
                                if (hr > 100) return 'Tachycardia';
                                return 'Normal';
                              })()}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center space-y-4">
                          <div className="text-4xl font-bold text-gray-900">
                            {vitalSigns && vitalSigns.length > 0 && vitalSigns[0]?.heartRate
                              ? vitalSigns[0].heartRate
                              : '--'
                            }
                            {vitalSigns && vitalSigns.length > 0 && vitalSigns[0]?.heartRate && (
                              <span className="text-lg text-gray-600 ml-2">bpm</span>
                            )}
                          </div>
                          {vitalSigns && vitalSigns.length > 0 && vitalSigns[0]?.recordedAt && (
                            <p className="text-xs text-gray-500">
                              Recorded: {new Date(vitalSigns[0].recordedAt).toLocaleDateString()} at {new Date(vitalSigns[0].recordedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          )}
                          <div className="flex justify-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => setShowVitalsTrends(true)}
                            >
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Trends
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => setShowVitalsAlerts(true)}
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Alerts
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Secondary Vitals Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {/* Temperature */}
                    <Card className="border border-orange-200 hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
                            <Thermometer className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold">Temperature</span>
                            <p className="text-xs text-gray-500 font-normal">°C</p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-center space-y-2">
                          <div className="text-2xl font-bold text-gray-900">
                            {vitalSigns && vitalSigns.length > 0 && vitalSigns[0]?.temperature
                              ? `${vitalSigns[0].temperature}°C`
                              : '--°C'
                            }
                          </div>
                          {vitalSigns && vitalSigns.length > 0 && vitalSigns[0]?.temperature && (
                            <Badge className={`text-xs ${(() => {
                              const temp = parseFloat(vitalSigns[0].temperature);
                              if (temp < 36.1) return 'bg-blue-100 text-blue-700 border-blue-200';
                              if (temp > 37.2) return 'bg-red-100 text-red-700 border-red-200';
                              return 'bg-green-100 text-green-700 border-green-200';
                            })()}`}>
                              {(() => {
                                const temp = parseFloat(vitalSigns[0].temperature);
                                if (temp < 36.1) return 'Hypothermia';
                                if (temp > 37.2) return 'Fever';
                                return 'Normal';
                              })()}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Oxygen Saturation */}
                    <Card className="border border-blue-200 hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                            <Droplets className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold">O2 Saturation</span>
                            <p className="text-xs text-gray-500 font-normal">%</p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-center space-y-2">
                          <div className="text-2xl font-bold text-gray-900">
                            {vitalSigns && vitalSigns.length > 0 && vitalSigns[0]?.oxygenSaturation
                              ? `${vitalSigns[0].oxygenSaturation}%`
                              : '--%'
                            }
                          </div>
                          {vitalSigns && vitalSigns.length > 0 && vitalSigns[0]?.oxygenSaturation && (
                            <Badge className={`text-xs ${(() => {
                              const o2 = vitalSigns[0].oxygenSaturation;
                              if (o2 < 90) return 'bg-red-100 text-red-700 border-red-200';
                              if (o2 < 95) return 'bg-orange-100 text-orange-700 border-orange-200';
                              return 'bg-green-100 text-green-700 border-green-200';
                            })()}`}>
                              {(() => {
                                const o2 = vitalSigns[0].oxygenSaturation;
                                if (o2 < 90) return 'Critical';
                                if (o2 < 95) return 'Low';
                                return 'Normal';
                              })()}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Respiratory Rate */}
                    <Card className="border border-cyan-200 hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg">
                            <Wind className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold">Respiratory</span>
                            <p className="text-xs text-gray-500 font-normal">/min</p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {vitalSigns && vitalSigns.length > 0 && vitalSigns[0]?.respiratoryRate
                              ? vitalSigns[0].respiratoryRate
                              : '--'
                            }
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* BMI Indicator */}
                    <Card className="border border-purple-200 hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
                            <Gauge className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold">BMI</span>
                            <p className="text-xs text-gray-500 font-normal">kg/m²</p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-center space-y-1">
                          <div className="text-2xl font-bold text-gray-900">
                            {vitalSigns && vitalSigns.length > 0 && vitalSigns[0]?.weight && vitalSigns[0]?.height
                              ? (vitalSigns[0].weight / Math.pow(vitalSigns[0].height / 100, 2)).toFixed(1)
                              : '--'
                            }
                          </div>
                          {vitalSigns && vitalSigns.length > 0 && vitalSigns[0]?.weight && vitalSigns[0]?.height && (
                            <div className="text-xs text-gray-600">
                              {vitalSigns[0].weight}kg / {vitalSigns[0].height}cm
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions Panel */}
                  <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">Vital Signs Management</h3>
                          <p className="text-sm text-gray-600">Record new measurements or view historical trends</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="outline" size="sm" onClick={() => setActiveTab('visits')}>
                            <History className="w-4 h-4 mr-2" />
                            View History
                          </Button>
                          <Button 
                            onClick={() => setShowStandaloneVitals(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Record Vitals
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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

      {/* Vital Signs Trends Dialog */}
      {showVitalsTrends && patient && (
        <VitalSignsTrends
          isOpen={showVitalsTrends}
          onClose={() => setShowVitalsTrends(false)}
          patientId={patientId!}
          patientName={`${patient.firstName} ${patient.lastName}`}
        />
      )}

      {/* Vital Signs Alerts Dialog */}
      {showVitalsAlerts && patient && (
        <VitalSignsAlerts
          isOpen={showVitalsAlerts}
          onClose={() => setShowVitalsAlerts(false)}
          patientId={patientId!}
          patientName={`${patient.firstName} ${patient.lastName}`}
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
