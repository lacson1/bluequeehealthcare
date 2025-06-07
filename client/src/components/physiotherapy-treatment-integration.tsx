import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Pill, 
  ShoppingCart, 
  FileCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Calendar,
  DollarSign,
  Package,
  Clipboard,
  Send,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Shield,
  Users,
  Building
} from 'lucide-react';

interface PhysiotherapyTreatmentIntegrationProps {
  patientId: number;
  currentUser: any;
}

export default function PhysiotherapyTreatmentIntegration({ patientId, currentUser }: PhysiotherapyTreatmentIntegrationProps) {
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [showEquipmentRequest, setShowEquipmentRequest] = useState(false);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const { toast } = useToast();

  // Fetch relevant data
  const { data: patient } = useQuery({
    queryKey: ['/api/patients', patientId],
  });

  const { data: prescriptions } = useQuery({
    queryKey: ['/api/prescriptions', patientId],
  });

  const { data: medicines } = useQuery({
    queryKey: ['/api/medicines'],
  });

  // Mutations for treatment integration
  const createPrescriptionMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/prescriptions', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      toast({ title: "Exercise prescription created successfully" });
    },
  });

  const createEquipmentRequestMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/equipment-requests', 'POST', data),
    onSuccess: () => {
      toast({ title: "Equipment request submitted successfully" });
    },
  });

  const createInsuranceClaimMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/insurance-claims', 'POST', data),
    onSuccess: () => {
      toast({ title: "Insurance documentation submitted" });
    },
  });

  // Treatment protocols with equipment and medication integration
  const treatmentProtocols = [
    {
      id: 1,
      name: "Lower Back Pain Rehabilitation",
      phase: "Strengthening Phase",
      duration: "4-6 weeks",
      equipmentNeeded: [
        { name: "Resistance Bands", type: "exercise", priority: "high", cost: "₦15,000" },
        { name: "Exercise Ball", type: "exercise", priority: "medium", cost: "₦25,000" },
        { name: "Heat Therapy Pack", type: "therapy", priority: "medium", cost: "₦8,000" }
      ],
      medications: [
        { name: "Ibuprofen", dosage: "400mg", frequency: "2x daily", duration: "2 weeks", type: "anti-inflammatory" },
        { name: "Topical Diclofenac Gel", dosage: "Apply thin layer", frequency: "3x daily", duration: "4 weeks", type: "topical" }
      ],
      exercises: [
        { name: "Cat-Cow Stretches", sets: 3, reps: 10, equipment: "None" },
        { name: "Dead Bug Exercise", sets: 3, reps: 8, equipment: "None" },
        { name: "Resistance Band Rows", sets: 3, reps: 12, equipment: "Resistance Bands" },
        { name: "Stability Ball Core", sets: 2, reps: 15, equipment: "Exercise Ball" }
      ]
    },
    {
      id: 2,
      name: "Post-Surgical Knee Recovery",
      phase: "Range of Motion Phase",
      duration: "6-8 weeks",
      equipmentNeeded: [
        { name: "Stationary Bike", type: "cardio", priority: "high", cost: "₦180,000" },
        { name: "Knee CPM Machine", type: "therapy", priority: "high", cost: "₦450,000" },
        { name: "Ice Machine", type: "therapy", priority: "medium", cost: "₦35,000" }
      ],
      medications: [
        { name: "Tramadol", dosage: "50mg", frequency: "3x daily", duration: "1 week", type: "pain-relief" },
        { name: "Aspirin", dosage: "81mg", frequency: "1x daily", duration: "6 weeks", type: "anticoagulant" }
      ],
      exercises: [
        { name: "Heel Slides", sets: 3, reps: 10, equipment: "None" },
        { name: "Quad Sets", sets: 3, reps: 10, equipment: "None" },
        { name: "Stationary Cycling", sets: 1, reps: "20 min", equipment: "Stationary Bike" }
      ]
    }
  ];

  // Available equipment catalog
  const equipmentCatalog = [
    { id: 1, name: "Resistance Bands Set", category: "Exercise", price: "₦15,000", availability: "In Stock" },
    { id: 2, name: "Exercise Ball (65cm)", category: "Exercise", price: "₦25,000", availability: "In Stock" },
    { id: 3, name: "Heat Therapy Pack", category: "Therapy", price: "₦8,000", availability: "Low Stock" },
    { id: 4, name: "TENS Unit", category: "Therapy", price: "₦85,000", availability: "Out of Stock" },
    { id: 5, name: "Cervical Pillow", category: "Support", price: "₦12,000", availability: "In Stock" },
    { id: 6, name: "Knee Brace", category: "Support", price: "₦35,000", availability: "In Stock" }
  ];

  const handleCreateExercisePrescription = (protocolData: any) => {
    const prescriptionData = {
      patientId,
      prescribedBy: currentUser.id,
      type: 'exercise',
      protocol: protocolData.name,
      exercises: protocolData.exercises,
      duration: protocolData.duration,
      phase: protocolData.phase,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    createPrescriptionMutation.mutate(prescriptionData);
  };

  const handleEquipmentRequest = (equipmentList: any[]) => {
    const requestData = {
      patientId,
      requestedBy: currentUser.id,
      equipment: equipmentList,
      priority: 'normal',
      justification: 'Required for physiotherapy treatment protocol',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    createEquipmentRequestMutation.mutate(requestData);
  };

  const handleInsuranceDocumentation = (formData: any) => {
    const claimData = {
      patientId,
      treatmentType: 'physiotherapy',
      diagnosis: formData.diagnosis,
      treatmentPlan: formData.treatmentPlan,
      estimatedSessions: formData.sessions,
      estimatedCost: formData.cost,
      providerId: currentUser.id,
      status: 'submitted',
      createdAt: new Date().toISOString()
    };

    createInsuranceClaimMutation.mutate(claimData);
  };

  return (
    <div className="space-y-6">
      {/* Integration Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Target className="w-5 h-5" />
            Treatment Plan Integration Hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <Pill className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-sm font-medium">Active Prescriptions</div>
              <div className="text-2xl font-bold text-blue-700">{prescriptions?.length || 0}</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <Package className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-sm font-medium">Equipment Requests</div>
              <div className="text-2xl font-bold text-green-700">3</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <FileCheck className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-sm font-medium">Insurance Claims</div>
              <div className="text-2xl font-bold text-purple-700">1</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <Shield className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-sm font-medium">Approval Rate</div>
              <div className="text-2xl font-bold text-orange-700">92%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="protocols" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="protocols">Treatment Protocols</TabsTrigger>
          <TabsTrigger value="prescriptions">Exercise Prescriptions</TabsTrigger>
          <TabsTrigger value="equipment">Equipment Management</TabsTrigger>
          <TabsTrigger value="insurance">Insurance Documentation</TabsTrigger>
        </TabsList>

        {/* Treatment Protocols with Integration */}
        <TabsContent value="protocols" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {treatmentProtocols.map((protocol) => (
              <Card key={protocol.id} className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">{protocol.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className="bg-blue-100 text-blue-700">{protocol.phase}</Badge>
                    <Badge variant="outline">{protocol.duration}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Required Equipment */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Required Equipment
                    </h4>
                    <div className="space-y-1">
                      {protocol.equipmentNeeded.map((equipment, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium">{equipment.name}</span>
                            <Badge 
                              variant="outline" 
                              className={`ml-2 text-xs ${
                                equipment.priority === 'high' ? 'border-red-300 text-red-700' :
                                equipment.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                                'border-green-300 text-green-700'
                              }`}
                            >
                              {equipment.priority}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-600">{equipment.cost}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Medication Support */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Pill className="w-4 h-4" />
                      Medication Support
                    </h4>
                    <div className="space-y-1">
                      {protocol.medications.map((medication, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-sm font-medium">{medication.name}</span>
                              <div className="text-xs text-gray-600">
                                {medication.dosage} - {medication.frequency} for {medication.duration}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {medication.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exercise Overview */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Exercise Protocol ({protocol.exercises.length} exercises)
                    </h4>
                    <div className="text-sm text-gray-600">
                      View detailed exercise instructions and progressions
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      onClick={() => handleCreateExercisePrescription(protocol)}
                      className="flex-1"
                      disabled={createPrescriptionMutation.isPending}
                    >
                      <Clipboard className="w-4 h-4 mr-2" />
                      Create Prescription
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleEquipmentRequest(protocol.equipmentNeeded)}
                      disabled={createEquipmentRequestMutation.isPending}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Request Equipment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Exercise Prescriptions */}
        <TabsContent value="prescriptions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Prescriptions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clipboard className="w-4 h-4" />
                  Active Exercise Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {prescriptions?.filter((p: any) => p.type === 'exercise').map((prescription: any) => (
                  <Card key={prescription.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{prescription.protocol || prescription.medication}</h4>
                          <p className="text-sm text-gray-600">{prescription.phase || 'Exercise Protocol'}</p>
                        </div>
                        <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                          {prescription.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Duration:</span> {prescription.duration || prescription.frequency}
                        </div>
                        <div>
                          <span className="font-medium">Prescribed:</span> {new Date(prescription.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <Clipboard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No exercise prescriptions found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Prescription
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update Exercise Protocol
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export Prescription
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  View Patient Progress
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Equipment Management */}
        <TabsContent value="equipment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Equipment Catalog */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Equipment Catalog
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {equipmentCatalog.map((equipment) => (
                  <Card key={equipment.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{equipment.name}</h4>
                          <p className="text-sm text-gray-600">{equipment.category}</p>
                        </div>
                        <Badge 
                          variant="outline"
                          className={
                            equipment.availability === 'In Stock' ? 'border-green-300 text-green-700' :
                            equipment.availability === 'Low Stock' ? 'border-yellow-300 text-yellow-700' :
                            'border-red-300 text-red-700'
                          }
                        >
                          {equipment.availability}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-600">{equipment.price}</span>
                        <Button size="sm" variant="outline">
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Request
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Equipment Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Equipment Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { item: "Resistance Bands Set", status: "Approved", date: "2024-01-20", cost: "₦15,000" },
                  { item: "Exercise Ball", status: "Pending", date: "2024-01-19", cost: "₦25,000" },
                  { item: "TENS Unit", status: "Under Review", date: "2024-01-18", cost: "₦85,000" }
                ].map((request, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{request.item}</h4>
                      <Badge 
                        variant="outline"
                        className={
                          request.status === 'Approved' ? 'bg-green-100 text-green-700' :
                          request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>Requested: {request.date}</div>
                      <div>Cost: {request.cost}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insurance Documentation */}
        <TabsContent value="insurance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Insurance Claim Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  Insurance Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  handleInsuranceDocumentation({
                    diagnosis: formData.get('diagnosis'),
                    treatmentPlan: formData.get('treatmentPlan'),
                    sessions: formData.get('sessions'),
                    cost: formData.get('cost')
                  });
                }}>
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Primary Diagnosis</Label>
                    <Input 
                      name="diagnosis" 
                      placeholder="Enter ICD-10 diagnosis code and description"
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="treatmentPlan">Treatment Plan Summary</Label>
                    <Textarea 
                      name="treatmentPlan"
                      placeholder="Describe the physiotherapy treatment plan..."
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sessions">Estimated Sessions</Label>
                      <Input 
                        name="sessions" 
                        type="number"
                        placeholder="12"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cost">Estimated Cost (₦)</Label>
                      <Input 
                        name="cost" 
                        type="number"
                        placeholder="150000"
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Required Documentation</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="medical-necessity" defaultChecked />
                        <Label htmlFor="medical-necessity" className="text-sm">Medical necessity documentation</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="treatment-goals" defaultChecked />
                        <Label htmlFor="treatment-goals" className="text-sm">Treatment goals and outcomes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="progress-tracking" defaultChecked />
                        <Label htmlFor="progress-tracking" className="text-sm">Progress tracking plan</Label>
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={createInsuranceClaimMutation.isPending}>
                    {createInsuranceClaimMutation.isPending ? 'Submitting...' : 'Submit Insurance Documentation'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Claim Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Insurance Claim Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { 
                      id: "CLM-2024-001", 
                      status: "Approved", 
                      amount: "₦180,000", 
                      date: "2024-01-15",
                      coverage: "90%" 
                    },
                    { 
                      id: "CLM-2024-002", 
                      status: "Under Review", 
                      amount: "₦150,000", 
                      date: "2024-01-20",
                      coverage: "Pending" 
                    }
                  ].map((claim) => (
                    <Card key={claim.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{claim.id}</h4>
                            <p className="text-sm text-gray-600">Submitted: {claim.date}</p>
                          </div>
                          <Badge 
                            variant="outline"
                            className={
                              claim.status === 'Approved' ? 'bg-green-100 text-green-700' :
                              'bg-yellow-100 text-yellow-700'
                            }
                          >
                            {claim.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Amount:</span> {claim.amount}
                          </div>
                          <div>
                            <span className="font-medium">Coverage:</span> {claim.coverage}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">92%</div>
                      <div className="text-sm text-green-600">Approval Rate</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">5.2</div>
                      <div className="text-sm text-blue-600">Avg Days to Approval</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}