import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import PatientStatsDashboard from "@/components/patient-stats-dashboard";
import PatientQuickActions from "@/components/patient-quick-actions";
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  AlertCircle, 
  History, 
  Stethoscope, 
  FlaskRound,
  Plus,
  Pill,
  Activity,
  Heart,
  Clock,
  UserCheck,
  FileText,
  Edit,
  Save,
  X,
  Printer,
  Eye,
  Thermometer,
  Shield,
  Info,
  ChevronRight,
  TrendingUp,
  Calendar as CalendarIcon,
  Bell,
  Settings,
  Moon,
  Sun,
  RefreshCw,
  Download,
  Upload,
  Share2,
  Archive
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";
import { useRole } from "@/components/role-guard";
import type { Patient, Visit, LabResult, Prescription } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EnhancedPatientProfileProps {
  patientId?: string;
}

interface Organization {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface PatientStats {
  totalVisits: number;
  lastVisit: string;
  upcomingAppointments: number;
  pendingLabResults: number;
  activePrescriptions: number;
  criticalAlerts: number;
}

interface RecentActivity {
  id: string;
  type: 'visit' | 'lab' | 'prescription' | 'appointment';
  title: string;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled' | 'critical';
  icon: any;
}

export default function EnhancedPatientProfile({ patientId: propPatientId }: EnhancedPatientProfileProps) {
  const [, params] = useRoute("/patients/:id/enhanced");
  const patientId = propPatientId || params?.id;
  const { user } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Patient>>({});
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [quickActionType, setQuickActionType] = useState<'appointment' | 'lab' | 'prescription' | 'visit' | 'vitals' | null>(null);

  // Fetch patient data with enhanced error handling
  const { data: patient, isLoading: patientLoading, error: patientError } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch patient visits
  const { data: visits = [], isLoading: visitsLoading } = useQuery<Visit[]>({
    queryKey: [`/api/patients/${patientId}/visits`],
    enabled: !!patientId,
  });

  // Fetch lab results
  const { data: labResults = [], isLoading: labResultsLoading } = useQuery<LabResult[]>({
    queryKey: [`/api/patients/${patientId}/labs`],
    enabled: !!patientId,
  });

  // Fetch prescriptions
  const { data: prescriptions = [], isLoading: prescriptionsLoading } = useQuery<Prescription[]>({
    queryKey: [`/api/patients/${patientId}/prescriptions`],
    enabled: !!patientId,
  });

  // Fetch appointments
  const { data: appointments = [] } = useQuery({
    queryKey: [`/api/patients/${patientId}/appointments`],
    enabled: !!patientId,
  });

  // Fetch vital signs
  const { data: vitalSigns = [] } = useQuery({
    queryKey: [`/api/patients/${patientId}/vitals`],
    enabled: !!patientId,
  });

  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: async (updatedData: Partial<Patient>) => {
      return await apiRequest(`/api/patients/${patientId}`, {
        method: "PATCH",
        body: JSON.stringify(updatedData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}`] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Patient information updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update patient information",
        variant: "destructive",
      });
    },
  });

  // Calculate patient statistics
  const patientStats: PatientStats = {
    totalVisits: visits.length,
    lastVisit: visits[0]?.visitDate || 'Never',
    upcomingAppointments: appointments.filter((apt: any) => isAfter(new Date(apt.appointmentDate), new Date())).length,
    pendingLabResults: labResults.filter((lab: any) => lab.status === 'pending').length,
    activePrescriptions: prescriptions.filter((rx: any) => rx.status === 'active').length,
    criticalAlerts: labResults.filter((lab: any) => lab.status === 'critical').length,
  };

  // Generate recent activity
  const recentActivity: RecentActivity[] = [
    ...visits.slice(0, 3).map((visit: any) => ({
      id: `visit-${visit.id}`,
      type: 'visit' as const,
      title: 'Medical Visit',
      description: visit.chiefComplaint || 'General consultation',
      date: visit.visitDate,
      status: 'completed' as const,
      icon: Stethoscope,
    })),
    ...labResults.slice(0, 3).map((lab: any) => ({
      id: `lab-${lab.id}`,
      type: 'lab' as const,
      title: 'Lab Result',
      description: lab.testName,
      date: lab.testDate,
      status: lab.status === 'critical' ? 'critical' as const : 'completed' as const,
      icon: FlaskRound,
    })),
    ...prescriptions.slice(0, 2).map((rx: any) => ({
      id: `rx-${rx.id}`,
      type: 'prescription' as const,
      title: 'Prescription',
      description: rx.medicationName,
      date: rx.createdAt,
      status: rx.status === 'active' ? 'completed' as const : 'pending' as const,
      icon: Pill,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  // Initialize edit form
  useEffect(() => {
    if (patient && isEditing) {
      setEditFormData(patient);
    }
  }, [patient, isEditing]);

  // Handle edit form submission
  const handleSaveChanges = () => {
    if (editFormData) {
      updatePatientMutation.mutate(editFormData);
    }
  };

  // Loading states
  if (patientLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading patient information...</span>
        </div>
      </div>
    );
  }

  // Error states
  if (patientError || !patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>Patient Not Found</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">The requested patient could not be found or you don't have permission to view this information.</p>
            <Button className="mt-4" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse';

  return (
    <TooltipProvider>
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header Section */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-40`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              {/* Patient Info Header */}
              <div className="flex items-center space-x-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={patient.profileImageUrl} />
                  <AvatarFallback className="bg-blue-500 text-white">
                    {patient.firstName?.[0]}{patient.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {patient.title} {patient.firstName} {patient.lastName}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'MMM dd, yyyy') : 'N/A'}
                    </span>
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {patient.gender}
                    </span>
                    <span className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {patient.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDarkMode(!isDarkMode)}
                    >
                      {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle dark mode</TooltipContent>
                </Tooltip>

                {canEdit && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isEditing ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isEditing) {
                            setIsEditing(false);
                            setEditFormData({});
                          } else {
                            setIsEditing(true);
                          }
                        }}
                      >
                        {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isEditing ? 'Cancel editing' : 'Edit patient'}</TooltipContent>
                  </Tooltip>
                )}

