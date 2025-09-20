import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Move, Save, Eye, Edit3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'number' | 'date' | 'time' | 'email' | 'phone';
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  section?: string;
  medicalCategory?: 'symptoms' | 'vitals' | 'history' | 'examination' | 'diagnosis' | 'treatment' | 'followup';
}

interface ConsultationForm {
  id: number;
  name: string;
  description: string;
  specialistRole: string;
  formStructure: {
    fields: FormField[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Medical field templates for quick form building
const MEDICAL_TEMPLATES = {
  symptoms: [
    { label: "Chief Complaint", type: "textarea", required: true, placeholder: "Patient's main concern or reason for visit" },
    { label: "Duration of Symptoms", type: "text", required: true, placeholder: "How long have symptoms been present?" },
    { label: "Pain Scale (1-10)", type: "number", required: false, validation: { min: 1, max: 10 } },
    { label: "Associated Symptoms", type: "checkbox", options: ["Fever", "Nausea", "Vomiting", "Headache", "Fatigue"] }
  ],
  vitals: [
    { label: "Blood Pressure", type: "text", required: true, placeholder: "120/80 mmHg", validation: { pattern: "\\d+/\\d+" } },
    { label: "Heart Rate", type: "number", required: true, placeholder: "bpm", validation: { min: 40, max: 200 } },
    { label: "Temperature", type: "number", required: true, placeholder: "°C", validation: { min: 35, max: 42 } },
    { label: "Weight", type: "number", required: false, placeholder: "kg", validation: { min: 1, max: 300 } }
  ],
  history: [
    { label: "Medical History", type: "textarea", required: false, placeholder: "Previous medical conditions, surgeries, hospitalizations" },
    { label: "Current Medications", type: "textarea", required: false, placeholder: "List all current medications and dosages" },
    { label: "Allergies", type: "textarea", required: false, placeholder: "Drug allergies, food allergies, environmental allergies" },
    { label: "Family History", type: "textarea", required: false, placeholder: "Relevant family medical history" }
  ],
  examination: [
    { label: "General Appearance", type: "select", options: ["Well-appearing", "Ill-appearing", "Distressed", "Alert", "Lethargic"] },
    { label: "Physical Examination Findings", type: "textarea", required: true, placeholder: "Detailed physical examination findings" },
    { label: "System Review", type: "checkbox", options: ["Cardiovascular", "Respiratory", "Neurological", "Gastrointestinal", "Musculoskeletal"] }
  ],
  diagnosis: [
    { label: "Primary Diagnosis", type: "text", required: true, placeholder: "Main diagnosis or working diagnosis" },
    { label: "Secondary Diagnoses", type: "textarea", required: false, placeholder: "Additional diagnoses or differential diagnoses" },
    { label: "ICD-10 Code", type: "text", required: false, placeholder: "ICD-10 diagnostic code" }
  ],
  treatment: [
    { label: "Treatment Plan", type: "textarea", required: true, placeholder: "Detailed treatment plan and interventions" },
    { label: "Prescribed Medications", type: "textarea", required: false, placeholder: "Medications prescribed with dosage and instructions" },
    { label: "Follow-up Instructions", type: "textarea", required: true, placeholder: "When and how patient should follow up" }
  ]
};

// Specialized Care Templates
const CARE_TEMPLATES = {
  diabetesManagement: {
    name: "Diabetes Management Assessment",
    description: "Comprehensive diabetes care template for routine monitoring and management",
    specialistRole: "Doctor/Nurse",
    fields: [
      // Patient Information
      { id: "dm_complaint", label: "Chief Complaint", type: "textarea", required: true, section: "Presenting Complaint", placeholder: "Main concern or reason for today's visit" },
      
      // Diabetes History
      { id: "dm_type", label: "Diabetes Type", type: "select", required: true, section: "Diabetes History", options: ["Type 1", "Type 2", "Gestational", "MODY", "Secondary"] },
      { id: "dm_duration", label: "Duration of Diabetes", type: "text", required: true, section: "Diabetes History", placeholder: "Years since diagnosis" },
      { id: "dm_last_hba1c", label: "Last HbA1c Result", type: "text", required: false, section: "Diabetes History", placeholder: "% and date" },
      { id: "dm_complications", label: "Known Complications", type: "checkbox", section: "Diabetes History", options: ["Retinopathy", "Nephropathy", "Neuropathy", "Cardiovascular Disease", "Foot Problems"] },
      
      // Current Management
      { id: "dm_current_meds", label: "Current Diabetes Medications", type: "textarea", required: true, section: "Current Management", placeholder: "Include insulin, oral medications, doses, and frequency" },
      { id: "dm_glucose_monitoring", label: "Blood Glucose Monitoring", type: "select", required: true, section: "Current Management", options: ["Self-monitoring daily", "Self-monitoring weekly", "CGM", "Flash glucose monitoring", "Not monitoring"] },
      { id: "dm_recent_readings", label: "Recent Glucose Readings", type: "textarea", required: false, section: "Current Management", placeholder: "Fasting, pre/post meal readings if available" },
      
      // Physical Assessment
      { id: "dm_weight", label: "Weight (kg)", type: "number", required: true, section: "Physical Assessment", validation: { min: 20, max: 200 } },
      { id: "dm_bmi", label: "BMI", type: "number", required: false, section: "Physical Assessment", validation: { min: 10, max: 60 } },
      { id: "dm_bp", label: "Blood Pressure", type: "text", required: true, section: "Physical Assessment", placeholder: "mmHg" },
      { id: "dm_foot_exam", label: "Foot Examination", type: "select", required: true, section: "Physical Assessment", options: ["Normal", "Calluses", "Ulcers", "Infection", "Deformity", "Reduced sensation"] },
      
      // Lifestyle Assessment
      { id: "dm_diet_adherence", label: "Diet Adherence", type: "select", required: true, section: "Lifestyle", options: ["Excellent", "Good", "Fair", "Poor"] },
      { id: "dm_exercise", label: "Exercise Level", type: "select", required: true, section: "Lifestyle", options: ["Regular (>150min/week)", "Moderate (60-150min/week)", "Light (<60min/week)", "Sedentary"] },
      { id: "dm_smoking", label: "Smoking Status", type: "select", required: true, section: "Lifestyle", options: ["Never", "Former", "Current"] },
      
      // Plan and Follow-up
      { id: "dm_treatment_plan", label: "Treatment Plan", type: "textarea", required: true, section: "Management Plan", placeholder: "Medication adjustments, lifestyle recommendations, referrals" },
      { id: "dm_education_provided", label: "Education Topics Covered", type: "checkbox", section: "Management Plan", options: ["Blood glucose monitoring", "Medication adherence", "Dietary advice", "Exercise recommendations", "Foot care", "Hypoglycemia management"] },
      { id: "dm_next_review", label: "Next Review", type: "date", required: true, section: "Management Plan" },
      { id: "dm_lab_requests", label: "Laboratory Requests", type: "checkbox", section: "Management Plan", options: ["HbA1c", "Lipid profile", "Kidney function", "Liver function", "Urinalysis"] }
    ]
  },
  
  weightManagement: {
    name: "Weight Management Assessment",
    description: "Comprehensive weight management template for obesity and weight-related health issues",
    specialistRole: "Doctor/Nurse",
    fields: [
      // Initial Assessment
      { id: "wm_complaint", label: "Chief Complaint", type: "textarea", required: true, section: "Presenting Complaint", placeholder: "Weight-related concerns or goals" },
      { id: "wm_goal", label: "Weight Management Goal", type: "select", required: true, section: "Assessment", options: ["Weight loss", "Weight gain", "Weight maintenance", "Body composition improvement"] },
      
      // Anthropometric Measurements
      { id: "wm_current_weight", label: "Current Weight (kg)", type: "number", required: true, section: "Measurements", validation: { min: 20, max: 300 } },
      { id: "wm_height", label: "Height (cm)", type: "number", required: true, section: "Measurements", validation: { min: 100, max: 250 } },
      { id: "wm_bmi", label: "BMI", type: "number", required: false, section: "Measurements", validation: { min: 10, max: 80 } },
      { id: "wm_waist_circumference", label: "Waist Circumference (cm)", type: "number", required: false, section: "Measurements", validation: { min: 50, max: 200 } },
      { id: "wm_weight_history", label: "Weight History", type: "textarea", required: false, section: "Measurements", placeholder: "Previous weights, weight loss attempts, patterns" },
      
      // Medical History
      { id: "wm_comorbidities", label: "Weight-Related Comorbidities", type: "checkbox", section: "Medical History", options: ["Type 2 Diabetes", "Hypertension", "Sleep Apnea", "PCOS", "Dyslipidemia", "Osteoarthritis", "GERD"] },
      { id: "wm_medications", label: "Current Medications", type: "textarea", required: false, section: "Medical History", placeholder: "Include any medications that may affect weight" },
      { id: "wm_previous_attempts", label: "Previous Weight Loss Attempts", type: "textarea", required: false, section: "Medical History", placeholder: "Diets tried, medications, surgery, outcomes" },
      
      // Lifestyle Assessment
      { id: "wm_diet_pattern", label: "Current Diet Pattern", type: "select", required: true, section: "Lifestyle", options: ["Balanced diet", "High carbohydrate", "High fat", "High protein", "Irregular eating", "Emotional eating"] },
      { id: "wm_meal_frequency", label: "Meal Frequency", type: "select", required: true, section: "Lifestyle", options: ["3 regular meals", "3 meals + snacks", "2 meals/day", "Irregular", "Frequent snacking"] },
      { id: "wm_exercise_current", label: "Current Exercise Level", type: "select", required: true, section: "Lifestyle", options: ["No exercise", "Light activity (<1hr/week)", "Moderate activity (1-3hrs/week)", "Regular exercise (>3hrs/week)", "High intensity training"] },
      { id: "wm_sleep_quality", label: "Sleep Quality", type: "select", required: true, section: "Lifestyle", options: ["Excellent (7-9hrs)", "Good (6-7hrs)", "Fair (5-6hrs)", "Poor (<5hrs)", "Sleep disorders"] },
      
      // Psychological Assessment
      { id: "wm_motivation_level", label: "Motivation Level", type: "select", required: true, section: "Psychological", options: ["Very high", "High", "Moderate", "Low", "Very low"] },
      { id: "wm_eating_behaviors", label: "Eating Behaviors", type: "checkbox", section: "Psychological", options: ["Emotional eating", "Binge eating", "Night eating", "Stress eating", "Social eating", "Mindful eating"] },
      { id: "wm_support_system", label: "Support System", type: "select", required: true, section: "Psychological", options: ["Strong family support", "Some support", "Limited support", "No support", "Negative influences"] },
      
      // Management Plan
      { id: "wm_calorie_target", label: "Recommended Calorie Target", type: "text", required: false, section: "Management Plan", placeholder: "Daily calorie goal" },
      { id: "wm_diet_plan", label: "Dietary Recommendations", type: "textarea", required: true, section: "Management Plan", placeholder: "Specific dietary plan and recommendations" },
      { id: "wm_exercise_plan", label: "Exercise Prescription", type: "textarea", required: true, section: "Management Plan", placeholder: "Type, frequency, duration, intensity of recommended exercise" },
      { id: "wm_behavioral_strategies", label: "Behavioral Strategies", type: "checkbox", section: "Management Plan", options: ["Food diary", "Portion control", "Meal planning", "Stress management", "Sleep hygiene", "Regular weigh-ins"] },
      { id: "wm_followup_schedule", label: "Follow-up Schedule", type: "select", required: true, section: "Management Plan", options: ["Weekly", "Bi-weekly", "Monthly", "3 months", "6 months"] },
      { id: "wm_target_weight_loss", label: "Target Weight Loss", type: "text", required: false, section: "Management Plan", placeholder: "kg per week/month" }
    ]
  },
  
  elderlycare: {
    name: "Elderly Care Assessment",
    description: "Comprehensive geriatric assessment template for elderly patients",
    specialistRole: "Doctor/Nurse",
    fields: [
      // Basic Information
      { id: "ec_complaint", label: "Chief Complaint", type: "textarea", required: true, section: "Presenting Complaint", placeholder: "Main concerns or reason for visit" },
      { id: "ec_informant", label: "Information Source", type: "select", required: true, section: "Assessment", options: ["Patient", "Family member", "Caregiver", "Healthcare provider", "Mixed sources"] },
      
      // Functional Assessment
      { id: "ec_activities_daily_living", label: "Activities of Daily Living", type: "checkbox", section: "Functional Status", options: ["Independent bathing", "Independent dressing", "Independent toileting", "Independent feeding", "Independent mobility", "Independent continence"] },
      { id: "ec_instrumental_adl", label: "Instrumental ADLs", type: "checkbox", section: "Functional Status", options: ["Cooking", "Shopping", "Managing finances", "Using telephone", "Taking medications", "Transportation"] },
      { id: "ec_mobility_status", label: "Mobility Status", type: "select", required: true, section: "Functional Status", options: ["Independent", "Uses walking stick", "Uses walker", "Uses wheelchair", "Bedbound", "Requires assistance"] },
      { id: "ec_fall_history", label: "Fall History", type: "select", required: true, section: "Functional Status", options: ["No falls", "1 fall in past year", "2-3 falls in past year", ">3 falls in past year", "Recent fall"] },
      
      // Cognitive Assessment
      { id: "ec_cognitive_status", label: "Cognitive Status", type: "select", required: true, section: "Cognitive Assessment", options: ["Normal", "Mild cognitive impairment", "Moderate impairment", "Severe impairment", "Dementia diagnosed"] },
      { id: "ec_memory_concerns", label: "Memory Concerns", type: "checkbox", section: "Cognitive Assessment", options: ["Recent memory loss", "Difficulty with names", "Gets lost in familiar places", "Trouble with complex tasks", "Personality changes"] },
      { id: "ec_orientation", label: "Orientation", type: "checkbox", section: "Cognitive Assessment", options: ["Oriented to time", "Oriented to place", "Oriented to person", "Oriented to situation"] },
      
      // Nutrition and Hydration
      { id: "ec_nutritional_status", label: "Nutritional Status", type: "select", required: true, section: "Nutrition", options: ["Well-nourished", "At risk of malnutrition", "Malnourished", "Overweight", "Obese"] },
      { id: "ec_weight_change", label: "Recent Weight Change", type: "select", required: true, section: "Nutrition", options: ["Stable", "Unintentional weight loss", "Unintentional weight gain", "Intentional weight loss"] },
      { id: "ec_appetite", label: "Appetite", type: "select", required: true, section: "Nutrition", options: ["Good", "Fair", "Poor", "Variable"] },
      { id: "ec_swallowing", label: "Swallowing", type: "select", required: true, section: "Nutrition", options: ["Normal", "Difficulty with liquids", "Difficulty with solids", "Choking episodes", "Modified diet required"] },
      
      // Medication Management
      { id: "ec_medication_count", label: "Number of Regular Medications", type: "number", required: true, section: "Medications", validation: { min: 0, max: 50 } },
      { id: "ec_medication_adherence", label: "Medication Adherence", type: "select", required: true, section: "Medications", options: ["Excellent", "Good", "Fair", "Poor", "Unable to manage"] },
      { id: "ec_medication_management", label: "Medication Management", type: "select", required: true, section: "Medications", options: ["Self-managed", "Family assistance", "Caregiver managed", "Pharmacy packaging", "Unable to manage"] },
      { id: "ec_adverse_effects", label: "Potential Adverse Drug Effects", type: "checkbox", section: "Medications", options: ["Dizziness", "Confusion", "Sedation", "GI upset", "Falls", "None observed"] },
      
      // Social Assessment
      { id: "ec_living_situation", label: "Living Situation", type: "select", required: true, section: "Social", options: ["Lives alone", "Lives with spouse", "Lives with family", "Assisted living", "Nursing home", "Homeless"] },
      { id: "ec_social_support", label: "Social Support", type: "select", required: true, section: "Social", options: ["Strong support network", "Moderate support", "Limited support", "Isolated", "No support"] },
      { id: "ec_caregiver_stress", label: "Caregiver Stress Level", type: "select", required: false, section: "Social", options: ["None", "Mild", "Moderate", "High", "Severe", "No caregiver"] },
      
      // Mental Health
      { id: "ec_mood", label: "Mood Assessment", type: "select", required: true, section: "Mental Health", options: ["Normal mood", "Mild depression", "Moderate depression", "Severe depression", "Anxiety", "Mixed"] },
      { id: "ec_depression_screening", label: "Depression Symptoms", type: "checkbox", section: "Mental Health", options: ["Low mood", "Loss of interest", "Sleep disturbance", "Appetite changes", "Fatigue", "Hopelessness"] },
      { id: "ec_behavioral_issues", label: "Behavioral Issues", type: "checkbox", section: "Mental Health", options: ["Agitation", "Wandering", "Sundowning", "Aggression", "Withdrawal", "None"] },
      
      // Safety Assessment
      { id: "ec_home_safety", label: "Home Safety Concerns", type: "checkbox", section: "Safety", options: ["Stairs without rails", "Poor lighting", "Loose rugs", "Clutter", "No safety devices", "Needs assessment"] },
      { id: "ec_driving_status", label: "Driving Status", type: "select", required: true, section: "Safety", options: ["Still driving", "Limited driving", "Stopped driving", "Never drove", "Safety concerns"] },
      { id: "ec_abuse_risk", label: "Elder Abuse Risk", type: "select", required: true, section: "Safety", options: ["No concerns", "Financial exploitation", "Physical abuse", "Neglect", "Emotional abuse", "Self-neglect"] },
      
      // Care Plan
      { id: "ec_goals_of_care", label: "Goals of Care", type: "textarea", required: true, section: "Care Planning", placeholder: "Patient and family goals, preferences, and priorities" },
      { id: "ec_interventions", label: "Recommended Interventions", type: "checkbox", section: "Care Planning", options: ["Physical therapy", "Occupational therapy", "Dietitian referral", "Social work", "Home health", "Medication review"] },
      { id: "ec_advance_directives", label: "Advance Directives", type: "select", required: true, section: "Care Planning", options: ["Completed", "In progress", "Discussed", "Refused", "Unknown"] },
      { id: "ec_followup_plan", label: "Follow-up Plan", type: "textarea", required: true, section: "Care Planning", placeholder: "Monitoring plan, next appointments, and care coordination" }
    ]
  }
};

export default function FormBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [specialistRole, setSpecialistRole] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [editingForm, setEditingForm] = useState<ConsultationForm | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Fetch existing forms
  const { data: forms = [], isLoading } = useQuery<ConsultationForm[]>({
    queryKey: ['/api/consultation-forms'],
  });

  // Create/Update form mutation
  const createFormMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (editingForm) {
        return apiRequest(`/api/consultation-forms/${editingForm.id}`, 'PATCH', formData);
      } else {
        return apiRequest('/api/consultation-forms', 'POST', formData);
      }
    },
    onSuccess: () => {
      toast({
        title: editingForm ? "Form Updated" : "Form Created",
        description: `Consultation form has been ${editingForm ? 'updated' : 'created'} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/consultation-forms'] });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save consultation form.",
        variant: "destructive",
      });
    },
  });

  // Delete form mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (formId: number) => {
      return apiRequest('DELETE', `/api/consultation-forms/${formId}`);
    },
    onSuccess: () => {
      toast({
        title: "Form Deleted",
        description: "Consultation form has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/consultation-forms'] });
    },
    onError: (error: any) => {
      const isDataIntegrityError = error.message?.includes("associated patient records");
      toast({
        title: isDataIntegrityError ? "Cannot Delete Form" : "Error",
        description: isDataIntegrityError 
          ? "This form has associated patient records. Use 'Deactivate' instead to preserve data integrity."
          : "Failed to delete consultation form.",
        variant: "destructive",
      });
    },
  });

  // Form validation function
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formName.trim()) errors.push("Form name is required");
    if (!formDescription.trim()) errors.push("Form description is required");
    if (!specialistRole.trim()) errors.push("Specialist role is required");
    if (!fields || fields.length === 0) errors.push("At least one field is required");
    
    // Validate each field
    if (fields && Array.isArray(fields)) {
      fields.forEach((field, index) => {
      if (!field.label.trim()) errors.push(`Field ${index + 1}: Label is required`);
      if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        errors.push(`Field ${index + 1}: Select fields must have options`);
      }
      if (field.type === 'radio' && (!field.options || field.options.length < 2)) {
        errors.push(`Field ${index + 1}: Radio fields must have at least 2 options`);
      }
      });
    }
    
    return errors;
  };

  // Add medical template fields
  const addTemplateFields = (templateKey: string) => {
    const template = MEDICAL_TEMPLATES[templateKey as keyof typeof MEDICAL_TEMPLATES];
    if (template) {
      const newFields = template.map((field, index) => ({
        ...field,
        id: `${templateKey}_${Date.now()}_${index}`,
        medicalCategory: templateKey as FormField['medicalCategory']
      })) as FormField[];
      
      setFields(prev => [...prev, ...newFields]);
      toast({
        title: "Template Added",
        description: `Added ${template.length} ${templateKey} fields to your form.`,
      });
    }
  };

  // Load complete care template
  const loadCareTemplate = (templateKey: string) => {
    const template = CARE_TEMPLATES[templateKey as keyof typeof CARE_TEMPLATES];
    if (template) {
      setFormName(template.name);
      setFormDescription(template.description);
      setSpecialistRole(template.specialistRole);
      setFields(template.fields);
      setEditingForm(null); // Clear any existing form being edited
      
      toast({
        title: "Care Template Loaded",
        description: `Loaded ${template.name} with ${template.fields.length} fields. You can customize it before saving.`,
      });
    }
  };

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: "",
      type: "text",
      required: false,
      placeholder: ""
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(field => field.id === id);
    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < fields.length - 1)
    ) {
      const newFields = [...fields];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
      setFields(newFields);
    }
  };

  const addOption = (fieldId: string) => {
    updateField(fieldId, {
      options: [...(fields.find(f => f.id === fieldId)?.options || []), ""]
    });
  };

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.options) {
      const newOptions = [...field.options];
      newOptions[optionIndex] = value;
      updateField(fieldId, { options: newOptions });
    }
  };

  const deleteOption = (fieldId: string, optionIndex: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.options) {
      const newOptions = field.options.filter((_, i) => i !== optionIndex);
      updateField(fieldId, { options: newOptions });
    }
  };

  const saveForm = () => {
    const validationErrors = validateForm();
    setFormErrors(validationErrors);
    
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fix ${validationErrors.length} validation error(s) before saving.`,
        variant: "destructive",
      });
      return;
    }

    const formData = {
      name: formName,
      description: formDescription,
      specialistRole,
      formStructure: { fields },
      isActive: true
    };

    createFormMutation.mutate(formData);
  };

