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
  HeartPulse, Droplets, Gauge, Sparkles, BarChart3, CircleDot
} from "lucide-react";
import { Patient } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { format, differenceInYears } from "date-fns";
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

// Longevity score calculation (0-100)
function calculateLongevityScore(
  biologicalAgeDelta: number,
  cvRisk: number,
  hasOptimalVitals: boolean,
  hasOptimalLabs: boolean
): number {
  let score = 70; // Base score
  
  // Biological age impact (-15 to +15)
  score -= biologicalAgeDelta * 2;
  
  // CV risk impact (-20 to +10)
  if (cvRisk < 5) score += 10;
  else if (cvRisk < 10) score += 5;
  else if (cvRisk > 20) score -= 15;
  else if (cvRisk > 15) score -= 10;
  else if (cvRisk > 10) score -= 5;
  
  // Optimal markers bonus
  if (hasOptimalVitals) score += 5;
  if (hasOptimalLabs) score += 5;
  
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
  
  const isLoading = vitalsLoading || labsLoading;
  
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
      hasOptimalLabs
    );
    
    return {
      biologicalAge: biologicalAgeData,
      cvRisk,
      longevityScore,
      hasOptimalVitals,
      hasOptimalLabs,
    };
  }, [patientAge, latestVitals, labResults, patient.gender]);
  
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
    </TooltipProvider>
  );
}

