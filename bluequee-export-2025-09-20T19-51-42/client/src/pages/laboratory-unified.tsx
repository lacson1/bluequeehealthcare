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
import LetterheadService from "@/services/letterhead-service";
import { apiRequest } from "@/lib/queryClient";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";

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
  status: z.enum(["normal", "abnormal", "critical", "pending_review", "high", "low", "borderline", "inconclusive", "invalid", "rejected"]),
  notes: z.string().optional(),
  interpretation: z.string().optional(),
  recommendations: z.string().optional(),
  result: z.string().optional()
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
  const { handleError } = useApiErrorHandler();
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
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

  // Selection state for results
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());

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
        description: `${data?.count || 0} results connected to the system` 
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

  // Selection helper functions
  const toggleResultSelection = (resultId: number) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId);
    } else {
      newSelected.add(resultId);
    }
    setSelectedResults(newSelected);
  };

  const toggleOrderSelection = (orderId: number) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const selectAllResults = () => {
    setSelectedResults(new Set(filteredResults.map(result => result.id)));
  };

  const selectAllOrders = () => {
    setSelectedOrders(new Set(filteredOrders.map(order => order.id)));
  };

  const clearResultSelection = () => {
    setSelectedResults(new Set());
  };

  const clearOrderSelection = () => {
    setSelectedOrders(new Set());
  };

  // Print selected results
  const printSelectedResults = () => {
    if (selectedResults.size === 0) {
      toast({
        title: "No results selected",
        description: "Please select at least one result to print",
        variant: "destructive"
      });
      return;
    }

    const selectedResultData = filteredResults.filter(result => selectedResults.has(result.id));
    const combinedPrintContent = generateCombinedResultsPrintContent(selectedResultData);
    
    const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
    if (printWindow) {
      printWindow.document.write(combinedPrintContent);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  // Print selected orders
  const printSelectedOrders = () => {
    if (selectedOrders.size === 0) {
      toast({
        title: "No orders selected",
        description: "Please select at least one order to print",
        variant: "destructive"
      });
      return;
    }

    const selectedOrderData = filteredOrders.filter(order => selectedOrders.has(order.id));
    const combinedPrintContent = generateCombinedOrdersPrintContent(selectedOrderData);
    
    const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
    if (printWindow) {
      printWindow.document.write(combinedPrintContent);
      printWindow.document.close();
      printWindow.focus();
    }
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
    
    // Find the organization of the staff member who ordered the test
    let orderingOrganization = null;
    
    // Look for the ordering user's organization ID from the order data
    if (order.orderedBy && Array.isArray(organizations)) {
      orderingOrganization = organizations.find((org: any) => org.id === (order as any).organizationId);
    }
    
    // If not found in order data, use current user's organization as fallback
    if (!orderingOrganization && userProfile?.organizationId) {
      orderingOrganization = Array.isArray(organizations) ? organizations.find((org: any) => org.id === userProfile.organizationId) : null;
    }
    
    // Use the ordering staff member's organization for letterhead branding
    const org = orderingOrganization || {};
    const orgName = (org as any)?.name || 'Healthcare Organization';
    const orgType = org.type || 'clinic';
    const orgEmail = org.email || 'info@healthcare.com';
    const orgPhone = org.phone || '+234-XXX-XXX-XXXX';
    const orgAddress = org.address || 'Healthcare Address';
    const orgWebsite = org.website || 'www.healthcare.com';
    const themeColor = org.themeColor || '#1e40af';
    const orgLogo = org.logo || '';
    
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
                <p><strong>Phone Number:</strong> ${patient?.phone || ''}</p>
                <p><strong>Email:</strong> ${patient?.email || ''}</p>
              </div>
              <div>
                <p><strong>Date of Birth:</strong> ${patient?.dateOfBirth ? format(new Date(patient.dateOfBirth), 'PP') : ''}</p>
                <p><strong>Gender:</strong> ${patient?.gender || ''}</p>
                <p><strong>Address:</strong> ${patient?.phone || ''}</p>
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
              <strong>Priority Level:</strong> ${order.items?.[0]?.priority?.toUpperCase() || ''}<br>
              ${(order as any).clinicalNotes ? `<strong>Clinical Notes:</strong> ${(order as any).clinicalNotes}` : ''}
            </div>
          </div>
          
          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line">Ordering Physician</div>
              <small>Dr. ${order.orderedBy || ''}</small>
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
    // Use the organization data for enhanced letterhead
    const organization = organizationData || (userProfile as any)?.organization || {
      id: 4,
      name: 'Enugu Health Center',
      type: 'health_center',
      themeColor: '#3B82F6',
      address: 'Enugu State, Nigeria',
      phone: '+234-XXX-XXX-XXXX',
      email: 'info@enuguhealth.ng',
      website: 'www.enuguhealth.ng'
    };

    // Use the professional letterhead service
    return LetterheadService.generateLabResultHTML(organization, result);
  };

  // Combined print functions for multiple selections
  const generateCombinedResultsPrintContent = (results: any[]) => {
    const organization = organizationData || (userProfile as any)?.organization || {
      id: 4,
      name: 'Enugu Health Center',
      type: 'health_center',
      themeColor: '#3B82F6',
      address: 'Enugu State, Nigeria',
      phone: '+234-XXX-XXX-XXXX',
      email: 'info@enuguhealth.ng',
      website: 'www.enuguhealth.ng'
    };

    const themeColor = organization.themeColor || '#1e40af';
    const orgName = organization.name || 'Healthcare Organization';
    const orgType = organization.type || 'clinic';
    const orgEmail = organization.email || 'info@healthcare.com';
    const orgPhone = organization.phone || '+234-XXX-XXX-XXXX';
    const orgAddress = organization.address || 'Healthcare Address';
    const orgWebsite = organization.website || 'www.healthcare.com';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laboratory Results Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
            .letterhead { background: linear-gradient(135deg, ${themeColor} 0%, #3b82f6 100%); color: white; padding: 30px; margin: -20px -20px 30px -20px; }
            .org-name { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
            .org-tagline { font-size: 14px; opacity: 0.9; margin-bottom: 15px; }
            .org-contact { font-size: 12px; opacity: 0.8; display: flex; justify-content: space-between; }
            .document-title { text-align: center; font-size: 24px; font-weight: bold; color: ${themeColor}; margin: 30px 0 20px 0; border-bottom: 3px solid ${themeColor}; padding-bottom: 10px; }
            .result-section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px; page-break-inside: avoid; }
            .patient-info { background: #f8fafc; border-left: 4px solid ${themeColor}; padding: 15px; margin-bottom: 20px; }
            .result-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0; }
            .result-item { background: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; }
            .test-name { font-weight: bold; color: #1f2937; margin-bottom: 5px; }
            .result-value { font-size: 18px; font-weight: bold; color: ${themeColor}; margin: 8px 0; }
            .reference-range { color: #6b7280; font-size: 12px; }
            .status-normal { color: #065f46; background: #d1fae5; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
            .status-abnormal { color: #92400e; background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
            .status-critical { color: #991b1b; background: #fee2e2; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
            .footer { border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
            @media print { 
              .no-print { display: none; }
              body { margin: 0; }
              .letterhead { margin: -20px -20px 20px -20px; }
              .result-section { page-break-inside: avoid; }
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
          
          <div class="document-title">LABORATORY RESULTS REPORT</div>
          <div style="text-align: center; margin-bottom: 30px; color: #6b7280;">
            Generated on ${format(new Date(), 'PPPP')} | ${results.length} Result${results.length !== 1 ? 's' : ''}
          </div>
          
          ${results.map((result, index) => `
            <div class="result-section">
              <div class="patient-info">
                <strong style="font-size: 16px;">${result.patientName || 'Unknown Patient'}</strong><br>
                <span style="color: #6b7280;">Test: ${result.testName || 'Unknown Test'} | Category: ${result.category || 'General'}</span>
                ${result.reviewedAt ? `<br><span style="color: #6b7280; font-size: 12px;">Reviewed: ${format(new Date(result.reviewedAt), 'PPP')}</span>` : ''}
              </div>
              
              <div class="result-grid">
                <div class="result-item">
                  <div class="test-name">Result Value</div>
                  <div class="result-value">${result.result || result.value || 'N/A'}</div>
                  ${result.units ? `<div style="color: #6b7280; font-size: 12px;">${result.units}</div>` : ''}
                </div>
                
                <div class="result-item">
                  <div class="test-name">Reference Range</div>
                  <div class="reference-range">${result.normalRange || result.referenceRange || 'N/A'}</div>
                </div>
                
                <div class="result-item">
                  <div class="test-name">Status</div>
                  <div class="status-${result.status || 'normal'}">${(result.status || 'normal').toUpperCase()}</div>
                </div>
              </div>
              
              ${result.notes ? `
                <div style="background: #f8fafc; border-left: 3px solid ${themeColor}; padding: 10px; margin-top: 15px;">
                  <strong>Notes:</strong> ${result.notes}
                </div>
              ` : ''}
              
              ${result.reviewedBy ? `
                <div style="margin-top: 15px; text-align: right; color: #6b7280; font-size: 12px;">
                  Reviewed by: ${result.reviewedBy}
                </div>
              ` : ''}
            </div>
          `).join('')}
          
          <div class="footer">
            <p>This report contains ${results.length} laboratory result${results.length !== 1 ? 's' : ''}.</p>
            <p>For questions about these results, please contact ${orgName} at ${orgPhone}</p>
            <p style="margin-top: 15px; font-size: 10px;">Generated by ${orgName} Laboratory Information System</p>
          </div>
        </body>
      </html>
    `;
  };

  const generateCombinedOrdersPrintContent = (orders: LabOrder[]) => {
    const organization = organizationData || (userProfile as any)?.organization || {
      id: 4,
      name: 'Enugu Health Center',
      type: 'health_center',
      themeColor: '#3B82F6',
      address: 'Enugu State, Nigeria',
      phone: '+234-XXX-XXX-XXXX',
      email: 'info@enuguhealth.ng',
      website: 'www.enuguhealth.ng'
    };

    const themeColor = organization.themeColor || '#1e40af';
    const orgName = organization.name || 'Healthcare Organization';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laboratory Orders Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
            .letterhead { background: linear-gradient(135deg, ${themeColor} 0%, #3b82f6 100%); color: white; padding: 30px; margin: -20px -20px 30px -20px; }
            .org-name { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
            .document-title { text-align: center; font-size: 24px; font-weight: bold; color: ${themeColor}; margin: 30px 0 20px 0; }
            .order-section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px; page-break-inside: avoid; }
            .patient-info { background: #f8fafc; border-left: 4px solid ${themeColor}; padding: 15px; margin-bottom: 15px; }
            .tests-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
            .test-item { background: #fafafa; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px; }
            @media print { 
              .order-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <div class="org-name">${orgName}</div>
          </div>
          
          <div class="document-title">LABORATORY ORDERS SUMMARY</div>
          <div style="text-align: center; margin-bottom: 30px; color: #6b7280;">
            Generated on ${format(new Date(), 'PPPP')} | ${orders.length} Order${orders.length !== 1 ? 's' : ''}
          </div>
          
          ${orders.map(order => `
            <div class="order-section">
              <div class="patient-info">
                <strong>Order #${order.id}</strong> | ${order.patient.firstName} ${order.patient.lastName}<br>
                <span style="color: #6b7280;">Date: ${format(new Date(order.createdAt), 'PPP')} | Status: ${order.status.toUpperCase()}</span>
              </div>
              
              <div class="tests-grid">
                ${(order.items || []).map(item => `
                  <div class="test-item">
                    <strong>${item.labTest?.name || 'Unknown Test'}</strong><br>
                    <small style="color: #6b7280;">${item.labTest?.category || 'General'}</small>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
  };

  // Data queries
  const { data: labOrders = [], isLoading: ordersLoading } = useQuery<LabOrder[]>({
    queryKey: ['/api/lab-orders/enhanced']
  });

  // Fetch items for each lab order
  const labOrdersWithItems = useQuery({
    queryKey: ['/api/lab-orders-with-items'],
    queryFn: async () => {
      const ordersWithItems = await Promise.all(
        labOrders.map(async (order) => {
          try {
            const response = await apiRequest(`/api/lab-orders/${order.id}/items`, 'GET');
            const items = await response.json();
            return { ...order, items };
          } catch (error) {
            console.error(`Failed to fetch items for order ${order.id}:`, error);
            return { ...order, items: [] };
          }
        })
      );
      return ordersWithItems;
    },
    enabled: labOrders.length > 0
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients']
  });

  const { data: labTests = [] } = useQuery<LabTest[]>({
    queryKey: ['/api/lab-tests']
  });

  const { data: labResultsResponse } = useQuery({
    queryKey: ['/api/lab-results/reviewed']
  });

  // Extract the data array from the API response
  const labResults = labResultsResponse?.data || [];

  const { data: analytics } = useQuery({
    queryKey: ['/api/lab-analytics']
  });

  const { data: userProfile } = useQuery({
    queryKey: ['/api/profile']
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['/api/organizations']
  });

  const { data: organizationData } = useQuery({
    queryKey: ['/api/organizations', (userProfile as any)?.organizationId],
    enabled: !!(userProfile as any)?.organizationId
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
      console.log('Saving lab result data:', data);
      return apiRequest(`/api/lab-order-items/${data.orderItemId}`, 'PATCH', {
        result: data.value || data.result || '',
        remarks: data.notes || '',
        status: data.status || 'completed',
        units: data.units || '',
        referenceRange: data.referenceRange || ''
      });
    },
    onSuccess: (response) => {
      // Show AI analysis if available
      if (response.aiAnalysis) {
        const analysis = response.aiAnalysis;
        toast({
          title: "Result saved with AI insights",
          description: `Status: ${analysis.status} | Urgency: ${analysis.urgency}`,
          duration: 6000
        });
        
        // Log detailed AI analysis for clinical review
        console.log('🤖 AI Clinical Analysis:', {
          testName: response.testName,
          interpretation: analysis.interpretation,
          recommendations: analysis.recommendations,
          urgency: analysis.urgency,
          followUpNeeded: analysis.followUpNeeded
        });
      } else {
        toast({ title: "Result saved successfully" });
      }

      queryClient.invalidateQueries({ queryKey: ['/api/lab-orders/enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-results/reviewed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-orders-with-items'] });
      setShowResultDialog(false);
      resultForm.reset();
      setSelectedOrderItem(null);
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast({ 
        title: "Save failed", 
        description: "Please try again", 
        variant: "destructive" 
      });
    }
  });

  // Filter data using orders with items
  const ordersToDisplay = labOrdersWithItems.data || labOrders;
  const filteredOrders = ordersToDisplay.filter(order => {
    const matchesSearch = !searchTerm || 
      `${order.patient.firstName} ${order.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.items && order.items.some(item => 
        (item.labTest?.name || item.testName || 'FBC').toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPatient = !selectedPatient || order.patientId === selectedPatient;
    const matchesCategory = categoryFilter === "all" || 
      (order.items && order.items.some(item => 
        (item.labTest?.category || item.testCategory || 'Hematology') === categoryFilter
      ));
    
    return matchesSearch && matchesStatus && matchesPatient && matchesCategory;
  });

  const filteredResults = labResults.filter(result => {
    const matchesSearch = !searchTerm || 
      (result.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (result.testName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPatient = !selectedPatient || result.patientId === selectedPatient;
    const matchesCategory = categoryFilter === "all" || 
      result.category === categoryFilter;
    
    return matchesSearch && matchesPatient && matchesCategory;
  });

  // Test categories for filtering (only from database)
  const testCategories = Array.from(new Set(
    labTests.map(test => test.category).filter(Boolean)
  )).sort();

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

  const openResultDialog = (orderItem: any) => {
    setSelectedOrderItem(orderItem);
    resultForm.setValue('orderItemId', orderItem.id);
    resultForm.setValue('units', orderItem.labTest?.units || '');
    resultForm.setValue('referenceRange', orderItem.labTest?.referenceRange || '');
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
                  <p className="text-2xl font-bold text-gray-900">{(analytics as any).metrics?.totalOrders || ''}</p>
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
                  <p className="text-2xl font-bold text-green-600">{(analytics as any).metrics?.completedOrders || ''}</p>
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
                  <p className="text-2xl font-bold text-yellow-600">{(analytics as any).metrics?.pendingOrders || ''}</p>
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
                  <p className="text-2xl font-bold text-red-600">{(analytics as any).metrics?.criticalResults || ''}</p>
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
            <div className="space-y-4">
              {/* Selection Toolbar */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAllOrders();
                            } else {
                              clearOrderSelection();
                            }
                          }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Select All ({filteredOrders.length})
                        </span>
                      </div>
                      {selectedOrders.size > 0 && (
                        <Badge variant="secondary">
                          {selectedOrders.size} selected
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {selectedOrders.size > 0 && (
                        <>
                          <Button
                            size="sm"
                            onClick={printSelectedOrders}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Print Selected ({selectedOrders.size})
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={clearOrderSelection}
                          >
                            Clear Selection
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedOrders.has(order.id)}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                          />
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
                          {Array.isArray(order.items) && order.items.length > 0 && order.items[0] && order.items[0].priority && (
                            <Badge className={getPriorityColor(order.items[0].priority)} variant="outline">
                              {order.items[0].priority.charAt(0).toUpperCase() + order.items[0].priority.slice(1)}
                            </Badge>
                          )}
                          <Badge variant="secondary">
                            {Array.isArray(order.items) ? order.items.length : 0} test{(Array.isArray(order.items) ? order.items.length : 0) !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {Array.isArray(order.items) && order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md shadow-sm">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="p-1.5 bg-blue-100 rounded-full">
                                    <TestTube className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-base text-gray-900">{item.labTest?.name || item.testName || 'Full Blood Count (FBC)'}</p>
                                    <p className="text-xs text-blue-600 font-medium">{item.labTest?.category || item.testCategory || 'Hematology'}</p>
                                  </div>
                                </div>
                                {item.labTest?.referenceRange || item.referenceRange ? (
                                  <p className="text-xs text-gray-700 mt-1 bg-white p-1.5 rounded">
                                    <strong>Range:</strong> {item.labTest?.referenceRange || item.referenceRange}
                                  </p>
                                ) : null}
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 px-2 py-0.5 text-xs font-medium">
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </Badge>
                                
                                {item.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => openResultDialog(item)}
                                    className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 text-sm shadow-md"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Result
                                  </Button>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePrintOrder(order)}
                                  className="text-blue-600 hover:text-blue-800 border-blue-300"
                                >
                                  <Printer className="w-3 h-3 mr-1" />
                                  Print
                                </Button>
                                
                                {item.result && (
                                  <div className="text-right bg-white p-2 rounded">
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
                        </div>

                        <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowViewDialog(true);
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
            <div className="space-y-4">
              {/* Results Selection Toolbar */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedResults.size === filteredResults.length && filteredResults.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAllResults();
                            } else {
                              clearResultSelection();
                            }
                          }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Select All ({filteredResults.length})
                        </span>
                      </div>
                      {selectedResults.size > 0 && (
                        <Badge variant="secondary">
                          {selectedResults.size} selected
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {selectedResults.size > 0 && (
                        <>
                          <Button
                            size="sm"
                            onClick={printSelectedResults}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Print Selected ({selectedResults.size})
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={clearResultSelection}
                          >
                            Clear Selection
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {filteredResults.map((result) => (
                  <Card key={result.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedResults.has(result.id)}
                            onCheckedChange={() => toggleResultSelection(result.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-green-50 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {result.patientName || 'Unknown Patient'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {result.testName || 'Unknown Test'} • {result.category || 'General'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Result</p>
                            <p className="text-lg font-semibold text-gray-900">{result.result}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Reference Range</p>
                            <p className="text-sm text-gray-700">{result.normalRange || 'N/A'}</p>
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
                        </div>

                        <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Generate and show preview for review
                            const resultContent = generateLabResultPrintContent(result);
                            const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
                            if (printWindow) {
                              printWindow.document.write(resultContent);
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
                            const resultContent = generateLabResultPrintContent(result);
                            const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
                            if (printWindow) {
                              printWindow.document.write(resultContent);
                              printWindow.document.close();
                              printWindow.focus();
                            }
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Result
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Filter by Category</Label>
                          <Select
                            value={selectedCategories.length === 1 ? selectedCategories[0] : "all"}
                            onValueChange={(value) => {
                              if (value === "all") {
                                setSelectedCategories([]);
                              } else {
                                setSelectedCategories([value]);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select category..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories ({testCategories.length})</SelectItem>
                              {testCategories.map((category) => {
                                const categoryTests = labTests.filter(test => test.category === category);
                                return (
                                  <SelectItem key={category} value={category}>
                                    {category} ({categoryTests.length})
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Quick Actions</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTestSearchQuery("");
                                setSelectedCategories([]);
                              }}
                              className="flex-1"
                            >
                              Clear Filters
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const allTests = Object.values(groupedTests).flat();
                                const unselectedTests = allTests.filter(test => 
                                  !field.value.some(selected => selected.id === test.id)
                                );
                                if (unselectedTests.length > 0) {
                                  field.onChange([...field.value, ...unselectedTests]);
                                }
                              }}
                              className="flex-1"
                            >
                              Select All Visible
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 text-center">
                        {selectedCategories.length === 0 
                          ? `Showing all ${testCategories.length} categories • ${labTests.length} total tests`
                          : `Showing ${selectedCategories[0]} category • ${Object.values(groupedTests).flat().length} tests`
                        }
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

      {/* Enhanced FBC Result Entry Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5 text-blue-600" />
              Add Lab Result - {selectedOrderItem?.labTest?.name || 'Full Blood Count (FBC)'}
            </DialogTitle>
            <DialogDescription>
              Enter comprehensive FBC results and clinical assessment. All fields will be included in the professional report.
            </DialogDescription>
          </DialogHeader>

          {selectedOrderItem && (
            <Form {...resultForm}>
              <form onSubmit={resultForm.handleSubmit(handleResultSubmit)} className="space-y-6">
                {/* FBC Specific Fields */}
                {selectedOrderItem.labTest?.name?.toLowerCase().includes('blood count') || 
                 selectedOrderItem.labTest?.name?.toLowerCase().includes('fbc') ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Full Blood Count (FBC) Results</h4>
                      <p className="text-sm text-blue-700">Enter individual component values with units and status</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* WBC */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">White Blood Cells (WBC)</label>
                        <div className="flex gap-2">
                          <Input placeholder="4.0-11.0" className="flex-1" />
                          <Input placeholder="×10³/μL" className="w-24" disabled />
                        </div>
                      </div>

                      {/* RBC */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Red Blood Cells (RBC)</label>
                        <div className="flex gap-2">
                          <Input placeholder="4.5-5.5" className="flex-1" />
                          <Input placeholder="×10⁶/μL" className="w-24" disabled />
                        </div>
                      </div>

                      {/* Hemoglobin */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Hemoglobin (Hgb)</label>
                        <div className="flex gap-2">
                          <Input placeholder="12.0-16.0" className="flex-1" />
                          <Input placeholder="g/dL" className="w-20" disabled />
                        </div>
                      </div>

                      {/* Hematocrit */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Hematocrit (Hct)</label>
                        <div className="flex gap-2">
                          <Input placeholder="36-46" className="flex-1" />
                          <Input placeholder="%" className="w-16" disabled />
                        </div>
                      </div>

                      {/* Platelets */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Platelets (PLT)</label>
                        <div className="flex gap-2">
                          <Input placeholder="150-450" className="flex-1" />
                          <Input placeholder="×10³/μL" className="w-24" disabled />
                        </div>
                      </div>

                      {/* MCV */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mean Cell Volume (MCV)</label>
                        <div className="flex gap-2">
                          <Input placeholder="80-100" className="flex-1" />
                          <Input placeholder="fL" className="w-16" disabled />
                        </div>
                      </div>

                      {/* MCH */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mean Cell Hemoglobin (MCH)</label>
                        <div className="flex gap-2">
                          <Input placeholder="27-32" className="flex-1" />
                          <Input placeholder="pg" className="w-16" disabled />
                        </div>
                      </div>

                      {/* MCHC */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mean Cell Hemoglobin Concentration (MCHC)</label>
                        <div className="flex gap-2">
                          <Input placeholder="32-36" className="flex-1" />
                          <Input placeholder="g/dL" className="w-20" disabled />
                        </div>
                      </div>

                      {/* RDW */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Red Cell Distribution Width (RDW)</label>
                        <div className="flex gap-2">
                          <Input placeholder="11.5-14.5" className="flex-1" />
                          <Input placeholder="%" className="w-16" disabled />
                        </div>
                      </div>
                    </div>

                    {/* Clinical Assessment */}
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">Clinical Assessment</h4>
                        <p className="text-sm text-green-700">Review results and provide clinical interpretation</p>
                      </div>

                      <FormField
                        control={resultForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Result Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select result status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="normal">Normal - Within reference ranges</SelectItem>
                                <SelectItem value="abnormal">Abnormal - Outside reference ranges</SelectItem>
                                <SelectItem value="critical">Critical - Requires immediate attention</SelectItem>
                                <SelectItem value="pending_review">Pending Review - Needs specialist review</SelectItem>
                                <SelectItem value="high">High - Above normal range</SelectItem>
                                <SelectItem value="low">Low - Below normal range</SelectItem>
                                <SelectItem value="borderline">Borderline - Near reference limits</SelectItem>
                                <SelectItem value="inconclusive">Inconclusive - Requires repeat testing</SelectItem>
                                <SelectItem value="invalid">Invalid - Technical issues with sample</SelectItem>
                                <SelectItem value="rejected">Rejected - Sample quality insufficient</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={resultForm.control}
                        name="interpretation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clinical Interpretation</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter clinical interpretation, abnormal findings, and recommendations..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={resultForm.control}
                        name="recommendations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recommendations</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter follow-up recommendations, additional tests needed, or clinical actions..."
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ) : (
                  // Generic test result fields
                  <div className="space-y-4">
                    <FormField
                      control={resultForm.control}
                      name="result"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Result</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter test result..."
                              {...field}
                            />
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
                          <FormLabel>Result Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select result status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="abnormal">Abnormal</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                              <SelectItem value="pending_review">Pending Review</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="borderline">Borderline</SelectItem>
                              <SelectItem value="inconclusive">Inconclusive</SelectItem>
                              <SelectItem value="invalid">Invalid</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowResultDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitResult.isPending}>
                    {submitResult.isPending ? "Saving Result..." : "Save Result"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

