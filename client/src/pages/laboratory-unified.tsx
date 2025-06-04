import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  TestTube, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Filter,
  Download,
  Search,
  Users,
  Activity,
  BarChart3,
  Settings,
  Upload,
  Plus,
  FileText,
  Microscope,
  Printer,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  User,
  FlaskRound,
  MoreVertical,
  ArrowUpDown,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

// Form schemas
const labOrderSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  tests: z.array(z.object({
    id: z.number(),
    name: z.string(),
    category: z.string()
  })).min(1, "At least one test is required"),
  clinicalNotes: z.string().optional(),
  priority: z.enum(["routine", "urgent", "stat"])
});

const resultEntrySchema = z.object({
  orderItemId: z.number(),
  value: z.string().min(1, "Result value is required"),
  units: z.string().optional(),
  referenceRange: z.string().optional(),
  status: z.enum(["normal", "abnormal", "critical"]),
  notes: z.string().optional()
});

// Type definitions
interface Patient {
  id: number;
  title?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
}

interface LabTest {
  id: number;
  name: string;
  category: string;
  description?: string;
  units?: string;
  referenceRange?: string;
}

interface LabOrderItem {
  id: number;
  labOrderId: number;
  labTestId: number;
  status: string;
  priority: string;
  result?: string;
  resultDate?: string;
  labTest: LabTest;
}

interface LabOrder {
  id: number;
  patientId: number;
  orderedBy: string;
  status: string;
  notes?: string;
  createdAt: string;
  patient: Patient;
  items: LabOrderItem[];
  totalCost?: number;
}

interface LabResult {
  id: number;
  orderItemId: number;
  value: string;
  units?: string;
  referenceRange?: string;
  status: string;
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  orderItem: LabOrderItem & {
    labOrder: LabOrder;
  };
}

