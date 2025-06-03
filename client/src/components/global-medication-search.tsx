import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check, Plus, X, Search, Pill } from 'lucide-react';

interface Medication {
  id: number;
  name: string;
  genericName?: string;
  description?: string;
  category?: string;
  strength?: string;
  form?: string;
}

interface GlobalMedicationSearchProps {
  selectedMedications: string[];
  onMedicationsChange: (medications: string[]) => void;
  label?: string;
  placeholder?: string;
  maxHeight?: string;
  allowCustomMedications?: boolean;
}

export function GlobalMedicationSearch({
  selectedMedications,
  onMedicationsChange,
  label = "Medications",
  placeholder = "Search and select medications...",
  maxHeight = "200px",
  allowCustomMedications = true
}: GlobalMedicationSearchProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customMedication, setCustomMedication] = useState('');

  // Fetch medications from the search API with intelligent filtering
  const { data: medications = [], isLoading: medicationsLoading } = useQuery({
    queryKey: ['/api/medicines/search', searchTerm],
    enabled: searchTerm.length > 0,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  // Use the filtered medications directly from the API
  const filteredMedications = medications.filter((medication: Medication) => {
    return (
      medication.name.toLowerCase().includes(searchLower) ||
      (medication.genericName && medication.genericName.toLowerCase().includes(searchLower)) ||
      (medication.description && medication.description.toLowerCase().includes(searchLower)) ||
      (medication.category && medication.category.toLowerCase().includes(searchLower))
    );
  });

  const addMedication = (medicationName: string) => {
    if (medicationName && !selectedMedications.includes(medicationName)) {
      const updatedMedications = [...selectedMedications, medicationName];
      onMedicationsChange(updatedMedications);
      setSearchTerm('');
      setCustomMedication('');
      setIsPopoverOpen(false);
    }
  };

  const removeMedication = (medicationName: string) => {
    const updatedMedications = selectedMedications.filter(med => med !== medicationName);
    onMedicationsChange(updatedMedications);
  };

  const addCustomMedication = () => {
    if (customMedication.trim() && !selectedMedications.includes(customMedication.trim())) {
      addMedication(customMedication.trim());
    }
  };

  // Clear search when popover closes
  useEffect(() => {
    if (!isPopoverOpen) {
      setSearchTerm('');
    }
  }, [isPopoverOpen]);

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2 text-sm font-medium">
        <Pill className="h-4 w-4" />
        {label}
      </Label>
      
      {/* Main medication search */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isPopoverOpen}
                className="w-full justify-between h-10"
                disabled={medicationsLoading}
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 opacity-50" />
                  <span className="text-muted-foreground">
                    {medicationsLoading ? "Loading medications..." : placeholder}
                  </span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Type to search medications..." 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList style={{ maxHeight }}>
                  <CommandEmpty>
                    {searchTerm ? 
                      `No medications found matching "${searchTerm}"` : 
                      "Start typing to search medications"
                    }
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredMedications.slice(0, 50).map((medication: Medication) => (
                      <CommandItem
                        key={medication.id}
                        value={medication.name}
                        onSelect={() => addMedication(medication.name)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedMedications.includes(medication.name) 
                              ? "opacity-100" 
                              : "opacity-0"
                          }`}
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{medication.name}</span>
                            {medication.strength && (
                              <Badge variant="secondary" className="text-xs">
                                {medication.strength}
                              </Badge>
                            )}
                          </div>
                          {medication.genericName && (
                            <span className="text-sm text-muted-foreground truncate">
                              Generic: {medication.genericName}
                            </span>
                          )}
                          {medication.description && (
                            <span className="text-xs text-muted-foreground truncate">
                              {medication.description}
                            </span>
                          )}
                          {medication.category && (
                            <span className="text-xs text-muted-foreground">
                              Category: {medication.category}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Custom medication input */}
      {allowCustomMedications && (
        <div className="flex gap-2">
          <Input
            placeholder="Or enter a custom medication name..."
            value={customMedication}
            onChange={(e) => setCustomMedication(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomMedication();
              }
            }}
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={addCustomMedication}
            size="sm"
            variant="outline"
            disabled={!customMedication.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Selected medications display */}
      {selectedMedications.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Selected medications ({selectedMedications.length}):
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedMedications.map((medication, index) => (
              <Badge 
                key={index} 
                variant="default" 
                className="flex items-center gap-1 pr-1"
              >
                <span className="truncate max-w-[200px]">{medication}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeMedication(medication)}
                  type="button"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      {medications.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {medications.length} medications available in database
        </div>
      )}
    </div>
  );
}