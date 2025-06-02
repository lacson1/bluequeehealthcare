import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  Activity,
  Clipboard,
  Eye,
  Pill,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  TrendingUp,
  Monitor,
  Zap,
  Target,
  Database,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const comprehensiveVisitSchema = z.object({
  visitType: z.string().min(1, "Visit type is required"),
  chiefComplaint: z.string().min(1, "Chief complaint is required"),
  historyOfPresentIllness: z.string().default(""),
  
  // Vital Signs with validation
  bloodPressure: z.string().default(""),
  heartRate: z.string().default(""),
  temperature: z.string().default(""),
  weight: z.string().default(""),
  height: z.string().default(""),
  respiratoryRate: z.string().default(""),
  oxygenSaturation: z.string().default(""),
  
  // Enhanced Physical Examination
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
  additionalNotes: z.string().default(""),
});

type VisitFormData = z.infer<typeof comprehensiveVisitSchema>;

interface EnhancedVisitRecordingV2Props {
  patientId: number;
  onSave?: () => void;
}

export function EnhancedVisitRecordingV2({ patientId, onSave }: EnhancedVisitRecordingV2Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [additionalDiagnoses, setAdditionalDiagnoses] = useState<string[]>([]);
  const [medicationList, setMedicationList] = useState<string[]>([]);
  const [vitalSignsAlerts, setVitalSignsAlerts] = useState<string[]>([]);

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

  // Fetch staff data for doctor selection
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
  });

  const patientName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || "Patient" : "Patient";

  // Vital signs validation and alerts
  const checkVitalSigns = () => {
    const alerts: string[] = [];
    const bp = form.getValues("bloodPressure");
    const hr = form.getValues("heartRate");
    const temp = form.getValues("temperature");
    const spo2 = form.getValues("oxygenSaturation");

    if (bp) {
      const [systolic, diastolic] = bp.split('/').map(n => parseInt(n));
      if (systolic > 140 || diastolic > 90) alerts.push("Hypertension detected");
      if (systolic < 90 || diastolic < 60) alerts.push("Hypotension detected");
    }

    if (hr) {
      const heartRate = parseInt(hr);
      if (heartRate > 100) alerts.push("Tachycardia detected");
      if (heartRate < 60) alerts.push("Bradycardia detected");
    }

    if (temp) {
      const temperature = parseFloat(temp);
      if (temperature > 37.5) alerts.push("Fever detected");
      if (temperature < 35) alerts.push("Hypothermia detected");
    }

    if (spo2) {
      const saturation = parseInt(spo2);
      if (saturation < 95) alerts.push("Low oxygen saturation");
    }

    setVitalSignsAlerts(alerts);
  };

  // Calculate form completion percentage
  const formCompletionPercentage = useMemo(() => {
    const values = form.getValues();
    const totalFields = Object.keys(values).length;
    const filledFields = Object.values(values).filter(value => value && value.toString().trim() !== "").length;
    return Math.round((filledFields / totalFields) * 100);
  }, [form.watch()]);

  const submitVisit = useMutation({
    mutationFn: async (data: VisitFormData) => {
      const visitData = {
        patientId,
        ...data,
        secondaryDiagnoses: additionalDiagnoses.join(", "),
        medications: medicationList.join(", "),
        status: "completed",
        doctorId: Array.isArray(staff) ? staff.find((s: any) => s.role === "doctor")?.id || 1 : 1,
      };

      const response = await apiRequest("POST", `/api/patients/${patientId}/visits`, visitData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Visit Recorded Successfully",
        description: "Patient visit has been documented and saved to medical records.",
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/visits`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/activity-trail`] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      
      form.reset();
      setAdditionalDiagnoses([]);
      setMedicationList([]);
      setCurrentStep(0);
      
      if (onSave) onSave();
    },
    onError: (error: any) => {
      toast({
        title: "Error Recording Visit",
        description: error.message || "Failed to record visit. Please try again.",
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
    }
  };

  const removeMedication = (medication: string) => {
    setMedicationList(medicationList.filter(m => m !== medication));
  };

  const steps = [
    { id: 0, title: "Visit Info", icon: FileText, description: "Basic visit information" },
    { id: 1, title: "Vital Signs", icon: Heart, description: "Patient vital measurements" },
    { id: 2, title: "Examination", icon: Stethoscope, description: "Physical examination findings" },
    { id: 3, title: "Assessment", icon: Clipboard, description: "Diagnosis and treatment plan" },
    { id: 4, title: "Review", icon: CheckCircle2, description: "Final review and submission" }
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Patient Info */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Stethoscope className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Visit Recording Session</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient: {patientName}
                  <Calendar className="h-4 w-4 ml-4" />
                  {new Date().toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Form Completion</div>
              <div className="flex items-center gap-2">
                <Progress value={formCompletionPercentage} className="w-20" />
                <span className="text-sm font-medium">{formCompletionPercentage}%</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-2 ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`p-2 rounded-full ${currentStep >= step.id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <step.icon className="h-4 w-4" />
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 mx-4 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vital Signs Alerts */}
      {vitalSignsAlerts.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Vital Signs Alert</AlertTitle>
          <AlertDescription className="text-amber-700">
            <ul className="list-disc list-inside space-y-1">
              {vitalSignsAlerts.map((alert, index) => (
                <li key={index}>{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Form with Tabs */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={currentStep.toString()} onValueChange={(value) => setCurrentStep(parseInt(value))}>
            <TabsList className="grid w-full grid-cols-5">
              {steps.map((step) => (
                <TabsTrigger key={step.id} value={step.id.toString()} className="flex items-center gap-2">
                  <step.icon className="h-4 w-4" />
                  <span className="hidden sm:block">{step.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Step 0: Visit Information */}
            <TabsContent value="0" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Visit Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                              <SelectItem value="routine-check">Routine Check</SelectItem>
                              <SelectItem value="specialist-referral">Specialist Referral</SelectItem>
                            </SelectContent>
                          </Select>
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
                        <FormLabel>Chief Complaint</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What brings the patient in today? Main symptoms or concerns..."
                            className="min-h-[100px]"
                            {...field}
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
                            placeholder="Detailed history of the current condition, including onset, duration, severity, associated symptoms..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 1: Vital Signs */}
            <TabsContent value="1" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Vital Signs
                  </CardTitle>
                  <CardDescription>
                    Record patient's current vital measurements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="bloodPressure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            Blood Pressure
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="120/80" 
                              {...field} 
                              onBlur={() => checkVitalSigns()}
                            />
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
                          <FormLabel className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-pink-500" />
                            Heart Rate (bpm)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="72" 
                              {...field} 
                              onBlur={() => checkVitalSigns()}
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
                          <FormLabel className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-orange-500" />
                            Temperature (°C)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="36.5" 
                              {...field} 
                              onBlur={() => checkVitalSigns()}
                            />
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
                          <FormLabel className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-blue-500" />
                            SpO2 (%)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="98" 
                              {...field} 
                              onBlur={() => checkVitalSigns()}
                            />
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
                          <FormLabel className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-green-500" />
                            Respiratory Rate
                          </FormLabel>
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
                          <FormLabel className="flex items-center gap-2">
                            <Weight className="h-4 w-4 text-purple-500" />
                            Weight (kg)
                          </FormLabel>
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
                          <FormLabel className="flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-indigo-500" />
                            Height (cm)
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="170" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 2: Physical Examination */}
            <TabsContent value="2" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-blue-500" />
                    Physical Examination
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="generalAppearance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>General Appearance</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Patient's overall appearance, demeanor, and general condition..."
                              {...field}
                            />
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
                            <Textarea
                              placeholder="Heart sounds, rhythm, murmurs, peripheral pulses..."
                              {...field}
                            />
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
                            <Textarea
                              placeholder="Breath sounds, chest movement, respiratory effort..."
                              {...field}
                            />
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
                            <Textarea
                              placeholder="Abdominal examination, bowel sounds, tenderness..."
                              {...field}
                            />
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
                            <Textarea
                              placeholder="Mental status, reflexes, motor function, sensory examination..."
                              {...field}
                            />
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
                            <Textarea
                              placeholder="Joint examination, range of motion, muscle strength..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 3: Assessment & Plan */}
            <TabsContent value="3" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clipboard className="h-5 w-5 text-green-500" />
                    Assessment & Treatment Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="assessment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinical Assessment</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Clinical impression and analysis of findings..."
                            className="min-h-[100px]"
                            {...field}
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
                        <FormLabel>Primary Diagnosis</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Primary diagnosis (ICD-10 code if applicable)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Secondary Diagnoses */}
                  <div className="space-y-2">
                    <FormLabel>Secondary Diagnoses</FormLabel>
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="secondaryDiagnoses"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Add secondary diagnosis"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="button" onClick={addDiagnosis} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {additionalDiagnoses.length > 0 && (
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
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="treatmentPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Treatment Plan</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed treatment plan including interventions, procedures, lifestyle modifications..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Medications */}
                  <div className="space-y-2">
                    <FormLabel className="flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Medications Prescribed
                    </FormLabel>
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="medications"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Add medication (name, dosage, frequency)"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="button" onClick={() => addMedication()} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {medicationList.length > 0 && (
                      <div className="space-y-2">
                        {medicationList.map((medication, index) => (
                          <Badge key={index} variant="outline" className="flex items-center justify-between p-2">
                            <span>{medication}</span>
                            <X
                              className="h-3 w-3 cursor-pointer ml-2"
                              onClick={() => removeMedication(medication)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="patientInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Instructions</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Instructions for the patient regarding care, medications, activities..."
                              {...field}
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
                              placeholder="Follow-up care instructions, when to return, warning signs..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="followUpDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follow-up Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 4: Review & Submit */}
            <TabsContent value="4" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Review & Submit
                  </CardTitle>
                  <CardDescription>
                    Review all information before submitting the visit record
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Form Completion: {formCompletionPercentage}%</AlertTitle>
                    <AlertDescription>
                      Review all sections and ensure critical information is documented.
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={form.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional observations, notes, or comments..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Navigation and Submit */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>

                <div className="flex gap-2">
                  {currentStep < steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Saving Visit...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Visit Record
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}

export default EnhancedVisitRecordingV2;