export default function LaboratoryUnified() {
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<LabOrderItem | null>(null);
  const [showCustomViewDialog, setShowCustomViewDialog] = useState(false);
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [customViewSettings, setCustomViewSettings] = useState({
    showPatientInfo: true,
    showTestDetails: true,
    showTimestamps: true,
    showStatus: true,
    showPriority: true,
    showNotes: true,
    compactView: false,
    itemsPerPage: 10
  });

  const queryClient = useQueryClient();

  // Upload existing results mutation
  const uploadExistingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/lab-results/upload-existing', 'POST', {});
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-results/reviewed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-orders/enhanced'] });
      toast({ 
        title: "Existing lab results uploaded successfully", 
        description: `${data.count} results connected to the system` 
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({ 
        title: "Upload failed", 
        description: "Failed to upload existing lab results", 
        variant: "destructive" 
      });
    }
  });

  // Upload existing results function
  const uploadExistingResults = () => {
    uploadExistingMutation.mutate();
  };

  // Print functionality
  const handlePrintOrder = (order: LabOrder) => {
    const printContent = generateLabOrderPrintContent(order);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const generateLabOrderPrintContent = (order: LabOrder) => {
    const patient = patients.find(p => p.id === order.patientId);
    // Use the issuing staff member's organization for letterhead branding
    const org = organizationData || userProfile?.organization || {};
    const orgName = org.name || 'Healthcare Organization';
    const orgType = org.type || 'clinic';
    const orgEmail = org.email || 'info@healthcare.com';
    const orgPhone = org.phone || '+234-XXX-XXX-XXXX';
    const orgAddress = org.address || 'Healthcare Address';
    const orgWebsite = org.website || 'www.healthcare.com';
    const themeColor = org.themeColor || '#1e40af';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lab Order #${order.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
            .letterhead { background: linear-gradient(135deg, ${themeColor} 0%, #3b82f6 100%); color: white; padding: 30px; margin: -20px -20px 30px -20px; }
            .org-name { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
            .org-tagline { font-size: 14px; opacity: 0.9; margin-bottom: 15px; }
            .org-contact { font-size: 12px; opacity: 0.8; display: flex; justify-content: space-between; }
            .document-title { text-align: center; font-size: 24px; font-weight: bold; color: ${themeColor}; margin: 30px 0 20px 0; border-bottom: 3px solid ${themeColor}; padding-bottom: 10px; }
            .order-info { background: #f8fafc; border-left: 4px solid ${themeColor}; padding: 20px; margin-bottom: 25px; }
            .patient-section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; color: ${themeColor}; margin-bottom: 15px; display: flex; align-items: center; }
            .tests-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .test-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; background: #fafafa; }
            .test-name { font-weight: bold; color: #1f2937; margin-bottom: 5px; }
            .test-category { color: #6b7280; font-size: 13px; margin-bottom: 8px; }
            .test-status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-processing { background: #dbeafe; color: #1e40af; }
            .status-completed { background: #d1fae5; color: #065f46; }
            .footer { border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
            .signature-box { text-align: center; width: 200px; }
            .signature-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; }
            @media print { 
              .no-print { display: none; }
              body { margin: 0; }
              .letterhead { margin: -20px -20px 20px -20px; }
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <div class="org-name">${orgName}</div>
            <div class="org-tagline">${orgType.charAt(0).toUpperCase() + orgType.slice(1)} Laboratory Services</div>
            <div class="org-contact">
              <span>📧 ${orgEmail} | 📞 ${orgPhone}</span>
              <span>🏥 ${orgAddress} | 🌐 ${orgWebsite}</span>
            </div>
          </div>
          
          <div class="document-title">LABORATORY ORDER FORM</div>
          
          <div class="order-info">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 16px;">Order #${order.id}</strong><br>
                <span style="color: #6b7280;">Issued: ${format(new Date(order.createdAt), 'PPPP')}</span>
              </div>
              <div style="text-align: right;">
                <span style="background: #1e40af; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                  ${order.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          <div class="patient-section">
            <div class="section-title">👤 Patient Information</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p><strong>Full Name:</strong> ${patient?.title} ${patient?.firstName} ${patient?.lastName}</p>
                <p><strong>Phone Number:</strong> ${patient?.phone || 'Not provided'}</p>
                <p><strong>Email:</strong> ${patient?.email || 'Not provided'}</p>
              </div>
              <div>
                <p><strong>Date of Birth:</strong> ${patient?.dateOfBirth ? format(new Date(patient.dateOfBirth), 'PP') : 'Not provided'}</p>
                <p><strong>Gender:</strong> ${patient?.gender || 'Not specified'}</p>
                <p><strong>Address:</strong> ${patient?.address || 'Not provided'}</p>
              </div>
            </div>
          </div>
          
          <div class="patient-section">
            <div class="section-title">🧪 Ordered Laboratory Tests</div>
            <div class="tests-grid">
              ${order.items?.map(item => `
                <div class="test-card">
                  <div class="test-name">${item.labTest?.name || 'Unknown Test'}</div>
                  <div class="test-category">Category: ${item.labTest?.category || 'Not specified'}</div>
                  <span class="test-status status-${item.status}">${item.status.toUpperCase()}</span>
                </div>
              `).join('') || '<p style="color: #6b7280; font-style: italic;">No tests specified</p>'}
            </div>
            
            <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin-top: 15px;">
              <strong>Total Tests Ordered:</strong> ${order.items?.length || 0}<br>
              <strong>Priority Level:</strong> ${order.items?.[0]?.priority?.toUpperCase() || 'ROUTINE'}<br>
              ${order.clinicalNotes ? `<strong>Clinical Notes:</strong> ${order.clinicalNotes}` : ''}
            </div>
          </div>
          
          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line">Ordering Physician</div>
              <small>Dr. ${order.orderedByUser?.username || 'Unknown'}</small>
            </div>
            <div class="signature-box">
              <div class="signature-line">Laboratory Supervisor</div>
              <small>Date: _______________</small>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>${orgName} Laboratory Services</strong></p>
            <p>This document was generated electronically on ${format(new Date(), 'PPPP')} at ${format(new Date(), 'p')}</p>
            <p style="font-size: 10px; margin-top: 10px;">
              ⚕️ Licensed Healthcare Facility | Professional Laboratory Services
            </p>
          </div>
        </body>
      </html>
    `;
  };

  // Enhanced print function with letterhead
  const handlePrintOrderWithLetterhead = (order: LabOrder) => {
    const printContent = generateLabOrderPrintContent(order);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const generateLabResultPrintContent = (result: any) => {
    const patient = result.orderItem?.labOrder?.patient;
    // Use the issuing staff member's organization for letterhead branding
    const org = organizationData || userProfile?.organization || {};
    const orgName = org.name || 'Healthcare Organization';
    const orgType = org.type || 'clinic';
    const orgEmail = org.email || 'info@healthcare.com';
    const orgPhone = org.phone || '+234-XXX-XXX-XXXX';
    const orgAddress = org.address || 'Healthcare Address';
    const orgWebsite = org.website || 'www.healthcare.com';
    const themeColor = org.themeColor || '#1e40af';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lab Result - ${result.orderItem?.labTest?.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
            .letterhead { background: linear-gradient(135deg, ${themeColor} 0%, #3b82f6 100%); color: white; padding: 30px; margin: -20px -20px 30px -20px; }
            .org-name { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
            .org-tagline { font-size: 14px; opacity: 0.9; margin-bottom: 15px; }
            .org-contact { font-size: 12px; opacity: 0.8; display: flex; justify-content: space-between; }
            .document-title { text-align: center; font-size: 24px; font-weight: bold; color: ${themeColor}; margin: 30px 0 20px 0; border-bottom: 3px solid ${themeColor}; padding-bottom: 10px; }
            .result-header { background: #f8fafc; border-left: 4px solid ${themeColor}; padding: 20px; margin-bottom: 25px; }
            .patient-section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
            .result-main { background: #ffffff; border: 2px solid ${themeColor}; border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; }
            .result-value { font-size: 36px; font-weight: bold; color: ${themeColor}; margin: 20px 0; }
            .result-normal { border-color: #16a34a; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); }
            .result-abnormal { border-color: #dc2626; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); }
            .result-critical { border-color: #dc2626; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); animation: pulse 2s infinite; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 12px; }
            .status-normal { background: #16a34a; color: white; }
            .status-abnormal { background: #dc2626; color: white; }
            .status-critical { background: #dc2626; color: white; }
            .reference-info { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .clinical-notes { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; }
            .footer { border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
            .signature-box { text-align: center; width: 200px; }
            .signature-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; }
            @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); } 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); } }
            @media print { 
              .no-print { display: none; }
              body { margin: 0; }
              .letterhead { margin: -20px -20px 20px -20px; }
              .result-critical { animation: none; }
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <div class="org-name">${orgName}</div>
            <div class="org-tagline">${orgType.charAt(0).toUpperCase() + orgType.slice(1)} Laboratory Services</div>
            <div class="org-contact">
              <span>📧 ${orgEmail} | 📞 ${orgPhone}</span>
              <span>🏥 ${orgAddress} | 🌐 ${orgWebsite}</span>
            </div>
          </div>
          
          <div class="document-title">LABORATORY RESULT REPORT</div>
          
          <div class="result-header">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 16px;">Test: ${result.orderItem?.labTest?.name || 'Unknown Test'}</strong><br>
                <span style="color: #6b7280;">Order #${result.orderItem?.labOrder?.id} | Report Date: ${format(new Date(result.createdAt), 'PPPP')}</span>
              </div>
              <div style="text-align: right;">
                <span class="status-badge status-${result.status}">${result.status.toUpperCase()}</span>
              </div>
            </div>
          </div>
          
          <div class="patient-section">
            <h3 style="color: #1e40af; margin-bottom: 15px;">👤 Patient Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p><strong>Full Name:</strong> ${patient?.firstName} ${patient?.lastName}</p>
                <p><strong>Phone:</strong> ${patient?.phone || 'Not provided'}</p>
                <p><strong>Email:</strong> ${patient?.email || 'Not provided'}</p>
              </div>
              <div>
                <p><strong>Date of Birth:</strong> ${patient?.dateOfBirth ? format(new Date(patient.dateOfBirth), 'PP') : 'Not provided'}</p>
                <p><strong>Gender:</strong> ${patient?.gender || 'Not specified'}</p>
                <p><strong>Test Category:</strong> ${result.orderItem?.labTest?.category || 'Not specified'}</p>
              </div>
            </div>
          </div>
          
          <div class="result-main result-${result.status}">
            <h2 style="color: #1e40af; margin-bottom: 10px;">🧪 TEST RESULT</h2>
            <div class="result-value">${result.value} ${result.units}</div>
            <div class="reference-info">
              <strong>Reference Range:</strong> ${result.referenceRange || 'Not specified'}<br>
              <strong>Test Method:</strong> ${result.orderItem?.labTest?.method || 'Standard Laboratory Method'}<br>
              <strong>Sample Type:</strong> ${result.orderItem?.labTest?.sampleType || 'Blood/Serum'}
            </div>
          </div>
          
          ${result.notes ? `
            <div class="clinical-notes">
              <h4 style="color: #92400e; margin-bottom: 10px;">📋 Clinical Notes & Interpretation</h4>
              <p style="margin: 0;">${result.notes}</p>
            </div>
          ` : ''}
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #1e40af; margin-bottom: 15px;">📊 Result Summary</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center;">
              <div>
                <strong>Status</strong><br>
                <span style="color: ${result.status === 'normal' ? '#16a34a' : result.status === 'abnormal' ? '#dc2626' : '#dc2626'}; font-weight: bold;">
                  ${result.status.toUpperCase()}
                </span>
              </div>
              <div>
                <strong>Reviewed By</strong><br>
                <span>${result.reviewedBy || 'Pending Review'}</span>
              </div>
              <div>
                <strong>Report Date</strong><br>
                <span>${format(new Date(), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>
          
          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line">Laboratory Director</div>
              <small>Medical Laboratory Scientist</small>
            </div>
            <div class="signature-box">
              <div class="signature-line">Quality Assurance</div>
              <small>Date: ${format(new Date(), 'MM/dd/yyyy')}</small>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>${orgName} Laboratory Services</strong></p>
            <p>This result report was generated electronically on ${format(new Date(), 'PPPP')} at ${format(new Date(), 'p')}</p>
            <p style="font-size: 10px; margin-top: 10px;">
              ⚕️ Licensed Healthcare Facility | Professional Laboratory Services<br>
              🔒 This report contains confidential medical information. Handle with appropriate care.
            </p>
          </div>
        </body>
      </html>
    `;
  };

  // Data queries
  const { data: labOrders = [], isLoading: ordersLoading } = useQuery<LabOrder[]>({
    queryKey: ['/api/lab-orders/enhanced']
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients']
  });

  const { data: labTests = [] } = useQuery<LabTest[]>({
    queryKey: ['/api/lab-tests']
  });

  const { data: labResults = [] } = useQuery<LabResult[]>({
    queryKey: ['/api/lab-results/reviewed']
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/lab-analytics']
  });

  const { data: userProfile } = useQuery({
    queryKey: ['/api/profile']
  });

  const { data: organizationData } = useQuery({
    queryKey: ['/api/organizations', userProfile?.organizationId],
    enabled: !!userProfile?.organizationId
  });

  // Forms
  const orderForm = useForm({
    resolver: zodResolver(labOrderSchema),
    defaultValues: {
      patientId: "",
      tests: [],
      clinicalNotes: "",
      priority: "routine" as const
    }
  });

  const resultForm = useForm({
    resolver: zodResolver(resultEntrySchema),
    defaultValues: {
      orderItemId: 0,
      value: "",
      units: "",
      referenceRange: "",
      status: "normal" as const,
      notes: ""
    }
  });

  // Mutations
  const createOrder = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/lab-orders', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-orders/enhanced'] });
      setShowOrderDialog(false);
      orderForm.reset();
      toast({ title: "Lab order created successfully" });
    }
  });

  const submitResult = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/lab-results', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-orders/enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-results/reviewed'] });
      setShowResultDialog(false);
      resultForm.reset();
      setSelectedOrderItem(null);
      toast({ title: "Lab result submitted successfully" });
    }
  });

  // Filter data
  const filteredOrders = labOrders.filter(order => {
    const matchesSearch = !searchTerm || 
      `${order.patient.firstName} ${order.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => item.labTest.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPatient = !selectedPatient || order.patientId === selectedPatient;
    const matchesCategory = categoryFilter === "all" || 
      (order.items && order.items.some(item => item.labTest?.category === categoryFilter));
    
    return matchesSearch && matchesStatus && matchesPatient && matchesCategory;
  });

  const filteredResults = labResults.filter(result => {
    const matchesSearch = !searchTerm || 
      `${result.orderItem?.labOrder?.patient?.firstName || ''} ${result.orderItem?.labOrder?.patient?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.orderItem?.labTest?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPatient = !selectedPatient || result.orderItem?.labOrder?.patientId === selectedPatient;
    const matchesCategory = categoryFilter === "all" || 
      result.orderItem?.labTest?.category === categoryFilter;
    
    return matchesSearch && matchesPatient && matchesCategory;
  });

  // Medical specialty categories for lab tests
  const medicalCategories = [
    'Hematology', 'Clinical Chemistry', 'Microbiology', 'Immunology', 
    'Endocrinology', 'Cardiology', 'Nephrology', 'Hepatology',
    'Oncology', 'Toxicology', 'Serology', 'Parasitology'
  ];

  // Test categories for filtering (from database + medical specialties)
  const testCategories = Array.from(new Set([
    ...labTests.map(test => test.category).filter(Boolean),
    ...medicalCategories
  ]));

  // Filter tests based on search and selected categories
  const filteredTests = labTests.filter(test => {
    const matchesSearch = !testSearchQuery || 
      test.name.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
      test.category.toLowerCase().includes(testSearchQuery.toLowerCase());
    
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(test.category);
    
    return matchesSearch && matchesCategory;
  });

  // Group filtered tests by category
  const groupedTests = testCategories.reduce((acc, category) => {
    const testsInCategory = filteredTests.filter(test => test.category === category);
    if (testsInCategory.length > 0) {
      acc[category] = testsInCategory;
    }
    return acc;
  }, {} as Record<string, LabTest[]>);

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Toggle category collapse
  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat': return 'bg-red-100 text-red-800 border-red-300';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'routine': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleOrderSubmit = (data: any) => {
    createOrder.mutate({
      patientId: parseInt(data.patientId),
      testIds: data.tests.map((test: any) => test.id),
      clinicalNotes: data.clinicalNotes,
      priority: data.priority
    });
  };

  const handleResultSubmit = (data: any) => {
    if (!selectedOrderItem) return;
    
    submitResult.mutate({
      ...data,
      orderItemId: selectedOrderItem.id
    });
  };

  const openResultDialog = (orderItem: LabOrderItem) => {
    setSelectedOrderItem(orderItem);
    resultForm.setValue('orderItemId', orderItem.id);
    resultForm.setValue('units', orderItem.labTest.units || '');
    resultForm.setValue('referenceRange', orderItem.labTest.referenceRange || '');
    setShowResultDialog(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Microscope className="w-8 h-8 text-blue-600" />
            </div>
            Laboratory Management
          </h1>
          <p className="text-gray-600 mt-1">Comprehensive lab orders, results, and analytics</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowOrderDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Lab Order
          </Button>
          <Button 
            onClick={uploadExistingResults}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Existing Results
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.metrics?.totalOrders || '0'}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <TestTube className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.metrics?.completedOrders || '0'}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{analytics.metrics?.pendingOrders || '0'}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical Results</p>
                  <p className="text-2xl font-bold text-red-600">{analytics.metrics?.criticalResults || '0'}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Filters */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Laboratory Filters</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCustomViewDialog(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Settings className="w-4 h-4 mr-1" />
                Custom View
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedPatient(null);
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Row */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients, tests, or order numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Patient</Label>
              <Select value={selectedPatient?.toString() || "all"} onValueChange={(value) => setSelectedPatient(value === "all" ? null : parseInt(value))}>
                <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <SelectValue placeholder="All Patients" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      All Patients
                    </div>
                  </SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                          <div className="text-xs text-gray-500">{patient.phone}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-500" />
                    <SelectValue placeholder="All Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-500" />
                      All Status
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="processing">
                    <div className="flex items-center gap-2">
                      <TestTube className="w-4 h-4 text-blue-500" />
                      Processing
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Completed
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Cancelled
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Medical Specialty</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500">
                  <div className="flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-gray-500" />
                    <SelectValue placeholder="All Specialties" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Microscope className="w-4 h-4 text-gray-500" />
                      All Specialties
                    </div>
                  </SelectItem>
                  {testCategories.sort().map((category) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                          <span className="text-xs font-bold text-purple-600">
                            {category.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium">{category}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <FlaskRound className="w-4 h-4" />
            Lab Orders
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Lab Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          {ordersLoading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Loading lab orders...</p>
              </CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <TestTube className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No lab orders found</h3>
                <p className="text-gray-600 mb-4">Create your first lab order to get started</p>
                <Button onClick={() => setShowOrderDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Lab Order
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {order.patient.title} {order.patient.firstName} {order.patient.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Order #{order.id} • {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getStatusColor(order.status)} variant="outline">
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          {order.items && order.items.length > 0 && order.items[0] && (
                            <Badge className={getPriorityColor(order.items[0].priority)} variant="outline">
                              {order.items[0].priority.charAt(0).toUpperCase() + order.items[0].priority.slice(1)}
                            </Badge>
                          )}
                          <Badge variant="secondary">
                            {order.items?.length || 0} test{(order.items?.length || 0) !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {order.items?.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.labTest?.name || 'Unknown Test'}</p>
                                <p className="text-sm text-gray-600">{item.labTest?.category || 'Unknown Category'}</p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(item.status)} variant="outline">
                                  {item.status}
                                </Badge>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePrintOrder(order)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Printer className="w-3 h-3 mr-1" />
                                  Print
                                </Button>
                                
                                {item.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openResultDialog(item)}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Result
                                  </Button>
                                )}
                                
                                {item.result && (
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{item.result}</p>
                                    {item.resultDate && (
                                      <p className="text-xs text-gray-500">
                                        {format(new Date(item.resultDate), 'MMM dd')}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {order.notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {order.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // View detailed analytics for this order
                            const orderDetails = `Order #${order.id} Analytics\n\nPatient: ${order.patient.firstName} ${order.patient.lastName}\nTests: ${order.items?.length || 0}\nStatus: ${order.status}\nCreated: ${format(new Date(order.createdAt), 'PPP')}`;
                            alert(orderDetails);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePrintOrderWithLetterhead(order)}
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {filteredResults.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Lab results will appear here once processed</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredResults.map((result) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {result.orderItem?.labOrder?.patient?.firstName || 'Unknown'} {result.orderItem?.labOrder?.patient?.lastName || 'Patient'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {result.orderItem?.labTest?.name || 'Unknown Test'} • Order #{result.orderItem?.labOrder?.id || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Result</p>
                            <p className="text-lg font-semibold text-gray-900">{result.value} {result.units}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Reference Range</p>
                            <p className="text-sm text-gray-700">{result.referenceRange || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Status</p>
                            <Badge className={
                              result.status === 'normal' ? 'bg-green-100 text-green-800' :
                              result.status === 'abnormal' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        {result.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {result.notes}
                            </p>
                          </div>
                        )}

                        {result.reviewedBy && (
                          <div className="mt-2 text-xs text-gray-500">
                            Reviewed by {result.reviewedBy} on {result.reviewedAt && format(new Date(result.reviewedAt), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Download lab result as PDF
                            const resultContent = generateLabResultPrintContent(result);
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(resultContent);
                              printWindow.document.close();
                              setTimeout(() => printWindow.print(), 250);
                            }
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const resultContent = generateLabResultPrintContent(result);
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(resultContent);
                              printWindow.document.close();
                              setTimeout(() => {
                                printWindow.print();
                                printWindow.close();
                              }, 250);
                            }
                          }}
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Test Volume by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testCategories.slice(0, 5).map((category) => {
                    const categoryCount = labOrders.reduce((count, order) => 
                      count + (order.items?.filter(item => item.labTest?.category === category)?.length || 0), 0
                    );
                    const percentage = labOrders.length > 0 ? (categoryCount / labOrders.length * 100) : 0;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{category}</span>
                          <span className="text-gray-600">{categoryCount} tests</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {labOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <TestTube className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          New order for {order.patient.firstName} {order.patient.lastName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Lab Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Lab Order</DialogTitle>
            <DialogDescription>
              Select a patient and lab tests to create a new order
            </DialogDescription>
          </DialogHeader>

          <Form {...orderForm}>
            <form onSubmit={orderForm.handleSubmit(handleOrderSubmit)} className="space-y-6">
              <FormField
                control={orderForm.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.title} {patient.firstName} {patient.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={orderForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="stat">STAT</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={orderForm.control}
                name="tests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <TestTube className="w-4 h-4" />
                      Lab Tests
                    </FormLabel>
                    
                    {/* Search and Category Filter Controls */}
                    <div className="space-y-3 mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search tests by name or category..."
                          value={testSearchQuery}
                          onChange={(e) => setTestSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant={selectedCategories.length === 0 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategories([])}
                          >
                            All Categories
                          </Button>
                          {testCategories.slice(0, 8).map((category) => (
                            <Button
                              key={category}
                              type="button"
                              variant={selectedCategories.includes(category) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleCategory(category)}
                            >
                              {category}
                            </Button>
                          ))}
                        </div>
                        {testCategories.length > 8 && (
                          <div className="flex flex-wrap gap-2">
                            {testCategories.slice(8).map((category) => (
                              <Button
                                key={category}
                                type="button"
                                variant={selectedCategories.includes(category) ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleCategory(category)}
                              >
                                {category}
                              </Button>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {testCategories.length} categories available • {labTests.length} total tests
                        </div>
                      </div>
                    </div>

                    {/* Test Selection with Collapsible Categories */}
                    <div className="max-h-80 overflow-y-auto border rounded-lg p-4 space-y-3">
                      {Object.entries(groupedTests).map(([category, tests]) => (
                        <div key={category} className="space-y-2">
                          <div 
                            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                            onClick={() => toggleCategoryCollapse(category)}
                          >
                            <div className="flex items-center gap-2">
                              {collapsedCategories[category] ? (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                              <h4 className="font-medium text-gray-900">{category}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {tests.length}
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const categoryTests = tests.filter(test => 
                                  !field.value.some(selected => selected.id === test.id)
                                );
                                if (categoryTests.length > 0) {
                                  field.onChange([...field.value, ...categoryTests]);
                                }
                              }}
                            >
                              Select All
                            </Button>
                          </div>
                          
                          {!collapsedCategories[category] && (
                            <div className="pl-6 space-y-2">
                              {tests.map((test) => (
                                <div key={test.id} className="flex items-center space-x-2 py-1">
                                  <Checkbox
                                    id={`test-${test.id}`}
                                    checked={field.value.some(t => t.id === test.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...field.value, test]);
                                      } else {
                                        field.onChange(field.value.filter(t => t.id !== test.id));
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`test-${test.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                                  >
                                    {test.name}
                                  </label>
                                  {test.description && (
                                    <span className="text-xs text-gray-500 truncate max-w-32">
                                      {test.description}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {Object.keys(groupedTests).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <TestTube className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No tests found matching your criteria</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setTestSearchQuery("");
                              setSelectedCategories([]);
                            }}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Selected Tests Summary */}
                    {field.value.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-900">
                            {field.value.length} test{field.value.length === 1 ? '' : 's'} selected
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => field.onChange([])}
                            className="text-blue-700 hover:text-blue-900"
                          >
                            Clear All
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {field.value.slice(0, 3).map((test) => (
                            <Badge key={test.id} variant="outline" className="text-xs">
                              {test.name}
                            </Badge>
                          ))}
                          {field.value.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{field.value.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={orderForm.control}
                name="clinicalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinical Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter clinical notes or special instructions..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOrderDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createOrder.isPending}>
                  {createOrder.isPending ? "Creating..." : "Create Order"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Result Entry Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Lab Result</DialogTitle>
            <DialogDescription>
              {selectedOrderItem && (
                <>Enter result for {selectedOrderItem.labTest.name}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedOrderItem && (
            <Form {...resultForm}>
              <form onSubmit={resultForm.handleSubmit(handleResultSubmit)} className="space-y-4">
                <FormField
                  control={resultForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Result Value</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter result value" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={resultForm.control}
                    name="units"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Units</FormLabel>
                        <FormControl>
                          <Input placeholder="mg/dL, mmol/L, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resultForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="abnormal">Abnormal</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={resultForm.control}
                  name="referenceRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Range</FormLabel>
                      <FormControl>
                        <Input placeholder="Normal range for this test" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resultForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes or comments..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowResultDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitResult.isPending}>
                    {submitResult.isPending ? "Submitting..." : "Submit Result"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom View Dialog */}
      <Dialog open={showCustomViewDialog} onOpenChange={setShowCustomViewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Customize Laboratory View
            </DialogTitle>
            <DialogDescription>
              Configure which information to display in the laboratory interface
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-patient-info" className="text-sm font-medium">
                  Patient Information
                </Label>
                <Checkbox
                  id="show-patient-info"
                  checked={customViewSettings.showPatientInfo}
                  onCheckedChange={(checked) => 
                    setCustomViewSettings(prev => ({ ...prev, showPatientInfo: !!checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-test-details" className="text-sm font-medium">
                  Test Details
                </Label>
                <Checkbox
                  id="show-test-details"
                  checked={customViewSettings.showTestDetails}
                  onCheckedChange={(checked) => 
                    setCustomViewSettings(prev => ({ ...prev, showTestDetails: !!checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-timestamps" className="text-sm font-medium">
                  Timestamps
                </Label>
                <Checkbox
                  id="show-timestamps"
                  checked={customViewSettings.showTimestamps}
                  onCheckedChange={(checked) => 
                    setCustomViewSettings(prev => ({ ...prev, showTimestamps: !!checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-status" className="text-sm font-medium">
                  Status Badges
                </Label>
                <Checkbox
                  id="show-status"
                  checked={customViewSettings.showStatus}
                  onCheckedChange={(checked) => 
                    setCustomViewSettings(prev => ({ ...prev, showStatus: !!checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-priority" className="text-sm font-medium">
                  Priority Indicators
                </Label>
                <Checkbox
                  id="show-priority"
                  checked={customViewSettings.showPriority}
                  onCheckedChange={(checked) => 
                    setCustomViewSettings(prev => ({ ...prev, showPriority: !!checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-notes" className="text-sm font-medium">
                  Clinical Notes
                </Label>
                <Checkbox
                  id="show-notes"
                  checked={customViewSettings.showNotes}
                  onCheckedChange={(checked) => 
                    setCustomViewSettings(prev => ({ ...prev, showNotes: !!checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="compact-view" className="text-sm font-medium">
                  Compact View
                </Label>
                <Checkbox
                  id="compact-view"
                  checked={customViewSettings.compactView}
                  onCheckedChange={(checked) => 
                    setCustomViewSettings(prev => ({ ...prev, compactView: !!checked }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Items per Page</Label>
              <Select 
                value={customViewSettings.itemsPerPage.toString()} 
                onValueChange={(value) => 
                  setCustomViewSettings(prev => ({ ...prev, itemsPerPage: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 items</SelectItem>
                  <SelectItem value="10">10 items</SelectItem>
                  <SelectItem value="20">20 items</SelectItem>
                  <SelectItem value="50">50 items</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setCustomViewSettings({
                  showPatientInfo: true,
                  showTestDetails: true,
                  showTimestamps: true,
                  showStatus: true,
                  showPriority: true,
                  showNotes: true,
                  compactView: false,
                  itemsPerPage: 10
                });
              }}
            >
              Reset to Default
            </Button>
            <Button onClick={() => setShowCustomViewDialog(false)}>
              Apply Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}