import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calculator, Heart, Pill, Activity, User, Baby, Droplet, Stethoscope, AlertTriangle, Clock, Brain, Shield, Wind, Thermometer, Scale, Syringe } from 'lucide-react';

interface BMIResult {
  bmi: number;
  category: string;
  risk: string;
  color: string;
}

interface DosageResult {
  dose: number;
  frequency: string;
  instructions: string;
}

interface BSAResult {
  bsa: number;
  method: string;
}

interface PregnancyResult {
  edd: string;
  gestationalAge: string;
  trimester: string;
  weeks: number;
  days: number;
}

interface DVTRiskResult {
  score: number;
  risk: string;
  probability: string;
  recommendation: string;
  color: string;
}

interface QRISKResult {
  score: number;
  risk: string;
  recommendation: string;
  color: string;
}

interface GFRResult {
  gfr: number;
  stage: string;
  recommendation: string;
  color: string;
}

export function MedicalCalculator() {
  // BMI Calculator State
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [bmiResult, setBmiResult] = useState<BMIResult | null>(null);

  // Dosage Calculator State
  const [patientWeight, setPatientWeight] = useState('');
  const [medication, setMedication] = useState('');
  const [dosagePerKg, setDosagePerKg] = useState('');
  const [dosageResult, setDosageResult] = useState<DosageResult | null>(null);

  // BSA Calculator State
  const [bsaHeight, setBsaHeight] = useState('');
  const [bsaWeight, setBsaWeight] = useState('');
  const [bsaResult, setBsaResult] = useState<BSAResult | null>(null);

  // Heart Rate Zones
  const [age, setAge] = useState('');
  const [heartRateZones, setHeartRateZones] = useState<any>(null);

  // Pregnancy Calculator State
  const [lmp, setLmp] = useState('');
  const [ultrasoundDate, setUltrasoundDate] = useState('');
  const [ultrasoundWeeks, setUltrasoundWeeks] = useState('');
  const [pregnancyResult, setPregnancyResult] = useState<PregnancyResult | null>(null);

  // DVT Calculator State (Wells Score)
  const [dvtActiveCancer, setDvtActiveCancer] = useState(false);
  const [dvtParalysis, setDvtParalysis] = useState(false);
  const [dvtRecentBedRest, setDvtRecentBedRest] = useState(false);
  const [dvtLocalizedTenderness, setDvtLocalizedTenderness] = useState(false);
  const [dvtEntireLegSwollen, setDvtEntireLegSwollen] = useState(false);
  const [dvtCalfSwelling, setDvtCalfSwelling] = useState(false);
  const [dvtPittingEdema, setDvtPittingEdema] = useState(false);
  const [dvtCollateralVeins, setDvtCollateralVeins] = useState(false);
  const [dvtAlternativeDiagnosis, setDvtAlternativeDiagnosis] = useState(false);
  const [dvtResult, setDvtResult] = useState<DVTRiskResult | null>(null);

  // QRISK Calculator State
  const [qriskAge, setQriskAge] = useState('');
  const [qriskSex, setQriskSex] = useState('');
  const [qriskSmoker, setQriskSmoker] = useState(false);
  const [qriskDiabetes, setQriskDiabetes] = useState(false);
  const [qriskSystolicBP, setQriskSystolicBP] = useState('');
  const [qriskCholesterol, setQriskCholesterol] = useState('');
  const [qriskHDL, setQriskHDL] = useState('');
  const [qriskBMI, setQriskBMI] = useState('');
  const [qriskResult, setQriskResult] = useState<QRISKResult | null>(null);

  // GFR Calculator State
  const [gfrAge, setGfrAge] = useState('');
  const [gfrSex, setGfrSex] = useState('');
  const [gfrCreatinine, setGfrCreatinine] = useState('');
  const [gfrEthnicity, setGfrEthnicity] = useState('non-black');
  const [gfrResult, setGfrResult] = useState<GFRResult | null>(null);

  // Additional Calculators State
  const [qtInterval, setQtInterval] = useState('');
  const [qtRR, setQtRR] = useState('');
  const [qtcResult, setQtcResult] = useState<number | null>(null);
  
  const [anionGapNa, setAnionGapNa] = useState('');
  const [anionGapCl, setAnionGapCl] = useState('');
  const [anionGapHCO3, setAnionGapHCO3] = useState('');
  const [anionGapResult, setAnionGapResult] = useState<number | null>(null);

  // APGAR Score State
  const [apgarAppearance, setApgarAppearance] = useState('2');
  const [apgarPulse, setApgarPulse] = useState('2');
  const [apgarGrimace, setApgarGrimace] = useState('2');
  const [apgarActivity, setApgarActivity] = useState('2');
  const [apgarRespiration, setApgarRespiration] = useState('2');
  const [apgarResult, setApgarResult] = useState<number | null>(null);

  // Glasgow Coma Scale State
  const [gcsEyes, setGcsEyes] = useState('4');
  const [gcsVerbal, setGcsVerbal] = useState('5');
  const [gcsMotor, setGcsMotor] = useState('6');
  const [gcsResult, setGcsResult] = useState<number | null>(null);

  // CHADS2-VASc Score State
  const [chadsAge, setChadsAge] = useState('');
  const [chadsSex, setChadsSex] = useState('');
  const [chadsCHF, setChadsCHF] = useState(false);
  const [chadsHypertension, setChadsHypertension] = useState(false);
  const [chadsDiabetes, setChadsDiabetes] = useState(false);
  const [chadsStroke, setChadsStroke] = useState(false);
  const [chadsVascular, setChadsVascular] = useState(false);
  const [chadsResult, setChadsResult] = useState<any>(null);

  // PERC Rule State
  const [percAge, setPercAge] = useState('');
  const [percHR, setPercHR] = useState('');
  const [percO2Sat, setPercO2Sat] = useState('');
  const [percUnilateralLeg, setPercUnilateralLeg] = useState(false);
  const [percHemoptysis, setPercHemoptysis] = useState(false);
  const [percSurgery, setPercSurgery] = useState(false);
  const [percPriorPE, setPercPriorPE] = useState(false);
  const [percHormone, setPercHormone] = useState(false);
  const [percResult, setPercResult] = useState<any>(null);

  // CURB-65 State
  const [curbConfusion, setCurbConfusion] = useState(false);
  const [curbUrea, setCurbUrea] = useState('');
  const [curbRespiratory, setCurbRespiratory] = useState('');
  const [curbBP, setCurbBP] = useState('');
  const [curbAge, setCurbAge] = useState('');
  const [curbResult, setCurbResult] = useState<any>(null);

  // Corrected Calcium State
  const [calcCalcium, setCalcCalcium] = useState('');
  const [calcAlbumin, setCalcAlbumin] = useState('');
  const [calcResult, setCalcResult] = useState<number | null>(null);

  // Ideal Body Weight State
  const [ibwHeight, setIbwHeight] = useState('');
  const [ibwSex, setIbwSex] = useState('');
  const [ibwResult, setIbwResult] = useState<number | null>(null);

  // Maintenance Fluid State
  const [maintWeight, setMaintWeight] = useState('');
  const [maintResult, setMaintResult] = useState<any>(null);

  const calculateBMI = () => {
    if (!height || !weight) return;

    let heightInM = parseFloat(height);
    let weightInKg = parseFloat(weight);

    // Convert height to meters
    if (heightUnit === 'ft') {
      heightInM = heightInM * 0.3048;
    } else if (heightUnit === 'in') {
      heightInM = heightInM * 0.0254;
    } else {
      heightInM = heightInM / 100; // cm to m
    }

    // Convert weight to kg
    if (weightUnit === 'lbs') {
      weightInKg = weightInKg * 0.453592;
    }

    const bmi = weightInKg / (heightInM * heightInM);
    
    let category, risk, color;
    if (bmi < 18.5) {
      category = 'Underweight';
      risk = 'Increased risk of malnutrition';
      color = 'text-blue-600';
    } else if (bmi < 25) {
      category = 'Normal weight';
      risk = 'Low health risk';
      color = 'text-green-600';
    } else if (bmi < 30) {
      category = 'Overweight';
      risk = 'Moderate health risk';
      color = 'text-yellow-600';
    } else {
      category = 'Obese';
      risk = 'High health risk';
      color = 'text-red-600';
    }

    setBmiResult({ bmi: Math.round(bmi * 10) / 10, category, risk, color });
  };

  const calculateDosage = () => {
    if (!patientWeight || !dosagePerKg) return;

    const weight = parseFloat(patientWeight);
    const dosePerKg = parseFloat(dosagePerKg);
    const totalDose = weight * dosePerKg;

    // Common medication guidelines
    const medicationGuides: { [key: string]: any } = {
      'paracetamol': {
        maxDaily: weight * 60, // 60mg/kg/day max
        frequency: 'Every 6-8 hours',
        instructions: 'Take with food. Maximum 4 doses per day.'
      },
      'ibuprofen': {
        maxDaily: weight * 30, // 30mg/kg/day max
        frequency: 'Every 6-8 hours',
        instructions: 'Take with food. Avoid if allergic to NSAIDs.'
      },
      'amoxicillin': {
        frequency: 'Every 8 hours',
        instructions: 'Complete full course. Take with water.'
      }
    };

    const guide = medicationGuides[medication.toLowerCase()] || {
      frequency: 'As prescribed',
      instructions: 'Follow doctor\'s instructions.'
    };

    setDosageResult({
      dose: Math.round(totalDose * 100) / 100,
      frequency: guide.frequency,
      instructions: guide.instructions
    });
  };

  const calculateBSA = () => {
    if (!bsaHeight || !bsaWeight) return;

    const h = parseFloat(bsaHeight);
    const w = parseFloat(bsaWeight);

    // Mosteller formula: BSA = √((height × weight) / 3600)
    const bsa = Math.sqrt((h * w) / 3600);

    setBsaResult({
      bsa: Math.round(bsa * 100) / 100,
      method: 'Mosteller Formula'
    });
  };

  const calculateHeartRateZones = () => {
    if (!age) return;

    const ageNum = parseInt(age);
    const maxHR = 220 - ageNum;
    
    const zones = {
      resting: { min: 60, max: 100, description: 'Normal resting heart rate' },
      fat_burn: { min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6), description: 'Fat burning zone' },
      aerobic: { min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7), description: 'Aerobic base building' },
      anaerobic: { min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8), description: 'Anaerobic threshold' },
      max: { min: Math.round(maxHR * 0.8), max: maxHR, description: 'Maximum effort zone' }
    };

    setHeartRateZones({ maxHR, zones });
  };

  const calculatePregnancy = () => {
    if (!lmp && !ultrasoundDate) return;

    let currentDate = new Date();
    let weeks = 0;
    let days = 0;

    if (lmp) {
      const lmpDate = new Date(lmp);
      const diffTime = currentDate.getTime() - lmpDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      weeks = Math.floor(diffDays / 7);
      days = diffDays % 7;
    } else if (ultrasoundDate && ultrasoundWeeks) {
      const usDate = new Date(ultrasoundDate);
      const usWeeks = parseFloat(ultrasoundWeeks);
      const diffTime = currentDate.getTime() - usDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const totalDays = (usWeeks * 7) + diffDays;
      weeks = Math.floor(totalDays / 7);
      days = totalDays % 7;
    }

    const eddDate = lmp ? new Date(new Date(lmp).getTime() + (280 * 24 * 60 * 60 * 1000)) : null;
    const edd = eddDate ? eddDate.toLocaleDateString() : 'Calculate from LMP';

    let trimester = 'First';
    if (weeks >= 28) trimester = 'Third';
    else if (weeks >= 14) trimester = 'Second';

    setPregnancyResult({
      edd,
      gestationalAge: `${weeks} weeks ${days} days`,
      trimester,
      weeks,
      days
    });
  };

  const calculateDVT = () => {
    let score = 0;
    
    if (dvtActiveCancer) score += 1;
    if (dvtParalysis) score += 1;
    if (dvtRecentBedRest) score += 1;
    if (dvtLocalizedTenderness) score += 1;
    if (dvtEntireLegSwollen) score += 1;
    if (dvtCalfSwelling) score += 1;
    if (dvtPittingEdema) score += 1;
    if (dvtCollateralVeins) score += 1;
    if (dvtAlternativeDiagnosis) score -= 2;

    let risk, probability, recommendation, color;
    if (score <= 0) {
      risk = 'Low';
      probability = '<5%';
      recommendation = 'D-dimer test if available, otherwise clinical observation';
      color = 'text-green-600';
    } else if (score <= 2) {
      risk = 'Moderate';
      probability = '17%';
      recommendation = 'D-dimer test, if positive proceed to ultrasound';
      color = 'text-yellow-600';
    } else {
      risk = 'High';
      probability = '53%';
      recommendation = 'Immediate ultrasound and consider anticoagulation';
      color = 'text-red-600';
    }

    setDvtResult({ score, risk, probability, recommendation, color });
  };

  const calculateQRISK = () => {
    if (!qriskAge || !qriskSystolicBP || !qriskCholesterol || !qriskHDL || !qriskBMI) return;

    const ageNum = parseFloat(qriskAge);
    const sbp = parseFloat(qriskSystolicBP);
    const chol = parseFloat(qriskCholesterol);
    const hdl = parseFloat(qriskHDL);
    const bmi = parseFloat(qriskBMI);

    // Simplified QRISK3 calculation (simplified version)
    let score = 0;
    
    // Age factor
    if (qriskSex === 'male') {
      score += (ageNum - 50) * 0.5;
    } else {
      score += (ageNum - 50) * 0.4;
    }

    // Blood pressure
    if (sbp >= 160) score += 2;
    else if (sbp >= 140) score += 1;

    // Cholesterol ratio
    const cholRatio = chol / hdl;
    if (cholRatio > 6) score += 2;
    else if (cholRatio > 4) score += 1;

    // BMI
    if (bmi > 30) score += 1;

    // Risk factors
    if (qriskSmoker) score += 2;
    if (qriskDiabetes) score += 2;

    // Convert to percentage (simplified)
    const riskPercent = Math.min(95, Math.max(1, score * 3));

    let risk, recommendation, color;
    if (riskPercent < 10) {
      risk = 'Low';
      recommendation = 'Lifestyle advice, reassess in 5 years';
      color = 'text-green-600';
    } else if (riskPercent < 20) {
      risk = 'Moderate';
      recommendation = 'Lifestyle advice, consider statin therapy';
      color = 'text-yellow-600';
    } else {
      risk = 'High';
      recommendation = 'Lifestyle advice, statin therapy recommended';
      color = 'text-red-600';
    }

    setQriskResult({ score: riskPercent, risk, recommendation, color });
  };

  const calculateGFR = () => {
    if (!gfrAge || !gfrCreatinine) return;

    const ageNum = parseFloat(gfrAge);
    const creatinine = parseFloat(gfrCreatinine);
    const isFemale = gfrSex === 'female';
    const isBlack = gfrEthnicity === 'black';

    // CKD-EPI formula (simplified)
    let gfr = 0;
    if (isFemale) {
      if (creatinine <= 0.7) {
        gfr = 144 * Math.pow(creatinine / 0.7, -0.329) * Math.pow(0.993, ageNum);
      } else {
        gfr = 144 * Math.pow(creatinine / 0.7, -1.209) * Math.pow(0.993, ageNum);
      }
    } else {
      if (creatinine <= 0.9) {
        gfr = 141 * Math.pow(creatinine / 0.9, -0.411) * Math.pow(0.993, ageNum);
      } else {
        gfr = 141 * Math.pow(creatinine / 0.9, -1.209) * Math.pow(0.993, ageNum);
      }
    }

    if (isBlack) gfr *= 1.159;

    gfr = Math.round(gfr);

    let stage, recommendation, color;
    if (gfr >= 90) {
      stage = 'Stage 1 (Normal or High)';
      recommendation = 'Normal kidney function';
      color = 'text-green-600';
    } else if (gfr >= 60) {
      stage = 'Stage 2 (Mildly Decreased)';
      recommendation = 'Monitor kidney function';
      color = 'text-blue-600';
    } else if (gfr >= 45) {
      stage = 'Stage 3a (Mildly to Moderately Decreased)';
      recommendation = 'Monitor and manage CKD';
      color = 'text-yellow-600';
    } else if (gfr >= 30) {
      stage = 'Stage 3b (Moderately to Severely Decreased)';
      recommendation = 'Refer to nephrology';
      color = 'text-orange-600';
    } else if (gfr >= 15) {
      stage = 'Stage 4 (Severely Decreased)';
      recommendation = 'Prepare for renal replacement therapy';
      color = 'text-red-600';
    } else {
      stage = 'Stage 5 (Kidney Failure)';
      recommendation = 'Dialysis or transplant required';
      color = 'text-red-700';
    }

    setGfrResult({ gfr, stage, recommendation, color });
  };

  const calculateQTc = () => {
    if (!qtInterval || !qtRR) return;

    const qt = parseFloat(qtInterval);
    const rr = parseFloat(qtRR) / 1000; // Convert ms to seconds

    // Bazett's formula: QTc = QT / √RR
    const qtc = qt / Math.sqrt(rr);
    setQtcResult(Math.round(qtc));
  };

  const calculateAnionGap = () => {
    if (!anionGapNa || !anionGapCl || !anionGapHCO3) return;

    const na = parseFloat(anionGapNa);
    const cl = parseFloat(anionGapCl);
    const hco3 = parseFloat(anionGapHCO3);

    // Anion Gap = Na - (Cl + HCO3)
    const gap = na - (cl + hco3);
    setAnionGapResult(Math.round(gap * 10) / 10);
  };

  const calculateAPGAR = () => {
    const score = parseInt(apgarAppearance) + parseInt(apgarPulse) + 
                  parseInt(apgarGrimace) + parseInt(apgarActivity) + 
                  parseInt(apgarRespiration);
    setApgarResult(score);
  };

  const calculateGCS = () => {
    const score = parseInt(gcsEyes) + parseInt(gcsVerbal) + parseInt(gcsMotor);
    setGcsResult(score);
  };

  const calculateCHADS2VASc = () => {
    let score = 0;
    
    // Age
    const ageNum = parseFloat(chadsAge);
    if (ageNum >= 75) score += 2;
    else if (ageNum >= 65) score += 1;
    
    // Sex (female)
    if (chadsSex === 'female') score += 1;
    
    // Clinical factors
    if (chadsCHF) score += 1;
    if (chadsHypertension) score += 1;
    if (chadsDiabetes) score += 1;
    if (chadsStroke) score += 2;
    if (chadsVascular) score += 1;
    
    let recommendation, color;
    if (score === 0) {
      recommendation = 'No anticoagulation needed';
      color = 'text-green-600';
    } else if (score === 1) {
      recommendation = 'Consider anticoagulation (aspirin or anticoagulant)';
      color = 'text-yellow-600';
    } else {
      recommendation = 'Anticoagulation recommended (warfarin, DOAC)';
      color = 'text-red-600';
    }
    
    setChadsResult({ score, recommendation, color });
  };

  const calculatePERC = () => {
    const ageNum = parseFloat(percAge);
    const hr = parseFloat(percHR);
    const o2sat = parseFloat(percO2Sat);
    
    let criteria = 0;
    if (ageNum >= 50) criteria++;
    if (hr >= 100) criteria++;
    if (o2sat < 95) criteria++;
    if (percUnilateralLeg) criteria++;
    if (percHemoptysis) criteria++;
    if (percSurgery) criteria++;
    if (percPriorPE) criteria++;
    if (percHormone) criteria++;
    
    let result, color;
    if (criteria === 0) {
      result = 'PERC Negative - Low risk, PE unlikely';
      color = 'text-green-600';
    } else {
      result = 'PERC Positive - Consider D-dimer or imaging';
      color = 'text-yellow-600';
    }
    
    setPercResult({ criteria, result, color });
  };

  const calculateCURB65 = () => {
    let score = 0;
    const ageNum = parseFloat(curbAge);
    const urea = parseFloat(curbUrea);
    const resp = parseFloat(curbRespiratory);
    const bp = parseFloat(curbBP);
    
    if (curbConfusion) score++;
    if (urea > 7) score++;
    if (resp >= 30) score++;
    if (bp < 90 || (bp < 60 && bp !== 0)) score++;
    if (ageNum >= 65) score++;
    
    let risk, recommendation, color;
    if (score === 0 || score === 1) {
      risk = 'Low';
      recommendation = 'Consider outpatient treatment';
      color = 'text-green-600';
    } else if (score === 2) {
      risk = 'Moderate';
      recommendation = 'Consider hospital admission';
      color = 'text-yellow-600';
    } else {
      risk = 'High';
      recommendation = 'Hospital admission, consider ICU';
      color = 'text-red-600';
    }
    
    setCurbResult({ score, risk, recommendation, color });
  };

  const calculateCorrectedCalcium = () => {
    if (!calcCalcium || !calcAlbumin) return;
    
    const calcium = parseFloat(calcCalcium);
    const albumin = parseFloat(calcAlbumin);
    
    // Corrected Calcium = Total Calcium + 0.8 × (4 - Albumin)
    const corrected = calcium + 0.8 * (4 - albumin);
    setCalcResult(Math.round(corrected * 10) / 10);
  };

  const calculateIBW = () => {
    if (!ibwHeight || !ibwSex) return;
    
    const height = parseFloat(ibwHeight);
    let ibw = 0;
    
    if (ibwSex === 'male') {
      // Devine formula: IBW (kg) = 50 + 2.3 × (height in inches - 60)
      const heightInches = height / 2.54;
      ibw = 50 + 2.3 * (heightInches - 60);
    } else {
      // Female: IBW (kg) = 45.5 + 2.3 × (height in inches - 60)
      const heightInches = height / 2.54;
      ibw = 45.5 + 2.3 * (heightInches - 60);
    }
    
    setIbwResult(Math.round(ibw * 10) / 10);
  };

  const calculateMaintenanceFluid = () => {
    if (!maintWeight) return;
    
    const weight = parseFloat(maintWeight);
    let hourly, daily;
    
    if (weight <= 20) {
      // Holliday-Segar formula for weight ≤ 20 kg
      hourly = weight * 4; // 4 mL/kg/hr
    } else {
      // For weight > 20 kg: 1500 mL + 20 mL/kg for each kg > 20
      hourly = (1500 + (weight - 20) * 20) / 24;
    }
    
    daily = hourly * 24;
    
    setMaintResult({ hourly: Math.round(hourly), daily: Math.round(daily) });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Medical Calculators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bmi" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-1 h-auto">
              <TabsTrigger value="bmi" className="text-xs">BMI</TabsTrigger>
              <TabsTrigger value="dosage" className="text-xs">Dosage</TabsTrigger>
              <TabsTrigger value="bsa" className="text-xs">BSA</TabsTrigger>
              <TabsTrigger value="heart" className="text-xs">Heart Rate</TabsTrigger>
              <TabsTrigger value="pregnancy" className="text-xs">Pregnancy</TabsTrigger>
              <TabsTrigger value="dvt" className="text-xs">DVT</TabsTrigger>
              <TabsTrigger value="qrisk" className="text-xs">QRISK</TabsTrigger>
              <TabsTrigger value="gfr" className="text-xs">GFR</TabsTrigger>
              <TabsTrigger value="qtc" className="text-xs">QTc</TabsTrigger>
              <TabsTrigger value="anion" className="text-xs">Anion Gap</TabsTrigger>
              <TabsTrigger value="apgar" className="text-xs">APGAR</TabsTrigger>
              <TabsTrigger value="gcs" className="text-xs">GCS</TabsTrigger>
              <TabsTrigger value="chads" className="text-xs">CHADS2-VASc</TabsTrigger>
              <TabsTrigger value="perc" className="text-xs">PERC</TabsTrigger>
              <TabsTrigger value="curb" className="text-xs">CURB-65</TabsTrigger>
              <TabsTrigger value="calcium" className="text-xs">Ca²⁺</TabsTrigger>
              <TabsTrigger value="ibw" className="text-xs">IBW</TabsTrigger>
              <TabsTrigger value="maint" className="text-xs">Fluids</TabsTrigger>
            </TabsList>

            {/* BMI Calculator */}
            <TabsContent value="bmi" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Body Mass Index Calculator
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <div className="flex gap-2">
                    <Input
                      id="height"
                      type="number"
                      placeholder="Enter height"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                    <Select value={heightUnit} onValueChange={setHeightUnit}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <div className="flex gap-2">
                    <Input
                      id="weight"
                      type="number"
                      placeholder="Enter weight"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                    <Select value={weightUnit} onValueChange={setWeightUnit}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={calculateBMI} className="w-full">
                Calculate BMI
              </Button>

              {bmiResult && (
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold">{bmiResult.bmi}</div>
                      <Badge className={bmiResult.color}>{bmiResult.category}</Badge>
                      <p className="text-sm text-gray-600">{bmiResult.risk}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Dosage Calculator */}
            <TabsContent value="dosage" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Medication Dosage Calculator
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient-weight">Patient Weight (kg)</Label>
                  <Input
                    id="patient-weight"
                    type="number"
                    placeholder="Enter patient weight"
                    value={patientWeight}
                    onChange={(e) => setPatientWeight(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medication">Medication</Label>
                  <Select value={medication || undefined} onValueChange={setMedication}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select medication" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paracetamol">Paracetamol</SelectItem>
                      <SelectItem value="ibuprofen">Ibuprofen</SelectItem>
                      <SelectItem value="amoxicillin">Amoxicillin</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dosage-per-kg">Dosage per kg (mg/kg)</Label>
                  <Input
                    id="dosage-per-kg"
                    type="number"
                    placeholder="Enter dosage per kg"
                    value={dosagePerKg}
                    onChange={(e) => setDosagePerKg(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={calculateDosage} className="w-full">
                Calculate Dosage
              </Button>

              {dosageResult && (
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">{dosageResult.dose} mg</div>
                      <p className="text-sm"><strong>Frequency:</strong> {dosageResult.frequency}</p>
                      <p className="text-sm text-gray-600">{dosageResult.instructions}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* BSA Calculator */}
            <TabsContent value="bsa" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Body Surface Area Calculator
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bsa-height">Height (cm)</Label>
                  <Input
                    id="bsa-height"
                    type="number"
                    placeholder="Enter height in cm"
                    value={bsaHeight}
                    onChange={(e) => setBsaHeight(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bsa-weight">Weight (kg)</Label>
                  <Input
                    id="bsa-weight"
                    type="number"
                    placeholder="Enter weight in kg"
                    value={bsaWeight}
                    onChange={(e) => setBsaWeight(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={calculateBSA} className="w-full">
                Calculate BSA
              </Button>

              {bsaResult && (
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4">
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold">{bsaResult.bsa} m²</div>
                      <p className="text-sm text-gray-600">Using {bsaResult.method}</p>
                      <p className="text-xs text-gray-500">Used for chemotherapy and medication dosing</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Heart Rate Zones */}
            <TabsContent value="heart" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Heart Rate Zones Calculator
              </h3>

              <div className="space-y-2">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter patient age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>

              <Button onClick={calculateHeartRateZones} className="w-full">
                Calculate Heart Rate Zones
              </Button>

              {heartRateZones && (
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold">Max HR: {heartRateZones.maxHR} bpm</div>
                      </div>
                      
                      <div className="space-y-2">
                        {Object.entries(heartRateZones.zones).map(([zone, data]: [string, any]) => (
                          <div key={zone} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="font-medium capitalize">{zone.replace('_', ' ')}</span>
                            <span className="text-sm">{data.min}-{data.max} bpm</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Pregnancy Calculator */}
            <TabsContent value="pregnancy" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Baby className="w-4 h-4" />
                Pregnancy Calculator
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lmp">Last Menstrual Period (LMP)</Label>
                  <Input
                    id="lmp"
                    type="date"
                    value={lmp}
                    onChange={(e) => setLmp(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">OR use ultrasound dating below</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ultrasound-date">Ultrasound Date</Label>
                  <Input
                    id="ultrasound-date"
                    type="date"
                    value={ultrasoundDate}
                    onChange={(e) => setUltrasoundDate(e.target.value)}
                  />
                </div>

                {ultrasoundDate && (
                  <div className="space-y-2">
                    <Label htmlFor="ultrasound-weeks">Gestational Age at Ultrasound (weeks)</Label>
                    <Input
                      id="ultrasound-weeks"
                      type="number"
                      placeholder="e.g., 12.5"
                      value={ultrasoundWeeks}
                      onChange={(e) => setUltrasoundWeeks(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <Button onClick={calculatePregnancy} className="w-full">
                Calculate Pregnancy Details
              </Button>

              {pregnancyResult && (
                <Card className="border-l-4 border-l-pink-500">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{pregnancyResult.weeks}w {pregnancyResult.days}d</div>
                        <Badge className="mt-2">{pregnancyResult.trimester} Trimester</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <p className="text-sm text-gray-600">Gestational Age</p>
                          <p className="font-semibold">{pregnancyResult.gestationalAge}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Estimated Due Date</p>
                          <p className="font-semibold">{pregnancyResult.edd}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* DVT Calculator (Wells Score) */}
            <TabsContent value="dvt" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Droplet className="w-4 h-4" />
                DVT Risk Calculator (Wells Score)
              </h3>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dvt-cancer"
                    checked={dvtActiveCancer}
                    onChange={(e) => setDvtActiveCancer(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="dvt-cancer" className="cursor-pointer">Active cancer (treatment within 6 months)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dvt-paralysis"
                    checked={dvtParalysis}
                    onChange={(e) => setDvtParalysis(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="dvt-paralysis" className="cursor-pointer">Paralysis, paresis, or recent plaster immobilization</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dvt-bedrest"
                    checked={dvtRecentBedRest}
                    onChange={(e) => setDvtRecentBedRest(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="dvt-bedrest" className="cursor-pointer">Recently bedridden &gt;3 days or major surgery &lt;4 weeks</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dvt-tenderness"
                    checked={dvtLocalizedTenderness}
                    onChange={(e) => setDvtLocalizedTenderness(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="dvt-tenderness" className="cursor-pointer">Localized tenderness along deep venous system</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dvt-entire-leg"
                    checked={dvtEntireLegSwollen}
                    onChange={(e) => setDvtEntireLegSwollen(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="dvt-entire-leg" className="cursor-pointer">Entire leg swollen</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dvt-calf"
                    checked={dvtCalfSwelling}
                    onChange={(e) => setDvtCalfSwelling(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="dvt-calf" className="cursor-pointer">Calf swelling &gt;3cm compared to asymptomatic leg</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dvt-edema"
                    checked={dvtPittingEdema}
                    onChange={(e) => setDvtPittingEdema(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="dvt-edema" className="cursor-pointer">Pitting edema (greater in symptomatic leg)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dvt-collateral"
                    checked={dvtCollateralVeins}
                    onChange={(e) => setDvtCollateralVeins(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="dvt-collateral" className="cursor-pointer">Collateral superficial veins (non-varicose)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dvt-alternative"
                    checked={dvtAlternativeDiagnosis}
                    onChange={(e) => setDvtAlternativeDiagnosis(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="dvt-alternative" className="cursor-pointer">Alternative diagnosis as likely or more likely than DVT</Label>
                </div>
              </div>

              <Button onClick={calculateDVT} className="w-full">
                Calculate DVT Risk
              </Button>

              {dvtResult && (
                <Card className={`border-l-4 ${dvtResult.color.replace('text-', 'border-l-')}`}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-3xl font-bold">Wells Score: {dvtResult.score}</div>
                        <Badge className={`mt-2 ${dvtResult.color}`}>{dvtResult.risk} Risk</Badge>
                      </div>
                      <div className="pt-2 border-t space-y-2">
                        <p className="text-sm"><strong>Probability:</strong> {dvtResult.probability}</p>
                        <p className="text-sm text-gray-600">{dvtResult.recommendation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* QRISK Calculator */}
            <TabsContent value="qrisk" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4" />
                QRISK3 Cardiovascular Risk Calculator
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qrisk-age">Age (years)</Label>
                  <Input
                    id="qrisk-age"
                    type="number"
                    placeholder="25-84"
                    value={qriskAge}
                    onChange={(e) => setQriskAge(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qrisk-sex">Sex</Label>
                  <Select value={qriskSex} onValueChange={setQriskSex}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qrisk-sbp">Systolic BP (mmHg)</Label>
                  <Input
                    id="qrisk-sbp"
                    type="number"
                    placeholder="e.g., 120"
                    value={qriskSystolicBP}
                    onChange={(e) => setQriskSystolicBP(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qrisk-chol">Total Cholesterol (mmol/L)</Label>
                  <Input
                    id="qrisk-chol"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 5.0"
                    value={qriskCholesterol}
                    onChange={(e) => setQriskCholesterol(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qrisk-hdl">HDL Cholesterol (mmol/L)</Label>
                  <Input
                    id="qrisk-hdl"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 1.2"
                    value={qriskHDL}
                    onChange={(e) => setQriskHDL(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qrisk-bmi">BMI</Label>
                  <Input
                    id="qrisk-bmi"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 25"
                    value={qriskBMI}
                    onChange={(e) => setQriskBMI(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="qrisk-smoker"
                    checked={qriskSmoker}
                    onChange={(e) => setQriskSmoker(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="qrisk-smoker" className="cursor-pointer">Current smoker</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="qrisk-diabetes"
                    checked={qriskDiabetes}
                    onChange={(e) => setQriskDiabetes(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="qrisk-diabetes" className="cursor-pointer">Type 1 or Type 2 Diabetes</Label>
                </div>
              </div>

              <Button onClick={calculateQRISK} className="w-full">
                Calculate QRISK3 Score
              </Button>

              {qriskResult && (
                <Card className={`border-l-4 ${qriskResult.color.replace('text-', 'border-l-')}`}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{qriskResult.score.toFixed(1)}%</div>
                        <Badge className={`mt-2 ${qriskResult.color}`}>{qriskResult.risk} Risk</Badge>
                      </div>
                      <p className="text-sm text-gray-600 pt-2 border-t">{qriskResult.recommendation}</p>
                      <p className="text-xs text-gray-500">10-year risk of cardiovascular disease</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* GFR Calculator */}
            <TabsContent value="gfr" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Estimated Glomerular Filtration Rate (eGFR)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gfr-age">Age (years)</Label>
                  <Input
                    id="gfr-age"
                    type="number"
                    placeholder="Enter age"
                    value={gfrAge}
                    onChange={(e) => setGfrAge(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gfr-sex">Sex</Label>
                  <Select value={gfrSex} onValueChange={setGfrSex}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gfr-creatinine">Serum Creatinine (mg/dL)</Label>
                  <Input
                    id="gfr-creatinine"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 1.0"
                    value={gfrCreatinine}
                    onChange={(e) => setGfrCreatinine(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gfr-ethnicity">Ethnicity</Label>
                  <Select value={gfrEthnicity} onValueChange={setGfrEthnicity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="non-black">Non-Black</SelectItem>
                      <SelectItem value="black">Black</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={calculateGFR} className="w-full">
                Calculate eGFR
              </Button>

              {gfrResult && (
                <Card className={`border-l-4 ${gfrResult.color.replace('text-', 'border-l-')}`}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{gfrResult.gfr} mL/min/1.73m²</div>
                        <Badge className={`mt-2 ${gfrResult.color}`}>{gfrResult.stage}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 pt-2 border-t">{gfrResult.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* QTc Calculator */}
            <TabsContent value="qtc" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Corrected QT Interval (QTc)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qt-interval">QT Interval (ms)</Label>
                  <Input
                    id="qt-interval"
                    type="number"
                    placeholder="e.g., 400"
                    value={qtInterval}
                    onChange={(e) => setQtInterval(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qt-rr">RR Interval (ms)</Label>
                  <Input
                    id="qt-rr"
                    type="number"
                    placeholder="e.g., 1000"
                    value={qtRR}
                    onChange={(e) => setQtRR(e.target.value)}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500">Using Bazett's formula: QTc = QT / √RR</p>

              <Button onClick={calculateQTc} className="w-full">
                Calculate QTc
              </Button>

              {qtcResult !== null && (
                <Card className={`border-l-4 ${
                  qtcResult > 500 ? 'border-l-red-500' : 
                  qtcResult > 470 ? 'border-l-yellow-500' : 
                  'border-l-green-500'
                }`}>
                  <CardContent className="pt-4">
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold">{qtcResult} ms</div>
                      <Badge className={
                        qtcResult > 500 ? 'bg-red-500' : 
                        qtcResult > 470 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }>
                        {qtcResult > 500 ? 'Prolonged (High Risk)' : 
                         qtcResult > 470 ? 'Borderline' : 
                         'Normal'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-2">
                        Normal: &lt;470ms (men), &lt;480ms (women)<br/>
                        Prolonged: &gt;500ms (both sexes)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Anion Gap Calculator */}
            <TabsContent value="anion" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Anion Gap Calculator
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="anion-na">Sodium (Na⁺) mEq/L</Label>
                  <Input
                    id="anion-na"
                    type="number"
                    placeholder="e.g., 140"
                    value={anionGapNa}
                    onChange={(e) => setAnionGapNa(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anion-cl">Chloride (Cl⁻) mEq/L</Label>
                  <Input
                    id="anion-cl"
                    type="number"
                    placeholder="e.g., 100"
                    value={anionGapCl}
                    onChange={(e) => setAnionGapCl(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anion-hco3">Bicarbonate (HCO₃⁻) mEq/L</Label>
                  <Input
                    id="anion-hco3"
                    type="number"
                    placeholder="e.g., 24"
                    value={anionGapHCO3}
                    onChange={(e) => setAnionGapHCO3(e.target.value)}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500">Formula: Anion Gap = Na⁺ - (Cl⁻ + HCO₃⁻)</p>

              <Button onClick={calculateAnionGap} className="w-full">
                Calculate Anion Gap
              </Button>

              {anionGapResult !== null && (
                <Card className={`border-l-4 ${
                  anionGapResult > 16 ? 'border-l-red-500' : 
                  anionGapResult < 8 ? 'border-l-yellow-500' : 
                  'border-l-green-500'
                }`}>
                  <CardContent className="pt-4">
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold">{anionGapResult} mEq/L</div>
                      <Badge className={
                        anionGapResult > 16 ? 'bg-red-500' : 
                        anionGapResult < 8 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }>
                        {anionGapResult > 16 ? 'High (Metabolic Acidosis)' : 
                         anionGapResult < 8 ? 'Low' : 
                         'Normal'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-2">
                        Normal range: 8-16 mEq/L<br/>
                        High: &gt;16 mEq/L suggests high anion gap metabolic acidosis
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* APGAR Score Calculator */}
            <TabsContent value="apgar" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Baby className="w-4 h-4" />
                APGAR Score Calculator
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Appearance (Color)</Label>
                  <Select value={apgarAppearance} onValueChange={setApgarAppearance}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - Blue/pale all over</SelectItem>
                      <SelectItem value="1">1 - Blue at extremities, body pink</SelectItem>
                      <SelectItem value="2">2 - Pink all over</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pulse (Heart Rate)</Label>
                  <Select value={apgarPulse} onValueChange={setApgarPulse}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - Absent</SelectItem>
                      <SelectItem value="1">1 - &lt;100 bpm</SelectItem>
                      <SelectItem value="2">2 - ≥100 bpm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Grimace (Reflex Irritability)</Label>
                  <Select value={apgarGrimace} onValueChange={setApgarGrimace}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - No response</SelectItem>
                      <SelectItem value="1">1 - Grimace</SelectItem>
                      <SelectItem value="2">2 - Cry or active withdrawal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Activity (Muscle Tone)</Label>
                  <Select value={apgarActivity} onValueChange={setApgarActivity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - Limp</SelectItem>
                      <SelectItem value="1">1 - Some flexion</SelectItem>
                      <SelectItem value="2">2 - Active motion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Respiration</Label>
                  <Select value={apgarRespiration} onValueChange={setApgarRespiration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - Absent</SelectItem>
                      <SelectItem value="1">1 - Slow, irregular</SelectItem>
                      <SelectItem value="2">2 - Good, crying</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={calculateAPGAR} className="w-full">
                Calculate APGAR Score
              </Button>

              {apgarResult !== null && (
                <Card className={`border-l-4 ${
                  apgarResult >= 7 ? 'border-l-green-500' : 
                  apgarResult >= 4 ? 'border-l-yellow-500' : 
                  'border-l-red-500'
                }`}>
                  <CardContent className="pt-4">
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold">{apgarResult}/10</div>
                      <Badge className={
                        apgarResult >= 7 ? 'bg-green-500' : 
                        apgarResult >= 4 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }>
                        {apgarResult >= 7 ? 'Normal' : 
                         apgarResult >= 4 ? 'Moderate Depression' : 
                         'Severe Depression'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-2">
                        Scored at 1 and 5 minutes after birth
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Glasgow Coma Scale Calculator */}
            <TabsContent value="gcs" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Glasgow Coma Scale (GCS)
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Eye Opening</Label>
                  <Select value={gcsEyes} onValueChange={setGcsEyes}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 - Spontaneous</SelectItem>
                      <SelectItem value="3">3 - To voice</SelectItem>
                      <SelectItem value="2">2 - To pain</SelectItem>
                      <SelectItem value="1">1 - None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Verbal Response</Label>
                  <Select value={gcsVerbal} onValueChange={setGcsVerbal}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 - Oriented</SelectItem>
                      <SelectItem value="4">4 - Confused</SelectItem>
                      <SelectItem value="3">3 - Inappropriate words</SelectItem>
                      <SelectItem value="2">2 - Incomprehensible sounds</SelectItem>
                      <SelectItem value="1">1 - None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Motor Response</Label>
                  <Select value={gcsMotor} onValueChange={setGcsMotor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 - Obeys commands</SelectItem>
                      <SelectItem value="5">5 - Localizes to pain</SelectItem>
                      <SelectItem value="4">4 - Withdraws from pain</SelectItem>
                      <SelectItem value="3">3 - Flexion to pain</SelectItem>
                      <SelectItem value="2">2 - Extension to pain</SelectItem>
                      <SelectItem value="1">1 - None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={calculateGCS} className="w-full">
                Calculate GCS
              </Button>

              {gcsResult !== null && (
                <Card className={`border-l-4 ${
                  gcsResult >= 13 ? 'border-l-green-500' : 
                  gcsResult >= 9 ? 'border-l-yellow-500' : 
                  'border-l-red-500'
                }`}>
                  <CardContent className="pt-4">
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold">{gcsResult}/15</div>
                      <Badge className={
                        gcsResult >= 13 ? 'bg-green-500' : 
                        gcsResult >= 9 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }>
                        {gcsResult >= 13 ? 'Mild' : 
                         gcsResult >= 9 ? 'Moderate' : 
                         'Severe'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-2">
                        {gcsResult >= 13 ? 'Minor brain injury' : 
                         gcsResult >= 9 ? 'Moderate brain injury' : 
                         'Severe brain injury'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* CHADS2-VASc Calculator */}
            <TabsContent value="chads" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                CHADS2-VASc Score (Stroke Risk in AF)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chads-age">Age</Label>
                  <Input
                    id="chads-age"
                    type="number"
                    placeholder="Enter age"
                    value={chadsAge}
                    onChange={(e) => setChadsAge(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chads-sex">Sex</Label>
                  <Select value={chadsSex} onValueChange={setChadsSex}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chads-chf"
                    checked={chadsCHF}
                    onChange={(e) => setChadsCHF(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="chads-chf" className="cursor-pointer">Congestive Heart Failure</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chads-hypertension"
                    checked={chadsHypertension}
                    onChange={(e) => setChadsHypertension(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="chads-hypertension" className="cursor-pointer">Hypertension</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chads-diabetes"
                    checked={chadsDiabetes}
                    onChange={(e) => setChadsDiabetes(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="chads-diabetes" className="cursor-pointer">Diabetes</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chads-stroke"
                    checked={chadsStroke}
                    onChange={(e) => setChadsStroke(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="chads-stroke" className="cursor-pointer">Stroke/TIA (2 points)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chads-vascular"
                    checked={chadsVascular}
                    onChange={(e) => setChadsVascular(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="chads-vascular" className="cursor-pointer">Vascular Disease</Label>
                </div>
              </div>

              <Button onClick={calculateCHADS2VASc} className="w-full">
                Calculate CHADS2-VASc Score
              </Button>

              {chadsResult && (
                <Card className={`border-l-4 ${chadsResult.color.replace('text-', 'border-l-')}`}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-3xl font-bold">Score: {chadsResult.score}</div>
                        <Badge className={`mt-2 ${chadsResult.color}`}>
                          {chadsResult.score === 0 ? 'Low Risk' : 
                           chadsResult.score === 1 ? 'Moderate Risk' : 
                           'High Risk'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 pt-2 border-t">{chadsResult.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* PERC Rule Calculator */}
            <TabsContent value="perc" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Wind className="w-4 h-4" />
                PERC Rule (Pulmonary Embolism)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perc-age">Age (years)</Label>
                  <Input
                    id="perc-age"
                    type="number"
                    placeholder="Enter age"
                    value={percAge}
                    onChange={(e) => setPercAge(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perc-hr">Heart Rate (bpm)</Label>
                  <Input
                    id="perc-hr"
                    type="number"
                    placeholder="Enter HR"
                    value={percHR}
                    onChange={(e) => setPercHR(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perc-o2">O2 Saturation (%)</Label>
                  <Input
                    id="perc-o2"
                    type="number"
                    placeholder="Enter O2 sat"
                    value={percO2Sat}
                    onChange={(e) => setPercO2Sat(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="perc-leg"
                    checked={percUnilateralLeg}
                    onChange={(e) => setPercUnilateralLeg(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="perc-leg" className="cursor-pointer">Unilateral leg swelling</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="perc-hemoptysis"
                    checked={percHemoptysis}
                    onChange={(e) => setPercHemoptysis(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="perc-hemoptysis" className="cursor-pointer">Hemoptysis</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="perc-surgery"
                    checked={percSurgery}
                    onChange={(e) => setPercSurgery(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="perc-surgery" className="cursor-pointer">Surgery/Trauma (≤4 weeks)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="perc-prior"
                    checked={percPriorPE}
                    onChange={(e) => setPercPriorPE(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="perc-prior" className="cursor-pointer">Prior PE/DVT</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="perc-hormone"
                    checked={percHormone}
                    onChange={(e) => setPercHormone(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="perc-hormone" className="cursor-pointer">Hormone use</Label>
                </div>
              </div>

              <Button onClick={calculatePERC} className="w-full">
                Calculate PERC Rule
              </Button>

              {percResult && (
                <Card className={`border-l-4 ${percResult.color.replace('text-', 'border-l-')}`}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold">Criteria: {percResult.criteria}/8</div>
                        <Badge className={`mt-2 ${percResult.color.replace('text-', 'bg-')}`}>
                          {percResult.criteria === 0 ? 'PERC Negative' : 'PERC Positive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 pt-2 border-t">{percResult.result}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* CURB-65 Calculator */}
            <TabsContent value="curb" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                CURB-65 (Pneumonia Severity)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="curb-confusion"
                    checked={curbConfusion}
                    onChange={(e) => setCurbConfusion(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="curb-confusion" className="cursor-pointer">Confusion</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="curb-urea">Urea (mmol/L)</Label>
                  <Input
                    id="curb-urea"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 7.0"
                    value={curbUrea}
                    onChange={(e) => setCurbUrea(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="curb-respiratory">Respiratory Rate (breaths/min)</Label>
                  <Input
                    id="curb-respiratory"
                    type="number"
                    placeholder="e.g., 30"
                    value={curbRespiratory}
                    onChange={(e) => setCurbRespiratory(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="curb-bp">Systolic BP (mmHg)</Label>
                  <Input
                    id="curb-bp"
                    type="number"
                    placeholder="e.g., 90"
                    value={curbBP}
                    onChange={(e) => setCurbBP(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="curb-age">Age (years)</Label>
                  <Input
                    id="curb-age"
                    type="number"
                    placeholder="Enter age"
                    value={curbAge}
                    onChange={(e) => setCurbAge(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={calculateCURB65} className="w-full">
                Calculate CURB-65 Score
              </Button>

              {curbResult && (
                <Card className={`border-l-4 ${curbResult.color.replace('text-', 'border-l-')}`}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-3xl font-bold">Score: {curbResult.score}/5</div>
                        <Badge className={`mt-2 ${curbResult.color.replace('text-', 'bg-')}`}>
                          {curbResult.risk} Risk
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 pt-2 border-t">{curbResult.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Corrected Calcium Calculator */}
            <TabsContent value="calcium" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Corrected Calcium Calculator
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calc-calcium">Total Calcium (mg/dL)</Label>
                  <Input
                    id="calc-calcium"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 10.0"
                    value={calcCalcium}
                    onChange={(e) => setCalcCalcium(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calc-albumin">Albumin (g/dL)</Label>
                  <Input
                    id="calc-albumin"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 4.0"
                    value={calcAlbumin}
                    onChange={(e) => setCalcAlbumin(e.target.value)}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500">Formula: Corrected Ca = Total Ca + 0.8 × (4 - Albumin)</p>

              <Button onClick={calculateCorrectedCalcium} className="w-full">
                Calculate Corrected Calcium
              </Button>

              {calcResult !== null && (
                <Card className={`border-l-4 ${
                  calcResult < 8.5 ? 'border-l-red-500' : 
                  calcResult > 10.5 ? 'border-l-yellow-500' : 
                  'border-l-green-500'
                }`}>
                  <CardContent className="pt-4">
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold">{calcResult} mg/dL</div>
                      <Badge className={
                        calcResult < 8.5 ? 'bg-red-500' : 
                        calcResult > 10.5 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }>
                        {calcResult < 8.5 ? 'Hypocalcemia' : 
                         calcResult > 10.5 ? 'Hypercalcemia' : 
                         'Normal'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-2">
                        Normal range: 8.5-10.5 mg/dL
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Ideal Body Weight Calculator */}
            <TabsContent value="ibw" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Ideal Body Weight (IBW) Calculator
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ibw-height">Height (cm)</Label>
                  <Input
                    id="ibw-height"
                    type="number"
                    placeholder="Enter height in cm"
                    value={ibwHeight}
                    onChange={(e) => setIbwHeight(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ibw-sex">Sex</Label>
                  <Select value={ibwSex} onValueChange={setIbwSex}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-xs text-gray-500">Using Devine formula</p>

              <Button onClick={calculateIBW} className="w-full">
                Calculate IBW
              </Button>

              {ibwResult !== null && (
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold">{ibwResult} kg</div>
                      <p className="text-sm text-gray-600">Ideal Body Weight</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Used for medication dosing and nutritional assessment
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Maintenance Fluid Calculator */}
            <TabsContent value="maint" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Syringe className="w-4 h-4" />
                Maintenance Fluid Calculator
              </h3>

              <div className="space-y-2">
                <Label htmlFor="maint-weight">Weight (kg)</Label>
                <Input
                  id="maint-weight"
                  type="number"
                  step="0.1"
                  placeholder="Enter weight in kg"
                  value={maintWeight}
                  onChange={(e) => setMaintWeight(e.target.value)}
                />
              </div>

              <p className="text-xs text-gray-500">Using Holliday-Segar formula</p>

              <Button onClick={calculateMaintenanceFluid} className="w-full">
                Calculate Maintenance Fluid
              </Button>

              {maintResult && (
                <Card className="border-l-4 border-l-cyan-500">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{maintResult.daily} mL/day</div>
                        <p className="text-sm text-gray-600 mt-2">Hourly: {maintResult.hourly} mL/hr</p>
                      </div>
                      <p className="text-xs text-gray-500 pt-2 border-t">
                        For weight ≤20 kg: 4 mL/kg/hr<br/>
                        For weight &gt;20 kg: 1500 mL + 20 mL/kg for each kg &gt;20
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}