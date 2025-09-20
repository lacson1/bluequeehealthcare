import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  UserCheck, 
  ArrowRight, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  Send,
  Eye,
  Edit,
  Share2,
  Target,
  Activity,
  Stethoscope,
  MessageSquare,
  Bell,
  TrendingUp,
  ChevronRight,
  Download,
  Printer
} from 'lucide-react';

interface PhysiotherapyCareCoordinationProps {
  patientId: number;
  currentUser: any;
}

export default function PhysiotherapyCareCoordination({ patientId, currentUser }: PhysiotherapyCareCoordinationProps) {
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [showProgressShare, setShowProgressShare] = useState(false);
  const { toast } = useToast();

  // Fetch patient data and related records
  const { data: patient } = useQuery({
    queryKey: ['/api/patients', patientId],
  });

  const { data: visits } = useQuery({
    queryKey: ['/api/visits', patientId],
  });

  const { data: prescriptions } = useQuery({
    queryKey: ['/api/prescriptions', patientId],
  });

  const { data: referrals } = useQuery({
    queryKey: ['/api/referrals', patientId],
  });

  const { data: doctors } = useQuery({
    queryKey: ['/api/users'],
  });

  // Mutations for care coordination
  const createReferralMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/referrals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals'] });
      toast({ title: "Referral created successfully" });
    },
  });

  const shareProgressMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/progress-sharing', data),
    onSuccess: () => {
      toast({ title: "Progress shared with referring physician" });
    },
  });

  const patientReferrals = referrals?.filter((r: any) => r.patientId === patientId) || [];
  const doctorsList = doctors?.filter((d: any) => d.role === 'doctor') || [];
  
  // Mock physiotherapy assessments and progress data
  const physiotherapyProgress = {
    overallImprovement: 78,
    painReduction: 65,
    functionalGain: 82,
    sessionsCompleted: 12,
    adherenceRate: 94,
    currentPhase: "Strengthening Phase",
    nextMilestone: "Return to work activities",
    estimatedCompletion: "2024-02-15"
  };

  const recentAssessments = [
    {
      id: 1,
      date: "2024-01-20",
      type: "Range of Motion Assessment",
      findings: "Improved shoulder flexion from 120° to 150°",
      recommendations: "Continue strengthening exercises, reduce frequency to 2x/week"
    },
    {
      id: 2,
      date: "2024-01-15",
      type: "Functional Assessment",
      findings: "Patient can now lift objects up to 5kg without pain",
      recommendations: "Progress to work-specific activities"
    }
  ];

  const handleCreateReferral = (formData: any) => {
    createReferralMutation.mutate({
      patientId,
      referringDoctorId: currentUser.id,
      targetDepartment: formData.department,
      reason: formData.reason,
      priority: formData.priority,
      notes: formData.notes,
      status: 'pending'
    });
  };

  const handleShareProgress = (recipientId: number, notes: string) => {
    shareProgressMutation.mutate({
      patientId,
      recipientId,
      progressData: physiotherapyProgress,
      assessments: recentAssessments,
      notes,
      sharedBy: currentUser.id
    });
  };

  return (
    <div className="space-y-6">
      {/* Patient Overview */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <UserCheck className="w-5 h-5" />
            Patient Care Coordination Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">Patient Information</h4>
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {patient?.firstName} {patient?.lastName}</div>
                <div><strong>Age:</strong> {patient?.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 'N/A'} years</div>
                <div><strong>Phone:</strong> {patient?.phone}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">Treatment Status</h4>
              <div className="text-sm space-y-1">
                <div><strong>Current Phase:</strong> {physiotherapyProgress.currentPhase}</div>
                <div><strong>Sessions:</strong> {physiotherapyProgress.sessionsCompleted} completed</div>
                <div><strong>Progress:</strong> {physiotherapyProgress.overallImprovement}%</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">Care Team</h4>
              <div className="text-sm space-y-1">
                <div><strong>Physiotherapist:</strong> {currentUser.username}</div>
                <div><strong>Active Referrals:</strong> {patientReferrals.length}</div>
                <div><strong>Last Visit:</strong> {visits?.[0]?.visitDate ? new Date(visits[0].visitDate).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="referrals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="referrals">Referral Management</TabsTrigger>
          <TabsTrigger value="progress">Progress Sharing</TabsTrigger>
          <TabsTrigger value="coordination">Team Coordination</TabsTrigger>
          <TabsTrigger value="integration">Treatment Integration</TabsTrigger>
        </TabsList>

        {/* Referral Management */}
        <TabsContent value="referrals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Referrals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Active Referrals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patientReferrals.length > 0 ? (
                  patientReferrals.map((referral: any) => (
                    <Card key={referral.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{referral.targetDepartment}</h4>
                            <p className="text-sm text-gray-600">{referral.reason}</p>
                          </div>
                          <Badge 
                            variant={referral.status === 'completed' ? 'default' : 'secondary'}
                            className={referral.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {referral.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ArrowRight className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No active referrals for this patient</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create New Referral */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Create Referral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  handleCreateReferral({
                    department: formData.get('department'),
                    reason: formData.get('reason'),
                    priority: formData.get('priority'),
                    notes: formData.get('notes')
                  });
                }}>
                  <div className="space-y-2">
                    <Label htmlFor="department">Target Department</Label>
                    <Select name="department" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="neurology">Neurology</SelectItem>
                        <SelectItem value="rheumatology">Rheumatology</SelectItem>
                        <SelectItem value="pain-management">Pain Management</SelectItem>
                        <SelectItem value="sports-medicine">Sports Medicine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Referral</Label>
                    <Input name="reason" placeholder="Enter referral reason" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select name="priority" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea name="notes" placeholder="Enter additional information..." rows={3} />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={createReferralMutation.isPending}>
                    {createReferralMutation.isPending ? 'Creating...' : 'Create Referral'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Progress Sharing */}
        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Current Progress Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{physiotherapyProgress.overallImprovement}%</div>
                    <div className="text-sm text-green-600">Overall Progress</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{physiotherapyProgress.painReduction}%</div>
                    <div className="text-sm text-blue-600">Pain Reduction</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">{physiotherapyProgress.functionalGain}%</div>
                    <div className="text-sm text-purple-600">Functional Gain</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-700">{physiotherapyProgress.adherenceRate}%</div>
                    <div className="text-sm text-orange-600">Adherence Rate</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Recent Assessments</h4>
                  {recentAssessments.map((assessment) => (
                    <div key={assessment.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-sm">{assessment.type}</h5>
                        <span className="text-xs text-gray-500">{assessment.date}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{assessment.findings}</p>
                      <p className="text-xs text-blue-600">{assessment.recommendations}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Share Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share Progress with Care Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const recipientId = parseInt(formData.get('recipient') as string);
                  const notes = formData.get('notes') as string;
                  handleShareProgress(recipientId, notes);
                }}>
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Share with Doctor</Label>
                    <Select name="recipient" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctorsList.map((doctor: any) => (
                          <SelectItem key={doctor.id} value={doctor.id.toString()}>
                            Dr. {doctor.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Progress Notes</Label>
                    <Textarea 
                      name="notes" 
                      placeholder="Add specific notes for the referring physician..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Include in Report</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="include-assessments" name="include-assessments" defaultChecked />
                        <Label htmlFor="include-assessments" className="text-sm">Recent assessments</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="include-progress" name="include-progress" defaultChecked />
                        <Label htmlFor="include-progress" className="text-sm">Progress metrics</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="include-recommendations" name="include-recommendations" defaultChecked />
                        <Label htmlFor="include-recommendations" className="text-sm">Treatment recommendations</Label>
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={shareProgressMutation.isPending}>
                    {shareProgressMutation.isPending ? 'Sharing...' : 'Share Progress Report'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Coordination */}
        <TabsContent value="coordination" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Care Team Messages */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Care Team Communications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    from: "Dr. Johnson (Orthopedics)",
                    message: "Patient showing good progress. Consider adding weight-bearing exercises.",
                    time: "2 hours ago",
                    type: "recommendation"
                  },
                  {
                    from: "Nurse Sarah",
                    message: "Patient reported increased pain after yesterday's session. Please assess.",
                    time: "1 day ago",
                    type: "alert"
                  },
                  {
                    from: "Dr. Ahmed",
                    message: "Thank you for the progress report. Patient cleared for return to work activities.",
                    time: "2 days ago",
                    type: "approval"
                  }
                ].map((message, index) => (
                  <div key={index} className="p-3 border-l-4 border-l-blue-500 bg-gray-50 rounded-r-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-sm">{message.from}</h5>
                      <Badge variant="outline" className="text-xs">
                        {message.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{message.message}</p>
                    <span className="text-xs text-gray-500">{message.time}</span>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <div className="flex gap-2">
                    <Input placeholder="Type a message to the care team..." className="flex-1" />
                    <Button size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Set Progress Alert
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Team Meeting
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export Progress Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Treatment Summary
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Treatment Integration */}
        <TabsContent value="integration" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prescription Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Treatment Plan Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Active Prescriptions</h4>
                  {prescriptions?.slice(0, 3).map((prescription: any) => (
                    <div key={prescription.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-sm">{prescription.medication}</h5>
                          <p className="text-xs text-gray-600">{prescription.dosage} - {prescription.frequency}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {prescription.status}
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500">No active prescriptions</p>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    View All Prescriptions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Equipment and Aids */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Equipment & Exercise Aids
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Recommended Equipment</h4>
                  {[
                    { name: "Resistance Bands", status: "Prescribed", priority: "High" },
                    { name: "Exercise Ball", status: "Available", priority: "Medium" },
                    { name: "Heat Therapy Pack", status: "In Use", priority: "Low" }
                  ].map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-sm">{item.name}</h5>
                          <p className="text-xs text-gray-600">Priority: {item.priority}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            item.status === 'Prescribed' ? 'bg-blue-100 text-blue-700' :
                            item.status === 'Available' ? 'bg-green-100 text-green-700' :
                            'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Request Equipment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}