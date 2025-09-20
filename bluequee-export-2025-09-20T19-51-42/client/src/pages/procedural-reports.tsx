import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, FileText, Plus, Edit, Eye, Stethoscope, Clock, User, AlertTriangle, CheckCircle, Search, Filter, Printer } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const proceduralReportSchema = z.object({
  patientId: z.coerce.number().min(1, "Patient is required"),
  performedBy: z.coerce.number().min(1, "Performing physician is required"),
  assistedBy: z.array(z.number()).default([]),
  procedureType: z.string().min(1, "Procedure type is required"),
  procedureName: z.string().min(1, "Procedure name is required"),
  indication: z.string().min(1, "Indication is required"),
  preOpDiagnosis: z.string().optional(),
  postOpDiagnosis: z.string().optional(),
  procedureDetails: z.string().min(1, "Procedure details are required"),
  findings: z.string().optional(),
  complications: z.string().optional(),
  specimens: z.string().optional(),
  anesthesia: z.string().optional(),
  duration: z.coerce.number().optional(),
  bloodLoss: z.coerce.number().optional(),
  status: z.string().default("completed"),
  scheduledDate: z.coerce.date().optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  postOpInstructions: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.coerce.date().optional(),
});

type ProceduralReportForm = z.infer<typeof proceduralReportSchema>;

const PROCEDURE_TYPES = [
  "Surgery",
  "Endoscopy",
  "Biopsy",
  "Colonoscopy",
  "Gastroscopy",
  "Bronchoscopy",
  "Cystoscopy",
  "Arthroscopy",
  "Laparoscopy",
  "Minor Procedure",
  "Diagnostic Procedure",
  "Therapeutic Procedure"
];

const ANESTHESIA_TYPES = [
  "Local Anesthesia",
  "Regional Anesthesia",
  "General Anesthesia",
  "Sedation",
  "Spinal Anesthesia",
  "Epidural",
  "None"
];

