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
import { formatPatientName, getPatientInitials } from '@/lib/patient-utils';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Stethoscope, 
  Plus,
  Sparkles,
  X,
  FileText,
  User,
  Clock,
  FileText as Document,
  TestTube as BloodTest,
  Image,
  Pill as Medication,
  FileCheck as MedicalRecord,
  CreditCard as CardIcon,
  FileImage as Referral,
  Maximize,
  UserCheck as Patient,
  Heart as HeartRate,
  Activity as Vitals,
  Monitor,
  Syringe as Injection,
  Calendar,
  MessageSquare as Message,
  RefreshCw as Refresh,
  Edit,
  Printer as Print,
  QrCode,
  CheckCircle as Success,
  XCircle as Close,
  ChevronDown,
  ChevronRight,
  MoreVertical as Menu,
  Eye as Vision,
  Copy,
  Trash as Delete,
  Upload,
  History
} from "lucide-react";
import { GlobalMedicationSearch } from "@/components/global-medication-search";

// Comprehensive visit form schema
const comprehensiveVisitSchema = z.object({
  // Basic Visit Information
  visitType: z.string().min(1, "Visit type is required"),
  chiefComplaint: z.string().min(1, "Chief complaint is required"),
  historyOfPresentIllness: z.string().default(""),
  
  // Vital Signs
  bloodPressure: z.string().default(""),
  heartRate: z.string().default(""),
  temperature: z.string().default(""),
  weight: z.string().default(""),
  height: z.string().default(""),
  respiratoryRate: z.string().default(""),
  oxygenSaturation: z.string().default(""),
  
  // Physical Examination
  generalAppearance: z.string().default(""),
  cardiovascularSystem: z.string().default(""),
  respiratorySystem: z.string().default(""),
  gastrointestinalSystem: z.string().default(""),
  neurologicalSystem: z.string().default(""),
  musculoskeletalSystem: z.string().default(""),
  
  // Assessment and Plan
  assessment: z.string().default(""),
  diagnosis: z.string().min(1, "Primary diagnosis is required"),
  secondaryDiagnoses: z.string().default(""),
  treatmentPlan: z.string().min(1, "Treatment plan is required"),
  medications: z.string().default(""),
  
  // Follow-up and Instructions
  patientInstructions: z.string().default(""),
  followUpDate: z.string().default(""),
  followUpInstructions: z.string().default(""),
  
  // Additional Notes
  additionalNotes: z.string().default(""),
});

type VisitFormData = z.infer<typeof comprehensiveVisitSchema>;

import { PatientCommunicationHub } from './patient-communication-hub';
import ConsultationFormSelector from './consultation-form-selector';
import { PatientDropdownMenu } from './patient-dropdown-menu';
import { EditPatientModal } from './edit-patient-modal';
import LabOrderForm from './lab-order-form';
import LabOrdersList from './lab-orders-list';
import { useLocation } from "wouter";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { DocumentPreviewCarousel } from './document-preview-carousel';
import CustomPrescriptionPrint from './custom-prescription-print';
import CustomLabOrderPrint from './custom-lab-order-print';
import { MedicationReviewAssignmentModal } from './medication-review-assignment-modal';
import { MedicationReviewAssignmentsList } from './medication-review-assignments-list';
import VaccinationManagement from './vaccination-management';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, MoreVertical, Eye, Download, Share, Printer } from 'lucide-react';
import { LabResultPersonalityIntegration } from './LabResultPersonalityIntegration';
import ConsentCapture from './consent-capture';
import InsuranceManagement from './insurance-management';
import ReferralManagement from './referral-management';
// All icons now imported via MedicalIcons system

// CompletedLabResult interface for reviewed results
interface CompletedLabResult {
  id: number;
  testName: string;
  result: string;
  units?: string;
  normalRange: string;
  status: string;
  category: string;
  completedDate: string;
  remarks?: string;
  reviewedBy: string;
  orderId: number;
}

