import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutocompleteOption {
  value: string;
  label: string;
  category?: string;
  description?: string;
  frequency?: number;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fieldType: "name" | "address" | "occupation" | "diagnosis" | "symptoms" | "allergies" | "medication" | "location" | "phone" | "email";
  organizationId?: number;
  className?: string;
  disabled?: boolean;
}

// Healthcare-specific autocomplete suggestions
const getHealthcareSuggestions = (fieldType: string): AutocompleteOption[] => {
  switch (fieldType) {
    case "occupation":
      return [
        { value: "Teacher", label: "Teacher", category: "Education" },
        { value: "Doctor", label: "Doctor", category: "Healthcare" },
        { value: "Nurse", label: "Nurse", category: "Healthcare" },
        { value: "Engineer", label: "Engineer", category: "Technology" },
        { value: "Trader", label: "Trader", category: "Business" },
        { value: "Student", label: "Student", category: "Education" },
        { value: "Farmer", label: "Farmer", category: "Agriculture" },
        { value: "Driver", label: "Driver", category: "Transportation" },
        { value: "Accountant", label: "Accountant", category: "Finance" },
        { value: "Civil Servant", label: "Civil Servant", category: "Government" },
        { value: "Business Owner", label: "Business Owner", category: "Business" },
        { value: "Retired", label: "Retired", category: "Other" },
      ];
    
    case "diagnosis":
      return [
        { value: "Hypertension", label: "Hypertension", category: "Cardiovascular", description: "High blood pressure" },
        { value: "Type 2 Diabetes", label: "Type 2 Diabetes", category: "Endocrine", description: "Diabetes mellitus" },
        { value: "Malaria", label: "Malaria", category: "Infectious", description: "Parasitic infection" },
        { value: "Upper Respiratory Tract Infection", label: "Upper Respiratory Tract Infection", category: "Respiratory", description: "Common cold/flu" },
        { value: "Gastroenteritis", label: "Gastroenteritis", category: "Gastrointestinal", description: "Stomach/intestinal inflammation" },
        { value: "Pneumonia", label: "Pneumonia", category: "Respiratory", description: "Lung infection" },
        { value: "Typhoid Fever", label: "Typhoid Fever", category: "Infectious", description: "Bacterial infection" },
        { value: "Asthma", label: "Asthma", category: "Respiratory", description: "Chronic airway disease" },
        { value: "Urinary Tract Infection", label: "Urinary Tract Infection", category: "Genitourinary", description: "UTI" },
        { value: "Headache", label: "Headache", category: "Neurological", description: "Primary headache disorder" },
      ];

    case "symptoms":
      return [
        { value: "Fever", label: "Fever", category: "General", description: "Elevated body temperature" },
        { value: "Cough", label: "Cough", category: "Respiratory", description: "Persistent coughing" },
        { value: "Shortness of breath", label: "Shortness of breath", category: "Respiratory", description: "Difficulty breathing" },
        { value: "Chest pain", label: "Chest pain", category: "Cardiovascular", description: "Pain in chest area" },
        { value: "Abdominal pain", label: "Abdominal pain", category: "Gastrointestinal", description: "Stomach pain" },
        { value: "Nausea", label: "Nausea", category: "Gastrointestinal", description: "Feeling sick" },
        { value: "Vomiting", label: "Vomiting", category: "Gastrointestinal", description: "Being sick" },
        { value: "Diarrhea", label: "Diarrhea", category: "Gastrointestinal", description: "Loose stools" },
        { value: "Fatigue", label: "Fatigue", category: "General", description: "Extreme tiredness" },
        { value: "Joint pain", label: "Joint pain", category: "Musculoskeletal", description: "Pain in joints" },
      ];

    case "allergies":
      return [
        { value: "Penicillin", label: "Penicillin", category: "Medication", description: "Antibiotic allergy" },
        { value: "Sulfa drugs", label: "Sulfa drugs", category: "Medication", description: "Sulfonamide allergy" },
        { value: "Aspirin", label: "Aspirin", category: "Medication", description: "NSAID allergy" },
        { value: "Peanuts", label: "Peanuts", category: "Food", description: "Nut allergy" },
        { value: "Shellfish", label: "Shellfish", category: "Food", description: "Seafood allergy" },
        { value: "Eggs", label: "Eggs", category: "Food", description: "Egg protein allergy" },
        { value: "Latex", label: "Latex", category: "Environmental", description: "Rubber allergy" },
        { value: "Dust mites", label: "Dust mites", category: "Environmental", description: "Environmental allergy" },
        { value: "Pollen", label: "Pollen", category: "Environmental", description: "Seasonal allergy" },
        { value: "No known allergies", label: "No known allergies", category: "None", description: "No allergies reported" },
      ];

    case "location":
      return [
        { value: "Lagos", label: "Lagos", category: "State", description: "Lagos State" },
        { value: "Abuja", label: "Abuja", category: "FCT", description: "Federal Capital Territory" },
        { value: "Kano", label: "Kano", category: "State", description: "Kano State" },
        { value: "Port Harcourt", label: "Port Harcourt", category: "State", description: "Rivers State" },
        { value: "Ibadan", label: "Ibadan", category: "State", description: "Oyo State" },
        { value: "Kaduna", label: "Kaduna", category: "State", description: "Kaduna State" },
        { value: "Benin City", label: "Benin City", category: "State", description: "Edo State" },
        { value: "Jos", label: "Jos", category: "State", description: "Plateau State" },
        { value: "Ilorin", label: "Ilorin", category: "State", description: "Kwara State" },
        { value: "Enugu", label: "Enugu", category: "State", description: "Enugu State" },
      ];

    default:
      return [];
  }
};

