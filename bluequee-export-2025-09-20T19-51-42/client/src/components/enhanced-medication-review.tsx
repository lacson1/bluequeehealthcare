import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  FileText, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  Shield,
  Pill,
  Heart,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

// Enhanced medication review schema
const medicationReviewSchema = z.object({
  patientId: z.number(),
  reviewType: z.enum(['comprehensive', 'drug_interaction', 'allergy_check', 'adherence']).default('comprehensive'),
  drugInteractions: z.string().optional(),
  allergyCheck: z.string().optional(),
  dosageReview: z.string().optional(),
  contraindications: z.string().optional(),
  sideEffectsMonitoring: z.string().optional(),
  patientCounseling: z.string().optional(),
  medicationReconciliation: z.string().optional(),
  adherenceAssessment: z.string().optional(),
  dispensingInstructions: z.string().optional(),
  pharmacistRecommendations: z.string().optional(),
  clinicalNotes: z.string().optional(),
  followUpRequired: z.string().optional(),
  costConsiderations: z.string().optional(),
  therapeuticAlternatives: z.string().optional(),
  prescriptionsReviewed: z.number().default(0),
  reviewDuration: z.number().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

type MedicationReviewForm = z.infer<typeof medicationReviewSchema>;

interface EnhancedMedicationReviewProps {
  selectedPatientId?: number;
  onReviewCompleted?: () => void;
}

export function EnhancedMedicationReview({ selectedPatientId, onReviewCompleted }: EnhancedMedicationReviewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [searchPatientId, setSearchPatientId] = useState<string>("");
  const [activePatientId, setActivePatientId] = useState<number | undefined>(selectedPatientId);
  const [selectedReview, setSelectedReview] = useState<any>(null);

  // Fetch patients for selection
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
  });

  // Fetch patient's prescriptions for review
  const { data: prescriptions = [] } = useQuery({
    queryKey: ['/api/patients', activePatientId, 'prescriptions'],
    enabled: !!activePatientId,
  });

  // Fetch patient details
  const { data: selectedPatient } = useQuery({
    queryKey: ['/api/patients', activePatientId],
    enabled: !!activePatientId,
  });

  // Fetch medication reviews for the patient
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['/api/patients', activePatientId, 'medication-reviews'],
    enabled: !!activePatientId,
  });

  // Form for medication review
  const form = useForm<MedicationReviewForm>({
    resolver: zodResolver(medicationReviewSchema),
    defaultValues: {
      reviewType: 'comprehensive',
      priority: 'normal',
      prescriptionsReviewed: 0,
    },
  });

  // Mutation for creating medication review
  const createReview = useMutation({
    mutationFn: (data: MedicationReviewForm) => 
      apiRequest('POST', `/api/patients/${activePatientId}/medication-reviews`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Medication review completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patients', activePatientId, 'medication-reviews'] });
      setShowReviewDialog(false);
      form.reset();
      onReviewCompleted?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save medication review",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: MedicationReviewForm) => {
    if (!activePatientId) {
      toast({
        title: "Error",
        description: "Please select a patient first",
        variant: "destructive",
      });
      return;
    }
    
    const reviewData = {
      ...data,
      patientId: activePatientId,
      prescriptionsReviewed: prescriptions.length,
    };
    
    createReview.mutate(reviewData);
  };

  const handlePatientSelection = (patientIdStr: string) => {
    const patientId = parseInt(patientIdStr);
    setActivePatientId(patientId);
    form.setValue('patientId', patientId);
  };

  const getReviewTypeColor = (type: string) => {
    switch (type) {
      case 'comprehensive': return 'bg-blue-100 text-blue-800';
      case 'drug_interaction': return 'bg-red-100 text-red-800';
      case 'allergy_check': return 'bg-orange-100 text-orange-800';
      case 'adherence': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-green-50 border-b border-green-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Shield className="w-5 h-5" />
            Enhanced Medication Review
          </CardTitle>
          <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                disabled={!activePatientId}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Comprehensive Medication Review</DialogTitle>
                {selectedPatient && (
                  <p className="text-sm text-gray-600">
                    Patient: {selectedPatient.firstName} {selectedPatient.lastName} (ID: {selectedPatient.id})
                  </p>
                )}
              </DialogHeader>
              
              {/* Current Medications Section */}
              {selectedPatient && prescriptions.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Pill className="w-5 h-5" />
                    Current Medications for {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <div className="space-y-3">
                    {prescriptions.map((prescription: any, index: number) => (
                      <div key={prescription.id || index} className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Pill className="w-4 h-4 text-blue-600" />
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {prescription.medicationName || prescription.medication || 'Unknown Medication'}
                              </h4>
                              {prescription.status && (
                                <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                                  {prescription.status}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-xs text-gray-500 uppercase font-medium">Dosage</p>
                                <p className="text-sm font-medium text-gray-800">
                                  {prescription.dosage || 'Not specified'}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-xs text-gray-500 uppercase font-medium">Frequency</p>
                                <p className="text-sm font-medium text-gray-800">
                                  {prescription.frequency || 'Not specified'}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-xs text-gray-500 uppercase font-medium">Duration</p>
                                <p className="text-sm font-medium text-gray-800">
                                  {prescription.duration || 'Not specified'}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-xs text-gray-500 uppercase font-medium">Prescribed</p>
                                <p className="text-sm font-medium text-gray-800">
                                  {prescription.createdAt ? format(new Date(prescription.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            {prescription.instructions && (
                              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                                <p className="text-xs text-blue-600 uppercase font-medium mb-1">Special Instructions</p>
                                <p className="text-sm text-blue-800">{prescription.instructions}</p>
                              </div>
                            )}
                            
                            {prescription.doctorName && (
                              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                <User className="w-3 h-3" />
                                <span>Prescribed by: Dr. {prescription.doctorName}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-4 flex flex-col items-end gap-2">
                            <Button size="sm" variant="outline" className="text-xs">
                              <Heart className="w-3 h-3 mr-1" />
                              Check Interactions
                            </Button>
                            {prescription.quantity && (
                              <div className="text-xs text-gray-500 text-right">
                                <p>Qty: {prescription.quantity}</p>
                                {prescription.refills && <p>Refills: {prescription.refills}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-blue-700">
                    <strong>Total medications to review: {prescriptions.length}</strong>
                  </div>
                </div>
              )}

              {selectedPatient && prescriptions.length === 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">No current medications found for {selectedPatient.firstName} {selectedPatient.lastName}</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    This patient may not have any active prescriptions or they may need to be updated.
                  </p>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Tabs defaultValue="medications" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="medications">Current Meds</TabsTrigger>
                      <TabsTrigger value="clinical">Clinical Assessment</TabsTrigger>
                      <TabsTrigger value="counseling">Patient Counseling</TabsTrigger>
                      <TabsTrigger value="professional">Professional Notes</TabsTrigger>
                      <TabsTrigger value="summary">Review Summary</TabsTrigger>
                    </TabsList>

                    <TabsContent value="medications" className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">Medication Reconciliation</h4>
                        <FormField
                          control={form.control}
                          name="medicationReconciliation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reconciliation Notes</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Review and verify all current medications, document any discrepancies, discontinued medications, or new additions..."
                                  className="min-h-24"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">Drug Interactions & Contraindications</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="drugInteractions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Drug Interactions</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Document any identified drug interactions, severity, and recommendations..."
                                    className="min-h-20"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="contraindications"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contraindications</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Note any contraindications based on patient's medical history..."
                                    className="min-h-20"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="clinical" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="reviewType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Review Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="comprehensive">Comprehensive Review</SelectItem>
                                  <SelectItem value="drug_interaction">Drug Interaction Check</SelectItem>
                                  <SelectItem value="allergy_check">Allergy Assessment</SelectItem>
                                  <SelectItem value="adherence">Adherence Review</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="drugInteractions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Drug Interactions Assessment</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Check for potential drug-drug, drug-food, and drug-disease interactions..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="allergyCheck"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Allergy Assessment</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Review patient allergies and contraindications..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dosageReview"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dosage & Administration Review</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Assess appropriateness of dosing, frequency, and administration routes..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sideEffectsMonitoring"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Side Effects Monitoring</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Document monitoring plan for potential adverse effects..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="counseling" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="patientCounseling"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient Counseling Points</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Key counseling points provided to patient and family..."
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
                        name="medicationReconciliation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medication Reconciliation</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Reconcile current medications with patient's medication history..."
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
                        name="adherenceAssessment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adherence Assessment</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Assess patient's medication adherence and identify barriers..."
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
                        name="dispensingInstructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dispensing Instructions</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Special dispensing considerations and patient instructions..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="professional" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="pharmacistRecommendations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pharmacist Recommendations</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Clinical recommendations for healthcare team..."
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
                        name="clinicalNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clinical Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Additional clinical observations and notes..."
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
                        name="therapeuticAlternatives"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Therapeutic Alternatives</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Consider alternative medications or therapies if applicable..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="costConsiderations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cost Considerations</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Cost-effectiveness analysis and affordability considerations..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="summary" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="followUpRequired"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Follow-up Requirements</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Schedule for follow-up appointments and monitoring..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reviewDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Review Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="Time spent on this review"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {prescriptions.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">Current Prescriptions</h4>
                          <div className="space-y-1">
                            {prescriptions.slice(0, 5).map((prescription: any) => (
                              <div key={prescription.id} className="text-sm text-blue-700">
                                • {prescription.medicationName} - {prescription.dosage}
                              </div>
                            ))}
                            {prescriptions.length > 5 && (
                              <div className="text-sm text-blue-600">
                                +{prescriptions.length - 5} more prescriptions
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      type="submit" 
                      disabled={createReview.isPending}
                      className="flex-1"
                    >
                      {createReview.isPending ? "Saving Review..." : "Complete Review"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowReviewDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Patient Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Select Patient:</span>
            </div>
            <Select value={activePatientId?.toString() || ""} onValueChange={handlePatientSelection}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose a patient..." />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient: any) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    {patient.firstName} {patient.lastName} (ID: {patient.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPatient && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Patient Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {selectedPatient.firstName} {selectedPatient.lastName}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {selectedPatient.phone}
                </div>
                <div>
                  <span className="font-medium">Current Prescriptions:</span> {prescriptions.length}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Previous Reviews</h4>
          {reviewsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {activePatientId ? "No medication reviews found for this patient." : "Select a patient to view their medication reviews."}
            </div>
          ) : (
            reviews.map((review: any) => (
              <div key={review.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                   onClick={() => setSelectedReview(review)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getReviewTypeColor(review.reviewType)}>
                        {review.reviewType ? review.reviewType.replace('_', ' ') : 'Review'}
                      </Badge>
                      <Badge variant={getPriorityColor(review.priority)}>
                        {review.priority}
                      </Badge>
                      {review.prescriptionsReviewed > 0 && (
                        <span className="text-xs text-blue-600">
                          {review.prescriptionsReviewed} prescriptions reviewed
                        </span>
                      )}
                    </div>
                    
                    {review.pharmacistRecommendations && (
                      <div className="mb-2">
                        <span className="font-medium text-sm">Recommendations:</span>
                        <p className="text-sm text-gray-700 line-clamp-2">{review.pharmacistRecommendations}</p>
                      </div>
                    )}
                    
                    {review.followUpRequired && (
                      <div className="mb-2">
                        <span className="font-medium text-sm">Follow-up:</span>
                        <p className="text-sm text-gray-700 line-clamp-1">{review.followUpRequired}</p>
                      </div>
                    )}
                    
                    <div className="text-xs text-blue-600 hover:text-blue-800 mt-2">
                      Click to view full review details →
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(review.createdAt), 'hh:mm a')}
                    </div>
                    {review.reviewDuration && (
                      <div className="text-xs text-gray-500 mt-1">
                        Duration: {review.reviewDuration} min
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Review Details Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medication Review Details</DialogTitle>
            {selectedReview && (
              <p className="text-sm text-gray-600">
                Review conducted on {format(new Date(selectedReview.createdAt), 'MMMM dd, yyyy')} at {format(new Date(selectedReview.createdAt), 'hh:mm a')}
              </p>
            )}
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-6">
              {/* Review Header */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge className={getReviewTypeColor(selectedReview.reviewType)}>
                      {selectedReview.reviewType ? selectedReview.reviewType.replace('_', ' ') : 'Review'}
                    </Badge>
                    <Badge variant={getPriorityColor(selectedReview.priority)}>
                      {selectedReview.priority}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    Duration: {selectedReview.reviewDuration || 'N/A'} minutes
                  </div>
                </div>
                
                {selectedReview.prescriptionsReviewed > 0 && (
                  <div className="text-sm">
                    <strong className="text-blue-800">{selectedReview.prescriptionsReviewed}</strong> prescriptions were reviewed
                  </div>
                )}
              </div>

              {/* Clinical Assessment */}
              {selectedReview.clinicalAssessment && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Clinical Assessment
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReview.clinicalAssessment}</p>
                </div>
              )}

              {/* Medication Reconciliation */}
              {selectedReview.medicationReconciliation && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    Medication Reconciliation
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReview.medicationReconciliation}</p>
                </div>
              )}

              {/* Drug Interactions */}
              {selectedReview.drugInteractions && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Drug Interactions
                  </h4>
                  <p className="text-sm text-red-700 whitespace-pre-wrap">{selectedReview.drugInteractions}</p>
                </div>
              )}

              {/* Contraindications */}
              {selectedReview.contraindications && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Contraindications
                  </h4>
                  <p className="text-sm text-orange-700 whitespace-pre-wrap">{selectedReview.contraindications}</p>
                </div>
              )}

              {/* Pharmacist Recommendations */}
              {selectedReview.pharmacistRecommendations && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Pharmacist Recommendations
                  </h4>
                  <p className="text-sm text-green-700 whitespace-pre-wrap">{selectedReview.pharmacistRecommendations}</p>
                </div>
              )}

              {/* Patient Counseling */}
              {selectedReview.patientCounseling && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Patient Counseling Notes
                  </h4>
                  <p className="text-sm text-blue-700 whitespace-pre-wrap">{selectedReview.patientCounseling}</p>
                </div>
              )}

              {/* Follow-up Required */}
              {selectedReview.followUpRequired && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Follow-up Required
                  </h4>
                  <p className="text-sm text-yellow-700 whitespace-pre-wrap">{selectedReview.followUpRequired}</p>
                </div>
              )}

              {/* Professional Notes */}
              {selectedReview.professionalNotes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Professional Notes
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReview.professionalNotes}</p>
                </div>
              )}

              {/* Review Summary */}
              {selectedReview.reviewSummary && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Review Summary</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReview.reviewSummary}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}