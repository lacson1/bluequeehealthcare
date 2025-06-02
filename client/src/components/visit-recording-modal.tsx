
import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVisitSchema, type InsertVisit, type Patient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import SmartFormField from "@/components/smart-form-field";

const visitFormSchema = z.object({
  complaint: z.string().min(1, "Chief complaint is required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  treatment: z.string().min(1, "Treatment plan is required"),
  visitType: z.string().default("consultation"),
  bloodPressure: z.string().default(""),
  heartRate: z.string().default(""),
  temperature: z.string().default(""),
  weight: z.string().default(""),
  height: z.string().default(""),
  followUpDate: z.string().default(""),
});

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisitRecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId?: number;
}

export default function VisitRecordingModal({
  open,
  onOpenChange,
  patientId,
}: VisitRecordingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>(patientId);

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: !patientId && open, // Only fetch if patientId is not provided and modal is open
  });

  // Memoize the draft key to prevent unnecessary recalculations
  const draftKey = useMemo(() => `visitDraft_${selectedPatientId || patientId || 'new'}`, [selectedPatientId, patientId]);
  
  // Memoize loadDraft to prevent re-renders
  const loadDraft = useMemo(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      return saved ? JSON.parse(saved) : {
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        weight: "",
        height: "",
        complaint: "",
        diagnosis: "",
        treatment: "",
        followUpDate: "",
        visitType: "consultation",
      };
    } catch (error) {
      console.warn('Failed to load draft:', error);
      return {
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        weight: "",
        complaint: "",
        diagnosis: "",
        treatment: "",
        followUpDate: "",
        visitType: "consultation",
      };
    }
  }, [draftKey]);

  const form = useForm({
    resolver: zodResolver(visitFormSchema),
    defaultValues: loadDraft,
  });

  // Debounced auto-save functionality
  const watchedValues = form.watch();
  
  useEffect(() => {
    if (!open) return; // Don't save when modal is closed
    
    // Only save if we have meaningful data
    const hasData = watchedValues.complaint || watchedValues.diagnosis || watchedValues.treatment;
    if (!hasData) return;
    
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(watchedValues));
      } catch (error) {
        console.warn('Failed to save draft:', error);
      }
    }, 1000); // Debounce by 1 second

    return () => clearTimeout(timeoutId);
  }, [watchedValues, draftKey, open]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedPatientId(patientId);
      form.reset(loadDraft);
    } else {
      // Clear form state when modal closes
      setSelectedPatientId(undefined);
      setPatientSearchOpen(false);
    }
  }, [open, patientId, form, loadDraft]);

  const recordVisitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/patients/${data.patientId}/visits`, data);
      return response.json();
    },
    onSuccess: () => {
      // Clear the draft after successful submission
      try {
        localStorage.removeItem(draftKey);
      } catch (error) {
        console.warn('Failed to remove draft:', error);
      }
      
      toast({
        title: "Success",
        description: "Visit recorded successfully!",
      });
      
      // Reset form and close dialog immediately
      form.reset();
      setSelectedPatientId(undefined);
      onOpenChange(false);
      
      // Refresh data after dialog is closed
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        if (selectedPatientId) {
          queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatientId, "visits"] });
        }
      }, 100);
    },
    onError: (error) => {
      console.error('Visit recording error:', error);
      toast({
        title: "Error",
        description: "Failed to record visit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertVisit, "patientId">) => {
    if (!selectedPatientId) {
      toast({
        title: "Error",
        description: "Please select a patient.",
        variant: "destructive",
      });
      return;
    }

    // Clean up and convert data for API submission
    const cleanedData = {
      patientId: selectedPatientId,
      chiefComplaint: data.complaint,
      diagnosis: data.diagnosis,
      treatment: data.treatment,
      visitType: data.visitType || "consultation",
      visitDate: new Date().toISOString().split('T')[0],
      bloodPressure: data.bloodPressure || null,
      heartRate: data.heartRate ? parseFloat(data.heartRate) : null,
      temperature: data.temperature ? parseFloat(data.temperature) : null,
      weight: data.weight ? parseFloat(data.weight) : null,
      followUpDate: data.followUpDate || null,
      status: "completed"
    };

    recordVisitMutation.mutate(cleanedData);
  };

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);

  // Manual save draft function
  const saveDraft = () => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(watchedValues));
      toast({
        title: "Draft Saved",
        description: "Your visit data has been saved as a draft.",
      });
    } catch (error) {
      console.warn('Failed to save draft:', error);
      toast({
        title: "Error",
        description: "Failed to save draft.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    // Reset form state when dialog closes
    form.reset();
    setSelectedPatientId(undefined);
    setPatientSearchOpen(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        form.reset();
        setSelectedPatientId(undefined);
        setPatientSearchOpen(false);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Patient Visit</DialogTitle>
          <DialogDescription>
            Record a new visit for a patient including vitals and diagnosis.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Patient Selection */}
            {!patientId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Patient</label>
                <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={patientSearchOpen}
                      className="w-full justify-between"
                      type="button"
                    >
                      {selectedPatient
                        ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                        : "Select patient..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search patient..." />
                      <CommandEmpty>No patient found.</CommandEmpty>
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
                            {patient.title ? `${patient.title} ` : ''}{patient.firstName} {patient.lastName} - {patient.phone}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Vitals */}
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-4">Vital Signs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bloodPressure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Pressure (mmHg)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="120/80" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="heartRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heart Rate (bpm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || "")}
                          placeholder="72"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature (°C)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || "")}
                          placeholder="36.5"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || "")}
                          placeholder="70.5"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Symptoms & Diagnosis */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="complaint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chief Complaint</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={2}
                        placeholder="Patient's main concern or symptoms..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnosis</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Clinical diagnosis and observations..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="treatment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treatment Plan</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Prescribed medications, procedures, recommendations..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="followUpDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visit Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="consultation">Consultation</SelectItem>
                          <SelectItem value="follow-up">Follow-up</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="routine">Routine Check-up</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={saveDraft}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={recordVisitMutation.isPending}
                >
                  {recordVisitMutation.isPending ? "Recording..." : "Record Visit"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
