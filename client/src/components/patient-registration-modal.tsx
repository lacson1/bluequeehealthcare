import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPatientSchema, type InsertPatient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
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
import { Sparkles, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AllergyAutocomplete from "./allergy-autocomplete";
import MedicalConditionAutocomplete from "./medical-condition-autocomplete";

interface PatientRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PatientRegistrationModal({
  open,
  onOpenChange,
}: PatientRegistrationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Smart autocomplete state
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema),
    defaultValues: {
      title: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      phone: "",
      email: "",
      address: "",
      allergies: "",
      medicalHistory: "",
    },
  });

  const registerPatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      const response = await apiRequest("POST", "/api/patients", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Patient registered successfully!",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to register patient. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAllergySelect = (allergy: string) => {
    if (!selectedAllergies.includes(allergy)) {
      const newAllergies = [...selectedAllergies, allergy];
      setSelectedAllergies(newAllergies);
      form.setValue("allergies", newAllergies.join(", "));
    }
  };

  const handleConditionSelect = (condition: string) => {
    if (!selectedConditions.includes(condition)) {
      const newConditions = [...selectedConditions, condition];
      setSelectedConditions(newConditions);
      form.setValue("medicalHistory", newConditions.join(", "));
    }
  };

  const removeAllergy = (allergyToRemove: string) => {
    const newAllergies = selectedAllergies.filter(a => a !== allergyToRemove);
    setSelectedAllergies(newAllergies);
    form.setValue("allergies", newAllergies.join(", "));
  };

  const removeCondition = (conditionToRemove: string) => {
    const newConditions = selectedConditions.filter(c => c !== conditionToRemove);
    setSelectedConditions(newConditions);
    form.setValue("medicalHistory", newConditions.join(", "));
  };

  const onSubmit = (data: InsertPatient) => {
    registerPatientMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Patient</DialogTitle>
          <DialogDescription>
            Add a new patient to the clinic management system.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Mr.">Mr.</SelectItem>
                          <SelectItem value="Mrs.">Mrs.</SelectItem>
                          <SelectItem value="Ms.">Ms.</SelectItem>
                          <SelectItem value="Dr.">Dr.</SelectItem>
                          <SelectItem value="Prof.">Prof.</SelectItem>
                          <SelectItem value="Rev.">Rev.</SelectItem>
                          <SelectItem value="Chief">Chief</SelectItem>
                          <SelectItem value="Alhaji">Alhaji</SelectItem>
                          <SelectItem value="Alhaja">Alhaja</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Smart Medical Information with Autocomplete */}
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                Medical Information (Smart Auto-Complete)
              </h3>
              
              <div className="space-y-6">
                {/* Smart Allergy Selection */}
                <div>
                  <FormLabel className="flex items-center gap-2 mb-3">
                    Allergies (Smart Selection)
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                      Quick Add
                    </Badge>
                  </FormLabel>
                  
                  <AllergyAutocomplete
                    value=""
                    onSelect={handleAllergySelect}
                    placeholder="Search common allergies (e.g., Penicillin, Peanuts)..."
                    className="mb-3"
                  />
                  
                  {/* Selected Allergies Display */}
                  {selectedAllergies.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      {selectedAllergies.map((allergy) => (
                        <Badge
                          key={allergy}
                          variant="secondary"
                          className="bg-orange-100 text-orange-800 border-orange-300 flex items-center gap-1"
                        >
                          {allergy}
                          <X
                            className="h-3 w-3 cursor-pointer hover:bg-orange-200 rounded-full"
                            onClick={() => removeAllergy(allergy)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={2}
                            placeholder="Additional allergies or manual entry..."
                            className="text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <p className="text-xs text-slate-500 mt-1">
                    ✨ Use the search above to quickly add standardized allergies, or type additional ones below.
                  </p>
                </div>

                {/* Smart Medical History Selection */}
                <div>
                  <FormLabel className="flex items-center gap-2 mb-3">
                    Medical History (Smart Selection)
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      Quick Add
                    </Badge>
                  </FormLabel>
                  
                  <MedicalConditionAutocomplete
                    value=""
                    onSelect={handleConditionSelect}
                    placeholder="Search medical conditions (e.g., Hypertension, Diabetes)..."
                    className="mb-3"
                  />
                  
                  {/* Selected Conditions Display */}
                  {selectedConditions.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      {selectedConditions.map((condition) => (
                        <Badge
                          key={condition}
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1"
                        >
                          {condition}
                          <X
                            className="h-3 w-3 cursor-pointer hover:bg-emerald-200 rounded-full"
                            onClick={() => removeCondition(condition)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="medicalHistory"
                    render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Additional medical history, surgeries, or manual entry..."
                            className="text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <p className="text-xs text-slate-500 mt-1">
                    ✨ Use the search above to quickly add standardized conditions, or type additional history below.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={registerPatientMutation.isPending}
              >
                {registerPatientMutation.isPending ? "Registering..." : "Register Patient"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
