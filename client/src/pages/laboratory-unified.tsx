import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState, NoLabOrders } from "@/components/ui/empty-state";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LabOrdersTab } from "@/components/lab/lab-orders-tab";
import { LabResultsTab } from "@/components/lab/lab-results-tab";
import { LabAnalyticsSection } from "@/components/lab/lab-analytics-section";
import { LabFiltersSection } from "@/components/lab/lab-filters-section";
import {
  TestTube,
  Clock,
  CheckCircle,
  Download,
  Search,
  Activity,
  BarChart3,
  Settings,
  Upload,
  Plus,
  FileText,
  Microscope,
  Printer,
  Eye,
  RefreshCw,
  User,
  FlaskRound,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  List,
  Grid3x3,
  LayoutGrid
} from "lucide-react";
import { format } from "date-fns";
import LetterheadService from "@/services/letterhead-service";
import { apiRequest } from "@/lib/queryClient";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import { t } from "@/lib/i18n";

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
  value: z.string().optional(),
  result: z.string().optional(),
  units: z.string().optional(),
  referenceRange: z.string().optional(),
  status: z.enum(["normal", "abnormal", "critical", "pending_review", "high", "low", "borderline", "inconclusive", "invalid", "rejected"]),
  notes: z.string().optional(),
  interpretation: z.string().optional(),
  recommendations: z.string().optional()
}).refine((data) => data.value || data.result, {
  message: "Either value or result is required",
  path: ["result"]
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
  
  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "grid" | "compact">("compact");
  
  // Pagination state
  const [currentPageOrders, setCurrentPageOrders] = useState(1);
  const [currentPageResults, setCurrentPageResults] = useState(1);

  const queryClient = useQueryClient();

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPageOrders(1);
  }, [searchTerm, selectedPatient, statusFilter, categoryFilter]);

  useEffect(() => {
    setCurrentPageResults(1);
  }, [searchTerm, selectedPatient, categoryFilter]);

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
  const printSelectedResults = async () => {
    if (selectedResults.size === 0) {
      toast({
        title: "No results selected",
        description: "Please select at least one result to print",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedResultData = filteredResults.filter(result => selectedResults.has(result.id));
      const combinedPrintContent = generateCombinedResultsPrintContent(selectedResultData);
      
      const { openPrintWindowWithLetterhead } = await import('@/utils/organization-print');
      await openPrintWindowWithLetterhead(
        combinedPrintContent.replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/, '').replace(/<\/body>[\s\S]*<\/html>/, ''),
        `Laboratory Results Report - ${selectedResultData.length} Result${selectedResultData.length !== 1 ? 's' : ''}`,
        {
          documentId: `LAB-RESULTS-${Date.now()}`,
          organizationId: userProfile?.organizationId,
          organization: organizationData,
          pageSize: 'A4',
          autoPrint: false
        }
      );
    } catch (error: any) {
      toast({
        title: "Print Error",
        description: error?.message || "Unable to open print window. Please allow popups.",
        variant: "destructive"
      });
    }
  };

  // Print selected orders
  const printSelectedOrders = async () => {
    if (selectedOrders.size === 0) {
      toast({
        title: "No orders selected",
        description: "Please select at least one order to print",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedOrderData = filteredOrders.filter(order => selectedOrders.has(order.id));
      const combinedPrintContent = generateCombinedOrdersPrintContent(selectedOrderData);
      
      const { openPrintWindowWithLetterhead } = await import('@/utils/organization-print');
      await openPrintWindowWithLetterhead(
        combinedPrintContent.replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/, '').replace(/<\/body>[\s\S]*<\/html>/, ''),
        `Laboratory Orders - ${selectedOrderData.length} Order${selectedOrderData.length !== 1 ? 's' : ''}`,
        {
          documentId: `LAB-ORDERS-${Date.now()}`,
          organizationId: userProfile?.organizationId,
          organization: organizationData,
          pageSize: 'A4',
          autoPrint: true
        }
      );
    } catch (error: any) {
      console.error('Print error:', error);
      toast({
        title: "Print Error",
        description: error?.message || "Failed to generate print content",
        variant: "destructive"
      });
    }
  };

  // Print functionality
  const handlePrintOrder = (order: LabOrder) => {
    try {
      const printContent = generateLabOrderPrintContent(order);
      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        // Wait for content to load before printing
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          // Don't close immediately - let user see the print preview
          // printWindow.close();
        }, 500);
      } else {
        toast({
          title: "Print Error",
          description: "Unable to open print window. Please allow popups for this site.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Print error:', error);
      toast({
        title: "Print Error",
        description: error?.message || "Failed to generate print content",
        variant: "destructive"
      });
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

    // Use organization data or fallback to defaults
    const organization = orderingOrganization || organizationData || (userProfile as any)?.organization || {
      id: 1,
      name: 'Bluequee Health Management',
      type: 'health_center',
      themeColor: '#3B82F6',
      address: 'Healthcare Address',
      phone: '+234-XXX-XXX-XXXX',
      email: 'info@clinicconnect.com',
      website: 'www.clinicconnect.com'
    };

    // Use LetterheadService for consistent formatting
    return LetterheadService.generateLabOrderHTML(organization, order, patient);
  };

  // Enhanced print function with letterhead
  const handlePrintOrderWithLetterhead = (order: LabOrder) => {
    try {
      const printContent = generateLabOrderPrintContent(order);
      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        // Wait for content to load before printing
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          // Don't close immediately - let user see the print preview
          // printWindow.close();
        }, 500);
      } else {
        toast({
          title: "Print Error",
          description: "Unable to open print window. Please allow popups for this site.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Print error:', error);
      toast({
        title: "Print Error",
        description: error?.message || "Failed to generate print content",
        variant: "destructive"
      });
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

  // Data queries with optimized caching
  const { data: labOrders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery<LabOrder[]>({
    queryKey: ['/api/lab-orders/enhanced'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch items for each lab order - only when needed
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
    enabled: labOrders.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Static data - cache for longer
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: labTests = [] } = useQuery<LabTest[]>({
    queryKey: ['/api/lab-tests'],
    staleTime: 10 * 60 * 1000, // 10 minutes - static data
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: labResultsResponse } = useQuery({
    queryKey: ['/api/lab-results/reviewed'],
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Extract the data array from the API response
  const labResults = labResultsResponse?.data || [];

  const { data: analytics } = useQuery({
    queryKey: ['/api/lab-analytics'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // User profile - cache for longer
  const { data: userProfile } = useQuery({
    queryKey: ['/api/profile'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Organizations - static data
  const { data: organizations = [] } = useQuery({
    queryKey: ['/api/organizations'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: organizationData } = useQuery({
    queryKey: ['/api/organizations', (userProfile as any)?.organizationId],
    enabled: !!(userProfile as any)?.organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
      return apiRequest(`/api/patients/${data.patientId}/lab-orders`, 'POST', data);
    },
    onSuccess: async (response) => {
      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['/api/lab-orders/enhanced'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/lab-orders-with-items'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/lab-analytics'] });
      
      // Ensure we're on the orders tab
      setActiveTab('orders');
      
      // Clear any filters that might hide the new order
      setStatusFilter('all');
      setCategoryFilter('all');
      setSelectedPatient(null);
      setSearchTerm('');
      
      setShowOrderDialog(false);
      orderForm.reset();
      
      // Show success message with location info
      const orderData = await response.json();
      toast({ 
        title: "Lab order created successfully!",
        description: `Order #${orderData.id || 'created'} is now visible in the Lab Orders tab.`,
        duration: 5000
      });
      
      // Refetch orders to show the new one
      queryClient.refetchQueries({ queryKey: ['/api/lab-orders/enhanced'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create lab order",
        description: error?.message || "Please try again",
        variant: "destructive"
      });
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
      patientId: Number.parseInt(data.patientId, 10),
      labTestIds: data.tests.map((test: any) => test.id), // Extract test IDs as backend expects
      clinicalNotes: data.clinicalNotes,
      diagnosis: data.diagnosis || '', // Add diagnosis field
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
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          /* Ensure all content is visible */
          * {
            visibility: visible !important;
            color: #000 !important;
            background: white !important;
          }
          /* Show cards and content */
          [class*="Card"],
          [class*="card"],
          [class*="space-y"],
          [class*="grid"],
          [class*="flex"] {
            display: block !important;
            visibility: visible !important;
            page-break-inside: avoid;
          }
          /* Table styles */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 8px !important;
            text-align: left !important;
          }
          /* Hide interactive elements */
          button:not(.print-visible),
          [role="button"]:not(.print-visible),
          .no-print,
          nav,
          header:not(.print-visible) {
            display: none !important;
          }
        }
      `}</style>
      <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Microscope className="w-6 h-6 text-blue-600" />
            </div>
            Laboratory Management
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">Comprehensive lab orders, results, and analytics</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowOrderDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all"
            size="default"
            title="New Lab Order"
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Button
            onClick={uploadExistingResults}
            variant="outline"
            size="sm"
            className="text-gray-600 hover:text-gray-900 h-8 px-2 text-xs"
          >
            <Upload className="w-3.5 h-3.5 mr-1" />
            Upload
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <LabFiltersSection
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedPatient={selectedPatient}
        onPatientChange={setSelectedPatient}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        patients={patients}
        testCategories={testCategories}
        onShowCustomView={() => setShowCustomViewDialog(true)}
        onClearFilters={() => {
          setSearchTerm('');
          setSelectedPatient(null);
          setStatusFilter('all');
          setCategoryFilter('all');
        }}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-auto grid-cols-3 h-10">
            <TabsTrigger value="orders" className="flex items-center gap-2 text-sm">
              <FlaskRound className="w-4 h-4" />
              Lab Orders
              {filteredOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filteredOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              Results
              {filteredResults.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filteredResults.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-md p-1 bg-gray-50">
              <Button
                variant={viewMode === "compact" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("compact")}
                className={`h-7 px-2 ${viewMode === "compact" ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
                title="Compact View"
              >
                <List className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-7 px-2 ${viewMode === "list" ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
                title="List View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`h-7 px-2 ${viewMode === "grid" ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
                title="Grid View"
              >
                <Grid3x3 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/lab-orders/enhanced'] });
                queryClient.invalidateQueries({ queryKey: ['/api/lab-orders-with-items'] });
                queryClient.refetchQueries({ queryKey: ['/api/lab-orders/enhanced'] });
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Lab Orders Tab */}
        <TabsContent value="orders" className="space-y-2 mt-3">
          <LabOrdersTab
            orders={labOrders}
            filteredOrders={filteredOrders}
            ordersLoading={ordersLoading}
            viewMode={viewMode}
            selectedOrders={selectedOrders}
            onToggleOrderSelection={toggleOrderSelection}
            onSelectAllOrders={selectAllOrders}
            onClearOrderSelection={clearOrderSelection}
            onPrintSelectedOrders={printSelectedOrders}
            onViewOrder={(order) => {
              setSelectedOrder(order);
              setShowViewDialog(true);
            }}
            onPrintOrder={handlePrintOrderWithLetterhead}
            onAddResult={openResultDialog}
            onCreateOrder={() => setShowOrderDialog(true)}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            customViewSettings={customViewSettings}
            currentPage={currentPageOrders}
            onPageChange={setCurrentPageOrders}
          />
        </TabsContent>

        {/* OLD ORDERS TAB CODE REMOVED - Now using LabOrdersTab component */}

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-2 mt-3">
          <LabResultsTab
            results={labResults}
            filteredResults={filteredResults}
            selectedResults={selectedResults}
            onToggleResultSelection={toggleResultSelection}
            onSelectAllResults={selectAllResults}
            onClearResultSelection={clearResultSelection}
            onPrintSelectedResults={printSelectedResults}
            onViewResult={(result) => {
              const resultContent = generateLabResultPrintContent(result);
              const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
              if (printWindow) {
                printWindow.document.write(resultContent);
                printWindow.document.close();
                printWindow.focus();
              }
            }}
            onPrintResult={(result) => {
              const resultContent = generateLabResultPrintContent(result);
              const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
              if (printWindow) {
                printWindow.document.write(resultContent);
                printWindow.document.close();
                printWindow.focus();
              }
            }}
            generateLabResultPrintContent={generateLabResultPrintContent}
            customViewSettings={customViewSettings}
            currentPage={currentPageResults}
            onPageChange={setCurrentPageResults}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-2 mt-3">
          <LabAnalyticsSection
            analytics={analytics}
            testCategories={testCategories}
            labOrders={labOrders}
          />
        </TabsContent>
      </Tabs>

      {/* New Lab Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Create New Lab Order</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Select a patient and lab tests to create a new order
            </DialogDescription>
          </DialogHeader>

          <Form {...orderForm}>
            <form onSubmit={orderForm.handleSubmit(handleOrderSubmit)} className="space-y-4">
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
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                        <Input
                          placeholder="Search tests by name or category..."
                          value={testSearchQuery}
                          onChange={(e) => setTestSearchQuery(e.target.value)}
                          className="pl-10 h-10"
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
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                      {Object.entries(groupedTests).map(([category, tests]) => (
                        <div key={category} className="border-b border-gray-100 last:border-b-0">
                          <div
                            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-3 transition-colors"
                            onClick={() => toggleCategoryCollapse(category)}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              {collapsedCategories[category] ? (
                                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <TestTube className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <h4 className="font-semibold text-sm text-gray-900 truncate">{category}</h4>
                                <Badge variant="secondary" className="text-xs px-1.5 py-0 flex-shrink-0">
                                  {tests.length} {tests.length === 1 ? 'test' : 'tests'}
                                </Badge>
                              </div>
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
                              className="text-xs h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              Select All
                            </Button>
                          </div>

                          {!collapsedCategories[category] && (
                            <div className="bg-gray-50/50 pl-8 pr-3 py-2 space-y-1">
                              {tests.map((test) => (
                                <div 
                                  key={test.id} 
                                  className="flex items-start gap-3 p-2 rounded hover:bg-white transition-colors group"
                                >
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
                                    className="mt-0.5"
                                  />
                                  <label
                                    htmlFor={`test-${test.id}`}
                                    className="flex-1 cursor-pointer min-w-0"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                          {test.name}
                                        </p>
                                        {test.description && (
                                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                            {test.description}
                                          </p>
                                        )}
                                      </div>
                                      {test.units && (
                                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                          {test.units}
                                        </span>
                                      )}
                                    </div>
                                  </label>
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
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-blue-900">
                            {field.value.length} test{field.value.length === 1 ? '' : 's'} selected
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => field.onChange([])}
                            className="text-xs h-6 px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                          >
                            Clear All
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {field.value.slice(0, 5).map((test) => (
                            <Badge key={test.id} variant="outline" className="text-xs px-2 py-0.5 bg-white border-blue-300 text-blue-700">
                              {test.name}
                            </Badge>
                          ))}
                          {field.value.length > 5 && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-white border-blue-300 text-blue-700">
                              +{field.value.length - 5} more
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
                    <FormLabel>{t('notes.clinicalNotes')}</FormLabel>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
              <form onSubmit={resultForm.handleSubmit(handleResultSubmit)} className="space-y-4">
                {/* FBC Specific Fields */}
                {selectedOrderItem.labTest?.name?.toLowerCase().includes('blood count') ||
                  selectedOrderItem.labTest?.name?.toLowerCase().includes('fbc') ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Full Blood Count (FBC) Results</h4>
                      <p className="text-sm text-blue-700">Enter individual component values with units and status</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* WBC */}
                      <div className="space-y-2">
                        <label htmlFor="wbc-value" className="text-sm font-medium">White Blood Cells (WBC)</label>
                        <div className="flex gap-2">
                          <Input id="wbc-value" placeholder="4.0-11.0" className="flex-1" aria-label="WBC value" />
                          <Input placeholder="×10³/μL" className="w-24" disabled aria-label="WBC unit" />
                        </div>
                      </div>

                      {/* RBC */}
                      <div className="space-y-2">
                        <label htmlFor="rbc-value" className="text-sm font-medium">Red Blood Cells (RBC)</label>
                        <div className="flex gap-2">
                          <Input id="rbc-value" placeholder="4.5-5.5" className="flex-1" aria-label="RBC value" />
                          <Input placeholder="×10⁶/μL" className="w-24" disabled aria-label="RBC unit" />
                        </div>
                      </div>

                      {/* Hemoglobin */}
                      <div className="space-y-2">
                        <label htmlFor="hgb-value" className="text-sm font-medium">Hemoglobin (Hgb)</label>
                        <div className="flex gap-2">
                          <Input id="hgb-value" placeholder="12.0-16.0" className="flex-1" aria-label="Hemoglobin value" />
                          <Input placeholder="g/dL" className="w-20" disabled aria-label="Hemoglobin unit" />
                        </div>
                      </div>

                      {/* Hematocrit */}
                      <div className="space-y-2">
                        <label htmlFor="hct-value" className="text-sm font-medium">Hematocrit (Hct)</label>
                        <div className="flex gap-2">
                          <Input id="hct-value" placeholder="36-46" className="flex-1" aria-label="Hematocrit value" />
                          <Input placeholder="%" className="w-16" disabled aria-label="Hematocrit unit" />
                        </div>
                      </div>

                      {/* Platelets */}
                      <div className="space-y-2">
                        <label htmlFor="plt-value" className="text-sm font-medium">Platelets (PLT)</label>
                        <div className="flex gap-2">
                          <Input id="plt-value" placeholder="150-450" className="flex-1" aria-label="Platelets value" />
                          <Input placeholder="×10³/μL" className="w-24" disabled aria-label="Platelets unit" />
                        </div>
                      </div>

                      {/* MCV */}
                      <div className="space-y-2">
                        <label htmlFor="mcv-value" className="text-sm font-medium">Mean Cell Volume (MCV)</label>
                        <div className="flex gap-2">
                          <Input id="mcv-value" placeholder="80-100" className="flex-1" aria-label="MCV value" />
                          <Input placeholder="fL" className="w-16" disabled aria-label="MCV unit" />
                        </div>
                      </div>

                      {/* MCH */}
                      <div className="space-y-2">
                        <label htmlFor="mch-value" className="text-sm font-medium">Mean Cell Hemoglobin (MCH)</label>
                        <div className="flex gap-2">
                          <Input id="mch-value" placeholder="27-32" className="flex-1" aria-label="MCH value" />
                          <Input placeholder="pg" className="w-16" disabled aria-label="MCH unit" />
                        </div>
                      </div>

                      {/* MCHC */}
                      <div className="space-y-2">
                        <label htmlFor="mchc-value" className="text-sm font-medium">Mean Cell Hemoglobin Concentration (MCHC)</label>
                        <div className="flex gap-2">
                          <Input id="mchc-value" placeholder="32-36" className="flex-1" aria-label="MCHC value" />
                          <Input placeholder="g/dL" className="w-20" disabled aria-label="MCHC unit" />
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
                    <div className="space-y-3">
                      <div className="bg-green-50 p-3 rounded-lg">
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
                  <div className="space-y-3">
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

      {/* View Order Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Lab Order Details - Order #{selectedOrder?.id}
            </DialogTitle>
            <DialogDescription>
              Complete information about this lab order
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Header */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Order ID</p>
                  <p className="text-lg font-semibold">#{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge className={
                    selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedOrder.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                  }>
                    {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1).replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Priority</p>
                  <Badge className={
                    selectedOrder.priority === 'stat' ? 'bg-red-100 text-red-800 border-red-300' :
                      selectedOrder.priority === 'urgent' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                        'bg-gray-100 text-gray-800 border-gray-300'
                  }>
                    {selectedOrder.priority?.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Order Date</p>
                  <p className="font-medium">{selectedOrder.createdAt && format(new Date(selectedOrder.createdAt), 'PPp')}</p>
                </div>
              </div>

              {/* Patient Information */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Name</p>
                    <p className="font-medium">{selectedOrder.patient?.firstName} {selectedOrder.patient?.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                    <p className="font-medium">{selectedOrder.patient?.dateOfBirth && format(new Date(selectedOrder.patient.dateOfBirth), 'PP')}</p>
                  </div>
                  {selectedOrder.patient?.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phone</p>
                      <p className="font-medium">{selectedOrder.patient.phone}</p>
                    </div>
                  )}
                  {selectedOrder.patient?.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="font-medium">{selectedOrder.patient.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ordered Tests */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Ordered Tests ({selectedOrder.items?.length || 0})
                </h3>
                <div className="space-y-2">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any) => (
                      <div key={item.id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FlaskRound className="w-4 h-4 text-blue-600" />
                              <p className="font-medium">{item.labTest?.name || item.testName || 'Unknown Test'}</p>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Category: {item.labTest?.category || item.testCategory || 'General'}
                            </p>
                            {(item.labTest?.referenceRange || item.referenceRange) && (
                              <p className="text-sm text-gray-600">
                                Reference Range: {item.labTest?.referenceRange || item.referenceRange}
                              </p>
                            )}
                            {item.result && (
                              <div className="mt-2 p-2 bg-green-50 rounded">
                                <p className="text-sm font-medium text-green-900">
                                  Result: {item.result} {item.units || ''}
                                </p>
                                {item.remarks && (
                                  <p className="text-sm text-green-700 mt-1">
                                    Remarks: {item.remarks}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <Badge className={
                            item.status === 'completed' ? 'bg-green-100 text-green-800' :
                              item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                          }>
                            {item.status || 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 p-3 text-center">No tests ordered</p>
                  )}
                </div>
              </div>

              {/* Clinical Notes */}
              {selectedOrder.clinicalNotes && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t('notes.clinicalNotes')}
                  </h3>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedOrder.clinicalNotes}</p>
                  </div>
                </div>
              )}

              {/* Diagnosis */}
              {selectedOrder.diagnosis && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Diagnosis</h3>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedOrder.diagnosis}</p>
                  </div>
                </div>
              )}

              {/* Ordered By */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Order Information</h3>
                <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ordered By</p>
                    <p className="font-medium">
                      {selectedOrder.orderedByUser?.firstName} {selectedOrder.orderedByUser?.lastName}
                      {selectedOrder.orderedByUser?.role && ` (${selectedOrder.orderedByUser.role})`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Created At</p>
                    <p className="font-medium">{selectedOrder.createdAt && format(new Date(selectedOrder.createdAt), 'PPp')}</p>
                  </div>
                  {selectedOrder.completedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed At</p>
                      <p className="font-medium">{format(new Date(selectedOrder.completedAt), 'PPp')}</p>
                    </div>
                  )}
                  {selectedOrder.reviewedBy && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Reviewed By</p>
                      <p className="font-medium">User #{selectedOrder.reviewedBy}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => selectedOrder && handlePrintOrderWithLetterhead(selectedOrder)}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom View Settings Dialog */}
      <Dialog open={showCustomViewDialog} onOpenChange={setShowCustomViewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Custom View Settings
            </DialogTitle>
            <DialogDescription>
              Customize how lab orders and results are displayed
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Display Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Display Options
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showPatientInfo"
                    checked={customViewSettings.showPatientInfo}
                    onCheckedChange={(checked) =>
                      setCustomViewSettings(prev => ({ ...prev, showPatientInfo: !!checked }))
                    }
                  />
                  <Label htmlFor="showPatientInfo" className="text-sm cursor-pointer">
                    Patient Information
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showTestDetails"
                    checked={customViewSettings.showTestDetails}
                    onCheckedChange={(checked) =>
                      setCustomViewSettings(prev => ({ ...prev, showTestDetails: !!checked }))
                    }
                  />
                  <Label htmlFor="showTestDetails" className="text-sm cursor-pointer">
                    Test Details
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showTimestamps"
                    checked={customViewSettings.showTimestamps}
                    onCheckedChange={(checked) =>
                      setCustomViewSettings(prev => ({ ...prev, showTimestamps: !!checked }))
                    }
                  />
                  <Label htmlFor="showTimestamps" className="text-sm cursor-pointer">
                    Timestamps
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showStatus"
                    checked={customViewSettings.showStatus}
                    onCheckedChange={(checked) =>
                      setCustomViewSettings(prev => ({ ...prev, showStatus: !!checked }))
                    }
                  />
                  <Label htmlFor="showStatus" className="text-sm cursor-pointer">
                    Status Badges
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showPriority"
                    checked={customViewSettings.showPriority}
                    onCheckedChange={(checked) =>
                      setCustomViewSettings(prev => ({ ...prev, showPriority: !!checked }))
                    }
                  />
                  <Label htmlFor="showPriority" className="text-sm cursor-pointer">
                    Priority Labels
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showNotes"
                    checked={customViewSettings.showNotes}
                    onCheckedChange={(checked) =>
                      setCustomViewSettings(prev => ({ ...prev, showNotes: !!checked }))
                    }
                  />
                  <Label htmlFor="showNotes" className="text-sm cursor-pointer">
                    {t('notes.clinicalNotes')}
                  </Label>
                </div>
              </div>
            </div>

            {/* Layout Options */}
            <div className="space-y-3 border-t pt-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Layout Options
              </h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="compactView"
                  checked={customViewSettings.compactView}
                  onCheckedChange={(checked) =>
                    setCustomViewSettings(prev => ({ ...prev, compactView: !!checked }))
                  }
                />
                <Label htmlFor="compactView" className="text-sm cursor-pointer">
                  Compact View (Show more items in less space)
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemsPerPage" className="text-sm">Items Per Page</Label>
                <Select
                  value={customViewSettings.itemsPerPage.toString()}
                  onValueChange={(value) =>
                    setCustomViewSettings(prev => ({ ...prev, itemsPerPage: parseInt(value) }))
                  }
                >
                  <SelectTrigger id="itemsPerPage" className="w-full">
                    <SelectValue placeholder="Select items per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 items</SelectItem>
                    <SelectItem value="10">10 items</SelectItem>
                    <SelectItem value="20">20 items</SelectItem>
                    <SelectItem value="50">50 items</SelectItem>
                    <SelectItem value="100">100 items</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-3 border-t pt-3">
              <h3 className="text-sm font-semibold text-gray-700">Quick Presets</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomViewSettings({
                    showPatientInfo: true,
                    showTestDetails: true,
                    showTimestamps: true,
                    showStatus: true,
                    showPriority: true,
                    showNotes: true,
                    compactView: false,
                    itemsPerPage: 10
                  })}
                >
                  Default View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomViewSettings({
                    showPatientInfo: true,
                    showTestDetails: false,
                    showTimestamps: false,
                    showStatus: true,
                    showPriority: true,
                    showNotes: false,
                    compactView: true,
                    itemsPerPage: 20
                  })}
                >
                  Compact
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomViewSettings({
                    showPatientInfo: true,
                    showTestDetails: true,
                    showTimestamps: true,
                    showStatus: true,
                    showPriority: true,
                    showNotes: true,
                    compactView: false,
                    itemsPerPage: 5
                  })}
                >
                  Detailed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomViewSettings({
                    showPatientInfo: false,
                    showTestDetails: true,
                    showTimestamps: false,
                    showStatus: true,
                    showPriority: false,
                    showNotes: false,
                    compactView: true,
                    itemsPerPage: 50
                  })}
                >
                  Tests Only
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCustomViewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowCustomViewDialog(false);
              // Reset pagination when settings change
              setCurrentPageOrders(1);
              setCurrentPageResults(1);
              toast({
                title: "View settings updated",
                description: "Your custom view preferences have been applied"
              });
            }}>
              Apply Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
    </>
  );
}

