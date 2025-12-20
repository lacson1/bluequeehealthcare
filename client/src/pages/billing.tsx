import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, DollarSign, CreditCard, Receipt, Search, Filter, Download, Eye, Printer } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { openPrintWindowWithLetterhead } from "@/utils/organization-print";

// Form schemas
const invoiceSchema = z.object({
  patientId: z.number().min(1, "Please select a patient"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    serviceType: z.string().min(1, "Service type is required"),
    serviceId: z.number().optional(),
    quantity: z.number().min(0.01, "Quantity must be greater than 0"),
    unitPrice: z.number().min(0.01, "Unit price must be greater than 0")
  })).min(1, "At least one item is required")
});

const paymentSchema = z.object({
  invoiceId: z.number(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionId: z.string().optional(),
  notes: z.string().optional()
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;

export default function BillingPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showViewInvoice, setShowViewInvoice] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch organization data for invoice header
  const { data: organizationData } = useQuery({
    queryKey: ['/api/organizations', user?.organizationId],
    queryFn: () => fetch(`/api/organizations/${user?.organizationId}`).then(res => res.json()),
    enabled: !!user?.organizationId
  });

  // Fetch invoices
  const { data: invoices = [], isLoading: loadingInvoices } = useQuery<any[]>({
    queryKey: ['/api/invoices'],
  });

  // Fetch patients for invoice creation
  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ['/api/patients'],
  });

  // Fetch service prices for invoice creation
  const { data: servicePrices = [] } = useQuery({
    queryKey: ['/api/service-prices'],
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const response = await apiRequest('/api/invoices', 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      setShowCreateInvoice(false);
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest('/api/payments', 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      setShowRecordPayment(false);
      setSelectedInvoice(null);
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  // Invoice form
  const invoiceForm = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      patientId: 0,
      dueDate: "",
      notes: "",
      items: [{ description: "", serviceType: "", serviceId: 0, quantity: 1, unitPrice: 0 }]
    }
  });

  // Payment form
  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: selectedInvoice?.id || 0,
      amount: selectedInvoice?.balanceAmount ? parseFloat(selectedInvoice.balanceAmount) : 0,
      paymentMethod: "",
      transactionId: "",
      notes: ""
    }
  });

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice: any) => {
    const matchesSearch = invoice.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onCreateInvoice = (data: InvoiceFormData) => {
    createInvoiceMutation.mutate(data);
  };

  const onRecordPayment = (data: PaymentFormData) => {
    recordPaymentMutation.mutate({
      ...data,
      invoiceId: selectedInvoice.id
    });
  };

  const addInvoiceItem = () => {
    const currentItems = invoiceForm.getValues("items");
    invoiceForm.setValue("items", [
      ...currentItems,
      { description: "", serviceType: "", quantity: 1, unitPrice: 0 }
    ]);
  };

  const removeInvoiceItem = (index: number) => {
    const currentItems = invoiceForm.getValues("items");
    if (currentItems.length > 1) {
      invoiceForm.setValue("items", currentItems.filter((_, i) => i !== index));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: "secondary", label: "Draft" },
      sent: { variant: "outline", label: "Sent" },
      paid: { variant: "default", label: "Paid" },
      partial: { variant: "destructive", label: "Partial" },
      overdue: { variant: "destructive", label: "Overdue" },
      cancelled: { variant: "secondary", label: "Cancelled" }
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Print Invoice Function
  const printInvoice = async (invoice: any) => {
    try {
      const invoiceContent = `
        <style>
          .invoice-badge {
            background: #2563eb;
            color: white;
            padding: 15px 25px;
            text-align: center;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .invoice-badge h2 {
            margin: 0;
            font-size: 16px;
            letter-spacing: 2px;
          }
          .invoice-badge .number {
            font-size: 18px;
            font-weight: bold;
            margin-top: 5px;
          }
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          .info-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .info-box h3 {
            margin: 0 0 15px 0;
            font-size: 14px;
            text-transform: uppercase;
            color: #6b7280;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .info-label {
            color: #6b7280;
          }
          .info-value {
            font-weight: 600;
            color: #1f2937;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th {
            background: #2563eb;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-size: 13px;
            text-transform: uppercase;
          }
          .items-table td {
            padding: 15px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          .items-table tr:nth-child(even) {
            background: #f9fafb;
          }
          .items-table .amount {
            text-align: right;
            font-weight: 600;
          }
          .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          .totals-box {
            width: 300px;
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
          }
          .total-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            font-weight: bold;
            font-size: 18px;
            color: #2563eb;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-draft { background: #e5e7eb; color: #374151; }
          .status-sent { background: #dbeafe; color: #1d4ed8; }
          .status-paid { background: #d1fae5; color: #059669; }
          .status-partial { background: #fef3c7; color: #d97706; }
          .status-overdue { background: #fee2e2; color: #dc2626; }
        </style>
        
        <div class="invoice-badge">
          <h2>INVOICE</h2>
          <div class="number">${invoice.invoiceNumber}</div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h3>Bill To</h3>
            <div class="info-row">
              <span class="info-label">Patient:</span>
              <span class="info-value">${invoice.patientName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Patient ID:</span>
              <span class="info-value">${invoice.patientId || 'N/A'}</span>
            </div>
          </div>
          <div class="info-box">
            <h3>Invoice Details</h3>
            <div class="info-row">
              <span class="info-label">Issue Date:</span>
              <span class="info-value">${new Date(invoice.issueDate).toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Due Date:</span>
              <span class="info-value">${new Date(invoice.dueDate).toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="status-badge status-${invoice.status}">${invoice.status?.toUpperCase() || 'DRAFT'}</span>
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Service Type</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(invoice.items || []).map((item: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.description || 'Service'}</td>
                <td>${item.serviceType || 'General'}</td>
                <td style="text-align: center;">${item.quantity || 1}</td>
                <td class="amount">₦${parseFloat(item.unitPrice || 0).toLocaleString()}</td>
                <td class="amount">₦${(parseFloat(item.unitPrice || 0) * parseFloat(item.quantity || 1)).toLocaleString()}</td>
              </tr>
            `).join('')}
            ${(!invoice.items || invoice.items.length === 0) ? `
              <tr>
                <td colspan="6" style="text-align: center; color: #6b7280;">No items in this invoice</td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-box">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₦${parseFloat(invoice.totalAmount || 0).toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Amount Paid:</span>
              <span style="color: #059669;">₦${parseFloat(invoice.paidAmount || 0).toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Balance Due:</span>
              <span>₦${parseFloat(invoice.balanceAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        ${invoice.notes ? `
          <div class="info-box" style="margin-bottom: 20px;">
            <h3>Notes</h3>
            <p style="margin: 0; font-size: 14px;">${invoice.notes}</p>
          </div>
        ` : ''}
      `;

      await openPrintWindowWithLetterhead(
        invoiceContent,
        `Invoice ${invoice.invoiceNumber}`,
        {
          documentId: invoice.invoiceNumber,
          documentDate: invoice.issueDate,
          organizationId: user?.organizationId,
          organization: organizationData,
          pageSize: 'A4',
          autoPrint: true
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

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Billing & Invoicing</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={showCreateInvoice} onOpenChange={setShowCreateInvoice}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>
                  Create a new invoice for patient billing with multiple service items and automatic calculations.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...invoiceForm}>
                <form onSubmit={invoiceForm.handleSubmit(onCreateInvoice)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={invoiceForm.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select patient" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {patients.map((patient: any) => (
                                <SelectItem key={patient.id} value={patient.id.toString()}>
                                  {patient.firstName} {patient.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={invoiceForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Invoice Items</h3>
                      <Button type="button" variant="outline" onClick={addInvoiceItem}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </div>
                    
                    {invoiceForm.watch("items").map((_, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-4 gap-4">
                            <FormField
                              control={invoiceForm.control}
                              name={`items.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Service description" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={invoiceForm.control}
                              name={`items.${index}.serviceType`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Service Type</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="consultation">Consultation</SelectItem>
                                      <SelectItem value="lab_test">Lab Test</SelectItem>
                                      <SelectItem value="procedure">Procedure</SelectItem>
                                      <SelectItem value="medication">Medication</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={invoiceForm.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantity</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={invoiceForm.control}
                              name={`items.${index}.unitPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit Price (₦)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          {invoiceForm.watch("items").length > 1 && (
                            <div className="mt-4 flex justify-end">
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm"
                                onClick={() => removeInvoiceItem(index)}
                              >
                                Remove Item
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <FormField
                    control={invoiceForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateInvoice(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createInvoiceMutation.isPending}>
                      {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Recent Payments</TabsTrigger>
          <TabsTrigger value="analytics">Financial Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                Manage patient invoices and billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid Amount</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingInvoices ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">Loading invoices...</TableCell>
                    </TableRow>
                  ) : filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">No invoices found</TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.patientName}</TableCell>
                        <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>₦{parseFloat(invoice.totalAmount).toLocaleString()}</TableCell>
                        <TableCell>₦{parseFloat(invoice.paidAmount).toLocaleString()}</TableCell>
                        <TableCell>₦{parseFloat(invoice.balanceAmount).toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              title="View Invoice"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowViewInvoice(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {invoice.status !== 'paid' && parseFloat(invoice.balanceAmount) > 0 && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                title="Record Payment"
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setShowRecordPayment(true);
                                }}
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              title="Print Invoice"
                              onClick={() => printInvoice(invoice)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Payment history will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Analytics</CardTitle>
              <CardDescription>Revenue insights and financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Financial analytics will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog */}
      <Dialog open={showRecordPayment} onOpenChange={setShowRecordPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for invoice {selectedInvoice?.invoiceNumber} with details and transaction information.
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Invoice:</strong> {selectedInvoice.invoiceNumber}</p>
                <p><strong>Patient:</strong> {selectedInvoice.patientName}</p>
                <p><strong>Balance Due:</strong> ₦{parseFloat(selectedInvoice.balanceAmount).toLocaleString()}</p>
              </div>
              
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(onRecordPayment)} className="space-y-4">
                  <FormField
                    control={paymentForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Amount (₦)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={paymentForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="transfer">Bank Transfer</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={paymentForm.control}
                    name="transactionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction ID (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Transaction reference" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={paymentForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Payment notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowRecordPayment(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={recordPaymentMutation.isPending}>
                      {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={showViewInvoice} onOpenChange={setShowViewInvoice}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice {selectedInvoice?.invoiceNumber}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => selectedInvoice && printInvoice(selectedInvoice)}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </DialogTitle>
            <DialogDescription>
              View invoice details for {selectedInvoice?.patientName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Clinic Header */}
              {organizationData && (
                <div className="border-b-2 border-blue-600 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-blue-600">{organizationData.name}</h2>
                      <p className="text-sm text-gray-500 uppercase">{organizationData.type}</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      {organizationData.address && <p>{organizationData.address}</p>}
                      {organizationData.phone && <p>Tel: {organizationData.phone}</p>}
                      {organizationData.email && <p>Email: {organizationData.email}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Bill To</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">{selectedInvoice.patientName}</p>
                    <p className="text-sm text-gray-600">Patient ID: {selectedInvoice.patientId}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Invoice Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Date:</span>
                      <span className="font-medium">{new Date(selectedInvoice.issueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      {getStatusBadge(selectedInvoice.status)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Invoice Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedInvoice.items || []).map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.description || 'Service'}</TableCell>
                          <TableCell className="capitalize">{item.serviceType || 'General'}</TableCell>
                          <TableCell className="text-center">{item.quantity || 1}</TableCell>
                          <TableCell className="text-right">₦{parseFloat(item.unitPrice || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₦{(parseFloat(item.unitPrice || 0) * parseFloat(item.quantity || 1)).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!selectedInvoice.items || selectedInvoice.items.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500">
                            No items in this invoice
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Totals */}
              <div className="flex justify-end">
                <Card className="w-80">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₦{parseFloat(selectedInvoice.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Amount Paid:</span>
                      <span className="font-medium">₦{parseFloat(selectedInvoice.paidAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3 text-lg font-bold text-blue-600">
                      <span>Balance Due:</span>
                      <span>₦{parseFloat(selectedInvoice.balanceAmount || 0).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{selectedInvoice.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}