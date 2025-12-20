import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Heart, Activity, Brain, Flame, Shield, TrendingUp, TrendingDown,
  Info, AlertTriangle, CheckCircle2, Clock, Calendar, Target,
  Zap, Dumbbell, Moon, Apple, Wind, Thermometer, Scale, Ruler,
  HeartPulse, Droplets, Gauge, Sparkles, BarChart3, CircleDot,
  Plus, Users, Cigarette, Wine
} from "lucide-react";
import { Patient } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { format, differenceInYears } from "date-fns";
import { LifestyleAssessmentForm, MentalHealthScreeningForm, BodyCompositionForm } from "@/components/longevity";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

interface LongevityTabProps {
  patient: Patient;
}

interface VitalSign {
  id: number;
  patientId: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: string;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: string;
  height?: string;
  recordedAt: string;
  recordedBy: string;
}

// New comprehensive longevity data interfaces
interface LifestyleAssessment {
  id: number;
  exerciseFrequency?: string;
  exerciseType?: string;
  exerciseDurationMinutes?: number;
  dailySteps?: number;
  vo2MaxEstimate?: string;
  sleepDurationHours?: string;
  sleepQuality?: string;
  smokingStatus?: string;
  cigarettesPerDay?: number;
  packYears?: string;
  alcoholStatus?: string;
  drinksPerWeek?: number;
  dietType?: string;
  vegetableServingsPerDay?: number;
  fruitServingsPerDay?: number;
  processedFoodFrequency?: string;
  intermittentFasting?: boolean;
  assessmentDate: string;
}

interface BodyCompositionData {
  id: number;
  weight?: string;
  height?: string;
  bmi?: string;
  bodyFatPercentage?: string;
  visceralFatLevel?: number;
  muscleMassKg?: string;
  waistCircumferenceCm?: string;
  waistToHipRatio?: string;
  metabolicAge?: number;
  basalMetabolicRate?: number;
  gripStrengthKg?: string;
  measuredAt: string;
}

interface MentalHealthScreening {
  id: number;
  phq9Score?: number;
  phq9Severity?: string;
  gad7Score?: number;
  gad7Severity?: string;
  pssScore?: number;
  pssCategory?: string;
  wellbeingScore?: number;
  lifeSatisfactionScore?: number;
  purposeScore?: number;
  resilienceScore?: number;
  cognitiveScore?: number;
  cognitiveMaxScore?: number;
  screeningDate: string;
}

interface SocialDeterminant {
  id: number;
  maritalStatus?: string;
  livingArrangement?: string;
  closeRelationshipsCount?: number;
  socialInteractionFrequency?: string;
  lonelinessScore?: number;
  educationLevel?: string;
  employmentStatus?: string;
  financialStress?: string;
  senseOfPurpose?: number;
  assessmentDate: string;
}

interface AdvancedBiomarker {
  id: number;
  tshMiuL?: string;
  testosteroneNgDl?: string;
  dheaSUgDl?: string;
  cortisolUgDl?: string;
  igf1NgMl?: string;
  insulinMiuL?: string;
  homaIr?: string;
  apoBMgDl?: string;
  lpANmolL?: string;
  homocysteineMmolL?: string;
  hscrpMgL?: string;
  vitaminDNgMl?: string;
  vitaminB12PgMl?: string;
  omega3Index?: string;
  telomereLength?: string;
  phenoAge?: string;
  grimAge?: string;
  testDate: string;
}

interface HRVData {
  id: number;
  sdnnMs?: string;
  rmssdMs?: string;
  hrvScore?: number;
  readinessScore?: number;
  recoveryStatus?: string;
  lfHfRatio?: string;
  measuredAt: string;
}

interface LongevityData {
  lifestyle: LifestyleAssessment | null;
  bodyComposition: BodyCompositionData | null;
  mentalHealth: MentalHealthScreening | null;
  socialDeterminants: SocialDeterminant | null;
  advancedBiomarkers: AdvancedBiomarker | null;
  hrv: HRVData | null;
}

interface LabResult {
  id: number;
  testName: string;
  result: string;
  unit?: string;
  referenceRange?: string;
  status?: string;
  resultDate?: string;
}

// Evidence-based longevity biomarker reference ranges
const LONGEVITY_BIOMARKERS = {
  // Cardiovascular markers
  bloodPressureSystolic: { optimal: [90, 120], normal: [120, 130], elevated: [130, 140], high: [140, 180] },
  bloodPressureDiastolic: { optimal: [60, 80], normal: [80, 85], elevated: [85, 90], high: [90, 120] },
  restingHeartRate: { optimal: [50, 60], normal: [60, 70], elevated: [70, 80], high: [80, 100] },
  
  // Metabolic markers
  fastingGlucose: { optimal: [70, 85], normal: [85, 100], prediabetic: [100, 126], diabetic: [126, 300] },
  hba1c: { optimal: [4.0, 5.0], normal: [5.0, 5.7], prediabetic: [5.7, 6.5], diabetic: [6.5, 14] },
  
  // Lipid panel
  totalCholesterol: { optimal: [0, 180], normal: [180, 200], borderline: [200, 240], high: [240, 400] },
  ldlCholesterol: { optimal: [0, 70], normal: [70, 100], borderline: [100, 130], high: [130, 300] },
  hdlCholesterol: { optimal: [60, 100], normal: [40, 60], low: [0, 40] },
  triglycerides: { optimal: [0, 100], normal: [100, 150], borderline: [150, 200], high: [200, 500] },
  
  // Inflammation markers
  hscrp: { optimal: [0, 1], normal: [1, 3], elevated: [3, 10], high: [10, 100] },
  
  // Kidney function
  egfr: { optimal: [90, 120], normal: [60, 90], mildlyReduced: [45, 60], moderatelyReduced: [30, 45] },
  
  // Liver function
  alt: { optimal: [0, 25], normal: [25, 40], elevated: [40, 100] },
  ast: { optimal: [0, 25], normal: [25, 40], elevated: [40, 100] },
};

