import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Check, X } from 'lucide-react';

interface SmartFormFieldProps {
  name: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
}

// Smart suggestions based on field names and medical context
const getMedicalSuggestions = (fieldName: string, currentValue: string): string[] => {
  const lowerFieldName = fieldName.toLowerCase();
  const lowerValue = currentValue.toLowerCase();
  
  // Blood pressure suggestions
  if (lowerFieldName.includes('blood pressure') || lowerFieldName.includes('bp')) {
    return ['120/80 mmHg', '110/70 mmHg', '130/85 mmHg', '140/90 mmHg'].filter(s => 
      s.toLowerCase().includes(lowerValue)
    );
  }
  
  // Pulse/Heart rate suggestions
  if (lowerFieldName.includes('pulse') || lowerFieldName.includes('heart rate')) {
    return ['72 bpm', '80 bpm', '68 bpm', '85 bpm', '90 bpm'].filter(s => 
      s.toLowerCase().includes(lowerValue)
    );
  }
  
  // Temperature suggestions
  if (lowerFieldName.includes('temperature') || lowerFieldName.includes('temp')) {
    return ['36.5°C', '37.0°C', '36.8°C', '37.2°C', '38.0°C'].filter(s => 
      s.toLowerCase().includes(lowerValue)
    );
  }
  
  // Blood group suggestions
  if (lowerFieldName.includes('blood group') || lowerFieldName.includes('blood type')) {
    return ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].filter(s => 
      s.toLowerCase().includes(lowerValue)
    );
  }
  
  // Genotype suggestions
  if (lowerFieldName.includes('genotype')) {
    return ['AA', 'AS', 'SS', 'AC', 'SC'].filter(s => 
      s.toLowerCase().includes(lowerValue)
    );
  }
  
  // Common diagnosis suggestions
  if (lowerFieldName.includes('diagnosis')) {
    const diagnoses = [
      'Hypertension', 'Diabetes Mellitus', 'Malaria', 'Typhoid fever',
      'Upper respiratory tract infection', 'Gastroenteritis', 'Anemia',
      'Pregnancy-related complications', 'Normal pregnancy', 'Pre-eclampsia'
    ];
    return diagnoses.filter(d => d.toLowerCase().includes(lowerValue));
  }
  
  // Treatment plan suggestions
  if (lowerFieldName.includes('treatment') || lowerFieldName.includes('management')) {
    const treatments = [
      'Lifestyle modification and diet control',
      'Antihypertensive medication as prescribed',
      'Complete rest and adequate hydration',
      'Follow-up in 2 weeks',
      'Continue current medication',
      'Refer to specialist if symptoms persist'
    ];
    return treatments.filter(t => t.toLowerCase().includes(lowerValue));
  }
  
  // Occupation suggestions
  if (lowerFieldName.includes('occupation')) {
    const occupations = [
      'Teacher', 'Trader', 'Student', 'Civil servant', 'Farmer',
      'Nurse', 'Doctor', 'Engineer', 'Lawyer', 'Housewife'
    ];
    return occupations.filter(o => o.toLowerCase().includes(lowerValue));
  }
  
  return [];
};

// Auto-correct common medical terms
const autoCorrectMedicalTerms = (value: string): string => {
  const corrections: Record<string, string> = {
    'hypertention': 'hypertension',
    'diabetis': 'diabetes',
    'malria': 'malaria',
    'typoid': 'typhoid',
    'pregnacy': 'pregnancy',
    'medicaton': 'medication',
    'presure': 'pressure',
    'temprature': 'temperature',
    'respiration': 'respiratory',
    'anemia': 'anaemia'
  };
  
  let correctedValue = value;
  Object.entries(corrections).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    correctedValue = correctedValue.replace(regex, correct);
  });
  
  return correctedValue;
};

export default function SmartFormField({
  name,
  type,
  value,
  onChange,
  placeholder,
  required,
  label
}: SmartFormFieldProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAutoCorrect, setShowAutoCorrect] = useState(false);
  const [correctedValue, setCorrectedValue] = useState('');

  useEffect(() => {
    if (value.length > 1) {
      const medicalSuggestions = getMedicalSuggestions(name, value);
      setSuggestions(medicalSuggestions);
      setShowSuggestions(medicalSuggestions.length > 0);
      
      // Check for auto-correct suggestions
      const corrected = autoCorrectMedicalTerms(value);
      if (corrected !== value) {
        setCorrectedValue(corrected);
        setShowAutoCorrect(true);
      } else {
        setShowAutoCorrect(false);
      }
    } else {
      setShowSuggestions(false);
      setShowAutoCorrect(false);
    }
  }, [value, name]);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const handleAutoCorrectAccept = () => {
    onChange(correctedValue);
    setShowAutoCorrect(false);
  };

  const handleAutoCorrectReject = () => {
    setShowAutoCorrect(false);
  };

  const renderField = () => {
    const commonProps = {
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        onChange(e.target.value),
      placeholder,
      className: "w-full"
    };

    if (type === 'textarea') {
      return <Textarea {...commonProps} />;
    }
    
    return <Input {...commonProps} type={type} />;
  };

  return (
    <div className="relative space-y-2">
      {label && (
        <label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {renderField()}
      
      {/* Auto-correct suggestion */}
      {showAutoCorrect && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Did you mean: <strong>{correctedValue}</strong>?
              </span>
              <div className="flex gap-1 ml-auto">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAutoCorrectAccept}
                  className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAutoCorrectReject}
                  className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Smart suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-green-700 mr-2">Suggestions:</span>
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-green-200 bg-green-100 text-green-800"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}