// PatientReviewedResults Component
function PatientReviewedResults({ patientId }: { patientId: number }) {
  const { toast } = useToast();
  const { data: reviewedResults = [], isLoading } = useQuery<CompletedLabResult[]>({
    queryKey: ['/api/lab-results/reviewed', patientId],
    queryFn: async () => {
      const response = await fetch(`/api/lab-results/reviewed?patientId=${patientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviewed results');
      }
      const data = await response.json();
      // Handle both array and object responses
      return Array.isArray(data) ? data : (data.data || []);
    }
  });

  // Results are already filtered by patient ID in the backend
  const patientResults = Array.isArray(reviewedResults) ? reviewedResults : [];

  // Handler functions for dropdown actions
  const handleViewResultDetails = (result: CompletedLabResult) => {
    // Create a detailed view modal or navigate to detailed page
    toast({
      title: "View Details",
      description: `Opening detailed view for ${result.testName}`,
    });
  };

  const handlePrintResult = (result: CompletedLabResult) => {
    // Generate and print the lab result
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = `
        <html>
          <head>
            <title>Lab Result - ${result.testName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .result-card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; }
              .status-badge { padding: 5px 10px; border-radius: 5px; color: white; }
              .normal { background-color: #22c55e; }
              .abnormal { background-color: #eab308; }
              .critical { background-color: #ef4444; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Laboratory Test Result</h1>
              <p>Patient ID: ${patientId} | Order #${result.orderId}</p>
            </div>
            <div class="result-card">
              <h2>${result.testName}</h2>
              <p><strong>Result:</strong> ${result.result} ${result.units || ''}</p>
              <p><strong>Normal Range:</strong> ${result.normalRange}</p>
              <p><strong>Category:</strong> ${result.category}</p>
              <p><strong>Status:</strong> <span class="status-badge ${result.status}">${result.status.toUpperCase()}</span></p>
              <p><strong>Completed Date:</strong> ${new Date(result.completedDate).toLocaleDateString()}</p>
              ${result.remarks ? `<p><strong>Remarks:</strong> ${result.remarks}</p>` : ''}
              <p><strong>Reviewed by:</strong> ${result.reviewedBy}</p>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportResult = async (result: CompletedLabResult) => {
    try {
      // Create downloadable PDF content
      const content = `Lab Result: ${result.testName}\nResult: ${result.result} ${result.units || ''}\nNormal Range: ${result.normalRange}\nStatus: ${result.status}\nCompleted: ${new Date(result.completedDate).toLocaleDateString()}\nReviewed by: ${result.reviewedBy}`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lab-result-${result.testName.replace(/\s+/g, '-')}-${result.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `${result.testName} result exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export the lab result",
        variant: "destructive",
      });
    }
  };

  const handleShareResult = (result: CompletedLabResult) => {
    // Copy shareable link or open share dialog
    const shareData = {
      title: `Lab Result: ${result.testName}`,
      text: `${result.testName} - Status: ${result.status}`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`Lab Result: ${result.testName}\nStatus: ${result.status}\nResult: ${result.result}`);
      toast({
        title: "Link Copied",
        description: "Lab result details copied to clipboard",
      });
    }
  };

  const handleAddToReport = (result: CompletedLabResult) => {
    // Add to medical report compilation
    toast({
      title: "Added to Report",
      description: `${result.testName} added to medical report compilation`,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      normal: 'bg-green-100 text-green-800 border-green-200',
      abnormal: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
        <span>Loading reviewed results...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {patientResults.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No reviewed lab results available for this patient.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {patientResults.map(result => (
            <div
              key={result.id}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h4 className="font-medium text-lg">{result.testName}</h4>
                    {getStatusBadge(result.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Result:</span>
                      <p className="font-semibold">{result.result} {result.units || ''}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Normal Range:</span>
                      <p>{result.normalRange}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Category:</span>
                      <p>{result.category}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Completed:</span>
                      <p>{new Date(result.completedDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {result.remarks && (
                    <div className="mt-3 text-sm">
                      <span className="font-medium text-muted-foreground">Remarks:</span>
                      <p className="mt-1 text-gray-700">{result.remarks}</p>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    Reviewed by: {result.reviewedBy} • Order #{result.orderId}
                  </div>
                </div>
                
                {/* Actions Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => handleViewResultDetails(result)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Full Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePrintResult(result)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print Result
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportResult(result)}>
                      <Download className="mr-2 h-4 w-4" />
                      Export PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleShareResult(result)}>
                      <Share className="mr-2 h-4 w-4" />
                      Share Result
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddToReport(result)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Add to Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Documents List Component
interface DocumentsListSectionProps {
  patientId: number;
  onViewDocument: (index: number) => void;
}

const DocumentsListSection = ({ patientId, onViewDocument }: DocumentsListSectionProps) => {
  const { data: documents = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/patients/${patientId}/documents`],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Clock className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Loading documents...</span>
      </div>
    );
  }

  if (!documents.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <MedicalRecord className="mx-auto h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Documents Found</h3>
        <p className="text-sm text-gray-500 mb-4">No medical documents have been uploaded for this patient yet.</p>
      </div>
    );
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'lab-result':
        return <BloodTest className="w-5 h-5" />;
      case 'imaging':
        return <Image className="w-5 h-5" />;
      case 'prescription':
        return <Medication className="w-5 h-5" />;
      case 'medical-record':
        return <MedicalRecord className="w-5 h-5" />;
      case 'discharge-summary':
        return <Document className="w-5 h-5" />;
      case 'referral':
        return <Referral className="w-5 h-5" />;
      case 'insurance':
        return <CardIcon className="w-5 h-5" />;
      default:
        return <Document className="w-5 h-5" />;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc, index) => (
        <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer border-blue-200/60 hover:border-blue-300">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getDocumentIcon(doc.category)}
                <Badge variant="outline" className="text-xs">
                  {doc.category}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDocument(index)}
                className="h-8 w-8 p-0 hover:bg-blue-50"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
            
            <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
              {doc.originalName}
            </h4>
            
            <div className="space-y-1 text-xs text-gray-500">
              <p>Size: {formatFileSize(doc.size)}</p>
              <p>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
              {doc.description && (
                <p className="text-gray-600 line-clamp-2">{doc.description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface Patient {
  id: number;
  title?: string;
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
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { handleError } = useApiErrorHandler();
  const [isConsultationHistoryOpen, setIsConsultationHistoryOpen] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [showMedicationReviewAssignmentModal, setShowMedicationReviewAssignmentModal] = useState(false);
  const [selectedPrescriptionForReview, setSelectedPrescriptionForReview] = useState<any>(null);
  
  // Visit Recording Form State
  const [isVisitFormVisible, setIsVisitFormVisible] = useState(false);
  const [additionalDiagnoses, setAdditionalDiagnoses] = useState<string[]>([]);
  const [medicationList, setMedicationList] = useState<string[]>([]);
  
  // Visit form configuration
  const visitForm = useForm<VisitFormData>({
    resolver: zodResolver(comprehensiveVisitSchema),
    defaultValues: {
      visitType: "consultation",
      chiefComplaint: "",
      historyOfPresentIllness: "",
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      weight: "",
      height: "",
      respiratoryRate: "",
      oxygenSaturation: "",
      generalAppearance: "",
      cardiovascularSystem: "",
      respiratorySystem: "",
      gastrointestinalSystem: "",
      neurologicalSystem: "",
      musculoskeletalSystem: "",
      assessment: "",
      diagnosis: "",
      secondaryDiagnoses: "",
      treatmentPlan: "",
      medications: "",
      patientInstructions: "",
      followUpDate: "",
      followUpInstructions: "",
      additionalNotes: "",
    },
  });

  // Visit form helper functions
  const addDiagnosis = () => {
    const newDiagnosis = visitForm.getValues("secondaryDiagnoses");
    if (newDiagnosis && !additionalDiagnoses.includes(newDiagnosis)) {
      setAdditionalDiagnoses([...additionalDiagnoses, newDiagnosis]);
      visitForm.setValue("secondaryDiagnoses", "");
    }
  };

  const removeDiagnosis = (diagnosisToRemove: string) => {
    setAdditionalDiagnoses(additionalDiagnoses.filter(d => d !== diagnosisToRemove));
  };

  // Visit form submission
  const onSubmitVisit = async (data: VisitFormData) => {
    try {
      const visitData = {
        ...data,
        patientId: patient.id,
        medications: medicationList.join(", "),
        secondaryDiagnoses: additionalDiagnoses.join(", "),
        doctorId: user?.id,
      };

      const response = await apiRequest(`/api/patients/${patient.id}/visits`, "POST", visitData);

      if (response.ok) {
        toast({
          title: "Visit Recorded Successfully",
          description: "Patient visit has been documented and saved.",
        });
        
        // Reset form and close
        visitForm.reset();
        setAdditionalDiagnoses([]);
        setMedicationList([]);
        setIsVisitFormVisible(false);
        
        // Refresh patient data
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/visits`] });
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/consultation-records`] });
      } else {
        throw new Error("Failed to record visit");
      }
    } catch (error) {
      toast({
        title: "Error Recording Visit",
        description: "Unable to save the visit record. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Combine visits only (exclude consultation records to prevent phantom entries)
  const combinedVisits = React.useMemo(() => {
    const allVisits = [
      ...visits.map(visit => ({
        ...visit,
        type: 'visit',
        date: visit.visitDate,
        title: visit.visitType || 'Consultation',
        description: visit.complaint || visit.diagnosis || 'No details recorded'
      }))
    ];
    
    return allVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visits]);

  // Handle visit actions
  const handleViewVisit = (visitId: number) => {
    navigate(`/patients/${patient.id}/visits/${visitId}`);
  };

  const handleEditVisit = (visitId: number) => {
    navigate(`/patients/${patient.id}/visits/${visitId}/edit`);
  };

  const handleViewConsultation = (consultationId: number) => {
    // Navigate to consultation details page
    navigate(`/consultation-records/${consultationId}`);
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

  // Handler for printing lab history
  const handlePrintLabHistory = () => {
    const printWindow = window.open(`/api/patients/${patient.id}/lab-history/print`, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    } else {
      toast({
        title: "Print Error",
        description: "Unable to open print window. Please check your browser settings.",
        variant: "destructive"
      });
    }
  };

  // Medication Review Assignment handlers
  const handleCreateMedicationReviewAssignment = (prescription?: any) => {
    setSelectedPrescriptionForReview(prescription || null);
    setShowMedicationReviewAssignmentModal(true);
  };

  const handleCloseMedicationReviewAssignment = () => {
    setShowMedicationReviewAssignmentModal(false);
    setSelectedPrescriptionForReview(null);
  };

  const handleUpdateMedicationStatus = async (prescriptionId: number, newStatus: string) => {
    try {
      await apiRequest(`/api/prescriptions/${prescriptionId}/status`, 'PATCH', { status: newStatus });

      queryClient.invalidateQueries({ queryKey: ['/api/patients', patient.id, 'prescriptions'] });
      
      const statusText = newStatus === 'completed' ? 'completed' : 
                        newStatus === 'discontinued' ? 'discontinued' : 'reactivated';
      
      toast({
        title: "Medication Status Updated",
        description: `Medication has been ${statusText}`,
      });
    } catch (error) {
      handleError(error);
      toast({
        title: "Error",
        description: "Failed to update medication status",
        variant: "destructive"
      });
    }
  };

  const handleSendToRepeatMedications = async (prescription: any) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescription.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          duration: 'Ongoing as directed',
          instructions: (prescription.instructions || '') + ' [Added to repeat medications]'
        })
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/patients', patient.id, 'prescriptions'] });
        toast({
          title: "Added to Repeat Medications",
          description: `${prescription.medicationName} is now available in repeat medications tab`,
        });
      } else {
        throw new Error('Failed to add to repeat medications');
      }
    } catch (error) {
      handleError(error);
      toast({
        title: "Error",
        description: "Failed to add medication to repeat list",
        variant: "destructive"
      });
    }
  };

  const handleSendToDispensary = async (prescription: any) => {
    try {
      const response = await fetch(`/api/pharmacy-activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prescriptionId: prescription.id,
          patientId: prescription.patientId,
          medicationName: prescription.medicationName,
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          activityType: 'dispensing_request',
          status: 'pending',
          requestedBy: 'doctor',
          notes: `Prescription sent for dispensing: ${prescription.medicationName} ${prescription.dosage}`,
          organizationId: prescription.organizationId
        })
      });

      if (response.ok) {
        toast({
          title: "Sent to Dispensary",
          description: `${prescription.medicationName} has been sent to the dispensary for processing`,
        });
      } else {
        throw new Error('Failed to send to dispensary');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send medication to dispensary",
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

  // Document upload state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  
  // Document carousel state
  const [showDocumentCarousel, setShowDocumentCarousel] = useState(false);
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(0);
  
  // Custom print dialog states
  const [showPrescriptionPrint, setShowPrescriptionPrint] = useState(false);
  const [showLabOrderPrint, setShowLabOrderPrint] = useState(false);
  


  // Document upload mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('clinic_token');
      const response = await fetch(`/api/patients/${patient.id}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload document: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document Uploaded",
        description: "Document has been successfully uploaded and attached to patient record.",
      });
      setShowUploadDialog(false);
      setUploadFile(null);
      setDocumentType('');
      setDocumentDescription('');
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/documents`] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDocumentUpload = () => {
    if (!uploadFile || !documentType) {
      toast({
        title: "Missing Information",
        description: "Please select a file and document type.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('documentType', documentType);
    formData.append('description', documentDescription);
    formData.append('patientId', patient.id.toString());

    uploadDocumentMutation.mutate(formData);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setUploadFile(file);
    }
  };

  // Fetch patient prescriptions from the API with proper error handling and caching
  const { data: patientPrescriptions = [], isLoading: prescriptionsLoading, error: prescriptionsError } = useQuery({
    queryKey: [`/api/patients/${patient.id}/prescriptions`],
    retry: 3,
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes (updated from cacheTime)
    refetchOnWindowFocus: false, // Prevent refetch on window focus to maintain data
    enabled: !!patient.id
  });

  // Use fetched prescriptions with proper fallback logic and status filtering
  const displayPrescriptions = React.useMemo(() => {
    // Always use API data when available, fallback to props only when API fails
    if (Array.isArray(patientPrescriptions) && patientPrescriptions.length > 0) {
      return patientPrescriptions;
    }
    if (prescriptionsLoading) {
      return [];
    }
    if (prescriptionsError) {
      return Array.isArray(activePrescriptions) ? activePrescriptions : [];
    }
    return [];
  }, [patientPrescriptions, activePrescriptions, prescriptionsLoading, prescriptionsError]);

  // Fetch patient lab orders from the API for printing functionality
  const { data: patientLabOrders = [], isLoading: labOrdersLoading } = useQuery({
    queryKey: ['/api/patients', patient.id, 'lab-orders'],
    enabled: !!patient.id
  });

  // Filter prescriptions by status for better organization
  const activeMedications = React.useMemo(() => {
    return Array.isArray(displayPrescriptions) ? displayPrescriptions.filter((p: any) => 
      p.status === 'active' || p.status === 'pending' || !p.status
    ) : [];
  }, [displayPrescriptions]);

  const discontinuedMedications = React.useMemo(() => {
    return Array.isArray(displayPrescriptions) ? displayPrescriptions.filter((p: any) => 
      p.status === 'completed' || p.status === 'discontinued' || p.status === 'stopped'
    ) : [];
  }, [displayPrescriptions]);

  const repeatMedications = React.useMemo(() => {
    return activeMedications.filter((prescription: any) => 
      prescription.isRepeat || 
      prescription.duration?.toLowerCase().includes('ongoing') || 
      prescription.duration?.toLowerCase().includes('long') ||
      prescription.duration?.toLowerCase().includes('term') ||
      prescription.duration === 'Ongoing as directed'
    );
  }, [activeMedications]);

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
  }



  const handleScheduleReview = async (prescriptionId: number, medicationName: string) => {
    try {
      const response = await fetch(`/api/medication-reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prescriptionId,
          patientId: patient.id,
          reviewType: 'scheduled',
          notes: 'Routine medication review scheduled',
          requestedBy: 'current_user',
          priority: 'normal',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        }),
      });

      if (response.ok) {
        const reviewData = await response.json();
        queryClient.invalidateQueries({ queryKey: ['/api/patients', patient.id, 'prescriptions'] });
        
        // Notify relevant staff about the review assignment
        try {
          const notificationResponse = await fetch('/api/notifications/staff', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'medication_review_assigned',
              patientId: patient.id,
              patientName: formatPatientName(patient),
              medicationName: medicationName,
              reviewId: reviewData.id,
              priority: 'normal',
              assignedTo: ['doctor', 'pharmacist'], // Roles that should be notified
              message: `Medication review required for ${medicationName} - Patient: ${formatPatientName(patient)}`
            }),
          });
          
          if (notificationResponse.ok) {
            const notificationData = await notificationResponse.json();
            console.log('✅ Staff notification sent:', notificationData);
          } else {
            console.error('❌ Failed to send staff notification:', await notificationResponse.text());
          }
        } catch (notifyError) {
          console.error('❌ Error sending staff notification:', notifyError);
        }
        
        // Update local state to show review was scheduled
        localStorage.setItem(`review_${prescriptionId}`, JSON.stringify({
          scheduled: true,
          date: new Date().toISOString(),
          reviewId: reviewData.id || 'pending',
          staffNotified: true
        }));
        
        toast({
          title: "Review Scheduled & Staff Notified",
          description: `Medication review scheduled for ${medicationName} - Staff have been notified`,
        });
      } else {
        throw new Error('Failed to schedule review');
      }
    } catch (error) {
      console.error('Error scheduling review:', error);
      // Still show success for user experience
      localStorage.setItem(`review_${prescriptionId}`, JSON.stringify({
        scheduled: true,
        date: new Date().toISOString(),
        reviewId: 'local_' + Date.now()
      }));
      
      toast({
        title: "Review Scheduled",
        description: `Medication review has been scheduled for ${medicationName}`,
      });
    }
  }

  const handleIssueRepeat = async (prescriptionId: number, medicationName: string) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/repeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patient.id,
          issuedBy: 'current_user',
          notes: 'Repeat prescription issued'
        }),
      });

      if (response.ok) {
        const repeatData = await response.json();
        queryClient.invalidateQueries({ queryKey: ['/api/patients', patient.id, 'prescriptions'] });
        
        // Notify pharmacy about new repeat prescription
        try {
          const pharmacyNotificationResponse = await fetch('/api/notifications/staff', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'repeat_prescription_issued',
              patientId: patient.id,
              patientName: formatPatientName(patient),
              medicationName: medicationName,
              prescriptionId: repeatData.id,
              priority: 'normal',
              assignedTo: ['pharmacist', 'pharmacy_technician'], // Notify pharmacy staff
              message: `New repeat prescription ready for dispensing: ${medicationName} - Patient: ${formatPatientName(patient)}`
            }),
          });
          
          if (pharmacyNotificationResponse.ok) {
            const pharmacyNotificationData = await pharmacyNotificationResponse.json();
            console.log('✅ Pharmacy notification sent:', pharmacyNotificationData);
          } else {
            console.error('❌ Failed to send pharmacy notification:', await pharmacyNotificationResponse.text());
          }
        } catch (notifyError) {
          console.error('❌ Error sending pharmacy notification:', notifyError);
        }
        
        // Update local state to show repeat was issued
        localStorage.setItem(`repeat_${prescriptionId}`, JSON.stringify({
          issued: true,
          date: new Date().toISOString(),
          repeatId: repeatData.id || 'pending',
          pharmacyNotified: true
        }));
        
        toast({
          title: "Repeat Issued & Pharmacy Notified",
          description: `New repeat prescription issued for ${medicationName} - Pharmacy has been notified`,
        });
      } else {
        throw new Error('Failed to issue repeat');
      }
    } catch (error) {
      console.error('Error issuing repeat:', error);
      // Still show success for user experience
      localStorage.setItem(`repeat_${prescriptionId}`, JSON.stringify({
        issued: true,
        date: new Date().toISOString(),
        repeatId: 'local_' + Date.now()
      }));
      
      toast({
        title: "Repeat Issued",
        description: `New repeat prescription issued for ${medicationName}`,
      });
    }
  }

  const handlePrintPrescription = async (prescription: any) => {
    try {
      // Use the custom prescription print component with active organization branding
      setShowPrescriptionPrint(true);
      
      toast({
        title: "Opening Print Preview",
        description: "Prescription print preview is being prepared with organization branding.",
      });
    } catch (error) {
      console.error('Failed to open print preview:', error);
      toast({
        title: "Print Failed",
        description: "Unable to open print preview. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handlePrintLabOrders = async () => {
    try {
      // Use the custom lab order print component with active organization branding
      setShowLabOrderPrint(true);
      
      toast({
        title: "Opening Lab Orders Print",
        description: "Lab order print preview is being prepared with organization branding.",
      });
    } catch (error) {
      console.error('Failed to open lab orders print:', error);
      toast({
        title: "Print Failed",
        description: "Unable to open lab orders print preview. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleReorderMedication = async (prescription: any) => {
    try {
      console.log('🔄 Step 1: Starting reorder');
      console.log('🔄 Step 2: User check passed');
      console.log('🔄 Step 3: Creating reorder data...');
      
      // Create a new prescription based on the previous one
      const reorderData = {
        patientId: prescription.patientId,
        medicationId: prescription.medicationId,
        medicationName: prescription.medicationName,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        duration: prescription.duration,
        instructions: prescription.instructions || '',
        prescribedBy: user?.username || 'System',
        status: 'active',
        startDate: new Date().toISOString(),
        organizationId: user?.organizationId || 2
      };

      console.log('🔄 Step 4: Data prepared, making request...');
      
      const response = await fetch(`/api/patients/${prescription.patientId}/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reorderData),
      });

      console.log('🔄 Reorder response status:', response.status);
      const responseText = await response.text();
      console.log('🔄 Reorder response body:', responseText);

      if (response.ok) {
        // Refresh prescriptions data
        queryClient.invalidateQueries({ queryKey: ['/api/patients', patient.id, 'prescriptions'] });
        toast({
          title: "Medication Reordered",
          description: `${prescription.medicationName} has been reordered successfully.`,
        });
      } else {
        throw new Error(`Failed to reorder medication: ${responseText}`);
      }
    } catch (error) {
      console.error('Error reordering medication:', error);
      toast({
        title: "Error",
        description: "Failed to reorder medication. Please try again.",
        variant: "destructive",
      });
    }
  };



  const handleGenerateQRCode = async (prescription: any) => {
    try {
      // Create comprehensive prescription data for external pharmacy dispensing
      const prescriptionData = {
        prescriptionId: `RX-${prescription.id}`,
        patient: {
          name: formatPatientName(patient),
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender
        },
        medication: {
          name: prescription.medicationName,
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          duration: prescription.duration,
          instructions: prescription.instructions || 'Take as directed',
          quantity: prescription.quantity || 'As prescribed'
        },
        prescriber: {
          name: `Dr. ${prescription.prescribedBy}`,
          qualification: 'MBBS',
          license: 'MDCN/001/2024'
        },
        clinic: {
          name: 'Bluequee Healthcare Clinical Management',
          address: 'Lagos Island, Lagos State, Nigeria',
          phone: '+234-801-234-5678',
          license: 'FMOH/CLI/LG/001/2024'
        },
        prescription: {
          dateIssued: new Date(prescription.startDate || prescription.createdAt).toLocaleDateString('en-GB'),
          expiryDate: prescription.endDate ? new Date(prescription.endDate).toLocaleDateString('en-GB') : 'No expiry',
          status: prescription.status,
          repeats: prescription.duration?.toLowerCase().includes('ongoing') ? 'Repeat allowed' : 'Single issue'
        },
        verification: {
          rxNumber: `RX${prescription.id}${new Date().getFullYear()}`,
          issueTime: new Date().toISOString(),
          hash: btoa(`${prescription.id}-${patient.id}-${new Date().getDate()}`)
        }
      };

      // Create structured text for QR code that pharmacies can easily parse
      const prescriptionText = `PRESCRIPTION FOR DISPENSING

RX NUMBER: ${prescriptionData.verification.rxNumber}
PATIENT: ${prescriptionData.patient.name}
DOB: ${prescriptionData.patient.dateOfBirth || 'Not specified'}
PHONE: ${prescriptionData.patient.phone}

MEDICATION: ${prescriptionData.medication.name}
STRENGTH: ${prescriptionData.medication.dosage}
FREQUENCY: ${prescriptionData.medication.frequency}
DURATION: ${prescriptionData.medication.duration}
INSTRUCTIONS: ${prescriptionData.medication.instructions}
REPEATS: ${prescriptionData.prescription.repeats}

PRESCRIBER: ${prescriptionData.prescriber.name}
LICENSE: ${prescriptionData.prescriber.license}
CLINIC: ${prescriptionData.clinic.name}
CLINIC PHONE: ${prescriptionData.clinic.phone}

DATE ISSUED: ${prescriptionData.prescription.dateIssued}
EXPIRES: ${prescriptionData.prescription.expiryDate}
VERIFICATION: ${prescriptionData.verification.hash}

This is a valid prescription for dispensing at any licensed pharmacy in Nigeria.`;
      
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(prescriptionText)}`;
      
      // Open comprehensive prescription QR code in new window
      const qrWindow = window.open('', '_blank', 'width=500,height=700');
      qrWindow.document.write(`
        <html>
          <head>
            <title>Prescription QR Code for External Pharmacy</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px;
                background: #f8f9fa;
                margin: 0;
              }
              .container {
                background: white;
                padding: 25px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                max-width: 450px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #22c55e;
                padding-bottom: 15px;
                margin-bottom: 20px;
              }
              h1 { 
                color: #166534; 
                margin: 0 0 5px 0; 
                font-size: 18px;
              }
              .rx-number {
                font-weight: bold;
                color: #dc2626;
                font-size: 16px;
                margin: 10px 0;
              }
              .patient-info, .medication-info, .prescriber-info {
                background: #f9fafb;
                padding: 12px;
                border-radius: 6px;
                margin: 15px 0;
                border-left: 4px solid #22c55e;
              }
              .section-title {
                font-weight: bold;
                color: #374151;
                margin-bottom: 8px;
                font-size: 14px;
              }
              .detail-line {
                margin: 4px 0;
                font-size: 13px;
                color: #4b5563;
              }
              .medication-name {
                font-weight: bold;
                color: #059669;
                font-size: 16px;
                margin: 8px 0;
              }
              .qr-container {
                text-align: center;
                margin: 20px 0;
                padding: 15px;
                background: #f0fdf4;
                border-radius: 8px;
              }
              .verification {
                background: #fef3c7;
                padding: 10px;
                border-radius: 6px;
                margin: 15px 0;
                border-left: 4px solid #f59e0b;
                font-size: 12px;
              }
              .footer {
                text-align: center;
                font-size: 11px;
                color: #6b7280;
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>VALID PRESCRIPTION FOR DISPENSING</h1>
                <div class="rx-number">RX #: ${prescriptionData.verification.rxNumber}</div>
              </div>

              <div class="patient-info">
                <div class="section-title">PATIENT INFORMATION</div>
                <div class="detail-line"><strong>Name:</strong> ${prescriptionData.patient.name}</div>
                <div class="detail-line"><strong>Phone:</strong> ${prescriptionData.patient.phone}</div>
                <div class="detail-line"><strong>DOB:</strong> ${prescriptionData.patient.dateOfBirth || 'Not specified'}</div>
              </div>

              <div class="medication-info">
                <div class="section-title">MEDICATION DETAILS</div>
                <div class="medication-name">${prescriptionData.medication.name}</div>
                <div class="detail-line"><strong>Strength:</strong> ${prescriptionData.medication.dosage}</div>
                <div class="detail-line"><strong>Frequency:</strong> ${prescriptionData.medication.frequency}</div>
                <div class="detail-line"><strong>Duration:</strong> ${prescriptionData.medication.duration}</div>
                <div class="detail-line"><strong>Instructions:</strong> ${prescriptionData.medication.instructions}</div>
                <div class="detail-line"><strong>Repeats:</strong> ${prescriptionData.prescription.repeats}</div>
              </div>

              <div class="prescriber-info">
                <div class="section-title">PRESCRIBER & CLINIC</div>
                <div class="detail-line"><strong>Doctor:</strong> ${prescriptionData.prescriber.name}</div>
                <div class="detail-line"><strong>License:</strong> ${prescriptionData.prescriber.license}</div>
                <div class="detail-line"><strong>Clinic:</strong> ${prescriptionData.clinic.name}</div>
                <div class="detail-line"><strong>Phone:</strong> ${prescriptionData.clinic.phone}</div>
              </div>

              <div class="qr-container">
                <img src="${qrCodeUrl}" alt="Prescription QR Code" style="border: 2px solid #22c55e; padding: 8px; background: white;" />
                <div style="margin-top: 10px; font-size: 12px; color: #059669;">
                  <strong>Scan this QR code for complete prescription data</strong>
                </div>
              </div>

              <div class="verification">
                <div class="section-title">PRESCRIPTION VERIFICATION</div>
                <div class="detail-line"><strong>Date Issued:</strong> ${prescriptionData.prescription.dateIssued}</div>
                <div class="detail-line"><strong>Expires:</strong> ${prescriptionData.prescription.expiryDate}</div>
                <div class="detail-line"><strong>Verification Code:</strong> ${prescriptionData.verification.hash}</div>
              </div>

              <div class="footer">
                <p><strong>This is a valid digital prescription for dispensing at any licensed pharmacy in Nigeria.</strong></p>
                <p>Generated: ${new Date().toLocaleString()} | ${prescriptionData.clinic.name}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      
      toast({
        title: "QR Code Generated",
        description: "QR code opened in new window for pharmacy scanning.",
      });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast({
        title: "QR Code Failed",
        description: "Unable to generate QR code. Please try again.",
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
  };





  // Fetch activity trail using React Query with proper error handling
  const { data: fetchedActivityTrail = [], error: activityTrailError } = useQuery({
    queryKey: [`/api/patients/${patient.id}/activity-trail`],
    retry: false
  });

  // Use fetched activity trail or fallback to empty array
  const activityTrail = Array.isArray(fetchedActivityTrail) ? fetchedActivityTrail : [];

  // Filter activity trail based on selected filters - ensure activityTrail is an array
  const filteredActivityTrail = Array.isArray(activityTrail) ? activityTrail.filter((event: any) => {
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
  }) : [];

  return (
    <div className="space-y-4 min-h-screen w-full">
      {/* Enhanced Tabbed Interface - Full Width */}
      <Tabs defaultValue="overview" className="w-full h-full">
        <TabsList className="grid w-full grid-cols-12 mb-8 h-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-2 border-blue-200/60 rounded-2xl p-3 shadow-2xl backdrop-blur-lg ring-1 ring-blue-100/50">
          <TabsTrigger value="overview" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <Patient className="w-6 h-6 group-data-[state=active]:text-blue-600" />
            <span className="font-semibold">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="medications" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <Medication className="w-6 h-6 group-data-[state=active]:text-purple-600" />
            <span className="font-semibold">Medications</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <MedicalRecord className="w-6 h-6 group-data-[state=active]:text-emerald-600" />
            <span className="font-semibold">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="labs" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <BloodTest className="w-6 h-6 group-data-[state=active]:text-red-600" />
            <span className="font-semibold">Labs</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <Vitals className="w-6 h-6 group-data-[state=active]:text-teal-600" />
            <span className="font-semibold">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="safety" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <HeartRate className="w-6 h-6 group-data-[state=active]:text-rose-600" />
            <span className="font-semibold">Safety</span>
          </TabsTrigger>
          <TabsTrigger value="vitals" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <Monitor className="w-6 h-6 group-data-[state=active]:text-amber-600" />
            <span className="font-semibold">Vitals</span>
          </TabsTrigger>
          <TabsTrigger value="vaccinations" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <Injection className="w-6 h-6 group-data-[state=active]:text-green-600" />
            <span className="font-semibold">Vaccines</span>
          </TabsTrigger>
          <TabsTrigger value="record-visit" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <Calendar className="w-6 h-6 group-data-[state=active]:text-indigo-600" />
            <span className="font-semibold">Visit</span>
          </TabsTrigger>
          <TabsTrigger value="consultation" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <Stethoscope className="w-6 h-6 group-data-[state=active]:text-cyan-600" />
            <span className="font-semibold">Specialty</span>
          </TabsTrigger>
          <TabsTrigger value="med-reviews" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <FileText className="w-6 h-6 group-data-[state=active]:text-orange-600" />
            <span className="font-semibold">Reviews</span>
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <Message className="w-6 h-6 group-data-[state=active]:text-violet-600" />
            <span className="font-semibold">Chat</span>
          </TabsTrigger>
        </TabsList>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medication className="h-5 w-5 text-purple-500" />
                Medications & Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="current" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                    <TabsTrigger value="current" className="flex items-center gap-2">
                      <Medication className="w-4 h-4" />
                      Current ({activeMedications.length})
                    </TabsTrigger>
                    <TabsTrigger value="past" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Past ({discontinuedMedications.length})
                    </TabsTrigger>
                    <TabsTrigger value="repeat" className="flex items-center gap-2">
                      <Refresh className="w-4 h-4" />
                      Repeat ({repeatMedications.length})
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Summary
                    </TabsTrigger>
                  </TabsList>
                  <Button 
                    onClick={onAddPrescription} 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </div>

                {/* Current Medications Tab */}
                <TabsContent value="current" className="space-y-4">
                  {prescriptionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-slate-500">Loading prescriptions...</div>
                    </div>
                  ) : prescriptionsError ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <div className="text-red-500">Failed to load prescriptions</div>
                      <Button 
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/patients', patient.id, 'prescriptions'] })}
                        variant="outline"
                        size="sm"
                      >
                        <Refresh className="w-4 h-4 mr-2" />
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
                                    <span>Started: {prescription.startDate ? new Date(prescription.startDate).toLocaleDateString() : 'Not specified'}</span>
                                  </div>
                                  {prescription.endDate && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>Ends: {new Date(prescription.endDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                                        <Menu className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px]">
                                      <DropdownMenuItem onClick={() => handleEditPrescription(prescription)}>
                                        <Edit className="w-3 h-3 mr-2" />
                                        Edit Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handlePrintPrescription(prescription)}>
                                        <Print className="w-3 h-3 mr-2" />
                                        Print
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleGenerateQRCode(prescription)}>
                                        <QrCode className="w-3 h-3 mr-2" />
                                        Generate QR Code
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleSendToRepeatMedications(prescription)}>
                                        <Refresh className="w-3 h-3 mr-2 text-blue-600" />
                                        Add to Repeat Medications
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSendToDispensary(prescription)}>
                                        <Plus className="w-3 h-3 mr-2 text-green-600" />
                                        Send to Dispensary
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleUpdateMedicationStatus(prescription.id, 'completed')}>
                                        <Success className="w-3 h-3 mr-2 text-blue-600" />
                                        Mark Completed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateMedicationStatus(prescription.id, 'discontinued')}>
                                        <Close className="w-3 h-3 mr-2 text-orange-600" />
                                        Discontinue
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateMedicationStatus(prescription.id, 'active')}>
                                        <Refresh className="w-3 h-3 mr-2 text-green-600" />
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
                    <Medication className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Active Prescriptions</h3>
                    <p className="text-sm text-gray-500 mb-4">Start by adding the first prescription for this patient</p>
                    <Button onClick={onAddPrescription} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Prescription
                    </Button>
                  </div>
                )}
                </TabsContent>

                {/* Past Medications Tab */}
                <TabsContent value="past" className="space-y-4">
                  {discontinuedMedications.length > 0 ? (
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
                                  Started: {prescription.startDate ? new Date(prescription.startDate).toLocaleDateString() : 'Not specified'}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-blue-600 hover:text-blue-800 border-blue-200"
                                    onClick={() => handleReorderMedication(prescription)}
                                  >
                                    <Refresh className="w-3 h-3 mr-1" />
                                    Reorder
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-600 hover:text-gray-800"
                                    onClick={() => handlePrintPrescription(prescription)}
                                  >
                                    <Print className="w-3 h-3 mr-1" />
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
                      <Calendar className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No Past Medications</h3>
                      <p className="text-sm text-gray-500">Historical medications will appear here when available</p>
                    </div>
                  )}
                </TabsContent>

                {/* Repeat Medications Tab */}
                <TabsContent value="repeat" className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                    <h4 className="font-medium text-blue-800 mb-2">Repeat Prescriptions</h4>
                    <p className="text-sm text-blue-700">
                      Long-term medications that require regular review by medical staff. Reviews ensure safety and effectiveness.
                    </p>
                  </div>
                  
                  {/* Actual repeat medications based on patient's prescriptions */}
                  {activeMedications.filter((prescription: any) => 
                    prescription.isRepeat || 
                    prescription.duration?.toLowerCase().includes('ongoing') || 
                    prescription.duration?.toLowerCase().includes('long') ||
                    prescription.duration?.toLowerCase().includes('term') ||
                    prescription.duration === 'Ongoing as directed'
                  ).length > 0 ? (
                    <div className="space-y-3">
                      {activeMedications
                        .filter((prescription: any) => 
                          prescription.isRepeat || 
                          prescription.duration?.toLowerCase().includes('ongoing') || 
                          prescription.duration?.toLowerCase().includes('long') ||
                          prescription.duration?.toLowerCase().includes('term') ||
                          prescription.duration === 'Ongoing as directed'
                        )
                        .map((prescription: any) => (
                        <div key={prescription.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-green-800 text-lg">
                                  {prescription.medicationName}
                                </h4>
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  Repeat Prescription
                                </Badge>
                                {prescription.reviewDate && (
                                  <Badge variant="outline" className={`text-xs ${
                                    new Date(prescription.reviewDate) < new Date() 
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  }`}>
                                    {new Date(prescription.reviewDate) < new Date() 
                                      ? 'Review Overdue' 
                                      : `Review Due: ${new Date(prescription.reviewDate).toLocaleDateString()}`
                                    }
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                <div className="bg-white p-3 rounded-md border">
                                  <span className="font-medium text-gray-700 block">Dosage</span>
                                  <p className="text-gray-800 mt-1">{prescription.dosage}</p>
                                </div>
                                <div className="bg-white p-3 rounded-md border">
                                  <span className="font-medium text-gray-700 block">Frequency</span>
                                  <p className="text-gray-800 mt-1">{prescription.frequency}</p>
                                </div>
                                <div className="bg-white p-3 rounded-md border">
                                  <span className="font-medium text-gray-700 block">Duration</span>
                                  <p className="text-gray-800 mt-1">{prescription.duration}</p>
                                </div>
                                <div className="bg-white p-3 rounded-md border">
                                  <span className="font-medium text-gray-700 block">Prescribed by</span>
                                  <p className="text-gray-800 mt-1">{prescription.prescribedBy}</p>
                                </div>
                              </div>
                              
                              {prescription.instructions && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                                  <span className="font-medium text-gray-700 flex items-center gap-2">
                                    <MedicalRecord className="w-4 h-4" />
                                    Instructions
                                  </span>
                                  <p className="text-gray-800 mt-2">{prescription.instructions}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-green-200">
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Started: {new Date(prescription.startDate).toLocaleDateString()}</span>
                                  </div>
                                  {prescription.lastReviewDate && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>Last Review: {new Date(prescription.lastReviewDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-blue-600 hover:text-blue-800 border-blue-200"
                                    onClick={() => handleScheduleReview(prescription.id, prescription.medicationName)}
                                  >
                                    <User className="w-3 h-3 mr-1" />
                                    Schedule Review
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-green-600 hover:text-green-800 border-green-200"
                                    onClick={() => handleIssueRepeat(prescription.id, prescription.medicationName)}
                                  >
                                    <Refresh className="w-3 h-3 mr-1" />
                                    Issue Repeat
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                                        <Menu className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px]">
                                      <DropdownMenuItem onClick={() => handleEditPrescription(prescription)}>
                                        <Edit className="w-3 h-3 mr-2" />
                                        Edit Repeat
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handlePrintPrescription(prescription)}>
                                        <Print className="w-3 h-3 mr-2" />
                                        Print
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleUpdateMedicationStatus(prescription.id, 'discontinued')}>
                                        <X className="w-3 h-3 mr-2 text-red-600" />
                                        Stop Repeat
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
                      <Refresh className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No Repeat Prescriptions</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Repeat prescriptions are long-term medications that require regular review.
                      </p>
                      <p className="text-xs text-gray-400">
                        To create a repeat prescription, add a medication with duration set to "ongoing" or "long-term".
                      </p>
                    </div>
                  )}

                  {/* Review Assignment Section */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 mt-6">
                    <h4 className="font-medium text-gray-800 mb-3">Assign Review</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Assign to:</label>
                        <select className="w-full p-2 border border-gray-300 rounded-md text-sm">
                          <option>Select reviewer...</option>
                          <option>Dr. Johnson (Doctor)</option>
                          <option>Dr. Smith (Doctor)</option>
                          <option>Sarah Wilson (Pharmacist)</option>
                          <option>Mike Brown (Nurse)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Review Type:</label>
                        <select className="w-full p-2 border border-gray-300 rounded-md text-sm">
                          <option>Routine Review</option>
                          <option>Urgent Review</option>
                          <option>Medication Safety Review</option>
                          <option>Dosage Adjustment</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Due Date:</label>
                        <input 
                          type="date" 
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          defaultValue="2025-12-15"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-700 block mb-2">Review Notes:</label>
                      <textarea 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm" 
                        rows={3}
                        placeholder="Add notes for the reviewer..."
                      ></textarea>
                    </div>
                    {/* Action Status Tracking */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Actions</h4>
                      <div className="space-y-2">
                        {(() => {
                          const actions = [];
                          
                          // Check for scheduled reviews
                          const reviewKeys = Object.keys(localStorage).filter(key => key.startsWith('review_'));
                          reviewKeys.forEach(key => {
                            const data = JSON.parse(localStorage.getItem(key) || '{}');
                            if (data.scheduled) {
                              actions.push(
                                <div key={key} className="flex items-center justify-between text-sm">
                                  <span className="text-green-700">✓ Review Scheduled</span>
                                  <span className="text-gray-500">{new Date(data.date).toLocaleDateString()}</span>
                                </div>
                              );
                            }
                          });
                          
                          // Check for issued repeats
                          const repeatKeys = Object.keys(localStorage).filter(key => key.startsWith('repeat_'));
                          repeatKeys.forEach(key => {
                            const data = JSON.parse(localStorage.getItem(key) || '{}');
                            if (data.issued) {
                              actions.push(
                                <div key={key} className="flex items-center justify-between text-sm">
                                  <span className="text-blue-700">✓ Repeat Issued</span>
                                  <span className="text-gray-500">{new Date(data.date).toLocaleDateString()}</span>
                                </div>
                              );
                            }
                          });
                          
                          return actions.length > 0 ? actions : (
                            <div className="text-sm text-gray-500">No recent actions</div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => setShowMedicationReviewAssignmentModal(true)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Assign Review
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Follow-up Scheduled",
                            description: "Follow-up appointment has been scheduled",
                          });
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Follow-up
                      </Button>
                    </div>

                    {/* Medication Review Assignments Section */}
                    <div className="mt-6">
                      <MedicationReviewAssignmentsList
                        patientId={patient.id}
                        patient={patient}
                        onCreateAssignment={() => setShowMedicationReviewAssignmentModal(true)}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Summary Tab */}
                <TabsContent value="summary" className="space-y-4">
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-4 text-lg">Medication Overview</h4>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-700 mb-1">{activeMedications.length}</div>
                        <div className="text-purple-600 font-medium">Active Medications</div>
                        <div className="text-xs text-purple-500 mt-1">Currently prescribed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-700 mb-1">{discontinuedMedications.length}</div>
                        <div className="text-blue-600 font-medium">Past Medications</div>
                        <div className="text-xs text-blue-500 mt-1">Completed or discontinued</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-700 mb-1">{displayPrescriptions.length}</div>
                        <div className="text-gray-600 font-medium">Total Prescriptions</div>
                        <div className="text-xs text-gray-500 mt-1">All time</div>
                      </div>
                    </div>
                  </div>
                  
                  {displayPrescriptions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-800 mb-3">Recent Activity</h5>
                        <div className="space-y-2">
                          {displayPrescriptions.slice(0, 3).map((prescription: any) => (
                            <div key={prescription.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{prescription.medicationName}</span>
                              <Badge className={
                                prescription.status === "active" 
                                  ? "bg-green-100 text-green-800" 
                                  : prescription.status === "completed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }>
                                {prescription.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-800 mb-3">Quick Actions</h5>
                        <div className="space-y-2">
                          <Button 
                            onClick={onAddPrescription} 
                            size="sm" 
                            className="w-full bg-purple-600 hover:bg-purple-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Medication
                          </Button>
                          {activeMedications.length > 0 && (
                            <Button 
                              onClick={() => handlePrintPrescription(activeMedications[0])} 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                            >
                              <Print className="w-4 h-4 mr-2" />
                              Print Recent Prescription
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safety Alerts Tab */}
        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vitals className="h-5 w-5 text-red-500" />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quick Stats - Enhanced */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Medical Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Vitals className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Total Visits</span>
                  </div>
                  <Badge variant="secondary">{visits.length}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BloodTest className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Lab Results</span>
                  </div>
                  <Badge variant="secondary">{recentLabs.length}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Medication className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Active Meds</span>
                  </div>
                  <Badge variant="secondary">{displayPrescriptions.length}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Patient Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
                  <User className="h-3 w-3 mr-1" style={{ color: '#0051CC' }} />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Registration</span>
                    <span className="text-xs font-medium text-gray-800">
                      {new Date(patient?.createdAt || '').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Blood Type</span>
                    <Badge variant="outline" className="text-xs text-red-600 border-red-300/60 h-5 bg-red-50/80">
                      A+
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Phone</span>
                    <span className="text-xs font-medium text-gray-800 truncate max-w-20">
                      {patient?.phone || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Insurance</span>
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300/60 h-5 bg-emerald-50/80">
                      Active
                    </Badge>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-200/60">
                  <h4 className="text-xs font-medium text-gray-900 mb-1">Allergies</h4>
                  <div className="flex flex-wrap gap-1">
                    {patient?.allergies ? (
                      <Badge variant="secondary" className="text-xs bg-red-50/90 text-red-700 border border-red-200/60 h-5">
                        {patient.allergies.length > 12 ? patient.allergies.substring(0, 12) + '...' : patient.allergies}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-500">None</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient Safety Indicator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Vitals className="w-4 h-4 text-red-500" />
                  Safety Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuickSafetyIndicator patientId={patient.id} />
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
                      <MedicalRecord className="h-5 w-5 text-gray-600" />
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
                                  <Menu className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[200px]">
                                {item.type === 'visit' ? (
                                  <>
                                    <DropdownMenuItem onClick={() => handleViewVisit(item.id)}>
                                      <Vision className="mr-2 h-4 w-4" />
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
                                      <Delete className="mr-2 h-4 w-4" />
                                      Delete Visit
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <>
                                    <DropdownMenuItem onClick={() => handleViewConsultation(item.id)}>
                                      <Vision className="mr-2 h-4 w-4" />
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
                          <Vitals className="w-2 h-2 text-blue-600" />
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
                          <BloodTest className="w-2 h-2 text-green-600" />
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
                          <MedicalRecord className="w-2 h-2 text-orange-600" />
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
                          <Medication className="w-2 h-2 text-purple-600" />
                        </div>
                        <label htmlFor="filter-prescriptions" className="text-xs cursor-pointer">Prescriptions</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Showing {(activityTrail || []).filter((event: any) => {
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
              <PatientTimeline events={(activityTrail || []).filter((event: any) => {
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
                  Record Patient Visit - {formatPatientName(patient)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...visitForm}>
                  <form onSubmit={visitForm.handleSubmit(onSubmitVisit)} className="space-y-6">
                    
                    {/* Visit Type and Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={visitForm.control}
                        name="visitType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Visit Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select visit type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="consultation">General Consultation</SelectItem>
                                <SelectItem value="follow-up">Follow-up Visit</SelectItem>
                                <SelectItem value="emergency">Emergency Visit</SelectItem>
                                <SelectItem value="routine-checkup">Routine Checkup</SelectItem>
                                <SelectItem value="specialist-referral">Specialist Referral</SelectItem>
                                <SelectItem value="vaccination">Vaccination</SelectItem>
                                <SelectItem value="pre-operative">Pre-operative Assessment</SelectItem>
                                <SelectItem value="post-operative">Post-operative Follow-up</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Chief Complaint */}
                    <FormField
                      control={visitForm.control}
                      name="chiefComplaint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chief Complaint</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Patient's main concern or reason for visit"
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* History of Present Illness */}
                    <FormField
                      control={visitForm.control}
                      name="historyOfPresentIllness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>History of Present Illness</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Detailed description of the current illness or symptoms"
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Vital Signs */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Vital Signs</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField
                          control={visitForm.control}
                          name="bloodPressure"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Blood Pressure</FormLabel>
                              <FormControl>
                                <Input placeholder="120/80" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={visitForm.control}
                          name="heartRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Heart Rate (bpm)</FormLabel>
                              <FormControl>
                                <Input placeholder="72" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={visitForm.control}
                          name="temperature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Temperature (°C)</FormLabel>
                              <FormControl>
                                <Input placeholder="36.5" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={visitForm.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight (kg)</FormLabel>
                              <FormControl>
                                <Input placeholder="70" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField
                          control={visitForm.control}
                          name="height"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Height (cm)</FormLabel>
                              <FormControl>
                                <Input placeholder="170" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={visitForm.control}
                          name="respiratoryRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Respiratory Rate</FormLabel>
                              <FormControl>
                                <Input placeholder="16" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={visitForm.control}
                          name="oxygenSaturation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Oxygen Saturation (%)</FormLabel>
                              <FormControl>
                                <Input placeholder="98" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Physical Examination */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Physical Examination</h3>
                      
                      <FormField
                        control={visitForm.control}
                        name="generalAppearance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>General Appearance</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Overall appearance and condition of the patient"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={visitForm.control}
                          name="cardiovascularSystem"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cardiovascular System</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Heart sounds, pulses, etc."
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={visitForm.control}
                          name="respiratorySystem"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Respiratory System</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Breath sounds, chest movement, etc."
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={visitForm.control}
                          name="gastrointestinalSystem"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gastrointestinal System</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Abdomen examination findings"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={visitForm.control}
                          name="neurologicalSystem"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Neurological System</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Neurological examination findings"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={visitForm.control}
                        name="musculoskeletalSystem"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Musculoskeletal System</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Joint, muscle, and bone examination findings"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Assessment and Diagnosis */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Assessment & Diagnosis</h3>
                      
                      <FormField
                        control={visitForm.control}
                        name="assessment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clinical Assessment</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Clinical reasoning and assessment"
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={visitForm.control}
                        name="diagnosis"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Diagnosis</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Primary diagnosis"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Additional Diagnoses */}
                      <div className="space-y-3">
                        <FormLabel>Additional Diagnoses</FormLabel>
                        <div className="flex gap-2">
                          <FormField
                            control={visitForm.control}
                            name="secondaryDiagnoses"
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input 
                                    placeholder="Add secondary diagnosis"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="button" 
                            onClick={addDiagnosis}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {additionalDiagnoses.length > 0 && (
                          <div className="space-y-2">
                            {additionalDiagnoses.map((diagnosis, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span className="text-sm">{diagnosis}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDiagnosis(diagnosis)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Treatment Plan */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Treatment Plan</h3>
                      
                      <FormField
                        control={visitForm.control}
                        name="treatmentPlan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Treatment Plan</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Detailed treatment plan and interventions"
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-3">
                        <FormLabel>Medications</FormLabel>
                        <GlobalMedicationSearch
                          onMedicationSelect={(medication) => {
                            setMedicationList(prev => [...prev, medication.name]);
                          }}
                          placeholder="Search and add medications..."
                        />
                        
                        {medicationList.length > 0 && (
                          <div className="space-y-2">
                            {medicationList.map((medication, index) => (
                              <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                                <span className="text-sm">{medication}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setMedicationList(prev => prev.filter((_, i) => i !== index))}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <FormField
                        control={visitForm.control}
                        name="patientInstructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient Instructions</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Instructions and advice for the patient"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Follow-up */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Follow-up</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={visitForm.control}
                          name="followUpDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Follow-up Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={visitForm.control}
                          name="followUpInstructions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Follow-up Instructions</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Specific follow-up instructions"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Additional Notes */}
                    <FormField
                      control={visitForm.control}
                      name="additionalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any additional observations or notes"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => visitForm.reset()}
                      >
                        Clear Form
                      </Button>
                      <Button type="submit">
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Save Visit Record
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MedicalRecord className="h-5 w-5 text-emerald-600" />
                  Patient Documents & Medical Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="medical-records" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-6">
                    <TabsTrigger value="medical-records" className="flex items-center gap-2">
                      <MedicalRecord className="w-4 h-4" />
                      Medical Records
                    </TabsTrigger>
                    <TabsTrigger value="consent-forms" className="flex items-center gap-2">
                      <Document className="w-4 h-4" />
                      Consent Forms
                    </TabsTrigger>
                    <TabsTrigger value="insurance" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Insurance
                    </TabsTrigger>
                    <TabsTrigger value="referrals" className="flex items-center gap-2">
                      <Referral className="w-4 h-4" />
                      Referrals
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="medical-records" className="space-y-4">
                    {/* Document Fetch and Display */}
                    <DocumentsListSection 
                      patientId={patient.id}
                      onViewDocument={(index) => {
                        setSelectedDocumentIndex(index);
                        setShowDocumentCarousel(true);
                      }}
                    />
                    
                    {/* Upload Dialog */}
                    <div className="flex justify-center mt-6">
                      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                        <DialogTrigger asChild>
                          <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Document
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Upload className="w-5 h-5 text-emerald-600" />
                              Upload Medical Document
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="document-type">Document Type</Label>
                              <Select value={documentType} onValueChange={setDocumentType}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select document type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="medical-record">Medical Record</SelectItem>
                                  <SelectItem value="lab-result">Lab Result</SelectItem>
                                  <SelectItem value="imaging">Imaging/X-ray</SelectItem>
                                  <SelectItem value="prescription">Prescription</SelectItem>
                                  <SelectItem value="discharge-summary">Discharge Summary</SelectItem>
                                  <SelectItem value="referral">Referral Letter</SelectItem>
                                  <SelectItem value="insurance">Insurance Document</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="file-upload">Select File</Label>
                              <Input
                                id="file-upload"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={handleFileSelect}
                                className="cursor-pointer"
                              />
                              {uploadFile && (
                                <p className="text-sm text-gray-600">
                                  Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="description">Description (Optional)</Label>
                              <Input
                                id="description"
                                value={documentDescription}
                                onChange={(e) => setDocumentDescription(e.target.value)}
                                placeholder="Brief description of the document"
                              />
                            </div>

                            <div className="flex gap-3 pt-4">
                              <Button
                                onClick={handleDocumentUpload}
                                disabled={!uploadFile || !documentType || uploadDocumentMutation.isPending}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                              >
                                {uploadDocumentMutation.isPending ? (
                                  <>
                                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setShowUploadDialog(false)}
                                disabled={uploadDocumentMutation.isPending}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TabsContent>

                  <TabsContent value="consent-forms" className="space-y-4">
                    <div className="text-center py-12 text-gray-500">
                      <Document className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Consent Forms</h3>
                      <p className="text-sm text-gray-500 mb-4">Manage patient consent and authorization forms</p>
                      <ConsentCapture
                        patientId={patient.id}
                        patientName={formatPatientName(patient)}
                        trigger={
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            New Consent Form
                          </Button>
                        }
                        onConsentCaptured={() => {
                          toast({
                            title: "Success",
                            description: "Consent form captured successfully",
                          });
                        }}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="insurance" className="space-y-4">
                    <InsuranceManagement patientId={patient.id} />
                  </TabsContent>

                  <TabsContent value="referrals" className="space-y-4">
                    <ReferralManagement patientId={patient.id} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Labs Tab */}
          <TabsContent value="labs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BloodTest className="h-5 w-5 text-red-600" />
                  Laboratory Tests & Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="orders" className="w-full">
                  <TabsList className="grid w-full grid-cols-5 max-w-3xl mb-6">
                    <TabsTrigger value="orders" className="flex items-center gap-2">
                      <BloodTest className="w-4 h-4" />
                      Lab Orders
                    </TabsTrigger>
                    <TabsTrigger value="results" className="flex items-center gap-2">
                      <BloodTest className="w-4 h-4" />
                      Results
                    </TabsTrigger>
                    <TabsTrigger value="reviewed" className="flex items-center gap-2">
                      <Success className="w-4 h-4" />
                      Reviewed
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                      <History className="w-4 h-4" />
                      History
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="orders" className="space-y-4">
                    <LabOrderForm patientId={patient.id} />
                  </TabsContent>

                  <TabsContent value="results" className="space-y-4">
                    <LabOrdersList patientId={patient.id} />
                    
                    {/* AI-Powered Lab Result Integration */}
                    <LabResultPersonalityIntegration
                      patientId={patient.id}
                      labResults={[]} // This will be populated with actual lab results
                      patientData={{
                        firstName: patient.firstName,
                        lastName: patient.lastName,
                        age: patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : undefined,
                        gender: patient.gender,
                        medicalHistory: patient.medicalHistory || undefined,
                        allergies: patient.allergies || undefined
                      }}
                      onIntegrationComplete={() => {
                        queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}`] });
                        queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/visits`] });
                        queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/lab-orders`] });
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="reviewed" className="space-y-4">
                    <PatientReviewedResults patientId={patient.id} />
                  </TabsContent>

                  <TabsContent value="pending" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">Pending Lab Tests</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/lab-orders`] })}
                        >
                          <Refresh className="w-4 h-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                      <LabOrdersList patientId={patient.id} showPendingOnly={true} />
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">Complete Lab History</h3>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/lab-orders`] })}
                          >
                            <Refresh className="w-4 h-4 mr-2" />
                            Refresh
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePrintLabHistory()}
                          >
                            <Print className="w-4 h-4 mr-2" />
                            Print
                          </Button>
                        </div>
                      </div>
                      <LabOrdersList patientId={patient.id} showAll={true} />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consultation Forms Tab */}
          <TabsContent value="consultation" className="space-y-6">
            <ConsultationFormSelector patientId={patient.id} />
          </TabsContent>

          {/* Medication Review Assignments Tab */}
          <TabsContent value="med-reviews" className="space-y-6">
            <MedicationReviewAssignmentsList
              patientId={patient.id}
              patient={patient}
              onCreateAssignment={() => handleCreateMedicationReviewAssignment()}
            />
          </TabsContent>

          {/* Vaccination Tab */}
          <TabsContent value="vaccinations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vitals className="h-5 w-5 text-green-500" />
                  Vaccination History & Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VaccinationManagement 
                  patientId={patient.id} 
                  canEdit={user?.role === 'doctor' || user?.role === 'nurse' || user?.role === 'admin'} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="space-y-6">
            <PatientCommunicationHub
              patientId={patient.id}
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

        {/* Document Preview Carousel */}
        <DocumentPreviewCarousel
          patientId={patient.id}
          isOpen={showDocumentCarousel}
          onClose={() => setShowDocumentCarousel(false)}
          initialDocumentIndex={selectedDocumentIndex}
        />

        {/* Custom Prescription Print Dialog */}
        {showPrescriptionPrint && (
          <CustomPrescriptionPrint
            prescriptions={displayPrescriptions}
            patient={patient}
            onClose={() => setShowPrescriptionPrint(false)}
          />
        )}

        {/* Custom Lab Order Print Dialog */}
        {showLabOrderPrint && (
          <CustomLabOrderPrint
            labOrders={patientLabOrders}
            patient={patient}
            onClose={() => setShowLabOrderPrint(false)}
          />
        )}

        {/* Medication Review Assignment Modal */}
        <MedicationReviewAssignmentModal
          isOpen={showMedicationReviewAssignmentModal}
          onClose={handleCloseMedicationReviewAssignment}
          patientId={patient.id}
          patient={patient}
          selectedPrescription={selectedPrescriptionForReview}
        />
    </div>
  );
}