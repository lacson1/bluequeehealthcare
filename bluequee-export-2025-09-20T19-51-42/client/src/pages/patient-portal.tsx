import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import EnhancedBloodTestResults from "@/components/EnhancedBloodTestResults";
import EnhancedMedicationManager from "@/components/EnhancedMedicationManager";
import {
  User,
  Calendar,
  FileText,
  Pill,
  Activity,
  Clock,
  Download,
  MessageCircle,
  Shield,
  Bell,
  Heart,
  TestTube,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  LogOut,
  AlertCircle
} from "lucide-react";

const loginSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  phone: z.string().min(1, 'Phone number is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
});

const appointmentRequestSchema = z.object({
  type: z.string().min(1, "Appointment type is required"),
  preferredDate: z.string().min(1, "Preferred date is required"),
  preferredTime: z.string().min(1, "Preferred time is required"),
  reason: z.string().min(1, "Reason for visit is required"),
  urgency: z.enum(["routine", "urgent", "emergency"])
});

const messageSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  category: z.enum(["general", "medical", "billing", "prescription"])
});

// Custom fetch function with authentication
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('patientToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('patientToken');
      localStorage.removeItem('patientData');
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// Login Component
const PatientLogin = ({ onLogin }: { onLogin: (data: any) => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      patientId: '',
      phone: '',
      dateOfBirth: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/patient-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const result = await response.json();
      
      localStorage.setItem('patientToken', result.token);
      localStorage.setItem('patientData', JSON.stringify(result.patient));
      
      onLogin(result);
      
      toast({
        title: 'Login Successful',
        description: 'Welcome to your patient portal',
      });
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4 px-6 sm:px-4">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Patient Portal</h1>
          <p className="text-sm sm:text-base text-gray-600">Access your healthcare information securely</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In to Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Patient ID
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your Patient ID"
                          className="h-10 sm:h-12 text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your registered phone number"
                          className="h-10 sm:h-12 text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date of Birth
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="h-10 sm:h-12 text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-10 sm:h-12 text-sm sm:text-base"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-medium text-orange-900">Need Help?</h3>
                <div className="text-sm text-orange-800 space-y-1">
                  <p>• Your Patient ID was provided during registration</p>
                  <p>• Use the phone number registered with your account</p>
                  <p>• Enter your date of birth in YYYY-MM-DD format</p>
                  <p>• Contact reception if you need assistance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main Patient Portal Component
const PatientPortalContent = ({ patient, onLogout }: { patient: any; onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Custom query client with authentication
  const authenticatedQuery = (url: string) => {
    return useQuery({
      queryKey: [url],
      queryFn: () => authenticatedFetch(url),
      retry: (failureCount, error) => {
        if (error?.message?.includes('Session expired')) {
          onLogout();
          return false;
        }
        return failureCount < 3;
      },
    });
  };

  // Queries with authentication
  const { data: appointments = [] } = authenticatedQuery("/api/patient-portal/appointments");
  const { data: prescriptions = [] } = authenticatedQuery("/api/patient-portal/prescriptions");
  const { data: labResults = [] } = authenticatedQuery("/api/patient-portal/lab-results");
  const { data: medicalRecords = [] } = authenticatedQuery("/api/patient-portal/medical-records");
  const { data: messages = [] } = authenticatedQuery("/api/patient-portal/messages");

  // Forms
  const appointmentForm = useForm<z.infer<typeof appointmentRequestSchema>>({
    resolver: zodResolver(appointmentRequestSchema),
    defaultValues: {
      type: "",
      preferredDate: "",
      preferredTime: "",
      reason: "",
      urgency: "routine"
    }
  });

  const messageForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      subject: "",
      message: "",
      category: "general"
    }
  });

  // Mutations
  const appointmentRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof appointmentRequestSchema>) => {
      return authenticatedFetch("/api/patient-portal/appointment-requests", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: "Appointment Requested", description: "Your appointment request has been submitted." });
      setIsAppointmentDialogOpen(false);
      appointmentForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/patient-portal/appointments"] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof messageSchema>) => {
      // Add target organization ID (default to 4 for Enugu clinic where staff can see messages)
      const messageData = {
        ...data,
        targetOrganizationId: 4
      };
      return authenticatedFetch("/api/patient-portal/messages", {
        method: "POST",
        body: JSON.stringify(messageData)
      });
    },
    onSuccess: () => {
      toast({ title: "Message Sent", description: "Your message has been sent to your healthcare provider." });
      setIsMessageDialogOpen(false);
      messageForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/patient-portal/messages"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleLabAction = (action: string, data?: any) => {
    switch (action) {
      case 'download':
        toast({ title: "Download Started", description: "Your lab results PDF is being generated." });
        // TODO: Implement PDF generation
        break;
      case 'share':
        toast({ title: "Share", description: "Lab results sharing feature coming soon." });
        // TODO: Implement sharing functionality
        break;
      case 'alerts':
        toast({ title: "Alerts", description: "Lab alerts feature coming soon." });
        // TODO: Implement alerts functionality
        break;
      default:
        console.log('Lab action:', action, data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "active": return "bg-green-100 text-green-800";
      case "expired": return "bg-gray-100 text-gray-800";
      case "normal": return "bg-green-100 text-green-800";
      case "abnormal": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "low": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const onRequestAppointment = (data: z.infer<typeof appointmentRequestSchema>) => {
    appointmentRequestMutation.mutate(data);
  };

  const onSendMessage = (data: z.infer<typeof messageSchema>) => {
    sendMessageMutation.mutate(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('patientToken');
    localStorage.removeItem('patientData');
    
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out',
    });
    
    // Reload the page to reset the authentication state
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <User className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            Patient Portal
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Access your health information and communicate with your care team</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-xs sm:text-sm px-3 sm:px-4 py-2">
                <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Send </span>Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Message to Healthcare Provider</DialogTitle>
              </DialogHeader>
              <Form {...messageForm}>
                <form onSubmit={messageForm.handleSubmit((data) => sendMessageMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={messageForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full p-2 border rounded-md">
                            <option value="general">General Inquiry</option>
                            <option value="medical">Medical Question</option>
                            <option value="billing">Billing Question</option>
                            <option value="prescription">Prescription Request</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={messageForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter subject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={messageForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Enter your message" rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={sendMessageMutation.isPending}>
                      {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs sm:text-sm px-3 sm:px-4 py-2">
                <Calendar className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Request </span>Appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request New Appointment</DialogTitle>
              </DialogHeader>
              <Form {...appointmentForm}>
                <form onSubmit={appointmentForm.handleSubmit((data) => appointmentRequestMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={appointmentForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Appointment Type</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full p-2 border rounded-md">
                            <option value="">Select appointment type</option>
                            <option value="consultation">General Consultation</option>
                            <option value="follow-up">Follow-up Visit</option>
                            <option value="specialist">Specialist Consultation</option>
                            <option value="lab">Laboratory Tests</option>
                            <option value="procedure">Medical Procedure</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={appointmentForm.control}
                      name="preferredDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Date</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={appointmentForm.control}
                      name="preferredTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Time</FormLabel>
                          <FormControl>
                            <select {...field} className="w-full p-2 border rounded-md">
                              <option value="">Select time</option>
                              <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
                              <option value="afternoon">Afternoon (12:00 PM - 5:00 PM)</option>
                              <option value="evening">Evening (5:00 PM - 8:00 PM)</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={appointmentForm.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full p-2 border rounded-md">
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent (within 1 week)</option>
                            <option value="emergency">Emergency (immediate)</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={appointmentForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for Visit</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Please describe your symptoms or reason for the visit" rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsAppointmentDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={appointmentRequestMutation.isPending}>
                      {appointmentRequestMutation.isPending ? "Requesting..." : "Request Appointment"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Log </span>Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Home</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Appointments</span>
            <span className="sm:hidden">Appts</span>
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <Pill className="h-4 w-4" />
            <span className="hidden sm:inline">Prescriptions</span>
            <span className="sm:hidden">Meds</span>
          </TabsTrigger>
          <TabsTrigger value="lab-results" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <TestTube className="h-4 w-4" />
            <span className="hidden sm:inline">Lab Results</span>
            <span className="sm:hidden">Labs</span>
          </TabsTrigger>
          <TabsTrigger value="records" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Medical Records</span>
            <span className="sm:hidden">Records</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
            <span className="sm:hidden">Chat</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Patient Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Personal Information</h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <p><strong>Name:</strong> {patient.title} {patient.firstName} {patient.lastName}</p>
                      <p><strong>Date of Birth:</strong> {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                      <p><strong>Gender:</strong> {patient.gender}</p>
                      <p><strong>Patient ID:</strong> {patient.id}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Contact Information</h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <p className="flex items-center gap-2">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                        {patient.phone || "Not provided"}
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                        {patient.email || "Not provided"}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                        {patient.address || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Medical Information</h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <p><strong>Allergies:</strong> {patient.allergies || "None reported"}</p>
                      <p><strong>Medical History:</strong> {patient.medicalHistory || "None reported"}</p>
                      <p><strong>Emergency Contact:</strong> {patient.emergencyContact || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading profile...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Upcoming Appointments</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{appointments.filter((apt: any) => apt.status === 'confirmed').length}</p>
                  </div>
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Active Prescriptions</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{prescriptions.filter((rx: any) => rx.status === 'active').length}</p>
                  </div>
                  <Pill className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Recent Lab Results</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{labResults.length}</p>
                  </div>
                  <TestTube className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Unread Messages</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{messages.filter((msg: any) => !msg.read).length}</p>
                  </div>
                  <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <div className="grid gap-4">
            {appointments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No appointments scheduled</p>
                  <Button className="mt-4" onClick={() => setIsAppointmentDialogOpen(true)}>
                    Request Appointment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              appointments.map((appointment: any) => (
                <Card key={appointment.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{appointment.type}</h3>
                        <p className="text-sm text-gray-600">Dr. {appointment.doctorName}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(appointment.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {appointment.time}
                          </span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Prescriptions Tab - Enhanced Medication Manager */}
        <TabsContent value="prescriptions" className="space-y-4">
          <EnhancedMedicationManager 
            prescriptions={prescriptions}
            className="w-full"
          />
        </TabsContent>

        {/* Lab Results Tab - Enhanced Blood Test Dashboard */}
        <TabsContent value="lab-results" className="space-y-4">
          {labResults && labResults.length > 0 ? (
            <EnhancedBloodTestResults 
              labResults={labResults}
              className="w-full"
            />
          ) : (
            <Card>
              <CardContent className="text-center py-16">
                <TestTube className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Lab Results Available</h3>
                <p className="text-gray-500 mb-6">Your test results will appear here once they're ready</p>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Lab Test
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Medical Records Tab */}
        <TabsContent value="records" className="space-y-4">
          <div className="grid gap-4">
            {medicalRecords.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No medical records available</p>
                </CardContent>
              </Card>
            ) : (
              medicalRecords.map((record: any) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{record.title}</h3>
                        <p className="text-sm text-gray-600">{record.type}</p>
                        <p className="text-sm text-gray-500 mt-1">{record.description}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(record.date).toLocaleDateString()} - Dr. {record.provider}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <div className="grid gap-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No messages</p>
                  <Button className="mt-4" onClick={() => setIsMessageDialogOpen(true)}>
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            ) : (
              messages.map((message: any) => (
                <Card key={message.id} className={!message.read ? "border-blue-200 bg-blue-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{message.subject}</h3>
                          {!message.read && <Badge variant="secondary">New</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{message.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>From: {message.sender}</span>
                          <span>{new Date(message.date).toLocaleDateString()}</span>
                          <Badge variant="outline">{message.category}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Main Export Component
export default function PatientPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('patientToken');
    const patientData = localStorage.getItem('patientData');
    
    if (token && patientData) {
      try {
        // Check if token is valid (not expired)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setIsAuthenticated(true);
          setPatient(JSON.parse(patientData));
        } else {
          // Token expired, clear storage
          localStorage.removeItem('patientToken');
          localStorage.removeItem('patientData');
        }
      } catch (error) {
        // Invalid token, clear storage
        localStorage.removeItem('patientToken');
        localStorage.removeItem('patientData');
      }
    }
  }, []);

  const handleLogin = (data: any) => {
    setIsAuthenticated(true);
    setPatient(data.patient);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPatient(null);
    localStorage.removeItem('patientToken');
    localStorage.removeItem('patientData');
  };

  if (!isAuthenticated) {
    return <PatientLogin onLogin={handleLogin} />;
  }

  return <PatientPortalContent patient={patient} onLogout={handleLogout} />;
}