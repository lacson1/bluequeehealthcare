import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Pill, Activity, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Common diagnosis suggestions for Southwest Nigeria clinics
const COMMON_DIAGNOSES = [
  "Malaria",
  "Typhoid Fever", 
  "Hypertension",
  "Diabetes Mellitus",
  "Upper Respiratory Tract Infection",
  "Gastroenteritis",
  "Pneumonia",
  "Urinary Tract Infection",
  "Bronchitis",
  "Skin Infection",
  "Peptic Ulcer Disease",
  "Migraine",
  "Arthritis",
  "Anemia",
  "Asthma"
];

// Common symptoms for quick input
const COMMON_SYMPTOMS = [
  "Fever",
  "Headache",
  "Cough",
  "Abdominal pain",
  "Nausea and vomiting",
  "Diarrhea",
  "Body aches",
  "Fatigue",
  "Shortness of breath",
  "Chest pain",
  "Dizziness",
  "Loss of appetite",
  "Joint pain",
  "Skin rash",
  "Sore throat"
];

interface Medicine {
  id: number;
  name: string;
  defaultDosage?: string;
  defaultFrequency?: string;
  defaultDuration?: string;
  defaultInstructions?: string;
  commonConditions?: string;
}

interface DiagnosisAutocompleteProps {
  value?: string;
  onSelect: (diagnosis: string) => void;
  placeholder?: string;
  className?: string;
}

interface MedicationAutocompleteProps {
  value?: Medicine | null;
  onSelect: (medication: Medicine) => void;
  onAutoFill?: (medication: Medicine) => void;
  placeholder?: string;
  className?: string;
}

interface SymptomAutocompleteProps {
  value?: string;
  onSelect: (symptom: string) => void;
  placeholder?: string;
  className?: string;
}

export function DiagnosisAutocomplete({ 
  value = "", 
  onSelect, 
  placeholder = "Search diagnoses...",
  className 
}: DiagnosisAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDiagnoses = COMMON_DIAGNOSES.filter(diagnosis =>
    diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <div className="flex items-center">
            <Activity className="mr-2 h-4 w-4 text-blue-500" />
            {value || placeholder}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Command>
          <CommandInput 
            placeholder="Type to search diagnoses..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>No diagnosis found.</CommandEmpty>
          <CommandList>
            <CommandGroup heading="Common Diagnoses">
              {filteredDiagnoses.map((diagnosis) => (
                <CommandItem
                  key={diagnosis}
                  onSelect={() => {
                    onSelect(diagnosis);
                    setOpen(false);
                  }}
                  className="flex items-center"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === diagnosis ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Activity className="mr-2 h-4 w-4 text-blue-500" />
                  {diagnosis}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function MedicationAutocomplete({ 
  value, 
  onSelect, 
  onAutoFill,
  placeholder = "Search medications...",
  className 
}: MedicationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: medications = [] } = useQuery<Medicine[]>({
    queryKey: ['/api/medicines'],
    enabled: open
  });

  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (medication: Medicine) => {
    onSelect(medication);
    if (onAutoFill) {
      onAutoFill(medication);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between", className)}
          >
            <div className="flex items-center">
              <Pill className="mr-2 h-4 w-4 text-green-500" />
              {value?.name || placeholder}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0">
          <Command>
            <CommandInput 
              placeholder="Type to search medications..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandEmpty>No medication found.</CommandEmpty>
            <CommandList>
              <CommandGroup heading="Available Medications">
                {filteredMedications.map((medication) => (
                  <CommandItem
                    key={medication.id}
                    onSelect={() => handleSelect(medication)}
                    className="flex flex-col items-start py-3"
                  >
                    <div className="flex items-center w-full">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value?.id === medication.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Pill className="mr-2 h-4 w-4 text-green-500" />
                      <span className="font-medium">{medication.name}</span>
                    </div>
                    {(medication.defaultDosage || medication.defaultFrequency) && (
                      <div className="ml-8 mt-1 text-xs text-slate-500 flex flex-wrap gap-1">
                        {medication.defaultDosage && (
                          <Badge variant="outline" className="text-xs">
                            {medication.defaultDosage}
                          </Badge>
                        )}
                        {medication.defaultFrequency && (
                          <Badge variant="outline" className="text-xs">
                            {medication.defaultFrequency}
                          </Badge>
                        )}
                        {medication.defaultDuration && (
                          <Badge variant="outline" className="text-xs">
                            {medication.defaultDuration}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Auto-fill Preview */}
      {value && (value.defaultDosage || value.defaultFrequency || value.defaultInstructions) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-4 w-4 text-green-600 mr-2" />
            <span className="font-medium text-green-800">Auto-filled from pharmacy database:</span>
          </div>
          <div className="space-y-1 text-green-700">
            {value.defaultDosage && (
              <div><strong>Dosage:</strong> {value.defaultDosage}</div>
            )}
            {value.defaultFrequency && (
              <div><strong>Frequency:</strong> {value.defaultFrequency}</div>
            )}
            {value.defaultDuration && (
              <div><strong>Duration:</strong> {value.defaultDuration}</div>
            )}
            {value.defaultInstructions && (
              <div><strong>Instructions:</strong> {value.defaultInstructions}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SymptomAutocomplete({ 
  value = "", 
  onSelect, 
  placeholder = "Search symptoms...",
  className 
}: SymptomAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSymptoms = COMMON_SYMPTOMS.filter(symptom =>
    symptom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-4 w-4 text-orange-500" />
            {value || placeholder}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Command>
          <CommandInput 
            placeholder="Type to search symptoms..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>No symptom found.</CommandEmpty>
          <CommandList>
            <CommandGroup heading="Common Symptoms">
              {filteredSymptoms.map((symptom) => (
                <CommandItem
                  key={symptom}
                  onSelect={() => {
                    onSelect(symptom);
                    setOpen(false);
                  }}
                  className="flex items-center"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === symptom ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <AlertCircle className="mr-2 h-4 w-4 text-orange-500" />
                  {symptom}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}