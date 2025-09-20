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
  const [selectedMedicines, setSelectedMedicines] = useState<Set<number>>(new Set());

  // Debounced search to improve performance
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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

  // Get unique values for filters
  const uniqueUnits = useMemo(() => {
    if (!medicines) return [];
    const units = medicines.map(m => m.unit);
    return units.filter((unit, index) => units.indexOf(unit) === index).sort();
  }, [medicines]);

  const uniqueSuppliers = useMemo(() => {
    if (!medicines) return [];
    const suppliers = medicines.map(m => m.supplier).filter(Boolean) as string[];
    return suppliers.filter((supplier, index) => suppliers.indexOf(supplier) === index).sort();
  }, [medicines]);

  const uniqueCategories = useMemo(() => {
    if (!medicines) return [];
    // Extract categories from medicine names (e.g., "Paracetamol" -> "Analgesic")
    const categories = medicines.map(m => {
      const name = m.name.toLowerCase();
      if (name.includes('paracetamol') || name.includes('ibuprofen') || name.includes('aspirin')) return 'Analgesics';
      if (name.includes('amoxicillin') || name.includes('ciprofloxacin') || name.includes('azithromycin')) return 'Antibiotics';
      if (name.includes('vitamin') || name.includes('calcium') || name.includes('iron')) return 'Supplements';
      if (name.includes('losartan') || name.includes('amlodipine') || name.includes('atenolol')) return 'Cardiovascular';
      if (name.includes('insulin') || name.includes('metformin') || name.includes('glibenclamide')) return 'Diabetes';
      return 'Other';
    });
    return categories.filter((category, index) => categories.indexOf(category) === index).sort();
  }, [medicines]);

  // Helper function to check if medicine is expiring soon
  const isExpiringSoon = useCallback((medicine: Medicine) => {
    if (!medicine.expiryDate) return false;
    const today = new Date();
    const expiryDate = new Date(medicine.expiryDate);
    const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysToExpiry <= 30 && daysToExpiry > 0;
  }, []);

  const isExpired = useCallback((medicine: Medicine) => {
    if (!medicine.expiryDate) return false;
    const today = new Date();
    const expiryDate = new Date(medicine.expiryDate);
    return expiryDate < today;
  }, []);

  // Get category for a medicine
  const getMedicineCategory = useCallback((medicine: Medicine) => {
    const name = medicine.name.toLowerCase();
    if (name.includes('paracetamol') || name.includes('ibuprofen') || name.includes('aspirin')) return 'Analgesics';
    if (name.includes('amoxicillin') || name.includes('ciprofloxacin') || name.includes('azithromycin')) return 'Antibiotics';
    if (name.includes('vitamin') || name.includes('calcium') || name.includes('iron')) return 'Supplements';
    if (name.includes('losartan') || name.includes('amlodipine') || name.includes('atenolol')) return 'Cardiovascular';
    if (name.includes('insulin') || name.includes('metformin') || name.includes('glibenclamide')) return 'Diabetes';
    return 'Other';
  }, []);

  // Smart search function that handles medical abbreviations and synonyms
  const createSmartSearch = useCallback((searchTerm: string) => {
    const normalizedTerm = searchTerm.toLowerCase().trim();
    
    // Medical abbreviations and common terms mapping
    const medicalAbbreviations: { [key: string]: string[] } = {
      'pcm': ['paracetamol', 'acetaminophen'],
      'ace': ['acetaminophen', 'paracetamol'],
      'ibu': ['ibuprofen'],
      'asp': ['aspirin'],
      'amox': ['amoxicillin'],
      'cipro': ['ciprofloxacin'],
      'azith': ['azithromycin'],
      'met': ['metformin'],
      'ins': ['insulin'],
      'vit': ['vitamin'],
      'cal': ['calcium'],
      'tab': ['tablet', 'tablets'],
      'cap': ['capsule', 'capsules'],
      'syr': ['syrup'],
      'inj': ['injection'],
      'susp': ['suspension'],
      'mg': ['milligram', 'milligrams'],
      'ml': ['milliliter', 'milliliters'],
      'antibiotic': ['amoxicillin', 'ciprofloxacin', 'azithromycin', 'penicillin'],
      'painkiller': ['paracetamol', 'ibuprofen', 'aspirin', 'analgesic'],
      'fever': ['paracetamol', 'ibuprofen', 'aspirin'],
      'pain': ['paracetamol', 'ibuprofen', 'aspirin', 'analgesic']
    };

    // Get expanded search terms
    const expandedTerms = [normalizedTerm];
    
    // Add abbreviation expansions
    Object.entries(medicalAbbreviations).forEach(([abbrev, expansions]) => {
      if (normalizedTerm.includes(abbrev)) {
        expandedTerms.push(...expansions);
      }
      // Also check if any expansion matches and add the abbreviation
      expansions.forEach(expansion => {
        if (normalizedTerm.includes(expansion)) {
          expandedTerms.push(abbrev);
        }
      });
    });

    return expandedTerms;
  }, []);

  // Advanced filtering and search logic with comprehensive search capability
  const filteredAndSortedMedicines = useMemo(() => {
    if (!medicines) return [];

    let filtered = medicines.filter(medicine => {
      // Enhanced search with smart medical term matching
      let matchesSearch = debouncedSearchTerm === "";
      
      if (!matchesSearch && debouncedSearchTerm.trim()) {
        const searchTerms = createSmartSearch(debouncedSearchTerm);
        const medicineName = medicine.name.toLowerCase();
        const medicineDesc = medicine.description?.toLowerCase() || '';
        const medicineSupplier = medicine.supplier?.toLowerCase() || '';
        const medicineUnit = medicine.unit.toLowerCase();
        const medicineCategory = getMedicineCategory(medicine).toLowerCase();
        
        // Check if any search term matches any field
        matchesSearch = searchTerms.some(term => 
          // Direct name match
          medicineName.includes(term) ||
          // Description match
          medicineDesc.includes(term) ||
          // Supplier match
          medicineSupplier.includes(term) ||
          // Unit match
          medicineUnit.includes(term) ||
          // Category match
          medicineCategory.includes(term) ||
          // Word boundary matching for better accuracy
          new RegExp(`\\b${term}`, 'i').test(medicine.name) ||
          // Partial word matching at start of words
          medicineName.split(/[\s-]+/).some(word => word.startsWith(term)) ||
          // Dosage/strength pattern matching
          (term.includes('mg') && /\d+mg/i.test(medicineName)) ||
          (term.includes('ml') && /\d+ml/i.test(medicineName)) ||
          // Form-based matching
          (term === 'tablet' && /tablet|tab(?![a-z])/i.test(medicineName)) ||
          (term === 'capsule' && /capsule|cap(?![a-z])/i.test(medicineName)) ||
          (term === 'syrup' && /syrup|syr(?![a-z])/i.test(medicineName)) ||
          (term === 'injection' && /injection|inj(?![a-z])/i.test(medicineName))
        );
      }

      // Stock status filter
      const matchesStock = stockFilter === "all" || 
        (stockFilter === "in-stock" && medicine.quantity > medicine.lowStockThreshold) ||
        (stockFilter === "low-stock" && medicine.quantity <= medicine.lowStockThreshold && medicine.quantity > 0) ||
        (stockFilter === "out-of-stock" && medicine.quantity === 0);

      // Unit filter
      const matchesUnit = unitFilter === "all" || medicine.unit === unitFilter;

      // Supplier filter
      const matchesSupplier = supplierFilter === "all" || medicine.supplier === supplierFilter;

      // Category filter
      const matchesCategory = categoryFilter === "all" || getMedicineCategory(medicine) === categoryFilter;

      // Expiry filter
      const matchesExpiry = expiryFilter === "all" || 
        (expiryFilter === "expiring-soon" && isExpiringSoon(medicine)) ||
        (expiryFilter === "expired" && isExpired(medicine)) ||
        (expiryFilter === "valid" && !isExpired(medicine) && !isExpiringSoon(medicine));

      return matchesSearch && matchesStock && matchesUnit && matchesSupplier && matchesCategory && matchesExpiry;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
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

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Top Bar */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Pharmacy</h2>
            <p className="text-sm text-slate-500">Comprehensive pharmacy operations and patient care</p>
          </div>
        </div>
      </header>

      {/* Pharmacy Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="prescriptions" className="h-full flex flex-col">
          <div className="px-6 py-3 bg-gray-50 border-b">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
          </div>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="flex-1 overflow-hidden m-0 p-0">
            <PrescriptionQueue />
          </TabsContent>

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
                            value={field.value || ""}
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
                            <Input placeholder="e.g., ABC Pharmaceuticals" {...field} value={field.value || ""} />
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

              {/* Summary Cards */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex-shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Advanced Search and Filters */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search medicines by name, description, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {(stockFilter !== "all" || unitFilter !== "all" || supplierFilter !== "all") && (
                  <Badge variant="secondary" className="ml-2">
                    {[stockFilter, unitFilter, supplierFilter].filter(f => f !== "all").length}
                  </Badge>
                )}
              </Button>
              {(searchTerm || stockFilter !== "all" || unitFilter !== "all" || supplierFilter !== "all") && (
                <Button variant="ghost" onClick={clearAllFilters} className="flex items-center space-x-2">
                  <X className="h-4 w-4" />
                  <span>Clear</span>
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Stock Status Filter */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Stock Status</label>
                    <Select value={stockFilter} onValueChange={setStockFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stock Levels</SelectItem>
                        <SelectItem value="in-stock">In Stock</SelectItem>
                        <SelectItem value="low-stock">Low Stock</SelectItem>
                        <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {uniqueCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Expiry Filter */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Expiry Status</label>
                    <Select value={expiryFilter} onValueChange={setExpiryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="valid">Valid (more than 30 days)</SelectItem>
                        <SelectItem value="expiring-soon">Expiring Soon (30 days or less)</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Unit Filter */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Unit Type</label>
                    <Select value={unitFilter} onValueChange={setUnitFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Units</SelectItem>
                        {uniqueUnits.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Supplier Filter */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Supplier</label>
                    <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Suppliers</SelectItem>
                        {uniqueSuppliers.map(supplier => (
                          <SelectItem key={supplier} value={supplier!}>{supplier}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Sort By</label>
                    <div className="flex space-x-2">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="quantity">Quantity</SelectItem>
                          <SelectItem value="unit">Unit</SelectItem>
                          <SelectItem value="supplier">Supplier</SelectItem>
                          <SelectItem value="lowStockThreshold">Low Stock Threshold</SelectItem>
                          <SelectItem value="expiryDate">Expiry Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="px-3"
                      >
                        {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                Showing {filteredAndSortedMedicines.length} of {medicines?.length || 0} medicines
                {debouncedSearchTerm && (
                  <span className="ml-2 font-medium">
                    for "{debouncedSearchTerm}"
                  </span>
                )}
              </span>
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>In Stock: {filteredAndSortedMedicines.filter(m => m.quantity > m.lowStockThreshold).length}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span>Low Stock: {filteredAndSortedMedicines.filter(m => isLowStock(m) && m.quantity > 0).length}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                  <span>Out of Stock: {filteredAndSortedMedicines.filter(m => m.quantity === 0).length}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

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
            ) : filteredAndSortedMedicines && filteredAndSortedMedicines.length > 0 ? (
              <div className="space-y-4">
                {filteredAndSortedMedicines.map((medicine) => (
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
            </div>
          </div>
          </TabsContent>

          <TabsContent value="activities" className="flex-1 overflow-hidden m-0 p-0">
            <div className="p-6">
              <PharmacyActivityLog />
            </div>
          </TabsContent>

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
