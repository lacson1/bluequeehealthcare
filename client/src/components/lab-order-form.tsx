import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, TestTube, Plus, User, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LabOrderFormProps {
  patientId?: number;
  onOrderCreated?: () => void;
}

interface LabTest {
  id: number;
  name: string;
  category: string;
  referenceRange?: string;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
}

export default function LabOrderForm({ patientId, onOrderCreated }: LabOrderFormProps) {
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>(patientId);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Hematology']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: labTests = [], isLoading: testsLoading } = useQuery<LabTest[]>({
    queryKey: ['/api/lab-tests']
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients']
  });

  const createOrderMutation = useMutation({
    mutationFn: async (tests: number[]) => {
      if (!selectedPatientId) {
        throw new Error('Please select a patient');
      }
      return apiRequest(`/api/patients/${selectedPatientId}/lab-orders`, "POST", { tests });
    },
    onSuccess: () => {
      toast({
        title: "Lab Order Created",
        description: "Laboratory tests have been ordered successfully."
      });
      setSelectedTests([]);
      // Invalidate all related lab order queries
      queryClient.invalidateQueries({ queryKey: ['/api/patients', selectedPatientId, 'lab-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-orders/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/patients', selectedPatientId] });
      onOrderCreated?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create lab order. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Filter tests based on search query and category
  const filteredTests = labTests.filter(test => {
    const matchesSearch = searchQuery === '' ||
      test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' ||
      test.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group filtered tests by category
  const categorizedTests = filteredTests.reduce((acc, test) => {
    const category = test.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(test);
    return acc;
  }, {} as Record<string, LabTest[]>);

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(labTests.map(test => test.category || 'Other')));

  const handleTestToggle = (testId: number) => {
    setSelectedTests(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  // Bulk selection handlers
  const selectAllInCategory = (category: string) => {
    const categoryTests = categorizedTests[category] || [];
    const categoryTestIds = categoryTests.map(test => test.id);
    setSelectedTests(prev => {
      const newSelection = [...prev];
      categoryTestIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
  };

  const deselectAllInCategory = (category: string) => {
    const categoryTests = categorizedTests[category] || [];
    const categoryTestIds = categoryTests.map(test => test.id);
    setSelectedTests(prev => prev.filter(id => !categoryTestIds.includes(id)));
  };

  const selectAllFiltered = () => {
    const allFilteredIds = filteredTests.map(test => test.id);
    setSelectedTests(prev => {
      const newSelection = [...prev];
      allFilteredIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
  };

  const clearAllSelections = () => {
    setSelectedTests([]);
  };

  const getCommonTestPanels = () => {
    // Comprehensive panel definitions with multiple search terms
    const panelDefinitions: Record<string, string[]> = {
      // Basic Panels
      'Basic Metabolic Panel (BMP)': ['basic metabolic panel', 'bmp', 'metabolic panel'],
      'Complete Metabolic Panel (CMP)': ['complete metabolic panel', 'cmp', 'comprehensive metabolic'],
      'Complete Blood Count (CBC)': ['complete blood count', 'cbc', 'full blood count', 'fbc'],
      'Liver Function Panel (LFT)': ['liver function', 'lft', 'hepatic function', 'liver panel'],
      'Lipid Panel': ['lipid panel', 'cholesterol panel', 'lipid profile'],
      'Thyroid Panel': ['thyroid', 'tsh', 't3', 't4', 'thyroid function'],
      
      // Comprehensive Panels
      'Comprehensive Metabolic Panel': ['comprehensive metabolic', 'cmp', 'full metabolic'],
      'Renal Function Panel': ['renal function', 'kidney function', 'renal panel', 'creatinine', 'bun'],
      'Cardiac Panel': ['cardiac', 'troponin', 'ck-mb', 'bnp', 'nt-probnp', 'cardiac enzymes'],
      'Coagulation Panel': ['coagulation', 'pt', 'inr', 'aptt', 'ptt', 'coagulation panel'],
      'Inflammatory Markers': ['inflammatory', 'crp', 'esr', 'sed rate', 'c-reactive'],
      
      // Specialty Panels
      'Diabetes Panel': ['diabetes', 'hba1c', 'hemoglobin a1c', 'glucose', 'diabetic panel'],
      'Anemia Panel': ['anemia', 'iron', 'ferritin', 'b12', 'folate', 'anemia workup'],
      'Vitamin Panel': ['vitamin', 'vitamin d', 'b12', 'folate', 'vitamin b'],
      'Hormone Panel': ['hormone', 'testosterone', 'estrogen', 'progesterone', 'hormone panel'],
      'Tumor Markers': ['tumor marker', 'psa', 'cea', 'ca 19-9', 'afp'],
      
      // Organ-Specific
      'Pancreatic Panel': ['pancreatic', 'amylase', 'lipase', 'pancreas'],
      'Bone Panel': ['bone', 'calcium', 'phosphorus', 'alkaline phosphatase', 'vitamin d'],
      'Electrolyte Panel': ['electrolyte', 'sodium', 'potassium', 'chloride', 'bicarbonate'],
      
      // Infectious Disease
      'Hepatitis Panel': ['hepatitis', 'hep a', 'hep b', 'hep c', 'hepatitis panel'],
      'STI Panel': ['sti', 'std', 'syphilis', 'gonorrhea', 'chlamydia', 'hiv'],
      'Mononucleosis Panel': ['mono', 'mononucleosis', 'ebv', 'epstein-barr'],
      
      // Urine & Body Fluids
      'Urine Analysis': ['urine', 'urinalysis', 'ua', 'urine analysis'],
      'Stool Analysis': ['stool', 'fecal', 'occult blood', 'stool analysis'],
      'CSF Analysis': ['csf', 'cerebrospinal', 'spinal fluid'],
      
      // Autoimmune
      'Autoimmune Panel': ['autoimmune', 'ana', 'rheumatoid', 'lupus', 'autoimmune panel'],
      'Rheumatology Panel': ['rheumatology', 'rheumatoid factor', 'anti-ccp', 'rheumatology'],
      
      // Pregnancy & Women's Health
      'Pregnancy Panel': ['pregnancy', 'hcg', 'beta hcg', 'pregnancy test'],
      'Prenatal Panel': ['prenatal', 'pregnancy screening', 'prenatal panel'],
      
      // Men's Health
      'Prostate Panel': ['prostate', 'psa', 'prostate specific antigen'],
      
      // Pediatric
      'Newborn Screen': ['newborn', 'neonatal', 'newborn screen'],
      
      // Drug Monitoring
      'Drug Monitoring': ['drug level', 'therapeutic drug', 'drug monitoring'],
      'Toxicology Panel': ['toxicology', 'drug screen', 'tox screen'],
    };

    const panels: Record<string, number[]> = {};
    
    Object.entries(panelDefinitions).forEach(([panelName, searchTerms]) => {
      const matchingTests = labTests.filter(test => {
        const testNameLower = test.name.toLowerCase();
        const categoryLower = (test.category || '').toLowerCase();
        return searchTerms.some(term => 
          testNameLower.includes(term) || categoryLower.includes(term)
        );
      });
      
      if (matchingTests.length > 0) {
        panels[panelName] = matchingTests.map(test => test.id);
      }
    });

    return panels;
  };

  const selectTestPanel = (panelName: string) => {
    const panels = getCommonTestPanels();
    const panelTestIds = panels[panelName as keyof typeof panels] || [];
    setSelectedTests(prev => {
      const newSelection = [...prev];
      panelTestIds.forEach((id: number) => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Hematology': return '🩸';
      case 'Clinical Chemistry': return '⚗️';
      case 'Liver Function': return '🫀';
      case 'Electrolytes': return '⚡';
      case 'Parasitology': case 'Serology': case 'Microbiology': return '🦠';
      case 'Urine Analysis': return '🧪';
      case 'Stool Analysis': return '💩';
      case 'Radiology': return '📷';
      case 'Coagulation': return '🩸';
      case 'Inflammatory Markers': return '🔥';
      case 'Endocrinology': return '🧬';
      default: return '🔬';
    }
  };

  const handleSubmit = () => {
    if (selectedTests.length === 0) {
      toast({
        title: "No Tests Selected",
        description: "Please select at least one test to order.",
        variant: "destructive"
      });
      return;
    }
    createOrderMutation.mutate(selectedTests);
  };

  if (testsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading lab tests...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Lab Order Button - Top */}
      {selectedTests.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selectedTests.length} test{selectedTests.length > 1 ? 's' : ''}</span> selected
            {selectedPatientId && patients.find(p => p.id === selectedPatientId) && (
              <span> for <span className="font-medium text-foreground">{patients.find(p => p.id === selectedPatientId)?.firstName} {patients.find(p => p.id === selectedPatientId)?.lastName}</span></span>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={createOrderMutation.isPending || !selectedPatientId}
            className="flex items-center gap-2"
          >
            {createOrderMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create Lab Order
          </Button>
        </div>
      )}

      {/* Patient Selection */}
      {!patientId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedPatientId?.toString()}
              onValueChange={(value) => setSelectedPatientId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a patient..." />
              </SelectTrigger>
              <SelectContent>
                {patients.map(patient => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    {patient.firstName} {patient.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Lab Tests - Compact */}
      <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-8 text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0.5 top-0.5 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-8 w-full sm:w-40 text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {getCategoryIcon(category)} {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Results Summary and Bulk Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
          </span>
          <div className="flex items-center gap-1.5">
            {filteredTests.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllFiltered}
                  className="h-6 px-2 text-xs"
                >
                  Select All ({filteredTests.length})
                </Button>
                {selectedTests.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllSelections}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                  >
                    Clear ({selectedTests.length})
                  </Button>
                )}
              </>
            )}
            {(searchQuery || selectedCategory !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="h-6 px-2 text-xs"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Test Panels - Organized by Category */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TestTube className="h-4 w-4 text-primary" />
            Quick Preset Panels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const panels = getCommonTestPanels();
            const panelCategories: Record<string, string[]> = {
              'Basic Panels': [
                'Basic Metabolic Panel (BMP)',
                'Complete Metabolic Panel (CMP)',
                'Complete Blood Count (CBC)',
                'Liver Function Panel (LFT)',
                'Lipid Panel',
                'Thyroid Panel'
              ],
              'Comprehensive Panels': [
                'Comprehensive Metabolic Panel',
                'Renal Function Panel',
                'Cardiac Panel',
                'Coagulation Panel',
                'Inflammatory Markers'
              ],
              'Specialty Panels': [
                'Diabetes Panel',
                'Anemia Panel',
                'Vitamin Panel',
                'Hormone Panel',
                'Tumor Markers'
              ],
              'Organ-Specific': [
                'Pancreatic Panel',
                'Bone Panel',
                'Electrolyte Panel'
              ],
              'Infectious Disease': [
                'Hepatitis Panel',
                'STI Panel',
                'Mononucleosis Panel'
              ],
              'Body Fluids': [
                'Urine Analysis',
                'Stool Analysis',
                'CSF Analysis'
              ],
              'Autoimmune & Specialized': [
                'Autoimmune Panel',
                'Rheumatology Panel',
                'Pregnancy Panel',
                'Prenatal Panel',
                'Prostate Panel',
                'Newborn Screen',
                'Drug Monitoring',
                'Toxicology Panel'
              ]
            };

            return Object.entries(panelCategories).map(([categoryName, panelNames]) => {
              const availablePanels = panelNames.filter(name => panels[name] && panels[name].length > 0);
              
              if (availablePanels.length === 0) return null;

              return (
                <div key={categoryName} className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                    {categoryName}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {availablePanels.map((panelName) => {
                      const testIds = panels[panelName];
                      const selectedCount = testIds.filter(id => selectedTests.includes(id)).length;
                      const isFullySelected = selectedCount === testIds.length && testIds.length > 0;
                      const isPartiallySelected = selectedCount > 0 && selectedCount < testIds.length;

                      return (
                        <Button
                          key={panelName}
                          variant={isFullySelected ? "default" : "outline"}
                          size="sm"
                          className={`h-auto py-2 px-3 text-xs justify-start text-left ${isPartiallySelected ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : ""}`}
                          onClick={() => selectTestPanel(panelName)}
                          title={`${panelName} (${testIds.length} tests)${selectedCount > 0 ? ` - ${selectedCount} selected` : ''}`}
                        >
                          <div className="flex flex-col items-start gap-1 w-full">
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium truncate flex-1">{panelName}</span>
                              {selectedCount > 0 && (
                                <Badge variant="secondary" className="h-4 px-1.5 text-[10px] ml-1 flex-shrink-0">
                                  {selectedCount}/{testIds.length}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {testIds.length} test{testIds.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </CardContent>
      </Card>

      {/* Lab Tests by Category */}
      <Card>
        <Collapsible
          open={expandedCategories.includes('main')}
          onOpenChange={() => toggleCategory('main')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Available Laboratory Tests
                  {selectedTests.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedTests.length} test{selectedTests.length > 1 ? 's' : ''} selected
                    </Badge>
                  )}
                </div>
                {expandedCategories.includes('main') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {Object.entries(categorizedTests).map(([category, tests]) => (
                <Collapsible
                  key={category}
                  open={expandedCategories.includes(category)}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getCategoryIcon(category)}</span>
                        <div className="text-left">
                          <div className="font-medium">{category}</div>
                          <div className="text-sm text-muted-foreground">
                            {tests.length} test{tests.length > 1 ? 's' : ''} available
                            {(() => {
                              const categoryTestIds = tests.map(test => test.id);
                              const selectedInCategory = selectedTests.filter(id => categoryTestIds.includes(id)).length;
                              if (selectedInCategory > 0) {
                                return (
                                  <span className="text-blue-600 font-medium ml-2">
                                    • {selectedInCategory} selected
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const categoryTestIds = tests.map(test => test.id);
                          const selectedInCategory = selectedTests.filter(id => categoryTestIds.includes(id)).length;
                          const allSelected = selectedInCategory === tests.length && tests.length > 0;

                          return (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs px-2 py-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (allSelected) {
                                    deselectAllInCategory(category);
                                  } else {
                                    selectAllInCategory(category);
                                  }
                                }}
                              >
                                {allSelected ? 'Deselect All' : 'Select All'}
                              </Button>
                            </div>
                          );
                        })()}
                        {expandedCategories.includes(category) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {tests.map(test => (
                        <div
                          key={test.id}
                          className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-700 rounded border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => handleTestToggle(test.id)}
                        >
                          <Checkbox
                            id={`test-${test.id}`}
                            checked={selectedTests.includes(test.id)}
                            onCheckedChange={() => handleTestToggle(test.id)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`test-${test.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {test.name}
                            </label>
                            {test.referenceRange && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Normal: {test.referenceRange}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

    </div>
  );
}