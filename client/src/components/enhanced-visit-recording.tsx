import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QuickMedicationSearch } from "@/components/quick-medication-search";

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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Stethoscope, 
  Heart, 
  Thermometer, 
  Weight, 
  Ruler,
  Calendar,
  FileText,
  Save,
  Plus,
  X,
  Check,
  ChevronsUpDown
} from "lucide-react";
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

// Comprehensive visit form schema
const comprehensiveVisitSchema = z.object({
  // Basic Visit Information
  visitType: z.string().min(1, "Visit type is required"),
  chiefComplaint: z.string().min(1, "Chief complaint is required"),
  historyOfPresentIllness: z.string().default(""),
  
  // Vital Signs
  bloodPressure: z.string().default(""),
  heartRate: z.string().default(""),
  temperature: z.string().default(""),
  weight: z.string().default(""),
  height: z.string().default(""),
  respiratoryRate: z.string().default(""),
  oxygenSaturation: z.string().default(""),
  
  // Physical Examination
  generalAppearance: z.string().default(""),
  cardiovascularSystem: z.string().default(""),
  respiratorySystem: z.string().default(""),
  gastrointestinalSystem: z.string().default(""),
  neurologicalSystem: z.string().default(""),
  musculoskeletalSystem: z.string().default(""),
  
  // Assessment and Plan
  assessment: z.string().default(""),
  diagnosis: z.string().min(1, "Primary diagnosis is required"),
  secondaryDiagnoses: z.string().default(""),
  treatmentPlan: z.string().min(1, "Treatment plan is required"),
  medications: z.string().default(""),
  
  // Follow-up and Instructions
  patientInstructions: z.string().default(""),
  followUpDate: z.string().default(""),
  followUpInstructions: z.string().default(""),
  
  // Additional Notes
  additionalNotes: z.string().default(""),
});

type VisitFormData = z.infer<typeof comprehensiveVisitSchema>;

interface EnhancedVisitRecordingProps {
  patientId: number;
  onSave?: () => void;
}

