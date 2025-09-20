import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Grid3X3,
  Heart,
  List,
  Pill,
  Search,
  Stethoscope,
  Thermometer,
  Users
} from 'lucide-react';

interface ClinicalProtocol {
  id: string;
  title: string;
  category: string;
  symptoms: string[];
  diagnosis: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  steps: ProtocolStep[];
  medications?: string[];
  contraindications?: string[];
  followUp?: string;
}

interface ProtocolStep {
  order: number;
  description: string;
  type: 'assessment' | 'treatment' | 'medication' | 'monitoring';
  details?: string;
}

export default function ClinicalProtocols() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProtocol, setSelectedProtocol] = useState<ClinicalProtocol | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const protocols: ClinicalProtocol[] = [
    {
      id: 'fever-adult',
      title: 'Adult Fever Management',
      category: 'General Medicine',
      symptoms: ['fever', 'temperature >38°C', 'chills', 'body aches'],
      diagnosis: 'Pyrexia - Adult',
      urgency: 'medium',
      steps: [
        {
          order: 1,
          description: 'Take comprehensive history and vital signs',
          type: 'assessment',
          details: 'Include onset, duration, associated symptoms, recent travel, medications'
        },
        {
          order: 2,
          description: 'Physical examination focusing on potential sources',
          type: 'assessment',
          details: 'ENT, respiratory, abdominal, skin, lymph nodes examination'
        },
        {
          order: 3,
          description: 'Administer paracetamol 1g every 6 hours',
          type: 'medication',
          details: 'Maximum 4g in 24 hours. Consider ibuprofen if no contraindications'
        },
        {
          order: 4,
          description: 'Encourage fluid intake and rest',
          type: 'treatment',
          details: 'Monitor for dehydration signs. Cool sponging if temperature >39°C'
        }
      ],
      medications: ['Paracetamol 500mg', 'Ibuprofen 400mg'],
      contraindications: ['Paracetamol allergy', 'Liver disease for paracetamol'],
      followUp: 'Return if fever persists >3 days or if concerning symptoms develop'
    },
    {
      id: 'depression-screening',
      title: 'Depression Screening & Management',
      category: 'Mental Health',
      symptoms: ['persistent sadness', 'loss of interest', 'fatigue', 'sleep disturbance', 'appetite changes'],
      diagnosis: 'Major Depressive Disorder',
      urgency: 'medium',
      steps: [
        {
          order: 1,
          description: 'Conduct PHQ-9 depression screening',
          type: 'assessment',
          details: 'Ask about mood, anhedonia, suicidal ideation, functional impairment'
        },
        {
          order: 2,
          description: 'Risk assessment for self-harm or suicide',
          type: 'assessment',
          details: 'Direct questioning about thoughts, plans, means, intent'
        },
        {
          order: 3,
          description: 'Psychoeducation and lifestyle counseling',
          type: 'treatment',
          details: 'Discuss sleep hygiene, exercise, social support, stress management'
        },
        {
          order: 4,
          description: 'Consider medication if moderate to severe',
          type: 'medication',
          details: 'Start SSRI at low dose. Discuss side effects and expectations'
        },
        {
          order: 5,
          description: 'Arrange follow-up and referral if needed',
          type: 'monitoring',
          details: 'Weekly initially, then monthly. Refer for therapy if available'
        }
      ],
      medications: ['Sertraline 50mg', 'Fluoxetine 20mg', 'Escitalopram 10mg'],
      contraindications: ['Bipolar disorder without mood stabilizer', 'Recent MAO inhibitor use'],
      followUp: 'Follow up in 1 week, then 2-4 weeks. Monitor for side effects and suicidal ideation'
    },
    {
      id: 'anxiety-disorder',
      title: 'Generalized Anxiety Disorder',
      category: 'Mental Health',
      symptoms: ['excessive worry', 'restlessness', 'fatigue', 'difficulty concentrating', 'muscle tension'],
      diagnosis: 'Generalized Anxiety Disorder',
      urgency: 'medium',
      steps: [
        {
          order: 1,
          description: 'Use GAD-7 scale for assessment',
          type: 'assessment',
          details: 'Assess severity, duration, impact on functioning, triggers'
        },
        {
          order: 2,
          description: 'Rule out medical causes',
          type: 'assessment',
          details: 'Thyroid function, caffeine intake, substance use, medications'
        },
        {
          order: 3,
          description: 'Teach breathing and relaxation techniques',
          type: 'treatment',
          details: 'Deep breathing, progressive muscle relaxation, mindfulness'
        },
        {
          order: 4,
          description: 'Consider anxiolytic therapy',
          type: 'medication',
          details: 'SSRI first line. Short-term benzodiazepine if severe'
        }
      ],
      medications: ['Sertraline 50mg', 'Lorazepam 0.5mg PRN', 'Propranolol 40mg'],
      contraindications: ['Narrow-angle glaucoma for benzodiazepines', 'Respiratory depression'],
      followUp: 'Review in 2 weeks. Monitor for improvement and side effects'
    },
    {
      id: 'menstrual-irregularities',
      title: 'Menstrual Irregularities',
      category: 'Gynecology',
      symptoms: ['irregular periods', 'heavy bleeding', 'missed periods', 'painful periods'],
      diagnosis: 'Menstrual Dysfunction',
      urgency: 'medium',
      steps: [
        {
          order: 1,
          description: 'Detailed menstrual and reproductive history',
          type: 'assessment',
          details: 'Cycle length, flow, pain, last menstrual period, sexual history'
        },
        {
          order: 2,
          description: 'Physical examination including pelvic exam',
          type: 'assessment',
          details: 'Abdominal exam, speculum exam, bimanual examination'
        },
        {
          order: 3,
          description: 'Laboratory investigations',
          type: 'assessment',
          details: 'Pregnancy test, FBC, thyroid function, hormonal profile'
        },
        {
          order: 4,
          description: 'Treatment based on underlying cause',
          type: 'treatment',
          details: 'Hormonal therapy, NSAIDs for pain, lifestyle modifications'
        }
      ],
      medications: ['Combined oral contraceptive', 'Tranexamic acid', 'Mefenamic acid'],
      contraindications: ['Pregnancy', 'History of thromboembolism for hormonal therapy'],
      followUp: 'Review in 3 months or sooner if symptoms worsen'
    },
    {
      id: 'diabetes-management',
      title: 'Type 2 Diabetes Management',
      category: 'Endocrinology',
      symptoms: ['polyuria', 'polydipsia', 'weight loss', 'fatigue', 'blurred vision'],
      diagnosis: 'Type 2 Diabetes Mellitus',
      urgency: 'medium',
      steps: [
        {
          order: 1,
          description: 'Confirm diagnosis and assess complications',
          type: 'assessment',
          details: 'HbA1c, fasting glucose, diabetic complications screening'
        },
        {
          order: 2,
          description: 'Lifestyle modification counseling',
          type: 'treatment',
          details: 'Diet, exercise, weight management, smoking cessation'
        },
        {
          order: 3,
          description: 'Initiate metformin therapy',
          type: 'medication',
          details: 'Start with 500mg BD, increase gradually to minimize side effects'
        },
        {
          order: 4,
          description: 'Monitoring and follow-up plan',
          type: 'monitoring',
          details: 'Regular HbA1c, foot care, eye screening, cardiovascular risk'
        }
      ],
      medications: ['Metformin 500mg', 'Gliclazide 80mg', 'Insulin if required'],
      contraindications: ['Renal impairment for metformin', 'Heart failure for some medications'],
      followUp: 'Review in 2 weeks, then 3 monthly. Annual complications screening'
    },
    {
      id: 'hypertension-crisis',
      title: 'Hypertensive Crisis Management',
      category: 'Cardiology',
      symptoms: ['BP >180/120', 'headache', 'chest pain', 'shortness of breath'],
      diagnosis: 'Hypertensive Crisis',
      urgency: 'emergency',
      steps: [
        {
          order: 1,
          description: 'Immediate BP monitoring and assessment',
          type: 'assessment',
          details: 'Confirm reading with appropriate cuff size. Check both arms'
        },
        {
          order: 2,
          description: 'Assess for end-organ damage',
          type: 'assessment',
          details: 'Neurological exam, fundoscopy, ECG, chest examination'
        },
        {
          order: 3,
          description: 'IV access and consider sublingual nifedipine',
          type: 'treatment',
          details: 'If no contraindications. Avoid rapid BP reduction >25% in first hour'
        },
        {
          order: 4,
          description: 'Continuous monitoring and transfer preparation',
          type: 'monitoring',
          details: 'Blood pressure every 15 minutes. Prepare for hospital transfer'
        }
      ],
      medications: ['Nifedipine 10mg sublingual', 'Amlodipine 5mg'],
      contraindications: ['Aortic stenosis', 'Recent stroke'],
      followUp: 'Immediate hospital transfer for hypertensive emergency'
    },
    {
      id: 'malaria-treatment',
      title: 'Uncomplicated Malaria Treatment',
      category: 'Infectious Disease',
      symptoms: ['fever', 'chills', 'headache', 'nausea', 'vomiting'],
      diagnosis: 'Uncomplicated Malaria',
      urgency: 'high',
      steps: [
        {
          order: 1,
          description: 'Confirm malaria diagnosis with rapid test or microscopy',
          type: 'assessment',
          details: 'RDT or blood film examination. Document parasite species if possible'
        },
        {
          order: 2,
          description: 'Assess for signs of severe malaria',
          type: 'assessment',
          details: 'Check consciousness, breathing, severe anemia, jaundice'
        },
        {
          order: 3,
          description: 'Start artemether-lumefantrine therapy',
          type: 'medication',
          details: 'Weight-based dosing. Take with fatty food or milk'
        },
        {
          order: 4,
          description: 'Symptomatic treatment and monitoring',
          type: 'treatment',
          details: 'Paracetamol for fever, ORS for dehydration, monitor response'
        }
      ],
      medications: ['Artemether-Lumefantrine', 'Paracetamol', 'ORS'],
      contraindications: ['Known allergy to artemisinin derivatives'],
      followUp: 'Return if no improvement in 48 hours or symptoms worsen'
    },
    {
      id: 'asthma-acute',
      title: 'Acute Asthma Management',
      category: 'Respiratory',
      symptoms: ['wheezing', 'shortness of breath', 'chest tightness', 'cough'],
      diagnosis: 'Acute Asthma Exacerbation',
      urgency: 'high',
      steps: [
        {
          order: 1,
          description: 'Assess severity using peak flow if available',
          type: 'assessment',
          details: 'Ability to speak, respiratory rate, use of accessory muscles'
        },
        {
          order: 2,
          description: 'Administer high-dose bronchodilator',
          type: 'medication',
          details: 'Salbutamol via nebulizer or MDI with spacer'
        },
        {
          order: 3,
          description: 'Consider oral prednisolone',
          type: 'medication',
          details: 'If poor response to bronchodilator or severe exacerbation'
        },
        {
          order: 4,
          description: 'Monitor response and oxygen saturation',
          type: 'monitoring',
          details: 'Reassess after 15-20 minutes. Consider hospital transfer if severe'
        }
      ],
      medications: ['Salbutamol nebules', 'Prednisolone 40mg', 'Oxygen'],
      contraindications: ['Beta-blocker use (relative)', 'Severe cardiac arrhythmias'],
      followUp: 'Review asthma action plan. Follow up within 24-48 hours'
    }
  ];

  const categories = ['all', ...Array.from(new Set(protocols.map(p => p.category)))];

  const filteredProtocols = protocols.filter(protocol => {
    const matchesSearch = protocol.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         protocol.symptoms.some(symptom => 
                           symptom.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesCategory = selectedCategory === 'all' || protocol.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'assessment': return <Stethoscope className="h-4 w-4" />;
      case 'treatment': return <Heart className="h-4 w-4" />;
      case 'medication': return <Pill className="h-4 w-4" />;
      case 'monitoring': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const ProtocolDialog = ({ protocol }: { protocol: ClinicalProtocol }) => (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {protocol.title}
        </DialogTitle>
        <DialogDescription>
          {protocol.category} • {protocol.diagnosis}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Treatment Protocol</h3>
          <div className="space-y-4">
            {protocol.steps.map((step) => (
              <div key={step.order} className="flex gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {getStepIcon(step.type)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Step {step.order}</span>
                    <Badge variant="outline" className="text-xs">
                      {step.type}
                    </Badge>
                  </div>
                  <p className="text-gray-900 mb-2">{step.description}</p>
                  {step.details && (
                    <p className="text-sm text-gray-600">{step.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {protocol.medications && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Recommended Medications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {protocol.medications.map((medication, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Pill className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{medication}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {protocol.contraindications && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Contraindications & Warnings
            </h3>
            <div className="space-y-2">
              {protocol.contraindications.map((contraindication, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">{contraindication}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {protocol.followUp && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Follow-up Instructions
            </h3>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-900">{protocol.followUp}</p>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clinical Protocols</h1>
          <p className="text-gray-600">Evidence-based treatment guidelines and protocols</p>
        </div>
      </div>

      {/* Search, Filter, and View Options */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by condition, symptoms, or protocol name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protocols Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProtocols.map((protocol) => (
            <Card key={protocol.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{protocol.title}</CardTitle>
                  <Badge className={getUrgencyColor(protocol.urgency)}>
                    {protocol.urgency}
                  </Badge>
                </div>
                <Badge variant="outline">{protocol.category}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Common Symptoms:</h4>
                    <div className="flex flex-wrap gap-1">
                      {protocol.symptoms.slice(0, 3).map((symptom, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {symptom}
                        </Badge>
                      ))}
                      {protocol.symptoms.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{protocol.symptoms.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {protocol.steps.length} steps
                    </span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedProtocol(protocol)}
                        >
                          View Protocol
                        </Button>
                      </DialogTrigger>
                      <ProtocolDialog protocol={protocol} />
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProtocols.map((protocol) => (
            <Card key={protocol.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{protocol.title}</h3>
                      <Badge className={getUrgencyColor(protocol.urgency)}>
                        {protocol.urgency}
                      </Badge>
                      <Badge variant="outline">{protocol.category}</Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{protocol.diagnosis}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Common Symptoms:</h4>
                        <div className="flex flex-wrap gap-1">
                          {protocol.symptoms.slice(0, 5).map((symptom, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {symptom}
                            </Badge>
                          ))}
                          {protocol.symptoms.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{protocol.symptoms.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Treatment Steps:</h4>
                        <div className="space-y-1">
                          {protocol.steps.slice(0, 3).map((step) => (
                            <div key={step.order} className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                {getStepIcon(step.type)}
                              </div>
                              <span className="truncate">{step.description}</span>
                            </div>
                          ))}
                          {protocol.steps.length > 3 && (
                            <div className="text-xs text-gray-500 ml-7">
                              +{protocol.steps.length - 3} more steps
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{protocol.steps.length} treatment steps</span>
                        {protocol.medications && (
                          <span>{protocol.medications.length} medications</span>
                        )}
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline"
                            onClick={() => setSelectedProtocol(protocol)}
                          >
                            View Full Protocol
                          </Button>
                        </DialogTrigger>
                        <ProtocolDialog protocol={protocol} />
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredProtocols.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No protocols found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or category filter
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}