// Framingham Risk Score factors (simplified)
function calculateCardiovascularRisk(
  age: number,
  gender: string,
  systolicBP: number,
  totalCholesterol: number,
  hdlCholesterol: number,
  isSmoker: boolean = false,
  hasDiabetes: boolean = false,
  onBPMeds: boolean = false
): number {
  // Simplified 10-year cardiovascular risk calculation based on Framingham
  let risk = 0;
  
  // Age factor
  if (age >= 20 && age < 40) risk += 0;
  else if (age >= 40 && age < 50) risk += 5;
  else if (age >= 50 && age < 60) risk += 10;
  else if (age >= 60 && age < 70) risk += 15;
  else if (age >= 70) risk += 20;
  
  // Blood pressure
  if (systolicBP >= 160) risk += 4;
  else if (systolicBP >= 140) risk += 2;
  else if (systolicBP >= 130) risk += 1;
  
  // Cholesterol ratio
  const ratio = totalCholesterol / (hdlCholesterol || 50);
  if (ratio > 6) risk += 4;
  else if (ratio > 5) risk += 2;
  else if (ratio > 4) risk += 1;
  
  // Risk factors
  if (isSmoker) risk += 3;
  if (hasDiabetes) risk += 3;
  if (onBPMeds) risk += 1;
  if (gender?.toLowerCase() === 'male') risk += 2;
  
  return Math.min(Math.max(risk, 1), 30); // Cap between 1-30%
}

// Biological age estimation based on biomarkers
function estimateBiologicalAge(
  chronologicalAge: number,
  vitals: VitalSign | null,
  labResults: LabResult[]
): { biologicalAge: number; delta: number; factors: string[] } {
  let ageModifier = 0;
  const factors: string[] = [];
  
  if (vitals) {
    // Blood pressure impact
    if (vitals.bloodPressureSystolic && vitals.bloodPressureSystolic > 140) {
      ageModifier += 3;
      factors.push("Elevated blood pressure (+3 years)");
    } else if (vitals.bloodPressureSystolic && vitals.bloodPressureSystolic < 120) {
      ageModifier -= 1;
      factors.push("Optimal blood pressure (-1 year)");
    }
    
    // Resting heart rate
    if (vitals.heartRate && vitals.heartRate < 60) {
      ageModifier -= 2;
      factors.push("Athletic heart rate (-2 years)");
    } else if (vitals.heartRate && vitals.heartRate > 80) {
      ageModifier += 2;
      factors.push("Elevated resting heart rate (+2 years)");
    }
    
    // BMI estimation from weight/height
    if (vitals.weight && vitals.height) {
      const weight = parseFloat(vitals.weight);
      const height = parseFloat(vitals.height) / 100;
      const bmi = weight / (height * height);
      
      if (bmi >= 30) {
        ageModifier += 4;
        factors.push("Obesity (+4 years)");
      } else if (bmi >= 25) {
        ageModifier += 2;
        factors.push("Overweight (+2 years)");
      } else if (bmi >= 18.5 && bmi < 23) {
        ageModifier -= 1;
        factors.push("Optimal BMI (-1 year)");
      }
    }
  }
  
  // Lab result impacts
  labResults.forEach(lab => {
    const testName = lab.testName?.toLowerCase() || '';
    const value = parseFloat(lab.result);
    
    if (testName.includes('glucose') && !testName.includes('hba1c')) {
      if (value > 126) {
        ageModifier += 3;
        factors.push("Diabetic glucose levels (+3 years)");
      } else if (value > 100) {
        ageModifier += 1;
        factors.push("Pre-diabetic glucose (+1 year)");
      }
    }
    
    if (testName.includes('hba1c') || testName.includes('a1c')) {
      if (value > 6.5) {
        ageModifier += 4;
        factors.push("Elevated HbA1c (+4 years)");
      } else if (value > 5.7) {
        ageModifier += 2;
        factors.push("Pre-diabetic HbA1c (+2 years)");
      }
    }
    
    if (testName.includes('crp') || testName.includes('c-reactive')) {
      if (value > 3) {
        ageModifier += 2;
        factors.push("Elevated inflammation (+2 years)");
      } else if (value < 1) {
        ageModifier -= 1;
        factors.push("Low inflammation (-1 year)");
      }
    }
    
    if (testName.includes('hdl')) {
      if (value > 60) {
        ageModifier -= 2;
        factors.push("High HDL cholesterol (-2 years)");
      } else if (value < 40) {
        ageModifier += 2;
        factors.push("Low HDL cholesterol (+2 years)");
      }
    }
  });
  
  const biologicalAge = Math.max(18, chronologicalAge + ageModifier);
  return {
    biologicalAge,
    delta: ageModifier,
    factors: factors.length > 0 ? factors : ["Insufficient data for detailed analysis"],
  };
}

