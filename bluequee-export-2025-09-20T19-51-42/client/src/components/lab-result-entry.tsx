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
    queryKey: ['/api/lab-orders', selectedOrder, 'items'],
    enabled: !!selectedOrder
  });

  const updateResultMutation = useMutation({
    mutationFn: async ({ itemId, result, remarks }: { itemId: number; result: string; remarks: string }) => {
      return apiRequest("PATCH", `/api/lab-order-items/${itemId}`, { result, remarks });
    },
    onSuccess: () => {
      toast({
        title: "Result Updated",
        description: "Lab test result has been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-orders'] });
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
      <title>Lab Order #${order.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .patient-info { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        .test-list { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .test-list th, .test-list td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .test-list th { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: center; color: #666; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Laboratory Order</h1>
        <p>Order #${order.id} | Date: ${format(new Date(order.createdAt), 'PPP')}</p>
      </div>
      
      <div class="patient-info">
        <h3>Patient Information</h3>
        <p><strong>Name:</strong> ${order.patient?.firstName} ${order.patient?.lastName}</p>
        <p><strong>Patient ID:</strong> ${order.patientId}</p>
        <p><strong>Date of Birth:</strong> ${order.patient?.dateOfBirth ? format(new Date(order.patient.dateOfBirth), 'PPP') : 'Not specified'}</p>
      </div>

      <h3>Ordered Tests</h3>
      <table class="test-list">
        <thead>
          <tr>
            <th>Test Name</th>
            <th>Category</th>
            <th>Reference Range</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.testName}</td>
              <td>${item.testCategory || 'General'}</td>
              <td>${item.referenceRange || 'See lab standards'}</td>
              <td>${item.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>Generated on ${format(new Date(), 'PPP')} | Total Tests: ${items.length}</p>
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
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading pending orders...</span>
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
                        {item.completedAt ? (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="font-medium text-sm text-muted-foreground mb-2">Completed Result:</p>
                          <p className="font-mono text-blue-600 dark:text-blue-400 mb-2">{item.result}</p>
                          {item.remarks && (
                            <>
                              <p className="font-medium text-sm text-muted-foreground mb-1">Notes:</p>
                              <p className="text-sm">{item.remarks}</p>
                            </>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Completed: {format(new Date(item.completedAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Test Result *
                            </label>
                            <Input
                              placeholder="Enter test result (e.g., 120/80, Normal, 5.2 mg/dL)"
                              value={resultValues[item.id]?.result || ''}
                              onChange={(e) => handleResultChange(item.id, 'result', e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Remarks (Optional)
                            </label>
                            <Textarea
                              placeholder="Additional notes or observations..."
                              rows={2}
                              value={resultValues[item.id]?.remarks || ''}
                              onChange={(e) => handleResultChange(item.id, 'remarks', e.target.value)}
                            />
                          </div>

                          <Button
                            onClick={() => handleSaveResult(item.id)}
                            disabled={updateResultMutation.isPending}
                            className="w-full"
                          >
                            {updateResultMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Result
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}