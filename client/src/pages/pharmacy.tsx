import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Pill, Plus, Package, AlertTriangle, Search, Filter, X, SortAsc, SortDesc, Calendar, TrendingUp, BarChart3, Grid3X3, List, RefreshCw, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useRole } from "@/components/role-guard";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMedicineSchema, type Medicine, type InsertMedicine } from "@shared/schema";
import { PharmacyActivityLog } from "@/components/pharmacy-activity-log";
import { EnhancedMedicationReview } from "@/components/enhanced-medication-review";
import { PrescriptionQueue } from "@/components/prescription-queue";

import { z } from "zod";

// Form schema for adding medicine
const addMedicineFormSchema = insertMedicineSchema.extend({
  expiryDate: z.string().optional(),
});

type AddMedicineForm = z.infer<typeof addMedicineFormSchema>;

export default function Pharmacy() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useRole();
  const [editingQuantity, setEditingQuantity] = useState<{ [key: number]: string }>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expiryFilter, setExpiryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const form = useForm<AddMedicineForm>({
    resolver: zodResolver(addMedicineFormSchema),
    defaultValues: {
      name: "",
      description: "",
      quantity: undefined,
      unit: "",
      lowStockThreshold: undefined,
      supplier: "",
      expiryDate: "",
    },
  });

  const { data: medicines, isLoading } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
  });

  const addMedicineMutation = useMutation({
    mutationFn: async (data: AddMedicineForm) => {
      const medicineData = {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : null,
      };
      const response = await apiRequest("POST", "/api/medicines", medicineData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medicines/low-stock"] });
      toast({
        title: "Success",
        description: "Medicine added successfully!",
      });
      setShowAddDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add medicine",
        variant: "destructive",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const response = await apiRequest("PATCH", `/api/medicines/${id}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medicines/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Medicine quantity updated successfully!",
      });
      setEditingQuantity({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update medicine quantity.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateQuantity = (id: number) => {
    const newQuantity = parseInt(editingQuantity[id]);
    if (isNaN(newQuantity) || newQuantity < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }
    updateQuantityMutation.mutate({ id, quantity: newQuantity });
  };

  const isLowStock = (medicine: Medicine) => {
    return medicine.quantity <= medicine.lowStockThreshold;
  };

  const getStockStatus = (medicine: Medicine) => {
    if (medicine.quantity === 0) {
      return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
    } else if (isLowStock(medicine)) {
      return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Fixed Header */}
      <header className="healthcare-header px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-white drop-shadow-sm">Pharmacy Management</h2>
            <p className="text-white/90 font-medium">Comprehensive pharmacy operations and patient care</p>
          </div>
        </div>
      </header>

      {/* Pharmacy Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="prescriptions" className="h-full flex flex-col">
          <div className="px-6 py-3 bg-gradient-to-r from-background/95 to-muted/30 backdrop-blur-sm border-b border-border/60">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-muted/60 backdrop-blur-sm border border-border/50">
              <TabsTrigger value="prescriptions" className="font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">Prescriptions</TabsTrigger>
              <TabsTrigger value="inventory" className="font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">Inventory</TabsTrigger>
              <TabsTrigger value="activities" className="font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">Activities</TabsTrigger>
              <TabsTrigger value="reviews" className="font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">Reviews</TabsTrigger>
            </TabsList>
          </div>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="flex-1 overflow-hidden m-0 p-0">
            <PrescriptionQueue />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="flex-1 overflow-hidden m-0 p-0">
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 bg-white border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800">Medicine Inventory</h3>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Medicine
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Medicine</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit((data) => addMedicineMutation.mutate(data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Medicine Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Paracetamol 500mg" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="unit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unit *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="tablets">Tablets</SelectItem>
                                    <SelectItem value="capsules">Capsules</SelectItem>
                                    <SelectItem value="ml">Milliliters (ml)</SelectItem>
                                    <SelectItem value="vials">Vials</SelectItem>
                                    <SelectItem value="syrup">Syrup</SelectItem>
                                    <SelectItem value="injection">Injection</SelectItem>
                                    <SelectItem value="cream">Cream</SelectItem>
                                    <SelectItem value="ointment">Ointment</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Brief description of the medicine..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Initial Quantity *</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="lowStockThreshold"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Low Stock Threshold *</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
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
                            control={form.control}
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
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={addMedicineMutation.isPending}>
                            {addMedicineMutation.isPending ? "Adding..." : "Add Medicine"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Medicine List */}
              <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
                      <p className="text-gray-500">Loading medicines...</p>
                    </div>
                  </div>
                ) : medicines && medicines.length > 0 ? (
                  <div className="grid gap-4">
                    {medicines.slice(0, 20).map((medicine) => (
                      <Card key={medicine.id} className={`transition-all duration-200 hover:shadow-md ${isLowStock(medicine) ? 'border-orange-200 bg-orange-50' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-slate-900">{medicine.name}</h3>
                                  {medicine.description && (
                                    <p className="text-sm text-slate-600 mt-1">{medicine.description}</p>
                                  )}
                                </div>
                                {getStockStatus(medicine)}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-500">Quantity:</span>
                                  <div className="font-medium">{medicine.quantity} {medicine.unit}</div>
                                </div>
                                <div>
                                  <span className="text-slate-500">Low Stock:</span>
                                  <div className="font-medium">{medicine.lowStockThreshold}</div>
                                </div>
                                <div>
                                  <span className="text-slate-500">Supplier:</span>
                                  <div className="font-medium">{medicine.supplier || "N/A"}</div>
                                </div>
                                <div>
                                  <span className="text-slate-500">Expiry:</span>
                                  <div className="font-medium">
                                    {medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : "N/A"}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="ml-4 flex items-center space-x-2">
                              {editingQuantity[medicine.id] !== undefined ? (
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    value={editingQuantity[medicine.id]}
                                    onChange={(e) => setEditingQuantity(prev => ({ ...prev, [medicine.id]: e.target.value }))}
                                    className="w-20 h-8"
                                    min="0"
                                  />
                                  <Button size="sm" onClick={() => handleUpdateQuantity(medicine.id)}>
                                    Save
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setEditingQuantity(prev => {
                                      const updated = { ...prev };
                                      delete updated[medicine.id];
                                      return updated;
                                    })}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingQuantity(prev => ({ ...prev, [medicine.id]: medicine.quantity.toString() }))}
                                >
                                  Update Qty
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No medicines found</h3>
                    <p className="text-gray-500 mb-4">Start by adding your first medicine to the inventory.</p>
                    <Button onClick={() => setShowAddDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Medicine
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="flex-1 overflow-hidden m-0 p-0">
            <div className="p-6">
              <PharmacyActivityLog />
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="flex-1 overflow-hidden m-0 p-0">
            <div className="p-6">
              <EnhancedMedicationReview />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}