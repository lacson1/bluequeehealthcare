import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
                    <Button size="sm" className="mt-2">
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
                <CardTitle>Appointment Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Book Your Next Appointment</h3>
                  <p className="text-gray-600 mb-4">Schedule a consultation with your healthcare provider</p>
                  <Button>
                    <Calendar className="w-4 h-4 mr-2" />
                    Book New Appointment
                  </Button>
                </div>
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
                        <Button variant="outline" size="sm" className="mt-2">
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
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Secure Messaging</h3>
                  <p className="text-gray-600 mb-4">Communicate securely with your healthcare team</p>
                  <Button>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Conversation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}