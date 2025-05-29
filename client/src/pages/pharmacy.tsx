import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, Plus, Package, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useRole } from "@/components/role-guard";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMedicineSchema, type Medicine, type InsertMedicine } from "@shared/schema";

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
    <>
      {/* Top Bar */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Pharmacy</h2>
            <p className="text-sm text-slate-500">Manage medicine inventory and stock levels</p>
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
                              <SelectItem value="mg">Milligrams (mg)</SelectItem>
                              <SelectItem value="bottles">Bottles</SelectItem>
                              <SelectItem value="boxes">Boxes</SelectItem>
                              <SelectItem value="vials">Vials</SelectItem>
                              <SelectItem value="tubes">Tubes</SelectItem>
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
                          <Textarea 
                            placeholder="Brief description of the medicine..."
                            className="resize-none"
                            {...field}
                          />
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
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder=""
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || undefined)}
                            />
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
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="10"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
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
                            <Input placeholder="e.g., ABC Pharmaceuticals" {...field} />
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
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addMedicineMutation.isPending}
                    >
                      {addMedicineMutation.isPending ? "Adding..." : "Add Medicine"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total Medicines</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">
                    {medicines?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Pill className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Low Stock Items</p>
                  <p className="text-3xl font-bold text-amber-600 mt-2">
                    {medicines?.filter(isLowStock).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-amber-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Out of Stock</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {medicines?.filter(m => m.quantity === 0).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Package className="text-red-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Pharmacy Workflow */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Pharmacy Workflow</h3>
          <p className="text-blue-700">Managing {(medicines || []).length} medicines in inventory</p>
        </div>

        {/* Medicine Inventory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Medicine Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-4 p-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                    <div className="w-20 h-8 bg-slate-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : medicines && medicines.length > 0 ? (
              <div className="space-y-4">
                {medicines.map((medicine) => (
                  <div
                    key={medicine.id}
                    className={`p-4 rounded-lg border-2 ${
                      isLowStock(medicine) 
                        ? medicine.quantity === 0 
                          ? "border-red-200 bg-red-50" 
                          : "border-yellow-200 bg-yellow-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-800">{medicine.name}</h4>
                        {medicine.description && (
                          <p className="text-sm text-slate-600 mt-1">{medicine.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                          <span>Unit: {medicine.unit}</span>
                          {medicine.supplier && <span>Supplier: {medicine.supplier}</span>}
                          {medicine.expiryDate && (
                            <span>Expires: {new Date(medicine.expiryDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium text-slate-800">
                            Current Stock: {medicine.quantity} {medicine.unit}
                          </p>
                          <p className="text-sm text-slate-500">
                            Threshold: {medicine.lowStockThreshold} {medicine.unit}
                          </p>
                        </div>
                        
                        {getStockStatus(medicine)}
                        
                        <div className="flex items-center space-x-2">
                          {editingQuantity[medicine.id] !== undefined ? (
                            <>
                              <Input
                                type="number"
                                value={editingQuantity[medicine.id]}
                                onChange={(e) => 
                                  setEditingQuantity(prev => ({
                                    ...prev,
                                    [medicine.id]: e.target.value
                                  }))
                                }
                                className="w-20"
                                min="0"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdateQuantity(medicine.id)}
                                disabled={updateQuantityMutation.isPending}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingQuantity(prev => {
                                  const { [medicine.id]: _, ...rest } = prev;
                                  return rest;
                                })}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingQuantity(prev => ({
                                ...prev,
                                [medicine.id]: medicine.quantity.toString()
                              }))}
                            >
                              Update Stock
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Pill className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-4 text-lg font-medium text-slate-900">No medicines in inventory</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Start by adding medicines to your pharmacy inventory.
                </p>
                <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Medicine
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
