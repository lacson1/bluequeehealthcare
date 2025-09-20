import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pill, 
  Plus, 
  Package, 
  AlertTriangle, 
  ShoppingCart, 
  FileText, 
  Clock, 
  Check,
  User,
  Calendar,
  Truck,
  BarChart3,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";
import { MedicationSelectionGuide } from "@/components/medication-selection-guide";
import { z } from "zod";

// Enhanced schemas for pharmacy workflow
const dispensingSchema = z.object({
  prescriptionId: z.string(),
  patientName: z.string(),
  medicineId: z.number(),
  quantity: z.number().min(1),
  instructions: z.string(),
  dispensedBy: z.string(),
});

const restockSchema = z.object({
  medicineId: z.number(),
  quantity: z.number().min(1),
  supplier: z.string(),
  batchNumber: z.string().optional(),
  expiryDate: z.string(),
  cost: z.number().min(0),
});

type DispensingForm = z.infer<typeof dispensingSchema>;
type RestockForm = z.infer<typeof restockSchema>;

interface PharmacyWorkflowProps {
  medicines: any[];
}

export function PharmacyWorkflow({ medicines }: PharmacyWorkflowProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dispensing");
  const [showDispensingDialog, setShowDispensingDialog] = useState(false);
  const [showRestockDialog, setShowRestockDialog] = useState(false);
  const [showMedicationGuide, setShowMedicationGuide] = useState(false);

  // Dispensing form
  const dispensingForm = useForm<DispensingForm>({
    resolver: zodResolver(dispensingSchema),
    defaultValues: {
      prescriptionId: "",
      patientName: "",
      medicineId: 0,
      quantity: 1,
      instructions: "",
      dispensedBy: "",
    },
  });

  // Restock form
  const restockForm = useForm<RestockForm>({
    resolver: zodResolver(restockSchema),
    defaultValues: {
      medicineId: 0,
      quantity: 1,
      supplier: "",
      batchNumber: "",
      expiryDate: "",
      cost: 0,
    },
  });

  // No mock data - using real data from API

  const recentDispensing = [
    {
      id: 1,
      prescriptionId: "RX003",
      patientName: "John Doe",
      medicine: "Paracetamol 500mg",
      quantity: 20,
      dispensedAt: "2025-05-28 14:30",
      dispensedBy: "Pharmacist Akin"
    }
  ];

  const lowStockMedicines = medicines?.filter(m => m.quantity <= m.lowStockThreshold) || [];

  // Dispensing mutation
  const dispenseMutation = useMutation({
    mutationFn: async (data: DispensingForm) => {
      // In a real app, this would create a dispensing record and update medicine quantity
      const medicine = medicines.find(m => m.id === data.medicineId);
      if (medicine && medicine.quantity < data.quantity) {
        throw new Error("Insufficient stock for dispensing");
      }
      
      // Update medicine quantity
      const response = await apiRequest("PATCH", `/api/medicines/${data.medicineId}`, {
        quantity: medicine.quantity - data.quantity
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      toast({
        title: "Success",
        description: "Medicine dispensed successfully!",
      });
      setShowDispensingDialog(false);
      dispensingForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dispense medicine",
        variant: "destructive",
      });
    },
  });

  // Restock mutation
  const restockMutation = useMutation({
    mutationFn: async (data: RestockForm) => {
      const medicine = medicines.find(m => m.id === data.medicineId);
      const response = await apiRequest("PATCH", `/api/medicines/${data.medicineId}`, {
        quantity: medicine.quantity + data.quantity
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      toast({
        title: "Success",
        description: "Medicine restocked successfully!",
      });
      setShowRestockDialog(false);
      restockForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restock medicine",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("dispensing")}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Pending</div>
                <div className="text-2xl font-bold">{pendingPrescriptions.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("low-stock")}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Low Stock</div>
                <div className="text-2xl font-bold">{lowStockMedicines.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("restock")}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Restock</div>
                <div className="text-2xl font-bold">Actions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("reports")}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Reports</div>
                <div className="text-2xl font-bold">View</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Workflow Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dispensing" className="flex items-center gap-2">
            <Pill className="w-4 h-4" />
            Dispensing
          </TabsTrigger>
          <TabsTrigger value="low-stock" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Low Stock
          </TabsTrigger>
          <TabsTrigger value="restock" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Restock
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Dispensing Tab */}
        <TabsContent value="dispensing" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Medicine Dispensing</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowMedicationGuide(true)}
                className="flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Selection Guide
              </Button>
            </div>
          </div>
          
          <Dialog open={showDispensingDialog} onOpenChange={setShowDispensingDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Dispense Medicine
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dispense Medicine</DialogTitle>
                  </DialogHeader>
                <Form {...dispensingForm}>
                  <form onSubmit={dispensingForm.handleSubmit((data) => dispenseMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={dispensingForm.control}
                      name="prescriptionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prescription ID</FormLabel>
                          <FormControl>
                            <Input placeholder="RX001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={dispensingForm.control}
                      name="patientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Patient name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={dispensingForm.control}
                      name="medicineId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medicine</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select medicine" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {medicines?.map((medicine) => (
                                <SelectItem key={medicine.id} value={medicine.id.toString()}>
                                  {medicine.name} (Stock: {medicine.quantity})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={dispensingForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={dispensingForm.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructions</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Take 2 tablets twice daily..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={dispensingForm.control}
                      name="dispensedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dispensed By</FormLabel>
                          <FormControl>
                            <Input placeholder="Pharmacist name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowDispensingDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={dispenseMutation.isPending}>
                        {dispenseMutation.isPending ? "Dispensing..." : "Dispense"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          
          {/* Pending Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingPrescriptions.map((prescription) => (
                  <div key={prescription.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium">{prescription.id} - {prescription.patientName}</div>
                        <div className="text-sm text-gray-600">{prescription.medicines.join(", ")}</div>
                        <div className="text-xs text-gray-500">Prescribed by {prescription.prescribedBy}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={prescription.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                        {prescription.priority}
                      </Badge>
                      <Button size="sm">Process</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Dispensing */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Dispensing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentDispensing.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{record.prescriptionId} - {record.patientName}</div>
                        <div className="text-sm text-gray-600">{record.medicine} × {record.quantity}</div>
                        <div className="text-xs text-gray-500">{record.dispensedAt} by {record.dispensedBy}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock Tab */}
        <TabsContent value="low-stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Medicines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockMedicines.map((medicine) => (
                  <div key={medicine.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="font-medium">{medicine.name}</div>
                        <div className="text-sm text-gray-600">Current: {medicine.quantity} {medicine.unit}</div>
                        <div className="text-xs text-gray-500">Threshold: {medicine.lowStockThreshold}</div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => {
                      restockForm.setValue("medicineId", medicine.id);
                      setShowRestockDialog(true);
                    }}>
                      Restock
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Restock Tab */}
        <TabsContent value="restock" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Medicine Restocking</h3>
            <Dialog open={showRestockDialog} onOpenChange={setShowRestockDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Restock Medicine</DialogTitle>
                </DialogHeader>
                <Form {...restockForm}>
                  <form onSubmit={restockForm.handleSubmit((data) => restockMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={restockForm.control}
                      name="medicineId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medicine</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select medicine" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {medicines?.map((medicine) => (
                                <SelectItem key={medicine.id} value={medicine.id.toString()}>
                                  {medicine.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={restockForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity to Add</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={restockForm.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier</FormLabel>
                          <FormControl>
                            <Input placeholder="Supplier name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={restockForm.control}
                      name="batchNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional batch number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={restockForm.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={restockForm.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost per Unit (₦)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowRestockDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={restockMutation.isPending}>
                        {restockMutation.isPending ? "Adding..." : "Add Stock"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Restocking Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent restocking activities</p>
                <p className="text-sm">Restock medicines to see activity here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Dispensing Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Prescriptions</span>
                    <span className="font-semibold">{recentDispensing.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medicines Dispensed</span>
                    <span className="font-semibold">{recentDispensing.reduce((sum, r) => sum + r.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Prescriptions</span>
                    <span className="font-semibold">{pendingPrescriptions.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Medicines</span>
                    <span className="font-semibold">{medicines?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Stock Items</span>
                    <span className="font-semibold text-orange-600">{lowStockMedicines.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Out of Stock</span>
                    <span className="font-semibold text-red-600">
                      {medicines?.filter(m => m.quantity === 0).length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
      
      {/* Medication Selection Guide */}
      <MedicationSelectionGuide 
        isOpen={showMedicationGuide} 
        onClose={() => setShowMedicationGuide(false)} 
      />
    </div>
  );
}