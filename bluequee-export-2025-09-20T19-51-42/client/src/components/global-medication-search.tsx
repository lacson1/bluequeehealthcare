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
  selectedMedications?: string[];
  onMedicationsChange?: (medications: string[]) => void;
  onMedicationSelect?: (medication: Medication) => void;
  label?: string;
  placeholder?: string;
  maxHeight?: string;
  allowCustomMedications?: boolean;
}

export function GlobalMedicationSearch({
  selectedMedications = [],
  onMedicationsChange,
  onMedicationSelect,
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

  // Use the medications directly from the API (already filtered server-side)
  const filteredMedications = medications;

  const addMedication = (medicationName: string, medication?: Medication) => {
    // If onMedicationSelect is provided, use it (for single medication selection)
    if (onMedicationSelect && medication) {
      onMedicationSelect(medication);
      setSearchTerm('');
      setCustomMedication('');
      setIsPopoverOpen(false);
      return;
    }
    
    // Otherwise use the traditional multi-medication selection
    if (medicationName && onMedicationsChange && selectedMedications && !selectedMedications.includes(medicationName)) {
      const updatedMedications = [...selectedMedications, medicationName];
      onMedicationsChange(updatedMedications);
      setSearchTerm('');
      setCustomMedication('');
      setIsPopoverOpen(false);
    }
  };

  const removeMedication = (medicationName: string) => {
    if (onMedicationsChange && selectedMedications) {
      const updatedMedications = selectedMedications.filter(med => med !== medicationName);
      onMedicationsChange(updatedMedications);
    }
  };

  const addCustomMedication = () => {
    if (customMedication.trim() && selectedMedications && !selectedMedications.includes(customMedication.trim())) {
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
                        onSelect={() => addMedication(medication.name, medication)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedMedications && selectedMedications.includes(medication.name) 
                              ? "opacity-100" 
                              : "opacity-0"
                          }`}
                        />
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <Pill className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">{medication.name}</span>
                              {medication.strength && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {medication.strength}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {medication.genericName && (
                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                  Generic: {medication.genericName}
                                </span>
                              )}
                              {medication.category && (
                                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                  {medication.category}
                                </span>
                              )}
                              {medication.form && (
                                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                  {medication.form}
                                </span>
                              )}
                            </div>
                            {medication.description && (
                              <span className="text-xs text-gray-500 mt-1 truncate">
                                {medication.description}
                              </span>
                            )}
                          </div>
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

      {/* Selected medications display - only show for multi-selection mode */}
      {selectedMedications && selectedMedications.length > 0 && onMedicationsChange && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">
              Selected Medications
            </Label>
            <Badge variant="secondary" className="text-xs">
              {selectedMedications.length} item{selectedMedications.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            {selectedMedications.map((medication, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between bg-white rounded-md p-3 border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Pill className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="font-medium text-gray-900">{medication}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                  onClick={() => removeMedication(medication)}
                  type="button"
                  title="Remove medication"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
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