import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Pill, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Medication {
  id: number;
  name: string;
  genericName: string | null;
  brandName: string | null;
  category: string | null;
  dosageForm: string | null;
  strength: string | null;
  dosageAdult: string | null;
  dosageChild: string | null;
  frequency: string | null;
  indications: string | null;
  contraindications: string | null;
  sideEffects: string | null;
  routeOfAdministration: string | null;
  costPerUnit: string | null;
}

interface MedicationAutocompleteProps {
  value: Medication | null;
  onSelect: (medication: Medication) => void;
  onAutoFill: (medication: Medication) => void;
  onManualEntry?: (medicationName: string) => void;
  placeholder?: string;
  className?: string;
}

export default function MedicationAutocomplete({
  value,
  onSelect,
  onAutoFill,
  onManualEntry,
  placeholder = "Search medications...",
  className,
}: MedicationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch medication suggestions from comprehensive database
  const { data: medications = [] } = useQuery<Medication[]>({
    queryKey: ["/api/suggestions/medications", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await fetch(`/api/suggestions/medications?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Failed to fetch medication suggestions");
      return response.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const handleSelect = (medication: Medication) => {
    onSelect(medication);
    onAutoFill(medication); // Trigger auto-fill for dosage and instructions
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-blue-500" />
            {value ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{value.name}</span>
                {value.strength && (
                  <Badge variant="secondary" className="text-xs">
                    {value.strength}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-slate-500">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Type medication name, generic name, or brand..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Pill className="h-8 w-8 text-slate-400" />
              <p className="text-sm text-slate-600">No medications found</p>
              <p className="text-xs text-slate-500">
                Try searching by generic name, brand name, or category
              </p>
              {searchQuery && searchQuery.length >= 2 && onManualEntry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onManualEntry(searchQuery);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="mt-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  Add "{searchQuery}" manually
                </Button>
              )}
            </div>
          </CommandEmpty>
          <CommandList>
            {medications.length > 0 && (
              <CommandGroup heading="Medications">
                {medications.map((medication) => (
                  <CommandItem
                    key={medication.id}
                    value={medication.name}
                    onSelect={() => handleSelect(medication)}
                    className="flex flex-col items-start gap-2 p-3"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value?.id === medication.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">
                              {medication.name}
                            </span>
                            {medication.strength && (
                              <Badge variant="outline" className="text-xs">
                                {medication.strength}
                              </Badge>
                            )}
                          </div>
                          {medication.genericName && medication.genericName !== medication.name && (
                            <span className="text-xs text-slate-600">
                              Generic: {medication.genericName}
                            </span>
                          )}
                        </div>
                      </div>
                      {medication.category && (
                        <Badge variant="secondary" className="text-xs">
                          {medication.category}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Medication Details */}
                    <div className="w-full text-xs text-slate-600 space-y-1">
                      {medication.dosageForm && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Form:</span>
                          <span>{medication.dosageForm}</span>
                        </div>
                      )}
                      {medication.dosageAdult && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Adult Dose:</span>
                          <span>{medication.dosageAdult}</span>
                        </div>
                      )}
                      {medication.frequency && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Frequency:</span>
                          <span>{medication.frequency}</span>
                        </div>
                      )}
                      {medication.indications && (
                        <div className="flex items-start gap-1">
                          <Info className="h-3 w-3 mt-0.5 text-blue-500" />
                          <span className="text-blue-700">
                            {medication.indications.length > 60 
                              ? `${medication.indications.substring(0, 60)}...` 
                              : medication.indications}
                          </span>
                        </div>
                      )}
                      {medication.contraindications && (
                        <div className="flex items-start gap-1">
                          <AlertTriangle className="h-3 w-3 mt-0.5 text-red-500" />
                          <span className="text-red-700">
                            {medication.contraindications.length > 60 
                              ? `${medication.contraindications.substring(0, 60)}...` 
                              : medication.contraindications}
                          </span>
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}