import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Plus, Edit, Eye, Shield, Users, AlertTriangle, CheckCircle, Search, Signature, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const consentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  consentType: z.string().min(1, "Consent type is required"),
  template: z.object({
    sections: z.array(z.object({
      title: z.string(),
      content: z.string(),
      required: z.boolean().default(true)
    }))
  }),
  riskFactors: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  alternatives: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

type ConsentFormData = z.infer<typeof consentFormSchema>;

const CONSENT_CATEGORIES = [
  "Surgery",
  "Procedure", 
  "Treatment",
  "Anesthesia",
  "Photography/Video",
  "Research",
  "Blood Transfusion",
  "Discharge",
  "General Medical Care"
];

const CONSENT_TYPES = [
  "Informed Consent",
  "Surgical Consent", 
  "Anesthesia Consent",
  "Research Consent",
  "Photography Consent",
  "Discharge Against Medical Advice",
  "Treatment Refusal",
  "General Treatment Consent"
];

// Pre-built consent templates
const CONSENT_TEMPLATES = {
  "surgical": {
    title: "Surgical Procedure Consent",
    sections: [
      {
        title: "Procedure Information",
        content: "I understand that I will be undergoing [PROCEDURE_NAME]. The nature and purpose of this procedure has been explained to me.",
        required: true
      },
      {
        title: "Risks and Complications", 
        content: "I understand that no medical procedure is 100% successful, and complications may include but are not limited to: bleeding, infection, adverse reaction to anesthesia, and in rare cases, death.",
        required: true
      },
      {
        title: "Alternative Treatments",
        content: "Alternative treatment options have been discussed with me, including the option of no treatment.",
        required: true
      },
      {
        title: "Post-Operative Care",
        content: "I understand the importance of following post-operative instructions and attending follow-up appointments.",
        required: true
      }
    ]
  },
  "anesthesia": {
    title: "Anesthesia Consent",
    sections: [
      {
        title: "Anesthesia Type",
        content: "I understand that [ANESTHESIA_TYPE] will be administered during my procedure.",
        required: true
      },
      {
        title: "Anesthesia Risks",
        content: "I understand the risks associated with anesthesia including nausea, vomiting, dental damage, awareness during surgery, and in rare cases, serious complications including death.",
        required: true
      }
    ]
  },
  "photography": {
    title: "Photography and Media Consent",
    sections: [
      {
        title: "Photography Permission",
        content: "I give permission for photographs, videos, or other media to be taken during my care for medical documentation purposes.",
        required: true
      },
      {
        title: "Usage Rights",
        content: "I understand how these images may be used and stored, and my rights regarding their use.",
        required: true
      }
    ]
  }
};

