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
      return apiRequest("POST", `/api/patients/${selectedPatientId}/lab-orders`, { tests });
    },
    onSuccess: () => {
      toast({
        title: "Lab Order Created",
        description: "Laboratory tests have been ordered successfully."
      });
      setSelectedTests([]);
      queryClient.invalidateQueries({ queryKey: ['/api/patients', selectedPatientId, 'lab-orders'] });
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

      {/* Search and Filter Lab Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Lab Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tests by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
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
          
          {/* Search Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''} found
              {searchQuery && ` for "${searchQuery}"`}
              {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            </span>
            {(searchQuery || selectedCategory !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lab Tests by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Available Laboratory Tests
          </CardTitle>
          {selectedTests.length > 0 && (
            <Badge variant="secondary" className="w-fit">
              {selectedTests.length} test{selectedTests.length > 1 ? 's' : ''} selected
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
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
                      </div>
                    </div>
                  </div>
                  {expandedCategories.includes(category) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {tests.map(test => (
                    <div
                      key={test.id}
                      className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-700 rounded border"
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
      </Card>

      {/* Submit Button */}
      {selectedTests.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Ready to order {selectedTests.length} test{selectedTests.length > 1 ? 's' : ''}
                {selectedPatientId && patients.find(p => p.id === selectedPatientId) && (
                  <span> for {patients.find(p => p.id === selectedPatientId)?.firstName} {patients.find(p => p.id === selectedPatientId)?.lastName}</span>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}