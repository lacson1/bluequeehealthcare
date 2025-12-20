import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPrescriptionSchema, type InsertPrescription, type Patient, type Medication, type Pharmacy } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { QuickMedicationSearch } from "@/components/quick-medication-search";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Pill, User, Save, X } from "lucide-react";

export default function NewPrescriptionPage() {
  const params = useParams<{ patientId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const patientId = params.patientId ? parseInt(params.patientId) : undefined;
  
  const [selectedMedicine, setSelectedMedicine] = useState<Medication | null>(null);
  const [manualMedicationName, setManualMedicationName] = useState<string>("");

  // Fetch patient data
  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  // Fetch pharmacies
  const { data: pharmacies } = useQuery<Pharmacy[]>({
    queryKey: ["/api/pharmacies"],
  });

  const form = useForm<Omit<InsertPrescription, "patientId" | "medicationId">>({
    resolver: zodResolver(insertPrescriptionSchema.omit({ patientId: true, medicationId: true })),
    defaultValues: {
      medicationName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      prescribedBy: "Dr. Adebayo",
      status: "active",
      startDate: new Date(),
      endDate: undefined,
    },
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: InsertPrescription) => {
      try {
        const response = await apiRequest(`/api/patients/${data.patientId}/prescriptions`, "POST", data);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error('Prescription creation failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      try {
        // Comprehensive cache invalidation for immediate refresh
        queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
        queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
        if (patientId) {
          queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/prescriptions`] });
          queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/activity-trail`] });
        }
        
        toast({
          title: "Success",
          description: "Prescription created and sent to pharmacy!",
        });
        form.reset();
        setSelectedMedicine(null);
        setManualMedicationName("");
        
        // Navigate back to patient detail or visit detail
        if (patientId) {
          navigate(`/patients/${patientId}`);
        } else {
          navigate("/patients");
        }
      } catch (error) {
        console.error('Post-success cleanup failed:', error);
      }
    },
    onError: (error: Error) => {
      console.error('Prescription creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create prescription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertPrescription, "patientId" | "medicationId">) => {
    if (!patientId) {
      toast({
        title: "Error",
        description: "Patient ID is required",
        variant: "destructive",
      });
      return;
    }

    const prescriptionData: InsertPrescription = {
      ...data,
      patientId,
      medicationId: selectedMedicine?.id || null,
      medicationName: selectedMedicine?.name || manualMedicationName || data.medicationName,
    };

    createPrescriptionMutation.mutate(prescriptionData);
  };

  if (patientLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p>Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (!patientId || !patient) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Patient not found</p>
            <Button onClick={() => navigate("/patients")} className="mt-4">
              Go to Patients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/patients/${patientId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patient
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create New Prescription</h1>
            <p className="text-muted-foreground mt-1">
              Prescribing for {patient.firstName} {patient.lastName}
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            <User className="w-4 h-4 mr-1" />
            Patient ID: {patient.id}
          </Badge>
        </div>
      </div>

      {/* Patient Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{patient.firstName} {patient.lastName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Age</p>
              <p className="font-medium">{patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gender</p>
              <p className="font-medium">{patient.gender || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{patient.phone || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescription Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Medication Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-purple-600" />
                Medication Details
              </CardTitle>
              <CardDescription>
                Search for medications or enter manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="medicationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication *</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {!manualMedicationName ? (
                          <QuickMedicationSearch
                            onSelect={(medication) => {
                              const fullMedication = medication as Medication;
                              setSelectedMedicine(fullMedication);
                              field.onChange(fullMedication.name);
                              form.setValue("medicationName", fullMedication.name);
                              
                              // Auto-fill dosage and frequency if available
                              if (fullMedication.dosageAdult) {
                                form.setValue("dosage", fullMedication.dosageAdult);
                              }
                              if (fullMedication.frequency) {
                                form.setValue("frequency", fullMedication.frequency);
                              }
                              
                              // Auto-fill duration based on category
                              if (fullMedication.category === "Antibiotic") {
                                form.setValue("duration", "7 days");
                              } else if (fullMedication.category === "Antimalarial") {
                                form.setValue("duration", "3 days");
                              } else if (fullMedication.category === "Analgesic" || fullMedication.category === "NSAID") {
                                form.setValue("duration", "As needed");
                              } else {
                                form.setValue("duration", "As prescribed");
                              }
                            }}
                            placeholder="Search medications by name, category, or description..."
                            showDetails={false}
                            className="w-full"
                          />
                        ) : (
                          <Input
                            placeholder="Enter medication name manually..."
                            value={manualMedicationName}
                            onChange={(e) => {
                              setManualMedicationName(e.target.value);
                              field.onChange(e.target.value);
                            }}
                          />
                        )}
                        <div className="flex items-center gap-2">
                          {selectedMedicine && (
                            <Badge variant="secondary" className="flex items-center gap-2">
                              {selectedMedicine.name}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                  setSelectedMedicine(null);
                                  setManualMedicationName("");
                                  field.onChange("");
                                }}
                              />
                            </Badge>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMedicine(null);
                              setManualMedicationName("manual");
                              field.onChange("");
                            }}
                            className="text-xs"
                          >
                            Manual Entry
                          </Button>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 500mg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Twice daily" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 7 days" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional instructions for patient (e.g., take with food, avoid alcohol...)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Prescription Details */}
          <Card>
            <CardHeader>
              <CardTitle>Prescription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="prescribedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prescribing Doctor *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {pharmacies && pharmacies.length > 0 && (
                <FormField
                  control={form.control}
                  name="pharmacyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Pharmacy</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pharmacy (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pharmacies.map((pharmacy) => (
                            <SelectItem key={pharmacy.id} value={pharmacy.id.toString()}>
                              {pharmacy.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/patients/${patientId}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPrescriptionMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {createPrescriptionMutation.isPending ? "Creating..." : "Create Prescription"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

