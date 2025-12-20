import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Search, Clock, Star, X, Phone, Hash, CreditCard, User } from "lucide-react";
import { getDisplayName } from "@/utils/name-utils";
import type { Patient } from "@shared/schema";
import { Link } from "wouter";

interface EnhancedPatientSearchProps {
  value: string;
  onChange: (value: string) => void;
  onPatientSelect?: (patient: Patient) => void;
  autoFocus?: boolean;
  showRecentPatients?: boolean;
}

// Fuzzy search utility
function fuzzyMatch(text: string, query: string): { matches: boolean; score: number } {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match gets highest score
  if (textLower === queryLower) return { matches: true, score: 100 };
  if (textLower.includes(queryLower)) return { matches: true, score: 90 };
  
  // Fuzzy match - allows for typos
  let queryIdx = 0;
  let score = 0;
  let consecutiveMatches = 0;
  
  for (let i = 0; i < textLower.length && queryIdx < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIdx]) {
      queryIdx++;
      consecutiveMatches++;
      score += consecutiveMatches * 2; // Bonus for consecutive matches
    } else {
      consecutiveMatches = 0;
    }
  }
  
  const matches = queryIdx === queryLower.length;
  return { matches, score };
}

export function EnhancedPatientSearch({
  value,
  onChange,
  onPatientSelect,
  autoFocus = false,
  showRecentPatients = true
}: EnhancedPatientSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [searchMode, setSearchMode] = useState<'name' | 'phone' | 'id' | 'national_id'>('name');
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all patients for client-side fuzzy matching and recent/frequent display
  // Client-side filtering provides better UX with fuzzy matching and scoring
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get recent patients from localStorage
  const recentPatients = useMemo(() => {
    try {
      const stored = localStorage.getItem('recent-patients');
      if (!stored) return [];
      const ids: number[] = JSON.parse(stored);
      return ids
        .map(id => patients.find(p => p.id === id))
        .filter((p): p is Patient => p !== undefined)
        .slice(0, 5);
    } catch {
      return [];
    }
  }, [patients]);

  // Get frequent patients (most viewed)
  const frequentPatients = useMemo(() => {
    try {
      const stored = localStorage.getItem('patient-view-counts');
      if (!stored) return [];
      const counts: Record<string, number> = JSON.parse(stored);
      return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => patients.find(p => p.id === parseInt(id)))
        .filter((p): p is Patient => p !== undefined);
    } catch {
      return [];
    }
  }, [patients]);

  // Track patient views
  const trackPatientView = (patientId: number) => {
    try {
      // Update recent patients
      const stored = localStorage.getItem('recent-patients');
      const recent: number[] = stored ? JSON.parse(stored) : [];
      const updated = [patientId, ...recent.filter(id => id !== patientId)].slice(0, 10);
      localStorage.setItem('recent-patients', JSON.stringify(updated));

      // Update view counts
      const countsStored = localStorage.getItem('patient-view-counts');
      const counts: Record<string, number> = countsStored ? JSON.parse(countsStored) : {};
      counts[patientId.toString()] = (counts[patientId.toString()] || 0) + 1;
      localStorage.setItem('patient-view-counts', JSON.stringify(counts));
    } catch (error) {
      console.error('Error tracking patient view:', error);
    }
  };

  // Enhanced search with fuzzy matching
  const searchResults = useMemo(() => {
    if (!value.trim()) return [];

    const query = value.trim();
    const results: Array<{ patient: Patient; score: number; matchType: string }> = [];

    patients.forEach(patient => {
      let score = 0;
      let matchType = '';

      if (searchMode === 'phone') {
        if (patient.phone?.includes(query)) {
          score = 100;
          matchType = 'Phone';
        }
      } else if (searchMode === 'id') {
        if (patient.id.toString() === query || patient.id.toString().includes(query)) {
          score = 100;
          matchType = 'Patient ID';
        }
      } else if (searchMode === 'national_id') {
        if (patient.nationalId?.includes(query)) {
          score = 100;
          matchType = 'National ID';
        }
      } else {
        // Name search with fuzzy matching
        const fullName = getDisplayName(patient);
        const nameMatch = fuzzyMatch(fullName, query);
        
        if (nameMatch.matches) {
          score = nameMatch.score;
          matchType = 'Name';
        }

        // Also check phone and email
        if (patient.phone?.includes(query)) {
          score = Math.max(score, 85);
          matchType = score === 85 ? 'Phone' : matchType;
        }
        if (patient.email?.toLowerCase().includes(query.toLowerCase())) {
          score = Math.max(score, 80);
          matchType = score === 80 ? 'Email' : matchType;
        }
        if (patient.nationalId?.includes(query)) {
          score = Math.max(score, 90);
          matchType = score === 90 ? 'National ID' : matchType;
        }
      }

      if (score > 0) {
        results.push({ patient, score, matchType });
      }
    });

    return results.sort((a, b) => b.score - a.score).slice(0, 10);
  }, [value, patients, searchMode]);

  const handlePatientClick = (patient: Patient) => {
    trackPatientView(patient.id);
    if (onPatientSelect) {
      onPatientSelect(patient);
    }
    onChange('');
    setIsFocused(false);
  };

  const showSuggestions = isFocused && (value.trim() || showRecentPatients);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={
            searchMode === 'phone' ? 'Search by phone number...' :
            searchMode === 'id' ? 'Search by patient ID...' :
            searchMode === 'national_id' ? 'Search by national ID...' :
            'Search patients by name, phone, or ID...'
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          autoFocus={autoFocus}
          data-global-search="true"
          className="pl-10 pr-28 h-11 text-base"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Button
            size="sm"
            variant={searchMode === 'name' ? 'default' : 'ghost'}
            className="h-7 px-2 text-xs"
            onClick={() => setSearchMode('name')}
          >
            <User className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant={searchMode === 'phone' ? 'default' : 'ghost'}
            className="h-7 px-2 text-xs"
            onClick={() => setSearchMode('phone')}
          >
            <Phone className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant={searchMode === 'id' ? 'default' : 'ghost'}
            className="h-7 px-2 text-xs"
            onClick={() => setSearchMode('id')}
          >
            <Hash className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {showSuggestions && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-lg">
          <ScrollArea className="max-h-[400px]">
            {value.trim() ? (
              // Show search results
              <div className="p-2">
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground px-2 py-1">
                      Search Results ({searchResults.length})
                    </div>
                    {searchResults.map(({ patient, matchType }) => (
                      <Link
                        key={patient.id}
                        href={`/patients/${patient.id}`}
                      >
                        <button
                          onClick={() => handlePatientClick(patient)}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {getDisplayName(patient)}
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                                {patient.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {patient.phone}
                                  </span>
                                )}
                                {patient.nationalId && (
                                  <span className="flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" />
                                    {patient.nationalId}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[11px]">
                              {matchType}
                            </Badge>
                          </div>
                        </button>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No patients found matching "{value}"
                  </div>
                )}
              </div>
            ) : (
              // Show recent and frequent patients
              <div className="p-2 space-y-3">
                {recentPatients.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Recently Viewed
                    </div>
                    <div className="space-y-1">
                      {recentPatients.map(patient => (
                        <Link
                          key={patient.id}
                          href={`/patients/${patient.id}`}
                        >
                          <button
                            onClick={() => handlePatientClick(patient)}
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          >
                            <div className="font-medium text-sm">
                              {getDisplayName(patient)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {patient.phone}
                            </div>
                          </button>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {frequentPatients.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Frequently Viewed
                    </div>
                    <div className="space-y-1">
                      {frequentPatients.map(patient => (
                        <Link
                          key={patient.id}
                          href={`/patients/${patient.id}`}
                        >
                          <button
                            onClick={() => handlePatientClick(patient)}
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          >
                            <div className="font-medium text-sm">
                              {getDisplayName(patient)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {patient.phone}
                            </div>
                          </button>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {recentPatients.length === 0 && frequentPatients.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Start searching to find patients
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
