import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain, 
  Users, 
  Calendar, 
  FileText, 
  Search,
  Clock,
  Target,
  TrendingUp,
  User,
  BarChart3,
  Award,
  BookOpen,
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Heart,
  Zap,
  Sparkles
} from "lucide-react";
import PsychologicalTherapyAssessment from "@/components/psychological-therapy-assessment";
import { format } from "date-fns";

export default function PsychologicalTherapyPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);

  // Fetch patients
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
  });

  // Fetch psychological therapy sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['/api/consultation-records'],
    select: (data: any[]) => data.filter(record => 
      record.formData?.type === 'psychological_therapy_session'
    )
  });

  // Filter patients based on search
  const filteredPatients = patients.filter((patient: any) =>
    patient.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  // Get recent sessions
  const recentSessions = sessions
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Calculate statistics
  const todaySessions = sessions.filter((s: any) => {
    const today = new Date().toDateString();
    return new Date(s.createdAt).toDateString() === today;
  }).length;

  const activePatients = new Set(sessions.map((s: any) => s.patientId)).size;

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setShowAssessmentDialog(true);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Psychological Therapy Center</h1>
          <p className="text-gray-600">Comprehensive mental health assessment, therapy sessions & progress tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-300">
            <Brain className="w-4 h-4 mr-2" />
            Psychology Department
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
            <Target className="w-4 h-4 mr-2" />
            Evidence-Based Practice
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Stats */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Patients</p>
                <p className="text-2xl font-bold text-indigo-600">{activePatients}</p>
              </div>
              <Users className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-indigo-600">{sessions.length}</p>
              </div>
              <FileText className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Sessions</p>
                <p className="text-2xl font-bold text-indigo-600">{todaySessions}</p>
              </div>
              <Calendar className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Session</p>
                <p className="text-2xl font-bold text-indigo-600">50min</p>
              </div>
              <Clock className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">Patient Assessment</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Patient Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search patients by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid gap-4">
                  {filteredPatients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? "No patients found matching your search." : "No patients available."}
                    </div>
                  ) : (
                    filteredPatients.map((patient: any) => (
                      <div 
                        key={patient.id} 
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {patient.firstName} {patient.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {patient.phone} • {patient.gender} • Age: {patient.dateOfBirth ? 
                                  new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                              <Brain className="w-4 h-4 mr-2" />
                              New Session
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Therapy Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No psychological therapy sessions found.
                  </div>
                ) : (
                  recentSessions.map((session: any) => {
                    const patient = patients.find((p: any) => p.id === session.patientId);
                    const formData = session.formData || {};
                    
                    return (
                      <div key={session.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'}
                              </h4>
                              <Badge variant="outline" className="bg-indigo-100 text-indigo-700">
                                {formData.therapyType || 'Therapy Session'}
                              </Badge>
                            </div>
                            
                            {formData.sessionFocus && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-indigo-700">Session Focus:</span>
                                <p className="text-sm text-gray-700">{formData.sessionFocus}</p>
                              </div>
                            )}
                            
                            {formData.interventionsUsed && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-indigo-700">Interventions:</span>
                                <p className="text-sm text-gray-700">{formData.interventionsUsed}</p>
                              </div>
                            )}

                            {formData.homeworkAssigned && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-indigo-700">Homework:</span>
                                <p className="text-sm text-gray-700">{formData.homeworkAssigned}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right text-sm text-gray-500">
                            <div className="flex items-center gap-1 mb-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(session.createdAt), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-xs">
                              {format(new Date(session.createdAt), 'hh:mm a')}
                            </div>
                            {formData.sessionDuration && (
                              <div className="text-xs mt-1">
                                Duration: {formData.sessionDuration} min
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Patient Progress Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Progress tracking features coming soon.</p>
                <p className="text-sm">Track patient improvements, treatment outcomes, and therapy goals.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assessment Dialog */}
      <Dialog open={showAssessmentDialog} onOpenChange={setShowAssessmentDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Psychological Therapy Session</DialogTitle>
            {selectedPatient && (
              <p className="text-sm text-gray-600">
                Patient: {selectedPatient.firstName} {selectedPatient.lastName} (ID: {selectedPatient.id})
              </p>
            )}
          </DialogHeader>
          
          {selectedPatient && (
            <PsychologicalTherapyAssessment 
              patientId={selectedPatient.id}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

