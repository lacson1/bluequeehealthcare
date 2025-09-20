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
      id: 'postpartum-depression',
      title: 'Postpartum Depression',
      category: 'Mental Health',
      symptoms: ['mood changes', 'difficulty bonding', 'excessive crying', 'feelings of guilt', 'thoughts of harm'],
      diagnosis: 'Postpartum Depression',
      urgency: 'high',
      steps: [
        {
          order: 1,
          description: 'Edinburgh Postnatal Depression Scale',
          type: 'assessment',
          details: 'Screen for mood, anxiety, thoughts of self-harm or baby harm'
        },
        {
          order: 2,
          description: 'Assess infant safety and bonding',
          type: 'assessment',
          details: 'Ask about thoughts of harming baby, ability to care for infant'
        },
        {
          order: 3,
          description: 'Provide immediate support and education',
          type: 'treatment',
          details: 'Normalize feelings, discuss support systems, breastfeeding considerations'
        },
        {
          order: 4,
          description: 'Consider safe medication options',
          type: 'medication',
          details: 'Sertraline compatible with breastfeeding. Avoid paroxetine'
        }
      ],
      medications: ['Sertraline 50mg', 'Citalopram 20mg'],
      contraindications: ['Breastfeeding contraindications vary by medication'],
      followUp: 'Urgent follow-up within 1 week. Consider psychiatric referral'
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
      id: 'pelvic-inflammatory-disease',
      title: 'Pelvic Inflammatory Disease',
      category: 'Gynecology',
      symptoms: ['pelvic pain', 'abnormal discharge', 'fever', 'painful urination', 'irregular bleeding'],
      diagnosis: 'Pelvic Inflammatory Disease',
      urgency: 'high',
      steps: [
        {
          order: 1,
          description: 'Clinical assessment and examination',
          type: 'assessment',
          details: 'Cervical motion tenderness, adnexal tenderness, fever assessment'
        },
        {
          order: 2,
          description: 'Laboratory and microbiological tests',
          type: 'assessment',
          details: 'High vaginal swab, cervical swab, pregnancy test, inflammatory markers'
        },
        {
          order: 3,
          description: 'Start empirical antibiotic therapy',
          type: 'medication',
          details: 'Broad spectrum antibiotics covering chlamydia and gonorrhea'
        },
        {
          order: 4,
          description: 'Contact tracing and partner treatment',
          type: 'treatment',
          details: 'Test and treat sexual partners, safe sex counseling'
        }
      ],
      medications: ['Doxycycline 100mg BD', 'Metronidazole 400mg BD', 'Ceftriaxone 500mg IM'],
      contraindications: ['Pregnancy for certain antibiotics', 'Allergy to prescribed antibiotics'],
      followUp: 'Review in 3 days, then 1-2 weeks. Test of cure after treatment'
    },
    {
      id: 'contraceptive-counseling',
      title: 'Contraceptive Counseling',
      category: 'Gynecology',
      symptoms: ['requesting contraception', 'contraceptive failure', 'side effects'],
      diagnosis: 'Contraceptive Consultation',
      urgency: 'low',
      steps: [
        {
          order: 1,
          description: 'Comprehensive reproductive health history',
          type: 'assessment',
          details: 'Previous contraceptive use, medical history, lifestyle factors'
        },
        {
          order: 2,
          description: 'Discuss contraceptive options',
          type: 'treatment',
          details: 'Effectiveness, side effects, benefits, reversibility of each method'
        },
        {
          order: 3,
          description: 'Physical examination if indicated',
          type: 'assessment',
          details: 'Blood pressure, BMI, breast examination if starting hormonal methods'
        },
        {
          order: 4,
          description: 'Provide chosen method and follow-up plan',
          type: 'treatment',
          details: 'Prescription, insertion, or fitting as appropriate'
        }
      ],
      medications: ['Combined oral contraceptive', 'Progestogen-only pill', 'Depo-Provera injection'],
      contraindications: ['Pregnancy', 'Undiagnosed vaginal bleeding', 'Active liver disease'],
      followUp: 'Review in 3 months, then annually. Earlier if side effects'
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
      id: 'tuberculosis-screening',
      title: 'Tuberculosis Screening & Management',
      category: 'Infectious Disease',
      symptoms: ['persistent cough', 'weight loss', 'night sweats', 'fever', 'chest pain'],
      diagnosis: 'Pulmonary Tuberculosis',
      urgency: 'high',
      steps: [
        {
          order: 1,
          description: 'Clinical assessment and history',
          type: 'assessment',
          details: 'Duration of symptoms, HIV status, previous TB, contact history'
        },
        {
          order: 2,
          description: 'Diagnostic investigations',
          type: 'assessment',
          details: 'Chest X-ray, sputum microscopy, GeneXpert if available'
        },
        {
          order: 3,
          description: 'Initiate anti-TB therapy if confirmed',
          type: 'medication',
          details: 'RHZE regimen for 2 months, then RH for 4 months'
        },
        {
          order: 4,
          description: 'Contact tracing and infection control',
          type: 'treatment',
          details: 'Screen household contacts, isolate until non-infectious'
        }
      ],
      medications: ['Rifampicin', 'Isoniazid', 'Ethambutol', 'Pyrazinamide'],
      contraindications: ['Liver disease (relative)', 'Drug allergies'],
      followUp: 'Weekly for first month, then monthly. Monitor for side effects'
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
    },
    {
      id: 'copd-exacerbation',
      title: 'COPD Exacerbation Management',
      category: 'Respiratory',
      symptoms: ['increased dyspnea', 'increased sputum', 'sputum color change', 'wheeze'],
      diagnosis: 'COPD Exacerbation',
      urgency: 'high',
      steps: [
        {
          order: 1,
          description: 'Assess severity and triggers',
          type: 'assessment',
          details: 'Respiratory rate, oxygen saturation, cyanosis, confusion'
        },
        {
          order: 2,
          description: 'Bronchodilator therapy',
          type: 'medication',
          details: 'Salbutamol and ipratropium nebulizers or MDI'
        },
        {
          order: 3,
          description: 'Systemic corticosteroids',
          type: 'medication',
          details: 'Prednisolone 30-40mg daily for 5 days'
        },
        {
          order: 4,
          description: 'Consider antibiotics if indicated',
          type: 'medication',
          details: 'If purulent sputum or clinical signs of infection'
        }
      ],
      medications: ['Salbutamol', 'Ipratropium', 'Prednisolone', 'Amoxicillin'],
      contraindications: ['Pneumothorax', 'Severe acidosis'],
      followUp: 'Review in 2-3 days. Consider pulmonary rehabilitation'
    },
    {
      id: 'pediatric-fever',
      title: 'Pediatric Fever Management',
      category: 'Pediatrics',
      symptoms: ['fever >38°C', 'irritability', 'poor feeding', 'lethargy'],
      diagnosis: 'Pediatric Fever',
      urgency: 'medium',
      steps: [
        {
          order: 1,
          description: 'Assess child and identify red flags',
          type: 'assessment',
          details: 'Appearance, hydration, circulation, respiratory effort'
        },
        {
          order: 2,
          description: 'Look for focus of infection',
          type: 'assessment',
          details: 'Ears, throat, chest, abdomen, rash, meningeal signs'
        },
        {
          order: 3,
          description: 'Appropriate antipyretic therapy',
          type: 'medication',
          details: 'Paracetamol 15mg/kg or ibuprofen 10mg/kg every 6-8 hours'
        },
        {
          order: 4,
          description: 'Parent education and safety netting',
          type: 'treatment',
          details: 'When to return, fluid encouragement, comfort measures'
        }
      ],
      medications: ['Paracetamol syrup', 'Ibuprofen syrup'],
      contraindications: ['Ibuprofen in dehydration', 'Aspirin in children'],
      followUp: 'Return if fever persists >48 hours or child deteriorates'
    },
    {
      id: 'pediatric-diarrhea',
      title: 'Pediatric Acute Diarrhea',
      category: 'Pediatrics',
      symptoms: ['loose stools', 'vomiting', 'dehydration', 'abdominal pain'],
      diagnosis: 'Acute Gastroenteritis',
      urgency: 'medium',
      steps: [
        {
          order: 1,
          description: 'Assess degree of dehydration',
          type: 'assessment',
          details: 'Skin turgor, mucous membranes, urine output, weight loss'
        },
        {
          order: 2,
          description: 'Oral rehydration therapy',
          type: 'treatment',
          details: 'ORS solution 50-100ml/kg over 4 hours if mild-moderate dehydration'
        },
        {
          order: 3,
          description: 'Continue feeding age-appropriate foods',
          type: 'treatment',
          details: 'Breastfeeding should continue. BRAT diet not recommended'
        },
        {
          order: 4,
          description: 'Monitor and reassess',
          type: 'monitoring',
          details: 'Watch for signs of worsening dehydration or complications'
        }
      ],
      medications: ['ORS packets', 'Zinc supplement 10-20mg daily'],
      contraindications: ['Severe dehydration requiring IV therapy'],
      followUp: 'Return if unable to keep fluids down or signs of dehydration worsen'
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
                        {/* Protocol Steps */}
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

                        {/* Medications */}
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

                        {/* Contraindications */}
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

                        {/* Follow-up */}
                        {protocol.followUp && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Follow-up Instructions</h3>
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <p className="text-sm">{protocol.followUp}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      ) : (
        <>
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
                            {/* Protocol Steps */}
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

                            {/* Medications */}
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

                            {/* Contraindications */}
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

                            {/* Follow-up */}
                            {protocol.followUp && (
                              <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-blue-500" />
                                  Follow-up Instructions
                                </h3>
                                <div className="p-4 bg-blue-50 rounded-lg">
                                  <p className="text-sm text-blue-900">{protocol.followUp}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </>
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