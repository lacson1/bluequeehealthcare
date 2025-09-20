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
import { Pill, Plus, Package, AlertTriangle, Search, Filter, X, SortAsc, SortDesc, Calendar, TrendingUp, BarChart3, Grid3X3, List, RefreshCw, Download, Upload, Activity, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useRole } from "@/components/role-guard";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMedicineSchema, type Medicine, type InsertMedicine } from "@shared/schema";
import { PharmacyActivityLog } from "@/components/pharmacy-activity-log";
import { EnhancedMedicationReview } from "@/components/enhanced-medication-review";

import { z } from "zod";

// Form schema for adding medicine
const addMedicineFormSchema = insertMedicineSchema.extend({
  expiryDate: z.string().optional(),
});

type AddMedicineForm = z.infer<typeof addMedicineFormSchema>;

export default function EnhancedPharmacyPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useRole();
  
  // State for dialogs and UI
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingQuantity, setEditingQuantity] = useState<Record<number, string>>({});
  const [selectedCurrency, setSelectedCurrency] = useState<'NGN' | 'USD' | 'GBP'>('NGN');

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch medicines
  const { data: medicines = [], isLoading, error } = useQuery({
    queryKey: ['/api/medicines'],
  });

  // Form for adding medicine
  const form = useForm<AddMedicineForm>({
    resolver: zodResolver(addMedicineFormSchema),
    defaultValues: {
      name: "",
      quantity: 0,
      unit: "",
      costPrice: 0,
      sellingPrice: 0,
      supplier: "",
      lowStockThreshold: 10,
    },
  });

  // Add medicine mutation
  const addMedicineMutation = useMutation({
    mutationFn: (data: AddMedicineForm) => apiRequest('POST', '/api/medicines', {
      ...data,
      expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : undefined,
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Medicine added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/medicines'] });
      setShowAddDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add medicine",
        variant: "destructive",
      });
    }
  });

  // Update medicine quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      apiRequest('PATCH', `/api/medicines/${id}`, { quantity }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stock quantity updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/medicines'] });
      setEditingQuantity({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quantity",
        variant: "destructive",
      });
    }
  });

  // Handle quantity update
  const handleQuantityUpdate = (medicineId: number, newQuantity: string) => {
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }
    
    updateQuantityMutation.mutate({ id: medicineId, quantity });
  };

  // Get unique values for filters
  const units = useMemo(() => {
    return Array.from(new Set(medicines.map((m: Medicine) => m.unit))).filter(Boolean);
  }, [medicines]);

  const suppliers = useMemo(() => {
    return Array.from(new Set(medicines.map((m: Medicine) => m.supplier))).filter(Boolean);
  }, [medicines]);

  // Filter and sort medicines
  const filteredMedicines = useMemo(() => {
    let filtered = medicines.filter((medicine: Medicine) => {
      const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStock = stockFilter === "all" || 
        (stockFilter === "low" && medicine.quantity <= medicine.lowStockThreshold) ||
        (stockFilter === "out" && medicine.quantity === 0) ||
        (stockFilter === "available" && medicine.quantity > 0);
      const matchesUnit = unitFilter === "all" || medicine.unit === unitFilter;
      const matchesSupplier = supplierFilter === "all" || medicine.supplier === supplierFilter;

      return matchesSearch && matchesStock && matchesUnit && matchesSupplier;
    });

    // Sort medicines
    filtered.sort((a: Medicine, b: Medicine) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case "sellingPrice":
          aValue = a.sellingPrice;
          bValue = b.sellingPrice;
          break;
        case "unit":
          aValue = a.unit.toLowerCase();
          bValue = b.unit.toLowerCase();
          break;
        case "supplier":
          aValue = (a.supplier || "").toLowerCase();
          bValue = (b.supplier || "").toLowerCase();
          break;
        case "lowStockThreshold":
          aValue = a.lowStockThreshold;
          bValue = b.lowStockThreshold;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [medicines, searchTerm, stockFilter, unitFilter, supplierFilter, sortBy, sortOrder]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setStockFilter("all");
    setUnitFilter("all");
    setSupplierFilter("all");
    setSortBy("name");
    setSortOrder("asc");
  };

  // Currency conversion rates (these would typically come from an API)
  const currencyRates = {
    NGN: 1,      // Base currency (Naira)
    USD: 0.0012, // 1 NGN = 0.0012 USD
    GBP: 0.001   // 1 NGN = 0.001 GBP
  };

  // Currency formatting function
  const formatCurrency = (amount: number, currency: 'NGN' | 'USD' | 'GBP' = selectedCurrency) => {
    const convertedAmount = amount * currencyRates[currency];
    const symbols = { NGN: '₦', USD: '$', GBP: '£' };
    
    return `${symbols[currency]}${convertedAmount.toLocaleString('en-US', {
      minimumFractionDigits: currency === 'NGN' ? 0 : 2,
      maximumFractionDigits: currency === 'NGN' ? 0 : 2
    })}`;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = medicines.length;
    const lowStock = medicines.filter((m: Medicine) => m.quantity <= m.lowStockThreshold).length;
    const outOfStock = medicines.filter((m: Medicine) => m.quantity === 0).length;
    const totalValue = medicines.reduce((sum: number, m: Medicine) => sum + (m.quantity * (parseFloat(m.cost || '0'))), 0);

    return { total, lowStock, outOfStock, totalValue };
  }, [medicines]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Enhanced Pharmacy</h2>
            <p className="text-sm text-slate-500">Comprehensive pharmacy operations and patient care</p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Currency Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Currency:</span>
              <Select value={selectedCurrency} onValueChange={(value: 'NGN' | 'USD' | 'GBP') => setSelectedCurrency(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">₦ NGN</SelectItem>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="GBP">£ GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle (only visible in inventory tab) */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">View:</span>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="inventory" className="h-full flex flex-col">
          <div className="px-6 py-3 bg-gray-50 border-b">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Activities
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Reviews
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="flex-1 overflow-hidden m-0 p-0">
            <div className="h-full flex flex-col">
              {/* Summary Cards */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Total Medicines</p>
                          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                        </div>
                        <Pill className="text-blue-600 h-8 w-8" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Low Stock</p>
                          <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
                        </div>
                        <AlertTriangle className="text-orange-600 h-8 w-8" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Out of Stock</p>
                          <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                        </div>
                        <Package className="text-red-600 h-8 w-8" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Total Value</p>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
                        </div>
                        <TrendingUp className="text-green-600 h-8 w-8" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Controls */}
              <div className="px-6 py-4 bg-white border-b flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search medicines..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Filters
                      {showFilters && <X className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
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
                                        <SelectItem value="ml">ML (Liquid)</SelectItem>
                                        <SelectItem value="sachets">Sachets</SelectItem>
                                        <SelectItem value="bottles">Bottles</SelectItem>
                                        <SelectItem value="vials">Vials</SelectItem>
                                        <SelectItem value="tubes">Tubes</SelectItem>
                                        <SelectItem value="boxes">Boxes</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Initial Quantity *</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="0"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                                    <FormLabel>Low Stock Alert *</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="10"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="costPrice"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Cost Price (₦)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="sellingPrice"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Selling Price (₦) *</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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

                            <div className="flex gap-2 pt-4">
                              <Button type="submit" disabled={addMedicineMutation.isPending} className="flex-1">
                                {addMedicineMutation.isPending ? "Adding..." : "Add Medicine"}
                              </Button>
                              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <Select value={stockFilter} onValueChange={setStockFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Stock Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Stock</SelectItem>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="low">Low Stock</SelectItem>
                          <SelectItem value="out">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={unitFilter} onValueChange={setUnitFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Unit Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Units</SelectItem>
                          {units.map(unit => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Suppliers</SelectItem>
                          {suppliers.map(supplier => (
                            <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="quantity">Quantity</SelectItem>
                          <SelectItem value="sellingPrice">Price</SelectItem>
                          <SelectItem value="unit">Unit</SelectItem>
                          <SelectItem value="supplier">Supplier</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button variant="outline" onClick={clearAllFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Medicine Display */}
              <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                  <div className="text-center py-8">Loading medicines...</div>
                ) : filteredMedicines.length > 0 ? (
                  viewMode === 'grid' ? (
                    // Grid View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredMedicines.map((medicine: Medicine) => (
                        <Card key={medicine.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-slate-800 mb-1">{medicine.name}</h3>
                                <p className="text-sm text-slate-500 mb-2">{medicine.unit}</p>
                                {medicine.supplier && (
                                  <p className="text-xs text-slate-400">by {medicine.supplier}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <Badge variant={
                                  medicine.quantity === 0 ? "destructive" :
                                  medicine.quantity <= medicine.lowStockThreshold ? "secondary" :
                                  "default"
                              }>
                                {medicine.quantity === 0 ? "Out of Stock" :
                                 medicine.quantity <= medicine.lowStockThreshold ? "Low Stock" :
                                 "In Stock"}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Quantity:</span>
                              <span className="font-medium">{medicine.quantity}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Price:</span>
                              <span className="font-medium">{formatCurrency(parseFloat(medicine.cost || '0'))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Low Stock Alert:</span>
                              <span className="font-medium">{medicine.lowStockThreshold}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {editingQuantity[medicine.id] !== undefined ? (
                              <>
                                <Input
                                  type="number"
                                  value={editingQuantity[medicine.id]}
                                  onChange={(e) => setEditingQuantity(prev => ({
                                    ...prev,
                                    [medicine.id]: e.target.value
                                  }))}
                                  className="flex-1"
                                  placeholder="New quantity"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleQuantityUpdate(medicine.id, editingQuantity[medicine.id])}
                                  disabled={updateQuantityMutation.isPending}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingQuantity(prev => {
                                    const newState = { ...prev };
                                    delete newState[medicine.id];
                                    return newState;
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
                                className="flex-1"
                              >
                                Update Stock
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                    // List View
                    <div className="space-y-4">
                      {filteredMedicines.map((medicine: Medicine) => (
                        <Card key={medicine.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-slate-800">{medicine.name}</h3>
                                    <p className="text-sm text-slate-500">{medicine.unit} • {medicine.supplier || 'No supplier'}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-sm text-slate-600">Quantity</p>
                                    <p className="text-lg font-semibold">{medicine.quantity}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-sm text-slate-600">Price</p>
                                    <p className="text-lg font-semibold">{formatCurrency(parseFloat(medicine.cost || '0'))}</p>
                                  </div>
                                  <div className="text-center">
                                    <Badge variant={
                                      medicine.quantity === 0 ? "destructive" :
                                      medicine.quantity <= medicine.lowStockThreshold ? "secondary" :
                                      "default"
                                    }>
                                      {medicine.quantity === 0 ? "Out of Stock" :
                                       medicine.quantity <= medicine.lowStockThreshold ? "Low Stock" :
                                       "In Stock"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-4">
                                {editingQuantity[medicine.id] !== undefined ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      value={editingQuantity[medicine.id]}
                                      onChange={(e) => setEditingQuantity(prev => ({
                                        ...prev,
                                        [medicine.id]: e.target.value
                                      }))}
                                      className="w-24"
                                      placeholder="Qty"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleQuantityUpdate(medicine.id, editingQuantity[medicine.id])}
                                      disabled={updateQuantityMutation.isPending}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingQuantity(prev => {
                                        const newState = { ...prev };
                                        delete newState[medicine.id];
                                        return newState;
                                      })}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
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
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <Pill className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-4 text-lg font-medium text-slate-900">No medicines found</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Try adjusting your search or filters.
                    </p>
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