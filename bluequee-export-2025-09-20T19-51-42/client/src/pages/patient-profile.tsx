import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { AlertCircle, Edit, Stethoscope, Pill, FlaskRound, Plus, History, Printer, CheckCircle, Download, Eye, TestTube, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VisitRecordingModal from "@/components/visit-recording-modal";
import LabResultModal from "@/components/lab-result-modal";
import PrescriptionModal from "@/components/prescription-modal";
import { PatientSummaryPrintable } from "@/components/patient-summary-printable";
import { ModernPatientOverview } from "@/components/modern-patient-overview";
import { AdvancedPatientCare } from "@/components/advanced-patient-care";
import { FloatingActionMenu } from "@/components/floating-action-menu";
import { useRole } from "@/components/role-guard";
import { formatPatientName, getPatientInitials } from "@/lib/patient-utils";
import { LetterheadService } from "@/services/letterhead-service";
import type { Patient, Visit, LabResultFromOrder, Prescription, Organization } from "@shared/schema";

export default function PatientProfile() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id ? parseInt(params.id) : undefined;
  const { role: user } = useRole();
  
  // Debug logging for patientId
  console.log('Patient Profile Debug:', { 
    params, 
    patientId, 
    urlPath: window.location.pathname,
    patientIdType: typeof patientId 
  });

  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  
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
    }
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
                      <p>{new Date(result.completedDate).toLocaleDateString()}</p>
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
                    Order #{result.orderId} • Completed {new Date(result.completedDate).toLocaleDateString()}
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
                  <strong>Ordered:</strong> {new Date(order.createdAt).toLocaleDateString()}
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
  });

  // Fetch visits
  const { data: visits, isLoading: visitsLoading } = useQuery<Visit[]>({
    queryKey: [`/api/patients/${patientId}/visits`],
    enabled: !!patientId,
  });

  // Fetch lab orders for this patient
  const { data: labOrders = [], isLoading: labOrdersLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/lab-orders`],
    enabled: !!patientId,
  });

  // Fetch prescriptions
  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery<Prescription[]>({
    queryKey: [`/api/patients/${patientId}/prescriptions`],
    enabled: !!patientId,
  });

  // Lab results using React Query (same pattern as working sidebar)
  console.log('Lab Query Debug - patientId:', patientId, 'enabled:', !!patientId);
  
  const { data: labResults = [], isLoading: labsLoading, error: labsError } = useQuery<LabResultFromOrder[]>({
    queryKey: [`/api/patients/${patientId}/labs`],
    enabled: !!patientId,
    retry: 2
  });

  console.log('Lab Results State:', { labResults, labsLoading, labsError });

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "normal":
        return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
      case "abnormal":
        return <Badge className="bg-red-100 text-red-800">Abnormal</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-full flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {getPatientInitials(patient)}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {formatPatientName(patient)}
              </h2>
              <p className="text-sm text-slate-500">
                ID: HC{patient.id?.toString().padStart(6, "0")} | Age: {getPatientAge(patient.dateOfBirth)} | {patient.gender}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Info
              </Button>
            )}
            
            {user?.role === 'doctor' && (
              <>
                <Button onClick={() => setShowVisitModal(true)}>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Record Visit
                </Button>
                <Button variant="outline" onClick={() => setShowPrescriptionModal(true)}>
                  <Pill className="mr-2 h-4 w-4" />
                  Add Prescription
                </Button>
              </>
            )}
            
            {(user?.role === 'nurse' || user?.role === 'doctor') && (
              <Button variant="outline" onClick={() => setShowLabModal(true)}>
                <FlaskRound className="mr-2 h-4 w-4" />
                Add Lab Result
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-full">
        <div className="w-full max-w-none">
          <ModernPatientOverview
            patient={patient}
            visits={visits || []}
            recentLabs={labResults || []}
            activePrescriptions={prescriptions || []}
            onAddPrescription={() => setShowPrescriptionModal(true)}
          />
        </div>

        {/* Detailed Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="care" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="care">Advanced Care</TabsTrigger>
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="labs">Lab Results</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="care">
              <AdvancedPatientCare patientId={patientId} />
            </TabsContent>

            <TabsContent value="visits">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <History className="mr-2 h-5 w-5" />
                      Visit History
                    </span>
                    {user?.role === 'doctor' && (
                      <Button size="sm" onClick={() => setShowVisitModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Visit
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {visitsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
                          <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : visits && visits.length > 0 ? (
                    <div className="space-y-4">
                      {visits.map((visit) => (
                        <div key={visit.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-slate-800">
                                Visit on {new Date(visit.visitDate).toLocaleDateString()}
                              </h4>
                              <p className="text-sm text-slate-600 mt-1">
                                <strong>Reason:</strong> {visit.reasonForVisit}
                              </p>
                              {visit.diagnosis && (
                                <p className="text-sm text-slate-600">
                                  <strong>Diagnosis:</strong> {visit.diagnosis}
                                </p>
                              )}
                              {visit.treatmentPlan && (
                                <p className="text-sm text-slate-600 mt-1">
                                  <strong>Treatment:</strong> {visit.treatmentPlan}
                                </p>
                              )}
                            </div>
                            <Badge>{visit.status || 'Completed'}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="mx-auto h-12 w-12 text-slate-400" />
                      <h3 className="mt-4 text-sm font-medium text-slate-900">No visits recorded</h3>
                      <p className="mt-2 text-sm text-slate-500">Record the first visit for this patient.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="labs">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FlaskRound className="mr-2 h-5 w-5" />
                      Laboratory Tests & Results
                    </span>
                    {(user?.role === 'nurse' || user?.role === 'doctor') && (
                      <Button size="sm" onClick={() => setShowLabModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Result
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="results" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="results" className="flex items-center gap-2">
                        <FlaskRound className="h-4 w-4" />
                        Results
                      </TabsTrigger>
                      <TabsTrigger value="reviewed" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Reviewed
                      </TabsTrigger>
                      <TabsTrigger value="pending" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Pending
                      </TabsTrigger>
                      <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        History
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="results" className="mt-4">
                      {labsLoading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                              <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
                              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                            </div>
                          ))}
                        </div>
                      ) : labResults && labResults.length > 0 ? (
                        <div className="space-y-4">
                          {labResults.map((result) => (
                            <div key={result.id} className="border border-slate-200 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-slate-800">{result.testName}</h4>
                                  <p className="text-sm text-slate-600 mt-1">
                                    <strong>Result:</strong> {result.result}
                                  </p>
                                  {result.normalRange && (
                                    <p className="text-sm text-slate-600">
                                      <strong>Normal Range:</strong> {result.normalRange}
                                    </p>
                                  )}
                                  {result.notes && (
                                    <p className="text-sm text-slate-600 mt-1">
                                      <strong>Notes:</strong> {result.notes}
                                    </p>
                                  )}
                                  <p className="text-xs text-slate-400 mt-2">
                                    {result.testDate ? new Date(result.testDate).toLocaleDateString() : 'No date recorded'}
                                  </p>
                                </div>
                                <div>{getStatusBadge(result.status)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FlaskRound className="mx-auto h-12 w-12 text-slate-400" />
                          <h3 className="mt-4 text-sm font-medium text-slate-900">No completed results</h3>
                          <p className="mt-2 text-sm text-slate-500">Completed lab results will appear here.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="reviewed" className="mt-4">
                      <PatientReviewedResults patientId={patient.id} />
                    </TabsContent>

                    <TabsContent value="pending" className="mt-4">
                      <PendingLabOrders 
                        labOrders={labOrders} 
                        labOrdersLoading={labOrdersLoading} 
                        onProcessResult={(orderItem) => {
                          setSelectedOrderItem(orderItem);
                          setShowResultModal(true);
                        }}
                      />
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                      <div className="text-center py-8">
                        <History className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-4 text-sm font-medium text-slate-900">Lab History</h3>
                        <p className="mt-2 text-sm text-slate-500">Historical lab data will be displayed here.</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="prescriptions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Pill className="mr-2 h-5 w-5" />
                      Prescriptions
                    </span>
                    {user?.role === 'doctor' && (
                      <Button size="sm" onClick={() => setShowPrescriptionModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Prescription
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {prescriptionsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
                          <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : prescriptions && prescriptions.length > 0 ? (
                    <div className="space-y-4">
                      {prescriptions.map((prescription) => (
                        <div key={prescription.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-slate-800">{prescription.medicationName || `Medicine ID: ${prescription.medicationId}`}</h4>
                              <p className="text-sm text-slate-600 mt-1">
                                <strong>Dosage:</strong> {prescription.dosage}
                              </p>
                              <p className="text-sm text-slate-600">
                                <strong>Frequency:</strong> {prescription.frequency}
                              </p>
                              <p className="text-sm text-slate-600">
                                <strong>Duration:</strong> {prescription.duration}
                              </p>
                              {prescription.instructions && (
                                <p className="text-sm text-slate-600 mt-2">
                                  <strong>Instructions:</strong> {prescription.instructions}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => printPrescription(prescription, patient)}
                                >
                                  <Printer className="mr-1 h-3 w-3" />
                                  Print
                                </Button>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                                {prescription.status}
                              </Badge>
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(prescription.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Pill className="mx-auto h-12 w-12 text-slate-400" />
                      <h3 className="mt-4 text-sm font-medium text-slate-900">No prescriptions</h3>
                      <p className="mt-2 text-sm text-slate-500">Add the first prescription for this patient.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Medical History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {patient.medicalHistory ? (
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-700">{patient.medicalHistory}</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p>No medical history recorded</p>
                      </div>
                    )}
                    
                    {patient.allergies && (
                      <div>
                        <h4 className="font-medium text-slate-800 mb-2">Allergies</h4>
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm text-red-700">{patient.allergies}</p>
                        </div>
                      </div>
                    )}
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

      {/* Hidden Printable Patient Summary */}
      <div className="hidden">
        <PatientSummaryPrintable
          patient={patient}
          visits={visits || []}
          organization={currentOrganization}
        />
      </div>
    </div>
  );
}