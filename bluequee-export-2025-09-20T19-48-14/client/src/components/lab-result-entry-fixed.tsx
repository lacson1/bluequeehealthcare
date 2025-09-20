import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TestTube, Save, User, Calendar, Loader2, Printer, Download, FileText, Eye, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LabResultEntryProps {
  className?: string;
}

interface LabOrder {
  id: number;
  patientId: number;
  orderedBy: number;
  status: string;
  createdAt: string;
  patient?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
}

interface LabOrderItem {
  id: number;
  labOrderId: number;
  labTestId: number;
  result?: string;
  remarks?: string;
  status?: string;
  completedBy?: number;
  completedAt?: string;
  testName: string;
  testCategory?: string;
  referenceRange?: string;
  units?: string;
}

export default function LabResultEntry({ className }: LabResultEntryProps) {
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [resultValues, setResultValues] = useState<Record<number, { result: string; remarks: string }>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all pending lab orders
  const { data: pendingOrders = [], isLoading: ordersLoading } = useQuery<LabOrder[]>({
    queryKey: ['/api/lab-orders/pending']
  });

  // Get items for selected order
  const { data: orderItems = [], isLoading: itemsLoading } = useQuery<LabOrderItem[]>({
    queryKey: [`/api/lab-orders/${selectedOrder}/items`],
    enabled: !!selectedOrder
  });

  const updateResultMutation = useMutation({
    mutationFn: async ({ itemId, result, remarks }: { itemId: number; result: string; remarks: string }) => {
      return apiRequest(`/api/lab-order-items/${itemId}`, "PATCH", { result, remarks });
    },
    onSuccess: () => {
      toast({
        title: "Result Saved! ✅",
        description: "Lab test result has been saved successfully."
      });
      // Clear the form values for this item
      setResultValues(prev => {
        const newValues = { ...prev };
        delete newValues[selectedOrder!];
        return newValues;
      });
      // Refresh the data to show updated results
      queryClient.invalidateQueries({ queryKey: [`/api/lab-orders/${selectedOrder}/items`] });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-orders/pending'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save result. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleResultChange = (itemId: number, field: 'result' | 'remarks', value: string) => {
    setResultValues(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleSaveResult = (itemId: number) => {
    const values = resultValues[itemId];
    if (!values?.result?.trim()) {
      toast({
        title: "Missing Result",
        description: "Please enter a test result before saving.",
        variant: "destructive"
      });
      return;
    }

    updateResultMutation.mutate({
      itemId,
      result: values.result,
      remarks: values.remarks || ''
    });
  };

  const handlePrintOrder = (order: LabOrder) => {
    const printContent = generateLabOrderPrint(order, orderItems);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportOrder = (order: LabOrder) => {
    const csvContent = generateLabOrderCSV(order, orderItems);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab-order-${order.id}-${format(new Date(order.createdAt), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateLabOrderPrint = (order: LabOrder, items: LabOrderItem[]): string => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Lab Results Report - Order #${order.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .letterhead { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .org-logo { float: left; width: 80px; height: 80px; background: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px; }
        .org-info { margin-left: 100px; }
        .org-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
        .org-details { color: #64748b; line-height: 1.4; }
        .document-title { text-align: center; font-size: 20px; font-weight: bold; color: #1e40af; margin: 30px 0; padding: 10px; border: 2px solid #e2e8f0; background: #f8fafc; }
        .section { margin: 25px 0; }
        .section-title { font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-item { margin-bottom: 8px; }
        .label { font-weight: bold; color: #4b5563; }
        .value { color: #1f2937; }
        .test-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .test-table th, .test-table td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
        .test-table th { background: #f3f4f6; font-weight: bold; }
        .status-pending { color: #d97706; font-weight: bold; }
        .status-completed { color: #059669; font-weight: bold; }
        .result-value { font-weight: bold; color: #1f2937; }
        .result-normal { color: #059669; }
        .result-abnormal { color: #dc2626; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        .signature-area { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .signature-box { border-top: 1px solid #9ca3af; padding-top: 10px; text-align: center; }
        .critical-note { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
        @media print {
            body { print-color-adjust: exact; }
            .letterhead { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="letterhead">
        <div class="org-logo">LI</div>
        <div class="org-info">
          <div class="org-name">LAGOS ISLAND HOSPITAL</div>
          <div class="org-details">
            Excellence in Healthcare - Committed to Your Wellbeing<br>
            Lagos Island, Lagos State<br>
            Phone: +234-XXX-XXXX-XXX<br>
            Email: info@lagosislandhospital.ng<br>
            Medical License: NG-MED-2024-001 | CAP Accredited Lab
          </div>
        </div>
        <div style="clear: both;"></div>
      </div>

      <div class="document-title">LABORATORY RESULTS REPORT</div>

      <div class="section">
        <div class="section-title">PATIENT INFORMATION</div>
        <div class="info-grid">
          <div>
            <div class="info-item">
              <span class="label">Patient Name:</span> 
              <span class="value">${order.patient?.firstName} ${order.patient?.lastName}</span>
            </div>
            <div class="info-item">
              <span class="label">Date of Birth:</span> 
              <span class="value">${order.patient?.dateOfBirth ? format(new Date(order.patient.dateOfBirth), 'PPP') : 'Not specified'}</span>
            </div>
            <div class="info-item">
              <span class="label">Report Date:</span> 
              <span class="value">${format(new Date(), 'PPP')}</span>
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="label">Patient ID:</span> 
              <span class="value">P${String(order.patientId).padStart(6, '0')}</span>
            </div>
            <div class="info-item">
              <span class="label">Order Date:</span> 
              <span class="value">${format(new Date(order.createdAt), 'PPP')}</span>
            </div>
            <div class="info-item">
              <span class="label">Report ID:</span> 
              <span class="value">LAB-${String(order.id).padStart(3, '0')}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">LABORATORY RESULTS</div>
        <table class="test-table">
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Result</th>
              <th>Reference Range</th>
              <th>Units</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td><strong>${item.testName}</strong><br><small style="color: #6b7280;">${item.testCategory || 'General'}</small></td>
                <td class="result-value ${item.result ? 'result-normal' : ''}">${item.result || 'Pending'}</td>
                <td>${item.referenceRange || 'See lab standards'}</td>
                <td>${item.units || '-'}</td>
                <td><span class="status-${item.status || 'pending'}">${(item.status || 'pending').charAt(0).toUpperCase() + (item.status || 'pending').slice(1)}</span></td>
                <td>${item.remarks || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="critical-note">
        <strong>Important Notes:</strong><br>
        • Critical values have been immediately communicated to the ordering physician<br>
        • Results should be interpreted in conjunction with clinical findings<br>
        • Reference ranges may vary based on methodology and patient demographics<br>
        • For questions about results, please contact our laboratory at lab@healthcareconnect.ng
      </div>

      <div class="signature-area">
        <div class="signature-box">
          <strong>Laboratory Director</strong><br>
          Dr. Medical Director<br>
          Date: ${format(new Date(), 'PPP')}
        </div>
        <div class="signature-box">
          <strong>Quality Assurance</strong><br>
          Reviewed and Verified<br>
          Date: ${format(new Date(), 'PPP')}
        </div>
      </div>

      <div class="footer">
        <strong>Report ID:</strong> LAB-${String(order.id).padStart(3, '0')} | 
        <strong>Generated:</strong> ${format(new Date(), 'PPP p')} | 
        <strong>System:</strong> HealthCare Connect v2.0<br>
        <em>This is an official medical laboratory report. Results are confidential and should only be shared with authorized healthcare providers.</em>
      </div>
    </body>
    </html>`;
  };

  const generateLabOrderCSV = (order: LabOrder, items: LabOrderItem[]): string => {
    const headers = ['Order ID', 'Patient Name', 'Test Name', 'Category', 'Reference Range', 'Status', 'Order Date'];
    const rows = items.map(item => [
      order.id,
      `${order.patient?.firstName} ${order.patient?.lastName}`,
      item.testName,
      item.testCategory || 'General',
      item.referenceRange || 'See lab standards',
      item.status,
      format(new Date(order.createdAt), 'yyyy-MM-dd')
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  if (ordersLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading pending orders...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Pending Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Pending Lab Orders ({pendingOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending lab orders at this time.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingOrders.map(order => (
                <div
                  key={order.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedOrder === order.id 
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedOrder(order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {order.patient ? `${order.patient.firstName} ${order.patient.lastName}` : `Patient ID: ${order.patientId}`}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Order #{order.id}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {selectedOrder === order.id ? 'Selected' : 'Pending'}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(selectedOrder === order.id ? null : order.id);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {selectedOrder === order.id ? 'Hide Details' : 'View Details'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintOrder(order);
                            }}
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Print Order
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportOrder(order);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Details and Results Entry */}
      {selectedOrder && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lab Order Details - Order #{selectedOrder}</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const order = pendingOrders.find(o => o.id === selectedOrder);
                    if (order) handlePrintOrder(order);
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Order
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const order = pendingOrders.find(o => o.id === selectedOrder);
                    if (order) handleExportOrder(order);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {itemsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading test details...</span>
              </div>
            ) : orderItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No test details found for this order.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Test Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {orderItems.length}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      Total Tests
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {orderItems.filter(item => item.result).length}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Completed
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {orderItems.filter(item => !item.result).length}
                    </div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">
                      Pending
                    </div>
                  </div>
                </div>

                {/* Test Details */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Ordered Tests Details
                  </h4>
                  
                  {orderItems.map((item, index) => (
                    <Card key={item.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-medium text-lg">{item.testName}</h5>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              {item.testCategory && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.testCategory}
                                </Badge>
                              )}
                              {item.units && (
                                <span>Units: {item.units}</span>
                              )}
                            </div>
                            {item.referenceRange && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Reference Range: </span>
                                <span className="text-muted-foreground">{item.referenceRange}</span>
                              </div>
                            )}
                          </div>
                          <Badge variant={item.result ? "default" : "outline"}>
                            {item.result ? "Completed" : "Pending"}
                          </Badge>
                        </div>

                        {/* Result Entry or Display */}
                        {item.result ? (
                          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <p className="font-medium text-sm text-green-700 dark:text-green-300">Result Saved</p>
                            </div>
                            <p className="font-mono text-lg text-green-600 dark:text-green-400 mb-2">{item.result}</p>
                            {item.remarks && (
                              <>
                                <p className="font-medium text-sm text-green-700 dark:text-green-300 mb-1">Notes:</p>
                                <p className="text-sm text-green-600 dark:text-green-400">{item.remarks}</p>
                              </>
                            )}
                            {item.completedAt && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                Saved: {format(new Date(item.completedAt), 'MMM dd, yyyy HH:mm')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                              <p className="font-medium text-sm text-yellow-700 dark:text-yellow-300">Enter Result for This Test</p>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2 text-yellow-800 dark:text-yellow-200">
                                Test Result * {item.units && <span className="text-xs text-yellow-600">({item.units})</span>}
                              </label>
                              <Input
                                placeholder={`Enter result${item.units ? ` in ${item.units}` : ''} (e.g., 14.5, Normal, 120/80)`}
                                value={resultValues[item.id]?.result || ''}
                                onChange={(e) => handleResultChange(item.id, 'result', e.target.value)}
                                className="border-yellow-300 focus:border-yellow-500"
                              />
                              {item.referenceRange && (
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                  Normal range: {item.referenceRange}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2 text-yellow-800 dark:text-yellow-200">
                                Clinical Notes (Optional)
                              </label>
                              <Textarea
                                placeholder="Add any observations, abnormalities, or clinical notes..."
                                rows={2}
                                value={resultValues[item.id]?.remarks || ''}
                                onChange={(e) => handleResultChange(item.id, 'remarks', e.target.value)}
                                className="border-yellow-300 focus:border-yellow-500"
                              />
                            </div>

                            <Button
                              onClick={() => handleSaveResult(item.id)}
                              disabled={updateResultMutation.isPending || !resultValues[item.id]?.result?.trim()}
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                              size="lg"
                            >
                              {updateResultMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving Result...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save This Test Result
                                </>
                              )}
                            </Button>
                            
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
                              💡 Save each test result individually as you complete them
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}