import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  Users, 
  Calendar, 
  FileText, 
  Target,
  TrendingUp,
  BarChart3,
  Award,
  BookOpen,
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  Clock,
  Heart,
  Brain,
  Zap,
  Star,
  Timer,
  MapPin
} from 'lucide-react';

interface EnhancedPhysiotherapyDashboardProps {
  patients: any[];
  assessments: any[];
}

export default function EnhancedPhysiotherapyDashboard({ patients, assessments }: EnhancedPhysiotherapyDashboardProps) {
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedPhase, setSelectedPhase] = useState('all');

  // Calculate enhanced statistics
  const totalPatients = patients.length;
  const activePatients = patients.filter(p => assessments.some(a => a.patientId === p.id)).length;
  const completedSessions = assessments.length;
  const avgImprovement = assessments.length > 0 ? Math.round(assessments.reduce((acc, curr) => acc + (curr.improvementScore || 0), 0) / assessments.length) : 0;

  // Treatment protocols with evidence-based data
  const treatmentProtocols = [
    {
      id: 1,
      name: "Lumbar Spine Stabilization Program",
      condition: "Lower Back Pain",
      duration: "6-8 weeks",
      sessions: "12-16",
      evidenceLevel: "1A",
      successRate: 0,
      phases: [
        { name: "Acute Pain Management", duration: "1-2 weeks", focus: "Pain reduction, inflammation control" },
        { name: "Mobility Restoration", duration: "2-3 weeks", focus: "Range of motion, flexibility" },
        { name: "Core Strengthening", duration: "2-3 weeks", focus: "Stability, endurance" },
        { name: "Functional Integration", duration: "1-2 weeks", focus: "Return to activities" }
      ],
      exercises: ["Cat-Cow stretches", "Dead bug", "Bird dog", "Wall sits", "Planks"],
      contraindications: ["Acute disc herniation", "Severe spinal stenosis"],
      outcomes: ["Roland Morris Disability Questionnaire", "Visual Analog Scale", "Oswestry Disability Index"]
    },
    {
      id: 2,
      name: "Post-ACL Reconstruction Protocol",
      condition: "Knee Injury",
      duration: "16-24 weeks",
      sessions: "32-48",
      evidenceLevel: "1A",
      successRate: 0,
      phases: [
        { name: "Protection Phase", duration: "0-2 weeks", focus: "Wound healing, basic ROM" },
        { name: "Motion Phase", duration: "2-6 weeks", focus: "Full ROM, strength initiation" },
        { name: "Strength Phase", duration: "6-12 weeks", focus: "Progressive strengthening" },
        { name: "Return to Sport", duration: "12-24 weeks", focus: "Sport-specific training" }
      ],
      exercises: ["Quad sets", "Straight leg raises", "Stationary bike", "Squats", "Plyometrics"],
      contraindications: ["Infection", "Graft failure", "Severe pain"],
      outcomes: ["Lysholm Knee Score", "IKDC Subjective Score", "Hop tests"]
    },
    {
      id: 3,
      name: "Shoulder Impingement Syndrome Treatment",
      condition: "Shoulder Injury",
      duration: "6-12 weeks",
      sessions: "12-24",
      evidenceLevel: "1B",
      successRate: 87,
      phases: [
        { name: "Pain Control", duration: "1-2 weeks", focus: "Reduce inflammation" },
        { name: "Mobility", duration: "2-4 weeks", focus: "Restore range of motion" },
        { name: "Strengthening", duration: "4-8 weeks", focus: "Rotator cuff strength" },
        { name: "Functional Return", duration: "2-4 weeks", focus: "Activity-specific training" }
      ],
      exercises: ["Pendulum swings", "Cross-body stretch", "External rotation", "Scapular retraction"],
      contraindications: ["Full thickness tear", "Severe arthritis"],
      outcomes: ["DASH Score", "Constant-Murley Score", "Range of motion measurements"]
    }
  ];

  // Outcome measurement tools
  const outcomeTools = [
    {
      name: "Visual Analog Scale (VAS)",
      category: "Pain Assessment",
      scale: "0-10",
      description: "Patient-reported pain intensity",
      administration: "2-3 minutes",
      reliability: "Excellent (ICC > 0.90)"
    },
    {
      name: "Oswestry Disability Index (ODI)",
      category: "Functional Assessment",
      scale: "0-100%",
      description: "Back pain functional disability",
      administration: "5-10 minutes",
      reliability: "Excellent (ICC = 0.90)"
    },
    {
      name: "DASH Questionnaire",
      category: "Upper Extremity",
      scale: "0-100",
      description: "Arm, shoulder, hand disabilities",
      administration: "10-15 minutes",
      reliability: "Excellent (ICC = 0.96)"
    },
    {
      name: "Berg Balance Scale",
      category: "Balance Assessment",
      scale: "0-56",
      description: "Balance performance in elderly",
      administration: "15-20 minutes",
      reliability: "Excellent (ICC = 0.98)"
    }
  ];

  // Specialized assessment techniques
  const assessmentTechniques = [
    {
      name: "Movement Analysis",
      description: "Comprehensive movement pattern assessment",
      components: ["Gait analysis", "Functional movement screen", "Postural assessment"],
      tools: ["Video analysis", "Force plates", "EMG monitoring"],
      duration: "45-60 minutes"
    },
    {
      name: "Manual Therapy Assessment",
      description: "Hands-on evaluation of joint and soft tissue",
      components: ["Joint mobility", "Muscle length", "Tissue quality"],
      tools: ["Goniometer", "Tape measure", "Palpation"],
      duration: "30-45 minutes"
    },
    {
      name: "Neurological Screening",
      description: "Assessment of nervous system function",
      components: ["Reflexes", "Sensation", "Motor control"],
      tools: ["Reflex hammer", "Monofilament", "Tuning fork"],
      duration: "20-30 minutes"
    }
  ];

  const filteredProtocols = treatmentProtocols.filter(protocol => 
    selectedCondition === 'all' || protocol.condition.toLowerCase().includes(selectedCondition.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Patients</p>
                <p className="text-2xl font-bold text-blue-800">{totalPatients}</p>
                <p className="text-xs text-blue-600">Active caseload</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Active Cases</p>
                <p className="text-2xl font-bold text-green-800">{activePatients}</p>
                <p className="text-xs text-green-600">Under treatment</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Sessions</p>
                <p className="text-2xl font-bold text-purple-800">{completedSessions}</p>
                <p className="text-xs text-purple-600">This month</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Avg Progress</p>
                <p className="text-2xl font-bold text-orange-800">{avgImprovement}%</p>
                <p className="text-xs text-orange-600">Improvement rate</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700">Success Rate</p>
                <p className="text-2xl font-bold text-indigo-800">89%</p>
                <p className="text-xs text-indigo-600">Treatment outcomes</p>
              </div>
              <Award className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Adherence</p>
                <p className="text-2xl font-bold text-red-800">94%</p>
                <p className="text-xs text-red-600">Exercise compliance</p>
              </div>
              <Heart className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Content Tabs */}
      <Tabs defaultValue="protocols" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="protocols" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Evidence-Based Protocols
          </TabsTrigger>
          <TabsTrigger value="assessments" className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Assessment Techniques
          </TabsTrigger>
          <TabsTrigger value="outcomes" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Outcome Measures
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Clinical Analytics
          </TabsTrigger>
          <TabsTrigger value="research" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Research Tools
          </TabsTrigger>
        </TabsList>

        {/* Evidence-Based Treatment Protocols */}
        <TabsContent value="protocols" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Evidence-Based Treatment Protocols
              </CardTitle>
              <div className="flex gap-4">
                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conditions</SelectItem>
                    <SelectItem value="back">Back Pain</SelectItem>
                    <SelectItem value="knee">Knee Injury</SelectItem>
                    <SelectItem value="shoulder">Shoulder Injury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProtocols.map((protocol) => (
                  <Card key={protocol.id} className="border-blue-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-blue-800">{protocol.name}</CardTitle>
                          <p className="text-sm text-blue-600">{protocol.condition}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          Level {protocol.evidenceLevel}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Protocol Overview */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Duration:</span>
                          <p className="text-gray-600">{protocol.duration}</p>
                        </div>
                        <div>
                          <span className="font-medium">Sessions:</span>
                          <p className="text-gray-600">{protocol.sessions}</p>
                        </div>
                      </div>

                      {/* Success Rate */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Success Rate</span>
                          <span className="font-medium text-green-600">{protocol.successRate}%</span>
                        </div>
                        <Progress value={protocol.successRate} className="h-2" />
                      </div>

                      {/* Treatment Phases */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Treatment Phases</h4>
                        <div className="space-y-1">
                          {protocol.phases.map((phase, index) => (
                            <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                              <div className="font-medium">{phase.name}</div>
                              <div className="text-gray-600">{phase.duration} - {phase.focus}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Key Exercises */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Key Exercises</h4>
                        <div className="flex flex-wrap gap-1">
                          {protocol.exercises.slice(0, 3).map((exercise, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {exercise}
                            </Badge>
                          ))}
                          {protocol.exercises.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{protocol.exercises.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Apply Protocol
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessment Techniques */}
        <TabsContent value="assessments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Specialized Assessment Techniques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessmentTechniques.map((technique, index) => (
                  <Card key={index} className="border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-purple-800">{technique.name}</CardTitle>
                      <p className="text-sm text-purple-600">{technique.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Components</h4>
                        <div className="space-y-1">
                          {technique.components.map((component, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              {component}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Required Tools</h4>
                        <div className="flex flex-wrap gap-1">
                          {technique.tools.map((tool, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Timer className="w-4 h-4" />
                        Duration: {technique.duration}
                      </div>

                      <Button variant="outline" className="w-full">
                        View Assessment Protocol
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outcome Measures */}
        <TabsContent value="outcomes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Standardized Outcome Measurement Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {outcomeTools.map((tool, index) => (
                  <Card key={index} className="border-green-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-green-800">{tool.name}</CardTitle>
                          <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                            {tool.category}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">Scale</div>
                          <div className="text-xs text-gray-600">{tool.scale}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-700">{tool.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Administration:</span>
                          <p className="text-gray-600">{tool.administration}</p>
                        </div>
                        <div>
                          <span className="font-medium">Reliability:</span>
                          <p className="text-gray-600">{tool.reliability}</p>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full">
                        Use Assessment Tool
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clinical Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <BarChart3 className="w-5 h-5" />
                  Treatment Effectiveness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {['Lower Back Pain', 'Knee Injury', 'Shoulder Impingement'].map((condition, index) => {
                    const effectiveness = [92, 89, 87][index];
                    return (
                      <div key={condition} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{condition}</span>
                          <span className="font-medium">{effectiveness}%</span>
                        </div>
                        <Progress value={effectiveness} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <TrendingUp className="w-5 h-5" />
                  Recovery Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-700">78%</div>
                  <div className="text-sm text-green-600">Average Improvement</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pain Reduction</span>
                    <span className="text-green-600">↓ 65%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Function Improvement</span>
                    <span className="text-green-600">↑ 82%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quality of Life</span>
                    <span className="text-green-600">↑ 74%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Clock className="w-5 h-5" />
                  Session Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-700">12.5</div>
                    <div className="text-xs text-purple-600">Avg Sessions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-700">6.2</div>
                    <div className="text-xs text-purple-600">Avg Weeks</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Attendance Rate</span>
                    <span className="text-purple-600">94%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Exercise Compliance</span>
                    <span className="text-purple-600">87%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Research Tools */}
        <TabsContent value="research" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Clinical Research & Evidence Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-indigo-200">
                  <CardHeader>
                    <CardTitle className="text-indigo-800">Evidence Database Access</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {[
                        { name: "PubMed", articles: "2,847 relevant articles" },
                        { name: "Cochrane Library", reviews: "156 systematic reviews" },
                        { name: "PEDro", trials: "892 clinical trials" },
                        { name: "APTA Guidelines", protocols: "45 clinical protocols" }
                      ].map((source, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-indigo-50 rounded">
                          <span className="font-medium">{source.name}</span>
                          <span className="text-sm text-indigo-600">
                            {source.articles || source.reviews || source.trials || source.protocols}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      Access Evidence Database
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-orange-800">Clinical Decision Support</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {[
                        "Treatment algorithm recommendations",
                        "Contraindication screening",
                        "Outcome prediction models",
                        "Dosage optimization tools"
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full border-orange-300 text-orange-700">
                      Launch Decision Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}