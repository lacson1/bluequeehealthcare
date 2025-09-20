import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatPatientName } from "@/lib/patient-utils";
import { QuickMedicationSearch } from "@/components/quick-medication-search";
import { GlobalMedicationSearch } from "@/components/global-medication-search";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ChevronsUpDown,
  Sparkles
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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave?: () => void;
}

export function EnhancedVisitRecording({ patientId, open, onOpenChange, onSave }: EnhancedVisitRecordingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldCreateProceduralReport, setShouldCreateProceduralReport] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [additionalDiagnoses, setAdditionalDiagnoses] = useState<string[]>([]);
  const [medicationList, setMedicationList] = useState<string[]>([]);
  const [medicationSearchTerm, setMedicationSearchTerm] = useState("");
  const [isMedicationPopoverOpen, setIsMedicationPopoverOpen] = useState(false);


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

  // Get patient name safely using standardized formatting
  const patientName = (patient && typeof patient === 'object' && 'firstName' in patient && 'lastName' in patient && patient.firstName && patient.lastName) 
    ? formatPatientName(patient as { firstName: string; lastName: string; title?: string | null }) 
    : 'Patient';
  
  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setIsFormVisible(true);
      form.reset();
      setAdditionalDiagnoses([]);
      setMedicationList([]);
    }
  }, [open, form]);

  // Submit visit record with medication review integration
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
        medications: medicationList.join(', '), // Include prescribed medications
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

      const response = await apiRequest(`/api/patients/${patientId}/visits`, "POST", visitData);
      return response.json();
    },
    onSuccess: async (createdVisit) => {
      toast({
        title: "Visit Recorded",
        description: "Patient visit has been successfully recorded and saved to the timeline.",
      });

      // If medications were prescribed, suggest medication review assignment
      if (medicationList.length > 0) {
        try {
          // Check if any medication review assignments should be created
          const shouldCreateReview = medicationList.some(medication => 
            // Suggest review for complex medications or those requiring monitoring
            medication.toLowerCase().includes('warfarin') ||
            medication.toLowerCase().includes('insulin') ||
            medication.toLowerCase().includes('digoxin') ||
            medication.toLowerCase().includes('lithium') ||
            medicationList.length >= 3 // Multiple medications
          );

          if (shouldCreateReview) {
            toast({
              title: "Medication Review Suggested",
              description: `Consider assigning medication review for ${medicationList.length} prescribed medications. Visit the patient's medication review tab to create assignments.`,
              duration: 8000,
            });
          }
        } catch (error) {
          console.log('Medication review suggestion check failed:', error);
        }
      }

      // Handle procedural report creation if requested
      if (shouldCreateProceduralReport) {
        toast({
          title: "Redirecting to Procedural Report",
          description: "Opening procedural report form with visit details pre-filled.",
          duration: 3000,
        });
        
        // Close the visit recording modal
        if (onOpenChange) onOpenChange(false);
        
        // Navigate to procedural reports page with visit context
        setTimeout(() => {
          window.location.href = `/procedural-reports?patientId=${patientId}&visitId=${createdVisit.id}&prefill=true`;
        }, 1000);
        
        return; // Exit early to prevent form reset
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/visits`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/activity-trail`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/medication-reviews`] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      
      // Reset form
      form.reset();
      setAdditionalDiagnoses([]);
      setMedicationList([]);
      setShouldCreateProceduralReport(false);
      
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Record Patient Visit - {(patient && typeof patient === 'object' && 'firstName' in patient && 'lastName' in patient && patient.firstName && patient.lastName) 
              ? formatPatientName(patient as { firstName: string; lastName: string; title?: string | null }) 
              : "Loading..."}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!isFormVisible ? (
            <div className="text-center py-8">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 max-w-md mx-auto">
                <Stethoscope className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to Record Visit</h3>
                <p className="text-sm text-blue-700 mb-6">
                  Click below to start comprehensive visit documentation including vital signs, examination, and treatment plan.
                </p>
                <Button 
                  onClick={() => setIsFormVisible(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Start Visit Recording
                </Button>
              </div>
            </div>
      ) : (
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
                      <FormLabel className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        Chief Complaint (with smart suggestions) *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Patient's main complaint or reason for visit..."
                          className="min-h-[80px]"
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
                        <FormLabel className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-500" />
                          Primary Diagnosis (with smart suggestions) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Primary diagnosis..."
                          />
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

                <GlobalMedicationSearch
                  selectedMedications={medicationList}
                  onMedicationsChange={setMedicationList}
                  label="Medications"
                  placeholder="Search medications from database..."
                  allowCustomMedications={true}
                />
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

              {/* Procedural Reports Integration Section */}
              {(form.watch("diagnosis") || form.watch("treatmentPlan")) && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    Procedural Documentation
                  </h3>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-700 mb-3">
                      Based on the diagnosis and treatment plan, you may need to document any procedures performed during this visit.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="createProceduralReport"
                          checked={shouldCreateProceduralReport}
                          onChange={(e) => setShouldCreateProceduralReport(e.target.checked)}
                          className="rounded border-purple-300"
                        />
                        <label htmlFor="createProceduralReport" className="text-sm font-medium text-purple-800">
                          Create procedural report after saving visit
                        </label>
                      </div>
                      
                      {shouldCreateProceduralReport && (
                        <div className="mt-3 p-3 bg-purple-100 border border-purple-300 rounded">
                          <p className="text-sm text-purple-800">
                            <strong>Note:</strong> After saving this visit, you'll be redirected to create a detailed procedural report with the visit information pre-filled.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Medication Review Assignment Section */}
              {medicationList.length > 0 && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-500" />
                    Medication Review Assignment
                  </h3>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 mb-3">
                      You have prescribed {medicationList.length} medication(s). Consider assigning a medication review for optimal patient safety and outcomes.
                    </p>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-800">Prescribed Medications:</h4>
                      <div className="flex flex-wrap gap-2">
                        {medicationList.map((medication, index) => (
                          <Badge key={index} variant="secondary" className="bg-white text-blue-700 border border-blue-300">
                            {medication}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        <strong>Suggestion:</strong> After saving this visit, navigate to the patient's medication review tab to create specific review assignments for complex medications or multiple drug regimens.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
      )}
        </div>
      </DialogContent>
    </Dialog>
  );
}