export function AutocompleteInput({
  value,
  onChange,
  placeholder,
  fieldType,
  organizationId,
  className,
  disabled = false,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteOption[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<AutocompleteOption[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch historical data for autocomplete suggestions
  const { data: historicalData } = useQuery({
    queryKey: [`/api/autocomplete/${fieldType}`, organizationId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/autocomplete/${fieldType}${organizationId ? `?organizationId=${organizationId}` : ''}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log(`Could not fetch historical data for ${fieldType}:`, error);
      }
      return [];
    },
    enabled: !!fieldType,
  });

  // Combine healthcare suggestions with historical data
  useEffect(() => {
    const healthcareSuggestions = getHealthcareSuggestions(fieldType);
    const historical = (historicalData || []).map((item: any) => ({
      value: item.value,
      label: item.value,
      category: "Recent",
      frequency: item.frequency || 1,
    }));

    // Merge and deduplicate suggestions
    const combined = [...healthcareSuggestions, ...historical];
    const unique = combined.reduce((acc: AutocompleteOption[], current) => {
      if (!acc.find(item => item.value.toLowerCase() === current.value.toLowerCase())) {
        acc.push(current);
      }
      return acc;
    }, []);

    // Sort by frequency and relevance
    unique.sort((a, b) => {
      if (a.frequency && b.frequency) {
        return b.frequency - a.frequency;
      }
      if (a.frequency) return -1;
      if (b.frequency) return 1;
      return a.label.localeCompare(b.label);
    });

    setSuggestions(unique);
  }, [fieldType, historicalData]);

  // Filter suggestions based on input value
  useEffect(() => {
    if (!value.trim()) {
      setFilteredSuggestions(suggestions.slice(0, 8)); // Show top 8 when empty
      return;
    }

    const filtered = suggestions.filter(suggestion =>
      suggestion.label.toLowerCase().includes(value.toLowerCase()) ||
      suggestion.value.toLowerCase().includes(value.toLowerCase()) ||
      (suggestion.description && suggestion.description.toLowerCase().includes(value.toLowerCase()))
    );

    setFilteredSuggestions(filtered.slice(0, 10)); // Show top 10 matches
  }, [value, suggestions]);

  const handleSuggestionSelect = (suggestion: AutocompleteOption) => {
    onChange(suggestion.value);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    if (newValue.length > 0) {
      setOpen(true);
    }
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200",
                className
              )}
              disabled={disabled}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                setTimeout(() => setOpen(false), 200);
              }}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {filteredSuggestions.length > 0 && (
                <Sparkles className="h-3 w-3 text-blue-500" />
              )}
              <Search className="h-3 w-3 text-gray-400" />
            </div>
          </div>
        </PopoverTrigger>
        
        {filteredSuggestions.length > 0 && (
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandList>
                {filteredSuggestions.length === 0 ? (
                  <CommandEmpty>No suggestions found.</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filteredSuggestions.map((suggestion, index) => (
                      <CommandItem
                        key={`${suggestion.value}-${index}`}
                        onSelect={() => handleSuggestionSelect(suggestion)}
                        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{suggestion.label}</span>
                            {suggestion.category && (
                              <Badge variant="outline" className="text-xs">
                                {suggestion.category}
                              </Badge>
                            )}
                            {suggestion.frequency && suggestion.frequency > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                Used {suggestion.frequency}x
                              </Badge>
                            )}
                          </div>
                          {suggestion.description && (
                            <p className="text-xs text-gray-500 mt-1">{suggestion.description}</p>
                          )}
                        </div>
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4",
                            value === suggestion.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
      
      {filteredSuggestions.length > 0 && value.length > 0 && (
        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          {filteredSuggestions.length} suggestion{filteredSuggestions.length !== 1 ? 's' : ''} available
        </p>
      )}
    </div>
  );
}