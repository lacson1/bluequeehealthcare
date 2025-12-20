import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Users, Calendar, ArrowRight, CheckCircle, XCircle, Clock, Plus, Mail, Send, Loader2, Printer } from "lucide-react";
import { Patient } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { SPECIALTIES_WITH_OTHER } from "@/lib/medical-specialties";

const referralSchema = z.object({
  specialty: z.string().min(1, "Specialty is required"),
  referredToDoctor: z.string().optional(),
  referredToFacility: z.string().optional(),
  reason: z.string().min(1, "Reason is required"),
  urgency: z.enum(["routine", "urgent", "non-urgent"]).default("routine"),
  appointmentDate: z.string().optional(),
  notes: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional(),
});

type ReferralFormData = z.infer<typeof referralSchema>;

const emailSchema = z.object({
  recipientEmail: z.string().email("Invalid email address"),
  recipientName: z.string().optional(),
  notes: z.string().optional(),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface Referral {
  id: number;
  patientId: number;
  specialty?: string;
  referredToDoctor?: string;
  referredToFacility?: string;
  reason?: string;
  urgency?: string;
  status: string;
  referralDate: string;
  appointmentDate?: string;
  notes?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  referringDoctor?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

interface ReferralsTabProps {
  patient: Patient;
}

export function ReferralsTab({ patient }: ReferralsTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedReferralForEmail, setSelectedReferralForEmail] = useState<Referral | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listen for custom event to open referral dialog from tab trigger
  useEffect(() => {
    const handleOpenDialog = () => {
      setIsDialogOpen(true);
    };

    window.addEventListener('openReferralDialog', handleOpenDialog);
    return () => {
      window.removeEventListener('openReferralDialog', handleOpenDialog);
    };
  }, []);

  // Safety check: ensure patient exists and has an id
  if (!patient || !patient.id) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500">Patient information not available</p>
        </div>
      </div>
    );
  }

  const { data: referrals, isLoading } = useQuery<Referral[]>({
    queryKey: [`/api/patients/${patient.id}/referrals`],
    enabled: !!patient?.id,
  });

  const form = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      urgency: "routine",
      followUpRequired: false,
    },
  });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      recipientEmail: "",
      recipientName: "",
      notes: "",
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: EmailFormData & { referralId: number }) => {
      if (!patient?.id) {
        throw new Error("Patient ID is required");
      }
      const response = await apiRequest(
        `/api/patients/${patient.id}/referrals/${data.referralId}/send-email`,
        "POST",
        {
          recipientEmail: data.recipientEmail,
          recipientName: data.recipientName,
          notes: data.notes,
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/referrals`] });
      toast({
        title: "Email Sent",
        description: "Referral has been sent via email successfully",
      });
      setIsEmailDialogOpen(false);
      setSelectedReferralForEmail(null);
      emailForm.reset();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to send email";
      const message = errorMessage.includes(":")
        ? errorMessage.split(":").slice(1).join(":").trim()
        : errorMessage;

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = (referral: Referral) => {
    setSelectedReferralForEmail(referral);
    setIsEmailDialogOpen(true);
  };

  const handlePrint = (referral: Referral) => {
    // Open print view in a new window
    const printUrl = `/api/patients/${patient.id}/referrals/${referral.id}/print`;
    const printWindow = window.open(printUrl, '_blank', 'width=800,height=600');
    
    // Wait for the page to load then trigger print
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  };

  const onEmailSubmit = (data: EmailFormData) => {
    if (selectedReferralForEmail) {
      sendEmailMutation.mutate({
        ...data,
        referralId: selectedReferralForEmail.id,
      });
    }
  };

  const createReferralMutation = useMutation({
    mutationFn: async (data: ReferralFormData) => {
      if (!patient?.id) {
        throw new Error("Patient ID is required");
      }
      const response = await apiRequest(`/api/patients/${patient.id}/referrals`, "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/referrals`] });
      toast({
        title: "Success",
        description: "Referral created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to create referral";
      // Parse error message if it contains status code
      const message = errorMessage.includes(":") 
        ? errorMessage.split(":").slice(1).join(":").trim() 
        : errorMessage;
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReferralFormData) => {
    createReferralMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!referrals || referrals.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Referrals</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Referral
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Referral</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="specialty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialty *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select specialty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SPECIALTIES_WITH_OTHER.map((specialty) => (
                                <SelectItem key={specialty} value={specialty}>
                                  {specialty}
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
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Urgency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "routine"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="routine">Routine</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                              <SelectItem value="non-urgent">Non-Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="referredToDoctor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referred To Doctor</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Doctor name (optional)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referredToFacility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referred To Facility</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Facility name (optional)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for Referral *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe the reason for this referral"
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="appointmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Appointment Date</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Any additional information"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followUpRequired"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="rounded"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">
                          Follow-up required
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {form.watch("followUpRequired") && (
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
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createReferralMutation.isPending}>
                      {createReferralMutation.isPending ? "Creating..." : "Create Referral"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <EmptyState
          icon={Users}
          title="No Referrals"
          description="No referrals have been made for this patient. Click 'Add Referral' to create one."
        />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
      case "completed":
        return <Badge className="bg-green-600">Accepted</Badge>;
      case "rejected":
      case "cancelled":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Referrals</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Referral
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Referral</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialty *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select specialty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SPECIALTIES_WITH_OTHER.map((specialty) => (
                              <SelectItem key={specialty} value={specialty}>
                                {specialty}
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
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "routine"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="routine">Routine</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="non-urgent">Non-Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="referredToDoctor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referred To Doctor</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Doctor name (optional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referredToFacility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referred To Facility</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Facility name (optional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Referral *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the reason for this referral"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appointment Date</FormLabel>
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any additional information"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="followUpRequired"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded"
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer">
                        Follow-up required
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {form.watch("followUpRequired") && (
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
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createReferralMutation.isPending}>
                    {createReferralMutation.isPending ? "Creating..." : "Create Referral"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {referrals.map((referral) => (
        <Card key={referral.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-blue-600" />
                Referral to {referral.specialty || referral.referredToDoctor || "Specialist"}
              </CardTitle>
              {getStatusBadge(referral.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {referral.referredToDoctor && (
              <div>
                <span className="text-xs text-gray-500">Referred To</span>
                <p className="text-sm font-medium">{referral.referredToDoctor}</p>
              </div>
            )}
            {referral.referredToFacility && (
              <div>
                <span className="text-xs text-gray-500">Facility</span>
                <p className="text-sm font-medium">{referral.referredToFacility}</p>
              </div>
            )}
            {referral.reason && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Reason</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{referral.reason}</p>
              </div>
            )}
            {referral.urgency && (
              <div>
                <Badge variant={referral.urgency === "urgent" ? "destructive" : "secondary"}>
                  {referral.urgency.charAt(0).toUpperCase() + referral.urgency.slice(1)}
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Referral Date: {format(new Date(referral.referralDate), "MMM d, yyyy")}</span>
            </div>
            {referral.referringDoctor && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>Referred by: {referral.referringDoctor.firstName && referral.referringDoctor.lastName 
                  ? `${referral.referringDoctor.firstName} ${referral.referringDoctor.lastName}`
                  : referral.referringDoctor.username}</span>
              </div>
            )}
            {referral.appointmentDate && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Appointment Date: {format(new Date(referral.appointmentDate), "MMM d, yyyy")}</span>
              </div>
            )}
            {referral.notes && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Notes</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{referral.notes}</p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="pt-3 border-t flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrint(referral)}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendEmail(referral)}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Send via Email
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={(open) => {
        setIsEmailDialogOpen(open);
        if (!open) {
          setSelectedReferralForEmail(null);
          emailForm.reset();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Send Referral via Email
            </DialogTitle>
            <DialogDescription>
              Send this referral to the specialist or receiving facility via email.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReferralForEmail && (
            <div className="bg-muted/50 p-3 rounded-lg mb-4">
              <p className="text-sm font-medium">Referral Details:</p>
              <p className="text-sm text-muted-foreground">
                {selectedReferralForEmail.specialty} - {selectedReferralForEmail.urgency?.charAt(0).toUpperCase()}{selectedReferralForEmail.urgency?.slice(1) || 'Routine'}
              </p>
            </div>
          )}
          
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="doctor@hospital.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={emailForm.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Dr. John Smith (optional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={emailForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Message</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Any additional information to include in the email..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEmailDialogOpen(false);
                    setSelectedReferralForEmail(null);
                    emailForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={sendEmailMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {sendEmailMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

