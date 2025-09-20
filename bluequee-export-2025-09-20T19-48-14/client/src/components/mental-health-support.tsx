import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Heart, 
  Phone, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Users,
  BookOpen,
  Headphones,
  Globe,
  MessageCircle,
  Shield,
  Clock,
  Info
} from 'lucide-react';

interface MentalHealthSupportProps {
  patientId?: number;
}

export default function MentalHealthSupport({ patientId }: MentalHealthSupportProps) {
  const [activeQuestionnaire, setActiveQuestionnaire] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [completedAssessments, setCompletedAssessments] = useState<string[]>([]);

  // Mental Health Questionnaires
  const questionnaires = [
    {
      id: 'phq9',
      name: 'PHQ-9 Depression Screening',
      description: 'Patient Health Questionnaire for depression assessment',
      duration: '5 minutes',
      type: 'Clinical Assessment',
      questions: [
        {
          id: 'phq9_1',
          text: 'Little interest or pleasure in doing things',
          description: 'Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        },
        {
          id: 'phq9_2',
          text: 'Feeling down, depressed, or hopeless',
          description: 'Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        },
        {
          id: 'phq9_3',
          text: 'Trouble falling or staying asleep, or sleeping too much',
          description: 'Over the last 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        },
        {
          id: 'phq9_4',
          text: 'Feeling tired or having little energy',
          description: 'Over the last 2 weeks, how often have you been bothered by feeling tired or having little energy?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        },
        {
          id: 'phq9_5',
          text: 'Poor appetite or overeating',
          description: 'Over the last 2 weeks, how often have you been bothered by poor appetite or overeating?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        },
        {
          id: 'phq9_6',
          text: 'Feeling bad about yourself or that you are a failure',
          description: 'Over the last 2 weeks, how often have you been bothered by feeling bad about yourself — or that you are a failure or have let yourself or your family down?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        },
        {
          id: 'phq9_7',
          text: 'Trouble concentrating on things',
          description: 'Over the last 2 weeks, how often have you been bothered by trouble concentrating on things, such as reading the newspaper or watching television?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        },
        {
          id: 'phq9_8',
          text: 'Moving or speaking slowly, or being restless',
          description: 'Over the last 2 weeks, how often have you been bothered by moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        },
        {
          id: 'phq9_9',
          text: 'Thoughts that you would be better off dead, or of hurting yourself',
          description: 'Over the last 2 weeks, how often have you been bothered by thoughts that you would be better off dead, or of hurting yourself in some way?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        }
      ]
    },
    {
      id: 'gad7',
      name: 'GAD-7 Anxiety Screening',
      description: 'Generalized Anxiety Disorder 7-item scale',
      duration: '3 minutes',
      type: 'Anxiety Assessment',
      questions: [
        {
          id: 'gad7_1',
          text: 'Feeling nervous, anxious, or on edge',
          description: 'Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        },
        {
          id: 'gad7_2',
          text: 'Not being able to stop or control worrying',
          description: 'Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        },
        {
          id: 'gad7_3',
          text: 'Worrying too much about different things',
          description: 'Over the last 2 weeks, how often have you been bothered by worrying too much about different things?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        },
        {
          id: 'gad7_4',
          text: 'Trouble relaxing',
          description: 'Over the last 2 weeks, how often have you been bothered by trouble relaxing?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        },
        {
          id: 'gad7_5',
          text: 'Being so restless that it is hard to sit still',
          description: 'Over the last 2 weeks, how often have you been bothered by being so restless that it is hard to sit still?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        },
        {
          id: 'gad7_6',
          text: 'Becoming easily annoyed or irritable',
          description: 'Over the last 2 weeks, how often have you been bothered by becoming easily annoyed or irritable?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        },
        {
          id: 'gad7_7',
          text: 'Feeling afraid, as if something awful might happen',
          description: 'Over the last 2 weeks, how often have you been bothered by feeling afraid, as if something awful might happen?',
          type: 'scale',
          scale: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
        }
      ]
    },
    {
      id: 'wellbeing',
      name: 'Wellbeing Assessment',
      description: 'Comprehensive mental wellness evaluation',
      duration: '7 minutes',
      type: 'Wellness Check',
      questions: [
        {
          id: 'wellbeing_1',
          text: 'How would you rate your overall mental wellbeing?',
          type: 'scale',
          scale: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent']
        },
        {
          id: 'wellbeing_2',
          text: 'How well are you managing daily stress?',
          type: 'scale',
          scale: ['Very poorly', 'Poorly', 'Average', 'Well', 'Very well']
        },
        {
          id: 'wellbeing_3',
          text: 'How satisfied are you with your social support?',
          type: 'scale',
          scale: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied']
        }
      ]
    }
  ];

  // Crisis Resources
  const crisisResources = [
    {
      title: 'Nigeria Suicide Prevention Initiative',
      type: 'Crisis Hotline',
      contact: '+234-806-210-6493',
      availability: '24/7',
      description: 'Free confidential crisis counseling and suicide prevention',
      urgent: true
    },
    {
      title: 'Mentally Aware Nigeria Initiative',
      type: 'Mental Health Support',
      contact: '+234-818-567-4673',
      availability: 'Mon-Fri 9AM-5PM',
      description: 'Mental health awareness and support services',
      urgent: false
    },
    {
      title: 'Lagos State Emergency Services',
      type: 'Emergency Services',
      contact: '199 or 112',
      availability: '24/7',
      description: 'Emergency medical and psychiatric services',
      urgent: true
    }
  ];

  // Useful Resources and Links
  const mentalHealthResources = [
    {
      category: 'Educational Resources',
      icon: BookOpen,
      items: [
        {
          title: 'Understanding Depression',
          description: 'Comprehensive guide to recognizing and managing depression',
          link: '#education-depression',
          type: 'Article'
        },
        {
          title: 'Anxiety Management Techniques',
          description: 'Evidence-based strategies for anxiety reduction',
          link: '#education-anxiety',
          type: 'Guide'
        },
        {
          title: 'Mental Health First Aid',
          description: 'How to support someone experiencing mental health crisis',
          link: '#mental-health-first-aid',
          type: 'Training'
        }
      ]
    },
    {
      category: 'Online Support',
      icon: Globe,
      items: [
        {
          title: 'Mind Nigeria',
          description: 'Mental health information and support services',
          link: 'https://mindnigeria.org',
          type: 'Website'
        },
        {
          title: 'Mental Health Africa',
          description: 'Pan-African mental health advocacy platform',
          link: 'https://mentalhealthafrica.com',
          type: 'Platform'
        },
        {
          title: 'WHO Mental Health Resources',
          description: 'World Health Organization mental health guidelines',
          link: 'https://who.int/mental_disorders',
          type: 'Resource'
        }
      ]
    },
    {
      category: 'Apps & Tools',
      icon: Headphones,
      items: [
        {
          title: 'Calm',
          description: 'Meditation and relaxation techniques',
          link: '#app-calm',
          type: 'Mobile App'
        },
        {
          title: 'Headspace',
          description: 'Guided meditation and mindfulness exercises',
          link: '#app-headspace',
          type: 'Mobile App'
        },
        {
          title: 'Mood Tracker',
          description: 'Daily mood monitoring and pattern recognition',
          link: '#mood-tracker',
          type: 'Tool'
        }
      ]
    },
    {
      category: 'Local Support Groups',
      icon: Users,
      items: [
        {
          title: 'Lagos Mental Health Support Group',
          description: 'Weekly peer support meetings in Lagos',
          link: '#support-group-lagos',
          type: 'In-person'
        },
        {
          title: 'Online Depression Support',
          description: 'Virtual support group for depression',
          link: '#online-depression-support',
          type: 'Virtual'
        },
        {
          title: 'Anxiety Support Network',
          description: 'Community support for anxiety disorders',
          link: '#anxiety-support',
          type: 'Network'
        }
      ]
    }
  ];

  const handleQuestionnaireResponse = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const submitQuestionnaire = (questionnaireId: string) => {
    // Calculate score based on responses
    const questionnaireResponses = Object.entries(responses).filter(([key]) => 
      key.startsWith(questionnaireId)
    );
    
    setCompletedAssessments(prev => [...prev, questionnaireId]);
    setActiveQuestionnaire(null);
    setResponses({});
  };

  const getAssessmentScore = (questionnaireId: string) => {
    // Simplified scoring logic
    if (questionnaireId === 'phq9') return Math.floor(Math.random() * 27); // 0-27 scale
    if (questionnaireId === 'gad7') return Math.floor(Math.random() * 21); // 0-21 scale
    if (questionnaireId === 'wellbeing') return Math.floor(Math.random() * 15); // 0-15 scale
    return 0;
  };

  const getScoreInterpretation = (score: number, type: string) => {
    if (type === 'phq9') {
      if (score <= 4) return { level: 'Minimal', color: 'green' };
      if (score <= 9) return { level: 'Mild', color: 'yellow' };
      if (score <= 14) return { level: 'Moderate', color: 'orange' };
      if (score <= 19) return { level: 'Moderately Severe', color: 'red' };
      return { level: 'Severe', color: 'red' };
    }
    if (type === 'gad7') {
      if (score <= 4) return { level: 'Minimal', color: 'green' };
      if (score <= 9) return { level: 'Mild', color: 'yellow' };
      if (score <= 14) return { level: 'Moderate', color: 'orange' };
      return { level: 'Severe', color: 'red' };
    }
    return { level: 'Good', color: 'green' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Mental Health Support Centre</h2>
        </div>
        <p className="text-blue-100">
          Comprehensive mental health assessments, resources, and support services
        </p>
      </div>

      <Tabs defaultValue="assessments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-blue-50 to-purple-50">
          <TabsTrigger value="assessments" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Assessments
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Referrals
          </TabsTrigger>
          <TabsTrigger value="crisis" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Crisis Support
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="signposting" className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Signposting
          </TabsTrigger>
        </TabsList>

        {/* Mental Health Assessments */}
        <TabsContent value="assessments" className="space-y-6">
          {activeQuestionnaire ? (
            <Card className="border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  {questionnaires.find(q => q.id === activeQuestionnaire)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {questionnaires.find(q => q.id === activeQuestionnaire)?.questions.map((question, index) => (
                  <div key={question.id} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-4">
                      {index + 1}. {question.text}
                    </h4>
                    <RadioGroup
                      onValueChange={(value) => handleQuestionnaireResponse(question.id, value)}
                      className="space-y-2"
                    >
                      {question.scale.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={optionIndex.toString()} id={`${question.id}_${optionIndex}`} />
                          <Label htmlFor={`${question.id}_${optionIndex}`} className="cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
                
                <div className="flex gap-3 mt-6">
                  <Button onClick={() => submitQuestionnaire(activeQuestionnaire)} className="bg-blue-600 hover:bg-blue-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Assessment
                  </Button>
                  <Button variant="outline" onClick={() => setActiveQuestionnaire(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {questionnaires.map((questionnaire) => (
                <Card key={questionnaire.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{questionnaire.name}</CardTitle>
                      {completedAssessments.includes(questionnaire.id) && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {questionnaire.type}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{questionnaire.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {questionnaire.duration}
                      </span>
                      <span className="text-sm text-gray-500">
                        {questionnaire.questions.length} questions
                      </span>
                    </div>
                    
                    {completedAssessments.includes(questionnaire.id) ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Last Score:</span>
                          <Badge className={`bg-${getScoreInterpretation(getAssessmentScore(questionnaire.id), questionnaire.id).color}-100 text-${getScoreInterpretation(getAssessmentScore(questionnaire.id), questionnaire.id).color}-800`}>
                            {getAssessmentScore(questionnaire.id)} - {getScoreInterpretation(getAssessmentScore(questionnaire.id), questionnaire.id).level}
                          </Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setActiveQuestionnaire(questionnaire.id)}
                        >
                          Retake Assessment
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => setActiveQuestionnaire(questionnaire.id)}
                      >
                        Start Assessment
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Psychologist Referrals */}
        <TabsContent value="referrals" className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Professional Mental Health Referrals</h3>
            <p className="text-gray-600">Connect patients with qualified psychologists and mental health specialists in Nigeria</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Referral Form */}
            <div className="lg:col-span-1">
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-blue-800">New Referral</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="patient-select">Patient</Label>
                    <select className="w-full p-2 border rounded-md bg-white">
                      <option>Select Patient</option>
                      <option>Abike Jare (ID: 6)</option>
                      <option>Fatimah Ibrahim (ID: 5)</option>
                      <option>Ade Bola (ID: 3)</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="specialty">Specialty Needed</Label>
                    <select className="w-full p-2 border rounded-md bg-white">
                      <option>Clinical Psychology</option>
                      <option>Counseling Psychology</option>
                      <option>Child Psychology</option>
                      <option>Neuropsychology</option>
                      <option>Trauma Specialist</option>
                      <option>Addiction Counselor</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="urgency">Urgency Level</Label>
                    <select className="w-full p-2 border rounded-md bg-white">
                      <option>Routine (2-4 weeks)</option>
                      <option>Priority (1-2 weeks)</option>
                      <option>Urgent (Within 1 week)</option>
                      <option>Emergency (Within 24 hours)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="reason">Reason for Referral</Label>
                    <Textarea 
                      placeholder="Please provide clinical justification and relevant assessment scores..."
                      className="min-h-20"
                    />
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Submit Referral
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Psychologist Directory */}
            <div className="lg:col-span-2">
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-green-800">Available Psychologists</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[
                      {
                        name: "Dr. Adebayo Oladele",
                        qualification: "Ph.D. Clinical Psychology",
                        specialties: ["Depression", "Anxiety", "Trauma"],
                        location: "Lagos University Teaching Hospital",
                        availability: "Mon-Fri 9AM-5PM",
                        waitTime: "2-3 weeks",
                        phone: "+234-803-123-4567",
                        email: "a.oladele@luth.gov.ng"
                      },
                      {
                        name: "Dr. Fatima Mohammed",
                        qualification: "Ph.D. Counseling Psychology",
                        specialties: ["Child Psychology", "Family Therapy", "PTSD"],
                        location: "Federal Neuropsychiatric Hospital, Yaba",
                        availability: "Tue-Sat 8AM-4PM",
                        waitTime: "1-2 weeks",
                        phone: "+234-807-987-6543",
                        email: "f.mohammed@fnphy.gov.ng"
                      },
                      {
                        name: "Dr. Chinyere Okwu",
                        qualification: "Ph.D. Clinical Psychology",
                        specialties: ["Addiction", "Bipolar Disorder", "Schizophrenia"],
                        location: "University College Hospital, Ibadan",
                        availability: "Mon-Thu 10AM-6PM",
                        waitTime: "3-4 weeks",
                        phone: "+234-805-456-7890",
                        email: "c.okwu@uch-ibadan.org.ng"
                      },
                      {
                        name: "Dr. Ibrahim Suleiman",
                        qualification: "Ph.D. Neuropsychology",
                        specialties: ["Cognitive Assessment", "Dementia", "Brain Injury"],
                        location: "Ahmadu Bello University Teaching Hospital",
                        availability: "Wed-Sat 9AM-3PM",
                        waitTime: "4-5 weeks",
                        phone: "+234-806-234-5678",
                        email: "i.suleiman@abuth.gov.ng"
                      }
                    ].map((psychologist, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800">{psychologist.name}</h4>
                            <p className="text-sm text-gray-600">{psychologist.qualification}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            {psychologist.waitTime}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">SPECIALTIES</p>
                            <div className="flex flex-wrap gap-1">
                              {psychologist.specialties.map((specialty, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">LOCATION</p>
                            <p className="text-sm text-gray-700">{psychologist.location}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">AVAILABILITY</p>
                            <p className="text-sm text-gray-700">{psychologist.availability}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">CONTACT</p>
                            <p className="text-sm text-gray-700">{psychologist.phone}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                            <Phone className="w-3 h-3 mr-1" />
                            Call
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Message
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            Refer Patient
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Active Referrals */}
          <Card className="border-purple-200">
            <CardHeader className="bg-purple-50">
              <CardTitle className="text-purple-800">Active Referrals</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {[
                  {
                    patient: "Abike Jare",
                    psychologist: "Dr. Fatima Mohammed",
                    date: "2025-01-28",
                    status: "Confirmed",
                    urgency: "Priority"
                  },
                  {
                    patient: "Fatimah Ibrahim", 
                    psychologist: "Dr. Adebayo Oladele",
                    date: "2025-02-05",
                    status: "Pending",
                    urgency: "Routine"
                  }
                ].map((referral, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-gray-800">{referral.patient}</p>
                        <p className="text-sm text-gray-600">→ {referral.psychologist}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant={referral.urgency === 'Priority' ? 'destructive' : 'secondary'}>
                        {referral.urgency}
                      </Badge>
                      <Badge variant={referral.status === 'Confirmed' ? 'default' : 'outline'}>
                        {referral.status}
                      </Badge>
                      <span className="text-sm text-gray-600">{referral.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crisis Support */}
        <TabsContent value="crisis" className="space-y-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Emergency Notice:</strong> If you or someone you know is in immediate danger or having thoughts of self-harm, 
              please contact emergency services immediately or call one of the crisis hotlines below.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {crisisResources.map((resource, index) => (
              <Card key={index} className={`${resource.urgent ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className={`${resource.urgent ? 'text-red-800' : 'text-blue-800'}`}>
                      {resource.title}
                    </CardTitle>
                    {resource.urgent && <AlertTriangle className="w-5 h-5 text-red-600" />}
                  </div>
                  <Badge variant="outline" className={`w-fit ${resource.urgent ? 'border-red-300 text-red-700' : 'border-blue-300 text-blue-700'}`}>
                    {resource.type}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className={`text-sm mb-4 ${resource.urgent ? 'text-red-700' : 'text-blue-700'}`}>
                    {resource.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span className="font-semibold text-lg">{resource.contact}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{resource.availability}</span>
                    </div>
                  </div>
                  <Button 
                    className={`w-full mt-4 ${resource.urgent ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Resources */}
        <TabsContent value="resources" className="space-y-6">
          {mentalHealthResources.map((category, categoryIndex) => {
            const IconComponent = category.icon;
            return (
              <Card key={categoryIndex} className="border-purple-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="flex items-center gap-3 text-purple-800">
                    <IconComponent className="w-5 h-5" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-purple-800">{item.title}</h4>
                          <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-purple-600 mb-3">{item.description}</p>
                        <Button variant="outline" size="sm" className="w-full text-purple-700 border-purple-300">
                          <ExternalLink className="w-3 h-3 mr-2" />
                          Access Resource
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Signposting */}
        <TabsContent value="signposting" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-3 text-green-800">
                  <Shield className="w-5 h-5" />
                  Professional Services
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[
                    {
                      service: 'Clinical Psychology Services',
                      provider: 'Lagos University Teaching Hospital',
                      contact: '+234-803-XXX-XXXX',
                      speciality: 'Therapy & Counseling'
                    },
                    {
                      service: 'Psychiatric Services',
                      provider: 'Neuropsychiatric Hospital Lagos',
                      contact: '+234-805-XXX-XXXX',
                      speciality: 'Medication Management'
                    },
                    {
                      service: 'Community Mental Health',
                      provider: 'Mind Wellness Centre',
                      contact: '+234-807-XXX-XXXX',
                      speciality: 'Outpatient Support'
                    }
                  ].map((service, index) => (
                    <div key={index} className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">{service.service}</h4>
                      <div className="space-y-1 text-sm text-green-600">
                        <p><strong>Provider:</strong> {service.provider}</p>
                        <p><strong>Contact:</strong> {service.contact}</p>
                        <p><strong>Speciality:</strong> {service.speciality}</p>
                      </div>
                      <Button variant="outline" size="sm" className="mt-3 text-green-700 border-green-300">
                        <Phone className="w-3 h-3 mr-2" />
                        Contact Provider
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                <CardTitle className="flex items-center gap-3 text-orange-800">
                  <MessageCircle className="w-5 h-5" />
                  Peer Support Networks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[
                    {
                      network: 'Mental Health Advocates Nigeria',
                      description: 'Peer support and advocacy group',
                      meeting: 'Every Saturday 2PM',
                      location: 'Lagos, Online'
                    },
                    {
                      network: 'Depression Support Circle',
                      description: 'Support group for depression recovery',
                      meeting: 'Tuesdays & Thursdays 6PM',
                      location: 'Victoria Island'
                    },
                    {
                      network: 'Anxiety Warriors Nigeria',
                      description: 'Community for anxiety management',
                      meeting: 'Monthly meetups',
                      location: 'Multiple locations'
                    }
                  ].map((network, index) => (
                    <div key={index} className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">{network.network}</h4>
                      <div className="space-y-1 text-sm text-orange-600">
                        <p>{network.description}</p>
                        <p><strong>Meetings:</strong> {network.meeting}</p>
                        <p><strong>Location:</strong> {network.location}</p>
                      </div>
                      <Button variant="outline" size="sm" className="mt-3 text-orange-700 border-orange-300">
                        <Users className="w-3 h-3 mr-2" />
                        Join Network
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}