  const loadForm = (form: ConsultationForm) => {
    setEditingForm(form);
    setFormName(form.name);
    setFormDescription(form.description);
    setSpecialistRole(form.specialistRole);
    
    // Handle both new format (fields array) and old format (sections)
    if (form.formStructure?.fields && Array.isArray(form.formStructure.fields)) {
      setFields(form.formStructure.fields);
    } else if (form.formStructure?.sections && Array.isArray(form.formStructure.sections)) {
      // Convert sections format to fields array
      const allFields = form.formStructure.sections.reduce((acc: FormField[], section: any) => {
        return acc.concat(section.fields || []);
      }, []);
      setFields(allFields);
    } else {
      setFields([]);
    }
  };

  const resetForm = () => {
    setEditingForm(null);
    setFormName("");
    setFormDescription("");
    setSpecialistRole("");
    setFields([]);
    setPreviewMode(false);
  };

  const deleteForm = (form: ConsultationForm) => {
    if (window.confirm(`Are you sure you want to delete "${form.name}"? This action cannot be undone.`)) {
      deleteFormMutation.mutate(form.id);
    }
  }

  const deactivateForm = (form: ConsultationForm) => {
    if (window.confirm(`Are you sure you want to deactivate "${form.name}"? It will no longer be available for new consultations but existing records will be preserved.`)) {
      deactivateFormMutation.mutate(form.id);
    }
  }

