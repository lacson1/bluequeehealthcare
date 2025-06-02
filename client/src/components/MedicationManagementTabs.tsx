import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Clock,
  Pill,
  Activity,
  FileText,
  Archive,
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Download,
  Printer,
  Trash2,
  Edit,
  QrCode,
  CheckSquare,
  Square,
  MoreHorizontal
} from 'lucide-react';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
}

interface Prescription {
  id: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: string;
  pharmacyStatus: string;
  startDate: string;
  endDate?: string;
  dispensedAt?: string;
  collectedAt?: string;
  qrCode?: string;
  isRepeat: boolean;
}

interface PastMedication {
  id: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  startDate: string;
  endDate?: string;
  discontinueReason?: string;
  effectiveness?: string;
  sideEffects?: string;
  adherence?: string;
  prescribedBy: string;
}

interface RepeatPrescriptionList {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  totalItems: number;
  nextOrderDate?: string;
  lastOrderedDate?: string;
}

interface RepeatPrescriptionItem {
  id: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity?: string;
  instructions?: string;
  isActive: boolean;
  lastOrderedDate?: string;
  nextOrderDate?: string;
}

interface MedicationSummaryReport {
  id: number;
  reportType: string;
  reportPeriod?: string;
  totalMedications: number;
  activeMedications: number;
  completedMedications: number;
  discontinuedMedications: number;
  reportData: any;
  createdAt: string;
}

interface MedicationManagementTabsProps {
  patient: Patient;
  prescriptions: Prescription[];
}

