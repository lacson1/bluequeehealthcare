import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  Plus, 
  Search, 
  Filter,
  RefreshCw,
  ShoppingCart,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Medicine {
  id: number;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  supplier: string;
  cost: string;
  lowStockThreshold: number;
  defaultDosage?: string;
  defaultFrequency?: string;
  defaultDuration?: string;
  defaultInstructions?: string;
  commonConditions?: string;
  createdAt: string;
}

interface ReorderRequest {
  medicineId: number;
  quantity: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [reorderDialog, setReorderDialog] = useState(false);
  const [updateQuantityDialog, setUpdateQuantityDialog] = useState(false);
  const [newQuantity, setNewQuantity] = useState('');
  const { toast } = useToast();

  const { data: medicines = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/medicines']
  });

  const { data: lowStockMedicines = [] } = useQuery({
    queryKey: ['/api/medicines/low-stock']
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const response = await fetch(`/api/medicines/${id}/quantity`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ quantity })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medicines'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medicines/low-stock'] });
      setUpdateQuantityDialog(false);
      setSelectedMedicine(null);
      toast({
        title: "Success",
        description: "Medicine quantity updated successfully"
      });
    }
  });

  const reorderMutation = useMutation({
    mutationFn: async (reorderData: ReorderRequest) => {
      const response = await fetch('/api/medicines/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reorderData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create reorder request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setReorderDialog(false);
      setSelectedMedicine(null);
      toast({
        title: "Reorder Requested",
        description: "Your reorder request has been submitted successfully"
      });
    }
  });

  // Real-time inventory status check
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  const filteredMedicines = medicines
    .filter((medicine: Medicine) => {
      const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           medicine.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           medicine.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
      
      switch (filterBy) {
        case 'low-stock':
          return matchesSearch && medicine.quantity <= medicine.lowStockThreshold;
        case 'expired':
          return matchesSearch && medicine.expiryDate && new Date(medicine.expiryDate) < new Date();
        case 'expiring-soon':
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          return matchesSearch && medicine.expiryDate && 
                 new Date(medicine.expiryDate) > new Date() && 
                 new Date(medicine.expiryDate) <= thirtyDaysFromNow;
        default:
          return matchesSearch;
      }
    })
    .sort((a: Medicine, b: Medicine) => {
      switch (sortBy) {
        case 'quantity':
          return a.quantity - b.quantity;
        case 'expiry':
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const getStockStatus = (medicine: Medicine) => {
    if (medicine.quantity === 0) return { label: 'Out of Stock', color: 'bg-red-500 text-white' };
    if (medicine.quantity <= medicine.lowStockThreshold) return { label: 'Low Stock', color: 'bg-orange-500 text-white' };
    if (medicine.quantity <= medicine.lowStockThreshold * 2) return { label: 'Medium Stock', color: 'bg-yellow-500 text-white' };
    return { label: 'In Stock', color: 'bg-green-500 text-white' };
  };

  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { label: 'Expired', color: 'bg-red-500 text-white' };
    if (daysUntilExpiry <= 30) return { label: 'Expiring Soon', color: 'bg-orange-500 text-white' };
    if (daysUntilExpiry <= 90) return { label: 'Monitor', color: 'bg-yellow-500 text-white' };
    return null;
  };

  const inventoryStats = {
    totalMedicines: medicines.length,
    lowStock: medicines.filter((m: Medicine) => m.quantity <= m.lowStockThreshold).length,
    outOfStock: medicines.filter((m: Medicine) => m.quantity === 0).length,
    expiringSoon: medicines.filter((m: Medicine) => {
      if (!m.expiryDate) return false;
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return new Date(m.expiryDate) <= thirtyDaysFromNow && new Date(m.expiryDate) > new Date();
    }).length
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-gray-600">Real-time medication tracking and stock management</p>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{inventoryStats.totalMedicines}</div>
                <div className="text-sm text-gray-600">Total Medicines</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{inventoryStats.lowStock}</div>
                <div className="text-sm text-gray-600">Low Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{inventoryStats.outOfStock}</div>
                <div className="text-sm text-gray-600">Out of Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{inventoryStats.expiringSoon}</div>
                <div className="text-sm text-gray-600">Expiring Soon</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search medicines by name, description, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Medicines</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <BarChart3 className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="quantity">Sort by Quantity</SelectItem>
                <SelectItem value="expiry">Sort by Expiry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Medicine Inventory ({filteredMedicines.length} items)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMedicines.map((medicine: Medicine) => {
                const stockStatus = getStockStatus(medicine);
                const expiryStatus = getExpiryStatus(medicine.expiryDate);
                
                return (
                  <TableRow key={medicine.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{medicine.name}</div>
                        {medicine.description && (
                          <div className="text-sm text-gray-600">{medicine.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{medicine.quantity}</span>
                        <span className="text-gray-600">{medicine.unit}</span>
                        {medicine.quantity <= medicine.lowStockThreshold && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={stockStatus.color}>
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {medicine.expiryDate && (
                          <div className="text-sm">
                            {format(new Date(medicine.expiryDate), 'MMM dd, yyyy')}
                          </div>
                        )}
                        {expiryStatus && (
                          <Badge className={expiryStatus.color}>
                            {expiryStatus.label}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{medicine.supplier}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMedicine(medicine);
                            setNewQuantity(medicine.quantity.toString());
                            setUpdateQuantityDialog(true);
                          }}
                        >
                          Update Stock
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMedicine(medicine);
                            setReorderDialog(true);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Reorder
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Quantity Dialog */}
      <Dialog open={updateQuantityDialog} onOpenChange={setUpdateQuantityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock Quantity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMedicine && (
              <div>
                <Label>Medicine: {selectedMedicine.name}</Label>
                <p className="text-sm text-gray-600">Current stock: {selectedMedicine.quantity} {selectedMedicine.unit}</p>
              </div>
            )}
            <div>
              <Label htmlFor="quantity">New Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                placeholder="Enter new quantity"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (selectedMedicine && newQuantity) {
                    updateQuantityMutation.mutate({
                      id: selectedMedicine.id,
                      quantity: parseInt(newQuantity)
                    });
                  }
                }}
                disabled={updateQuantityMutation.isPending}
              >
                {updateQuantityMutation.isPending ? 'Updating...' : 'Update Quantity'}
              </Button>
              <Button variant="outline" onClick={() => setUpdateQuantityDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reorder Dialog */}
      <Dialog open={reorderDialog} onOpenChange={setReorderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Medicine Reorder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMedicine && (
              <div>
                <Label>Medicine: {selectedMedicine.name}</Label>
                <p className="text-sm text-gray-600">Current stock: {selectedMedicine.quantity} {selectedMedicine.unit}</p>
                <p className="text-sm text-gray-600">Supplier: {selectedMedicine.supplier}</p>
              </div>
            )}
            <div>
              <Label htmlFor="reorderQuantity">Quantity to Order</Label>
              <Input
                id="reorderQuantity"
                type="number"
                placeholder="Enter quantity to order"
                defaultValue={selectedMedicine?.lowStockThreshold ? selectedMedicine.lowStockThreshold * 3 : 100}
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" placeholder="Additional notes for the reorder request..." />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (selectedMedicine) {
                    const quantityInput = document.getElementById('reorderQuantity') as HTMLInputElement;
                    const prioritySelect = document.querySelector('[data-state="closed"]') as HTMLElement;
                    const notesTextarea = document.getElementById('notes') as HTMLTextAreaElement;
                    
                    reorderMutation.mutate({
                      medicineId: selectedMedicine.id,
                      quantity: parseInt(quantityInput.value),
                      priority: 'medium', // Default for now
                      notes: notesTextarea.value
                    });
                  }
                }}
                disabled={reorderMutation.isPending}
              >
                {reorderMutation.isPending ? 'Submitting...' : 'Submit Reorder Request'}
              </Button>
              <Button variant="outline" onClick={() => setReorderDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}