                {isEditing && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={handleSaveChanges}
                        disabled={updatePatientMutation.isPending}
                      >
                        {updatePatientMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Save changes</TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Printer className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print patient summary</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share patient information</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Critical Alerts Bar */}
            {patientStats.criticalAlerts > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <p className="text-red-700">
                    <span className="font-medium">Critical Alert:</span> {patientStats.criticalAlerts} lab result(s) require immediate attention.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Visits</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{patientStats.totalVisits}</p>
                    </div>
                    <History className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Upcoming</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{patientStats.upcomingAppointments}</p>
                    </div>
                    <CalendarIcon className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pending Labs</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{patientStats.pendingLabResults}</p>
                    </div>
                    <FlaskRound className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Active Rx</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{patientStats.activePrescriptions}</p>
                    </div>
                    <Pill className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Alerts</p>
                      <p className={`text-2xl font-bold ${patientStats.criticalAlerts > 0 ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {patientStats.criticalAlerts}
                      </p>
                    </div>
                    <Bell className={`w-8 h-8 ${patientStats.criticalAlerts > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                  </div>
                </CardContent>
              </Card>

              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Last Visit</p>
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {patientStats.lastVisit !== 'Never' 
                          ? formatDistanceToNow(new Date(patientStats.lastVisit), { addSuffix: true })
                          : 'Never'
                        }
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className={`grid w-full grid-cols-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="medical">Medical</TabsTrigger>
                  <TabsTrigger value="vitals">Vitals</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                    <CardHeader>
                      <CardTitle className={`flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <User className="w-5 h-5" />
                        <span>Personal Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Full Name</Label>
                          {isEditing ? (
                            <div className="flex space-x-2">
                              <Input
                                value={editFormData.firstName || ''}
                                onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                                placeholder="First Name"
                              />
                              <Input
                                value={editFormData.lastName || ''}
                                onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                                placeholder="Last Name"
                              />
                            </div>
                          ) : (
                            <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {patient.firstName} {patient.lastName}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Date of Birth</Label>
                          {isEditing ? (
                            <Input
                              type="date"
                              value={editFormData.dateOfBirth || ''}
                              onChange={(e) => setEditFormData({...editFormData, dateOfBirth: e.target.value})}
                            />
                          ) : (
                            <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'MMMM dd, yyyy') : 'Not provided'}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Gender</Label>
                          {isEditing ? (
                            <Input
                              value={editFormData.gender || ''}
                              onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                            />
                          ) : (
                            <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {patient.gender || 'Not specified'}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Phone</Label>
                          {isEditing ? (
                            <Input
                              value={editFormData.phone || ''}
                              onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                            />
                          ) : (
                            <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {patient.phone || 'Not provided'}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Email</Label>
                          {isEditing ? (
                            <Input
                              type="email"
                              value={editFormData.email || ''}
                              onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                            />
                          ) : (
                            <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {patient.email || 'Not provided'}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <Label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Address</Label>
                          {isEditing ? (
                            <Textarea
                              value={editFormData.address || ''}
                              onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                            />
                          ) : (
                            <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {patient.address || 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Medical Tab */}
                <TabsContent value="medical" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                      <CardHeader>
                        <CardTitle className={`flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <AlertCircle className="w-5 h-5" />
                          <span>Allergies</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isEditing ? (
                          <Textarea
                            value={editFormData.allergies || ''}
                            onChange={(e) => setEditFormData({...editFormData, allergies: e.target.value})}
                            placeholder="List known allergies..."
                          />
                        ) : (
                          <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {patient.allergies || 'No known allergies'}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                      <CardHeader>
                        <CardTitle className={`flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <History className="w-5 h-5" />
                          <span>Medical History</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isEditing ? (
                          <Textarea
                            value={editFormData.medicalHistory || ''}
                            onChange={(e) => setEditFormData({...editFormData, medicalHistory: e.target.value})}
                            placeholder="Medical history..."
                          />
                        ) : (
                          <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {patient.medicalHistory || 'No medical history recorded'}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Prescriptions */}
                  <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                    <CardHeader>
                      <CardTitle className={`flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <div className="flex items-center space-x-2">
                          <Pill className="w-5 h-5" />
                          <span>Active Prescriptions</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Prescription
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {prescriptions.slice(0, 3).map((prescription: any) => (
                          <div key={prescription.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {prescription.medicationName}
                              </p>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {prescription.dosage} - {prescription.frequency}
                              </p>
                            </div>
                            <Badge className={getStatusColor(prescription.status)}>
                              {prescription.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Vitals Tab */}
                <TabsContent value="vitals" className="space-y-4">
                  <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                    <CardHeader>
                      <CardTitle className={`flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <div className="flex items-center space-x-2">
                          <Activity className="w-5 h-5" />
                          <span>Latest Vital Signs</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Record Vitals
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {vitalSigns.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 border rounded-lg">
                            <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
                            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {vitalSigns[0]?.bloodPressureSystolic}/{vitalSigns[0]?.bloodPressureDiastolic}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Blood Pressure</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <Activity className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {vitalSigns[0]?.heartRate}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Heart Rate</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <Thermometer className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {vitalSigns[0]?.temperature}°C
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Temperature</p>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <Activity className="w-8 h-8 mx-auto mb-2 text-green-500" />
                            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {vitalSigns[0]?.oxygenSaturation}%
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>O2 Saturation</p>
                          </div>
                        </div>
                      ) : (
                        <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          No vital signs recorded yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-4">
                  <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                    <CardHeader>
                      <CardTitle className={`flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <History className="w-5 h-5" />
                        <span>Visit History</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {visits.slice(0, 5).map((visit: any) => (
                          <div key={visit.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {format(new Date(visit.visitDate), 'MMM dd, yyyy')}
                              </p>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {visit.chiefComplaint || 'General consultation'}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Recent Activity */}
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardHeader>
                  <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {recentActivity.map((activity) => {
                        const IconComponent = activity.icon;
                        return (
                          <div key={activity.id} className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {activity.title}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                                {activity.description}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardHeader>
                  <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setQuickActionType('appointment')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Appointment
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setQuickActionType('lab')}
                  >
                    <FlaskRound className="w-4 h-4 mr-2" />
                    Order Lab Test
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setQuickActionType('prescription')}
                  >
                    <Pill className="w-4 h-4 mr-2" />
                    Prescribe Medication
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setQuickActionType('vitals')}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Record Vitals
                  </Button>
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              {appointments.length > 0 && (
                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                  <CardHeader>
                    <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Upcoming Appointments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {appointments.slice(0, 3).map((appointment: any) => (
                        <div key={appointment.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {format(new Date(appointment.appointmentDate), 'MMM dd')}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {appointment.appointmentTime}
                            </p>
                          </div>
                          <Badge variant="outline">{appointment.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Modal */}
      <PatientQuickActions
        patientId={patientId!}
        patientName={patient ? `${patient.firstName} ${patient.lastName}` : ''}
        isOpen={!!quickActionType}
        onClose={() => setQuickActionType(null)}
        action={quickActionType}
      />
    </TooltipProvider>
  );
}