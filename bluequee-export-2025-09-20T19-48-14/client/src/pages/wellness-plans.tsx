import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  User, 
  Calendar, 
  Target, 
  Activity, 
  Heart, 
  Brain,
  Apple,
  Dumbbell,
  Moon,
  Droplets,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';

export default function WellnessPlansPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('active-plans');

  // Button handlers
  const handleCreatePlan = () => {
    setShowCreatePlan(true);
    toast({
      title: "Create New Plan",
      description: "Opening plan creation dialog...",
    });
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    toast({
      title: "Edit Plan",
      description: `Editing plan for ${plan.patientName}`,
    });
  };

  const handleDeletePlan = (planId: number) => {
    toast({
      title: "Delete Plan",
      description: "Plan deleted successfully",
      variant: "destructive",
    });
  };

  const handleUseTemplate = (template: any) => {
    setShowCreatePlan(true);
    toast({
      title: "Template Selected",
      description: `Using ${template.name} template`,
    });
  };

  const handleStatusChange = (planId: number, newStatus: string) => {
    toast({
      title: "Status Updated",
      description: `Plan status changed to ${newStatus}`,
    });
  };

  // Sample wellness plans data
  const wellnessPlans = [
    {
      id: 1,
      patientName: 'Abike Jare',
      patientId: 6,
      planType: 'Weight Management',
      status: 'active',
      startDate: '2025-01-15',
      endDate: '2025-04-15',
      progress: 75,
      goals: [
        { category: 'Exercise', target: '150 min/week', current: '120 min/week', progress: 80 },
        { category: 'Nutrition', target: '2000 cal/day', current: '1950 cal/day', progress: 95 },
        { category: 'Weight', target: '-5 kg', current: '-3.5 kg', progress: 70 }
      ],
      nextAppointment: '2025-02-10'
    },
    {
      id: 2,
      patientName: 'Fatimah Ibrahim',
      patientId: 5,
      planType: 'Mental Health Support',
      status: 'active',
      startDate: '2025-01-20',
      endDate: '2025-05-20',
      progress: 60,
      goals: [
        { category: 'Meditation', target: '20 min/day', current: '15 min/day', progress: 75 },
        { category: 'Sleep', target: '8 hours/night', current: '7 hours/night', progress: 87 },
        { category: 'Therapy Sessions', target: '1/week', current: '1/week', progress: 100 }
      ],
      nextAppointment: '2025-02-08'
    },
    {
      id: 3,
      patientName: 'Ade Bola',
      patientId: 3,
      planType: 'Diabetes Management',
      status: 'pending',
      startDate: '2025-02-01',
      endDate: '2025-08-01',
      progress: 0,
      goals: [
        { category: 'Blood Sugar', target: '<140 mg/dL', current: 'Not started', progress: 0 },
        { category: 'Exercise', target: '30 min/day', current: 'Not started', progress: 0 },
        { category: 'Diet Compliance', target: '90%', current: 'Not started', progress: 0 }
      ],
      nextAppointment: '2025-02-05'
    }
  ];

  const planTemplates = [
    {
      name: 'Weight Management',
      description: 'Comprehensive plan for healthy weight loss and maintenance',
      duration: '12 weeks',
      categories: ['Exercise', 'Nutrition', 'Monitoring']
    },
    {
      name: 'Mental Health Support',
      description: 'Holistic mental wellness with therapy and lifestyle changes',
      duration: '16 weeks',
      categories: ['Therapy', 'Mindfulness', 'Sleep', 'Social Support']
    },
    {
      name: 'Diabetes Management',
      description: 'Complete diabetes care plan with monitoring and lifestyle adjustments',
      duration: '24 weeks',
      categories: ['Blood Sugar Monitoring', 'Diet', 'Exercise', 'Medication']
    },
    {
      name: 'Hypertension Control',
      description: 'Blood pressure management through lifestyle modifications',
      duration: '20 weeks',
      categories: ['Diet', 'Exercise', 'Stress Management', 'Monitoring']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredPlans = wellnessPlans.filter(plan => {
    const matchesSearch = plan.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.planType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Patient Wellness Plans</h1>
            <p className="text-purple-100">Manage personalized wellness programs for your patients</p>
          </div>
          <Button 
            onClick={handleCreatePlan}
            className="bg-white text-purple-600 hover:bg-purple-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search patients or plan types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active-plans">Active Plans</TabsTrigger>
          <TabsTrigger value="templates">Plan Templates</TabsTrigger>
        </TabsList>

        {/* Active Plans */}
        <TabsContent value="active-plans" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{plan.patientName}</CardTitle>
                        <p className="text-sm text-gray-600">ID: {plan.patientId}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(plan.status)}>
                      {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-purple-800 mb-2">{plan.planType}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {plan.startDate} - {plan.endDate}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className={`text-sm font-bold ${getProgressColor(plan.progress)}`}>
                        {plan.progress}%
                      </span>
                    </div>
                    <Progress value={plan.progress} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Goals Progress</h4>
                    {plan.goals.map((goal, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{goal.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{goal.current}</span>
                          <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 transition-all duration-300"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{goal.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      Next: {plan.nextAppointment}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditPlan(plan)}
                        className="hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPlans.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No plans found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </TabsContent>

        {/* Plan Templates */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {planTemplates.map((template, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    {template.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">{template.description}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    Duration: {template.duration}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Includes:</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.categories.map((category, catIndex) => (
                        <Badge key={catIndex} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button 
                    className="w-full hover:bg-purple-50" 
                    variant="outline"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Plan Dialog */}
      <Dialog open={showCreatePlan} onOpenChange={setShowCreatePlan}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Wellness Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Patient</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient1">Adaora Okafor</SelectItem>
                  <SelectItem value="patient2">Chidi Nwankwo</SelectItem>
                  <SelectItem value="patient3">Fatima Abdullahi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight-management">Weight Management</SelectItem>
                  <SelectItem value="diabetes-control">Diabetes Control</SelectItem>
                  <SelectItem value="mental-wellness">Mental Wellness</SelectItem>
                  <SelectItem value="senior-care">Senior Care</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (weeks)</label>
              <Input type="number" placeholder="12" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Goals</label>
              <Textarea placeholder="Enter wellness goals..." />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCreatePlan(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowCreatePlan(false);
              toast({
                title: "Plan Created",
                description: "New wellness plan has been created successfully",
              });
            }}>
              Create Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}