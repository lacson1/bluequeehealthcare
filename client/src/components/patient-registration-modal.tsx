import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPatientSchema, type InsertPatient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Building2 } from "lucide-react";
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
import { AutocompleteInput } from "@/components/autocomplete-input";
import { Sparkles, Plus, X, MapPin, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import AllergyAutocomplete from "./allergy-autocomplete";
import MedicalConditionAutocomplete from "./medical-condition-autocomplete";
import { NIGERIA_STATE_NAMES, getLgasForState, NIGERIA_LANGUAGES } from "@/lib/nigeria-data";

interface Organization {
  id: number;
  name: string;
  type: string;
}

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
  const { user } = useAuth();
  
  // Smart autocomplete state
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  
  // Nigerian address state
  const [selectedState, setSelectedState] = useState<string>("");
  const [showNigerianAddress, setShowNigerianAddress] = useState(false);
  const [showNigerianId, setShowNigerianId] = useState(false);
  
  // Selected organization state
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>(
    user?.organizationId?.toString() || ""
  );
  
  // Check if user is superadmin (can select any organization)
  const isSuperAdmin = user?.role === 'superadmin';
  
  // Fetch organizations for dropdown (only for superadmin)
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['/api/organizations-dropdown'],
    enabled: open && isSuperAdmin,
  });

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
      // Nigerian optional fields
      state: "",
      lga: "",
      town: "",
      streetAddress: "",
      landmark: "",
      postalCode: "",
      ninNumber: "",
      bvnNumber: "",
      secondaryPhone: "",
      preferredLanguage: "English",
    },
  });

  const registerPatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      // Include organizationId - from selection for superadmin, from user context for others
      const orgId = isSuperAdmin && selectedOrganizationId 
        ? parseInt(selectedOrganizationId) 
        : user?.organizationId;
      
      const requestData = {
        ...data,
        organizationId: orgId,
      };
      const response = await apiRequest("/api/patients", "POST", requestData);
      return await response.json();
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
      setSelectedAllergies([]);
      setSelectedConditions([]);
      setSelectedState("");
      setShowNigerianAddress(false);
      setShowNigerianId(false);
      setSelectedOrganizationId(user?.organizationId?.toString() || "");
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Patient registration error:", error);
      
      // Extract error message from the error object
      let errorMessage = "Failed to register patient. Please try again.";
      let errorTitle = "Registration Error";
      
      if (error?.message) {
        const errorText = error.message;
        
        // Check for authentication error
        if (errorText.includes("401") || errorText.toLowerCase().includes("authentication required")) {
          errorTitle = "Authentication Required";
          errorMessage = "Please log in to register patients. Your session may have expired.";
        }
        // Check if it's a validation error
        else if (errorText.includes("400") || errorText.includes("Validation")) {
          errorMessage = "Please check all required fields and try again.";
          
          // Try to extract the specific validation message
          const match = errorText.match(/{"message":"([^"]+)"/);
          if (match && match[1]) {
            errorMessage = match[1];
          }
        } else if (errorText.includes("details")) {
          // Try to extract Zod validation details
          errorMessage = "Please fill in all required fields correctly.";
        } else if (errorText.includes("403") || errorText.toLowerCase().includes("forbidden")) {
          errorMessage = "You don't have permission to register patients.";
        } else {
          // Remove HTTP status code prefix and clean up the message
          errorMessage = errorText.replace(/^\d+:\s*/, '').replace(/^Error:\s*/i, '');
          
          // If message still contains JSON, try to parse it
          try {
            const jsonMatch = errorText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.message) {
                errorMessage = parsed.message;
              }
            }
          } catch (e) {
            // Keep the cleaned message if JSON parsing fails
          }
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
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
    // Validate that an organization is selected
    const effectiveOrgId = isSuperAdmin && selectedOrganizationId 
      ? parseInt(selectedOrganizationId) 
      : user?.organizationId;
    
    if (!effectiveOrgId) {
      toast({
        title: "Organization Required",
        description: isSuperAdmin 
          ? "Please select an organization for this patient."
          : "Your account is not assigned to an organization. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }
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
            {/* Organization Selection (for superadmin) */}
            {isSuperAdmin && (
              <div className="p-4 border border-purple-200 rounded-lg bg-purple-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-medium text-purple-800">Organization Assignment</h3>
                </div>
                <FormItem>
                  <FormLabel>Healthcare Organization *</FormLabel>
                  <Select 
                    value={selectedOrganizationId} 
                    onValueChange={setSelectedOrganizationId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization for this patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(organizations) && organizations.map((org: Organization) => (
                        <SelectItem key={org.id} value={org.id.toString()}>
                          {org.name} ({org.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs text-purple-600">
                    As a super admin, you can register patients to any organization
                  </FormDescription>
                </FormItem>
              </div>
            )}
            
            {/* Show current organization for non-superadmin users */}
            {!isSuperAdmin && user?.organizationId && (
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">
                  Patient will be registered to your organization
                </span>
              </div>
            )}

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
                    <FormLabel className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      Address (with smart suggestions)
                    </FormLabel>
                    <FormControl>
                      <AutocompleteInput
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Enter patient address..."
                        fieldType="address"
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Secondary Phone */}
              <FormField
                control={form.control}
                name="secondaryPhone"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Secondary Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+234..." />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Alternative phone number for contact
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nigerian Address Section (Optional, Collapsible) */}
            <Collapsible open={showNigerianAddress} onOpenChange={setShowNigerianAddress}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between border-dashed border-green-300 bg-green-50/50 hover:bg-green-50"
                >
                  <span className="flex items-center gap-2 text-green-700">
                    <MapPin className="h-4 w-4" />
                    Nigerian Address Details (Optional)
                  </span>
                  {showNigerianAddress ? (
                    <ChevronUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-green-600" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 p-4 border border-green-200 rounded-lg bg-green-50/30">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedState(value);
                              form.setValue("lga", ""); // Reset LGA when state changes
                            }} 
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {NIGERIA_STATE_NAMES.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lga"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local Government Area (LGA)</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || ""}
                            disabled={!selectedState}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={selectedState ? "Select LGA" : "Select State first"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {getLgasForState(selectedState).map((lga) => (
                                <SelectItem key={lga} value={lga}>
                                  {lga}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="town"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Town/City</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Ikeja, Lekki, Wuse" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 100271" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="streetAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 12 Adeola Odeku Street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="landmark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Landmark</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Behind GTBank, Near Shoprite" />
                        </FormControl>
                        <FormDescription className="text-xs">
                          A nearby landmark helps locate the address easily
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Nigerian Identification Section (Optional, Collapsible) */}
            <Collapsible open={showNigerianId} onOpenChange={setShowNigerianId}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50"
                >
                  <span className="flex items-center gap-2 text-blue-700">
                    <CreditCard className="h-4 w-4" />
                    Nigerian Identification (Optional)
                  </span>
                  {showNigerianId ? (
                    <ChevronUp className="h-4 w-4 text-blue-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-blue-600" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50/30">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ninNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIN (National Identification Number)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="11-digit NIN" 
                              maxLength={11}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            11-digit National Identification Number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bvnNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BVN (Bank Verification Number)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="11-digit BVN" 
                              maxLength={11}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Optional for payment/billing purposes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="preferredLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Language</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "English"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {NIGERIA_LANGUAGES.map((lang) => (
                              <SelectItem key={lang} value={lang}>
                                {lang}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

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
