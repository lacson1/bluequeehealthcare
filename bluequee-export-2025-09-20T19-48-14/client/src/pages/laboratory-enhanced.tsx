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
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

// Form schemas
const labOrderSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  tests: z.array(z.object({
    id: z.number(),
    name: z.string(),
    category: z.string()
  })).min(1, "At least one test is required"),
  clinicalNotes: z.string().optional(),
  diagnosis: z.string().optional(),
  priority: z.enum(["routine", "urgent", "stat"]).default("routine"),
  category: z.string().optional()
});

const labTestSchema = z.object({
  name: z.string().min(1, "Test name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  units: z.string().optional(),
  referenceRange: z.string().optional(),
  sampleType: z.string().optional(),
  methodOfCollection: z.string().optional(),
  estimatedTime: z.string().optional(),
  cost: z.string().optional(),
  priority: z.enum(["routine", "urgent", "stat"]).default("routine")
});

const batchResultsSchema = z.object({
  results: z.array(z.object({
    itemId: z.number(),
    value: z.string().min(1, "Result value is required"),
    remarks: z.string().optional(),
    isAbnormal: z.boolean().default(false)
  }))
});

type LabOrder = {
  id: number;
  patientId: number;
  status: string;
  priority: string;
  createdAt: string;
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone: string;
  };
  orderedByUser: {
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  itemCount: number;
  completedItems: number;
  totalCost?: string;
  clinicalNotes?: string;
  diagnosis?: string;
};

type LabTest = {
  id: number;
  name: string;
  category: string;
  description?: string;
  units?: string;
  referenceRange?: string;
  sampleType?: string;
  methodOfCollection?: string;
  estimatedTime?: string;
  cost?: string;
  priority: string;
  isActive: boolean;
};

type Patient = {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone?: string;
};

export default function LaboratoryEnhanced() {
  const [activeTab, setActiveTab] = useState("orders");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isCreateTestOpen, setIsCreateTestOpen] = useState(false);
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const queryClient = useQueryClient();

  // Queries
  const { data: labOrders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ["/api/lab-orders/enhanced", filterStatus, filterPriority],
    refetchInterval: 30000
  });

  const { data: labTests = [], isLoading: testsLoading } = useQuery({
    queryKey: ["/api/lab-tests"]
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"]
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/lab-analytics"],
    refetchInterval: 60000
  });

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof labOrderSchema>) => {
      const response = await fetch("/api/lab-orders/enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create lab order");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Lab Order Created", description: "Lab order has been successfully created." });
      setIsCreateOrderOpen(false);
      setSelectedPatient(null);
      setSelectedTests([]);
      queryClient.invalidateQueries({ queryKey: ["/api/lab-orders/enhanced"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-analytics"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create lab order",
        variant: "destructive" 
      });
    }
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof labTestSchema>) => {
      const response = await fetch("/api/lab-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create lab test");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Lab Test Created", description: "Lab test has been successfully created." });
      setIsCreateTestOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/lab-tests"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create lab test",
        variant: "destructive" 
      });
    }
  });

  // Forms
  const orderForm = useForm<z.infer<typeof labOrderSchema>>({
    resolver: zodResolver(labOrderSchema),
    defaultValues: {
      priority: "routine",
      tests: [],
      clinicalNotes: "",
      diagnosis: ""
    }
  });

  const testForm = useForm<z.infer<typeof labTestSchema>>({
    resolver: zodResolver(labTestSchema),
    defaultValues: {
      priority: "routine"
    }
  });

  // Filter orders
  const filteredOrders = labOrders.filter((order: LabOrder) => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesPriority = filterPriority === "all" || order.priority === filterPriority;
    const matchesSearch = searchTerm === "" || 
      order.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Get unique categories for filtering
  const categories = ["all", ...Array.from(new Set(labTests.map((test: LabTest) => test.category)))];

  // Filter tests by category and search
  const filteredTests = labTests.filter((test: LabTest) => {
    const matchesCategory = selectedCategory === "all" || test.category === selectedCategory;
    const matchesSearch = searchTerm === "" || 
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch && test.isActive;
  });

  // Handle order creation
  const onCreateOrder = (data: z.infer<typeof labOrderSchema>) => {
    createOrderMutation.mutate(data);
  };

  // Handle test creation
  const onCreateTest = (data: z.infer<typeof labTestSchema>) => {
    createTestMutation.mutate(data);
  };

  // Handle test selection
  const toggleTestSelection = (test: LabTest) => {
    const isSelected = selectedTests.some(t => t.id === test.id);
    if (isSelected) {
      setSelectedTests(selectedTests.filter(t => t.id !== test.id));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  // Priority colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "stat": return "bg-red-100 text-red-800 border-red-200";
      case "urgent": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "in_progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laboratory Management</h1>
          <p className="text-gray-600 mt-1">Enhanced lab order processing and results management</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetchOrders()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.metrics.totalOrders}</p>
                </div>
                <TestTube className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.metrics.completedOrders}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.metrics.completionRate}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Turnaround</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.metrics.avgTurnaroundHours}h</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orders">Lab Orders</TabsTrigger>
          <TabsTrigger value="tests">Lab Tests</TabsTrigger>
          <TabsTrigger value="results">Results Entry</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Lab Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="stat">STAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Create New Lab Order</DialogTitle>
                  <DialogDescription>
                    Select patient and tests for the new lab order
                  </DialogDescription>
                </DialogHeader>
                <Form {...orderForm}>
                  <form onSubmit={orderForm.handleSubmit(onCreateOrder)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={orderForm.control}
                        name="patientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a patient" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {patients.map((patient: Patient) => (
                                  <SelectItem key={patient.id} value={patient.id.toString()}>
                                    {patient.firstName} {patient.lastName} - {format(new Date(patient.dateOfBirth), 'MM/dd/yyyy')}
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
                            <Select value={field.value} onValueChange={field.onChange}>
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
                    </div>

                    {/* Test Selection */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Label className="text-base font-medium">Select Tests</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTests(filteredTests)}
                          >
                            Select All
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTests([])}
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                      
                      {/* Category Filter */}
                      <div className="mb-3">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category === "all" ? "All Categories" : category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="max-h-60 overflow-y-auto border rounded-md p-4">
                        <div className="grid grid-cols-2 gap-2">
                          {filteredTests.map((test: LabTest) => (
                            <div key={test.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedTests.some(t => t.id === test.id)}
                                onCheckedChange={() => toggleTestSelection(test)}
                              />
                              <label className="text-sm font-medium cursor-pointer flex-1">
                                {test.name} ({test.category})
                                {test.cost && <span className="text-gray-500 ml-2">${test.cost}</span>}
                              </label>
                            </div>
                          ))}
                        </div>
                        {filteredTests.length === 0 && (
                          <p className="text-center text-gray-500 py-4">No tests found for selected category</p>
                        )}
                      </div>
                      
                      {selectedTests.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-800 mb-2">
                            Selected Tests ({selectedTests.length}):
                          </p>
                          <div className="grid grid-cols-2 gap-1 text-xs text-blue-600">
                            {selectedTests.map(t => (
                              <span key={t.id}>• {t.name}</span>
                            ))}
                          </div>
                          {selectedTests.some(t => t.cost) && (
                            <p className="text-sm font-medium text-blue-800 mt-2">
                              Total Cost: ${selectedTests.reduce((sum, t) => sum + (parseFloat(t.cost || '0')), 0).toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={orderForm.control}
                        name="clinicalNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clinical Notes</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Enter clinical notes..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={orderForm.control}
                        name="diagnosis"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Diagnosis</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Enter diagnosis..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateOrderOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createOrderMutation.isPending || selectedTests.length === 0}
                        onClick={() => {
                          orderForm.setValue("tests", selectedTests.map(t => ({ id: t.id, name: t.name, category: t.category })));
                          orderForm.setValue("category", selectedCategory === "all" ? "" : selectedCategory);
                        }}
                      >
                        {createOrderMutation.isPending ? "Creating..." : "Create Order"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No lab orders found</p>
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order: LabOrder) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-gray-600">
                          <p className="font-medium">
                            {order.patient.firstName} {order.patient.lastName}
                          </p>
                          <p className="text-sm">
                            DOB: {format(new Date(order.patient.dateOfBirth), 'MM/dd/yyyy')}
                            {order.patient.phone && ` • Phone: ${order.patient.phone}`}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>Ordered by: {order.orderedByUser.firstName} {order.orderedByUser.lastName} ({order.orderedByUser.role})</p>
                          <p>Created: {format(new Date(order.createdAt), 'PPp')}</p>
                        </div>
                        {order.clinicalNotes && (
                          <div className="text-sm">
                            <span className="font-medium">Clinical Notes:</span> {order.clinicalNotes}
                          </div>
                        )}
                        {order.diagnosis && (
                          <div className="text-sm">
                            <span className="font-medium">Diagnosis:</span> {order.diagnosis}
                          </div>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-sm text-gray-600">
                          <p>{order.completedItems}/{order.itemCount} tests completed</p>
                          {order.totalCost && <p className="font-medium">Total: ${order.totalCost}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(order.completedItems / order.itemCount) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Lab Tests Tab */}
        <TabsContent value="tests" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Lab Tests Management</h2>
            <Dialog open={isCreateTestOpen} onOpenChange={setIsCreateTestOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Test
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Lab Test</DialogTitle>
                  <DialogDescription>
                    Add a new lab test to the system
                  </DialogDescription>
                </DialogHeader>
                <Form {...testForm}>
                  <form onSubmit={testForm.handleSubmit(onCreateTest)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={testForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Test Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter test name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={testForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Blood Test" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={testForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Test description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={testForm.control}
                        name="units"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Units</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., mg/dL" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={testForm.control}
                        name="cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cost</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" placeholder="0.00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={testForm.control}
                        name="estimatedTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Time</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., 2-4 hours" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={testForm.control}
                      name="referenceRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Range</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 3.5-5.0" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateTestOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createTestMutation.isPending}>
                        {createTestMutation.isPending ? "Creating..." : "Create Test"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testsLoading ? (
              <div className="col-span-full flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : labTests.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Microscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No lab tests configured</p>
              </div>
            ) : (
              labTests.map((test: LabTest) => (
                <Card key={test.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{test.name}</h3>
                        <Badge className={getPriorityColor(test.priority)}>
                          {test.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{test.category}</p>
                      {test.description && (
                        <p className="text-sm text-gray-500">{test.description}</p>
                      )}
                      <div className="space-y-1 text-xs text-gray-500">
                        {test.units && <p>Units: {test.units}</p>}
                        {test.referenceRange && <p>Range: {test.referenceRange}</p>}
                        {test.estimatedTime && <p>Time: {test.estimatedTime}</p>}
                        {test.cost && <p className="font-medium text-green-600">Cost: ${test.cost}</p>}
                      </div>
                      <div className="flex justify-end gap-1 pt-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Results Entry Tab */}
        <TabsContent value="results" className="space-y-4">
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Results Entry</h3>
            <p className="text-gray-500">Batch results entry functionality coming soon</p>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Lab Reports</h3>
            <p className="text-gray-500">Advanced reporting and analytics coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}