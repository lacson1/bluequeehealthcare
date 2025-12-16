import { useState, useEffect, useRef } from "react";
import { Search, Pill, Clock, Database, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Medication {
  id: number;
  name: string;
  genericName?: string | null;
  brandName?: string | null;
  category?: string | null;
  dosageForm?: string | null;
  strength?: string | null;
  manufacturer?: string | null;
  description?: string | null;
  dosageAdult?: string | null;
  frequency?: string | null;
  isActive?: boolean | null;
}

interface QuickMedicationSearchProps {
  onSelect?: (medication: Medication) => void;
  onSearchChange?: (query: string) => void;
  placeholder?: string;
  showDetails?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function QuickMedicationSearch({ 
  onSelect,
  onSearchChange,
  placeholder = "Search medications...",
  showDetails = true,
  className,
  autoFocus = false
}: QuickMedicationSearchProps) {
  const [query, setQuery] = useState("");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setMedications([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        console.log(`[MedicationSearch] Searching for: "${query.trim()}"`);
        const response = await fetch(`/api/suggestions/medications?q=${encodeURIComponent(query.trim())}`, {
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Use secure session cookies
        });
        
        console.log(`[MedicationSearch] Response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[MedicationSearch] Found ${data.length} medications:`, data.map((m: any) => m.name));
          setMedications(data.slice(0, 8)); // Limit to 8 results for quick search
          setIsOpen(true);
          setSelectedIndex(-1);
        } else {
          console.error(`[MedicationSearch] API error: ${response.status} ${response.statusText}`);
          setMedications([]);
        }
      } catch (error) {
        console.error('[MedicationSearch] Failed to search medications:', error);
        setMedications([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || medications.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < medications.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : medications.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleSelect(medications[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, medications, selectedIndex]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (medication: Medication) => {
    setQuery(medication.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect?.(medication);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-blue-100 text-blue-900 rounded px-1">
          {part}
        </mark>
      ) : part
    );
  };

  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-gray-100 text-gray-700";
    
    const colors: Record<string, string> = {
      'Antibiotic': 'bg-red-100 text-red-700',
      'Analgesic': 'bg-blue-100 text-blue-700',
      'Antihypertensive': 'bg-green-100 text-green-700',
      'Antihistamine': 'bg-purple-100 text-purple-700',
      'Vitamin': 'bg-yellow-100 text-yellow-700',
      'Antifungal': 'bg-orange-100 text-orange-700',
      'Cardiovascular': 'bg-pink-100 text-pink-700',
    };
    
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            const newQuery = e.target.value;
            setQuery(newQuery);
            onSearchChange?.(newQuery);
          }}
          onFocus={() => {
            if (medications.length > 0) setIsOpen(true);
          }}
          className="pl-10 pr-4 h-11 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {isOpen && medications.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-auto shadow-lg border border-gray-200">
          <CardContent className="p-0">
            <div ref={listRef}>
              {medications.map((medication, index) => (
                <div
                  key={medication.id}
                  className={cn(
                    "px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-blue-50",
                    index === selectedIndex && "bg-blue-50",
                    index === medications.length - 1 && "border-b-0"
                  )}
                  onClick={() => handleSelect(medication)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="font-semibold text-gray-900 text-sm leading-snug">
                          {highlightText(medication.name, query)}
                        </span>
                        <Database className="h-3 w-3 text-green-500" />
                      </div>
                      
                      {/* Always show dosage and frequency information */}
                      <div className="mb-2">
                        {(medication.dosageAdult || medication.frequency) && (
                          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded text-xs">
                            {medication.dosageAdult && (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-blue-700">Dose:</span>
                                <span className="font-medium text-slate-800">{medication.dosageAdult}</span>
                              </div>
                            )}
                            {medication.frequency && (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-green-700">Frequency:</span>
                                <span className="font-medium text-slate-800">{medication.frequency}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {showDetails && (
                        <div className="space-y-1">
                          {medication.genericName && medication.genericName !== medication.name && (
                            <p className="text-xs text-gray-600">
                              Generic: {highlightText(medication.genericName, query)}
                            </p>
                          )}
                          
                          {medication.brandName && medication.brandName !== medication.name && (
                            <p className="text-xs text-gray-600">
                              Brand: {highlightText(medication.brandName, query)}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            {medication.category && (
                              <Badge 
                                variant="secondary" 
                                className={cn("text-xs", getCategoryColor(medication.category))}
                              >
                                {medication.category}
                              </Badge>
                            )}
                            
                            {medication.dosageForm && (
                              <Badge variant="outline" className="text-xs">
                                {medication.dosageForm}
                              </Badge>
                            )}
                            
                            {medication.strength && (
                              <Badge variant="outline" className="text-xs">
                                {medication.strength}
                              </Badge>
                            )}
                          </div>
                          
                          {medication.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {medication.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {medications.length === 8 && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Showing first 8 results. Refine your search for more specific results.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isOpen && query.trim().length >= 2 && medications.length === 0 && !isLoading && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg border border-gray-200">
          <CardContent className="p-4 text-center">
            <Pill className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-base text-gray-600 mb-1">No medications found</p>
            <p className="text-sm text-gray-400">
              Try searching with different terms or check spelling
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}