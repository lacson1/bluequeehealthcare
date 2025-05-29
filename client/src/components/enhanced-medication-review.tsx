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

  // Fetch patients for selection
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
  });

  // Fetch patient's prescriptions for review
  const { data: prescriptions = [] } = useQuery({
    queryKey: ['/api/patients', activePatientId, 'prescriptions'],
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

  const selectedPatient = patients.find((p: any) => p.id === activePatientId);

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
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Tabs defaultValue="clinical" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="clinical">Clinical Assessment</TabsTrigger>
                      <TabsTrigger value="counseling">Patient Counseling</TabsTrigger>
                      <TabsTrigger value="professional">Professional Notes</TabsTrigger>
                      <TabsTrigger value="summary">Review Summary</TabsTrigger>
                    </TabsList>

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
              <div key={review.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getReviewTypeColor(review.reviewType)}>
                        {review.reviewType.replace('_', ' ')}
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
                        <p className="text-sm text-gray-700">{review.pharmacistRecommendations}</p>
                      </div>
                    )}
                    
                    {review.followUpRequired && (
                      <div className="mb-2">
                        <span className="font-medium text-sm">Follow-up:</span>
                        <p className="text-sm text-gray-700">{review.followUpRequired}</p>
                      </div>
                    )}
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
    </Card>
  );
}