  // Add deactivate mutation
  const deactivateFormMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/consultation-forms/${id}/deactivate`, {
        method: 'PATCH'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to deactivate form');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultation-forms'] });
      toast({
        title: "Success",
        description: "Consultation form deactivated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });;

  const renderFieldPreview = (field: FormField) => {
    switch (field.type) {
      case 'text':
        return (
          <Input 
            placeholder={field.placeholder || field.label}
            disabled
          />
        );
      case 'textarea':
        return (
          <Textarea 
            placeholder={field.placeholder || field.label}
            disabled
            rows={3}
          />
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, i) => (
              <div key={i} className="flex items-center space-x-2">
                <input type="radio" disabled />
                <label className="text-sm">{option}</label>
              </div>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, i) => (
              <div key={i} className="flex items-center space-x-2">
                <input type="checkbox" disabled />
                <label className="text-sm">{option}</label>
              </div>
            ))}
          </div>
        );
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
          </Select>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading forms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Consultation Form Builder
        </h1>
        <p className="text-gray-600">
          Create and manage custom consultation forms for different medical specialties
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Builder Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                {editingForm ? 'Edit Form' : 'Create New Form'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="formName">Form Name</Label>
                  <Input
                    id="formName"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Cardiology Assessment"
                  />
                </div>
                <div>
                  <Label htmlFor="specialistRole">Specialist Role</Label>
                  <Select value={specialistRole} onValueChange={setSpecialistRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialist role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardiologist">Cardiologist</SelectItem>
                      <SelectItem value="neurologist">Neurologist</SelectItem>
                      <SelectItem value="orthopedist">Orthopedist</SelectItem>
                      <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                      <SelectItem value="dermatologist">Dermatologist</SelectItem>
                      <SelectItem value="endocrinologist">Endocrinologist</SelectItem>
                      <SelectItem value="pulmonologist">Pulmonologist</SelectItem>
                      <SelectItem value="gastroenterologist">Gastroenterologist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="formDescription">Description</Label>
                <Textarea
                  id="formDescription"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the purpose of this consultation form..."
                  rows={2}
                />
              </div>

              {/* Specialized Care Templates */}
              <div className="border rounded-lg p-4 bg-green-50">
                <h3 className="text-sm font-semibold text-green-900 mb-2">Complete Care Templates</h3>
                <p className="text-xs text-green-700 mb-3">Ready-to-use comprehensive assessment forms for specialized care</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {Object.entries(CARE_TEMPLATES).map(([key, template]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => loadCareTemplate(key)}
                      disabled={previewMode}
                      className="text-xs h-auto p-2 flex flex-col items-start"
                    >
                      <span className="font-medium">{template.name}</span>
                      <span className="text-gray-600 text-left">{template.fields.length} fields</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Medical Template Section */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Quick Start: Medical Field Sets</h3>
                <p className="text-xs text-blue-700 mb-3">Add individual medical field sets to customize your form</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(MEDICAL_TEMPLATES).map(([key, template]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => addTemplateFields(key)}
                      disabled={previewMode}
                      className="text-xs h-8"
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)} ({template.length})
                    </Button>
                  ))}
                </div>
              </div>

              {/* Validation Errors */}
              {formErrors.length > 0 && (
                <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                  <h4 className="text-sm font-semibold text-red-900 mb-2">Please fix these issues:</h4>
                  <ul className="text-xs text-red-700 space-y-1">
                    {formErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Form Fields ({fields?.length || 0})</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {previewMode ? 'Edit' : 'Preview'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addField}
                    disabled={previewMode}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Custom Field
                  </Button>
                </div>
              </div>

              <div className="space-y-4 min-h-[200px] border rounded-lg p-4">
                {(!fields || fields.length === 0) ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>No fields added yet</p>
                    <Button
                      variant="outline"
                      onClick={addField}
                      className="mt-2"
                      disabled={previewMode}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Your First Field
                    </Button>
                  </div>
                ) : (
                  fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      {previewMode ? (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                          </Label>
                          {renderFieldPreview(field)}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{field.type}</Badge>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveField(field.id, 'up')}
                                disabled={index === 0}
                              >
                                ↑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveField(field.id, 'down')}
                                disabled={index === fields.length - 1}
                              >
                                ↓
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteField(field.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Field Label</Label>
                              <Input
                                value={field.label}
                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                placeholder="Enter field label"
                              />
                            </div>
                            <div>
                              <Label>Field Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value: any) => updateField(field.id, { type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text Input</SelectItem>
                                  <SelectItem value="textarea">Text Area</SelectItem>
                                  <SelectItem value="radio">Radio Buttons</SelectItem>
                                  <SelectItem value="checkbox">Checkboxes</SelectItem>
                                  <SelectItem value="select">Dropdown</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Placeholder</Label>
                              <Input
                                value={field.placeholder || ""}
                                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                placeholder="Enter placeholder text"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.required}
                                onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                              />
                              <Label>Required Field</Label>
                            </div>
                          </div>

                          {(field.type === 'radio' || field.type === 'checkbox' || field.type === 'select') && (
                            <div>
                              <Label>Options</Label>
                              <div className="space-y-2">
                                {field.options?.map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex gap-2">
                                    <Input
                                      value={option}
                                      onChange={(e) => updateOption(field.id, optionIndex, e.target.value)}
                                      placeholder="Enter option text"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteOption(field.id, optionIndex)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addOption(field.id)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Option
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={saveForm}
                  disabled={createFormMutation.isPending}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {createFormMutation.isPending ? 'Saving...' : (editingForm ? 'Update Form' : 'Save Form')}
                </Button>
                {editingForm && (
                  <Button
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Existing Forms Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Existing Forms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {forms.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No forms created yet
                  </p>
                ) : (
                  forms.map((form) => (
                    <Card key={form.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{form.name}</h4>
                          <Badge variant={form.isActive ? "default" : "secondary"}>
                            {form.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{form.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{form.specialistRole}</span>
                          <span>{form.formStructure?.fields?.length || (form.formStructure?.sections?.reduce((total: number, section: any) => total + (section.fields?.length || 0), 0)) || 0} fields</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadForm(form)}
                            className="flex-1"
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteForm(form)}
                            disabled={deleteFormMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}