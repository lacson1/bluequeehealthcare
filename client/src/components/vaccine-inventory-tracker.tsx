import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Package, Plus, AlertTriangle, Clock, CheckCircle2,
  Thermometer, Calendar, TrendingDown, TrendingUp, RefreshCw,
  Building2, BarChart3, AlertCircle, Edit, Trash2, Archive
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { STANDARD_VACCINE_SCHEDULES } from '@/lib/vaccine-schedules';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Mock inventory data (in production, this would come from API)
interface VaccineStock {
  id: number;
  vaccineName: string;
  manufacturer: string;
  lotNumber: string;
  quantity: number;
  initialQuantity: number;
  unitCost: number;
  expiryDate: string;
  storageTemp: string;
  receivedDate: string;
  location: string;
  status: 'active' | 'low' | 'expired' | 'expiring-soon';
}

const inventorySchema = z.object({
  vaccineName: z.string().min(1, 'Vaccine name is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  lotNumber: z.string().min(1, 'Lot number is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unitCost: z.coerce.number().min(0, 'Unit cost is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  storageTemp: z.string().min(1, 'Storage temperature is required'),
  location: z.string().min(1, 'Storage location is required'),
});

type InventoryForm = z.infer<typeof inventorySchema>;

// Mock data
const MOCK_INVENTORY: VaccineStock[] = [
  {
    id: 1,
    vaccineName: 'COVID-19 Vaccine (Pfizer)',
    manufacturer: 'Pfizer-BioNTech',
    lotNumber: 'PF2024-A1234',
    quantity: 45,
    initialQuantity: 100,
    unitCost: 25.00,
    expiryDate: '2025-06-30',
    storageTemp: '-70°C to -80°C',
    receivedDate: '2024-10-01',
    location: 'Freezer A',
    status: 'active',
  },
  {
    id: 2,
    vaccineName: 'Influenza Vaccine',
    manufacturer: 'Sanofi Pasteur',
    lotNumber: 'FLU2024-5678',
    quantity: 8,
    initialQuantity: 50,
    unitCost: 15.00,
    expiryDate: '2025-03-15',
    storageTemp: '2°C to 8°C',
    receivedDate: '2024-09-15',
    location: 'Refrigerator B',
    status: 'low',
  },
  {
    id: 3,
    vaccineName: 'Hepatitis B Vaccine',
    manufacturer: 'GSK',
    lotNumber: 'HEPB2024-9012',
    quantity: 120,
    initialQuantity: 200,
    unitCost: 18.50,
    expiryDate: '2026-12-31',
    storageTemp: '2°C to 8°C',
    receivedDate: '2024-08-20',
    location: 'Refrigerator A',
    status: 'active',
  },
  {
    id: 4,
    vaccineName: 'MMR Vaccine',
    manufacturer: 'Merck',
    lotNumber: 'MMR2024-3456',
    quantity: 0,
    initialQuantity: 30,
    unitCost: 22.00,
    expiryDate: '2024-12-01',
    storageTemp: '2°C to 8°C',
    receivedDate: '2024-06-01',
    location: 'Refrigerator B',
    status: 'expiring-soon',
  },
  {
    id: 5,
    vaccineName: 'DTaP Vaccine',
    manufacturer: 'Sanofi',
    lotNumber: 'DTAP2024-7890',
    quantity: 75,
    initialQuantity: 100,
    unitCost: 28.00,
    expiryDate: '2025-09-30',
    storageTemp: '2°C to 8°C',
    receivedDate: '2024-07-10',
    location: 'Refrigerator A',
    status: 'active',
  },
];

const STORAGE_KEY = 'vaccine_inventory_data';

// Load inventory from localStorage or use mock data
const loadInventoryFromStorage = (): VaccineStock[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that it's an array
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading inventory from storage:', error);
  }
  // Return mock data if nothing in storage
  return MOCK_INVENTORY;
};

// Save inventory to localStorage
const saveInventoryToStorage = (inventory: VaccineStock[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  } catch (error) {
    console.error('Error saving inventory to storage:', error);
  }
};

export function VaccineInventoryTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [inventory, setInventory] = useState<VaccineStock[]>(() => loadInventoryFromStorage());

  const form = useForm<InventoryForm>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      vaccineName: '',
      manufacturer: '',
      lotNumber: '',
      quantity: 0,
      unitCost: 0,
      expiryDate: '',
      storageTemp: '2°C to 8°C',
      location: '',
    },
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const total = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const lowStock = inventory.filter(item => item.status === 'low' || item.quantity < 20).length;
    const expiringSoon = inventory.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
    }).length;
    const expired = inventory.filter(item => new Date(item.expiryDate) < new Date()).length;

    return { total, totalValue, lowStock, expiringSoon, expired };
  }, [inventory]);

  // Filter inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = searchQuery === '' ||
        item.vaccineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lotNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [inventory, searchQuery, filterStatus]);

  const getStatusBadge = (item: VaccineStock) => {
    const expiryDate = new Date(item.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
      return <Badge className="bg-red-500"><AlertTriangle className="w-3 h-3 mr-1" /> Expired</Badge>;
    }
    if (daysUntilExpiry <= 90) {
      return <Badge className="bg-amber-500"><Clock className="w-3 h-3 mr-1" /> Expiring Soon</Badge>;
    }
    if (item.quantity < 20) {
      return <Badge className="bg-orange-500"><TrendingDown className="w-3 h-3 mr-1" /> Low Stock</Badge>;
    }
    return <Badge className="bg-emerald-500"><CheckCircle2 className="w-3 h-3 mr-1" /> In Stock</Badge>;
  };

  // Save to localStorage whenever inventory changes
  useEffect(() => {
    saveInventoryToStorage(inventory);
  }, [inventory]);

  const onSubmit = (data: InventoryForm) => {
    const newItem: VaccineStock = {
      id: Date.now(),
      ...data,
      initialQuantity: data.quantity,
      receivedDate: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    setInventory(prev => {
      const updated = [...prev, newItem];
      return updated;
    });
    setShowAddDialog(false);
    form.reset();
    toast({ title: 'Success', description: 'Vaccine stock added to inventory' });
  };

  const handleClearInventory = () => {
    setInventory([]);
    localStorage.removeItem(STORAGE_KEY); // Also remove from storage
    setShowClearDialog(false);
    toast({ 
      title: 'Inventory Cleared', 
      description: 'All vaccine inventory records have been removed',
      variant: 'default'
    });
  };

  const handleResetToDefault = () => {
    setInventory(MOCK_INVENTORY);
    saveInventoryToStorage(MOCK_INVENTORY); // Save default to storage
    setShowClearDialog(false);
    toast({ 
      title: 'Inventory Reset', 
      description: 'Inventory has been reset to default mock data',
      variant: 'default'
    });
  };

  const handleRemoveExpired = () => {
    const today = new Date();
    const activeInventory = inventory.filter(item => new Date(item.expiryDate) >= today);
    const removedCount = inventory.length - activeInventory.length;
    setInventory(activeInventory);
    // Storage will be updated by useEffect
    toast({ 
      title: 'Expired Items Removed', 
      description: `${removedCount} expired vaccine(s) have been removed from inventory`,
      variant: 'default'
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Doses</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600">Inventory Value</p>
                <p className="text-2xl font-bold text-emerald-700">${stats.totalValue.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-700">{stats.lowStock}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-amber-700">{stats.expiringSoon}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Expired</p>
                <p className="text-2xl font-bold text-red-700">{stats.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                Vaccine Inventory
              </CardTitle>
              <CardDescription>Track vaccine stock levels and expiry dates</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search vaccines..." 
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">In Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Archive className="h-4 w-4 mr-2" />
                    Clean Inventory
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      Clean Vaccine Inventory
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      Choose an action to clean the vaccine inventory database:
                    </p>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleRemoveExpired}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Expired Items Only
                        <span className="ml-auto text-xs text-muted-foreground">
                          ({inventory.filter(item => new Date(item.expiryDate) < new Date()).length} expired)
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleResetToDefault}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset to Default Mock Data
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        onClick={handleClearInventory}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Clear All Inventory
                        <span className="ml-auto text-xs">
                          ({inventory.length} items)
                        </span>
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowClearDialog(false)}>
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stock
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Vaccine Stock</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Vaccine Name *</Label>
                        <Select 
                          value={form.watch('vaccineName')}
                          onValueChange={(v) => form.setValue('vaccineName', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select vaccine" />
                          </SelectTrigger>
                          <SelectContent>
                            {STANDARD_VACCINE_SCHEDULES.map(v => (
                              <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                            ))}
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Manufacturer *</Label>
                        <Input {...form.register('manufacturer')} placeholder="e.g., Pfizer" />
                      </div>
                      <div className="space-y-2">
                        <Label>Lot Number *</Label>
                        <Input {...form.register('lotNumber')} placeholder="Batch/Lot #" />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity (Doses) *</Label>
                        <Input type="number" {...form.register('quantity')} />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Cost ($) *</Label>
                        <Input type="number" step="0.01" {...form.register('unitCost')} />
                      </div>
                      <div className="space-y-2">
                        <Label>Expiry Date *</Label>
                        <Input type="date" {...form.register('expiryDate')} />
                      </div>
                      <div className="space-y-2">
                        <Label>Storage Temperature *</Label>
                        <Select 
                          value={form.watch('storageTemp')}
                          onValueChange={(v) => form.setValue('storageTemp', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2°C to 8°C">2°C to 8°C (Refrigerated)</SelectItem>
                            <SelectItem value="-15°C to -25°C">-15°C to -25°C (Frozen)</SelectItem>
                            <SelectItem value="-70°C to -80°C">-70°C to -80°C (Ultra-cold)</SelectItem>
                            <SelectItem value="Room Temperature">Room Temperature</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Storage Location *</Label>
                        <Input {...form.register('location')} placeholder="e.g., Refrigerator A" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                        Add to Inventory
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vaccine</TableHead>
                  <TableHead>Lot Number</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500">No inventory items found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.vaccineName}</p>
                          <p className="text-xs text-slate-500">{item.manufacturer}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.lotNumber}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${item.quantity < 20 ? 'text-red-600' : 'text-slate-900'}`}>
                          {item.quantity} doses
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <Progress 
                            value={(item.quantity / item.initialQuantity) * 100} 
                            className="h-2"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            {Math.round((1 - item.quantity / item.initialQuantity) * 100)}% used
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>${item.unitCost.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Thermometer className="h-3 w-3 text-blue-500" />
                          {item.storageTemp}
                        </div>
                        <p className="text-xs text-slate-500">{item.location}</p>
                      </TableCell>
                      <TableCell>{getStatusBadge(item)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      {(stats.lowStock > 0 || stats.expiringSoon > 0 || stats.expired > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inventory.filter(item => item.quantity < 20).map(item => (
                <div key={`low-${item.id}`} className="flex items-center gap-2 text-sm">
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                  <span className="text-slate-700">
                    <strong>{item.vaccineName}</strong> is running low ({item.quantity} doses remaining)
                  </span>
                </div>
              ))}
              {inventory.filter(item => {
                const daysUntilExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
              }).map(item => (
                <div key={`exp-${item.id}`} className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-slate-700">
                    <strong>{item.vaccineName}</strong> (Lot: {item.lotNumber}) expires on {new Date(item.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {inventory.filter(item => new Date(item.expiryDate) < new Date()).map(item => (
                <div key={`expired-${item.id}`} className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-slate-700">
                    <strong>{item.vaccineName}</strong> (Lot: {item.lotNumber}) has expired - dispose properly
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

