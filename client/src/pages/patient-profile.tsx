import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { AlertCircle, Edit, Stethoscope, Pill, FlaskRound, Plus, History, Printer, CheckCircle, Download, Eye, ClipboardCheck, TestTube, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import VisitRecordingModal from "@/components/visit-recording-modal";
import LabResultModal from "@/components/lab-result-modal";
import PrescriptionModal from "@/components/prescription-modal";
import PsychologicalTherapyAssessment from "@/components/psychological-therapy-assessment";
import { PatientSummaryPrintable } from "@/components/patient-summary-printable";
import { ModernPatientOverview } from "@/components/modern-patient-overview";
import { FloatingActionMenu } from "@/components/floating-action-menu";
import { EditPatientModal } from "@/components/edit-patient-modal";
import { useRole } from "@/components/role-guard";
import { formatPatientName, getPatientInitials } from "@/lib/patient-utils";
import { formatDate, formatDateOfBirth, formatDateMedium, calculateAge } from "@/lib/date-utils";
import { LetterheadService } from "@/services/letterhead-service";
import type { Patient, Visit, LabResultFromOrder, Prescription, Organization } from "@shared/schema";

export default function PatientProfile() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id ? parseInt(params.id) : undefined;
  const { user } = useRole();

  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showPsychologicalTherapyDialog, setShowPsychologicalTherapyDialog] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);

  const queryClient = useQueryClient();

  // PatientReviewedResults component for displaying reviewed lab results for a specific patient
  interface CompletedLabResult {
    id: number;
    orderId: number;
    patientName: string;
    testName: string;
    result: string;
    normalRange: string;
    status: 'normal' | 'abnormal' | 'critical';
    completedDate: string;
    reviewedBy: string;
    category: string;
    units?: string;
    remarks?: string;
  }

  function PatientReviewedResults({ patientId }: { patientId: number }) {
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
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

    // Results are already filtered by patient ID in the backend
    const patientResults = Array.isArray(reviewedResults) ? reviewedResults : [];

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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-lg">{result.testName}</h4>
                        <p className="text-sm text-gray-600">{result.category}</p>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Result:</span>
                        <p className="font-semibold text-lg">{result.result} {result.units || ''}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Normal Range:</span>
                        <p className="text-sm text-gray-700">{result.normalRange}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Completed:</span>
                        <p>{formatDateMedium(result.completedDate)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Reviewed By:</span>
                        <p className="text-sm">{result.reviewedBy}</p>
                      </div>
                    </div>

                    {result.remarks && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">Remarks:</span>
                        <p className="mt-1 text-gray-700">{result.remarks}</p>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-muted-foreground">
                      Order #{result.orderId} • Completed {formatDateMedium(result.completedDate)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Generate lab result print content with organization letterhead
                        const printContent = generateLabResultPrintContent(result, patient);
                        const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
                        if (printWindow) {
                          printWindow.document.write(printContent);
                          printWindow.document.close();
                          printWindow.focus();
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Preview & Print
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // View result details
                        const printContent = generateLabResultPrintContent(result, patient);
                        const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
                        if (printWindow) {
                          printWindow.document.write(printContent);
                          printWindow.document.close();
                          printWindow.focus();
                        }
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Generate lab result print content with organization letterhead
  const generateLabResultPrintContent = (result: CompletedLabResult, patient: Patient | undefined) => {
    if (!patient) return '';

    // Use the organization data from the system
    const organization = {
      id: 4,
      name: 'Enugu Health Center',
      type: 'health_center',
      themeColor: '#3B82F6',
      address: 'Enugu State, Nigeria',
      phone: '+234-XXX-XXX-XXXX',
      email: 'info@enuguhealth.ng',
      website: 'www.enuguhealth.ng'
    };

    // Transform result to match expected format
    const labResult = {
      ...result,
      patientName: `${patient.title} ${patient.firstName} ${patient.lastName}`,
      notes: result.remarks
    };

    return LetterheadService.generateLabResultHTML(organization, labResult);
  };

  // PendingLabOrders component for managing pending lab orders
  function PendingLabOrders({ labOrders, labOrdersLoading, onProcessResult }: {
    labOrders: any[];
    labOrdersLoading: boolean;
    onProcessResult: (orderItem: any) => void;
  }) {
    const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

    // Fetch lab order items for expanded orders
    const { data: labOrderItems = {} } = useQuery({
      queryKey: ['lab-order-items', Array.from(expandedOrders)],
      queryFn: async () => {
        const items: any = {};
        for (const orderId of expandedOrders) {
          const response = await fetch(`/api/lab-orders/${orderId}/items`);
          if (response.ok) {
            items[orderId] = await response.json();
          }
        }
        return items;
      },
      enabled: expandedOrders.size > 0,
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

    const toggleOrder = (orderId: number) => {
      const newExpanded = new Set(expandedOrders);
      if (newExpanded.has(orderId)) {
        newExpanded.delete(orderId);
      } else {
        newExpanded.add(orderId);
      }
      setExpandedOrders(newExpanded);
    };

    if (labOrdersLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      );
    }

    if (!labOrders || labOrders.length === 0) {
      return (
        <div className="text-center py-8">
          <History className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-sm font-medium text-slate-900">No pending orders</h3>
          <p className="mt-2 text-sm text-slate-500">All lab orders have been completed.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {labOrders.map((order) => {
          const isExpanded = expandedOrders.has(order.id);
          const orderItems = labOrderItems[order.id] || [];

          return (
            <div key={order.id} className="border border-amber-200 bg-amber-50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-800">Lab Order #{order.id}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOrder(order.id)}
                      className="ml-2"
                    >
                      {isExpanded ? 'Hide Tests' : 'Show Tests'}
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    <strong>Ordered:</strong> {formatDateMedium(order.createdAt)}
                  </p>
                  <p className="text-sm text-slate-600">
                    <strong>Status:</strong> {order.status}
                  </p>
                </div>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                  Pending
                </Badge>
              </div>

              {isExpanded && (
                <div className="mt-4 border-t border-amber-200 pt-4">
                  <h5 className="font-medium text-slate-700 mb-3">Ordered Tests</h5>
                  {orderItems.length > 0 ? (
                    <div className="space-y-3">
                      {orderItems.map((item: any) => (
                        <div key={item.id} className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h6 className="font-medium text-slate-800">{item.testName}</h6>
                              <p className="text-sm text-slate-600">Category: {item.category}</p>
                              <p className="text-sm text-slate-500">Test ID: {item.labTestId}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                Awaiting Results
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => onProcessResult(item)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <ClipboardCheck className="mr-1 h-3 w-3" />
                                Add Result
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No test items found</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Lab Result Input Modal for adding FBC and other test results
  function LabResultInputModal({
    isOpen,
    onClose,
    orderItem,
    onSubmit
  }: {
    isOpen: boolean;
    onClose: () => void;
    orderItem: any;
    onSubmit: (data: any) => void;
  }) {
    const [result, setResult] = useState("");
    const [status, setStatus] = useState("normal");
    const [remarks, setRemarks] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!result.trim()) return;

      setIsSubmitting(true);
      try {
        await onSubmit({
          itemId: orderItem?.id,
          result: result.trim(),
          status,
          remarks: remarks.trim(),
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const resetForm = () => {
      setResult("");
      setStatus("normal");
      setRemarks("");
    };

    if (!orderItem) return null;

    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <TestTube className="mr-2 h-5 w-5 text-blue-600" />
              Add Lab Result - {orderItem.testName}
            </DialogTitle>
          </DialogHeader>

          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900">{orderItem.testName}</h4>
            <p className="text-sm text-blue-700">Category: {orderItem.category}</p>
            <p className="text-sm text-blue-700">Test ID: {orderItem.labTestId}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="result" className="text-sm font-medium">
                Test Result Value *
              </Label>
              <Input
                id="result"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="Enter the FBC result values"
                className="mt-1"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Example: "WBC: 7.2, RBC: 4.5, Hgb: 14.2, Hct: 42.1, PLT: 250"
              </p>
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-medium">
                Result Status *
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">
                    <span className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Normal - Within reference range
                    </span>
                  </SelectItem>
                  <SelectItem value="abnormal">
                    <span className="flex items-center">
                      <AlertCircle className="mr-2 h-4 w-4 text-yellow-600" />
                      Abnormal - Outside reference range
                    </span>
                  </SelectItem>
                  <SelectItem value="critical">
                    <span className="flex items-center">
                      <AlertCircle className="mr-2 h-4 w-4 text-red-600" />
                      Critical - Requires immediate attention
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="remarks" className="text-sm font-medium">
                Clinical Remarks (Optional)
              </Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any clinical observations or notes"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-600">
                <strong>Next Step:</strong> After saving, this result will move to "Ready for Review"
                status where a doctor, nurse, or pharmacist can review and approve it.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting || !result.trim()}
              >
                {isSubmitting ? "Saving..." : "Save Result"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Fetch patient data
  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch organization data for printable documents
  const { data: organization } = useQuery<Organization>({
    queryKey: ['/api/organizations', (user as any)?.organizationId],
    queryFn: () => fetch(`/api/organizations/${(user as any)?.organizationId}`).then(res => res.json()),
    enabled: !!(user as any)?.organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes - static data
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch visits
  const { data: visits, isLoading: visitsLoading } = useQuery<Visit[]>({
    queryKey: [`/api/patients/${patientId}/visits`],
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch lab orders for this patient
  const { data: labOrders = [], isLoading: labOrdersLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/lab-orders`],
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch prescriptions
  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery<Prescription[]>({
    queryKey: [`/api/patients/${patientId}/prescriptions`],
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Lab results using React Query (same pattern as working sidebar)
  const { data: labResults = [], isLoading: labsLoading, error: labsError } = useQuery<LabResultFromOrder[]>({
    queryKey: [`/api/patients/${patientId}/labs`],
    enabled: !!patientId,
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Mutation for adding lab results
  const addResultMutation = useMutation({
    mutationFn: async (resultData: any) => {
      const response = await fetch(`/api/lab-order-items/${resultData.itemId}/result`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultData),
      });
      if (!response.ok) {
        throw new Error('Failed to add result');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/lab-orders`] });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-results/reviewed'] });
      setShowResultModal(false);
      setSelectedOrderItem(null);
    },
  });



  // Status badge helper function
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Normal</Badge>;
      case 'abnormal':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Abnormal</Badge>;
      case 'critical':
        return <Badge variant="destructive" className="bg-red-500 text-white">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!patientId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">Invalid patient ID</h3>
          <p className="mt-2 text-sm text-slate-500">Please provide a valid patient ID.</p>
        </div>
      </div>
    );
  }

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


  const printPrescription = async (prescription: any, patient: any) => {
    try {
      const { printPrescription: printPrescriptionService } = await import('../services/print-utils');
      await printPrescriptionService(prescription, patient);
    } catch (error) {
      console.error('Failed to print prescription:', error);
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20">
      {/* Enhanced Patient Banner with Better Visual Hierarchy */}
      <header className="bg-white/95 backdrop-blur-sm shadow-md border-b border-slate-200/80 px-4 sm:px-6 py-2 sticky top-0 z-10">
        <div className="max-w-full">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Enhanced Patient Avatar with Gradient */}
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-full flex items-center justify-center ring-2 ring-primary/10 shadow-md flex-shrink-0">
              <span className="text-white font-bold text-sm sm:text-base tracking-tight">
                {getPatientInitials(patient)}
              </span>
            </div>

            {/* Patient Information - Enhanced Layout with Better Typography */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4">
                {/* Left Column: Name and Demographics - Enhanced Typography */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate tracking-tight">
                      {formatPatientName(patient)}
                    </h2>
                    {(patient as any).codeStatus && (patient as any).codeStatus !== 'full' && (
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-md flex-shrink-0 shadow-sm ${(patient as any).codeStatus === 'dnr' || (patient as any).codeStatus === 'dnr_dni'
                          ? 'bg-red-600 text-white border border-red-700'
                          : (patient as any).codeStatus === 'comfort'
                            ? 'bg-purple-600 text-white border border-purple-700'
                            : 'bg-orange-500 text-white border border-orange-600'
                        }`}>
                        {(patient as any).codeStatus.toUpperCase().replace('_', '/')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                    <span className="font-semibold text-slate-800 whitespace-nowrap">
                      DOB: <span className="font-normal text-slate-600">{formatDateOfBirth(patient.dateOfBirth)}</span>
                    </span>
                    <span className="text-slate-300 font-light">•</span>
                    <span className="text-slate-700 whitespace-nowrap font-medium">
                      {calculateAge(patient.dateOfBirth)}y {patient.gender?.charAt(0).toUpperCase()}
                    </span>
                    {(patient as any).bloodType && (
                      <>
                        <span className="text-slate-300 font-light">•</span>
                        <span className="text-red-700 font-semibold bg-red-50 border border-red-200 px-2 py-0.5 rounded-md text-xs whitespace-nowrap shadow-sm">
                          🩸 {(patient as any).bloodType}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Middle Column: Medical Record Number - Enhanced Styling */}
                <div className="flex items-center gap-2 lg:justify-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-300/60 px-3 py-1.5 rounded-lg font-bold text-slate-800 whitespace-nowrap shadow-sm">
                      MRN: HC{patient.id?.toString().padStart(6, "0")}
                    </span>
                  </div>
                </div>

                {/* Right Column: Contact Information - Enhanced with Icons */}
                <div className="flex flex-col gap-1 lg:items-end">
                  {patient?.phone && (
                    <a 
                      href={`tel:${patient.phone.replace(/\s+/g, '')}`}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-primary hover:underline transition-all duration-200 cursor-pointer whitespace-nowrap group"
                      title={`Call ${patient.phone}`}
                    >
                      <Phone className="h-4 w-4 flex-shrink-0 text-slate-500 group-hover:text-primary transition-colors" />
                      <span>{patient.phone}</span>
                    </a>
                  )}
                  {patient?.email && (
                    <a 
                      href={`mailto:${patient.email}`}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-primary hover:underline transition-all duration-200 cursor-pointer min-w-0 group"
                      title={`Send email to ${patient.email}`}
                    >
                      <Mail className="h-4 w-4 flex-shrink-0 text-slate-500 group-hover:text-primary transition-colors" />
                      <span className="truncate max-w-[200px]">{patient.email}</span>
                    </a>
                  )}
                  {(patient as any).preferredLanguage && (patient as any).preferredLanguage !== 'English' && (
                    <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-md text-xs whitespace-nowrap flex-shrink-0 shadow-sm font-medium">
                      🌐 <span className="hidden sm:inline">{(patient as any).preferredLanguage}</span>
                      <span className="sm:hidden">{(patient as any).preferredLanguage.substring(0, 3)}</span>
                      {(patient as any).interpreterNeeded && <span className="text-orange-700 hidden sm:inline">(Interpreter)</span>}
                    </span>
                  )}
                  {(patient as any).emergencyContactName && (
                    <span className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs whitespace-nowrap flex-shrink-0">
                      📞 <span className="hidden lg:inline">EC: </span>{(patient as any).emergencyContactName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Action Buttons Row with Better Spacing */}
          <div className="flex flex-wrap items-center gap-2 mt-2 lg:mt-0 lg:justify-end">
            {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowEditPatientModal(true)}
                className="text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Edit Info</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            )}

            {user?.role === 'doctor' && (
              <>
                <Button size="sm" onClick={() => setShowVisitModal(true)} className="text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                  <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Record Visit</span>
                  <span className="sm:hidden">Visit</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowPrescriptionModal(true)} className="text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200">
                  <Pill className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Add Prescription</span>
                  <span className="sm:hidden">Rx</span>
                </Button>
              </>
            )}

            {(user?.role === 'nurse' || user?.role === 'doctor') && (
              <Button variant="outline" size="sm" onClick={() => setShowLabModal(true)} className="text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200">
                <FlaskRound className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Lab Result</span>
                <span className="sm:hidden">Lab</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Enhanced Layout with Better Spacing */}
      <main className="flex-1 overflow-y-auto relative min-h-0">
        {/* Enhanced Container with Better Padding and Spacing */}
        <div className="w-full max-w-full min-w-0 h-full px-3 sm:px-4 md:px-6 py-4 sm:py-6">
          {/* Content Wrapper with Subtle Background Gradient */}
          <div className="relative w-full max-w-full min-w-0 h-full">
            {/* Main Content with Enhanced Visual Flow */}
            <div className="relative w-full max-w-full min-w-0 h-full overflow-x-hidden">
              <ModernPatientOverview
                patient={patient}
                visits={visits || []}
                recentLabs={labResults || []}
                activePrescriptions={prescriptions || []}
                onAddPrescription={() => setShowPrescriptionModal(true)}
              />
            </div>
          </div>
        </div>

        {/* Floating Action Menu */}
        <FloatingActionMenu
          onRecordVisit={() => setShowVisitModal(true)}
          onAddLabResult={() => setShowLabModal(true)}
          onAddPrescription={() => setShowPrescriptionModal(true)}
          onCreateConsultation={() => setShowVisitModal(true)}
          onRecordTherapy={() => setShowPsychologicalTherapyDialog(true)}
          userRole={user?.role || 'guest'}
        />
      </main>

      {/* Modals */}
      <VisitRecordingModal
        open={showVisitModal}
        onOpenChange={setShowVisitModal}
        patientId={patientId}
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

      <LabResultInputModal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false);
          setSelectedOrderItem(null);
        }}
        orderItem={selectedOrderItem}
        onSubmit={(data) => addResultMutation.mutate(data)}
      />

      {/* Psychological Therapy Dialog */}
      {patientId && (
        <Dialog open={showPsychologicalTherapyDialog} onOpenChange={setShowPsychologicalTherapyDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Psychological Therapy Session</DialogTitle>
              {patient && (
                <p className="text-sm text-gray-600">
                  Patient: {formatPatientName(patient)}
                </p>
              )}
            </DialogHeader>
            <PsychologicalTherapyAssessment 
              patientId={patientId}
              onSuccess={() => setShowPsychologicalTherapyDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Patient Modal */}
      {patient && (
        <EditPatientModal
          open={showEditPatientModal}
          onOpenChange={setShowEditPatientModal}
          patient={patient}
          onPatientUpdated={async () => {
            // Force refetch patient data to update the banner immediately
            await queryClient.refetchQueries({ queryKey: [`/api/patients/${patientId}`] });
            // Also invalidate the patients list for other components
            queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
          }}
        />
      )}

      {/* Hidden Printable Patient Summary */}
      <div className="hidden">
        <PatientSummaryPrintable
          patient={patient}
          visits={visits || []}
          organization={organization}
        />
      </div>
    </div>
  );
}