export function EnhancedVisitRecording({ patientId, onSave }: EnhancedVisitRecordingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalDiagnoses, setAdditionalDiagnoses] = useState<string[]>([]);
  const [medicationList, setMedicationList] = useState<string[]>([]);
  const [medicationSearchTerm, setMedicationSearchTerm] = useState("");
  const [isMedicationPopoverOpen, setIsMedicationPopoverOpen] = useState(false);

  // Fetch medications for autocomplete
  const { data: medications = [] } = useQuery({
    queryKey: ['/api/medicines'],
    enabled: true,
  });

  // Filter medications based on search term
  const filteredMedications = useMemo(() => {
    if (!medicationSearchTerm) return medications.slice(0, 20); // Show first 20 by default
    
    return medications
      .filter((med: any) => 
        med.name.toLowerCase().includes(medicationSearchTerm.toLowerCase()) ||
        med.genericName?.toLowerCase().includes(medicationSearchTerm.toLowerCase())
      )
      .slice(0, 10); // Limit to 10 results for performance
  }, [medications, medicationSearchTerm]);

  const form = useForm<VisitFormData>({
    resolver: zodResolver(comprehensiveVisitSchema),
    defaultValues: {
      visitType: "consultation",
      chiefComplaint: "",
      historyOfPresentIllness: "",
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      weight: "",
      height: "",
      respiratoryRate: "",
      oxygenSaturation: "",
      generalAppearance: "",
      cardiovascularSystem: "",
      respiratorySystem: "",
      gastrointestinalSystem: "",
      neurologicalSystem: "",
      musculoskeletalSystem: "",
      assessment: "",
      diagnosis: "",
      secondaryDiagnoses: "",
      treatmentPlan: "",
      medications: "",
      patientInstructions: "",
      followUpDate: "",
      followUpInstructions: "",
      additionalNotes: "",
    },
  });

  // Fetch patient data
  const { data: patient } = useQuery({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  // Get patient name safely
  const patientName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Patient';

  // Submit visit record
  const submitVisit = useMutation({
    mutationFn: async (data: VisitFormData) => {
      const visitData = {
        patientId,
        visitDate: new Date().toISOString(),
        visitType: data.visitType,
        chiefComplaint: data.chiefComplaint,
        diagnosis: data.diagnosis,
        treatment: data.treatmentPlan,
        bloodPressure: data.bloodPressure,
        heartRate: data.heartRate ? parseInt(data.heartRate) : null,
        temperature: data.temperature ? parseFloat(data.temperature) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        height: data.height ? parseFloat(data.height) : null,
        notes: JSON.stringify({
          historyOfPresentIllness: data.historyOfPresentIllness,
          vitalSigns: {
            respiratoryRate: data.respiratoryRate,
            oxygenSaturation: data.oxygenSaturation,
          },
          physicalExamination: {
            generalAppearance: data.generalAppearance,
            cardiovascularSystem: data.cardiovascularSystem,
            respiratorySystem: data.respiratorySystem,
            gastrointestinalSystem: data.gastrointestinalSystem,
            neurologicalSystem: data.neurologicalSystem,
            musculoskeletalSystem: data.musculoskeletalSystem,
          },
          assessment: data.assessment,
          secondaryDiagnoses: data.secondaryDiagnoses,
          medications: data.medications,
          patientInstructions: data.patientInstructions,
          followUpDate: data.followUpDate,
          followUpInstructions: data.followUpInstructions,
          additionalNotes: data.additionalNotes,
        }),
      };

      return apiRequest("POST", `/api/patients/${patientId}/visits`, visitData);
    },
    onSuccess: () => {
      toast({
        title: "Visit Recorded",
        description: "Patient visit has been successfully recorded and saved to the timeline.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/visits`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/activity-trail`] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      
      // Reset form
      form.reset();
      setAdditionalDiagnoses([]);
      setMedicationList([]);
      
      if (onSave) onSave();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record visit",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: VisitFormData) => {
    setIsSubmitting(true);
    submitVisit.mutate(data);
  };

  const addDiagnosis = () => {
    const newDiagnosis = form.getValues("secondaryDiagnoses");
    if (newDiagnosis.trim() && !additionalDiagnoses.includes(newDiagnosis.trim())) {
      setAdditionalDiagnoses([...additionalDiagnoses, newDiagnosis.trim()]);
      form.setValue("secondaryDiagnoses", "");
    }
  };

  const removeDiagnosis = (diagnosis: string) => {
    setAdditionalDiagnoses(additionalDiagnoses.filter(d => d !== diagnosis));
  };

  const addMedication = (medicationName?: string) => {
    const medication = medicationName || form.getValues("medications");
    if (medication.trim() && !medicationList.includes(medication.trim())) {
      setMedicationList([...medicationList, medication.trim()]);
      form.setValue("medications", "");
      setMedicationSearchTerm("");
      setIsMedicationPopoverOpen(false);
    }
  };

  const removeMedication = (medication: string) => {
    setMedicationList(medicationList.filter(m => m !== medication));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Record Patient Visit
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive patient visit documentation for {patientName}
          </p>
        </div>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Basic Visit Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Visit Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="visitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visit Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select visit type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="consultation">Consultation</SelectItem>
                            <SelectItem value="follow-up">Follow-up</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                            <SelectItem value="routine-checkup">Routine Checkup</SelectItem>
                            <SelectItem value="specialist-referral">Specialist Referral</SelectItem>
                            <SelectItem value="vaccination">Vaccination</SelectItem>
                            <SelectItem value="lab-review">Lab Review</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followUpDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follow-up Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="chiefComplaint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chief Complaint *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Patient's main complaint or reason for visit..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="historyOfPresentIllness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>History of Present Illness</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed history of the current illness..."
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Vital Signs */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Vital Signs
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="bloodPressure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Pressure</FormLabel>
                        <FormControl>
                          <Input placeholder="120/80" {...field} />
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
                          <Input placeholder="72" {...field} />
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
                          <Input placeholder="36.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="respiratoryRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Respiratory Rate</FormLabel>
                        <FormControl>
                          <Input placeholder="16" {...field} />
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
                          <Input placeholder="70" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (cm)</FormLabel>
                        <FormControl>
                          <Input placeholder="170" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="oxygenSaturation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Oxygen Saturation (%)</FormLabel>
                        <FormControl>
                          <Input placeholder="98" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Physical Examination */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Physical Examination</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="generalAppearance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>General Appearance</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Patient appears..." {...field} rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cardiovascularSystem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cardiovascular System</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Heart sounds, rhythm..." {...field} rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="respiratorySystem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Respiratory System</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Breath sounds, chest expansion..." {...field} rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gastrointestinalSystem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gastrointestinal System</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Abdomen examination..." {...field} rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="neurologicalSystem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Neurological System</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Mental status, reflexes..." {...field} rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="musculoskeletalSystem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Musculoskeletal System</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Range of motion, strength..." {...field} rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Assessment and Plan */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Assessment and Plan</h3>
                
                <FormField
                  control={form.control}
                  name="assessment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinical Assessment</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Clinical assessment and interpretation of findings..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="diagnosis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Diagnosis *</FormLabel>
                        <FormControl>
                          <Input placeholder="Primary diagnosis..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Secondary Diagnoses</FormLabel>
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="secondaryDiagnoses"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Add secondary diagnosis..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" onClick={addDiagnosis} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {additionalDiagnoses.map((diagnosis, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {diagnosis}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeDiagnosis(diagnosis)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="treatmentPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment Plan *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed treatment plan and interventions..."
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Medications</FormLabel>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Popover open={isMedicationPopoverOpen} onOpenChange={setIsMedicationPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isMedicationPopoverOpen}
                            className="w-full justify-between"
                          >
                            {medicationSearchTerm || "Search and select medication..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search medications..." 
                              value={medicationSearchTerm}
                              onValueChange={setMedicationSearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>No medications found.</CommandEmpty>
                              <CommandGroup>
                                {filteredMedications.map((medication: any) => (
                                  <CommandItem
                                    key={medication.id}
                                    value={medication.name}
                                    onSelect={(currentValue) => {
                                      addMedication(currentValue);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        medicationList.includes(medication.name) 
                                          ? "opacity-100" 
                                          : "opacity-0"
                                      }`}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{medication.name}</span>
                                      {medication.genericName && (
                                        <span className="text-sm text-muted-foreground">
                                          Generic: {medication.genericName}
                                        </span>
                                      )}
                                      {medication.description && (
                                        <span className="text-xs text-muted-foreground truncate">
                                          {medication.description}
                                        </span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormField
                        control={form.control}
                        name="medications"
                        render={({ field }) => (
                          <FormItem className="hidden">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button 
                      type="button" 
                      onClick={() => addMedication(medicationSearchTerm)} 
                      size="sm"
                      disabled={!medicationSearchTerm.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medicationList.map((medication, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {medication}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeMedication(medication)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Instructions and Follow-up */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Patient Instructions and Follow-up</h3>
                
                <FormField
                  control={form.control}
                  name="patientInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Instructions for patient care at home..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="followUpInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="When to return, warning signs to watch for..."
                          {...field}
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional observations or notes..."
                          {...field}
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Visit Record"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}