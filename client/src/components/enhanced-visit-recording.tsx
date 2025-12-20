import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatPatientName } from "@/lib/patient-utils";
import { GlobalMedicationSearch } from "@/components/global-medication-search";
import { visitTemplates, getAllCategories, type VisitTemplate } from "@/lib/visit-templates";
import { getMedicationSuggestions, getTreatmentInstructions, formatMedication, type MedicationSuggestion } from "@/lib/medication-suggestions";

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
  Weight,
  FileText,
  Save,
  Plus,
  X,
  Check,
  Sparkles,
  Cloud,
  CloudOff,
  AlertCircle,
  Copy,
  BookOpen
} from "lucide-react";

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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bmi, setBmi] = useState<number | null>(null);
  const [vitalSignsAlerts, setVitalSignsAlerts] = useState<string[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [suggestedMedications, setSuggestedMedications] = useState<MedicationSuggestion[]>([]);
  const [treatmentInstructions, setTreatmentInstructions] = useState<string>("");
  const [aiDiagnosticSuggestions, setAiDiagnosticSuggestions] = useState<any[]>([]);
  const [isLoadingAiDiagnostics, setIsLoadingAiDiagnostics] = useState(false);
  const [showAiDiagnosticsDialog, setShowAiDiagnosticsDialog] = useState(false);


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

  // Auto-save draft key
  const draftKey = `visit-draft-${patientId}`;

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        return draft;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  }, [draftKey]);

  // Save draft to localStorage
  const saveDraft = useCallback((data: any) => {
    try {
      setIsSaving(true);
      localStorage.setItem(draftKey, JSON.stringify({
        ...data,
        additionalDiagnoses,
        medicationList,
        timestamp: new Date().toISOString()
      }));
      setLastSaved(new Date());
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save draft:', error);
      setIsSaving(false);
    }
  }, [draftKey, additionalDiagnoses, medicationList]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
      setLastSaved(null);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [draftKey]);

  // Calculate BMI from height and weight
  const calculateBMI = useCallback((weight: string, height: string) => {
    const weightNum = Number.parseFloat(weight);
    const heightNum = Number.parseFloat(height);

    if (weightNum > 0 && heightNum > 0) {
      // BMI = weight(kg) / (height(m))^2
      const heightInMeters = heightNum / 100;
      const calculatedBMI = weightNum / (heightInMeters * heightInMeters);
      setBmi(Math.round(calculatedBMI * 10) / 10);
      return calculatedBMI;
    }
    setBmi(null);
    return null;
  }, []);

  // Validate vital signs and set alerts
  const validateVitalSigns = useCallback((formData: Partial<VisitFormData>) => {
    const alerts: string[] = [];

    // Blood pressure validation
    if (formData.bloodPressure) {
      const bpMatch = formData.bloodPressure.match(/(\d+)\/(\d+)/);
      if (bpMatch) {
        const systolic = Number.parseInt(bpMatch[1], 10);
        const diastolic = Number.parseInt(bpMatch[2], 10);
        if (systolic > 140 || diastolic > 90) {
          alerts.push('Elevated blood pressure detected');
        } else if (systolic < 90 || diastolic < 60) {
          alerts.push('Low blood pressure detected');
        }
      }
    }

    // Heart rate validation
    if (formData.heartRate) {
      const hr = Number.parseInt(formData.heartRate, 10);
      if (hr > 100) {
        alerts.push('Tachycardia detected (HR > 100)');
      } else if (hr < 60) {
        alerts.push('Bradycardia detected (HR < 60)');
      }
    }

    // Temperature validation
    if (formData.temperature) {
      const temp = Number.parseFloat(formData.temperature);
      if (temp > 38.0) {
        alerts.push('Fever detected (>38°C)');
      } else if (temp < 36.0) {
        alerts.push('Low temperature detected (<36°C)');
      }
    }

    // Oxygen saturation validation
    if (formData.oxygenSaturation) {
      const spo2 = Number.parseInt(formData.oxygenSaturation, 10);
      if (spo2 < 95) {
        alerts.push('Low oxygen saturation (<95%)');
      }
    }

    // Respiratory rate validation
    if (formData.respiratoryRate) {
      const rr = Number.parseInt(formData.respiratoryRate, 10);
      if (rr > 20) {
        alerts.push('Elevated respiratory rate (>20)');
      } else if (rr < 12) {
        alerts.push('Low respiratory rate (<12)');
      }
    }

    setVitalSignsAlerts(alerts);
  }, []);

  // Auto-save effect - saves form data every 30 seconds
  useEffect(() => {
    if (!open) return;

    const subscription = form.watch((value) => {
      // Validate vital signs on change
      validateVitalSigns(value);

      // Calculate BMI on weight/height change
      if (value.weight && value.height) {
        calculateBMI(value.weight, value.height);
      }

      // Update medication suggestions when diagnosis changes
      if (value.diagnosis) {
        const suggestions = getMedicationSuggestions(value.diagnosis);
        setSuggestedMedications(suggestions);

        const instructions = getTreatmentInstructions(value.diagnosis);
        if (instructions) {
          setTreatmentInstructions(instructions);
        }
      } else {
        setSuggestedMedications([]);
        setTreatmentInstructions("");
      }
    });

    const autoSaveInterval = setInterval(() => {
      const formData = form.getValues();
      // Only save if there's meaningful data
      if (formData.chiefComplaint || formData.diagnosis || formData.treatmentPlan) {
        saveDraft(formData);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => {
      subscription.unsubscribe();
      clearInterval(autoSaveInterval);
    };
  }, [open, form, saveDraft, validateVitalSigns, calculateBMI]);

  // Reset form when modal opens and load draft
  useEffect(() => {
    if (open) {
      setIsFormVisible(true);
      const draft = loadDraft();

      if (draft && draft.timestamp) {
        const draftAge = Date.now() - new Date(draft.timestamp).getTime();
        const hoursSinceDraft = draftAge / (1000 * 60 * 60);

        // If draft is less than 24 hours old, ask to restore
        if (hoursSinceDraft < 24) {
          toast({
            title: "Draft Found",
            description: `Found a draft from ${new Date(draft.timestamp).toLocaleString()}. Would you like to restore it?`,
            duration: 10000,
          });

          // Restore draft data
          if (draft.additionalDiagnoses) setAdditionalDiagnoses(draft.additionalDiagnoses);
          if (draft.medicationList) setMedicationList(draft.medicationList);

          // Remove draft-specific fields before resetting form
          const { additionalDiagnoses: _, medicationList: __, timestamp: ___, ...formData } = draft;
          form.reset(formData);
        } else {
          // Clear old draft
          clearDraft();
          form.reset();
          setAdditionalDiagnoses([]);
          setMedicationList([]);
        }
      } else {
        form.reset();
        setAdditionalDiagnoses([]);
        setMedicationList([]);
      }
    }
  }, [open, form, loadDraft, clearDraft, toast]);

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
        heartRate: data.heartRate ? Number.parseInt(data.heartRate, 10) : null,
        temperature: data.temperature ? Number.parseFloat(data.temperature) : null,
        weight: data.weight ? Number.parseFloat(data.weight) : null,
        height: data.height ? Number.parseFloat(data.height) : null,
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

      // Clear auto-saved draft
      clearDraft();

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

      // Reset form and state
      form.reset();
      setAdditionalDiagnoses([]);
      setMedicationList([]);
      setShouldCreateProceduralReport(false);
      setBmi(null);
      setVitalSignsAlerts([]);

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

  // Apply template to form
  const applyTemplate = (template: VisitTemplate) => {
    const currentValues = form.getValues();

    // Apply template values, preserving any existing data
    form.setValue('visitType', template.visitType || currentValues.visitType);
    if (template.chiefComplaint) form.setValue('chiefComplaint', template.chiefComplaint);
    if (template.historyOfPresentIllness) form.setValue('historyOfPresentIllness', template.historyOfPresentIllness);
    if (template.generalAppearance) form.setValue('generalAppearance', template.generalAppearance);
    if (template.cardiovascularSystem) form.setValue('cardiovascularSystem', template.cardiovascularSystem);
    if (template.respiratorySystem) form.setValue('respiratorySystem', template.respiratorySystem);
    if (template.gastrointestinalSystem) form.setValue('gastrointestinalSystem', template.gastrointestinalSystem);
    if (template.neurologicalSystem) form.setValue('neurologicalSystem', template.neurologicalSystem);
    if (template.musculoskeletalSystem) form.setValue('musculoskeletalSystem', template.musculoskeletalSystem);
    if (template.assessment) form.setValue('assessment', template.assessment);
    if (template.diagnosis) form.setValue('diagnosis', template.diagnosis);
    if (template.treatmentPlan) form.setValue('treatmentPlan', template.treatmentPlan);
    if (template.patientInstructions) form.setValue('patientInstructions', template.patientInstructions);
    if (template.followUpInstructions) form.setValue('followUpInstructions', template.followUpInstructions);

    setShowTemplateSelector(false);

    toast({
      title: "Template Applied",
      description: `${template.name} template has been applied. You can customize the fields as needed.`,
    });
  };

  // Get filtered templates
  const filteredTemplates = selectedCategory === "All"
    ? visitTemplates
    : visitTemplates.filter(t => t.category === selectedCategory);

  const categories = ["All", ...getAllCategories()];

  return (
    <>
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
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      Record Patient Visit
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Comprehensive patient visit documentation for {patientName}
                    </p>
                  </div>

                  {/* Auto-save indicator */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isSaving ? (
                      <>
                        <Cloud className="h-4 w-4 animate-pulse text-blue-500" />
                        <span>Saving draft...</span>
                      </>
                    ) : lastSaved ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                      </>
                    ) : (
                      <>
                        <CloudOff className="h-4 w-4 text-gray-400" />
                        <span>Not saved</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Vital Signs Alerts */}
                {vitalSignsAlerts.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-900 mb-1">Clinical Alerts</h4>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          {vitalSignsAlerts.map((alert, index) => (
                            <li key={index}>• {alert}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* BMI Display */}
                {bmi !== null && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Weight className="h-5 w-5 text-blue-600" />
                      <div>
                        <span className="font-medium text-blue-900">BMI: {bmi}</span>
                        <span className="ml-2 text-sm text-blue-700">
                          ({bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'})
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                  {/* Template Selector */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold text-purple-900">Quick Start with Templates</h3>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                      >
                        {showTemplateSelector ? 'Hide Templates' : 'Browse Templates'}
                      </Button>
                    </div>

                    {showTemplateSelector && (
                      <div className="space-y-3 mt-4">
                        <div className="flex gap-2 flex-wrap">
                          {categories.map(category => (
                            <Button
                              key={category}
                              type="button"
                              variant={selectedCategory === category ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedCategory(category)}
                            >
                              {category}
                            </Button>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                          {filteredTemplates.map(template => (
                            <div
                              key={template.id}
                              className="bg-white p-3 rounded-lg border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
                              onClick={() => applyTemplate(template)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm text-gray-900">{template.name}</h4>
                                  <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                                  <Badge variant="secondary" className="mt-2 text-xs">
                                    {template.category}
                                  </Badge>
                                </div>
                                <Copy className="h-4 w-4 text-purple-500 flex-shrink-0 ml-2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

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
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    placeholder="Primary diagnosis..."
                                    className="flex-1"
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    const formData = form.getValues();
                                    if (!formData.chiefComplaint && !formData.historyOfPresentIllness) {
                                      toast({
                                        title: "Missing Information",
                                        description: "Please enter chief complaint or symptoms to get AI diagnostic suggestions.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    
                                    setIsLoadingAiDiagnostics(true);
                                    try {
                                      const response = await apiRequest("/api/suggestions/ai-diagnostics", "POST", {
                                        chiefComplaint: formData.chiefComplaint,
                                        symptoms: formData.chiefComplaint,
                                        historyOfPresentIllness: formData.historyOfPresentIllness,
                                        patientAge: patient?.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : undefined,
                                        patientGender: patient?.gender,
                                        medicalHistory: patient?.medicalHistory,
                                        allergies: patient?.allergies,
                                        vitalSigns: {
                                          bloodPressure: formData.bloodPressure,
                                          heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
                                          temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
                                          respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined,
                                          oxygenSaturation: formData.oxygenSaturation ? parseInt(formData.oxygenSaturation) : undefined,
                                          weight: formData.weight ? parseFloat(formData.weight) : undefined,
                                        },
                                        physicalExamination: {
                                          generalAppearance: formData.generalAppearance,
                                          cardiovascularSystem: formData.cardiovascularSystem,
                                          respiratorySystem: formData.respiratorySystem,
                                          gastrointestinalSystem: formData.gastrointestinalSystem,
                                          neurologicalSystem: formData.neurologicalSystem,
                                          musculoskeletalSystem: formData.musculoskeletalSystem,
                                        },
                                      });
                                      
                                      const data = await response.json();
                                      if (data.suggestions && data.suggestions.length > 0) {
                                        setAiDiagnosticSuggestions(data.suggestions);
                                        setShowAiDiagnosticsDialog(true);
                                      } else {
                                        toast({
                                          title: "No Suggestions",
                                          description: "AI could not generate diagnostic suggestions. Please try again or enter diagnosis manually.",
                                        });
                                      }
                                    } catch (error: any) {
                                      console.error("AI diagnostic error:", error);
                                      toast({
                                        title: "AI Diagnostics Unavailable",
                                        description: error.message || "AI diagnostic suggestions are not available. Please enter diagnosis manually.",
                                        variant: "destructive",
                                      });
                                    } finally {
                                      setIsLoadingAiDiagnostics(false);
                                    }
                                  }}
                                  disabled={isLoadingAiDiagnostics}
                                >
                                  {isLoadingAiDiagnostics ? (
                                    <>
                                      <Cloud className="h-4 w-4 mr-2 animate-spin" />
                                      Analyzing...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-4 w-4 mr-2" />
                                      AI Diagnose
                                    </>
                                  )}
                                </Button>
                              </div>
                              <FormMessage />
                            </div>
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

                    {/* Smart Medication Suggestions */}
                    {suggestedMedications.length > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold text-green-900">Smart Medication Suggestions</h4>
                        </div>

                        {treatmentInstructions && (
                          <div className="mb-3 p-2 bg-green-100 rounded text-sm text-green-800">
                            <strong>Clinical Note:</strong> {treatmentInstructions}
                          </div>
                        )}

                        <div className="space-y-2">
                          <p className="text-sm text-green-700 mb-2">
                            Based on the diagnosis, consider these medications:
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {suggestedMedications.map((med, index) => (
                              <div
                                key={index}
                                className="bg-white p-3 rounded border border-green-200 hover:border-green-400 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{med.name}</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {med.dosage} • {med.frequency} • {med.duration}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {med.route} • {med.category}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const formattedMed = formatMedication(med);
                                      if (!medicationList.includes(formattedMed)) {
                                        setMedicationList([...medicationList, formattedMed]);
                                        toast({
                                          title: "Medication Added",
                                          description: `${med.name} has been added to the prescription list.`,
                                        });
                                      }
                                    }}
                                    className="flex-shrink-0"
                                    title="Add"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

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

    {/* AI Diagnostic Suggestions Dialog */}
    <Dialog open={showAiDiagnosticsDialog} onOpenChange={setShowAiDiagnosticsDialog}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI-Powered Diagnostic Suggestions
          </DialogTitle>
        </DialogHeader>
        
        {aiDiagnosticSuggestions.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Based on the clinical presentation, here are AI-generated diagnostic suggestions. Review and select the most appropriate diagnosis.
            </p>
            
            <div className="space-y-3">
              {aiDiagnosticSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    suggestion.confidence === 'high'
                      ? 'border-green-300 bg-green-50'
                      : suggestion.confidence === 'medium'
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg">{suggestion.diagnosis}</h4>
                        {suggestion.icdCode && (
                          <Badge variant="outline" className="text-xs">
                            {suggestion.icdCode}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            suggestion.confidence === 'high'
                              ? 'default'
                              : suggestion.confidence === 'medium'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {suggestion.probability}% probability
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{suggestion.reasoning}</p>
                      
                      {suggestion.redFlags && suggestion.redFlags.length > 0 && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-semibold text-red-900">Red Flags:</span>
                          </div>
                          <ul className="list-disc list-inside text-sm text-red-800">
                            {suggestion.redFlags.map((flag: string, i: number) => (
                              <li key={i}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {suggestion.recommendedTests && suggestion.recommendedTests.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Recommended Tests:</p>
                          <div className="flex flex-wrap gap-1">
                            {suggestion.recommendedTests.map((test: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {test}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (suggestion.icdCode) {
                        form.setValue("diagnosis", `${suggestion.diagnosis} (${suggestion.icdCode})`);
                      } else {
                        form.setValue("diagnosis", suggestion.diagnosis);
                      }
                      setShowAiDiagnosticsDialog(false);
                      toast({
                        title: "Diagnosis Applied",
                        description: `Selected: ${suggestion.diagnosis}`,
                      });
                    }}
                    className="mt-2"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Use This Diagnosis
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}