export default function ProceduralReports() {
  const [selectedTab, setSelectedTab] = useState("list");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Check URL parameters for pre-filling from visit recording
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    const visitId = urlParams.get('visitId');
    const shouldPrefill = urlParams.get('prefill') === 'true';

    if (patientId && shouldPrefill) {
      // Auto-open create modal and pre-fill patient
      setIsCreateModalOpen(true);
      form.setValue('patientId', parseInt(patientId));
      
      // Show helpful message
      toast({
        title: "Visit Context Loaded",
        description: "Procedural report form pre-filled with patient information from recorded visit.",
        duration: 4000,
      });

      // Clear URL parameters after processing
      window.history.replaceState({}, '', '/procedural-reports');
    }
  }, []);

  // Fetch procedural reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/procedural-reports"],
  });

  // Fetch patients for dropdown
  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"],
  });

  // Fetch staff for dropdown
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/organization/staff"],
  });

  const form = useForm<ProceduralReportForm>({
    resolver: zodResolver(proceduralReportSchema),
    defaultValues: {
      patientId: 0,
      performedBy: 0,
      procedureType: "",
      procedureName: "",
      indication: "",
      preOpDiagnosis: "",
      postOpDiagnosis: "",
      procedureDetails: "",
      findings: "",
      complications: "",
      specimens: "",
      anesthesia: "",
      duration: undefined,
      bloodLoss: undefined,
      assistedBy: [],
      status: "completed",
      followUpRequired: false,
      postOpInstructions: "",
      scheduledDate: undefined,
      startTime: undefined,
      endTime: undefined,
      followUpDate: undefined,
    },
  });

  const createReportMutation = useMutation({
    mutationFn: (data: ProceduralReportForm) => 
      apiRequest("/api/procedural-reports", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedural-reports"] });
      toast({
        title: "Success",
        description: "Procedural report created successfully.",
      });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create procedural report.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProceduralReportForm) => {
    // Transform the data to match backend expectations
    const transformedData = {
      ...data,
      // Ensure numbers are properly converted
      patientId: Number(data.patientId),
      performedBy: Number(data.performedBy),
      duration: data.duration ? Number(data.duration) : undefined,
      bloodLoss: data.bloodLoss ? Number(data.bloodLoss) : undefined,
      // Convert dates to ISO strings if they exist
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate).toISOString() : undefined,
      startTime: data.startTime ? new Date(data.startTime).toISOString() : undefined,
      endTime: data.endTime ? new Date(data.endTime).toISOString() : undefined,
      followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString().split('T')[0] : undefined,
      // Remove empty strings and replace with undefined for optional fields
      preOpDiagnosis: data.preOpDiagnosis || undefined,
      postOpDiagnosis: data.postOpDiagnosis || undefined,
      findings: data.findings || undefined,
      complications: data.complications || undefined,
      specimens: data.specimens || undefined,
      anesthesia: data.anesthesia || undefined,
      postOpInstructions: data.postOpInstructions || undefined,
    };

    console.log('Submitting procedural report:', transformedData);
    createReportMutation.mutate(transformedData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredReports = reports.filter((report: any) => {
    const matchesSearch = 
      report.procedureName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.procedureType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procedural Reports</h1>
          <p className="text-muted-foreground">
            Manage surgical and procedural documentation
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Procedure Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Procedural Report</DialogTitle>
              <DialogDescription>
                Document a surgical or diagnostic procedure performed on a patient.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patient Selection */}
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patients.map((patient: any) => (
                              <SelectItem key={patient.id} value={patient.id.toString()}>
                                {patient.firstName} {patient.lastName} - DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Performing Physician */}
                  <FormField
                    control={form.control}
                    name="performedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Performed By</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select physician" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {staff.filter((s: any) => s.role === 'doctor' || s.role === 'admin').map((doctor: any) => (
                              <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                {doctor.title || 'Dr.'} {doctor.firstName && doctor.lastName 
                                  ? `${doctor.firstName} ${doctor.lastName}` 
                                  : doctor.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Procedure Type */}
                  <FormField
                    control={form.control}
                    name="procedureType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Procedure Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select procedure type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROCEDURE_TYPES.map((type) => (
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

                  {/* Procedure Name */}
                  <FormField
                    control={form.control}
                    name="procedureName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Procedure Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Appendectomy, Colonoscopy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Anesthesia */}
                  <FormField
                    control={form.control}
                    name="anesthesia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anesthesia Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select anesthesia type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ANESTHESIA_TYPES.map((type) => (
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

                  {/* Duration */}
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 45" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Indication */}
                <FormField
                  control={form.control}
                  name="indication"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Indication for Procedure</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Reason for performing this procedure..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pre/Post Op Diagnosis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="preOpDiagnosis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pre-Operative Diagnosis</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Diagnosis before procedure..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postOpDiagnosis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Post-Operative Diagnosis</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Diagnosis after procedure..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Theatre/Procedure Documentation Section */}
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Theatre/Procedure Documentation</h3>
                    
                    {/* Procedure Details */}
                    <FormField
                      control={form.control}
                      name="procedureDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detailed Procedure Description</FormLabel>
                          <FormDescription>
                            Document exactly what was performed step-by-step during the procedure
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              placeholder="Step-by-step description of the procedure:
- Patient positioning and preparation
- Surgical approach taken
- Key steps performed
- Techniques used
- Equipment utilized
- Any modifications to standard technique..." 
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Operative Findings */}
                    <FormField
                      control={form.control}
                      name="findings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Operative Findings</FormLabel>
                          <FormDescription>
                            What was observed during the procedure - anatomy, pathology, unexpected findings
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              placeholder="Document what was found during the procedure:
- Normal anatomy observed
- Pathological findings
- Unexpected discoveries
- Anatomical variations
- Condition of tissues
- Size, location, and appearance of lesions..." 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Intraoperative Events */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bloodLoss"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Blood Loss (ml)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g., 50" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Procedure Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g., 45" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Complications */}
                    <FormField
                      control={form.control}
                      name="complications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Intraoperative Complications</FormLabel>
                          <FormDescription>
                            Document any complications or adverse events during the procedure
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              placeholder="Record any complications that occurred:
- Bleeding complications
- Technical difficulties
- Equipment malfunctions
- Anesthetic complications
- Unexpected anatomical findings requiring modification
- How complications were managed

If no complications occurred, state 'No intraoperative complications'" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Specimens */}
                    <FormField
                      control={form.control}
                      name="specimens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specimens Collected</FormLabel>
                          <FormDescription>
                            Detail any tissue samples, biopsies, or specimens sent for analysis
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              placeholder="Document specimens taken:
- Type of specimen (biopsy, excision, etc.)
- Location/site of collection
- Size and description
- Container type and preservation method
- Laboratory destination
- Requisition numbers
- Special handling instructions..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>



                {/* Complications & Specimens */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="complications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complications</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any complications encountered..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specimens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specimens</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Specimens taken for analysis..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Post-Op Instructions */}
                <FormField
                  control={form.control}
                  name="postOpInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post-Operative Instructions</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Instructions for patient post-procedure..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Follow-up */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="followUpRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Follow-up Required</FormLabel>
                          <FormDescription>
                            Check if patient needs follow-up appointment
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("followUpRequired") && (
                    <FormField
                      control={form.control}
                      name="followUpDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Follow-up Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-[240px] pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date()
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
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
                    disabled={createReportMutation.isPending}
                  >
                    {createReportMutation.isPending ? "Creating..." : "Create Report"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="list">All Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search procedures, patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reports List */}
          <div className="grid gap-4">
            {reportsLoading ? (
              <div className="text-center py-8">Loading procedural reports...</div>
            ) : filteredReports.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">No procedural reports found</p>
                  <p className="text-sm text-gray-400">Create your first procedural report to get started</p>
                </CardContent>
              </Card>
            ) : (
              filteredReports.map((report: any) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {report.procedureName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {report.patientName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Stethoscope className="w-4 h-4" />
                            Dr. {report.performerName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(report.status)}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Type:</span> {report.procedureType}
                      </div>
                      {report.indication && (
                        <div>
                          <span className="font-medium">Indication:</span> {report.indication}
                        </div>
                      )}
                      {report.duration && (
                        <div>
                          <span className="font-medium">Duration:</span> {report.duration} minutes
                        </div>
                      )}
                      {report.complications && (
                        <div className="flex items-start gap-2 text-red-600">
                          <AlertTriangle className="w-4 h-4 mt-0.5" />
                          <div>
                            <span className="font-medium">Complications:</span> {report.complications}
                          </div>
                        </div>
                      )}
                      {report.followUpRequired && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Follow-up required on {new Date(report.followUpDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="scheduled">
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">Scheduled procedures will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p className="text-gray-500">Completed procedures will appear here</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Report Details Modal */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedReport.procedureName}
              </DialogTitle>
              <DialogDescription>
                Procedure performed on {new Date(selectedReport.createdAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Patient</Label>
                  <p className="text-sm">{selectedReport.patientName || `Patient #${selectedReport.patientId}`}</p>
                </div>
                <div>
                  <Label className="font-medium">Performed By</Label>
                  <p className="text-sm">{selectedReport.performerName || `Staff #${selectedReport.performedBy}`}</p>
                </div>
                <div>
                  <Label className="font-medium">Procedure Type</Label>
                  <p className="text-sm">{selectedReport.procedureType}</p>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                </div>
              </div>

              {/* Clinical Details */}
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Clinical Information</h3>
                
                <div>
                  <Label className="font-medium">Indication</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    {selectedReport.indication}
                  </p>
                </div>

                {selectedReport.preOpDiagnosis && (
                  <div>
                    <Label className="font-medium">Pre-operative Diagnosis</Label>
                    <p className="text-sm mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      {selectedReport.preOpDiagnosis}
                    </p>
                  </div>
                )}

                {selectedReport.postOpDiagnosis && (
                  <div>
                    <Label className="font-medium">Post-operative Diagnosis</Label>
                    <p className="text-sm mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      {selectedReport.postOpDiagnosis}
                    </p>
                  </div>
                )}
              </div>

              {/* Theatre Documentation */}
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Theatre Documentation</h3>
                
                <div>
                  <Label className="font-medium">Procedure Details</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md whitespace-pre-wrap">
                    {selectedReport.procedureDetails}
                  </p>
                </div>

                {selectedReport.findings && (
                  <div>
                    <Label className="font-medium">Operative Findings</Label>
                    <p className="text-sm mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md whitespace-pre-wrap">
                      {selectedReport.findings}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedReport.anesthesia && (
                    <div>
                      <Label className="font-medium">Anesthesia</Label>
                      <p className="text-sm">{selectedReport.anesthesia}</p>
                    </div>
                  )}
                  {selectedReport.duration && (
                    <div>
                      <Label className="font-medium">Duration</Label>
                      <p className="text-sm">{selectedReport.duration} minutes</p>
                    </div>
                  )}
                  {selectedReport.bloodLoss && (
                    <div>
                      <Label className="font-medium">Blood Loss</Label>
                      <p className="text-sm">{selectedReport.bloodLoss} ml</p>
                    </div>
                  )}
                </div>

                {selectedReport.complications && (
                  <div>
                    <Label className="font-medium">Complications</Label>
                    <p className="text-sm mt-1 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      {selectedReport.complications}
                    </p>
                  </div>
                )}

                {selectedReport.specimens && (
                  <div>
                    <Label className="font-medium">Specimens Collected</Label>
                    <p className="text-sm mt-1 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md whitespace-pre-wrap">
                      {selectedReport.specimens}
                    </p>
                  </div>
                )}
              </div>

              {/* Post-operative Care */}
              {selectedReport.postOpInstructions && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Post-operative Instructions</h3>
                    <p className="text-sm p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md whitespace-pre-wrap">
                      {selectedReport.postOpInstructions}
                    </p>
                  </div>
                </>
              )}

              {/* Follow-up Information */}
              {selectedReport.followUpRequired && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Follow-up Required</h3>
                    <div className="flex items-center gap-2 text-blue-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Follow-up appointment scheduled</span>
                      {selectedReport.followUpDate && (
                        <span>for {new Date(selectedReport.followUpDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedReport(null)}>
                Close
              </Button>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Report
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // Generate printable procedural report
                  const printContent = `
                    <html>
                      <head>
                        <title>Procedural Report - ${selectedReport.procedureName}</title>
                        <style>
                          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
                          .org-header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2D5A27; padding-bottom: 15px; }
                          .org-name { color: #2D5A27; font-size: 24px; font-weight: bold; margin: 0; }
                          .org-tagline { color: #666; font-size: 14px; margin: 5px 0; font-style: italic; }
                          .org-contact { color: #666; font-size: 12px; margin: 0; }
                          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                          .section { margin-bottom: 25px; page-break-inside: avoid; }
                          .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                          .field { margin-bottom: 10px; }
                          .label { font-weight: bold; margin-bottom: 5px; }
                          .content { margin-bottom: 15px; }
                          @media print { body { margin: 20px; } }
                        </style>
                      </head>
                      <body>
                        <div class="org-header">
                          <h1 class="org-name">LAGOS ISLAND HOSPITAL</h1>
                          <p class="org-tagline">Excellence in Healthcare - Committed to Your Wellbeing</p>
                          <p class="org-contact">📍 Lagos Island, Lagos State | 📞 +234-XXX-XXXX-XXX | 📧 info@lagosislandhospital.ng</p>
                        </div>
                        
                        <div class="header">
                          <h1>PROCEDURAL REPORT</h1>
                          <h2>${selectedReport.procedureName}</h2>
                          <p>Date: ${new Date(selectedReport.createdAt).toLocaleDateString()}</p>
                        </div>
                        
                        <div class="section">
                          <div class="section-title">Patient Information</div>
                          <div class="grid">
                            <div class="field">
                              <div class="label">Patient:</div>
                              <div>${selectedReport.patientName || `Patient #${selectedReport.patientId}`}</div>
                            </div>
                            <div class="field">
                              <div class="label">Procedure Type:</div>
                              <div>${selectedReport.procedureType}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div class="section">
                          <div class="section-title">Clinical Details</div>
                          <div class="field">
                            <div class="label">Indication:</div>
                            <div class="content">${selectedReport.indication}</div>
                          </div>
                          ${selectedReport.preOpDiagnosis ? `
                            <div class="field">
                              <div class="label">Pre-operative Diagnosis:</div>
                              <div class="content">${selectedReport.preOpDiagnosis}</div>
                            </div>
                          ` : ''}
                          ${selectedReport.postOpDiagnosis ? `
                            <div class="field">
                              <div class="label">Post-operative Diagnosis:</div>
                              <div class="content">${selectedReport.postOpDiagnosis}</div>
                            </div>
                          ` : ''}
                        </div>
                        
                        <div class="section">
                          <div class="section-title">Procedure Documentation</div>
                          <div class="field">
                            <div class="label">Procedure Details:</div>
                            <div class="content">${selectedReport.procedureDetails.replace(/\n/g, '<br>')}</div>
                          </div>
                          ${selectedReport.findings ? `
                            <div class="field">
                              <div class="label">Operative Findings:</div>
                              <div class="content">${selectedReport.findings.replace(/\n/g, '<br>')}</div>
                            </div>
                          ` : ''}
                          <div class="grid">
                            ${selectedReport.anesthesia ? `
                              <div class="field">
                                <div class="label">Anesthesia:</div>
                                <div>${selectedReport.anesthesia}</div>
                              </div>
                            ` : ''}
                            ${selectedReport.duration ? `
                              <div class="field">
                                <div class="label">Duration:</div>
                                <div>${selectedReport.duration} minutes</div>
                              </div>
                            ` : ''}
                            ${selectedReport.bloodLoss ? `
                              <div class="field">
                                <div class="label">Blood Loss:</div>
                                <div>${selectedReport.bloodLoss} ml</div>
                              </div>
                            ` : ''}
                          </div>
                          ${selectedReport.complications ? `
                            <div class="field">
                              <div class="label">Complications:</div>
                              <div class="content" style="color: red; font-weight: bold;">${selectedReport.complications}</div>
                            </div>
                          ` : ''}
                          ${selectedReport.specimens ? `
                            <div class="field">
                              <div class="label">Specimens Collected:</div>
                              <div class="content">${selectedReport.specimens.replace(/\n/g, '<br>')}</div>
                            </div>
                          ` : ''}
                        </div>
                        
                        ${selectedReport.postOpInstructions ? `
                          <div class="section">
                            <div class="section-title">Post-operative Instructions</div>
                            <div class="content">${selectedReport.postOpInstructions.replace(/\n/g, '<br>')}</div>
                          </div>
                        ` : ''}
                        
                        <div class="section">
                          <div class="section-title">Healthcare Provider</div>
                          <div class="field">
                            <div class="label">Performed By:</div>
                            <div>${selectedReport.performerName || `Staff #${selectedReport.performedBy}`}</div>
                          </div>
                          <div class="field">
                            <div class="label">Signature:</div>
                            <div style="border-bottom: 1px solid #333; height: 40px; margin-top: 20px;"></div>
                          </div>
                          <div class="field">
                            <div class="label">Date:</div>
                            <div style="border-bottom: 1px solid #333; height: 40px; margin-top: 20px;"></div>
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
                <Printer className="w-4 h-4 mr-2" />
                Print Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}