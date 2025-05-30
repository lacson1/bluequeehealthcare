import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { FlaskRound, Plus, Search, User, TestTube, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface LabTest {
  id: number;
  name: string;
  category: string;
  description?: string;
  units?: string;
  referenceRange?: string;
}

interface LabOrder {
  id: number;
  patientId: number;
  orderedBy: string;
  status: string;
  notes?: string;
  createdAt: string;
  patient?: Patient;
  items?: LabOrderItem[];
}

interface LabOrderItem {
  id: number;
  labOrderId: number;
  labTestId: number;
  status: string;
  priority: string;
  labTest?: LabTest;
}

export default function LabOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [priority, setPriority] = useState('routine');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Get URL params for pre-filled patient
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledPatientId = urlParams.get('patientId');

  // Fetch lab orders
  const { data: labOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/lab-orders/pending'],
  });

  // Fetch patients for selection
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
  });

  // Fetch lab tests for selection
  const { data: labTests = [] } = useQuery({
    queryKey: ['/api/lab-tests'],
  });

  // Create lab order mutation
  const createLabOrderMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', `/api/patients/${data.patientId}/lab-orders`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-orders/pending'] });
      toast({ title: 'Success', description: 'Lab order created successfully' });
      resetForm();
      setIsCreating(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to create lab order',
        variant: 'destructive'
      });
    },
  });

  const resetForm = () => {
    setSelectedPatient(null);
    setSelectedTests([]);
    setPriority('routine');
    setNotes('');
  };

  const handleCreateLabOrder = () => {
    if (!selectedPatient || selectedTests.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a patient and at least one lab test',
        variant: 'destructive'
      });
      return;
    }

    createLabOrderMutation.mutate({
      patientId: selectedPatient,
      labTestIds: selectedTests,
      priority,
      notes
    });
  };

  const handleTestSelection = (testId: number, checked: boolean) => {
    if (checked) {
      setSelectedTests([...selectedTests, testId]);
    } else {
      setSelectedTests(selectedTests.filter(id => id !== testId));
    }
  };

  // Filter lab tests by category
  const categories = [...new Set(labTests.map((test: LabTest) => test.category))];
  const filteredTests = (selectedCategory && selectedCategory !== 'all')
    ? labTests.filter((test: LabTest) => test.category === selectedCategory)
    : labTests;

  // Filter lab orders
  const filteredOrders = labOrders.filter((order: LabOrder) => {
    if (!searchTerm) return true;
    const patient = order.patient;
    return (
      patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.orderedBy && order.orderedBy.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Pre-fill patient if coming from patient profile
  React.useEffect(() => {
    if (prefilledPatientId) {
      setSelectedPatient(parseInt(prefilledPatientId));
      setIsCreating(true);
    }
  }, [prefilledPatientId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Orders</h1>
          <p className="text-gray-600">Order and manage laboratory tests</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Lab Order
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search lab orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Lab Order Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Lab Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient *</Label>
                <Select value={selectedPatient?.toString() || ''} onValueChange={(value) => setSelectedPatient(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient: Patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="stat">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Select Lab Tests *</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTests.map((test: LabTest) => (
                    <div key={test.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={`test-${test.id}`}
                        checked={selectedTests.includes(test.id)}
                        onCheckedChange={(checked) => handleTestSelection(test.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={`test-${test.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {test.name}
                        </label>
                        <p className="text-xs text-gray-500">{test.category}</p>
                        {test.description && (
                          <p className="text-xs text-gray-400 mt-1">{test.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedTests.length > 0 && (
                <div className="text-sm text-blue-600">
                  {selectedTests.length} test(s) selected
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Clinical Notes</Label>
              <Textarea
                placeholder="Clinical indication, special instructions, or additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateLabOrder}
                disabled={createLabOrderMutation.isPending}
              >
                {createLabOrderMutation.isPending ? 'Creating...' : 'Create Lab Order'}
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lab Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Lab Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-8">Loading lab orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending lab orders found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order: LabOrder) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">
                          {order.patient?.firstName} {order.patient?.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TestTube className="h-4 w-4 text-green-600" />
                        <span>Ordered by: {order.orderedBy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span>{format(new Date(order.createdAt), 'MMM dd, yyyy - HH:mm')}</span>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                        {order.status}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/lab-results?orderId=${order.id}`)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                  
                  {order.items && order.items.length > 0 && (
                    <div className="ml-6">
                      <p className="text-sm font-medium text-gray-700 mb-2">Ordered Tests:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {order.items.map((item: LabOrderItem) => (
                          <div key={item.id} className="text-sm text-gray-600 flex items-center gap-2">
                            <FlaskRound className="h-3 w-3" />
                            <span>{item.labTest?.name}</span>
                            <span className="text-xs text-gray-400">({item.priority})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {order.notes && (
                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Clinical Notes:</strong> {order.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}