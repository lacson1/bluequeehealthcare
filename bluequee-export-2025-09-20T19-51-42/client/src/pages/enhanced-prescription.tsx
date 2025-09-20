import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Autocomplete } from "@/components/ui/autocomplete";
import { 
  usePatientAutocomplete, 
  useMedicineAutocomplete, 
  useDoctorAutocomplete,
  usePharmacyAutocomplete,
  useDiagnosisAutocomplete,
  useSymptomAutocomplete
} from "@/hooks/useAutocomplete";
import { 
  User, 
  Pill, 
  Stethoscope, 
  Building2, 
  Plus, 
  Save, 
  FileText,
  CalendarDays,
  Clock,
  MapPin
} from "lucide-react";

const prescriptionSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  medicationName: z.string().min(1, "Medication is required"),
  medicationId: z.string().optional(),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  instructions: z.string().optional(),
  diagnosis: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  pharmacyId: z.string().optional(),
  prescribedBy: z.string().min(1, "Prescribing doctor is required"),
  notes: z.string().optional(),
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

export default function EnhancedPrescriptionForm() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isManualMedication, setIsManualMedication] = useState(false);
  const [isManualPharmacy, setIsManualPharmacy] = useState(false);

  const form = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      symptoms: [],
    },
  });

  // Autocomplete hooks
  const patientAutocomplete = usePatientAutocomplete();
  const medicineAutocomplete = useMedicineAutocomplete();
  const doctorAutocomplete = useDoctorAutocomplete();
  const pharmacyAutocomplete = usePharmacyAutocomplete();
  const diagnosisAutocomplete = useDiagnosisAutocomplete();
  const symptomAutocomplete = useSymptomAutocomplete();

  const onSubmit = (data: PrescriptionFormData) => {
    console.log("Prescription data:", { ...data, symptoms: selectedSymptoms });
    // Here you would submit to your API
  };

  const handleCustomMedicine = (medicineName: string) => {
    form.setValue("medicationName", medicineName);
    setIsManualMedication(true);
  };

  const handleCustomPharmacy = (pharmacyName: string) => {
    form.setValue("pharmacyId", pharmacyName);
    setIsManualPharmacy(true);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Enhanced Prescription Form
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Create prescriptions with intelligent autocomplete and suggestions
        </p>
      </div>

      {/* Color Legend */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Database selections</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span>Manual entries</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Patient Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-blue-600" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="patient" className="text-sm font-medium mb-2 block">
                Select Patient *
              </Label>
              <Autocomplete
                options={patientAutocomplete.options}
                value={form.watch("patientId")}
                onValueChange={(value) => form.setValue("patientId", value as string)}
                placeholder="Search patients by name, phone, or ID..."
                searchPlaceholder="Type to search patients..."
                variant="database"
                loading={patientAutocomplete.isLoading}
              />
              {form.formState.errors.patientId && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.patientId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clinical Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-green-600" />
              Clinical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="diagnosis" className="text-sm font-medium mb-2 block">
                Primary Diagnosis
              </Label>
              <Autocomplete
                options={diagnosisAutocomplete.options}
                value={form.watch("diagnosis")}
                onValueChange={(value) => form.setValue("diagnosis", value as string)}
                placeholder="Search diagnoses or conditions..."
                searchPlaceholder="Type to search medical conditions..."
                variant="database"
                groupBy={true}
                allowCustom={true}
                onCustomCreate={(value) => form.setValue("diagnosis", value)}
              />
            </div>

            <div>
              <Label htmlFor="symptoms" className="text-sm font-medium mb-2 block">
                Symptoms
              </Label>
              <Autocomplete
                options={symptomAutocomplete.options}
                value={selectedSymptoms}
                onValueChange={(values) => {
                  setSelectedSymptoms(values as string[]);
                  form.setValue("symptoms", values as string[]);
                }}
                placeholder="Select symptoms..."
                searchPlaceholder="Type to search symptoms..."
                variant="database"
                multiple={true}
                allowCustom={true}
                onCustomCreate={(value) => {
                  const newSymptoms = [...selectedSymptoms, value];
                  setSelectedSymptoms(newSymptoms);
                  form.setValue("symptoms", newSymptoms);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Medication Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5 text-purple-600" />
              Medication Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="medication" className="text-sm font-medium mb-2 block">
                Medication *
              </Label>
              <Autocomplete
                options={medicineAutocomplete.options}
                value={form.watch("medicationName")}
                onValueChange={(value) => {
                  form.setValue("medicationName", value as string);
                  const selectedMedicine = medicineAutocomplete.options.find(opt => opt.value === value);
                  if (selectedMedicine) {
                    form.setValue("medicationId", selectedMedicine.value);
                    setIsManualMedication(false);
                  }
                }}
                placeholder="Search medications..."
                searchPlaceholder="Type medication name, generic name, or category..."
                variant={isManualMedication ? "manual" : "database"}
                groupBy={true}
                allowCustom={true}
                onCustomCreate={handleCustomMedicine}
                loading={medicineAutocomplete.isLoading}
              />
              {form.formState.errors.medicationName && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.medicationName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dosage" className="text-sm font-medium mb-2 block">
                  Dosage *
                </Label>
                <Input
                  {...form.register("dosage")}
                  placeholder="e.g., 500mg, 2 tablets"
                  className="w-full"
                />
                {form.formState.errors.dosage && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.dosage.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="frequency" className="text-sm font-medium mb-2 block">
                  Frequency *
                </Label>
                <Input
                  {...form.register("frequency")}
                  placeholder="e.g., Twice daily, Every 8 hours"
                  className="w-full"
                />
                {form.formState.errors.frequency && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.frequency.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="duration" className="text-sm font-medium mb-2 block">
                  Duration *
                </Label>
                <Input
                  {...form.register("duration")}
                  placeholder="e.g., 7 days, 2 weeks"
                  className="w-full"
                />
                {form.formState.errors.duration && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.duration.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="instructions" className="text-sm font-medium mb-2 block">
                Special Instructions
              </Label>
              <Textarea
                {...form.register("instructions")}
                placeholder="Additional instructions for patient (e.g., take with food, avoid alcohol...)"
                className="w-full min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Prescription Details */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-indigo-600" />
              Prescription Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="prescribedBy" className="text-sm font-medium mb-2 block">
                Prescribing Doctor *
              </Label>
              <Autocomplete
                options={doctorAutocomplete.options}
                value={form.watch("prescribedBy")}
                onValueChange={(value) => form.setValue("prescribedBy", value as string)}
                placeholder="Select prescribing doctor..."
                searchPlaceholder="Search doctors and medical staff..."
                variant="database"
                loading={doctorAutocomplete.isLoading}
              />
              {form.formState.errors.prescribedBy && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.prescribedBy.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="pharmacy" className="text-sm font-medium mb-2 block">
                Preferred Pharmacy
              </Label>
              <Autocomplete
                options={pharmacyAutocomplete.options}
                value={form.watch("pharmacyId")}
                onValueChange={(value) => {
                  form.setValue("pharmacyId", value as string);
                  const selectedPharmacy = pharmacyAutocomplete.options.find(opt => opt.value === value);
                  if (selectedPharmacy) {
                    setIsManualPharmacy(false);
                  }
                }}
                placeholder="Search pharmacies..."
                searchPlaceholder="Type pharmacy name or location..."
                variant={isManualPharmacy ? "manual" : "database"}
                allowCustom={true}
                onCustomCreate={handleCustomPharmacy}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
                Additional Notes
              </Label>
              <Textarea
                {...form.register("notes")}
                placeholder="Any additional notes for the prescription..."
                className="w-full min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <CalendarDays className="h-4 w-4" />
            <span>Auto-saved to drafts</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Save as Draft
            </Button>
            <Button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4" />
              Create Prescription
            </Button>
          </div>
        </div>
      </form>

      {/* Form Data Debug (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Form Data (Development)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded overflow-auto">
              {JSON.stringify({ ...form.watch(), symptoms: selectedSymptoms }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}