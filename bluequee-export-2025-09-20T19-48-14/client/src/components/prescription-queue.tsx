import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pill, 
  User, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  Stethoscope
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const dispensingSchema = z.object({
  notes: z.string().optional(),
  pharmacistReview: z.string().optional(),
});

type DispensingForm = z.infer<typeof dispensingSchema>;

export function PrescriptionQueue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [showDispensingDialog, setShowDispensingDialog] = useState(false);

  const dispensingForm = useForm<DispensingForm>({
    resolver: zodResolver(dispensingSchema),
    defaultValues: {
      notes: "",
      pharmacistReview: "",
    },
  });

  // Fetch all prescriptions with patient details
  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ["/api/prescriptions"],
  });

  // Fetch medicines for medication names
  const { data: medicines = [] } = useQuery({
    queryKey: ["/api/medicines"],
  });

  // Fetch pharmacy activities for recently dispensed
  const { data: pharmacyActivities = [] } = useQuery({
    queryKey: ["/api/pharmacy/activities"],
  });

  const dispensePrescriptionMutation = useMutation({
    mutationFn: async ({ prescriptionId, data }: { prescriptionId: number; data: DispensingForm }) => {
      const response = await apiRequest("PATCH", `/api/prescriptions/${prescriptionId}/status`, { 
        status: "dispensed",
        ...data 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacy/activities"] });
      toast({
        title: "Success",
        description: "Prescription dispensed successfully!",
      });
      setShowDispensingDialog(false);
      setSelectedPrescription(null);
      dispensingForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dispense prescription",
        variant: "destructive",
      });
    },
  });

  // Fetch individual patient details when needed
  const { data: patientDetails = {} } = useQuery({
    queryKey: ["/api/patients", "details"],
    queryFn: async () => {
      const uniquePatientIds = [...new Set((prescriptions as any[]).map((p: any) => p.patientId))];
      const patientPromises = uniquePatientIds.map(async (id: number) => {
        try {
          const response = await fetch(`/api/patients/${id}`);
          if (response.ok) {
            const patient = await response.json();
            return { [id]: patient };
          }
        } catch (error) {
          console.log(`Could not fetch patient ${id}:`, error);
        }
        return { [id]: null };
      });
      
      const patientResults = await Promise.all(patientPromises);
      return patientResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    },
    enabled: (prescriptions as any[]).length > 0,
  });

  const getPatientName = (patientId: number) => {
    const patient = (patientDetails as any)[patientId];
    if (patient) {
      return `${patient.firstName} ${patient.lastName}`;
    }
    return `Patient #${patientId}`;
  };

  const getPatientDateOfBirth = (patientId: number) => {
    const patient = (patientDetails as any)[patientId];
    if (patient && patient.dateOfBirth) {
      return new Date(patient.dateOfBirth).toLocaleDateString();
    }
    return "Unknown DOB";
  };

  const getPatientAddress = (patientId: number) => {
    const patient = (patientDetails as any)[patientId];
    return patient?.address || "Address not provided";
  };

  const getPatientPhone = (patientId: number) => {
    const patient = (patientDetails as any)[patientId];
    return patient?.phone || "Phone not provided";
  };

  const getPatientDetails = (patientId: number) => {
    return (patientDetails as any)[patientId];
  };

  const getMedicationName = (prescription: any) => {
    // First check if medicationName is already provided
    if (prescription.medicationName) {
      return prescription.medicationName;
    }
    
    // Then look up by medicationId in the medicines database
    if (prescription.medicationId && medicines && Array.isArray(medicines) && medicines.length > 0) {
      const medicine = medicines.find((m: any) => m.id === prescription.medicationId);
      if (medicine && medicine.name) {
        return medicine.name;
      }
    }
    
    // Fallback to medication ID reference
    return prescription.medicationId ? `Medication ID #${prescription.medicationId}` : "Unknown Medication";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "active":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "dispensed":
        return <Badge className="bg-green-100 text-green-800">Dispensed</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const pendingPrescriptions = (prescriptions as any[]).filter((p: any) => p.status === "active" || p.status === "pending");
  const recentlyDispensed = (pharmacyActivities as any[])
    .filter((activity: any) => activity.activityType === "dispensing")
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
          <p className="text-gray-500">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Prescription Queue</h3>
            <p className="text-sm text-slate-500">
              {pendingPrescriptions.length} pending prescriptions awaiting dispensing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              {pendingPrescriptions.length} Pending
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Pending Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPrescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="text-gray-500">All prescriptions processed!</p>
                  <p className="text-sm text-gray-400">No pending prescriptions at this time.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPrescriptions.map((prescription: any) => {
                    const patient = getPatientDetails(prescription.patientId);
                    return (
                      <div key={prescription.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-blue-600">RX#{prescription.id}</span>
                              {getStatusBadge(prescription.status)}
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="border-b border-gray-200 pb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-lg">{getPatientName(prescription.patientId)}</span>
                                </div>
                                <div className="ml-6 space-y-1 text-gray-600">
                                  <div>DOB: {getPatientDateOfBirth(prescription.patientId)}</div>
                                  <div>Phone: {getPatientPhone(prescription.patientId)}</div>
                                  <div>Address: {getPatientAddress(prescription.patientId)}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Pill className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-blue-600 text-lg">{getMedicationName(prescription)}</span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2">
                                  <Stethoscope className="w-4 h-4 text-gray-400" />
                                  <span>Dr. {prescription.prescribedBy}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span>{new Date(prescription.startDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><strong>Dosage:</strong> {prescription.dosage}</div>
                                <div><strong>Frequency:</strong> {prescription.frequency}</div>
                                <div><strong>Duration:</strong> {prescription.duration}</div>
                                <div><strong>Quantity:</strong> {prescription.quantity || "Not specified"}</div>
                              </div>
                              {prescription.instructions && (
                                <div className="mt-2 text-sm">
                                  <strong>Instructions:</strong> {prescription.instructions}
                                </div>
                              )}
                            </div>

                            {patient && (patient.allergies || patient.medicalHistory) && (
                              <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                <div className="text-xs text-red-800">
                                  {patient.allergies && (
                                    <div><strong>Allergies:</strong> {patient.allergies}</div>
                                  )}
                                  {patient.medicalHistory && (
                                    <div><strong>Medical History:</strong> {patient.medicalHistory}</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="ml-4 flex flex-col gap-2">
                            <Dialog open={showDispensingDialog && selectedPrescription?.id === prescription.id} 
                                    onOpenChange={(open) => {
                                      setShowDispensingDialog(open);
                                      if (!open) setSelectedPrescription(null);
                                    }}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  onClick={() => setSelectedPrescription(prescription)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Dispense
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Dispense Prescription RX#{prescription.id}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold mb-2">Prescription Details</h4>
                                    <div className="text-sm space-y-1">
                                      <div><strong>Patient:</strong> {getPatientName(prescription.patientId)}</div>
                                      <div><strong>Medication:</strong> {prescription.medicationName}</div>
                                      <div><strong>Dosage:</strong> {prescription.dosage}</div>
                                      <div><strong>Frequency:</strong> {prescription.frequency}</div>
                                      <div><strong>Duration:</strong> {prescription.duration}</div>
                                      <div><strong>Prescribed by:</strong> Dr. {prescription.prescribedBy}</div>
                                    </div>
                                  </div>

                                  <Form {...dispensingForm}>
                                    <form onSubmit={dispensingForm.handleSubmit((data) => 
                                      dispensePrescriptionMutation.mutate({ prescriptionId: prescription.id, data })
                                    )} className="space-y-4">
                                      <FormField
                                        control={dispensingForm.control}
                                        name="pharmacistReview"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Pharmacist Review</FormLabel>
                                            <FormControl>
                                              <Textarea 
                                                placeholder="Drug interactions, counseling notes, etc." 
                                                {...field} 
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <FormField
                                        control={dispensingForm.control}
                                        name="notes"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Dispensing Notes</FormLabel>
                                            <FormControl>
                                              <Textarea 
                                                placeholder="Any additional notes about dispensing..." 
                                                {...field} 
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <div className="flex justify-end space-x-2">
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          onClick={() => setShowDispensingDialog(false)}
                                        >
                                          Cancel
                                        </Button>
                                        <Button 
                                          type="submit" 
                                          disabled={dispensePrescriptionMutation.isPending}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          {dispensePrescriptionMutation.isPending ? "Dispensing..." : "Confirm Dispensing"}
                                        </Button>
                                      </div>
                                    </form>
                                  </Form>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Dispensed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Recently Dispensed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentlyDispensed.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">No recent dispensing activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentlyDispensed.map((activity: any) => (
                    <div key={activity.id} className="border rounded-lg p-3 bg-green-50 border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-green-700">Activity #{activity.id}</span>
                            <Badge className="bg-green-100 text-green-800">Dispensed</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div><strong>Patient:</strong> {activity.patientFirstName} {activity.patientLastName}</div>
                            <div><strong>Medication:</strong> {activity.medicationName || activity.title}</div>
                            <div><strong>Quantity:</strong> {activity.quantity}</div>
                            <div><strong>Dispensed:</strong> {new Date(activity.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}