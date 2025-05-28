import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Pill, 
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
  Shield,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MedicationSelectionGuide } from "@/components/medication-selection-guide";
import { z } from "zod";

// Enhanced schemas for pharmacy workflow
const dispensingSchema = z.object({
  prescriptionId: z.string(),
  medicineId: z.string(),
  quantity: z.number().min(1),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
  patientId: z.string(),
  dispensedBy: z.string()
});

const restockSchema = z.object({
  medicineId: z.string(),
  quantity: z.number().min(1),
  expiryDate: z.string(),
  batchNumber: z.string(),
  supplier: z.string(),
  costPrice: z.number().min(0),
  description: z.string().optional()
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
      medicineId: "",
      quantity: 1,
      dosage: "",
      frequency: "",
      duration: "",
      patientId: "",
      dispensedBy: ""
    }
  });

  // Restock form
  const restockForm = useForm<RestockForm>({
    resolver: zodResolver(restockSchema),
    defaultValues: {
      medicineId: "",
      quantity: 1,
      expiryDate: "",
      batchNumber: "",
      supplier: "",
      costPrice: 0,
      description: ""
    }
  });

  // Dispensing mutation
  const dispenseMutation = useMutation({
    mutationFn: async (data: DispensingForm) => {
      return apiRequest("POST", "/api/pharmacy/dispense", data);
    },
    onSuccess: () => {
      toast({
        title: "Medicine Dispensed",
        description: "Prescription has been successfully dispensed"
      });
      setShowDispensingDialog(false);
      dispensingForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to dispense medicine",
        variant: "destructive"
      });
    }
  });

  // Restock mutation
  const restockMutation = useMutation({
    mutationFn: async (data: RestockForm) => {
      return apiRequest("POST", "/api/pharmacy/restock", data);
    },
    onSuccess: () => {
      toast({
        title: "Stock Updated",
        description: "Medicine inventory has been updated"
      });
      setShowRestockDialog(false);
      restockForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive"
      });
    }
  });

  // Mock data for demonstration
  const pendingPrescriptions = [
    { id: "RX001", patient: "Abike Jare", medicine: "Amoxicillin 500mg", quantity: 10, urgency: "Normal" },
    { id: "RX002", patient: "Kemi Adebayo", medicine: "Paracetamol 500mg", quantity: 20, urgency: "Urgent" }
  ];

  const lowStockMedicines = medicines?.filter(m => m.quantity <= 10) || [];
  const outOfStockMedicines = medicines?.filter(m => m.quantity === 0) || [];

  const dispensingHistory = [
    { id: 1, prescriptionId: "RX001", patientName: "Abike Jare", medicine: "Amoxicillin 500mg", quantity: 10, dispensedAt: "2025-05-28 14:30", dispensedBy: "Akin Pharmacist" },
    { id: 2, prescriptionId: "RX002", patientName: "Kemi Adebayo", medicine: "Paracetamol 500mg", quantity: 20, dispensedAt: "2025-05-28 13:15", dispensedBy: "Akin Pharmacist" }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Pill className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Prescriptions</p>
                <p className="text-2xl font-bold">{pendingPrescriptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold">{lowStockMedicines.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold">{outOfStockMedicines.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Dispensed</p>
                <p className="text-2xl font-bold">{dispensingHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Pharmacy Workflow */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dispensing">Dispensing</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="restock">Restock</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
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
                              <Input placeholder="Enter prescription ID" {...field} />
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select medicine" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {medicines?.map((medicine) => (
                                  <SelectItem key={medicine.id} value={medicine.id.toString()}>
                                    {medicine.name} - Stock: {medicine.quantity}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={dispensingForm.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={dispensingForm.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 7 days" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowDispensingDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={dispenseMutation.isPending}>
                          {dispenseMutation.isPending ? "Dispensing..." : "Dispense Medicine"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

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
                      <div className={`w-3 h-3 rounded-full ${prescription.urgency === 'Urgent' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <div>
                        <div className="font-medium">{prescription.id} - {prescription.patient}</div>
                        <div className="text-sm text-gray-600">{prescription.medicine} × {prescription.quantity}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={prescription.urgency === 'Urgent' ? 'destructive' : 'secondary'}>
                        {prescription.urgency}
                      </Badge>
                      <Button size="sm" onClick={() => setShowDispensingDialog(true)}>
                        Dispense
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Dispensing History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Dispensing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dispensingHistory.map((record) => (
                  <div key={record.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{record.prescriptionId} - {record.patientName}</div>
                      <div className="text-sm text-gray-600">{record.medicine} × {record.quantity}</div>
                      <div className="text-xs text-gray-500">{record.dispensedAt} by {record.dispensedBy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would go here... */}
        <TabsContent value="low-stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Medicines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockMedicines.map((medicine) => (
                  <div key={medicine.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{medicine.name}</div>
                      <div className="text-sm text-gray-600">Current Stock: {medicine.quantity}</div>
                    </div>
                    <Badge variant="destructive">Low Stock</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restock" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Restock Medicines</h3>
            <Dialog open={showRestockDialog} onOpenChange={setShowRestockDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Truck className="w-4 h-4 mr-2" />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={restockForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={restockForm.control}
                        name="costPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cost Price (₦)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowRestockDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={restockMutation.isPending}>
                        {restockMutation.isPending ? "Adding Stock..." : "Add Stock"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

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
                    <span className="font-bold">{dispensingHistory.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Urgent Prescriptions</span>
                    <span className="font-bold text-red-600">
                      {pendingPrescriptions.filter(p => p.urgency === 'Urgent').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Out of Stock Items</span>
                    <span className="font-bold text-orange-600">
                      {medicines?.filter(m => m.quantity === 0).length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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