export default function ConsentManagement() {
  const [selectedTab, setSelectedTab] = useState("forms");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [viewingForm, setViewingForm] = useState<any>(null);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [selectedFormForPatient, setSelectedFormForPatient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Fetch consent forms
  const { data: consentForms = [], isLoading: formsLoading } = useQuery({
    queryKey: ["/api/consent-forms"],
  });

  // Fetch patient consents
  const { data: patientConsents = [], isLoading: consentsLoading } = useQuery({
    queryKey: ["/api/patient-consents"],
  });

  // Fetch patients for attachment
  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"],
  });

  // Fetch current user's organization
  const { data: userProfile } = useQuery({
    queryKey: ["/api/profile"],
  });

  // Fetch organization details
  const { data: organization } = useQuery({
    queryKey: ["/api/organizations", userProfile?.organizationId],
    enabled: !!userProfile?.organizationId,
  });

  const form = useForm<ConsentFormData>({
    resolver: zodResolver(consentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      consentType: "",
      template: { sections: [] },
      riskFactors: [],
      benefits: [],
      alternatives: [],
      isActive: true,
    },
  });

  const createFormMutation = useMutation({
    mutationFn: (data: ConsentFormData) => 
      apiRequest("/api/consent-forms", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consent-forms"] });
      toast({
        title: "Success",
        description: "Consent form created successfully.",
      });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create consent form.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConsentFormData) => {
    createFormMutation.mutate(data);
  };

  const loadTemplate = (templateKey: string) => {
    const template = CONSENT_TEMPLATES[templateKey as keyof typeof CONSENT_TEMPLATES];
    if (template) {
      form.setValue("title", template.title);
      form.setValue("template.sections", template.sections);
      
      // Set appropriate category and type based on template
      if (templateKey === "surgical") {
        form.setValue("category", "Surgery");
        form.setValue("consentType", "Surgical Consent");
      } else if (templateKey === "anesthesia") {
        form.setValue("category", "Anesthesia");
        form.setValue("consentType", "Anesthesia Consent");
      } else if (templateKey === "photography") {
        form.setValue("category", "Photography/Video");
        form.setValue("consentType", "Photography Consent");
      }
    }
  };

  const addSection = () => {
    const currentSections = form.getValues("template.sections") || [];
    form.setValue("template.sections", [
      ...currentSections,
      { title: "", content: "", required: true }
    ]);
  };

  const removeSection = (index: number) => {
    const currentSections = form.getValues("template.sections") || [];
    form.setValue("template.sections", currentSections.filter((_, i) => i !== index));
  };

  const addRiskFactor = () => {
    const currentRisks = form.getValues("riskFactors") || [];
    form.setValue("riskFactors", [...currentRisks, ""]);
  };

  const addBenefit = () => {
    const currentBenefits = form.getValues("benefits") || [];
    form.setValue("benefits", [...currentBenefits, ""]);
  };

  const addAlternative = () => {
    const currentAlternatives = form.getValues("alternatives") || [];
    form.setValue("alternatives", [...currentAlternatives, ""]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "expired":
        return <Badge className="bg-yellow-100 text-yellow-800">Expired</Badge>;
      case "withdrawn":
        return <Badge className="bg-red-100 text-red-800">Withdrawn</Badge>;
      case "superseded":
        return <Badge className="bg-gray-100 text-gray-800">Superseded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredForms = consentForms.filter((form: any) =>
    form.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.consentType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consent Management</h1>
          <p className="text-muted-foreground">
            Manage consent forms and patient consent records
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Consent Form
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Consent Form</DialogTitle>
              <DialogDescription>
                Create a new consent form template for use in consultations and procedures.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Template Selection */}
                <div className="space-y-2">
                  <Label>Quick Templates</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate("surgical")}
                    >
                      Surgical Consent
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate("anesthesia")}
                    >
                      Anesthesia Consent
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadTemplate("photography")}
                    >
                      Photography Consent
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Information */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Form Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Surgical Procedure Consent" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONSENT_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
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
                    name="consentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consent Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select consent type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONSENT_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
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
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active Form</FormLabel>
                          <FormDescription>
                            Make this form available for use in consultations
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description of when to use this consent form..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Form Sections */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Consent Form Sections</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSection}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Section
                    </Button>
                  </div>

                  {form.watch("template.sections")?.map((section, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Section {index + 1}</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(index)}
                            className="text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                        
                        <Input
                          placeholder="Section title"
                          value={section.title}
                          onChange={(e) => {
                            const sections = form.getValues("template.sections");
                            sections[index].title = e.target.value;
                            form.setValue("template.sections", sections);
                          }}
                        />
                        
                        <Textarea
                          placeholder="Section content"
                          value={section.content}
                          onChange={(e) => {
                            const sections = form.getValues("template.sections");
                            sections[index].content = e.target.value;
                            form.setValue("template.sections", sections);
                          }}
                        />
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={section.required}
                            onCheckedChange={(checked) => {
                              const sections = form.getValues("template.sections");
                              sections[index].required = !!checked;
                              form.setValue("template.sections", sections);
                            }}
                          />
                          <Label className="text-sm">Required section</Label>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Risk Factors */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Risk Factors</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addRiskFactor}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Risk
                    </Button>
                  </div>
                  {form.watch("riskFactors")?.map((risk, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Risk factor"
                        value={risk}
                        onChange={(e) => {
                          const risks = form.getValues("riskFactors");
                          risks[index] = e.target.value;
                          form.setValue("riskFactors", risks);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const risks = form.getValues("riskFactors");
                          form.setValue("riskFactors", risks.filter((_, i) => i !== index));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Benefits */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Benefits</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addBenefit}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Benefit
                    </Button>
                  </div>
                  {form.watch("benefits")?.map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Benefit"
                        value={benefit}
                        onChange={(e) => {
                          const benefits = form.getValues("benefits");
                          benefits[index] = e.target.value;
                          form.setValue("benefits", benefits);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const benefits = form.getValues("benefits");
                          form.setValue("benefits", benefits.filter((_, i) => i !== index));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Alternatives */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Alternative Treatments</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addAlternative}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Alternative
                    </Button>
                  </div>
                  {form.watch("alternatives")?.map((alternative, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Alternative treatment"
                        value={alternative}
                        onChange={(e) => {
                          const alternatives = form.getValues("alternatives");
                          alternatives[index] = e.target.value;
                          form.setValue("alternatives", alternatives);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const alternatives = form.getValues("alternatives");
                          form.setValue("alternatives", alternatives.filter((_, i) => i !== index));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createFormMutation.isPending}
                  >
                    {createFormMutation.isPending ? "Creating..." : "Create Form"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="forms">Consent Forms</TabsTrigger>
          <TabsTrigger value="consents">Patient Consents</TabsTrigger>
          <TabsTrigger value="expired">Expired/Withdrawn</TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="space-y-4">
          {/* Search */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search consent forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Forms List */}
          <div className="grid gap-4">
            {formsLoading ? (
              <div className="text-center py-8">Loading consent forms...</div>
            ) : filteredForms.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">No consent forms found</p>
                  <p className="text-sm text-gray-400">Create your first consent form to get started</p>
                </CardContent>
              </Card>
            ) : (
              filteredForms.map((form: any) => (
                <Card key={form.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{form.title}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <Badge variant="outline">{form.category}</Badge>
                          <Badge variant="outline">{form.consentType}</Badge>
                          {form.isActive && <Badge className="bg-green-100 text-green-800">Active</Badge>}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setViewingForm(form);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingForm(form);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedFormForPatient(form);
                            setIsPatientModalOpen(true);
                          }}
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {form.description && (
                        <p className="text-sm text-gray-600">{form.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{form.template?.sections?.length || 0} sections</span>
                        <span>{form.riskFactors?.length || 0} risk factors</span>
                        <span>Created {new Date(form.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="consents" className="space-y-4">
          <div className="grid gap-4">
            {consentsLoading ? (
              <div className="text-center py-8">Loading patient consents...</div>
            ) : patientConsents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Signature className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">No patient consents found</p>
                  <p className="text-sm text-gray-400">Patient consents will appear here when signed during consultations</p>
                </CardContent>
              </Card>
            ) : (
              patientConsents.map((consent: any) => (
                <Card key={consent.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{consent.consentForm?.title}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {consent.patientName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(consent.signatureDate).toLocaleDateString()}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(consent.status)}
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div><strong>Consent given by:</strong> {consent.consentGivenBy}</div>
                      {consent.guardianName && (
                        <div><strong>Guardian:</strong> {consent.guardianName} ({consent.guardianRelationship})</div>
                      )}
                      {consent.witnessName && (
                        <div><strong>Witnessed by:</strong> {consent.witnessName}</div>
                      )}
                      {consent.interpreterUsed && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Interpreter used: {consent.interpreterName}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="expired">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-orange-400" />
            <p className="text-gray-500">Expired and withdrawn consents will appear here</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Consent Form Modal */}
      {viewingForm && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {viewingForm.title}
              </DialogTitle>
              <DialogDescription>
                View consent form template details and structure
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Category</Label>
                  <p className="text-sm">{viewingForm.category}</p>
                </div>
                <div>
                  <Label className="font-medium">Consent Type</Label>
                  <p className="text-sm">{viewingForm.consentType}</p>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <p className="text-sm">{viewingForm.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <Label className="font-medium">Created</Label>
                  <p className="text-sm">{new Date(viewingForm.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {viewingForm.description && (
                <div>
                  <Label className="font-medium">Description</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    {viewingForm.description}
                  </p>
                </div>
              )}

              {/* Form Sections */}
              <div>
                <Label className="font-medium">Consent Form Sections</Label>
                <div className="mt-2 space-y-3">
                  {viewingForm.template?.sections?.map((section: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{section.title}</h4>
                        {section.required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{section.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Factors */}
              {viewingForm.riskFactors?.length > 0 && (
                <div>
                  <Label className="font-medium">Risk Factors</Label>
                  <ul className="mt-2 space-y-1">
                    {viewingForm.riskFactors.map((risk: string, index: number) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {viewingForm.benefits?.length > 0 && (
                <div>
                  <Label className="font-medium">Benefits</Label>
                  <ul className="mt-2 space-y-1">
                    {viewingForm.benefits.map((benefit: string, index: number) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Alternatives */}
              {viewingForm.alternatives?.length > 0 && (
                <div>
                  <Label className="font-medium">Alternative Treatments</Label>
                  <ul className="mt-2 space-y-1">
                    {viewingForm.alternatives.map((alternative: string, index: number) => (
                      <li key={index} className="text-sm">• {alternative}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // Generate printable consent form
                  const printContent = `
                    <html>
                      <head>
                        <title>${viewingForm.title}</title>
                        <style>
                          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
                          .org-header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2D5A27; padding-bottom: 15px; }
                          .org-name { color: #2D5A27; font-size: 24px; font-weight: bold; margin: 0; }
                          .org-tagline { color: #666; font-size: 14px; margin: 5px 0; font-style: italic; }
                          .org-contact { color: #666; font-size: 12px; margin: 0; }
                          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                          .section { margin-bottom: 25px; page-break-inside: avoid; }
                          .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                          .content { margin-bottom: 15px; }
                          .signature-section { margin-top: 50px; border-top: 1px solid #333; padding-top: 30px; }
                          .signature-line { border-bottom: 1px solid #333; margin: 20px 0; height: 40px; }
                          .signature-label { font-weight: bold; margin-bottom: 5px; }
                          .checkbox { width: 15px; height: 15px; border: 1px solid #333; display: inline-block; margin-right: 10px; }
                          ul { padding-left: 20px; }
                          @media print { body { margin: 20px; } }
                        </style>
                      </head>
                      <body>
                        ${organization ? `
                          <div class="org-header">
                            <h1 class="org-name">${organization.name.toUpperCase()}</h1>
                            <p class="org-tagline">${organization.description || 'Excellence in Healthcare - Committed to Your Wellbeing'}</p>
                            <p class="org-contact">
                              ${organization.address ? `📍 ${organization.address}` : ''}
                              ${organization.phone ? ` | 📞 ${organization.phone}` : ''}
                              ${organization.email ? ` | 📧 ${organization.email}` : ''}
                            </p>
                          </div>
                        ` : `
                          <div class="org-header">
                            <h1 class="org-name">LAGOS ISLAND HOSPITAL</h1>
                            <p class="org-tagline">Excellence in Healthcare - Committed to Your Wellbeing</p>
                            <p class="org-contact">📍 Lagos Island, Lagos State | 📞 +234-XXX-XXXX-XXX | 📧 info@lagosislandhospital.ng</p>
                          </div>
                        `}
                        
                        <div class="header">
                          <h1>${viewingForm.title}</h1>
                          <p><strong>Category:</strong> ${viewingForm.category} | <strong>Type:</strong> ${viewingForm.consentType}</p>
                        </div>
                        
                        ${viewingForm.description ? `<div class="section"><div class="section-title">Description</div><div class="content">${viewingForm.description}</div></div>` : ''}
                        
                        ${viewingForm.template?.sections?.map((section: any) => `
                          <div class="section">
                            <div class="section-title">${section.title || ''} ${section.required ? '(Required)' : ''}</div>
                            <div class="content">${(section.content || '').replace(/\n/g, '<br>')}</div>
                          </div>
                        `).join('') || ''}
                        
                        ${viewingForm.riskFactors?.length > 0 ? `
                          <div class="section">
                            <div class="section-title">Risk Factors and Complications</div>
                            <ul>
                              ${viewingForm.riskFactors.map((risk: string) => `<li>${risk}</li>`).join('')}
                            </ul>
                          </div>
                        ` : ''}
                        
                        ${viewingForm.benefits?.length > 0 ? `
                          <div class="section">
                            <div class="section-title">Benefits</div>
                            <ul>
                              ${viewingForm.benefits.map((benefit: string) => `<li>${benefit}</li>`).join('')}
                            </ul>
                          </div>
                        ` : ''}
                        
                        ${viewingForm.alternatives?.length > 0 ? `
                          <div class="section">
                            <div class="section-title">Alternative Treatments</div>
                            <ul>
                              ${viewingForm.alternatives.map((alt: string) => `<li>${alt}</li>`).join('')}
                            </ul>
                          </div>
                        ` : ''}
                        
                        <div class="signature-section">
                          <h3>Patient Consent and Signature</h3>
                          
                          <div style="margin: 20px 0;">
                            <span class="checkbox"></span> I acknowledge that I have read and understood this consent form.
                          </div>
                          <div style="margin: 20px 0;">
                            <span class="checkbox"></span> I have had the opportunity to ask questions, and all my questions have been answered to my satisfaction.
                          </div>
                          <div style="margin: 20px 0;">
                            <span class="checkbox"></span> I understand the risks, benefits, and alternatives to the proposed treatment.
                          </div>
                          <div style="margin: 20px 0;">
                            <span class="checkbox"></span> I voluntarily consent to the proposed treatment/procedure.
                          </div>
                          
                          <div style="margin-top: 40px;">
                            <div class="signature-label">Patient Name:</div>
                            <div class="signature-line"></div>
                          </div>
                          
                          <div style="margin-top: 30px;">
                            <div class="signature-label">Patient Signature:</div>
                            <div class="signature-line"></div>
                          </div>
                          
                          <div style="margin-top: 30px;">
                            <div class="signature-label">Date:</div>
                            <div class="signature-line"></div>
                          </div>
                          
                          <div style="margin-top: 40px;">
                            <div class="signature-label">Guardian/Representative (if applicable):</div>
                            <div class="signature-line"></div>
                          </div>
                          
                          <div style="margin-top: 30px;">
                            <div class="signature-label">Relationship to Patient:</div>
                            <div class="signature-line"></div>
                          </div>
                          
                          <div style="margin-top: 40px;">
                            <div class="signature-label">Witness Name and Signature:</div>
                            <div class="signature-line"></div>
                          </div>
                          
                          <div style="margin-top: 30px;">
                            <div class="signature-label">Healthcare Provider:</div>
                            <div class="signature-line"></div>
                          </div>
                        </div>
                      </body>
                    </html>
                  `;
                  
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(printContent);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => printWindow.print(), 500);
                  }
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Print for Signature
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Patient Attachment Modal */}
      {selectedFormForPatient && (
        <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Attach to Patient</DialogTitle>
              <DialogDescription>
                Select a patient to attach this consent form: {selectedFormForPatient.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-3 max-h-80 overflow-y-auto">
                {patients.map((patient: any) => (
                  <Card key={patient.id} className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          // Here you would implement the patient attachment logic
                          toast({
                            title: "Success",
                            description: `Consent form attached to ${patient.firstName} ${patient.lastName}`,
                          });
                          setIsPatientModalOpen(false);
                        }}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{patient.title} {patient.firstName} {patient.lastName}</h4>
                          <p className="text-sm text-gray-500">
                            {patient.gender} • {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years
                          </p>
                          {patient.phone && (
                            <p className="text-sm text-gray-500">{patient.phone}</p>
                          )}
                        </div>
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPatientModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}