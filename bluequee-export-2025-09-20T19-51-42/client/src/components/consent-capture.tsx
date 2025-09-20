import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Signature, AlertTriangle, CheckCircle, FileText, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const patientConsentSchema = z.object({
  patientId: z.number().min(1, "Patient is required"),
  consentFormId: z.number().min(1, "Consent form is required"),
  consentGivenBy: z.string().min(1, "Who is giving consent is required"),
  guardianName: z.string().optional(),
  guardianRelationship: z.string().optional(),
  witnessId: z.number().optional(),
  interpreterUsed: z.boolean().default(false),
  interpreterName: z.string().optional(),
  consentData: z.record(z.any()),
  digitalSignature: z.string().optional(),
  signatureDate: z.date().default(() => new Date()),
  expiryDate: z.date().optional(),
});

type PatientConsentForm = z.infer<typeof patientConsentSchema>;

interface ConsentCaptureProps {
  patientId: number;
  patientName?: string;
  proceduralReportId?: number;
  onConsentCaptured?: (consent: any) => void;
  trigger?: React.ReactNode;
}

export default function ConsentCapture({ 
  patientId, 
  patientName, 
  proceduralReportId, 
  onConsentCaptured,
  trigger 
}: ConsentCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConsentForm, setSelectedConsentForm] = useState<any>(null);
  const [signatureData, setSignatureData] = useState("");
  const { toast } = useToast();

  // Fetch available consent forms
  const { data: consentForms = [] } = useQuery({
    queryKey: ["/api/consent-forms"],
    enabled: isOpen,
  });

  // Fetch staff for witness selection
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/organization/staff"],
    enabled: isOpen,
  });

  const form = useForm<PatientConsentForm>({
    resolver: zodResolver(patientConsentSchema),
    defaultValues: {
      patientId,
      consentGivenBy: "patient",
      interpreterUsed: false,
      consentData: {},
      signatureDate: new Date(),
    },
  });

  const captureConsentMutation = useMutation({
    mutationFn: (data: PatientConsentForm) => 
      apiRequest("/api/patient-consents", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          proceduralReportId,
          digitalSignature: signatureData,
        }),
      }),
    onSuccess: (consent) => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-consents"] });
      toast({
        title: "Success",
        description: "Patient consent captured successfully.",
      });
      setIsOpen(false);
      form.reset();
      setSignatureData("");
      onConsentCaptured?.(consent);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to capture consent.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PatientConsentForm) => {
    if (!selectedConsentForm) {
      toast({
        title: "Error",
        description: "Please select a consent form.",
        variant: "destructive",
      });
      return;
    }

    if (!signatureData && data.consentGivenBy === "patient") {
      toast({
        title: "Error",
        description: "Digital signature is required.",
        variant: "destructive",
      });
      return;
    }

    captureConsentMutation.mutate(data);
  };

  const handleConsentFormChange = (formId: string) => {
    const selectedForm = consentForms.find((f: any) => f.id === parseInt(formId));
    setSelectedConsentForm(selectedForm);
    
    // Initialize consent data with form sections
    const initialData: Record<string, any> = {};
    if (selectedForm?.template?.sections) {
      selectedForm.template.sections.forEach((section: any, index: number) => {
        initialData[`section_${index}`] = "";
      });
    }
    
    form.setValue("consentFormId", parseInt(formId));
    form.setValue("consentData", initialData);
  };

  const updateConsentData = (key: string, value: any) => {
    const currentData = form.getValues("consentData");
    form.setValue("consentData", { ...currentData, [key]: value });
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Shield className="w-4 h-4 mr-2" />
      Capture Consent
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Capture Patient Consent</DialogTitle>
          <DialogDescription>
            Record informed consent for {patientName || `Patient ID ${patientId}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Consent Form Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Select Consent Form</Label>
              <Select onValueChange={handleConsentFormChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose consent form type" />
                </SelectTrigger>
                <SelectContent>
                  {consentForms.filter((form: any) => form.isActive).map((form: any) => (
                    <SelectItem key={form.id} value={form.id.toString()}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{form.title}</span>
                        <span className="text-xs text-gray-500">{form.category} • {form.consentType}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedConsentForm && (
              <>
                {/* Form Preview */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {selectedConsentForm.title}
                    </CardTitle>
                    <CardDescription>
                      {selectedConsentForm.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Risk Factors */}
                    {selectedConsentForm.riskFactors?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Risk Factors
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {selectedConsentForm.riskFactors.map((risk: string, index: number) => (
                            <li key={index} className="text-red-700">{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Benefits */}
                    {selectedConsentForm.benefits?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Benefits
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {selectedConsentForm.benefits.map((benefit: string, index: number) => (
                            <li key={index} className="text-green-700">{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Alternatives */}
                    {selectedConsentForm.alternatives?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-800 mb-2">Alternative Treatments</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {selectedConsentForm.alternatives.map((alt: string, index: number) => (
                            <li key={index} className="text-blue-700">{alt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Consent Form Sections */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Consent Acknowledgments</Label>
                  {selectedConsentForm.template?.sections?.map((section: any, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <h4 className="font-medium">{section.title}</h4>
                        <p className="text-sm text-gray-600">{section.content}</p>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={form.getValues("consentData")[`section_${index}`] === "acknowledged"}
                            onCheckedChange={(checked) => 
                              updateConsentData(`section_${index}`, checked ? "acknowledged" : "")
                            }
                            required={section.required}
                          />
                          <Label className="text-sm">
                            I acknowledge and understand this information
                            {section.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Consent Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="consentGivenBy"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Consent Given By</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="patient" id="patient" />
                              <Label htmlFor="patient">Patient</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="guardian" id="guardian" />
                              <Label htmlFor="guardian">Guardian/Parent</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="next_of_kin" id="next_of_kin" />
                              <Label htmlFor="next_of_kin">Next of Kin</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="witnessId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Witness (Staff Member)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select witness" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {staff.map((member: any) => (
                              <SelectItem key={member.id} value={member.id.toString()}>
                                {member.title} {member.firstName} {member.lastName} ({member.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Guardian Information */}
                {form.watch("consentGivenBy") !== "patient" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guardianName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guardian/Representative Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guardianRelationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship to Patient</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="parent">Parent</SelectItem>
                              <SelectItem value="spouse">Spouse</SelectItem>
                              <SelectItem value="child">Child</SelectItem>
                              <SelectItem value="sibling">Sibling</SelectItem>
                              <SelectItem value="legal_guardian">Legal Guardian</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Interpreter Information */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="interpreterUsed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Interpreter Used</FormLabel>
                          <FormDescription>
                            Check if an interpreter was used during the consent process
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("interpreterUsed") && (
                    <FormField
                      control={form.control}
                      name="interpreterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interpreter Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Name of interpreter" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Digital Signature */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Digital Signature</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Signature className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    {signatureData ? (
                      <div>
                        <p className="text-green-600 mb-2">Signature captured</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSignatureData("")}
                        >
                          Clear Signature
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-500 mb-2">Click to capture digital signature</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSignatureData("signature_" + Date.now())}
                        >
                          Capture Signature
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={captureConsentMutation.isPending || !selectedConsentForm}
              >
                {captureConsentMutation.isPending ? "Capturing..." : "Capture Consent"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}