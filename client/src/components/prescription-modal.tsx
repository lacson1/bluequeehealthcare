import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPrescriptionSchema, type InsertPrescription, type Patient, type Medicine, type Medication, type Pharmacy } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import MedicationAutocomplete from "@/components/medication-autocomplete";
import { QuickMedicationSearch } from "@/components/quick-medication-search";
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
import { t } from "@/lib/i18n";

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
  const [manualMedicationName, setManualMedicationName] = useState<string>("");

  // Update selectedPatientId when patientId prop changes or modal opens
  useEffect(() => {
    if (open && patientId) {
      setSelectedPatientId(patientId);
    }
  }, [open, patientId]);

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: !patientId,
  });

  const { data: pharmacies } = useQuery<Pharmacy[]>({
    queryKey: ["/api/pharmacies"],
  });

  const form = useForm<Omit<InsertPrescription, "patientId" | "medicationId">>({
    resolver: zodResolver(insertPrescriptionSchema.omit({ patientId: true, medicationId: true })),
    defaultValues: {
      visitId: visitId || undefined,
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
        if (selectedPatientId) {
          queryClient.invalidateQueries({ queryKey: [`/api/patients/${selectedPatientId}/prescriptions`] });
          queryClient.invalidateQueries({ queryKey: [`/api/patients/${selectedPatientId}/activity-trail`] });
        }
        if (visitId) {
          queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/prescriptions`] });
        }
        
        toast({
          title: t('prescription.success'),
          description: t('prescription.successMessage'),
        });
        form.reset();
        setSelectedPatientId(undefined);
        setSelectedMedicine(null);
        setManualMedicationName("");
        onOpenChange(false);
      } catch (error) {
        console.error('Post-success cleanup failed:', error);
      }
    },
    onError: (error: Error) => {
      console.error('Prescription creation error:', error);
      toast({
        title: t('prescription.error'),
        description: error.message || t('prescription.errorMessage'),
        variant: "destructive",
      });
    },
  });

  // Smart Auto-Fill Function using comprehensive medications database
  const handleMedicationSelect = (medication: Medication) => {
    setSelectedMedicine(medication);
    
    // Auto-fill medication name
    if (medication.name) {
      form.setValue("medicationName", medication.name);
    }
    
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
      title: t('prescription.autoFillComplete'),
      description: t('prescription.autoFillMessage').replace('{medication}', medication.name),
    });
  };

  const handleManualMedicationEntry = (medicationName: string) => {
    setManualMedicationName(medicationName);
    setSelectedMedicine(null); // Clear any selected medicine
    toast({
      title: t('prescription.manualAdded'),
      description: t('prescription.manualAddedMessage').replace('{medication}', medicationName),
    });
  };

  const onSubmit = (data: Omit<InsertPrescription, "patientId" | "medicineId">) => {
    if (!selectedPatientId) {
      toast({
        title: t('prescription.error'),
        description: t('prescription.errorSelectPatient'),
        variant: "destructive",
      });
      return;
    }

    if (!selectedMedicine && !manualMedicationName) {
      toast({
        title: t('prescription.error'),
        description: t('prescription.errorSelectMedication'),
        variant: "destructive",
      });
      return;
    }

    const prescriptionData: InsertPrescription = {
      ...data,
      patientId: selectedPatientId,
      medicationId: null, // Reserved for medicines inventory table (backward compatibility)
      medicationDatabaseId: selectedMedicine?.id || null, // Reference to comprehensive medications database
      // Add medication name from either database selection or manual entry
      medicationName: selectedMedicine?.name || manualMedicationName || data.medicationName || "",
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
            {t('prescription.title')}
          </DialogTitle>
          <DialogDescription>
            {t('prescription.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Patient Selection */}
            {!patientId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('prescription.patient')}</label>
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
                        : t('prescription.selectPatient')}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder={t('prescription.searchPatients')} />
                      <CommandEmpty>{t('prescription.noPatientFound')}</CommandEmpty>
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
              </div>
            )}

            {/* Medication Input Method Toggle */}
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-blue-500" />
                {t('prescription.medicationSelection')}
              </FormLabel>
              
              {/* Toggle between search and manual input */}
              <div className="flex gap-2 mb-3">
                <Button
                  type="button"
                  variant={!manualMedicationName ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setManualMedicationName("");
                    setSelectedMedicine(null);
                  }}
                  className="flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  {t('prescription.searchDatabase')}
                </Button>
                <Button
                  type="button"
                  variant={manualMedicationName ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedMedicine(null);
                    setManualMedicationName("manual");
                  }}
                  className="flex items-center gap-1"
                >
                  <Pill className="h-3 w-3" />
                  {t('prescription.manualEntry')}
                </Button>
              </div>

              {/* Database Search Mode */}
              {!manualMedicationName && (
                <div>
                  <QuickMedicationSearch
                    onSelect={(medication) => {
                      const fullMedication = medication as Medication;
                      setSelectedMedicine(fullMedication);
                      handleMedicationSelect(fullMedication);
                    }}
                    onSearchChange={(query) => {
                      // Clear selected medication when user starts typing a new search
                      // This prevents showing stale auto-fill data for previously selected medication
                      if (query.trim().length < 2 || (selectedMedicine && query.trim().toLowerCase() !== selectedMedicine.name.toLowerCase())) {
                        setSelectedMedicine(null);
                      }
                    }}
                    placeholder={t('prescription.searchPlaceholder')}
                    showDetails={false}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {t('prescription.searchDescription')}
                  </p>
                </div>
              )}

              {/* Manual Entry Mode */}
              {manualMedicationName && (
                <div>
                  <FormField
                    control={form.control}
                    name="medicationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder={t('prescription.manualPlaceholder')}
                            className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 
                                     border-orange-300 hover:border-orange-400"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              field.onChange(e);
                              setManualMedicationName(e.target.value || "manual");
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                    <div className="flex items-center mb-1">
                      <Pill className="h-4 w-4 text-orange-600 mr-2" />
                      <span className="font-medium text-orange-800">{t('prescription.manualTitle')}</span>
                    </div>
                    <p className="text-orange-700 text-xs">
                      {t('prescription.manualDescription')}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Auto-fill Preview */}
              {selectedMedicine && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center mb-2">
                    <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-800">{t('prescription.autoFillTitle').replace('{medication}', selectedMedicine.name)}</span>
                  </div>
                  <div className="space-y-1 text-blue-700">
                    {selectedMedicine.dosageAdult && (
                      <div><strong>{t('prescription.autoFillDosage')}</strong> {selectedMedicine.dosageAdult}</div>
                    )}
                    {selectedMedicine.frequency && (
                      <div><strong>{t('prescription.autoFillFrequency')}</strong> {selectedMedicine.frequency}</div>
                    )}
                    {selectedMedicine.category && (
                      <div><strong>{t('prescription.autoFillDuration')}</strong> {
                        selectedMedicine.category === "Antibiotic" ? "7 days" :
                        selectedMedicine.category === "Antimalarial" ? "3 days" :
                        selectedMedicine.category === "Analgesic" || selectedMedicine.category === "NSAID" ? "As needed" :
                        selectedMedicine.category === "Antihypertensive" || selectedMedicine.category === "ACE Inhibitor" ? "Ongoing as directed" :
                        selectedMedicine.category === "Antidiabetic" ? "Ongoing as directed" : "As prescribed"
                      }</div>
                    )}
                    {selectedMedicine.routeOfAdministration && (
                      <div><strong>{t('prescription.autoFillRoute')}</strong> {selectedMedicine.routeOfAdministration}</div>
                    )}
                    {selectedMedicine.contraindications && (
                      <div className="text-red-600"><strong>{t('prescription.contraindications')}</strong> {selectedMedicine.contraindications}</div>
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
                    <FormLabel>{t('prescription.dosage')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('prescription.dosagePlaceholder')} 
                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 
                                 border-slate-300 hover:border-slate-400
                                 data-[invalid]:border-red-500 data-[invalid]:focus:ring-red-500"
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('prescription.dosageDescription')}
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
                    <FormLabel>{t('prescription.frequency')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('prescription.frequencyPlaceholder')} 
                        className="focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 
                                 border-slate-300 hover:border-slate-400
                                 data-[invalid]:border-red-500 data-[invalid]:focus:ring-red-500"
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('prescription.frequencyDescription')}
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
                    <FormLabel>{t('prescription.duration')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('prescription.durationPlaceholder')} 
                        className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 
                                 border-slate-300 hover:border-slate-400
                                 data-[invalid]:border-red-500 data-[invalid]:focus:ring-red-500"
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('prescription.durationDescription')}
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
                    <FormLabel>{t('prescription.status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('prescription.selectStatus')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">{t('prescription.status.active')}</SelectItem>
                        <SelectItem value="completed">{t('prescription.status.completed')}</SelectItem>
                        <SelectItem value="discontinued">{t('prescription.status.discontinued')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pharmacy Selection */}
              <FormField
                control={form.control}
                name="pharmacyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('prescription.pharmacy')}</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
                          <SelectValue placeholder={t('prescription.selectPharmacy')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t('prescription.noPharmacy')}</SelectItem>
                        {pharmacies?.map((pharmacy) => (
                          <SelectItem key={pharmacy.id} value={pharmacy.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{pharmacy.name}</span>
                              <span className="text-xs text-gray-500">
                                {pharmacy.address} • {pharmacy.phone}
                              </span>
                              {pharmacy.deliveryAvailable && (
                                <span className="text-xs text-green-600">{t('prescription.deliveryAvailable')}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('prescription.pharmacyDescription')}
                    </p>
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
                  <FormLabel>{t('prescription.instructions')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('prescription.instructionsPlaceholder')}
                      rows={4}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('prescription.instructionsDescription')}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Auto-Fill Preview with Animation */}
            {selectedMedicine && (selectedMedicine.dosageAdult || selectedMedicine.indications) && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 
                            animate-in slide-in-from-top-2 duration-300 ease-out">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                  <span className="font-medium text-blue-800">{t('prescription.autoFillApplied')}</span>
                  <div className="ml-auto">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-ping"></div>
                  </div>
                </div>
                <div className="text-sm text-blue-700">
                  {t('prescription.autoFillDescription').replace('{medication}', selectedMedicine.name)}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedMedicine.dosageAdult && (
                    <Badge variant="outline" className="text-blue-700 border-blue-300 bg-white/50 
                                                      animate-in fade-in duration-500 delay-100">
                      {t('prescription.autoFillDosage')} {selectedMedicine.dosageAdult}
                    </Badge>
                  )}
                  {selectedMedicine.frequency && (
                    <Badge variant="outline" className="text-blue-700 border-blue-300 bg-white/50
                                                      animate-in fade-in duration-500 delay-200">
                      {t('prescription.autoFillFrequency')} {selectedMedicine.frequency}
                    </Badge>
                  )}
                  {selectedMedicine.dosageChild && (
                    <Badge variant="outline" className="text-blue-700 border-blue-300 bg-white/50
                                                      animate-in fade-in duration-500 delay-300">
                      {t('prescription.autoFillDuration')} {selectedMedicine.dosageChild || 'As prescribed'}
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
                {t('prescription.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={createPrescriptionMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createPrescriptionMutation.isPending ? t('prescription.creating') : t('prescription.create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}