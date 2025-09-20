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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Portal</h1>
          <p className="text-gray-600">Access your healthcare information securely</p>
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
                          className="h-12"
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
                          className="h-12"
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
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12"
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
  const { data: patientProfile } = authenticatedQuery("/api/patient-portal/profile");
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
      return authenticatedFetch("/api/patient-portal/messages", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: "Message Sent", description: "Your message has been sent to your healthcare provider." });
      setIsMessageDialogOpen(false);
      messageForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/patient-portal/messages"] });
    }
  });

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <User className="h-8 w-8 text-blue-600" />
            Patient Portal
          </h1>
          <p className="text-gray-600 mt-1">Welcome, {patient?.firstName} {patient?.lastName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
          
          <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Message
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
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Request Appointment
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
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Prescriptions
          </TabsTrigger>
          <TabsTrigger value="lab-results" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Lab Results
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Medical Records
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-lg">{patient?.firstName} {patient?.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                    <p className="text-lg">{patient?.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Gender</p>
                    <p className="text-lg">{patient?.gender}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-lg">{patient?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-lg">{patient?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-lg">{patient?.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <Calendar className="h-8 w-8 text-blue-500 mr-4" />
                <div>
                  <p className="text-2xl font-bold">{Array.isArray(appointments) ? appointments.length : 0}</p>
                  <p className="text-sm text-gray-500">Upcoming Appointments</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <Pill className="h-8 w-8 text-green-500 mr-4" />
                <div>
                  <p className="text-2xl font-bold">{Array.isArray(prescriptions) ? prescriptions.length : 0}</p>
                  <p className="text-sm text-gray-500">Active Prescriptions</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <TestTube className="h-8 w-8 text-purple-500 mr-4" />
                <div>
                  <p className="text-2xl font-bold">{Array.isArray(labResults) ? labResults.length : 0}</p>
                  <p className="text-sm text-gray-500">Recent Lab Results</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <MessageCircle className="h-8 w-8 text-orange-500 mr-4" />
                <div>
                  <p className="text-2xl font-bold">{Array.isArray(messages) ? messages.length : 0}</p>
                  <p className="text-sm text-gray-500">Messages</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Your Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(appointments) && appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{appointment.type || 'Appointment'}</h3>
                          <p className="text-gray-600">{appointment.date} at {appointment.time}</p>
                          <p className="text-sm text-gray-500">{appointment.reason}</p>
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status || 'Scheduled'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No appointments scheduled</p>
                  <p className="text-sm text-gray-400">Click "Request Appointment" to schedule a visit</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions">
          <Card>
            <CardHeader>
              <CardTitle>Your Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(prescriptions) && prescriptions.length > 0 ? (
                <div className="space-y-4">
                  {prescriptions.map((prescription: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{prescription.medicationName}</h3>
                          <p className="text-gray-600">{prescription.dosage} - {prescription.frequency}</p>
                          <p className="text-sm text-gray-500">{prescription.instructions}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            Prescribed: {prescription.startDate} | Duration: {prescription.duration}
                          </p>
                        </div>
                        <Badge className={getStatusColor(prescription.status)}>
                          {prescription.status || 'Active'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active prescriptions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lab Results Tab */}
        <TabsContent value="lab-results">
          <Card>
            <CardHeader>
              <CardTitle>Lab Results</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(labResults) && labResults.length > 0 ? (
                <div className="space-y-4">
                  {labResults.map((result: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{result.testName}</h3>
                          <p className="text-gray-600">Result: {result.value} {result.unit}</p>
                          <p className="text-sm text-gray-500">Reference Range: {result.referenceRange}</p>
                          <p className="text-xs text-gray-400 mt-2">Date: {result.date}</p>
                        </div>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status || 'Normal'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No lab results available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Records Tab */}
        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle>Medical Records</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(medicalRecords) && medicalRecords.length > 0 ? (
                <div className="space-y-4">
                  {medicalRecords.map((record: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{record.title || 'Medical Record'}</h3>
                          <p className="text-gray-600">{record.description}</p>
                          <p className="text-xs text-gray-400 mt-2">Date: {record.date}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No medical records available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(messages) && messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{message.subject}</h3>
                          <p className="text-gray-600">{message.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            From: {message.staffName} | {message.sentAt}
                          </p>
                        </div>
                        <Badge className={getStatusColor(message.status)}>
                          {message.status || 'Unread'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No messages</p>
                </div>
              )}
            </CardContent>
          </Card>
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