export default function MedicationManagementTabs({ patient, prescriptions }: MedicationManagementTabsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isAddingToPastMedications, setIsAddingToPastMedications] = useState(false);
  const [isCreatingRepeatList, setIsCreatingRepeatList] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentQRCode, setCurrentQRCode] = useState<string>('');
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(null);

  // Fetch past medications
  const { data: pastMedications = [] } = useQuery<PastMedication[]>({
    queryKey: [`/api/patients/${patient.id}/past-medications`],
  });

  // Fetch repeat prescription lists
  const { data: repeatLists = [] } = useQuery<RepeatPrescriptionList[]>({
    queryKey: [`/api/patients/${patient.id}/repeat-prescriptions`],
  });

  // Fetch medication summary reports
  const { data: summaryReports = [] } = useQuery<MedicationSummaryReport[]>({
    queryKey: [`/api/patients/${patient.id}/medication-reports`],
  });

  // Fetch dispensed medications
  const { data: dispensedMedications = [] } = useQuery<Prescription[]>({
    queryKey: [`/api/patients/${patient.id}/dispensed-medications`],
  });

  // Mutations
  const addToPastMedications = useMutation({
    mutationFn: async (prescriptionId: number) => {
      const prescription = prescriptions.find(p => p.id === prescriptionId);
      if (!prescription) throw new Error('Prescription not found');

      return apiRequest(
        'POST',
        `/api/patients/${patient.id}/past-medications`,
        {
          prescriptionId,
          medicationName: prescription.medicationName,
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          duration: prescription.duration,
          startDate: prescription.startDate,
          endDate: prescription.endDate || new Date().toISOString(),
          prescribedBy: 'Current Doctor'
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`/api/patients/${patient.id}/past-medications`]);
      toast({ title: "Success", description: "Medication added to past medications" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add to past medications", variant: "destructive" });
    }
  });

  const createRepeatList = useMutation({
    mutationFn: async (data: { name: string; description?: string; prescriptionIds: number[] }) => {
      const list = await apiRequest(
        'POST',
        `/api/patients/${patient.id}/repeat-prescriptions`,
        {
          name: data.name,
          description: data.description,
          patientId: patient.id,
          createdBy: 1 // This should be the current user ID
        }
      );

      // Add selected prescriptions as items
      for (const prescriptionId of data.prescriptionIds) {
        const prescription = prescriptions.find(p => p.id === prescriptionId);
        if (prescription) {
          await apiRequest(
            'POST',
            `/api/repeat-prescriptions/${list.id}/items`,
            {
              medicationName: prescription.medicationName,
              dosage: prescription.dosage,
              frequency: prescription.frequency,
              duration: prescription.duration,
              quantity: '30 tablets',
              instructions: 'Take as prescribed'
            }
          );
        }
      }

      return list;
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`/api/patients/${patient.id}/repeat-prescriptions`]);
      setSelectedPrescriptions([]);
      setIsCreatingRepeatList(false);
      toast({ title: "Success", description: "Repeat prescription list created" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create repeat prescription list", variant: "destructive" });
    }
  });

  const generateSummaryReport = useMutation({
    mutationFn: async (reportType: string) => {
      const reportData = {
        currentMedications: prescriptions.filter(p => p.status === 'active'),
        pastMedications,
        dispensedMedications,
        repeatLists,
        generatedAt: new Date().toISOString(),
        patientInfo: {
          name: `${patient.firstName} ${patient.lastName}`,
          id: patient.id
        }
      };

      return apiRequest(
        'POST',
        `/api/patients/${patient.id}/medication-reports`,
        {
          reportType,
          reportPeriod: 'all_time',
          generatedBy: 1, // Current user ID
          reportData,
          totalMedications: prescriptions.length,
          activeMedications: prescriptions.filter(p => p.status === 'active').length,
          completedMedications: prescriptions.filter(p => p.status === 'completed').length,
          discontinuedMedications: prescriptions.filter(p => p.status === 'discontinued').length
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`/api/patients/${patient.id}/medication-reports`]);
      toast({ title: "Success", description: "Medication summary report generated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate report", variant: "destructive" });
    }
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async (data: { prescriptionIds: number[]; status: string }) => {
      return apiRequest(
        'PATCH',
        '/api/prescriptions/bulk-update',
        {
          prescriptionIds: data.prescriptionIds,
          status: data.status,
          performedBy: 1 // Current user ID
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`/api/patients/${patient.id}/prescriptions`]);
      queryClient.invalidateQueries([`/api/patients/${patient.id}/dispensed-medications`]);
      setSelectedPrescriptions([]);
      setShowBulkActions(false);
      toast({ title: "Success", description: "Prescriptions updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update prescriptions", variant: "destructive" });
    }
  });

  const generateQRCode = useMutation({
    mutationFn: async (prescriptionId: number) => {
      const prescription = prescriptions.find(p => p.id === prescriptionId);
      if (!prescription) throw new Error('Prescription not found');

      const qrData = `RX${prescriptionId} ${patient.firstName} ${patient.lastName} - ${prescription.medicationName} ${prescription.dosage} ${prescription.frequency} ${prescription.duration} - ${format(new Date(prescription.startDate), 'dd/MM/yyyy')}`;
      
      await apiRequest(
        'PATCH',
        `/api/prescriptions/${prescriptionId}/qr-code`,
        { qrCode: qrData }
      );

      // Set the QR code data and show modal
      setCurrentQRCode(qrData);
      setCurrentPrescription(prescription);
      setShowQRModal(true);
      
      return qrData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`/api/patients/${patient.id}/prescriptions`]);
      toast({ title: "Success", description: "QR code generated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate QR code", variant: "destructive" });
    }
  });

  const handlePrescriptionSelect = (prescriptionId: number, checked: boolean) => {
    if (checked) {
      setSelectedPrescriptions(prev => [...prev, prescriptionId]);
    } else {
      setSelectedPrescriptions(prev => prev.filter(id => id !== prescriptionId));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      discontinued: { color: 'bg-red-100 text-red-800', label: 'Discontinued' },
      on_hold: { color: 'bg-yellow-100 text-yellow-800', label: 'On Hold' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPharmacyStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', label: 'Pending' },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent' },
      dispensed: { color: 'bg-green-100 text-green-800', label: 'Dispensed' },
      ready: { color: 'bg-orange-100 text-orange-800', label: 'Ready' },
      collected: { color: 'bg-purple-100 text-purple-800', label: 'Collected' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="current" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Current ({prescriptions?.filter(p => p.status === 'active')?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Past ({pastMedications?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="repeat" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Repeat ({repeatLists?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="dispensed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Dispensed ({dispensedMedications?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reports ({summaryReports?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Bulk Actions */}
          {selectedPrescriptions.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedPrescriptions.length} selected
              </Badge>
              <Select onValueChange={(value) => bulkUpdateStatus.mutate({ prescriptionIds: selectedPrescriptions, status: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Bulk Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dispensed">Mark Dispensed</SelectItem>
                  <SelectItem value="collected">Mark Collected</SelectItem>
                  <SelectItem value="discontinued">Discontinue</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingRepeatList(true)}
                disabled={selectedPrescriptions.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Repeat List
              </Button>
            </div>
          )}
        </div>

        {/* Current Medications Tab */}
        <TabsContent value="current" className="space-y-4">
          <div className="grid gap-4">
            {prescriptions?.filter(p => p.status === 'active').map((prescription) => (
              <Card key={prescription.id} className="relative">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedPrescriptions.includes(prescription.id)}
                      onCheckedChange={(checked) => handlePrescriptionSelect(prescription.id, checked as boolean)}
                    />
                    <div>
                      <CardTitle className="text-lg text-blue-600">
                        {prescription.medicationName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(prescription.status)}
                        {getPharmacyStatusBadge(prescription.pharmacyStatus)}
                        {prescription.isRepeat && (
                          <Badge variant="outline">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Repeat
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateQRCode.mutate(prescription.id)}
                      disabled={generateQRCode.isPending}
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToPastMedications.mutate(prescription.id)}
                      disabled={addToPastMedications.isPending}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Dosage:</span>
                      <p className="text-gray-900">{prescription.dosage}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Frequency:</span>
                      <p className="text-gray-900">{prescription.frequency}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Duration:</span>
                      <p className="text-gray-900">{prescription.duration}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Start Date:</span>
                      <p className="text-gray-900">{format(new Date(prescription.startDate), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                  {prescription.dispensedAt && (
                    <div className="mt-2 text-sm text-green-600">
                      Dispensed: {format(new Date(prescription.dispensedAt), 'dd/MM/yyyy HH:mm')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Past Medications Tab */}
        <TabsContent value="past" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Past Medications History</h3>
            <Button
              onClick={() => setIsAddingToPastMedications(true)}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Manual Entry
            </Button>
          </div>
          <div className="grid gap-4">
            {pastMedications?.map((medication) => (
              <Card key={medication.id}>
                <CardHeader>
                  <CardTitle className="text-lg text-purple-600">
                    {medication.medicationName}
                  </CardTitle>
                  <div className="text-sm text-gray-600">
                    Prescribed by: {medication.prescribedBy}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Dosage:</span>
                      <p className="text-gray-900">{medication.dosage}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Frequency:</span>
                      <p className="text-gray-900">{medication.frequency}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Duration:</span>
                      <p className="text-gray-900">{medication.duration}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Period:</span>
                      <p className="text-gray-900">
                        {format(new Date(medication.startDate), 'dd/MM/yyyy')} - 
                        {medication.endDate ? format(new Date(medication.endDate), 'dd/MM/yyyy') : 'Ongoing'}
                      </p>
                    </div>
                  </div>
                  {medication.effectiveness && (
                    <div className="mt-2">
                      <span className="font-medium text-gray-600">Effectiveness:</span>
                      <Badge className="ml-2" variant={
                        medication.effectiveness === 'excellent' ? 'default' :
                        medication.effectiveness === 'good' ? 'secondary' : 'outline'
                      }>
                        {medication.effectiveness}
                      </Badge>
                    </div>
                  )}
                  {medication.discontinueReason && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium text-gray-600">Discontinue Reason:</span>
                      <p className="text-gray-900">{medication.discontinueReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Repeat Prescriptions Tab */}
        <TabsContent value="repeat" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Repeat Prescription Lists</h3>
            <Button
              onClick={() => setIsCreatingRepeatList(true)}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New List
            </Button>
          </div>
          <div className="grid gap-4">
            {repeatLists?.map((list) => (
              <RepeatListCard key={list.id} list={list} patient={patient} />
            ))}
          </div>
        </TabsContent>

        {/* Dispensed Medications Tab */}
        <TabsContent value="dispensed" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recently Dispensed Medications</h3>
            <div className="text-sm text-gray-600">
              Showing medications dispensed in the last 6 months
            </div>
          </div>
          <div className="grid gap-4">
            {dispensedMedications?.map((medication) => (
              <Card key={medication.id}>
                <CardHeader>
                  <CardTitle className="text-lg text-green-600">
                    {medication.medicationName}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Dispensed</Badge>
                    {medication.collectedAt && (
                      <Badge className="bg-purple-100 text-purple-800">Collected</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Dosage:</span>
                      <p className="text-gray-900">{medication.dosage}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Frequency:</span>
                      <p className="text-gray-900">{medication.frequency}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Dispensed:</span>
                      <p className="text-gray-900">
                        {medication.dispensedAt ? format(new Date(medication.dispensedAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Collected:</span>
                      <p className="text-gray-900">
                        {medication.collectedAt ? format(new Date(medication.collectedAt), 'dd/MM/yyyy HH:mm') : 'Not collected'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Summary Reports Tab */}
        <TabsContent value="summary" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Medication Summary Reports</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => generateSummaryReport.mutate('current')}
                disabled={generateSummaryReport.isPending}
                size="sm"
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-2" />
                Current Report
              </Button>
              <Button
                onClick={() => generateSummaryReport.mutate('historical')}
                disabled={generateSummaryReport.isPending}
                size="sm"
                variant="outline"
              >
                <Clock className="w-4 h-4 mr-2" />
                Historical Report
              </Button>
            </div>
          </div>
          <div className="grid gap-4">
            {summaryReports?.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">
                    {report.reportType} Medication Report
                  </CardTitle>
                  <div className="text-sm text-gray-600">
                    Generated: {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm')}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{report.totalMedications}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{report.activeMedications}</div>
                      <div className="text-sm text-gray-600">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{report.completedMedications}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{report.discontinuedMedications}</div>
                      <div className="text-sm text-gray-600">Discontinued</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button size="sm" variant="outline">
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Repeat List Dialog */}
      <Dialog open={isCreatingRepeatList} onOpenChange={setIsCreatingRepeatList}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Repeat Prescription List</DialogTitle>
          </DialogHeader>
          <CreateRepeatListForm
            selectedPrescriptions={selectedPrescriptions}
            prescriptions={prescriptions}
            onSubmit={(data) => createRepeatList.mutate(data)}
            onCancel={() => setIsCreatingRepeatList(false)}
            isLoading={createRepeatList.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prescription QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {currentPrescription && (
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">{currentPrescription.medicationName}</h3>
                <p className="text-sm text-gray-600">
                  {currentPrescription.dosage} - {currentPrescription.frequency} - {currentPrescription.duration}
                </p>
                <p className="text-xs text-gray-500">
                  Patient: {patient.firstName} {patient.lastName}
                </p>
              </div>
            )}
            {currentQRCode && (
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <QRCodeSVG 
                  value={currentQRCode}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
            )}
            <div className="text-xs text-gray-500 text-center max-w-sm">
              Scan this QR code to verify prescription authenticity and access medication details.
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowQRModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for repeat prescription list
function RepeatListCard({ list, patient }: { list: RepeatPrescriptionList; patient: Patient }) {
  const { data: items = [] } = useQuery({
    queryKey: [`/api/repeat-prescriptions/${list.id}/items`],
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-indigo-600">{list.name}</CardTitle>
            {list.description && (
              <p className="text-sm text-gray-600 mt-1">{list.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {list.isActive ? (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
            <Button size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reorder All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item: RepeatPrescriptionItem) => (
            <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <span className="font-medium">{item.medicationName}</span>
                <span className="text-sm text-gray-600 ml-2">
                  {item.dosage} - {item.frequency}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {item.quantity}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <span>{list.totalItems} items</span>
          {list.nextOrderDate && (
            <span>Next order: {format(new Date(list.nextOrderDate), 'dd/MM/yyyy')}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for creating repeat list
function CreateRepeatListForm({ 
  selectedPrescriptions, 
  prescriptions, 
  onSubmit, 
  onCancel, 
  isLoading 
}: {
  selectedPrescriptions: number[];
  prescriptions: Prescription[];
  onSubmit: (data: { name: string; description?: string; prescriptionIds: number[] }) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      prescriptionIds: selectedPrescriptions
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">List Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Monthly Diabetes Medications"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional notes about this repeat prescription list"
        />
      </div>
      <div>
        <Label>Selected Medications ({selectedPrescriptions.length})</Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {selectedPrescriptions.map(id => {
            const prescription = prescriptions.find(p => p.id === id);
            return prescription ? (
              <div key={id} className="text-sm p-2 bg-gray-50 rounded">
                {prescription.medicationName} - {prescription.dosage}
              </div>
            ) : null;
          })}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? 'Creating...' : 'Create List'}
        </Button>
      </div>
    </form>
  );
}