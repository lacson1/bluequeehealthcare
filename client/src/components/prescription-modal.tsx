import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPrescriptionSchema, type InsertPrescription, type Patient, type Medicine, type Medication } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import MedicationAutocomplete from "@/components/medication-autocomplete";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Pill, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId?: number;
  visitId?: number;
}

export default function PrescriptionModal({
  open,
  onOpenChange,
  patientId,
  visitId,
}: PrescriptionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>(patientId);
  const [selectedMedicine, setSelectedMedicine] = useState<Medication | null>(null);

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: !patientId,
  });

  const form = useForm<Omit<InsertPrescription, "patientId" | "medicineId">>({
    resolver: zodResolver(insertPrescriptionSchema.omit({ patientId: true, medicineId: true })),
    defaultValues: {
      visitId: visitId || undefined,
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
      const response = await apiRequest("POST", `/api/patients/${data.patientId}/prescriptions`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      if (selectedPatientId) {
        queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatientId, "prescriptions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatientId, "prescriptions", "active"] });
      }
      if (visitId) {
        queryClient.invalidateQueries({ queryKey: ["/api/visits", visitId, "prescriptions"] });
      }
      toast({
        title: "Success",
        description: "Prescription created successfully!",
      });
      form.reset();
      setSelectedPatientId(undefined);
      setSelectedMedicine(null);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create prescription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Smart Auto-Fill Function using comprehensive medications database
  const handleMedicationSelect = (medication: Medication) => {
    setSelectedMedicine(medication);
    
    // Auto-fill dosage from comprehensive database
    if (medication.dosageAdult) {
      form.setValue("dosage", medication.dosageAdult);
    }
    
    // Auto-fill frequency
    if (medication.frequency) {
      form.setValue("frequency", medication.frequency);
    }
    
    // Smart duration based on medication category
    if (medication.category === "Antibiotic") {
      form.setValue("duration", "7 days");
    } else if (medication.category === "Antimalarial") {
      form.setValue("duration", "3 days");
    } else if (medication.category === "Analgesic" || medication.category === "NSAID") {
      form.setValue("duration", "As needed");
    } else if (medication.category === "Antihypertensive" || medication.category === "ACE Inhibitor") {
      form.setValue("duration", "Ongoing as directed");
    } else if (medication.category === "Antidiabetic") {
      form.setValue("duration", "Ongoing as directed");
    } else {
      form.setValue("duration", "As prescribed");
    }
    
    // Smart instructions based on medication properties
    let instructions = "";
    if (medication.routeOfAdministration === "Oral") {
      if (medication.dosageForm === "Tablet" || medication.dosageForm === "Capsule") {
        instructions = "Take with water";
        
        // Special instructions for specific medications
        if (medication.name?.toLowerCase().includes("amoxicillin")) {
          instructions += ". Take with food to reduce stomach upset.";
        } else if (medication.name?.toLowerCase().includes("iron")) {
          instructions += " on empty stomach for better absorption.";
        } else if (medication.name?.toLowerCase().includes("metformin")) {
          instructions += " with meals to reduce GI side effects.";
        } else {
          instructions += ". Take as directed.";
        }
      } else if (medication.dosageForm === "Syrup") {
        instructions = "Measure dose carefully with provided measuring device.";
      }
    } else if (medication.routeOfAdministration === "Inhalation") {
      instructions = "Shake well before use. Inhale as directed by healthcare provider.";
    } else if (medication.routeOfAdministration === "Intravenous" || medication.routeOfAdministration === "IV/IM") {
      instructions = "Administer by qualified healthcare professional only.";
    }
    
    if (instructions) {
      form.setValue("instructions", instructions);
    }

    toast({
      title: "Smart Auto-Fill Complete ✨",
      description: `Dosage and instructions automatically filled for ${medication.name}`,
    });
  };

  const onSubmit = (data: Omit<InsertPrescription, "patientId" | "medicineId">) => {
    if (!selectedPatientId) {
      toast({
        title: "Error",
        description: "Please select a patient.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMedicine) {
      toast({
        title: "Error",
        description: "Please select a medicine.",
        variant: "destructive",
      });
      return;
    }

    const prescriptionData: InsertPrescription = {
      ...data,
      patientId: selectedPatientId,
      medicineId: selectedMedicine.id,
    };

    createPrescriptionMutation.mutate(prescriptionData);
  };

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-green-600" />
            Create New Prescription
          </DialogTitle>
          <DialogDescription>
            Add a new prescription for the patient. Smart auto-fill will help speed up the process!
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Patient Selection */}
            {!patientId && (
              <FormField
                control={form.control}
                name="patientId"
                render={() => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={patientSearchOpen}
                          className="w-full justify-between"
                        >
                          {selectedPatient 
                            ? `${selectedPatient.firstName} ${selectedPatient.lastName}` 
                            : "Select patient..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search patients..." />
                          <CommandEmpty>No patient found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {patients?.map((patient) => (
                                <CommandItem
                                  key={patient.id}
                                  onSelect={() => {
                                    setSelectedPatientId(patient.id);
                                    setPatientSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedPatientId === patient.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {patient.firstName} {patient.lastName}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Smart Medication Selection with Auto-Fill */}
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Medication (Smart Auto-Fill Enabled)
              </FormLabel>
              <MedicationAutocomplete
                value={selectedMedicine}
                onSelect={handleMedicationSelect}
                onAutoFill={handleMedicationSelect}
                placeholder="Start typing medication name (e.g., Paracetamol, Amoxicillin)..."
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">
                ✨ Select a medication to automatically fill dosage, frequency, and instructions from comprehensive database.
              </p>
              
              {/* Auto-fill Preview */}
              {selectedMedicine && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center mb-2">
                    <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-800">Auto-filled information for {selectedMedicine.name}:</span>
                  </div>
                  <div className="space-y-1 text-blue-700">
                    {selectedMedicine.dosageAdult && (
                      <div><strong>Dosage:</strong> {selectedMedicine.dosageAdult}</div>
                    )}
                    {selectedMedicine.frequency && (
                      <div><strong>Frequency:</strong> {selectedMedicine.frequency}</div>
                    )}
                    {selectedMedicine.category && (
                      <div><strong>Duration:</strong> {
                        selectedMedicine.category === "Antibiotic" ? "7 days" :
                        selectedMedicine.category === "Antimalarial" ? "3 days" :
                        selectedMedicine.category === "Analgesic" || selectedMedicine.category === "NSAID" ? "As needed" :
                        selectedMedicine.category === "Antihypertensive" || selectedMedicine.category === "ACE Inhibitor" ? "Ongoing as directed" :
                        selectedMedicine.category === "Antidiabetic" ? "Ongoing as directed" : "As prescribed"
                      }</div>
                    )}
                    {selectedMedicine.routeOfAdministration && (
                      <div><strong>Route:</strong> {selectedMedicine.routeOfAdministration}</div>
                    )}
                    {selectedMedicine.contraindications && (
                      <div className="text-red-600"><strong>⚠️ Contraindications:</strong> {selectedMedicine.contraindications}</div>
                    )}
                  </div>
                </div>
              )}
            </FormItem>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dosage */}
              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter dosage amount (e.g., 500mg, 2 tablets, 5ml)" 
                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 
                                 border-slate-300 hover:border-slate-400
                                 data-[invalid]:border-red-500 data-[invalid]:focus:ring-red-500"
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500 mt-1">
                      Specify the exact amount per dose. Auto-filled from pharmacy database when available.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Frequency */}
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="How often to take (e.g., Twice daily, Every 8 hours, Once at bedtime)" 
                        className="focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 
                                 border-slate-300 hover:border-slate-400
                                 data-[invalid]:border-red-500 data-[invalid]:focus:ring-red-500"
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500 mt-1">
                      Specify timing intervals. Common: Once daily, Twice daily, Every 6-8 hours.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treatment Duration</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Total treatment period (e.g., 7 days, 2 weeks, 1 month)" 
                        className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 
                                 border-slate-300 hover:border-slate-400
                                 data-[invalid]:border-red-500 data-[invalid]:focus:ring-red-500"
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500 mt-1">
                      How long the patient should continue taking this medication.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="discontinued">Discontinued</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Instructions */}
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient Instructions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed instructions for the patient (e.g., Take with food, Avoid alcohol, Do not drive while taking this medication, Complete the full course)"
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500 mt-1">
                    Include important safety information, timing, food restrictions, and warnings. Auto-filled from pharmacy guidelines when available.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Auto-Fill Preview with Animation */}
            {selectedMedicine && (selectedMedicine.defaultDosage || selectedMedicine.defaultInstructions) && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 
                            animate-in slide-in-from-top-2 duration-300 ease-out">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                  <span className="font-medium text-blue-800">Smart Auto-Fill Applied</span>
                  <div className="ml-auto">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-ping"></div>
                  </div>
                </div>
                <div className="text-sm text-blue-700">
                  Form fields have been automatically populated with pharmacy database defaults for{" "}
                  <span className="font-semibold">{selectedMedicine.name}</span>. 
                  You can modify any values as needed.
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedMedicine.defaultDosage && (
                    <Badge variant="outline" className="text-blue-700 border-blue-300 bg-white/50 
                                                      animate-in fade-in duration-500 delay-100">
                      Dosage: {selectedMedicine.defaultDosage}
                    </Badge>
                  )}
                  {selectedMedicine.defaultFrequency && (
                    <Badge variant="outline" className="text-blue-700 border-blue-300 bg-white/50
                                                      animate-in fade-in duration-500 delay-200">
                      Frequency: {selectedMedicine.defaultFrequency}
                    </Badge>
                  )}
                  {selectedMedicine.defaultDuration && (
                    <Badge variant="outline" className="text-blue-700 border-blue-300 bg-white/50
                                                      animate-in fade-in duration-500 delay-300">
                      Duration: {selectedMedicine.defaultDuration}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createPrescriptionMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createPrescriptionMutation.isPending ? "Creating..." : "Create Prescription"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}