import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Calendar, 
  FileText, 
  Download, 
  MessageSquare, 
  Clock,
  Heart,
  Shield,
  Eye,
  EyeOff,
  Send,
  Phone,
  MapPin,
  Activity,
  TestTube,
  Pill
} from 'lucide-react';

interface PatientSession {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dateOfBirth: string;
  gender: string;
  address?: string;
}

export default function PatientPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patientSession, setPatientSession] = useState<PatientSession | null>(null);
  const [loginData, setLoginData] = useState({
    patientId: '',
    phone: '',
    dateOfBirth: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showMessaging, setShowMessaging] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    appointmentType: '',
    preferredDate: '',
    preferredTime: '',
    reason: '',
    notes: ''
  });
  
  const queryClient = useQueryClient();

  // Patient authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch('/api/patient-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const error = await response.json();
        setLoginError(error.message || 'Invalid credentials. Please check your information.');
        return;
      }

      const { token, patient } = await response.json();
      
      // Store patient token for API requests
      localStorage.setItem('patientToken', token);
      
      setPatientSession(patient);
      setIsAuthenticated(true);
    } catch (error) {
      setLoginError('Connection error. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPatientSession(null);
    setLoginData({ patientId: '', phone: '', dateOfBirth: '' });
  };

  // Messaging functionality
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/patient-portal/messages'],
    enabled: isAuthenticated && !!patientSession,
    staleTime: 30000
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { subject: string; message: string }) => {
      const response = await fetch('/api/patient-portal/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('patientToken')}`
        },
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patient-portal/messages'] });
      setNewMessage('');
      setMessageSubject('');
      setShowMessaging(false);
    }
  });

  const handleSendMessage = () => {
    if (messageSubject.trim() && newMessage.trim()) {
      sendMessageMutation.mutate({
        subject: messageSubject.trim(),
        message: newMessage.trim()
      });
    }
  };

  // Appointment booking functionality
  const { data: appointments = [] } = useQuery({
    queryKey: ['/api/patient-portal/appointments'],
    enabled: isAuthenticated && !!patientSession,
    staleTime: 30000
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const response = await fetch('/api/patient-portal/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('patientToken')}`
        },
        body: JSON.stringify(appointmentData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to book appointment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patient-portal/appointments'] });
      setAppointmentData({
        appointmentType: '',
        preferredDate: '',
        preferredTime: '',
        reason: '',
        notes: ''
      });
      setShowAppointmentForm(false);
    }
  });

  const handleBookAppointment = () => {
    if (appointmentData.appointmentType && appointmentData.preferredDate && appointmentData.reason) {
      bookAppointmentMutation.mutate(appointmentData);
    }
  };

  const handleDownloadReport = (visit: any) => {
    const reportContent = generateMedicalReport(visit, patientSession);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateMedicalReport = (visit: any, patient: PatientSession | null): string => {
    const formatDate = (date: string | Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Medical Visit Report - ${patient?.firstName} ${patient?.lastName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .letterhead { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .org-logo { float: left; width: 80px; height: 80px; background: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px; }
        .org-info { margin-left: 100px; }
        .org-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
        .org-details { color: #64748b; line-height: 1.4; }
        .document-title { text-align: center; font-size: 20px; font-weight: bold; color: #1e40af; margin: 30px 0; padding: 10px; border: 2px solid #e2e8f0; background: #f8fafc; }
        .section { margin: 25px 0; }
        .section-title { font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-item { margin-bottom: 8px; }
        .label { font-weight: bold; color: #4b5563; }
        .value { color: #1f2937; }
        .clinical-section { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 15px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        .signature-area { margin-top: 40px; text-align: center; }
        .confidentiality { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 12px; }
        @media print {
            body { print-color-adjust: exact; }
            .letterhead { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="letterhead">
        <div class="org-logo">HC</div>
        <div class="org-info">
          <div class="org-name">HealthCare Connect</div>
          <div class="org-details">
            Advanced Digital Health Solutions<br>
            Lagos State Medical Complex, Ikeja<br>
            Phone: +234-1-234-5678 | Fax: +234-1-234-5679<br>
            Email: info@healthcareconnect.ng | Emergency: +234-803-555-0123<br>
            Medical License: NG-MED-2024-001 | CAP Accredited
          </div>
        </div>
        <div style="clear: both;"></div>
      </div>

      <div class="document-title">MEDICAL VISIT REPORT</div>

      <div class="section">
        <div class="section-title">PATIENT INFORMATION</div>
        <div class="info-grid">
          <div>
            <div class="info-item">
              <span class="label">Patient Name:</span> 
              <span class="value">${patient?.firstName} ${patient?.lastName}</span>
            </div>
            <div class="info-item">
              <span class="label">Date of Birth:</span> 
              <span class="value">${formatDate(patient?.dateOfBirth || '')}</span>
            </div>
            <div class="info-item">
              <span class="label">Gender:</span> 
              <span class="value">${patient?.gender}</span>
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="label">Patient ID:</span> 
              <span class="value">P${String(patient?.id).padStart(6, '0')}</span>
            </div>
            <div class="info-item">
              <span class="label">Phone:</span> 
              <span class="value">${patient?.phone}</span>
            </div>
            <div class="info-item">
              <span class="label">Visit Date:</span> 
              <span class="value">${formatDate(visit.visitDate)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">VISIT DETAILS</div>
        <div class="info-item">
          <span class="label">Visit Type:</span> 
          <span class="value">${visit.visitType || 'General Consultation'}</span>
        </div>
        <div class="info-item">
          <span class="label">Visit ID:</span> 
          <span class="value">VIS-${String(visit.id).padStart(3, '0')}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">CLINICAL ASSESSMENT</div>
        
        <div class="clinical-section">
          <h4 style="margin-top: 0; color: #374151;">Chief Complaint</h4>
          <p style="margin-bottom: 0;">${visit.complaint || 'Not specified'}</p>
        </div>

        ${visit.diagnosis ? `
        <div class="clinical-section">
          <h4 style="margin-top: 0; color: #374151;">Diagnosis</h4>
          <p style="margin-bottom: 0;">${visit.diagnosis}</p>
        </div>
        ` : ''}

        ${visit.treatment ? `
        <div class="clinical-section">
          <h4 style="margin-top: 0; color: #374151;">Treatment Plan</h4>
          <p style="margin-bottom: 0;">${visit.treatment}</p>
        </div>
        ` : ''}

        ${visit.followUpDate ? `
        <div class="clinical-section">
          <h4 style="margin-top: 0; color: #374151;">Follow-up Instructions</h4>
          <p style="margin-bottom: 0;">Follow-up appointment scheduled for: ${formatDate(visit.followUpDate)}</p>
        </div>
        ` : ''}
      </div>

      <div class="confidentiality">
        <strong>CONFIDENTIALITY NOTICE:</strong><br>
        This medical report contains confidential patient information protected by medical privacy laws. 
        This information is intended solely for the use of the patient and authorized healthcare providers. 
        Any unauthorized disclosure is strictly prohibited.
      </div>

      <div class="signature-area">
        <p><strong>Generated for Patient Portal Access</strong></p>
        <p>Report Generated: ${formatDate(new Date())}</p>
        <p>This is an official medical document from HealthCare Connect</p>
      </div>

      <div class="footer">
        <strong>Visit ID:</strong> VIS-${String(visit.id).padStart(3, '0')} | 
        <strong>Patient ID:</strong> P${String(patient?.id).padStart(6, '0')} | 
        <strong>Generated:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}<br>
        <em>HealthCare Connect - Advanced Digital Health Solutions | www.healthcareconnect.ng</em>
      </div>
    </body>
    </html>`;
  };

  // Patient visits data
  const { data: visits = [] } = useQuery({
    queryKey: ['/api/patient-portal/visits'],
    queryFn: async () => {
      const token = localStorage.getItem('patientToken');
      const response = await fetch('/api/patient-portal/visits', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch visits');
      return response.json();
    },
    enabled: isAuthenticated && !!patientSession?.id
  });

  // Patient lab results
  const { data: labResults = [] } = useQuery({
    queryKey: ['/api/patient-portal/lab-results'],
    queryFn: async () => {
      const token = localStorage.getItem('patientToken');
      const response = await fetch('/api/patient-portal/lab-results', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch lab results');
      return response.json();
    },
    enabled: isAuthenticated && !!patientSession?.id
  });

  const getPatientAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Patient Portal</CardTitle>
            <p className="text-gray-600">Secure access to your health records</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID</Label>
                <Input
                  id="patientId"
                  type="text"
                  placeholder="HC000006"
                  value={loginData.patientId}
                  onChange={(e) => setLoginData(prev => ({ ...prev, patientId: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 xxx xxx xxxx"
                  value={loginData.phone}
                  onChange={(e) => setLoginData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={loginData.dateOfBirth}
                  onChange={(e) => setLoginData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  required
                />
              </div>

              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Secure Login
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Need help? Contact your healthcare provider</p>
              <p className="mt-1">📞 +234 xxx xxx xxxx</p>
              
              {/* Demo Credentials Helper */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
                <p className="font-medium text-blue-800 mb-2">Demo Login Credentials:</p>
                <div className="space-y-2 text-xs">
                  <div>
                    <strong>Abike Jare:</strong> ID: 6, Phone: 0788985885, DOB: 1971-03-02
                  </div>
                  <div>
                    <strong>Fatimah:</strong> ID: 5, Phone: 0790887656, DOB: 1987-06-02
                  </div>
                  <div>
                    <strong>Ade Bola:</strong> ID: 3, Phone: 08999399393, DOB: 1980-04-03
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setLoginData({
                    patientId: '6',
                    phone: '0788985885',
                    dateOfBirth: '1971-03-02'
                  })}
                >
                  Quick Fill Demo (Abike)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Patient Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Welcome, {patientSession?.firstName}
                </h1>
                <p className="text-sm text-gray-600">
                  Patient ID: HC{patientSession?.id?.toString().padStart(6, "0")}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Medical Records
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Test Results
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Full Name</p>
                    <p className="text-base">{patientSession?.firstName} {patientSession?.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Age</p>
                    <p className="text-base">{getPatientAge(patientSession?.dateOfBirth || '')} years old</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gender</p>
                    <p className="text-base">{patientSession?.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Phone</p>
                    <p className="text-base">{patientSession?.phone}</p>
                  </div>
                  {patientSession?.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-base">{patientSession.email}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Visits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Visits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {visits.length > 0 ? (
                    <div className="space-y-3">
                      {visits.slice(0, 3).map((visit: any) => (
                        <div key={visit.id} className="border-l-4 border-primary pl-3">
                          <p className="font-medium text-sm">{visit.visitType} Visit</p>
                          <p className="text-xs text-gray-600">
                            {new Date(visit.visitDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">{visit.complaint}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No recent visits</p>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">No upcoming appointments</p>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setShowAppointmentForm(true)}
                    >
                      Book Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Health Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Health Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Activity className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{visits.length}</p>
                    <p className="text-sm text-blue-600">Total Visits</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TestTube className="mx-auto h-8 w-8 text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-green-600">{labResults.length}</p>
                    <p className="text-sm text-green-600">Lab Tests</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Pill className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                    <p className="text-2xl font-bold text-purple-600">0</p>
                    <p className="text-sm text-purple-600">Active Prescriptions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Appointments</span>
                  <Button 
                    onClick={() => setShowAppointmentForm(true)}
                    size="sm"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book New Appointment
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showAppointmentForm ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="appointmentType">Appointment Type</Label>
                        <select
                          id="appointmentType"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          value={appointmentData.appointmentType}
                          onChange={(e) => setAppointmentData(prev => ({
                            ...prev,
                            appointmentType: e.target.value
                          }))}
                        >
                          <option value="">Select appointment type</option>
                          <option value="general-consultation">General Consultation</option>
                          <option value="follow-up">Follow-up Visit</option>
                          <option value="specialist-consultation">Specialist Consultation</option>
                          <option value="routine-checkup">Routine Checkup</option>
                          <option value="vaccination">Vaccination</option>
                          <option value="lab-results-review">Lab Results Review</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="preferredDate">Preferred Date</Label>
                        <Input
                          id="preferredDate"
                          type="date"
                          value={appointmentData.preferredDate}
                          onChange={(e) => setAppointmentData(prev => ({
                            ...prev,
                            preferredDate: e.target.value
                          }))}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="preferredTime">Preferred Time</Label>
                        <select
                          id="preferredTime"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          value={appointmentData.preferredTime}
                          onChange={(e) => setAppointmentData(prev => ({
                            ...prev,
                            preferredTime: e.target.value
                          }))}
                        >
                          <option value="">Select preferred time</option>
                          <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
                          <option value="afternoon">Afternoon (12:00 PM - 4:00 PM)</option>
                          <option value="evening">Evening (4:00 PM - 8:00 PM)</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="reason">Reason for Visit</Label>
                        <Input
                          id="reason"
                          placeholder="Brief description of your concern"
                          value={appointmentData.reason}
                          onChange={(e) => setAppointmentData(prev => ({
                            ...prev,
                            reason: e.target.value
                          }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional information you'd like to share..."
                        rows={3}
                        value={appointmentData.notes}
                        onChange={(e) => setAppointmentData(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleBookAppointment}
                        disabled={!appointmentData.appointmentType || !appointmentData.preferredDate || !appointmentData.reason || bookAppointmentMutation.isPending}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {bookAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowAppointmentForm(false);
                          setAppointmentData({
                            appointmentType: '',
                            preferredDate: '',
                            preferredTime: '',
                            reason: '',
                            notes: ''
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.length > 0 ? (
                      <div className="space-y-3">
                        {appointments.map((appointment: any) => (
                          <div key={appointment.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{appointment.appointmentType}</h4>
                              <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                                {appointment.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{appointment.reason}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Date: {new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                              <span>Time: {appointment.appointmentTime}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Scheduled</h3>
                        <p className="text-gray-600 mb-4">
                          Schedule a consultation with your healthcare provider
                        </p>
                      </div>
                    )}
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
                {visits.length > 0 ? (
                  <div className="space-y-4">
                    {visits.map((visit: any) => (
                      <div key={visit.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{visit.visitType} Visit</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(visit.visitDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline">Completed</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p><strong>Chief Complaint:</strong> {visit.complaint}</p>
                          {visit.diagnosis && <p><strong>Diagnosis:</strong> {visit.diagnosis}</p>}
                          {visit.treatment && <p><strong>Treatment:</strong> {visit.treatment}</p>}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => handleDownloadReport(visit)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Report
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No medical records available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Laboratory Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TestTube className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No test results available</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Secure Messaging</span>
                  <Button 
                    onClick={() => setShowMessaging(true)}
                    size="sm"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    New Message
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showMessaging ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Message subject..."
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Type your message to your healthcare team..."
                        rows={4}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!messageSubject.trim() || !newMessage.trim() || sendMessageMutation.isPending}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowMessaging(false);
                          setNewMessage('');
                          setMessageSubject('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.length > 0 ? (
                      <div className="space-y-3">
                        {messages.map((message: any) => (
                          <div key={message.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{message.subject}</h4>
                              <Badge variant={message.status === 'unread' ? 'default' : 'secondary'}>
                                {message.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{message.message}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>To: {message.recipientType || 'Healthcare Team'}</span>
                              <span>{new Date(message.sentAt).toLocaleDateString()}</span>
                            </div>
                            {message.reply && (
                              <div className="mt-3 pt-3 border-t bg-gray-50 rounded p-3">
                                <p className="text-sm font-medium text-blue-600 mb-1">Reply from Healthcare Team:</p>
                                <p className="text-sm">{message.reply}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(message.repliedAt).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h3>
                        <p className="text-gray-600 mb-4">
                          Start a conversation with your healthcare team using secure messaging
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}