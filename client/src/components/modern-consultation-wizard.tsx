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
  FormDescription,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Stethoscope,
  Heart,
  Weight,
  FileText,
  Save,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  BookOpen,
  Copy,
  Zap,
  FileSearch,
  ClipboardList,
  Search,
  ChevronRight,
  Trash2
} from "lucide-react";

// Comprehensive visit form schema
const consultationSchema = z.object({
  // Basic Information
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

  // Follow-up
  patientInstructions: z.string().default(""),
  followUpDate: z.string().default(""),
  followUpInstructions: z.string().default(""),
  additionalNotes: z.string().default(""),
});

type ConsultationFormData = z.infer<typeof consultationSchema>;

interface ModernConsultationWizardProps {
  readonly patientId: number;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onSave?: () => void;
}

const STEPS = [
  { id: 1, name: "Complaint & History", icon: FileText },
  { id: 2, name: "Vital Signs", icon: Heart },
  { id: 3, name: "Examination", icon: Stethoscope },
  { id: 4, name: "Assessment & Plan", icon: ClipboardList },
  { id: 5, name: "Specialty Forms", icon: FileSearch },
  { id: 6, name: "Medications & Follow-up", icon: Plus },
];

export function ModernConsultationWizard({
  patientId,
  open,
  onOpenChange,
  onSave,
}: ModernConsultationWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medicationList, setMedicationList] = useState<string[]>([]);
  const [bmi, setBmi] = useState<number | null>(null);
  const [vitalSignsAlerts, setVitalSignsAlerts] = useState<string[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [suggestedMedications, setSuggestedMedications] = useState<MedicationSuggestion[]>([]);
  const [treatmentInstructions, setTreatmentInstructions] = useState<string>("");
  const [formCompletionPercentage, setFormCompletionPercentage] = useState(0);

  // Specialty forms state
  const [specialtyFormSearchQuery, setSpecialtyFormSearchQuery] = useState("");
  const [selectedSpecialtyForms, setSelectedSpecialtyForms] = useState<any[]>([]);
  const [specialtyFormData, setSpecialtyFormData] = useState<Record<number, Record<string, any>>>({});
  const [activeSpecialtyForm, setActiveSpecialtyForm] = useState<any | null>(null);
  const [specialtyFilterRole, setSpecialtyFilterRole] = useState<string>("all");

  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
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

  // Fetch available specialty consultation forms
  const { data: specialtyForms = [] } = useQuery<any[]>({
    queryKey: ["/api/consultation-forms"],
    enabled: !!open,
  });

  // Filter specialty forms
  const filteredSpecialtyForms = specialtyForms.filter((form: any) => {
    const matchesSearch =
      form.name.toLowerCase().includes(specialtyFormSearchQuery.toLowerCase()) ||
      form.description?.toLowerCase().includes(specialtyFormSearchQuery.toLowerCase());
    const matchesRole = specialtyFilterRole === "all" || form.specialistRole === specialtyFilterRole;
    return matchesSearch && matchesRole && form.isActive;
  });

  // Get unique specialist roles from forms
  const availableSpecialistRoles = Array.from(new Set(specialtyForms.map((f: any) => f.specialistRole).filter(Boolean)));

  const patientName =
    patient && typeof patient === "object" && "firstName" in patient && "lastName" in patient
      ? formatPatientName(patient as { firstName: string; lastName: string; title?: string | null })
      : "Patient";

  // Calculate BMI
  const calculateBMI = useCallback((weight: string, height: string) => {
    const weightNum = Number.parseFloat(weight);
    const heightNum = Number.parseFloat(height);

    if (weightNum > 0 && heightNum > 0) {
      const heightInMeters = heightNum / 100;
      const calculatedBMI = weightNum / (heightInMeters * heightInMeters);
      setBmi(Math.round(calculatedBMI * 10) / 10);
      return calculatedBMI;
    }
    setBmi(null);
    return null;
  }, []);

  // Validate vital signs
  const validateVitalSigns = useCallback((formData: Partial<ConsultationFormData>) => {
    const alerts: string[] = [];

    if (formData.bloodPressure) {
      const bpMatch = /(\d+)\/(\d+)/.exec(formData.bloodPressure);
      if (bpMatch) {
        const systolic = Number.parseInt(bpMatch[1], 10);
        const diastolic = Number.parseInt(bpMatch[2], 10);
        if (systolic > 140 || diastolic > 90) {
          alerts.push("⚠️ Elevated blood pressure detected");
        } else if (systolic < 90 || diastolic < 60) {
          alerts.push("⚠️ Low blood pressure detected");
        }
      }
    }

    if (formData.heartRate) {
      const hr = Number.parseInt(formData.heartRate, 10);
      if (hr > 100) alerts.push("⚠️ Tachycardia detected (HR > 100)");
      else if (hr < 60) alerts.push("⚠️ Bradycardia detected (HR < 60)");
    }

    if (formData.temperature) {
      const temp = Number.parseFloat(formData.temperature);
      if (temp > 38) alerts.push("🌡️ Fever detected (>38°C)");
      else if (temp < 36) alerts.push("🌡️ Low temperature detected (<36°C)");
    }

    if (formData.oxygenSaturation) {
      const spo2 = Number.parseInt(formData.oxygenSaturation, 10);
      if (spo2 < 95) alerts.push("⚠️ Low oxygen saturation (<95%)");
    }

    if (formData.respiratoryRate) {
      const rr = Number.parseInt(formData.respiratoryRate, 10);
      if (rr > 20) alerts.push("⚠️ Elevated respiratory rate (>20)");
      else if (rr < 12) alerts.push("⚠️ Low respiratory rate (<12)");
    }

    setVitalSignsAlerts(alerts);
  }, []);

  // Calculate form completion percentage
  const calculateCompletion = useCallback(() => {
    const values = form.getValues();
    const fields = Object.keys(values);
    const filledFields = fields.filter((key) => {
      const value = values[key as keyof ConsultationFormData];
      return value && value.toString().trim() !== "";
    });

    const percentage = Math.round((filledFields.length / fields.length) * 100);
    setFormCompletionPercentage(percentage);
  }, [form]);

  // Watch form changes
  useEffect(() => {
    if (!open) return;

    const subscription = form.watch((value) => {
      validateVitalSigns(value);
      calculateCompletion();

      if (value.weight && value.height) {
        calculateBMI(value.weight, value.height);
      }

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

    return () => subscription.unsubscribe();
  }, [open, form, validateVitalSigns, calculateBMI, calculateCompletion]);

  // Apply template
  const applyTemplate = (template: VisitTemplate) => {
    form.setValue("visitType", template.visitType || "consultation");
    if (template.chiefComplaint) form.setValue("chiefComplaint", template.chiefComplaint);
    if (template.historyOfPresentIllness) form.setValue("historyOfPresentIllness", template.historyOfPresentIllness);
    if (template.generalAppearance) form.setValue("generalAppearance", template.generalAppearance);
    if (template.cardiovascularSystem) form.setValue("cardiovascularSystem", template.cardiovascularSystem);
    if (template.respiratorySystem) form.setValue("respiratorySystem", template.respiratorySystem);
    if (template.gastrointestinalSystem) form.setValue("gastrointestinalSystem", template.gastrointestinalSystem);
    if (template.neurologicalSystem) form.setValue("neurologicalSystem", template.neurologicalSystem);
    if (template.musculoskeletalSystem) form.setValue("musculoskeletalSystem", template.musculoskeletalSystem);
    if (template.assessment) form.setValue("assessment", template.assessment);
    if (template.diagnosis) form.setValue("diagnosis", template.diagnosis);
    if (template.treatmentPlan) form.setValue("treatmentPlan", template.treatmentPlan);
    if (template.patientInstructions) form.setValue("patientInstructions", template.patientInstructions);
    if (template.followUpInstructions) form.setValue("followUpInstructions", template.followUpInstructions);

    setShowTemplateDialog(false);
    toast({
      title: "✨ Template Applied",
      description: `${template.name} template has been applied successfully.`,
    });
  };

  // Submit visit
  const submitVisit = useMutation({
    mutationFn: async (data: ConsultationFormData) => {
      // Build specialty assessments data
      const specialtyAssessments = selectedSpecialtyForms.map(form => ({
        formId: form.id,
        formName: form.name,
        specialistRole: form.specialistRole,
        data: specialtyFormData[form.id] || {}
      }));

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
        medications: medicationList.join(", "),
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
          specialtyAssessments: specialtyAssessments.length > 0 ? specialtyAssessments : undefined,
        }),
      };

      const response = await apiRequest(`/api/patients/${patientId}/visits`, "POST", visitData);
      const visitResult = await response.json();

      // Also save specialty forms as separate consultation records
      if (specialtyAssessments.length > 0 && visitResult.id) {
        for (const assessment of specialtyAssessments) {
          try {
            await apiRequest(`/api/patients/${patientId}/consultation-records`, "POST", {
              formId: assessment.formId,
              patientId,
              visitId: visitResult.id,
              data: assessment.data,
            });
          } catch (error) {
            console.error('Error saving specialty form:', error);
          }
        }
      }

      return visitResult;
    },
    onSuccess: () => {
      toast({
        title: "✅ Visit Recorded Successfully",
        description: selectedSpecialtyForms.length > 0
          ? `Patient consultation saved with ${selectedSpecialtyForms.length} specialty assessment(s).`
          : "Patient consultation has been saved to the medical record.",
      });

      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/visits`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/activity-trail`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/consultation-records`] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });

      form.reset();
      setMedicationList([]);
      setBmi(null);
      setVitalSignsAlerts([]);
      setCurrentStep(1);
      setSelectedSpecialtyForms([]);
      setSpecialtyFormData({});
      setActiveSpecialtyForm(null);

      if (onSave) onSave();
      if (onOpenChange) onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to record visit",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: ConsultationFormData) => {
    setIsSubmitting(true);
    submitVisit.mutate(data);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  const filteredTemplates =
    selectedCategory === "All"
      ? visitTemplates
      : visitTemplates.filter((t) => t.category === selectedCategory);

  const categories = ["All", ...getAllCategories()];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <div>Modern Consultation Wizard</div>
                <DialogDescription className="text-base mt-1">
                  Patient: {patientName}
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-gray-500">
                Form {formCompletionPercentage}% complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />

            {/* Step Indicators */}
            <div className="flex justify-between">
              {STEPS.map((step) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex flex-col items-center gap-1 transition-all ${isActive
                      ? "text-blue-600"
                      : isCompleted
                        ? "text-green-600"
                        : "text-gray-400"
                      }`}
                  >
                    <div
                      className={`p-2 rounded-full ${isActive
                        ? "bg-blue-100 ring-2 ring-blue-500"
                        : isCompleted
                          ? "bg-green-100"
                          : "bg-gray-100"
                        }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs font-medium hidden sm:block">{step.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateDialog(true)}
              className="flex-1"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Use Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allValues = form.getValues();
                navigator.clipboard.writeText(JSON.stringify(allValues, null, 2));
                toast({ title: "Copied to clipboard" });
              }}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Data
            </Button>
          </div>

          {/* Alerts */}
          {vitalSignsAlerts.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900 mb-2">Clinical Alerts</h4>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    {vitalSignsAlerts.map((alert, index) => (
                      <li key={index}>{alert}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {bmi !== null && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Weight className="h-5 w-5 text-blue-600" />
                <div>
                  <span className="font-semibold text-blue-900">BMI: {bmi}</span>
                  <span className="ml-2 text-sm text-blue-700">
                    ({bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese"})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Content */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Complaint & History */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Chief Complaint & History
                    </CardTitle>
                    <CardDescription>
                      Document the patient's main complaint and clinical history
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="visitType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visit Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                      name="chiefComplaint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-500" />
                            Chief Complaint *
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Patient's main complaint or reason for visit..."
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Brief description of the main reason for the visit
                          </FormDescription>
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
                              {...field}
                              placeholder="Detailed history of the current condition..."
                              className="min-h-[120px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Chronological account of symptoms, onset, duration, and progression
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Vital Signs */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Vital Signs
                    </CardTitle>
                    <CardDescription>
                      Record patient's vital signs and measurements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="bloodPressure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Blood Pressure</FormLabel>
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
                              <Input {...field} placeholder="72" type="number" />
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
                              <Input {...field} placeholder="36.5" type="number" step="0.1" />
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
                              <Input {...field} placeholder="70" type="number" step="0.1" />
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
                              <Input {...field} placeholder="170" type="number" />
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
                              <Input {...field} placeholder="16" type="number" />
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
                            <FormLabel>O₂ Saturation (%)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="98" type="number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Physical Examination */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-purple-500" />
                      Physical Examination
                    </CardTitle>
                    <CardDescription>
                      Document findings from the physical examination
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="generalAppearance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>General Appearance</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Patient appears..." rows={3} />
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
                              <Textarea {...field} placeholder="Heart sounds, rhythm..." rows={3} />
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
                              <Textarea {...field} placeholder="Breath sounds..." rows={3} />
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
                              <Textarea {...field} placeholder="Abdomen examination..." rows={3} />
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
                              <Textarea {...field} placeholder="Mental status, reflexes..." rows={3} />
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
                              <Textarea {...field} placeholder="Range of motion, strength..." rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Assessment & Plan */}
              {currentStep === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-green-500" />
                      Assessment & Diagnosis
                    </CardTitle>
                    <CardDescription>
                      Clinical assessment and diagnosis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="assessment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clinical Assessment</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Clinical assessment and interpretation..."
                              rows={4}
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
                              Primary Diagnosis *
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Primary diagnosis..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="secondaryDiagnoses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary Diagnoses</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Additional diagnoses..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="treatmentPlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treatment Plan *</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Detailed treatment plan..."
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Smart Medication Suggestions */}
                    {suggestedMedications.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold text-green-900">
                            Smart Medication Suggestions
                          </h4>
                        </div>

                        {treatmentInstructions && (
                          <div className="mb-3 p-3 bg-green-100 rounded text-sm text-green-800">
                            <strong>Clinical Note:</strong> {treatmentInstructions}
                          </div>
                        )}

                        <div className="grid gap-2">
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
                                        title: "✅ Medication Added",
                                        description: `${med.name} added to prescription list.`,
                                      });
                                    }
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 5: Specialty Forms */}
              {currentStep === 5 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSearch className="h-5 w-5 text-purple-500" />
                      Specialty Assessment Forms
                    </CardTitle>
                    <CardDescription>
                      Add specialist-specific assessments from custom forms (optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search specialist forms..."
                          value={specialtyFormSearchQuery}
                          onChange={(e) => setSpecialtyFormSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={specialtyFilterRole} onValueChange={setSpecialtyFilterRole}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Filter by specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Specialties</SelectItem>
                          {availableSpecialistRoles.map((role: string) => (
                            <SelectItem key={role} value={role}>
                              {role.replaceAll('_', ' ').replaceAll(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Selected Forms Display */}
                    {selectedSpecialtyForms.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Selected Specialty Forms ({selectedSpecialtyForms.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedSpecialtyForms.map((form: any) => (
                            <div key={form.id} className="flex items-center justify-between bg-white p-3 rounded border">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{form.name}</div>
                                <div className="text-xs text-gray-500">{form.specialistRole?.replaceAll('_', ' ')}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                {specialtyFormData[form.id] && Object.keys(specialtyFormData[form.id]).length > 0 && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Data entered
                                  </Badge>
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setActiveSpecialtyForm(form)}
                                >
                                  {specialtyFormData[form.id] ? "Edit" : "Fill"}
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSpecialtyForms(prev => prev.filter(f => f.id !== form.id));
                                    setSpecialtyFormData(prev => {
                                      const newData = { ...prev };
                                      delete newData[form.id];
                                      return newData;
                                    });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active Form Filling */}
                    {activeSpecialtyForm && (
                      <Card className="border-2 border-purple-400">
                        <CardHeader className="bg-purple-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{activeSpecialtyForm.name}</CardTitle>
                              <CardDescription>{activeSpecialtyForm.description}</CardDescription>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveSpecialtyForm(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-4">
                            {activeSpecialtyForm.formStructure?.fields?.map((field: any) => (
                              <div key={field.id} className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {field.type === 'textarea' ? (
                                  <Textarea
                                    placeholder={field.placeholder}
                                    value={specialtyFormData[activeSpecialtyForm.id]?.[field.id] || ''}
                                    onChange={(e) => {
                                      setSpecialtyFormData(prev => ({
                                        ...prev,
                                        [activeSpecialtyForm.id]: {
                                          ...prev[activeSpecialtyForm.id],
                                          [field.id]: e.target.value
                                        }
                                      }));
                                    }}
                                    rows={3}
                                  />
                                ) : field.type === 'select' ? (
                                  <Select
                                    value={specialtyFormData[activeSpecialtyForm.id]?.[field.id] || ''}
                                    onValueChange={(value) => {
                                      setSpecialtyFormData(prev => ({
                                        ...prev,
                                        [activeSpecialtyForm.id]: {
                                          ...prev[activeSpecialtyForm.id],
                                          [field.id]: value
                                        }
                                      }));
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={field.placeholder || "Select..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {field.options?.map((option: string) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : field.type === 'checkbox' ? (
                                  <div className="grid grid-cols-2 gap-2">
                                    {field.options?.map((option: string) => (
                                      <div key={option} className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id={`${field.id}_${option}`}
                                          checked={specialtyFormData[activeSpecialtyForm.id]?.[field.id]?.includes(option) || false}
                                          onChange={(e) => {
                                            const currentValues = specialtyFormData[activeSpecialtyForm.id]?.[field.id] || [];
                                            const newValues = e.target.checked
                                              ? [...currentValues, option]
                                              : currentValues.filter((v: string) => v !== option);
                                            setSpecialtyFormData(prev => ({
                                              ...prev,
                                              [activeSpecialtyForm.id]: {
                                                ...prev[activeSpecialtyForm.id],
                                                [field.id]: newValues
                                              }
                                            }));
                                          }}
                                          className="rounded border-gray-300"
                                        />
                                        <label htmlFor={`${field.id}_${option}`} className="text-sm">{option}</label>
                                      </div>
                                    ))}
                                  </div>
                                ) : field.type === 'number' ? (
                                  <Input
                                    type="number"
                                    placeholder={field.placeholder}
                                    value={specialtyFormData[activeSpecialtyForm.id]?.[field.id] || ''}
                                    onChange={(e) => {
                                      setSpecialtyFormData(prev => ({
                                        ...prev,
                                        [activeSpecialtyForm.id]: {
                                          ...prev[activeSpecialtyForm.id],
                                          [field.id]: e.target.value
                                        }
                                      }));
                                    }}
                                    min={field.validation?.min}
                                    max={field.validation?.max}
                                  />
                                ) : (
                                  <Input
                                    type={field.type === 'date' ? 'date' : 'text'}
                                    placeholder={field.placeholder}
                                    value={specialtyFormData[activeSpecialtyForm.id]?.[field.id] || ''}
                                    onChange={(e) => {
                                      setSpecialtyFormData(prev => ({
                                        ...prev,
                                        [activeSpecialtyForm.id]: {
                                          ...prev[activeSpecialtyForm.id],
                                          [field.id]: e.target.value
                                        }
                                      }));
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex justify-end">
                            <Button
                              type="button"
                              onClick={() => {
                                toast({
                                  title: "✅ Form Data Saved",
                                  description: `${activeSpecialtyForm.name} data has been captured.`,
                                });
                                setActiveSpecialtyForm(null);
                              }}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Form Data
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Available Forms List */}
                    {!activeSpecialtyForm && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">Available Specialist Forms</h4>
                        {filteredSpecialtyForms.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <FileSearch className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No specialty forms found</p>
                            <p className="text-sm">Create forms in the Form Builder to use them here</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                            {filteredSpecialtyForms.map((form: any) => {
                              const isSelected = selectedSpecialtyForms.some(f => f.id === form.id);
                              const handleFormToggle = () => {
                                if (isSelected) {
                                  setSelectedSpecialtyForms(prev => prev.filter(f => f.id !== form.id));
                                } else {
                                  setSelectedSpecialtyForms(prev => [...prev, form]);
                                }
                              };
                              return (
                                <button
                                  type="button"
                                  key={form.id}
                                  className={`p-3 rounded-lg border transition-all cursor-pointer text-left w-full ${isSelected
                                    ? 'border-purple-400 bg-purple-50'
                                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                    }`}
                                  onClick={handleFormToggle}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">{form.name}</h5>
                                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{form.description}</p>
                                      <Badge variant="secondary" className="mt-2 text-xs">
                                        {form.specialistRole?.replaceAll('_', ' ')}
                                      </Badge>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                                      }`}>
                                      {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Info Message */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Tip:</strong> Select specialty forms to add detailed specialist assessments
                          to this consultation. The form data will be saved alongside the visit record.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 6: Medications & Follow-up */}
              {currentStep === 6 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-blue-500" />
                      Medications & Follow-up
                    </CardTitle>
                    <CardDescription>
                      Prescribe medications and schedule follow-up
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <GlobalMedicationSearch
                      selectedMedications={medicationList}
                      onMedicationsChange={setMedicationList}
                      label="Medications"
                      placeholder="Search and add medications..."
                      allowCustomMedications={true}
                    />

                    <FormField
                      control={form.control}
                      name="patientInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Instructions</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Instructions for patient care at home..."
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
                        name="followUpDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Follow-up Date</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
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
                              <Input {...field} placeholder="When to return..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="additionalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Any additional observations..."
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentStep < STEPS.length ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Saving..." : "Save Consultation"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
              Select a Template
            </DialogTitle>
            <DialogDescription>
              Choose a pre-configured template to quickly fill common consultation types
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
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
              {filteredTemplates.map((template) => (
                <button
                  type="button"
                  key={template.id}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer text-left w-full"
                  onClick={() => applyTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <Badge variant="secondary" className="mt-2">
                        {template.category}
                      </Badge>
                    </div>
                    <Zap className="h-5 w-5 text-purple-500 flex-shrink-0 ml-2" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

