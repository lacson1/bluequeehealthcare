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
  AlertTriangle
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

  const queryClient = useQueryClient();

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
    
    return matchesSearch && matchesStatus && matchesPatient;
  });

  const filteredResults = labResults.filter(result => {
    const matchesSearch = !searchTerm || 
      `${result.orderItem.labOrder.patient.firstName} ${result.orderItem.labOrder.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.orderItem.labTest.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPatient = !selectedPatient || result.orderItem.labOrder.patientId === selectedPatient;
    
    return matchesSearch && matchesPatient;
  });

  // Test categories for filtering
  const testCategories = Array.from(new Set(labTests.map(test => test.category)));

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

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patients or tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedPatient?.toString() || "all"} onValueChange={(value) => setSelectedPatient(value === "all" ? null : parseInt(value))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by patient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    {patient.firstName} {patient.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
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
                            {order.items.length} test{order.items.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.labTest.name}</p>
                                <p className="text-sm text-gray-600">{item.labTest.category}</p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(item.status)} variant="outline" size="sm">
                                  {item.status}
                                </Badge>
                                
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
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
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
                              {result.orderItem.labOrder.patient.firstName} {result.orderItem.labOrder.patient.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {result.orderItem.labTest.name} • Order #{result.orderItem.labOrder.id}
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
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
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
                      count + order.items.filter(item => item.labTest.category === category).length, 0
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
                    <FormLabel>Lab Tests</FormLabel>
                    <div className="max-h-64 overflow-y-auto border rounded-lg p-4 space-y-2">
                      {testCategories.map((category) => (
                        <div key={category} className="space-y-2">
                          <h4 className="font-medium text-gray-900 border-b pb-1">{category}</h4>
                          {labTests
                            .filter(test => test.category === category)
                            .map((test) => (
                              <div key={test.id} className="flex items-center space-x-2">
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
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {test.name}
                                </label>
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
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
    </div>
  );
}