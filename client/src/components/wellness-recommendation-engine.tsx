import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  Activity, 
  Apple,
  Droplets,
  Moon,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Brain,
  Utensils,
  Calendar,
  Clock,
  User,
  FileText,
  Send,
  RefreshCw,
  Lightbulb,
  Award,
  BarChart3,
  Settings,
  Bell
} from 'lucide-react';

interface WellnessRecommendationEngineProps {
  patientId: number;
  currentUser: any;
}

export default function WellnessRecommendationEngine({ patientId, currentUser }: WellnessRecommendationEngineProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCustomRecommendation, setShowCustomRecommendation] = useState(false);
  const { toast } = useToast();

  // Fetch patient data for personalized recommendations
  const { data: patient } = useQuery({
    queryKey: ['/api/patients', patientId],
  });

  const { data: visits } = useQuery({
    queryKey: ['/api/visits', patientId],
  });

  const { data: labResults } = useQuery({
    queryKey: ['/api/lab-results', patientId],
  });

  const { data: prescriptions } = useQuery({
    queryKey: ['/api/prescriptions', patientId],
  });

  // Generate wellness score based on patient data
  const calculateWellnessScore = () => {
    let score = 85; // Base score
    
    // Adjust based on age
    if (patient?.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
      if (age > 65) score -= 10;
      else if (age > 45) score -= 5;
    }
    
    // Adjust based on recent visits
    const recentVisits = visits?.filter((v: any) => {
      const visitDate = new Date(v.visitDate);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return visitDate > threeMonthsAgo;
    });
    
    if (recentVisits?.length > 3) score -= 15;
    
    // Adjust based on prescriptions
    if (prescriptions?.length > 5) score -= 10;
    
    return Math.max(score, 0);
  };

  const wellnessScore = calculateWellnessScore();

  // Generate personalized recommendations based on patient data
  const generateRecommendations = () => {
    const age = patient?.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 30;
    const gender = patient?.gender || 'unknown';
    const hasRecentVisits = visits?.length > 0;
    const activePrescriptions = prescriptions?.filter((p: any) => p.status === 'active') || [];

    const recommendations = [
      {
        id: 1,
        category: 'nutrition',
        priority: 'high',
        title: 'Balanced Nutrition Plan',
        description: 'Personalized meal planning based on your age, activity level, and health conditions',
        reasoning: `At ${age} years old, maintaining proper nutrition is crucial for overall health`,
        actions: [
          'Consume 5-7 servings of fruits and vegetables daily',
          'Include lean proteins with each meal',
          'Limit processed foods and added sugars',
          'Stay hydrated with 8-10 glasses of water daily'
        ],
        impact: 'High',
        timeframe: '4-6 weeks',
        evidence: 'Strong clinical evidence supports nutritional interventions for health maintenance'
      },
      {
        id: 2,
        category: 'exercise',
        priority: age > 50 ? 'high' : 'medium',
        title: 'Age-Appropriate Exercise Program',
        description: 'Customized physical activity recommendations tailored to your fitness level',
        reasoning: `Regular exercise is essential for ${gender === 'female' ? 'women' : 'men'} in this age group`,
        actions: [
          '150 minutes of moderate aerobic activity weekly',
          'Strength training exercises 2-3 times per week',
          'Balance and flexibility exercises daily',
          'Start slowly and gradually increase intensity'
        ],
        impact: 'High',
        timeframe: '6-8 weeks',
        evidence: 'WHO guidelines recommend regular physical activity for all adults'
      },
      {
        id: 3,
        category: 'preventive',
        priority: 'medium',
        title: 'Preventive Health Screenings',
        description: 'Schedule recommended health screenings based on your age and risk factors',
        reasoning: 'Early detection of health issues improves treatment outcomes significantly',
        actions: [
          age > 40 ? 'Annual comprehensive health check-up' : 'Biennial health screening',
          gender === 'female' && age > 21 ? 'Annual gynecological examination' : '',
          age > 50 ? 'Colonoscopy screening every 10 years' : '',
          'Blood pressure monitoring every 6 months'
        ].filter(Boolean),
        impact: 'High',
        timeframe: 'Ongoing',
        evidence: 'Preventive care guidelines from medical associations'
      },
      {
        id: 4,
        category: 'mental-health',
        priority: hasRecentVisits ? 'high' : 'low',
        title: 'Stress Management & Mental Wellness',
        description: 'Strategies to maintain good mental health and manage stress effectively',
        reasoning: hasRecentVisits ? 'Recent medical visits may indicate stress or health concerns' : 'Mental wellness is fundamental to overall health',
        actions: [
          'Practice mindfulness or meditation 10-15 minutes daily',
          'Maintain regular sleep schedule (7-9 hours nightly)',
          'Engage in social activities and maintain relationships',
          'Consider professional counseling if feeling overwhelmed'
        ],
        impact: 'Medium',
        timeframe: '2-4 weeks',
        evidence: 'Research shows strong connection between mental and physical health'
      },
      {
        id: 5,
        category: 'lifestyle',
        priority: activePrescriptions.length > 2 ? 'high' : 'medium',
        title: 'Lifestyle Modifications for Better Health',
        description: 'Simple daily changes that can significantly improve your health outcomes',
        reasoning: activePrescriptions.length > 2 ? 'Multiple medications suggest need for lifestyle support' : 'Healthy lifestyle choices prevent chronic diseases',
        actions: [
          'Quit smoking and limit alcohol consumption',
          'Maintain consistent sleep and wake times',
          'Reduce screen time before bedtime',
          'Practice good hygiene and safety measures'
        ],
        impact: 'Medium',
        timeframe: '8-12 weeks',
        evidence: 'Lifestyle interventions show proven benefits in chronic disease management'
      }
    ];

    return recommendations;
  };

  const recommendations = generateRecommendations();
  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.category === selectedCategory);

  // Mutations for recommendation actions
  const createWellnessPlanMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/wellness-plans', 'POST', data),
    onSuccess: () => {
      toast({ title: "Wellness plan created successfully" });
    },
  });

  const trackProgressMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/wellness-progress', 'POST', data),
    onSuccess: () => {
      toast({ title: "Progress tracked successfully" });
    },
  });

  const handleCreateWellnessPlan = (recommendationIds: number[]) => {
    const planData = {
      patientId,
      recommendationIds,
      createdBy: currentUser.id,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    createWellnessPlanMutation.mutate(planData);
  };

  // Health risk assessment
  const healthRisks = [
    {
      risk: 'Cardiovascular Disease',
      level: age > 45 ? 'moderate' : 'low',
      factors: age > 45 ? ['Age factor', 'Requires monitoring'] : ['Low risk age group'],
      prevention: 'Regular exercise, heart-healthy diet, blood pressure monitoring'
    },
    {
      risk: 'Diabetes Type 2',
      level: 'low',
      factors: ['No current indicators'],
      prevention: 'Maintain healthy weight, regular physical activity, balanced diet'
    },
    {
      risk: 'Osteoporosis',
      level: (patient?.gender === 'female' && age > 50) ? 'moderate' : 'low',
      factors: (patient?.gender === 'female' && age > 50) ? ['Female gender', 'Age factor'] : ['Low risk'],
      prevention: 'Weight-bearing exercises, adequate calcium and vitamin D intake'
    }
  ];

  // Wellness categories for filtering
  const categories = [
    { value: 'all', label: 'All Recommendations', icon: Target },
    { value: 'nutrition', label: 'Nutrition', icon: Apple },
    { value: 'exercise', label: 'Exercise', icon: Activity },
    { value: 'preventive', label: 'Preventive Care', icon: Shield },
    { value: 'mental-health', label: 'Mental Health', icon: Brain },
    { value: 'lifestyle', label: 'Lifestyle', icon: Heart }
  ];

  return (
    <div className="space-y-6">
      {/* Wellness Overview Dashboard */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Heart className="w-5 h-5" />
            Personalized Wellness Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  wellnessScore >= 80 ? 'bg-green-100' :
                  wellnessScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <span className={`text-2xl font-bold ${
                    wellnessScore >= 80 ? 'text-green-700' :
                    wellnessScore >= 60 ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {wellnessScore}
                  </span>
                </div>
              </div>
              <div className="text-sm font-medium">Wellness Score</div>
              <div className="text-xs text-gray-600">Overall health index</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-700">{recommendations.length}</div>
              <div className="text-sm font-medium">Active Recommendations</div>
              <div className="text-xs text-gray-600">Personalized for you</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-700">
                {recommendations.filter(r => r.priority === 'high').length}
              </div>
              <div className="text-sm font-medium">High Priority</div>
              <div className="text-xs text-gray-600">Immediate attention</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Award className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-700">78%</div>
              <div className="text-sm font-medium">Goal Achievement</div>
              <div className="text-xs text-gray-600">This month</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Recommendation Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  className="flex flex-col items-center gap-2 h-auto p-4"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="text-xs">{category.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">Personalized Recommendations</TabsTrigger>
          <TabsTrigger value="risk-assessment">Health Risk Assessment</TabsTrigger>
          <TabsTrigger value="wellness-plan">Wellness Plan</TabsTrigger>
          <TabsTrigger value="progress-tracking">Progress Tracking</TabsTrigger>
        </TabsList>

        {/* Personalized Recommendations */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {filteredRecommendations.map((recommendation) => (
              <Card key={recommendation.id} className={`border-l-4 ${
                recommendation.priority === 'high' ? 'border-l-red-500' :
                recommendation.priority === 'medium' ? 'border-l-yellow-500' :
                'border-l-green-500'
              }`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                      <p className="text-gray-600 mt-1">{recommendation.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge 
                        variant="outline"
                        className={
                          recommendation.priority === 'high' ? 'border-red-300 text-red-700' :
                          recommendation.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                          'border-green-300 text-green-700'
                        }
                      >
                        {recommendation.priority} priority
                      </Badge>
                      <Badge variant="secondary">{recommendation.impact} impact</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">Why this matters for you:</h4>
                    <p className="text-sm text-blue-700">{recommendation.reasoning}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Recommended Actions:</h4>
                    <ul className="space-y-1">
                      {recommendation.actions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Expected Timeline:</span>
                      <p className="text-gray-600">{recommendation.timeframe}</p>
                    </div>
                    <div>
                      <span className="font-medium">Impact Level:</span>
                      <p className="text-gray-600">{recommendation.impact}</p>
                    </div>
                    <div>
                      <span className="font-medium">Evidence Base:</span>
                      <p className="text-gray-600">Strong</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">
                      <strong>Evidence:</strong> {recommendation.evidence}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" className="flex-1">
                      <Star className="w-4 h-4 mr-1" />
                      Add to My Plan
                    </Button>
                    <Button size="sm" variant="outline">
                      <Lightbulb className="w-4 h-4 mr-1" />
                      Learn More
                    </Button>
                    <Button size="sm" variant="outline">
                      <Bell className="w-4 h-4 mr-1" />
                      Set Reminder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Health Risk Assessment */}
        <TabsContent value="risk-assessment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Personalized Health Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {healthRisks.map((risk, index) => (
                <Card key={index} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">{risk.risk}</h4>
                      <Badge 
                        variant="outline"
                        className={
                          risk.level === 'high' ? 'border-red-300 text-red-700' :
                          risk.level === 'moderate' ? 'border-yellow-300 text-yellow-700' :
                          'border-green-300 text-green-700'
                        }
                      >
                        {risk.level} risk
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <h5 className="text-sm font-medium mb-1">Risk Factors:</h5>
                        <div className="flex flex-wrap gap-1">
                          {risk.factors.map((factor, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-1">Prevention Strategy:</h5>
                        <p className="text-sm text-gray-600">{risk.prevention}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wellness Plan */}
        <TabsContent value="wellness-plan" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Your Personalized Wellness Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Selected Recommendations:</h4>
                  {recommendations.filter(r => r.priority === 'high').map((rec) => (
                    <div key={rec.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-sm">{rec.title}</div>
                        <div className="text-xs text-gray-600">{rec.timeframe}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full"
                  onClick={() => handleCreateWellnessPlan(recommendations.filter(r => r.priority === 'high').map(r => r.id))}
                  disabled={createWellnessPlanMutation.isPending}
                >
                  {createWellnessPlanMutation.isPending ? 'Creating...' : 'Create Wellness Plan'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Weekly Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { day: 'Monday', activities: ['30-min walk', 'Meal prep'] },
                  { day: 'Tuesday', activities: ['Strength training', 'Mindfulness'] },
                  { day: 'Wednesday', activities: ['Yoga session', 'Health screening'] },
                  { day: 'Thursday', activities: ['Cardio workout', 'Nutrition review'] },
                  { day: 'Friday', activities: ['Rest day', 'Social activity'] },
                  { day: 'Saturday', activities: ['Outdoor activity', 'Meal planning'] },
                  { day: 'Sunday', activities: ['Rest', 'Weekly review'] }
                ].map((schedule) => (
                  <div key={schedule.day} className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">{schedule.day}</span>
                    <div className="text-sm text-gray-600">
                      {schedule.activities.join(', ')}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Progress Tracking */}
        <TabsContent value="progress-tracking" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Wellness Progress Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { metric: 'Exercise Goals', current: 75, target: 100, unit: '%' },
                  { metric: 'Nutrition Score', current: 82, target: 90, unit: 'points' },
                  { metric: 'Sleep Quality', current: 68, target: 85, unit: '%' },
                  { metric: 'Stress Management', current: 71, target: 80, unit: 'points' }
                ].map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{metric.metric}</span>
                      <span>{metric.current}/{metric.target} {metric.unit}</span>
                    </div>
                    <Progress value={(metric.current / metric.target) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { activity: 'Completed 30-minute walk', time: '2 hours ago', points: '+10' },
                  { activity: 'Logged healthy meal', time: '4 hours ago', points: '+5' },
                  { activity: 'Practiced meditation', time: '1 day ago', points: '+8' },
                  { activity: 'Attended health screening', time: '2 days ago', points: '+15' }
                ].map((activity, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium">{activity.activity}</div>
                      <div className="text-xs text-gray-600">{activity.time}</div>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {activity.points}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}