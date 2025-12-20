import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertTriangle, Plus, Trash, Edit, Calendar, Check, ChevronsUpDown, Pill, Apple, Wind, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/apiRequest';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Common allergens database organized by category
const COMMON_ALLERGENS = {
  drug: [
    { name: 'Penicillin', category: 'Antibiotic' },
    { name: 'Amoxicillin', category: 'Antibiotic' },
    { name: 'Ampicillin', category: 'Antibiotic' },
    { name: 'Cephalosporins', category: 'Antibiotic' },
    { name: 'Sulfonamides (Sulfa drugs)', category: 'Antibiotic' },
    { name: 'Tetracycline', category: 'Antibiotic' },
    { name: 'Erythromycin', category: 'Antibiotic' },
    { name: 'Ciprofloxacin', category: 'Antibiotic' },
    { name: 'Vancomycin', category: 'Antibiotic' },
    { name: 'Aspirin', category: 'NSAID' },
    { name: 'Ibuprofen', category: 'NSAID' },
    { name: 'Naproxen', category: 'NSAID' },
    { name: 'Diclofenac', category: 'NSAID' },
    { name: 'Morphine', category: 'Opioid' },
    { name: 'Codeine', category: 'Opioid' },
    { name: 'Tramadol', category: 'Opioid' },
    { name: 'Fentanyl', category: 'Opioid' },
    { name: 'Lidocaine', category: 'Anesthetic' },
    { name: 'Novocaine', category: 'Anesthetic' },
    { name: 'Propofol', category: 'Anesthetic' },
    { name: 'ACE Inhibitors', category: 'Cardiovascular' },
    { name: 'Beta Blockers', category: 'Cardiovascular' },
    { name: 'Statins', category: 'Cardiovascular' },
    { name: 'Warfarin', category: 'Anticoagulant' },
    { name: 'Heparin', category: 'Anticoagulant' },
    { name: 'Insulin', category: 'Diabetes' },
    { name: 'Metformin', category: 'Diabetes' },
    { name: 'Contrast Dye (Iodine)', category: 'Diagnostic' },
    { name: 'Latex', category: 'Medical Material' },
    { name: 'Adhesive/Medical Tape', category: 'Medical Material' },
  ],
  food: [
    { name: 'Peanuts', category: 'Legume' },
    { name: 'Tree Nuts (Almonds, Cashews, Walnuts)', category: 'Nuts' },
    { name: 'Almonds', category: 'Tree Nut' },
    { name: 'Cashews', category: 'Tree Nut' },
    { name: 'Walnuts', category: 'Tree Nut' },
    { name: 'Hazelnuts', category: 'Tree Nut' },
    { name: 'Pistachios', category: 'Tree Nut' },
    { name: 'Milk/Dairy', category: 'Dairy' },
    { name: 'Eggs', category: 'Animal Protein' },
    { name: 'Fish', category: 'Seafood' },
    { name: 'Shellfish', category: 'Seafood' },
    { name: 'Shrimp', category: 'Shellfish' },
    { name: 'Crab', category: 'Shellfish' },
    { name: 'Lobster', category: 'Shellfish' },
    { name: 'Wheat/Gluten', category: 'Grain' },
    { name: 'Soy', category: 'Legume' },
    { name: 'Sesame', category: 'Seed' },
    { name: 'Mustard', category: 'Condiment' },
    { name: 'Celery', category: 'Vegetable' },
    { name: 'Strawberries', category: 'Fruit' },
    { name: 'Kiwi', category: 'Fruit' },
    { name: 'Banana', category: 'Fruit' },
    { name: 'Avocado', category: 'Fruit' },
    { name: 'Tomatoes', category: 'Vegetable' },
    { name: 'Corn', category: 'Grain' },
    { name: 'Citrus Fruits', category: 'Fruit' },
    { name: 'Chocolate', category: 'Food' },
    { name: 'Food Coloring/Dyes', category: 'Additive' },
    { name: 'MSG (Monosodium Glutamate)', category: 'Additive' },
    { name: 'Sulfites', category: 'Preservative' },
  ],
  environmental: [
    { name: 'Pollen (Grass)', category: 'Plant' },
    { name: 'Pollen (Tree)', category: 'Plant' },
    { name: 'Pollen (Ragweed)', category: 'Plant' },
    { name: 'Dust Mites', category: 'Indoor' },
    { name: 'Mold/Mildew', category: 'Fungal' },
    { name: 'Pet Dander (Cat)', category: 'Animal' },
    { name: 'Pet Dander (Dog)', category: 'Animal' },
    { name: 'Cockroach', category: 'Insect' },
    { name: 'Bee Venom', category: 'Insect' },
    { name: 'Wasp Venom', category: 'Insect' },
    { name: 'Fire Ant Venom', category: 'Insect' },
    { name: 'Mosquito Bites', category: 'Insect' },
    { name: 'Nickel', category: 'Metal' },
    { name: 'Cobalt', category: 'Metal' },
    { name: 'Chromium', category: 'Metal' },
    { name: 'Perfume/Fragrance', category: 'Chemical' },
    { name: 'Formaldehyde', category: 'Chemical' },
    { name: 'Cleaning Products', category: 'Chemical' },
    { name: 'Smoke', category: 'Environmental' },
    { name: 'Cold Air', category: 'Physical' },
    { name: 'Sunlight (Photosensitivity)', category: 'Physical' },
  ],
  other: [
    { name: 'Unknown/Unspecified', category: 'Unknown' },
  ],
};

