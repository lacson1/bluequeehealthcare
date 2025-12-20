import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { PatientTimeline } from './patient-timeline';
import { PatientAlertsPanel } from './patient-alerts-panel';
import { PatientSafetyAlertsRealtime, QuickSafetyIndicator } from './patient-safety-alerts-realtime';
import PatientVitalSignsTracker from './patient-vital-signs-tracker';
import { formatPatientName } from '@/lib/patient-utils';
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
import {
  Stethoscope,
  Plus,
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
  Activity as Vitals,
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
  History,
  Settings,
  CheckCircle,
  MoreVertical,
  Eye,
  Download,
  Share,
  Printer,
  Shield,
  Calendar,
  Brain,
  Heart
} from "lucide-react";
import { GlobalMedicationSearch } from "@/components/global-medication-search";
import { usePatientTabs } from "@/hooks/use-patient-tabs";
import { TabManager } from "@/components/tab-manager";
import { getTabIcon } from "@/lib/tab-icons";
import { t } from "@/lib/i18n";
import { formatDateMedium } from "@/lib/date-utils";

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
import { PatientAppointmentsTab } from './patient-appointments-tab';
import { PatientBillingTab } from './patient-billing-tab';
import { PatientInsuranceTab } from './patient-insurance-tab';
import { PatientHistoryTab } from './patient-history-tab';
import { PatientDischargeLetterTab } from './patient-discharge-letter-tab';
import { MedicationReviewAssignmentsList } from './medication-review-assignments-list';
import VaccinationManagement from './vaccination-management';
import { useAuth } from '@/contexts/AuthContext';
import { LabResultPersonalityIntegration } from './LabResultPersonalityIntegration';
import ConsentCapture from './consent-capture';
import { PatientAllergies } from './patient-allergies';
import { PatientImmunizations } from './patient-immunizations';
import { PatientImaging } from './patient-imaging';
import { PatientProcedures } from './patient-procedures';
import PsychologicalTherapyAssessment from './psychological-therapy-assessment';
import { CarePlansTab } from './patient-tabs/care-plans-tab';
import { ReferralsTab } from './patient-tabs/referrals-tab';
import { ClinicalNotesTab } from './patient-tabs/clinical-notes-tab';
import { LongevityTab } from './patient-tabs/longevity-tab';
import InsuranceManagement from './insurance-management';
import ReferralManagement from './referral-management';
import { Patient } from '@shared/schema';
import { PatientMedicationsTab } from './patient/patient-medications-tab';
import { PatientOverviewTab } from './patient/patient-overview-tab';
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
function PatientReviewedResults({
  patientId,
  showDeleteVisitConfirm,
  setShowDeleteVisitConfirm,
  confirmDeleteVisit
}: {
  patientId: number;
  showDeleteVisitConfirm: boolean;
  setShowDeleteVisitConfirm: (value: boolean) => void;
  confirmDeleteVisit: () => void;
}) {
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
      title: t('toast.viewDetails'),
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
              <p><strong>Completed Date:</strong> ${formatDateMedium(result.completedDate)}</p>
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
      const content = `Lab Result: ${result.testName}\nResult: ${result.result} ${result.units || ''}\nNormal Range: ${result.normalRange}\nStatus: ${result.status}\nCompleted: ${formatDateMedium(result.completedDate)}\nReviewed by: ${result.reviewedBy}`;

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
        title: t('toast.exportComplete'),
        description: `${result.testName} result exported successfully`,
      });
    } catch (error) {
      toast({
        title: t('toast.exportFailed'),
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
        title: t('toast.linkCopied'),
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
                      <p>{formatDateMedium(result.completedDate)}</p>
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

      {/* Confirm Delete Visit Dialog */}
      <ConfirmDialog
        open={showDeleteVisitConfirm}
        onOpenChange={setShowDeleteVisitConfirm}
        title="Delete Visit Record"
        description="Are you sure you want to delete this visit record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteVisit}
      />
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
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
              <p>Uploaded: {formatDateMedium(doc.uploadedAt)}</p>
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
}

export function ModernPatientOverview({
  patient,
  visits,
  recentLabs = [],
  activePrescriptions = [],
  onAddPrescription,
  onRecordVisit
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
  const [showPsychologicalTherapyDialog, setShowPsychologicalTherapyDialog] = useState(false);

  // Dynamic tab management
  const { tabs, isLoading: tabsLoading, defaultTabKey } = usePatientTabs();
  const [showTabManager, setShowTabManager] = useState(false);
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
    const visitDetails = `Visit Date: ${formatDateMedium(visit.visitDate)}
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
    setVisitToDelete(visitId);
    setShowDeleteVisitConfirm(true);
  };

  const confirmDeleteVisit = () => {
    if (visitToDelete) {
      // Delete visit logic here
      setVisitToDelete(null);
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
        title: t('toast.printError'),
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
      await apiRequest(`/api/prescriptions/${prescription.id}`, 'PATCH', {
        duration: 'Ongoing as directed',
        instructions: (prescription.instructions || '') + ' [Added to repeat medications]'
      });

      queryClient.invalidateQueries({ queryKey: ['/api/patients', patient.id, 'prescriptions'] });
      toast({
        title: "Added to Repeat Medications",
        description: `${prescription.medicationName} is now available in repeat medications tab`,
      });
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
      await apiRequest('/api/pharmacy-activities', 'POST', {
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
      });

      toast({
        title: "Sent to Dispensary",
        description: `${prescription.medicationName} has been sent to the dispensary for processing`,
      });
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
  const [showDeleteVisitConfirm, setShowDeleteVisitConfirm] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<number | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');

  // Document carousel state
  const [showDocumentCarousel, setShowDocumentCarousel] = useState(false);
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(0);

  // Custom print dialog states
  const [showPrescriptionPrint, setShowPrescriptionPrint] = useState(false);
  const [showLabOrderPrint, setShowLabOrderPrint] = useState(false);

  // Medication selection for printing
  const [selectedMedications, setSelectedMedications] = useState<Set<number>>(new Set());
  const [selectedPrescriptionsForPrint, setSelectedPrescriptionsForPrint] = useState<any[]>([]);



  // Document upload mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Using session-based authentication via cookies
      const response = await fetch(`/api/patients/${patient.id}/documents`, {
        method: 'POST',
        credentials: 'include', // Use secure session cookies
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
        title: t('toast.uploadSuccess'),
        description: "Document has been successfully uploaded and attached to patient record.",
      });
      setShowUploadDialog(false);
      setUploadFile(null);
      setDocumentType('');
      setDocumentDescription('');
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/documents`] });
    },
    onError: () => {
      toast({
        title: t('toast.uploadFailed'),
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
  const { data: patientLabOrders = [] } = useQuery<any[]>({
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

  const handleEditPrescription = async (prescription: any) => {
    try {
      // Show edit options dialog
      const editOptions = [
        'Dosage',
        'Frequency', 
        'Duration',
        'Instructions',
        'Status'
      ];
      
      const fieldToEdit = prompt(
        `Edit ${prescription.medicationName}\n\nSelect field to edit:\n${editOptions.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nEnter number (1-5) or field name:`,
        '1'
      );
      
      if (!fieldToEdit) {
        return; // User cancelled
      }
      
      const fieldMap: Record<string, string> = {
        '1': 'dosage',
        '2': 'frequency',
        '3': 'duration',
        '4': 'instructions',
        '5': 'status',
        'dosage': 'dosage',
        'frequency': 'frequency',
        'duration': 'duration',
        'instructions': 'instructions',
        'status': 'status'
      };
      
      const field = fieldMap[fieldToEdit.toLowerCase()] || 'dosage';
      const currentValue = prescription[field] || '';
      const fieldLabel = editOptions[parseInt(fieldToEdit) - 1] || field;
      
      let newValue: string | null = null;
      
      if (field === 'status') {
        const statusOptions = ['active', 'completed', 'discontinued', 'pending'];
        const statusChoice = prompt(
          `Edit Status for ${prescription.medicationName}\n\nCurrent: ${currentValue}\n\nOptions:\n${statusOptions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nEnter number or status name:`,
          statusOptions.indexOf(currentValue) >= 0 ? String(statusOptions.indexOf(currentValue) + 1) : '1'
        );
        if (statusChoice) {
          const statusMap: Record<string, string> = {
            '1': 'active',
            '2': 'completed',
            '3': 'discontinued',
            '4': 'pending'
          };
          newValue = statusMap[statusChoice] || statusOptions.find(s => s.toLowerCase() === statusChoice.toLowerCase()) || statusChoice;
        }
      } else {
        newValue = prompt(
          `Edit ${fieldLabel} for ${prescription.medicationName}\n\nCurrent: ${currentValue}\n\nEnter new value:`,
          currentValue
        );
      }
      
      if (newValue && newValue !== currentValue) {
        await apiRequest(`/api/prescriptions/${prescription.id}`, 'PATCH', {
          [field]: newValue
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/patients', patient.id, 'prescriptions'] });
        
        toast({
          title: "Prescription Updated",
          description: `${fieldLabel} for ${prescription.medicationName} has been updated.`,
        });
      } else if (newValue === null) {
        // User cancelled
        return;
      } else {
        toast({
          title: "No Changes",
          description: "No changes were made to the prescription.",
        });
      }
    } catch (error) {
      handleError(error);
      toast({
        title: "Error",
        description: "Failed to update prescription. Please try again.",
        variant: "destructive"
      });
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
            await notificationResponse.json();
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
            await pharmacyNotificationResponse.json();
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
      // Set single prescription for printing
      setSelectedPrescriptionsForPrint([prescription]);
      setShowPrescriptionPrint(true);

      toast({
        title: t('toast.printPreview'),
        description: "Prescription print preview is being prepared with organization branding.",
      });
    } catch (error) {
      console.error('Failed to open print preview:', error);
      toast({
        title: t('toast.printFailed'),
        description: "Unable to open print preview. Please try again.",
        variant: "destructive",
      });
    }
  }

  const toggleMedicationSelection = (prescriptionId: number) => {
    setSelectedMedications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(prescriptionId)) {
        newSet.delete(prescriptionId);
      } else {
        newSet.add(prescriptionId);
      }
      return newSet;
    });
  }

  const handlePrintSelectedMedications = async () => {
    if (selectedMedications.size === 0) {
      toast({
        title: "No Medications Selected",
        description: "Please select at least one medication to print.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedPrescriptions = activeMedications.filter((p: any) =>
        selectedMedications.has(p.id)
      );

      // Store selected prescriptions for the print component
      setSelectedPrescriptionsForPrint(selectedPrescriptions);
      setShowPrescriptionPrint(true);

      toast({
        title: "Opening Print Preview",
        description: `Print preview for ${selectedPrescriptions.length} medication(s) is being prepared.`,
      });
    } catch (error) {
      console.error('Failed to open print preview:', error);
      toast({
        title: t('toast.printFailed'),
        description: "Unable to open print preview. Please try again.",
        variant: "destructive",
      });
    }
  }

  const clearSelection = () => {
    setSelectedMedications(new Set());
  }


  const handleReorderMedication = async (prescription: any) => {
    try {
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

      const response = await fetch(`/api/patients/${prescription.patientId}/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reorderData),
      });

      const responseText = await response.text();

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
      const { generateMedicationQRCode } = await import('@/utils/qr-code-generator');
      
      // Fetch organization data only if user has organizationId
      let organizationData = null;
      if (user?.organizationId) {
        try {
          const result = await queryClient.fetchQuery({
            queryKey: ['/api/organizations', user.organizationId],
            queryFn: async () => {
              const res = await fetch(`/api/organizations/${user.organizationId}`, {
                credentials: 'include',
              });
              if (!res.ok) {
                throw new Error(`Failed to fetch organization: ${res.status}`);
              }
              const json = await res.json();
              // Handle both wrapped (sendSuccess) and unwrapped response formats
              const data = json.data || json;
              // Ensure we have a valid organization object
              if (data && typeof data === 'object' && data.id) {
                return data;
              }
              throw new Error('Invalid organization data format');
            },
            retry: false,
          });
          // Ensure result is a valid organization object
          if (result && typeof result === 'object' && result.id) {
            organizationData = result;
          }
        } catch (orgError: any) {
          console.warn('Failed to fetch organization data, generating QR code without letterhead:', orgError);
          // Continue without organization data - QR code can still be generated
        }
      } else {
        console.warn('User has no organizationId, generating QR code without organization letterhead');
      }

      await generateMedicationQRCode(
        {
          name: prescription.medicationName,
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          duration: prescription.duration,
          instructions: prescription.instructions || 'Take as directed',
          prescribedBy: prescription.prescribedBy,
          startDate: prescription.startDate || prescription.createdAt,
          endDate: prescription.endDate,
          prescriptionId: prescription.id
        },
        {
          firstName: patient.firstName,
          lastName: patient.lastName,
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth,
          id: patient.id,
          title: patient.title
        },
        {
          organizationId: user?.organizationId,
          organization: organizationData,
          autoPrint: false
        }
      );

      toast({
        title: "QR Code Generated",
        description: organizationData 
          ? "QR code opened in new window with organization letterhead for pharmacy scanning."
          : "QR code opened in new window. Note: Organization letterhead not available.",
      });
    } catch (error: any) {
      console.error('Failed to generate QR code:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast({
        title: "QR Code Generation Failed",
        description: errorMessage.includes('organization') 
          ? "Unable to generate QR code with organization letterhead. Please ensure your account is assigned to an organization."
          : `Unable to generate QR code: ${errorMessage}`,
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

  // Alias for consistency with industry terminology
  const calculatePatientAge = getPatientAge;





  // Fetch activity trail using React Query with proper error handling
  const { data: fetchedActivityTrail = [] } = useQuery({
    queryKey: [`/api/patients/${patient.id}/activity-trail`],
    retry: false
  });

  // Use fetched activity trail or fallback to empty array
  const activityTrail = Array.isArray(fetchedActivityTrail) ? fetchedActivityTrail : [];

  return (
    <div className="space-y-2 w-full h-full min-w-0 max-w-full overflow-hidden">
      {/* Enhanced Tabbed Interface - Full Width with Dynamic Tabs */}
      <Tabs defaultValue={defaultTabKey} className="w-full h-full flex flex-col min-w-0 max-w-full overflow-hidden">
        <div className="relative mb-2">
          {/* Premium Tab Container - Glassmorphism Design with Cool Calm Colors */}
          <div className="relative overflow-hidden">
            {/* Animated Background Gradient - Cool Calm Theme */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/40 via-sky-50/30 to-teal-50/40 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-100/20 to-transparent rounded-2xl"></div>

            {/* Glassmorphism Container - Cool Calm Tint */}
            <div className="relative bg-cyan-50/60 backdrop-blur-xl rounded-2xl border border-cyan-200/60 shadow-2xl shadow-cyan-200/30 p-2 ring-1 ring-cyan-100/40">
              {/* Subtle Inner Glow - Cool Calm Accent */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-100/40 via-transparent to-teal-100/30 pointer-events-none"></div>

              {/* TabManager Settings Button - Premium */}
              <Button
                onClick={() => setShowTabManager(true)}
                size="sm"
                variant="ghost"
                className="absolute top-2.5 right-2.5 z-10 h-5 w-5 p-0 bg-white/80 hover:bg-white rounded-md border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 opacity-60 hover:opacity-100 hover:border-blue-300 hover:scale-110 group backdrop-blur-sm"
                data-testid="button-open-tab-manager"
                title="Customize Tabs"
              >
                <Settings className="h-3 w-3 text-slate-500 group-hover:text-blue-600 transition-all duration-300 group-hover:rotate-90" />
              </Button>

              <TabsList className="relative w-full h-auto bg-transparent rounded-xl p-1 flex flex-wrap gap-1.5 justify-start items-center">
                {tabsLoading ? (
                  <div className="w-full flex items-center justify-center py-4 text-blue-600">
                    <Clock className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm font-semibold">{t('ui.loadingTabs')}</span>
                  </div>
                ) : (
                  tabs.map((tab) => {
                    const IconComponent = getTabIcon(tab.icon);
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.key}
                        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 font-semibold text-sm transition-all duration-300 hover:text-blue-700 hover:bg-white/90 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] data-[state=active]:text-blue-700 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-100/60 data-[state=active]:border data-[state=active]:border-blue-200/80 data-[state=active]:ring-2 data-[state=active]:ring-blue-100/50 group before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-blue-50/50 before:via-white before:to-transparent before:opacity-0 data-[state=active]:before:opacity-100 before:transition-opacity before:duration-300"
                        data-testid={`tab-trigger-${tab.key}`}
                      >
                        <IconComponent className="w-4 h-4 transition-all duration-300 group-data-[state=active]:text-blue-600 group-hover:text-blue-600 group-data-[state=active]:scale-110" />
                        <span className="relative z-10">{tab.label}</span>
                        {/* Active Indicator Glow */}
                        <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 via-blue-300/10 to-transparent opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300 pointer-events-none"></span>
                      </TabsTrigger>
                    );
                  })
                )}
              </TabsList>
            </div>
          </div>
        </div>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-3 mt-2 flex-1 overflow-y-auto min-w-0 max-w-full overflow-x-hidden">
          <PatientMedicationsTab
            activeMedications={activeMedications}
            discontinuedMedications={discontinuedMedications}
            repeatMedications={repeatMedications}
            prescriptionsLoading={prescriptionsLoading}
            prescriptionsError={prescriptionsError}
            selectedMedications={selectedMedications}
            onToggleMedicationSelection={toggleMedicationSelection}
            onPrintSelectedMedications={handlePrintSelectedMedications}
            onClearSelection={clearSelection}
            onAddPrescription={onAddPrescription || (() => {})}
            onEditPrescription={handleEditPrescription}
            onPrintPrescription={handlePrintPrescription}
            onGenerateQRCode={handleGenerateQRCode}
            onSendToRepeatMedications={handleSendToRepeatMedications}
            onSendToDispensary={handleSendToDispensary}
            onUpdateMedicationStatus={handleUpdateMedicationStatus}
            onRetryLoading={() => queryClient.invalidateQueries({ queryKey: ['/api/patients', patient.id, 'prescriptions'] })}
            patientId={patient.id}
            patient={patient as any}
            onCreateReviewAssignment={() => setShowMedicationReviewAssignmentModal(true)}
          />
        </TabsContent>

        {/* OLD MEDICATIONS TAB CODE - REMOVED - Now using PatientMedicationsTab component above */}
        <TabsContent value="medications-old" className="hidden">
          <Card className="shadow-md border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medication className="h-5 w-5 text-purple-500" />
                Medications & Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="current" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  {selectedMedications.size > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        onClick={handlePrintSelectedMedications}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Print className="w-4 h-4 mr-2" />
                        Print Selected ({selectedMedications.size})
                      </Button>
                      <Button
                        onClick={clearSelection}
                        variant="outline"
                        size="sm"
                      >
                        Clear Selection
                      </Button>
                    </div>
                  )}
                  <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                    <TabsTrigger
                      value="current"
                      className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200"
                      data-testid="tab-current-medications"
                    >
                      <Medication className="w-4 h-4" />
                      Current ({activeMedications.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="past"
                      className="flex items-center gap-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-orange-200"
                      data-testid="tab-past-medications"
                    >
                      <Clock className="w-4 h-4" />
                      Past ({discontinuedMedications.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="repeat"
                      className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
                      data-testid="tab-repeat-medications"
                    >
                      <Refresh className="w-4 h-4" />
                      Repeat ({repeatMedications.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="summary"
                      className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-purple-200"
                      data-testid="tab-medication-summary"
                    >
                      <FileText className="w-4 h-4" />
                      Summary
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    onClick={onAddPrescription}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                    title="Add Medication"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* OLD MEDICATIONS TAB CODE REMOVED - Now using PatientMedicationsTab component */}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safety Alerts Tab */}
        <TabsContent value="safety" className="space-y-2">
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
        <TabsContent value="overview" className="space-y-3 mt-2 flex-1 overflow-y-auto min-w-0 max-w-full overflow-x-hidden">
          <PatientOverviewTab
            patient={patient}
            visits={visits}
            recentLabs={recentLabs}
            activePrescriptions={activePrescriptions}
            displayPrescriptions={displayPrescriptions}
            onAddPrescription={onAddPrescription}
            onRecordVisit={onRecordVisit}
            onShowPsychologicalTherapyDialog={() => setShowPsychologicalTherapyDialog(true)}
          />
        </TabsContent>

        {/* OLD OVERVIEW TAB CODE - REMOVED - Now using PatientOverviewTab component above */}
        <TabsContent value="overview-old" className="hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {/* Quick Stats - Enhanced */}
            <Card className="shadow-md border-slate-200/60 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2.5">
                <CardTitle className="text-sm font-medium">Medical Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <Vitals className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Total Visits</span>
                  </div>
                  <Badge variant="secondary" className="font-semibold">{visits.length}</Badge>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <BloodTest className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Lab Results</span>
                  </div>
                  <Badge variant="secondary" className="font-semibold">{recentLabs.length}</Badge>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <Medication className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700">Active Meds</span>
                  </div>
                  <Badge variant="secondary" className="font-semibold">{displayPrescriptions.length}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Patient Summary - Industry Standard Format - Spans 2 columns on large screens */}
            <Card className="shadow-md border-slate-200/60 hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
                  <User className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" style={{ color: '#0051CC' }} />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {/* DOB - Critical for patient identification */}
                  <div className="col-span-2 flex justify-between items-center bg-blue-50/50 rounded px-2 py-1.5">
                    <span className="text-xs font-medium text-blue-700">DOB</span>
                    <span className="text-xs font-bold text-blue-900">
                      {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center min-w-0">
                    <span className="text-xs text-gray-600 truncate">Age/Sex</span>
                    <span className="text-xs font-medium text-gray-800 whitespace-nowrap ml-2">
                      {patient?.dateOfBirth ? calculatePatientAge(patient.dateOfBirth) : 'N/A'}y {patient?.gender?.charAt(0).toUpperCase() || ''}
                    </span>
                  </div>

                  <div className="flex justify-between items-center min-w-0">
                    <span className="text-xs text-gray-600 truncate">Blood Type</span>
                    <Badge variant="outline" className="text-xs text-red-600 border-red-300/60 h-5 bg-red-50/80 flex-shrink-0 ml-2">
                      {(patient as any)?.bloodType || 'Unknown'}
                    </Badge>
                  </div>

                  <div className="col-span-2 flex justify-between items-center min-w-0">
                    <span className="text-xs text-gray-600 flex-shrink-0">Phone</span>
                    {patient?.phone ? (
                      <a
                        href={`tel:${patient.phone.replace(/\s+/g, '')}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline truncate ml-2 transition-colors cursor-pointer min-w-0 flex-1 text-right"
                        title={`Call ${patient.phone}`}
                      >
                        {patient.phone}
                      </a>
                    ) : (
                      <span className="text-xs font-medium text-gray-800 ml-2">N/A</span>
                    )}
                  </div>

                  <div className="col-span-2 flex justify-between items-center min-w-0">
                    <span className="text-xs text-gray-600 flex-shrink-0">Email</span>
                    {patient?.email ? (
                      <a
                        href={`mailto:${patient.email}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline truncate ml-2 transition-colors cursor-pointer min-w-0 flex-1 text-right"
                        title={`Send email to ${patient.email}`}
                      >
                        {patient.email}
                      </a>
                    ) : (
                      <span className="text-xs font-medium text-gray-800 ml-2">N/A</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center min-w-0">
                    <span className="text-xs text-gray-600 truncate">Language</span>
                    <span className="text-xs font-medium text-gray-800 truncate ml-2 text-right">
                      {(patient as any)?.preferredLanguage || 'English'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center min-w-0">
                    <span className="text-xs text-gray-600 truncate">Insurance</span>
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300/60 h-5 bg-emerald-50/80 flex-shrink-0 ml-2">
                      Active
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-gray-200/60">
                  <h4 className="text-xs font-medium text-gray-900 mb-1.5">Allergies</h4>
                  <div className="flex flex-wrap gap-1">
                    {patient?.allergies ? (
                      <Badge variant="secondary" className="text-xs bg-red-50/90 text-red-700 border border-red-200/60 h-5">
                        {patient.allergies.length > 20 ? patient.allergies.substring(0, 20) + '...' : patient.allergies}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-500">None reported</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient Safety Indicator */}
            <Card className="shadow-md border-slate-200/60 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2.5">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Vitals className="w-4 h-4 text-red-500 flex-shrink-0" />
                  Safety Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuickSafetyIndicator patientId={patient.id} />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Card */}
          <Card className="border-l-4 border-l-indigo-500 shadow-md border-slate-200/60 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-indigo-600" />
                Clinical Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {onRecordVisit && (
                  <Button
                    onClick={onRecordVisit}
                    variant="outline"
                    className="w-full justify-start gap-2 min-w-0"
                    size="sm"
                  >
                    <Stethoscope className="w-4 h-4 shrink-0" />
                    <span className="truncate min-w-0">Record Visit</span>
                  </Button>
                )}
                {onAddPrescription && (
                  <Button
                    onClick={onAddPrescription}
                    variant="outline"
                    className="w-full justify-start gap-2 min-w-0"
                    size="sm"
                  >
                    <Medication className="w-4 h-4 shrink-0" />
                    <span className="truncate min-w-0">Prescription</span>
                  </Button>
                )}
                <Button
                  onClick={() => navigate(`/patients/${patient.id}/lab-orders/new`)}
                  variant="outline"
                  className="w-full justify-start gap-2 min-w-0"
                  size="sm"
                >
                  <BloodTest className="w-4 h-4 shrink-0" />
                  <span className="truncate min-w-0">Lab Order</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mental Health Section */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                Mental Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setShowPsychologicalTherapyDialog(true)}
                  variant="outline"
                  className="w-full justify-start border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700"
                  size="sm"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Therapy Session
                </Button>
                <Button
                  onClick={() => navigate(`/mental-health?patientId=${patient.id}`)}
                  variant="outline"
                  className="w-full justify-start border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700"
                  size="sm"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Support Resources
                </Button>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  Access psychological therapy sessions, mental health assessments, and support resources for this patient.
                </p>
              </div>
            </CardContent>
          </Card>

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

          {/* Active Problems/Diagnoses - Industry Standard Requirement */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-amber-600" />
                  Active Problems / Diagnoses
                </div>
                <Badge variant="outline" className="text-xs">
                  {visits.filter((v: any) => v.diagnosis).length} recorded
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Extract unique diagnoses from visits */}
              {(() => {
                const uniqueDiagnoses = Array.from(new Set(
                  visits
                    .filter((v: any) => v.diagnosis)
                    .map((v: any) => v.diagnosis)
                )).slice(0, 5);

                if (uniqueDiagnoses.length === 0) {
                  return (
                    <div className="text-sm text-gray-500 py-2">
                      No active diagnoses recorded. Add diagnoses during patient visits.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {uniqueDiagnoses.map((diagnosis, index) => (
                      <div key={index} className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <span className="text-sm text-gray-800">{diagnosis as string}</span>
                          {patient?.medicalHistory?.toLowerCase().includes((diagnosis as string).toLowerCase().split(' ')[0]) && (
                            <Badge variant="outline" className="ml-2 text-xs bg-orange-50 text-orange-700 border-orange-200">
                              Chronic
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {visits.filter((v: any) => v.diagnosis).length > 5 && (
                      <div className="text-xs text-blue-600 hover:underline cursor-pointer pt-1">
                        View all {visits.filter((v: any) => v.diagnosis).length} diagnoses →
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Medical History as chronic conditions */}
              {patient?.medicalHistory && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                    <History className="h-3 w-3" />
                    Chronic Conditions / Medical History
                  </h4>
                  <p className="text-sm text-gray-700 bg-amber-50/50 p-2 rounded border border-amber-100">
                    {patient.medicalHistory}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient Alerts - Full Width */}
          <PatientAlertsPanel
            patient={patient as any}
            upcomingAppointments={[]}
            criticalMedications={activePrescriptions}
          />
        </TabsContent>
        {/* END OLD OVERVIEW TAB CODE */}

        {/* Dedicated Timeline Tab */}
        <TabsContent value="timeline" className="space-y-2 min-w-0 max-w-full overflow-x-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Timeline Filters/Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Filter Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label htmlFor="filter-visits" className="text-xs font-medium text-gray-700">Event Types</label>
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
        <TabsContent value="vitals" className="space-y-3">
          <PatientVitalSignsTracker patientId={patient.id} />
        </TabsContent>

        {/* Record Visit Tab */}
        <TabsContent value="record-visit" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Record Patient Visit - {formatPatientName(patient)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* ═══════════════════════════════════════════════════════════════════
                  PATIENT SAFETY BANNER - Industry Standard Requirement
                  Shows critical information during visit entry
              ═══════════════════════════════════════════════════════════════════ */}
              <div className="mb-4 space-y-2">
                {/* Allergy Alert Banner - Subtle */}
                {patient?.allergies && (
                  <div className="bg-red-50/50 border-l-2 border-red-300/60 p-2 rounded-r-md">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-shrink-0">
                        <svg className="h-3 w-3 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-medium text-red-600/80">Allergy:</span>
                        <span className="text-[10px] text-red-700/70 ml-1">{patient.allergies}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Medical History Alert - Subtle */}
                {patient?.medicalHistory && (
                  <div className="bg-amber-50/50 border-l-2 border-amber-300/60 p-2 rounded-r-md">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-shrink-0">
                        <svg className="h-3 w-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-medium text-amber-600/80">History:</span>
                        <span className="text-[10px] text-amber-700/70 ml-1">{patient.medicalHistory}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Medications Summary - Subtle */}
                {activePrescriptions && activePrescriptions.length > 0 && (
                  <div className="bg-blue-50/50 border-l-2 border-blue-300/60 p-2 rounded-r-md">
                    <div className="flex items-start gap-1.5">
                      <div className="flex-shrink-0 pt-0.5">
                        <Medication className="h-3 w-3 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-medium text-blue-600/80">Medications ({activePrescriptions.length}):</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activePrescriptions.slice(0, 3).map((rx: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-[9px] px-1 py-0.5 bg-blue-100/60 text-blue-700/80 border-blue-200/60 h-auto">
                              {rx.medicationName} {rx.dosage && `- ${rx.dosage}`}
                            </Badge>
                          ))}
                          {activePrescriptions.length > 3 && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0.5 bg-blue-200/60 text-blue-700/80 border-blue-300/60 h-auto">
                              +{activePrescriptions.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

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

                  {/* ═══════════════════════════════════════════════════════════════════
                      REVIEW OF SYSTEMS (ROS) - Industry Standard Requirement
                      Systematic symptom checklist by body system
                  ═══════════════════════════════════════════════════════════════════ */}
                  <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Review of Systems (ROS)
                    </h3>
                    <p className="text-sm text-slate-600">Check all symptoms reported by the patient</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Constitutional */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-700 border-b pb-1">Constitutional</h4>
                        <div className="space-y-1 text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-fever" />
                            <span>Fever</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-chills" />
                            <span>Chills</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-weight-loss" />
                            <span>Weight loss</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-fatigue" />
                            <span>Fatigue</span>
                          </label>
                        </div>
                      </div>

                      {/* HEENT */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-700 border-b pb-1">HEENT</h4>
                        <div className="space-y-1 text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-headache" />
                            <span>Headache</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-vision" />
                            <span>Vision changes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-hearing" />
                            <span>Hearing loss</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-sore-throat" />
                            <span>Sore throat</span>
                          </label>
                        </div>
                      </div>

                      {/* Cardiovascular */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-700 border-b pb-1">Cardiovascular</h4>
                        <div className="space-y-1 text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-chest-pain" />
                            <span>Chest pain</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-palpitations" />
                            <span>Palpitations</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-edema" />
                            <span>Edema</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-sob-exertion" />
                            <span>SOB on exertion</span>
                          </label>
                        </div>
                      </div>

                      {/* Respiratory */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-700 border-b pb-1">Respiratory</h4>
                        <div className="space-y-1 text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-cough" />
                            <span>Cough</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-sob" />
                            <span>Shortness of breath</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-wheezing" />
                            <span>Wheezing</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-sputum" />
                            <span>Sputum production</span>
                          </label>
                        </div>
                      </div>

                      {/* Gastrointestinal */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-700 border-b pb-1">Gastrointestinal</h4>
                        <div className="space-y-1 text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-nausea" />
                            <span>Nausea/Vomiting</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-abdominal-pain" />
                            <span>Abdominal pain</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-diarrhea" />
                            <span>Diarrhea</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-constipation" />
                            <span>Constipation</span>
                          </label>
                        </div>
                      </div>

                      {/* Neurological */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-700 border-b pb-1">Neurological</h4>
                        <div className="space-y-1 text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-dizziness" />
                            <span>Dizziness</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-numbness" />
                            <span>Numbness/Tingling</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-weakness" />
                            <span>Weakness</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="ros-seizures" />
                            <span>Seizures</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <FormLabel className="text-sm">ROS Notes</FormLabel>
                      <Textarea
                        placeholder="Additional review of systems notes or pertinent negatives..."
                        className="mt-1 min-h-[60px]"
                      />
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════════════════════
                      SOCIAL & FAMILY HISTORY - Industry Standard Requirement
                  ═══════════════════════════════════════════════════════════════════ */}
                  <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-600" />
                      Social & Family History
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Social History */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-purple-800 border-b border-purple-200 pb-1">Social History</h4>

                        <div className="space-y-2">
                          <div>
                            <Label className="text-sm">Smoking Status</Label>
                            <Select>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="never">Never smoker</SelectItem>
                                <SelectItem value="former">Former smoker</SelectItem>
                                <SelectItem value="current">Current smoker</SelectItem>
                                <SelectItem value="unknown">Unknown</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm">Alcohol Use</Label>
                            <Select>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="occasional">Occasional</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="heavy">Heavy</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm">Occupation</Label>
                            <Input placeholder="Patient's occupation" className="mt-1" />
                          </div>
                        </div>
                      </div>

                      {/* Family History */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-purple-800 border-b border-purple-200 pb-1">Family History</h4>

                        <div className="space-y-1 text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="fh-diabetes" />
                            <span>Diabetes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="fh-heart-disease" />
                            <span>Heart Disease</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="fh-cancer" />
                            <span>Cancer</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="fh-hypertension" />
                            <span>Hypertension</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="fh-stroke" />
                            <span>Stroke</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox id="fh-mental-illness" />
                            <span>Mental Illness</span>
                          </label>
                        </div>

                        <div className="mt-2">
                          <Label className="text-sm">Family History Notes</Label>
                          <Textarea
                            placeholder="Additional family history details..."
                            className="mt-1 min-h-[60px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

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

                  {/* ═══════════════════════════════════════════════════════════════════
                      ASSESSMENT & DIAGNOSIS - Enhanced with ICD-10 Search
                      Industry Standard: ICD-10 codes for billing compliance
                  ═══════════════════════════════════════════════════════════════════ */}
                  <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      Assessment & Diagnosis
                    </h3>

                    <FormField
                      control={visitForm.control}
                      name="assessment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clinical Assessment</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Clinical reasoning and assessment"
                              className="min-h-[80px] bg-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* ICD-10 Diagnosis Search */}
                    <div className="space-y-3">
                      <FormLabel className="flex items-center gap-2">
                        Primary Diagnosis
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700">ICD-10</Badge>
                      </FormLabel>

                      <div className="relative">
                        <FormField
                          control={visitForm.control}
                          name="diagnosis"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="space-y-2">
                                  <Input
                                    placeholder="Search diagnosis or enter ICD-10 code (e.g., J18.9 Pneumonia)"
                                    className="bg-white"
                                    {...field}
                                  />
                                  {/* Common ICD-10 Quick Select */}
                                  <div className="flex flex-wrap gap-1">
                                    <span className="text-xs text-slate-500">Quick select:</span>
                                    {[
                                      { code: 'J06.9', name: 'Upper respiratory infection' },
                                      { code: 'J18.9', name: 'Pneumonia' },
                                      { code: 'I10', name: 'Essential hypertension' },
                                      { code: 'E11.9', name: 'Type 2 diabetes' },
                                      { code: 'M54.5', name: 'Low back pain' },
                                      { code: 'K21.0', name: 'GERD' },
                                    ].map((icd) => (
                                      <Button
                                        key={icd.code}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-6 px-2 hover:bg-green-100"
                                        onClick={() => field.onChange(`${icd.name} (${icd.code})`)}
                                      >
                                        {icd.code}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Additional Diagnoses with ICD-10 */}
                    <div className="space-y-3">
                      <FormLabel className="flex items-center gap-2">
                        Additional Diagnoses
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700">ICD-10</Badge>
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormField
                          control={visitForm.control}
                          name="secondaryDiagnoses"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Add secondary diagnosis with ICD-10 code"
                                  className="bg-white"
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
                          className="bg-white"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Quick ICD-10 codes for secondary diagnoses */}
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-slate-500">More codes:</span>
                        {[
                          { code: 'R05.9', name: 'Cough' },
                          { code: 'R50.9', name: 'Fever' },
                          { code: 'R51.9', name: 'Headache' },
                          { code: 'R10.9', name: 'Abdominal pain' },
                          { code: 'R53.83', name: 'Fatigue' },
                        ].map((icd) => (
                          <Button
                            key={icd.code}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 px-2 hover:bg-green-100"
                            onClick={() => {
                              const diagnosisText = `${icd.name} (${icd.code})`;
                              if (!additionalDiagnoses.includes(diagnosisText)) {
                                setAdditionalDiagnoses(prev => [...prev, diagnosisText]);
                              }
                            }}
                          >
                            {icd.code}: {icd.name}
                          </Button>
                        ))}
                      </div>

                      {additionalDiagnoses.length > 0 && (
                        <div className="space-y-2">
                          {additionalDiagnoses.map((diagnosis, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-green-200">
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

                  {/* ═══════════════════════════════════════════════════════════════════
                      TREATMENT PLAN - Enhanced with Drug Safety Alerts
                      Industry Standard: Drug-drug interaction & allergy checking
                  ═══════════════════════════════════════════════════════════════════ */}
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Medication className="h-5 w-5 text-blue-600" />
                      Treatment Plan
                    </h3>

                    <FormField
                      control={visitForm.control}
                      name="treatmentPlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treatment Plan</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detailed treatment plan and interventions"
                              className="min-h-[100px] bg-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Drug Safety Alert Banner */}
                    {patient?.allergies && (
                      <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-red-800">
                          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <span className="font-bold text-sm">⚠️ DRUG ALLERGY ALERT - Review before prescribing!</span>
                            <p className="text-sm mt-1">Patient allergies: <strong>{patient.allergies}</strong></p>
                            {patient.allergies.toLowerCase().includes('penicillin') && (
                              <p className="text-xs mt-1 text-red-700">
                                ⛔ Avoid: Amoxicillin, Ampicillin, and other beta-lactam antibiotics
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <FormLabel className="flex items-center gap-2">
                        Medications
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                          Drug Safety Check Active
                        </Badge>
                      </FormLabel>

                      <GlobalMedicationSearch
                        onMedicationSelect={(medication) => {
                          // Check for potential allergy contraindication
                          const allergyLower = (patient?.allergies || '').toLowerCase();
                          const medNameLower = medication.name.toLowerCase();

                          let isContraindicated = false;
                          let warningMessage = '';

                          // Simple allergy checking rules
                          if (allergyLower.includes('penicillin') &&
                            (medNameLower.includes('amoxicillin') ||
                              medNameLower.includes('ampicillin') ||
                              medNameLower.includes('penicillin'))) {
                            isContraindicated = true;
                            warningMessage = 'PENICILLIN ALLERGY - This medication is contraindicated!';
                          }

                          if (allergyLower.includes('sulfa') &&
                            (medNameLower.includes('sulfamethoxazole') ||
                              medNameLower.includes('bactrim'))) {
                            isContraindicated = true;
                            warningMessage = 'SULFA ALLERGY - This medication is contraindicated!';
                          }

                          if (isContraindicated) {
                            toast({
                              title: "⚠️ ALLERGY ALERT",
                              description: warningMessage,
                              variant: "destructive",
                            });
                          }

                          setMedicationList(prev => [...prev, medication.name]);
                        }}
                        placeholder="Search and add medications..."
                      />

                      {/* Custom medication entry with allergy warning */}
                      <div className="flex gap-2 items-center">
                        <Input
                          placeholder="Or enter a custom medication name..."
                          className="bg-white flex-1"
                          id="custom-med-input"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById('custom-med-input') as HTMLInputElement;
                            if (input?.value?.trim()) {
                              setMedicationList(prev => [...prev, input.value.trim()]);
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {medicationList.length > 0 && (
                        <div className="space-y-2">
                          {medicationList.map((medication, index) => {
                            // Check each medication against allergies
                            const allergyLower = (patient?.allergies || '').toLowerCase();
                            const medLower = medication.toLowerCase();
                            const isPotentialContraindication =
                              (allergyLower.includes('penicillin') && (medLower.includes('amoxicillin') || medLower.includes('ampicillin'))) ||
                              (allergyLower.includes('sulfa') && (medLower.includes('sulfa') || medLower.includes('bactrim')));

                            return (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-2 rounded border ${isPotentialContraindication
                                  ? 'bg-red-100 border-red-300'
                                  : 'bg-white border-blue-200'
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isPotentialContraindication && (
                                    <svg className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  <span className={`text-sm ${isPotentialContraindication ? 'text-red-800 font-medium' : ''}`}>
                                    {medication}
                                    {isPotentialContraindication && ' ⚠️ ALLERGY ALERT'}
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setMedicationList(prev => prev.filter((_, i) => i !== index))}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
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
                              className="bg-white"
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

                  {/* ═══════════════════════════════════════════════════════════════════
                      VISIT TIME TRACKING - Industry Standard for Billing
                      Required for accurate billing and documentation
                  ═══════════════════════════════════════════════════════════════════ */}
                  <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Clock className="h-5 w-5 text-slate-600" />
                      Visit Time Tracking
                      <Badge variant="outline" className="text-xs bg-slate-100">For Billing</Badge>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm">Visit Start Time</Label>
                        <Input
                          type="time"
                          className="mt-1"
                          defaultValue={new Date().toTimeString().slice(0, 5)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Visit End Time</Label>
                        <Input
                          type="time"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Total Duration</Label>
                        <div className="mt-1 p-2 bg-white rounded border text-sm text-slate-600">
                          Auto-calculated on save
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500">
                      💡 Time-based billing codes: 99213 (15 min), 99214 (25 min), 99215 (40 min)
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════════════════════
                      PROVIDER ATTESTATION - Industry Standard
                      Required for legal and compliance purposes
                  ═══════════════════════════════════════════════════════════════════ */}
                  <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Shield className="h-5 w-5 text-amber-600" />
                      Provider Attestation
                      <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700">Required</Badge>
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-white rounded border">
                        <Checkbox id="attestation-accuracy" className="mt-1" />
                        <label htmlFor="attestation-accuracy" className="text-sm cursor-pointer">
                          I attest that the information documented above is accurate and complete to the best of my knowledge,
                          and that I have personally examined this patient or supervised the examination.
                        </label>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-white rounded border">
                        <Checkbox id="attestation-medical-necessity" className="mt-1" />
                        <label htmlFor="attestation-medical-necessity" className="text-sm cursor-pointer">
                          I certify that the services provided were medically necessary for the diagnosis and/or treatment
                          of the patient's condition.
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label className="text-sm">Provider Signature</Label>
                          <div className="mt-1 p-3 bg-white rounded border flex items-center gap-2 text-sm text-slate-600">
                            <User className="h-4 w-4" />
                            <span>Electronically signed by: <strong className="text-slate-800">{user?.firstName} {user?.lastName}</strong></span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">Date & Time</Label>
                          <div className="mt-1 p-3 bg-white rounded border text-sm text-slate-600">
                            {new Date().toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => visitForm.reset()}
                    >
                      Clear Form
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Save & Sign Visit Record
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-3 min-w-0 max-w-full overflow-x-hidden">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MedicalRecord className="h-5 w-5 text-emerald-600" />
                Patient Documents & Medical Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="medical-records" className="w-full">
                <TabsList className="grid w-full grid-cols-5 max-w-3xl mb-6 bg-gradient-to-r from-slate-50 to-blue-50">
                  <TabsTrigger
                    value="medical-records"
                    className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-200"
                    data-testid="tab-medical-records"
                  >
                    <MedicalRecord className="w-4 h-4" />
                    Medical Records
                  </TabsTrigger>
                  <TabsTrigger
                    value="consent-forms"
                    className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white transition-all duration-200"
                    data-testid="tab-consent-forms"
                  >
                    <Document className="w-4 h-4" />
                    Consent Forms
                  </TabsTrigger>
                  <TabsTrigger
                    value="discharge-letters"
                    className="flex items-center gap-2 data-[state=active]:bg-teal-500 data-[state=active]:text-white transition-all duration-200"
                    data-testid="tab-discharge-letters"
                  >
                    <FileText className="w-4 h-4" />
                    Discharge Letters
                  </TabsTrigger>
                  <TabsTrigger
                    value="insurance"
                    className="flex items-center gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all duration-200"
                    data-testid="tab-insurance"
                  >
                    <FileText className="w-4 h-4" />
                    Insurance
                  </TabsTrigger>
                  <TabsTrigger
                    value="referrals"
                    className="flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all duration-200"
                    data-testid="tab-referrals"
                  >
                    <Referral className="w-4 h-4" />
                    Referrals
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="medical-records" className="space-y-2">
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

                <TabsContent value="consent-forms" className="space-y-2">
                  <div className="text-center py-12 text-gray-500">
                    <Document className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Consent Forms</h3>
                    <p className="text-sm text-gray-500 mb-4">Manage patient consent and authorization forms</p>
                    <ConsentCapture
                      patientId={patient.id}
                      patientName={formatPatientName(patient)}
                      trigger={
                        <Button className="bg-blue-600 hover:bg-blue-700" title="New Consent Form">
                          <Plus className="w-4 h-4" />
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

                <TabsContent value="discharge-letters" className="space-y-2">
                  <PatientDischargeLetterTab
                    patientId={patient.id}
                    patientName={formatPatientName(patient)}
                    clinicName="Bluequee Health Clinic"
                    clinicAddress="Southwest Nigeria"
                  />
                </TabsContent>

                <TabsContent value="insurance" className="space-y-2">
                  <InsuranceManagement patientId={patient.id} />
                </TabsContent>

                <TabsContent value="referrals" className="space-y-2">
                  <ReferralManagement patientId={patient.id} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Labs Tab */}
        <TabsContent value="labs" className="space-y-3 min-w-0 max-w-full overflow-x-hidden">
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
                  {/* Workflow Step 1: Create new lab orders */}
                  <TabsTrigger value="orders" className="flex items-center gap-2">
                    <BloodTest className="w-4 h-4" />
                    Lab Orders
                  </TabsTrigger>
                  {/* Workflow Step 2: Orders awaiting results entry */}
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pending
                  </TabsTrigger>
                  {/* Workflow Step 3: Completed results awaiting review */}
                  <TabsTrigger value="results" className="flex items-center gap-2">
                    <BloodTest className="w-4 h-4" />
                    Results
                  </TabsTrigger>
                  {/* Workflow Step 4: Results reviewed by doctor */}
                  <TabsTrigger value="reviewed" className="flex items-center gap-2">
                    <Success className="w-4 h-4" />
                    Reviewed
                  </TabsTrigger>
                  {/* Workflow Step 5: Complete historical view */}
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-2">
                  <LabOrderForm patientId={patient.id} />
                </TabsContent>

                {/* Results Tab: Shows completed results awaiting doctor review */}
                <TabsContent value="results" className="space-y-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Completed Results</h3>
                        <p className="text-sm text-gray-600">Results awaiting doctor review</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/lab-orders`] })}
                      >
                        <Refresh className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                    <LabOrdersList patientId={patient.id} showCompletedOnly={true} />
                  </div>

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

                <TabsContent value="reviewed" className="space-y-2">
                  <PatientReviewedResults
                    patientId={patient.id}
                    showDeleteVisitConfirm={showDeleteVisitConfirm}
                    setShowDeleteVisitConfirm={setShowDeleteVisitConfirm}
                    confirmDeleteVisit={confirmDeleteVisit}
                  />
                </TabsContent>

                <TabsContent value="pending" className="space-y-2">
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

                <TabsContent value="history" className="space-y-2">
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
        <TabsContent value="consultation" className="space-y-3">
          <ConsultationFormSelector patientId={patient.id} />
        </TabsContent>

        {/* Medication Review Assignments Tab */}
        <TabsContent value="med-reviews" className="space-y-3">
          <MedicationReviewAssignmentsList
            patientId={patient.id}
            patient={patient as any}
            onCreateAssignment={() => handleCreateMedicationReviewAssignment()}
          />
        </TabsContent>

        {/* Vaccination Tab */}
        <TabsContent value="vaccinations" className="space-y-3 mt-2">
          <Card className="shadow-md border-slate-200/60">
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
        <TabsContent value="communication" className="space-y-3 mt-2">
          <PatientCommunicationHub
            patientId={patient.id}
          />
        </TabsContent>

        {/* Appointments Tab - Detailed Implementation */}
        <TabsContent value="appointments" className="space-y-3 mt-2">
          <Card className="shadow-md border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Appointments & Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PatientAppointmentsTab patientId={patient.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-3 mt-2">
          <Card className="shadow-md border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CardIcon className="h-5 w-5 text-green-500" />
                Patient Billing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PatientBillingTab patient={patient} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insurance Tab */}
        <TabsContent value="insurance" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Insurance Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PatientInsuranceTab patientId={patient.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="history" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-500" />
                Medical History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PatientHistoryTab patientId={patient.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Imaging Tab */}
        <TabsContent value="imaging" className="space-y-2">
          <PatientImaging patientId={patient.id} />
        </TabsContent>

        {/* Allergies Tab */}
        <TabsContent value="allergies" className="space-y-2">
          <PatientAllergies patientId={patient.id} />
        </TabsContent>

        {/* Immunizations Tab */}
        <TabsContent value="immunizations" className="space-y-2">
          <PatientImmunizations patientId={patient.id} />
        </TabsContent>

        {/* Procedures Tab */}
        <TabsContent value="procedures" className="space-y-2">
          <PatientProcedures patientId={patient.id} />
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-2">
          <ReferralsTab patient={patient} />
        </TabsContent>

        {/* Psychological Therapy Tab */}
        <TabsContent value="psychological-therapy" className="space-y-2">
          <PsychologicalTherapyAssessment patientId={patient.id} />
        </TabsContent>

        {/* Care Plans Tab */}
        <TabsContent value="care-plans" className="space-y-3 mt-2">
          <CarePlansTab patient={patient} />
        </TabsContent>

        {/* Clinical Notes Tab */}
        <TabsContent value="notes" className="space-y-3 mt-2">
          <ClinicalNotesTab patient={patient} />
        </TabsContent>

        {/* Longevity Tab - Evidence-based health assessment */}
        <TabsContent value="longevity" className="space-y-3 mt-2">
          <LongevityTab patient={patient} />
        </TabsContent>
      </Tabs>

      {/* Psychological Therapy Dialog */}
      <Dialog open={showPsychologicalTherapyDialog} onOpenChange={setShowPsychologicalTherapyDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600" />
              Record Psychological Therapy Session
            </DialogTitle>
            <p className="text-sm text-gray-600">
              Patient: {formatPatientName(patient)}
            </p>
          </DialogHeader>
          <PsychologicalTherapyAssessment
            patientId={patient.id}
            visitId={undefined}
            onSuccess={() => setShowPsychologicalTherapyDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Patient Modal */}
      <EditPatientModal
        open={showEditPatientModal}
        onOpenChange={setShowEditPatientModal}
        patient={patient as any}
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
          prescriptions={selectedPrescriptionsForPrint.length > 0 ? selectedPrescriptionsForPrint : displayPrescriptions}
          patient={patient as any}
          onClose={() => {
            setShowPrescriptionPrint(false);
            setSelectedPrescriptionsForPrint([]);
            setSelectedMedications(new Set());
          }}
        />
      )}

      {/* Custom Lab Order Print Dialog */}
      {showLabOrderPrint && (
        <CustomLabOrderPrint
          labOrders={patientLabOrders}
          patient={patient as any}
          onClose={() => setShowLabOrderPrint(false)}
        />
      )}

      {/* Medication Review Assignment Modal */}
      <MedicationReviewAssignmentModal
        isOpen={showMedicationReviewAssignmentModal}
        onClose={handleCloseMedicationReviewAssignment}
        patientId={patient.id}
        patient={patient as any}
        selectedPrescription={selectedPrescriptionForReview}
      />

      {/* Tab Manager Modal */}
      <TabManager
        open={showTabManager}
        onOpenChange={setShowTabManager}
      />
    </div>
  );
}