// Comprehensive Longevity score calculation (0-100) using evidence-based factors
function calculateLongevityScore(
  biologicalAgeDelta: number,
  cvRisk: number,
  hasOptimalVitals: boolean,
  hasOptimalLabs: boolean,
  longevityData?: LongevityData | null
): number {
  let score = 50; // Base score (start neutral)
  
  // ===== BIOLOGICAL MARKERS (30 points max) =====
  // Biological age impact (-10 to +10)
  score -= biologicalAgeDelta * 1.5;
  
  // CV risk impact (-10 to +10)
  if (cvRisk < 5) score += 10;
  else if (cvRisk < 10) score += 5;
  else if (cvRisk > 20) score -= 10;
  else if (cvRisk > 15) score -= 7;
  else if (cvRisk > 10) score -= 3;
  
  // Optimal markers bonus
  if (hasOptimalVitals) score += 5;
  if (hasOptimalLabs) score += 5;
  
  // ===== LIFESTYLE FACTORS (25 points max) =====
  if (longevityData?.lifestyle) {
    const lifestyle = longevityData.lifestyle;
    
    // Exercise (10 points)
    if (lifestyle.exerciseFrequency === '5+/week') score += 10;
    else if (lifestyle.exerciseFrequency === '3-4x/week') score += 7;
    else if (lifestyle.exerciseFrequency === '1-2x/week') score += 3;
    else if (lifestyle.exerciseFrequency === 'none') score -= 5;
    
    // Sleep (5 points)
    const sleepHours = parseFloat(lifestyle.sleepDurationHours || '0');
    if (sleepHours >= 7 && sleepHours <= 9) score += 5;
    else if (sleepHours >= 6 && sleepHours <= 10) score += 2;
    else score -= 3;
    
    // Smoking (-15 to +5)
    if (lifestyle.smokingStatus === 'never') score += 5;
    else if (lifestyle.smokingStatus === 'former') score += 2;
    else if (lifestyle.smokingStatus === 'current') {
      const packYears = parseFloat(lifestyle.packYears || '0');
      score -= Math.min(15, 5 + packYears / 2);
    }
    
    // Alcohol (5 points)
    if (lifestyle.alcoholStatus === 'none' || lifestyle.alcoholStatus === 'occasional') score += 3;
    else if (lifestyle.alcoholStatus === 'heavy') score -= 5;
    
    // Diet (5 points)
    const vegServings = lifestyle.vegetableServingsPerDay || 0;
    const fruitServings = lifestyle.fruitServingsPerDay || 0;
    if (vegServings >= 5 && fruitServings >= 2) score += 5;
    else if (vegServings >= 3) score += 2;
  }
  
  // ===== BODY COMPOSITION (10 points max) =====
  if (longevityData?.bodyComposition) {
    const body = longevityData.bodyComposition;
    
    // BMI (5 points)
    const bmi = parseFloat(body.bmi || '0');
    if (bmi >= 18.5 && bmi <= 24.9) score += 5;
    else if (bmi >= 25 && bmi <= 29.9) score += 1;
    else if (bmi < 18.5 || bmi >= 30) score -= 3;
    
    // Waist circumference / visceral fat (5 points)
    if (body.visceralFatLevel && body.visceralFatLevel <= 9) score += 5;
    else if (body.visceralFatLevel && body.visceralFatLevel <= 14) score += 2;
    else if (body.visceralFatLevel && body.visceralFatLevel > 14) score -= 3;
  }
  
  // ===== MENTAL HEALTH (10 points max) =====
  if (longevityData?.mentalHealth) {
    const mental = longevityData.mentalHealth;
    
    // Depression screening (5 points)
    if (mental.phq9Score !== undefined) {
      if (mental.phq9Score <= 4) score += 5;
      else if (mental.phq9Score <= 9) score += 2;
      else if (mental.phq9Score >= 15) score -= 5;
    }
    
    // Life satisfaction & purpose (5 points)
    const purposeScore = mental.purposeScore || 0;
    const lifeSat = mental.lifeSatisfactionScore || 0;
    if (purposeScore >= 8 && lifeSat >= 8) score += 5;
    else if (purposeScore >= 6 && lifeSat >= 6) score += 3;
  }
  
  // ===== SOCIAL CONNECTIONS (10 points max) =====
  if (longevityData?.socialDeterminants) {
    const social = longevityData.socialDeterminants;
    
    // Social connections (5 points)
    if (social.closeRelationshipsCount && social.closeRelationshipsCount >= 5) score += 5;
    else if (social.closeRelationshipsCount && social.closeRelationshipsCount >= 2) score += 3;
    
    // Purpose & engagement (5 points)
    if (social.senseOfPurpose && social.senseOfPurpose >= 8) score += 5;
    else if (social.senseOfPurpose && social.senseOfPurpose >= 5) score += 2;
  }
  
  // ===== ADVANCED BIOMARKERS (15 points max) =====
  if (longevityData?.advancedBiomarkers) {
    const bio = longevityData.advancedBiomarkers;
    
    // Vitamin D (3 points)
    const vitD = parseFloat(bio.vitaminDNgMl || '0');
    if (vitD >= 40 && vitD <= 60) score += 3;
    else if (vitD >= 30) score += 1;
    else if (vitD < 20) score -= 2;
    
    // Inflammation (hsCRP) (3 points)
    const crp = parseFloat(bio.hscrpMgL || '0');
    if (crp < 1) score += 3;
    else if (crp < 3) score += 1;
    else if (crp >= 3) score -= 2;
    
    // Metabolic health (HOMA-IR) (3 points)
    const homaIr = parseFloat(bio.homaIr || '0');
    if (homaIr > 0 && homaIr < 1.5) score += 3;
    else if (homaIr < 2.5) score += 1;
    else if (homaIr >= 2.5) score -= 2;
    
    // Epigenetic age markers (6 points)
    if (bio.phenoAge) {
      const phenoAgeDelta = parseFloat(bio.phenoAge);
      if (phenoAgeDelta < 0) score += 6;
      else if (phenoAgeDelta <= 2) score += 3;
      else if (phenoAgeDelta > 5) score -= 3;
    }
  }
  
  // ===== HRV (5 points max) =====
  if (longevityData?.hrv) {
    const hrv = longevityData.hrv;
    if (hrv.hrvScore && hrv.hrvScore >= 70) score += 5;
    else if (hrv.hrvScore && hrv.hrvScore >= 50) score += 3;
    else if (hrv.hrvScore && hrv.hrvScore < 30) score -= 2;
  }
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Get status color based on value and thresholds
function getStatusColor(value: number, thresholds: { optimal: number[]; normal: number[] }): string {
  if (value >= thresholds.optimal[0] && value <= thresholds.optimal[1]) return "text-emerald-600";
  if (value >= thresholds.normal[0] && value <= thresholds.normal[1]) return "text-blue-600";
  return "text-amber-600";
}

function getScoreGradient(score: number): string {
  if (score >= 80) return "from-emerald-500 to-teal-500";
  if (score >= 60) return "from-blue-500 to-cyan-500";
  if (score >= 40) return "from-amber-500 to-yellow-500";
  return "from-red-500 to-orange-500";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Attention";
}

export function LongevityTab({ patient }: LongevityTabProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Form modal states
  const [showLifestyleForm, setShowLifestyleForm] = useState(false);
  const [showMentalHealthForm, setShowMentalHealthForm] = useState(false);
  const [showBodyCompositionForm, setShowBodyCompositionForm] = useState(false);
  
  // Fetch vital signs
  const { data: vitals, isLoading: vitalsLoading } = useQuery<VitalSign[]>({
    queryKey: [`/api/patients/${patient.id}/vitals`],
    enabled: !!patient.id,
  });
  
  // Fetch lab results
  const { data: labResults, isLoading: labsLoading } = useQuery<LabResult[]>({
    queryKey: [`/api/patients/${patient.id}/lab-results`],
    enabled: !!patient.id,
  });
  
  // Fetch comprehensive longevity data (lifestyle, body composition, mental health, etc.)
  const { data: longevityData, isLoading: longevityLoading } = useQuery<LongevityData>({
    queryKey: [`/api/patients/${patient.id}/longevity-data`],
    enabled: !!patient.id,
  });
  
  const isLoading = vitalsLoading || labsLoading || longevityLoading;
  
  // Calculate patient age
  const patientAge = useMemo(() => {
    if (!patient.dateOfBirth) return 0;
    return differenceInYears(new Date(), new Date(patient.dateOfBirth));
  }, [patient.dateOfBirth]);
  
  // Get latest vitals
  const latestVitals = useMemo(() => {
    if (!vitals || vitals.length === 0) return null;
    return vitals.sort((a, b) => 
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    )[0];
  }, [vitals]);
  
  // Calculate all longevity metrics
  const longevityMetrics = useMemo(() => {
    const biologicalAgeData = estimateBiologicalAge(
      patientAge,
      latestVitals,
      labResults || []
    );
    
    const cvRisk = calculateCardiovascularRisk(
      patientAge,
      patient.gender || 'unknown',
      latestVitals?.bloodPressureSystolic || 120,
      180, // Default total cholesterol
      50,  // Default HDL
      false,
      false,
      false
    );
    
    const hasOptimalVitals = latestVitals ? (
      (latestVitals.bloodPressureSystolic || 120) < 120 &&
      (latestVitals.heartRate || 70) < 70
    ) : false;
    
    const hasOptimalLabs = (labResults || []).some(lab => {
      const testName = lab.testName?.toLowerCase() || '';
      const value = parseFloat(lab.result);
      return (testName.includes('glucose') && value < 100) ||
             (testName.includes('hba1c') && value < 5.7);
    });
    
    const longevityScore = calculateLongevityScore(
      biologicalAgeData.delta,
      cvRisk,
      hasOptimalVitals,
      hasOptimalLabs,
      longevityData
    );
    
    return {
      biologicalAge: biologicalAgeData,
      cvRisk,
      longevityScore,
      hasOptimalVitals,
      hasOptimalLabs,
      // Include comprehensive data availability
      hasLifestyleData: !!longevityData?.lifestyle,
      hasBodyCompositionData: !!longevityData?.bodyComposition,
      hasMentalHealthData: !!longevityData?.mentalHealth,
      hasSocialData: !!longevityData?.socialDeterminants,
      hasAdvancedBiomarkers: !!longevityData?.advancedBiomarkers,
      hasHRVData: !!longevityData?.hrv,
    };
  }, [patientAge, latestVitals, labResults, patient.gender, longevityData]);
  
  // Radar chart data for health domains
  const radarData = useMemo(() => {
    const domains = [
      { 
        domain: "Cardiovascular",
        score: Math.max(20, 100 - (longevityMetrics.cvRisk * 3)),
        fullMark: 100 
      },
      { 
        domain: "Metabolic",
        score: longevityMetrics.hasOptimalLabs ? 85 : 60,
        fullMark: 100 
      },
      { 
        domain: "Inflammation",
        score: 70, // Would be based on CRP if available
        fullMark: 100 
      },
      { 
        domain: "Body Composition",
        score: latestVitals?.weight && latestVitals?.height ? 75 : 50,
        fullMark: 100 
      },
      { 
        domain: "Vitals",
        score: longevityMetrics.hasOptimalVitals ? 90 : 65,
        fullMark: 100 
      },
      { 
        domain: "Recovery",
        score: latestVitals?.heartRate && latestVitals.heartRate < 65 ? 85 : 60,
        fullMark: 100 
      },
    ];
    return domains;
  }, [longevityMetrics, latestVitals]);
  
  // Trend data for biological age over time
  const trendData = useMemo(() => {
    if (!vitals || vitals.length < 2) return [];
    
    return vitals
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-6)
      .map(v => {
        const bioAge = estimateBiologicalAge(patientAge, v, labResults || []);
        return {
          date: format(new Date(v.recordedAt), "MMM d"),
          biologicalAge: bioAge.biologicalAge,
          chronologicalAge: patientAge,
        };
      });
  }, [vitals, patientAge, labResults]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-16 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4">
        {/* Header Section with Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Longevity Score Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className={`absolute inset-0 bg-gradient-to-br ${getScoreGradient(longevityMetrics.longevityScore)} opacity-10`} />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${getScoreGradient(longevityMetrics.longevityScore)}`}>
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Longevity Score</h3>
                    <p className="text-xs text-gray-500">Evidence-based assessment</p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Composite score based on biological age, cardiovascular risk, metabolic markers, and vital signs. Higher is better.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div className="flex items-end gap-2 mb-3">
                <span className={`text-5xl font-bold bg-gradient-to-r ${getScoreGradient(longevityMetrics.longevityScore)} bg-clip-text text-transparent`}>
                  {longevityMetrics.longevityScore}
                </span>
                <span className="text-lg text-gray-500 mb-1">/100</span>
              </div>
              
              <Progress 
                value={longevityMetrics.longevityScore} 
                className="h-2 mb-2"
              />
              
              <Badge 
                variant="secondary" 
                className={`${
                  longevityMetrics.longevityScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                  longevityMetrics.longevityScore >= 60 ? 'bg-blue-100 text-blue-700' :
                  longevityMetrics.longevityScore >= 40 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}
              >
                {getScoreLabel(longevityMetrics.longevityScore)}
              </Badge>
            </CardContent>
          </Card>
          
          {/* Biological Age Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-500 opacity-5" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Biological Age</h3>
                    <p className="text-xs text-gray-500">vs Chronological: {patientAge} years</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-end gap-3 mb-3">
                <span className="text-5xl font-bold text-violet-600">
                  {longevityMetrics.biologicalAge.biologicalAge}
                </span>
                <span className="text-lg text-gray-500 mb-1">years</span>
                {longevityMetrics.biologicalAge.delta !== 0 && (
                  <Badge 
                    variant="secondary"
                    className={`mb-1 ${
                      longevityMetrics.biologicalAge.delta < 0 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {longevityMetrics.biologicalAge.delta < 0 ? (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(longevityMetrics.biologicalAge.delta)} years
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-600">
                {longevityMetrics.biologicalAge.delta < 0 
                  ? "Aging slower than average" 
                  : longevityMetrics.biologicalAge.delta > 0 
                    ? "Aging faster than average"
                    : "Aging at expected rate"}
              </p>
            </CardContent>
          </Card>
          
          {/* Cardiovascular Risk Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-pink-500 opacity-5" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">10-Year CV Risk</h3>
                    <p className="text-xs text-gray-500">Framingham-based estimate</p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Estimated 10-year risk of cardiovascular event based on the Framingham Heart Study algorithm.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div className="flex items-end gap-2 mb-3">
                <span className={`text-5xl font-bold ${
                  longevityMetrics.cvRisk < 10 ? 'text-emerald-600' :
                  longevityMetrics.cvRisk < 20 ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {longevityMetrics.cvRisk}
                </span>
                <span className="text-lg text-gray-500 mb-1">%</span>
              </div>
              
              <Badge 
                variant="secondary"
                className={`${
                  longevityMetrics.cvRisk < 10 ? 'bg-emerald-100 text-emerald-700' :
                  longevityMetrics.cvRisk < 20 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}
              >
                {longevityMetrics.cvRisk < 10 ? 'Low Risk' :
                 longevityMetrics.cvRisk < 20 ? 'Moderate Risk' :
                 'High Risk'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Data Collection Section - Quick Actions */}
        <Card className="border-dashed border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Longevity Data Collection</CardTitle>
                <CardDescription>
                  Complete assessments for a more accurate longevity score
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {[
                  longevityData?.lifestyle,
                  longevityData?.bodyComposition,
                  longevityData?.mentalHealth,
                  longevityData?.socialDeterminants
                ].filter(Boolean).length}/4 Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Lifestyle Assessment */}
              <Button
                variant={longevityData?.lifestyle ? "secondary" : "outline"}
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setShowLifestyleForm(true)}
              >
                <div className={`p-2 rounded-full ${longevityData?.lifestyle ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">Lifestyle</div>
                  <div className="text-xs text-muted-foreground">
                    {longevityData?.lifestyle ? 'Update' : 'Add Assessment'}
                  </div>
                </div>
                {longevityData?.lifestyle && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 absolute top-2 right-2" />
                )}
              </Button>

              {/* Body Composition */}
              <Button
                variant={longevityData?.bodyComposition ? "secondary" : "outline"}
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setShowBodyCompositionForm(true)}
              >
                <div className={`p-2 rounded-full ${longevityData?.bodyComposition ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Scale className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">Body Composition</div>
                  <div className="text-xs text-muted-foreground">
                    {longevityData?.bodyComposition ? 'Update' : 'Add Measurements'}
                  </div>
                </div>
                {longevityData?.bodyComposition && (
                  <CheckCircle2 className="h-4 w-4 text-blue-500 absolute top-2 right-2" />
                )}
              </Button>

              {/* Mental Health */}
              <Button
                variant={longevityData?.mentalHealth ? "secondary" : "outline"}
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setShowMentalHealthForm(true)}
              >
                <div className={`p-2 rounded-full ${longevityData?.mentalHealth ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Brain className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">Mental Health</div>
                  <div className="text-xs text-muted-foreground">
                    {longevityData?.mentalHealth ? 'Update' : 'PHQ-9 / GAD-7'}
                  </div>
                </div>
                {longevityData?.mentalHealth && (
                  <CheckCircle2 className="h-4 w-4 text-purple-500 absolute top-2 right-2" />
                )}
              </Button>

              {/* Social Factors */}
              <Button
                variant={longevityData?.socialDeterminants ? "secondary" : "outline"}
                className="h-auto py-4 flex flex-col items-center gap-2 relative"
                onClick={() => {/* TODO: Add social determinants form */}}
              >
                <div className={`p-2 rounded-full ${longevityData?.socialDeterminants ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">Social Factors</div>
                  <div className="text-xs text-muted-foreground">
                    {longevityData?.socialDeterminants ? 'Update' : 'Add Assessment'}
                  </div>
                </div>
                {longevityData?.socialDeterminants && (
                  <CheckCircle2 className="h-4 w-4 text-pink-500 absolute top-2 right-2" />
                )}
              </Button>
            </div>

            {/* Show lifestyle summary if available */}
            {longevityData?.lifestyle && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <Dumbbell className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                    <div className="font-medium">{longevityData.lifestyle.exerciseFrequency || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Exercise</div>
                  </div>
                  <div className="text-center">
                    <Moon className="h-4 w-4 mx-auto mb-1 text-indigo-600" />
                    <div className="font-medium">{longevityData.lifestyle.sleepDurationHours || 'N/A'}h</div>
                    <div className="text-xs text-muted-foreground">Sleep</div>
                  </div>
                  <div className="text-center">
                    <Cigarette className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                    <div className="font-medium capitalize">{longevityData.lifestyle.smokingStatus || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Smoking</div>
                  </div>
                  <div className="text-center">
                    <Wine className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                    <div className="font-medium capitalize">{longevityData.lifestyle.alcoholStatus || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Alcohol</div>
                  </div>
                  <div className="text-center">
                    <Apple className="h-4 w-4 mx-auto mb-1 text-green-600" />
                    <div className="font-medium">{longevityData.lifestyle.vegetableServingsPerDay || 0}+ veg</div>
                    <div className="text-xs text-muted-foreground">Diet</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="biomarkers" className="gap-2">
              <Droplets className="h-4 w-4" />
              Biomarkers
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-2">
              <Target className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="protocols" className="gap-2">
              <Shield className="h-4 w-4" />
              Protocols
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Health Domains Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Health Domains Assessment
                  </CardTitle>
                  <CardDescription>
                    Multi-dimensional health profile based on available data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis 
                        dataKey="domain" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                      />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Biological Age Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-violet-600" />
                    Biological Age Factors
                  </CardTitle>
                  <CardDescription>
                    Key contributors to your biological age calculation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {longevityMetrics.biologicalAge.factors.map((factor, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg flex items-center gap-3 ${
                          factor.includes('-') 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20' 
                            : factor.includes('+')
                              ? 'bg-red-50 dark:bg-red-900/20'
                              : 'bg-gray-50 dark:bg-gray-800'
                        }`}
                      >
                        {factor.includes('-') ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        ) : factor.includes('+') ? (
                          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                        ) : (
                          <Info className="h-5 w-5 text-gray-500 shrink-0" />
                        )}
                        <span className={`text-sm font-medium ${
                          factor.includes('-') ? 'text-emerald-700 dark:text-emerald-300' :
                          factor.includes('+') ? 'text-red-700 dark:text-red-300' :
                          'text-gray-600 dark:text-gray-300'
                        }`}>
                          {factor}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Trend Chart */}
            {trendData.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Biological Age Trend
                  </CardTitle>
                  <CardDescription>
                    How your biological age has changed over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="bioAgeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis 
                        domain={['dataMin - 5', 'dataMax + 5']} 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <RechartsTooltip />
                      <Area
                        type="monotone"
                        dataKey="biologicalAge"
                        name="Biological Age"
                        stroke="#8b5cf6"
                        fill="url(#bioAgeGradient)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="chronologicalAge"
                        name="Chronological Age"
                        stroke="#9ca3af"
                        fill="none"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Biomarkers Tab */}
          <TabsContent value="biomarkers" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vital Signs Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-red-500" />
                    Vital Signs
                  </CardTitle>
                  <CardDescription>
                    {latestVitals 
                      ? `Last recorded: ${format(new Date(latestVitals.recordedAt), "MMM d, yyyy")}`
                      : "No vital signs recorded"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {latestVitals ? (
                    <div className="grid grid-cols-2 gap-3">
                      {latestVitals.bloodPressureSystolic && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Gauge className="h-4 w-4 text-red-600" />
                            <span className="text-xs text-gray-500">Blood Pressure</span>
                          </div>
                          <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                            {latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic}
                            <span className="text-xs ml-1 font-normal">mmHg</span>
                          </p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {latestVitals.bloodPressureSystolic < 120 ? 'Optimal' :
                             latestVitals.bloodPressureSystolic < 130 ? 'Normal' :
                             latestVitals.bloodPressureSystolic < 140 ? 'Elevated' : 'High'}
                          </Badge>
                        </div>
                      )}
                      
                      {latestVitals.heartRate && (
                        <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Heart className="h-4 w-4 text-pink-600" />
                            <span className="text-xs text-gray-500">Heart Rate</span>
                          </div>
                          <p className="text-lg font-semibold text-pink-700 dark:text-pink-300">
                            {latestVitals.heartRate}
                            <span className="text-xs ml-1 font-normal">bpm</span>
                          </p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {latestVitals.heartRate < 60 ? 'Athletic' :
                             latestVitals.heartRate < 70 ? 'Optimal' :
                             latestVitals.heartRate < 80 ? 'Normal' : 'Elevated'}
                          </Badge>
                        </div>
                      )}
                      
                      {latestVitals.weight && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Scale className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-gray-500">Weight</span>
                          </div>
                          <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                            {latestVitals.weight}
                            <span className="text-xs ml-1 font-normal">kg</span>
                          </p>
                        </div>
                      )}
                      
                      {latestVitals.height && (
                        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Ruler className="h-4 w-4 text-indigo-600" />
                            <span className="text-xs text-gray-500">Height</span>
                          </div>
                          <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
                            {latestVitals.height}
                            <span className="text-xs ml-1 font-normal">cm</span>
                          </p>
                        </div>
                      )}
                      
                      {latestVitals.weight && latestVitals.height && (
                        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 col-span-2">
                          <div className="flex items-center gap-2 mb-1">
                            <CircleDot className="h-4 w-4 text-purple-600" />
                            <span className="text-xs text-gray-500">BMI</span>
                          </div>
                          {(() => {
                            const weight = parseFloat(latestVitals.weight!);
                            const height = parseFloat(latestVitals.height!) / 100;
                            const bmi = weight / (height * height);
                            const bmiCategory = bmi < 18.5 ? 'Underweight' :
                                               bmi < 25 ? 'Normal' :
                                               bmi < 30 ? 'Overweight' : 'Obese';
                            return (
                              <>
                                <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                                  {bmi.toFixed(1)}
                                  <span className="text-xs ml-1 font-normal">kg/m²</span>
                                </p>
                                <Badge 
                                  variant="secondary" 
                                  className={`mt-1 text-xs ${
                                    bmiCategory === 'Normal' ? 'bg-emerald-100 text-emerald-700' :
                                    bmiCategory === 'Overweight' ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {bmiCategory}
                                </Badge>
                              </>
                            );
                          })()}
                        </div>
                      )}
                      
                      {latestVitals.oxygenSaturation && (
                        <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Wind className="h-4 w-4 text-cyan-600" />
                            <span className="text-xs text-gray-500">O2 Saturation</span>
                          </div>
                          <p className="text-lg font-semibold text-cyan-700 dark:text-cyan-300">
                            {latestVitals.oxygenSaturation}%
                          </p>
                        </div>
                      )}
                      
                      {latestVitals.temperature && (
                        <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Thermometer className="h-4 w-4 text-orange-600" />
                            <span className="text-xs text-gray-500">Temperature</span>
                          </div>
                          <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                            {latestVitals.temperature}°C
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Activity}
                      title="No Vital Signs"
                      description="Record vital signs to unlock longevity insights"
                    />
                  )}
                </CardContent>
              </Card>
              
              {/* Key Lab Biomarkers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    Key Longevity Biomarkers
                  </CardTitle>
                  <CardDescription>
                    Lab results relevant to healthspan and longevity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {labResults && labResults.length > 0 ? (
                    <div className="space-y-3">
                      {labResults.slice(0, 6).map((lab) => (
                        <div 
                          key={lab.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {lab.testName}
                            </p>
                            {lab.referenceRange && (
                              <p className="text-xs text-gray-500">
                                Ref: {lab.referenceRange}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              lab.status === 'abnormal' ? 'text-red-600' :
                              lab.status === 'critical' ? 'text-red-700' :
                              'text-emerald-600'
                            }`}>
                              {lab.result} {lab.unit}
                            </p>
                            {lab.resultDate && (
                              <p className="text-xs text-gray-500">
                                {format(new Date(lab.resultDate), "MMM d")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Droplets}
                      title="No Lab Results"
                      description="Lab results will appear here when available"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    Priority Actions
                  </CardTitle>
                  <CardDescription>
                    Evidence-based interventions to optimize healthspan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {longevityMetrics.biologicalAge.delta > 0 && (
                      <div className="p-4 rounded-lg border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                              Address Accelerated Aging
                            </h4>
                            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                              Your biological age is {longevityMetrics.biologicalAge.delta} years above chronological age. 
                              Focus on modifiable risk factors to reverse this trend.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {longevityMetrics.cvRisk >= 10 && (
                      <div className="p-4 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
                        <div className="flex items-start gap-3">
                          <Heart className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-red-800 dark:text-red-200">
                              Cardiovascular Risk Management
                            </h4>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                              Your 10-year CV risk is {longevityMetrics.cvRisk}%. Consider lifestyle modifications 
                              and discuss statin therapy with your provider.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-start gap-3">
                        <Dumbbell className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                            Exercise Protocol
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Aim for 150 min/week moderate activity + 2 strength training sessions. 
                            Zone 2 cardio is particularly beneficial for longevity.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20">
                      <div className="flex items-start gap-3">
                        <Moon className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-purple-800 dark:text-purple-200">
                            Sleep Optimization
                          </h4>
                          <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                            Target 7-9 hours of quality sleep. Poor sleep accelerates biological aging 
                            and increases disease risk.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Lifestyle Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Lifestyle Optimization
                  </CardTitle>
                  <CardDescription>
                    Key modifiable factors for healthspan extension
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Apple className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-800 dark:text-green-200">
                          Nutrition
                        </h4>
                      </div>
                      <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 ml-8">
                        <li>• Mediterranean or plant-forward diet</li>
                        <li>• Time-restricted eating (12-16 hour fast)</li>
                        <li>• Minimize ultra-processed foods</li>
                        <li>• Adequate protein (1.6g/kg body weight)</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Brain className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                          Cognitive Health
                        </h4>
                      </div>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-8">
                        <li>• Regular mental stimulation</li>
                        <li>• Social engagement</li>
                        <li>• Stress management practices</li>
                        <li>• Continuous learning</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Flame className="h-5 w-5 text-amber-600" />
                        <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                          Metabolic Health
                        </h4>
                      </div>
                      <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 ml-8">
                        <li>• Maintain insulin sensitivity</li>
                        <li>• Optimize body composition</li>
                        <li>• Regular metabolic testing</li>
                        <li>• Monitor inflammatory markers</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Protocols Tab */}
          <TabsContent value="protocols" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Screening Protocols */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Screening Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">Complete Blood Count</span>
                      <Badge variant="outline">Annual</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">Lipid Panel</span>
                      <Badge variant="outline">Annual</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">HbA1c / Glucose</span>
                      <Badge variant="outline">Annual</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">hs-CRP</span>
                      <Badge variant="outline">Annual</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">Vitamin D</span>
                      <Badge variant="outline">Annual</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">Thyroid Panel</span>
                      <Badge variant="outline">Every 5 years</Badge>
                    </div>
                    {patientAge >= 45 && (
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm">Colonoscopy</span>
                        <Badge variant="outline">Every 10 years</Badge>
                      </div>
                    )}
                    {patientAge >= 50 && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm">DEXA Scan</span>
                        <Badge variant="outline">Every 2 years</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Evidence-Based Supplements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-green-500" />
                    Evidence-Based Supplements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <p className="font-medium text-green-800 dark:text-green-200">Vitamin D3</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Target: 40-60 ng/mL</p>
                      <p className="text-xs text-gray-500 mt-1">Strong evidence for immune & bone health</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <p className="font-medium text-blue-800 dark:text-blue-200">Omega-3 (EPA/DHA)</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">1-2g combined EPA+DHA</p>
                      <p className="text-xs text-gray-500 mt-1">Cardiovascular & cognitive benefits</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <p className="font-medium text-purple-800 dark:text-purple-200">Magnesium</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">200-400mg glycinate</p>
                      <p className="text-xs text-gray-500 mt-1">Sleep, muscle, metabolic function</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                      <p className="font-medium text-amber-800 dark:text-amber-200">Creatine</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">3-5g daily</p>
                      <p className="text-xs text-gray-500 mt-1">Muscle preservation, cognitive support</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 italic">
                    * Consult healthcare provider before starting any supplement regimen
                  </p>
                </CardContent>
              </Card>
              
              {/* Advanced Testing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-violet-500" />
                    Advanced Longevity Tests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20">
                      <p className="font-medium text-violet-800 dark:text-violet-200">Epigenetic Age Testing</p>
                      <p className="text-xs text-gray-500 mt-1">
                        DNA methylation-based biological age (e.g., TruAge, GrimAge)
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                      <p className="font-medium text-pink-800 dark:text-pink-200">Telomere Length</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Marker of cellular aging and replicative capacity
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
                      <p className="font-medium text-cyan-800 dark:text-cyan-200">Continuous Glucose Monitor</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Real-time metabolic health insights
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20">
                      <p className="font-medium text-teal-800 dark:text-teal-200">CIMT / CAC Score</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Arterial health & cardiovascular risk imaging
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                      <p className="font-medium text-indigo-800 dark:text-indigo-200">VO2 Max Testing</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Gold standard cardiorespiratory fitness measure
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Form Modals */}
      <LifestyleAssessmentForm
        patientId={patient.id}
        open={showLifestyleForm}
        onOpenChange={setShowLifestyleForm}
        existingData={longevityData?.lifestyle || null}
      />

      <MentalHealthScreeningForm
        patientId={patient.id}
        open={showMentalHealthForm}
        onOpenChange={setShowMentalHealthForm}
      />

      <BodyCompositionForm
        patientId={patient.id}
        open={showBodyCompositionForm}
        onOpenChange={setShowBodyCompositionForm}
        existingData={longevityData?.bodyComposition || null}
      />
    </TooltipProvider>
  );
}

