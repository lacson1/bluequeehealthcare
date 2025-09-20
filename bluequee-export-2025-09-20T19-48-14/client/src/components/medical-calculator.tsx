import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calculator, Heart, Pill, Activity, User } from 'lucide-react';

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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
              <TabsTrigger value="bmi" className="text-xs md:text-sm">BMI</TabsTrigger>
              <TabsTrigger value="dosage" className="text-xs md:text-sm">Dosage</TabsTrigger>
              <TabsTrigger value="bsa" className="text-xs md:text-sm">BSA</TabsTrigger>
              <TabsTrigger value="heart" className="text-xs md:text-sm">Heart Rate</TabsTrigger>
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
                  <Select value={medication} onValueChange={setMedication}>
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}