const allergySchema = z.object({
  allergen: z.string().min(1, "Allergen name is required"),
  allergyType: z.enum(["drug", "food", "environmental", "other"]),
  severity: z.enum(["mild", "moderate", "severe", "life-threatening"]),
  reaction: z.string().min(1, "Reaction description is required"),
  onsetDate: z.string().optional(),
  notes: z.string().optional(),
});

type AllergyFormData = z.infer<typeof allergySchema>;

interface PatientAllergiesProps {
  patientId: number;
}

export function PatientAllergies({ patientId }: PatientAllergiesProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<any>(null);
  const [allergenSearchOpen, setAllergenSearchOpen] = useState(false);
  const [allergenSearch, setAllergenSearch] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AllergyFormData>({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      allergen: '',
      allergyType: 'drug',
      severity: 'mild',
      reaction: '',
      onsetDate: '',
      notes: '',
    },
  });

  // Watch the allergy type to filter suggestions
  const selectedAllergyType = form.watch('allergyType');

  // Filter allergens based on search and selected type
  const filteredAllergens = useMemo(() => {
    const allergens = COMMON_ALLERGENS[selectedAllergyType as keyof typeof COMMON_ALLERGENS] || [];
    if (!allergenSearch) return allergens;
    return allergens.filter(a => 
      a.name.toLowerCase().includes(allergenSearch.toLowerCase()) ||
      a.category.toLowerCase().includes(allergenSearch.toLowerCase())
    );
  }, [selectedAllergyType, allergenSearch]);

  // Get icon for allergy type
  const getAllergyTypeIcon = (type: string) => {
    switch (type) {
      case 'drug': return <Pill className="h-4 w-4 text-purple-500" />;
      case 'food': return <Apple className="h-4 w-4 text-green-500" />;
      case 'environmental': return <Wind className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Fetch allergies
  const { data: allergies, isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/allergies`],
  });

  // Add allergy mutation
  const addAllergyMutation = useMutation({
    mutationFn: async (data: AllergyFormData) => {
      const response = await apiRequest(`/api/patients/${patientId}/allergies`, 'POST', data);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add allergy' }));
        throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/allergies`] });
      toast({ title: "Success", description: "Allergy added successfully" });
      setIsAddDialogOpen(false);
      form.reset();
      setAllergenSearch('');
      setAllergenSearchOpen(false);
    },
    onError: (error: Error) => {
      console.error('Error adding allergy:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add allergy", 
        variant: "destructive" 
      });
    },
  });

  // Update allergy mutation
  const updateAllergyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AllergyFormData }) => {
      const response = await apiRequest(`/api/patients/${patientId}/allergies/${id}`, 'PATCH', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/allergies`] });
      toast({ title: "Success", description: "Allergy updated successfully" });
      setEditingAllergy(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update allergy", variant: "destructive" });
    },
  });

  // Delete allergy mutation
  const deleteAllergyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/patients/${patientId}/allergies/${id}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/allergies`] });
      toast({ title: "Success", description: "Allergy removed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove allergy", variant: "destructive" });
    },
  });

  const onSubmit = (data: AllergyFormData) => {
    if (editingAllergy) {
      updateAllergyMutation.mutate({ id: editingAllergy.id, data });
    } else {
      addAllergyMutation.mutate(data);
    }
  };

  const handleEdit = (allergy: any) => {
    setEditingAllergy(allergy);
    form.reset({
      allergen: allergy.allergen,
      allergyType: allergy.allergyType,
      severity: allergy.severity,
      reaction: allergy.reaction,
      onsetDate: allergy.onsetDate || '',
      notes: allergy.notes || '',
    });
    setIsAddDialogOpen(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'life-threatening':
        return 'bg-red-600 text-white';
      case 'severe':
        return 'bg-red-500 text-white';
      case 'moderate':
        return 'bg-orange-500 text-white';
      case 'mild':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'drug':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'food':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'environmental':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold">Allergies & Adverse Reactions</h3>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => { 
                setEditingAllergy(null); 
                form.reset();
                setAllergenSearch('');
                setAllergenSearchOpen(false);
              }} 
              className="gap-2"
              title="Add Allergy"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Allergy</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAllergy ? 'Edit Allergy' : 'Add New Allergy'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Allergy Type - Select First to Filter Allergens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="allergyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allergy Type *</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          // Clear allergen when type changes
                          form.setValue('allergen', '');
                          setAllergenSearch('');
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="drug">
                              <div className="flex items-center gap-2">
                                <Pill className="h-4 w-4 text-purple-500" />
                                Drug/Medication
                              </div>
                            </SelectItem>
                            <SelectItem value="food">
                              <div className="flex items-center gap-2">
                                <Apple className="h-4 w-4 text-green-500" />
                                Food
                              </div>
                            </SelectItem>
                            <SelectItem value="environmental">
                              <div className="flex items-center gap-2">
                                <Wind className="h-4 w-4 text-blue-500" />
                                Environmental
                              </div>
                            </SelectItem>
                            <SelectItem value="other">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-gray-500" />
                                Other
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mild">Mild</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="severe">Severe</SelectItem>
                            <SelectItem value="life-threatening">Life-Threatening</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Allergen Search/Select with Combobox */}
                <FormField
                  control={form.control}
                  name="allergen"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Allergen Name *</FormLabel>
                      <Popover open={allergenSearchOpen} onOpenChange={setAllergenSearchOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={allergenSearchOpen}
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {field.value ? (
                                  <>
                                    {getAllergyTypeIcon(selectedAllergyType)}
                                    <span className="truncate">{field.value}</span>
                                  </>
                                ) : (
                                  <>
                                    {getAllergyTypeIcon(selectedAllergyType)}
                                    <span>Search or select allergen...</span>
                                  </>
                                )}
                              </div>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput 
                              placeholder={`Search ${selectedAllergyType} allergens...`}
                              value={allergenSearch}
                              onValueChange={setAllergenSearch}
                            />
                            <CommandList>
                              <CommandEmpty>
                                <div className="p-4 text-center">
                                  <p className="text-sm text-muted-foreground mb-2">
                                    No matching allergens found
                                  </p>
                                  {allergenSearch && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        field.onChange(allergenSearch);
                                        setAllergenSearchOpen(false);
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add "{allergenSearch}" as custom allergen
                                    </Button>
                                  )}
                                </div>
                              </CommandEmpty>
                              <CommandGroup heading={`Common ${selectedAllergyType} allergens`}>
                                {filteredAllergens.map((allergen) => (
                                  <CommandItem
                                    key={allergen.name}
                                    value={allergen.name}
                                    onSelect={() => {
                                      field.onChange(allergen.name);
                                      setAllergenSearch('');
                                      setAllergenSearchOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === allergen.name ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{allergen.name}</span>
                                      <span className="text-xs text-muted-foreground">{allergen.category}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                              {allergenSearch && !filteredAllergens.some(a => a.name.toLowerCase() === allergenSearch.toLowerCase()) && (
                                <CommandGroup heading="Custom entry">
                                  <CommandItem
                                    value={allergenSearch}
                                    onSelect={() => {
                                      field.onChange(allergenSearch);
                                      setAllergenSearch('');
                                      setAllergenSearchOpen(false);
                                    }}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    <span>Add "{allergenSearch}" as custom allergen</span>
                                  </CommandItem>
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">
                        Select from common {selectedAllergyType} allergens or type a custom allergen name
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reaction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reaction/Symptoms *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the allergic reaction (e.g., hives, difficulty breathing, swelling)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="onsetDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date First Observed</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional information about the allergy"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setAllergenSearch('');
                      setAllergenSearchOpen(false);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addAllergyMutation.isPending || updateAllergyMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {addAllergyMutation.isPending || updateAllergyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingAllergy ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        {editingAllergy ? 'Update' : 'Add'} Allergy
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-slate-500">Loading allergies...</div>
        </div>
      ) : !allergies || allergies.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-sm font-medium mb-2">No allergies recorded</p>
              <p className="text-xs text-gray-400 mb-4">Click "Add Allergy" above to record patient allergies</p>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => { 
                      setEditingAllergy(null); 
                      form.reset();
                      setAllergenSearch('');
                      setAllergenSearchOpen(false);
                    }} 
                    className="gap-2"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Allergy
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(Array.isArray(allergies) ? allergies : []).map((allergy: any) => (
            <Card key={allergy.id} className="border-l-4 border-l-red-500">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">{allergy.allergen}</h4>
                      <Badge className={getSeverityColor(allergy.severity)}>
                        {allergy.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getTypeColor(allergy.allergyType)}>
                        {allergy.allergyType}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Reaction:</span>{' '}
                        <span className="text-gray-700">{allergy.reaction}</span>
                      </div>
                      
                      {allergy.onsetDate && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>First observed: {new Date(allergy.onsetDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {allergy.notes && (
                        <div>
                          <span className="font-medium">Notes:</span>{' '}
                          <span className="text-gray-700">{allergy.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(allergy)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to remove this allergy?')) {
                          deleteAllergyMutation.mutate(allergy.id);
                        }
                      }}
                    >
                      <Trash className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

