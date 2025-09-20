import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Plus, X, Pill, Apple, Flower } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const allergySchema = z.object({
  allergen: z.string().min(1, 'Allergen name is required'),
  type: z.enum(['drug', 'food', 'environmental'], {
    required_error: 'Please select an allergy type',
  }),
  severity: z.enum(['mild', 'moderate', 'severe'], {
    required_error: 'Please select severity level',
  }),
  reaction: z.string().min(1, 'Reaction description is required'),
  notes: z.string().optional(),
});

type AllergyForm = z.infer<typeof allergySchema>;

interface AllergyRecord {
  id: number;
  allergen: string;
  type: 'drug' | 'food' | 'environmental';
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  notes?: string;
  patientId: number;
  createdAt: string;
}

interface AllergyManagementProps {
  patientId: number;
  canEdit: boolean;
}

const getAllergyIcon = (type: string) => {
  switch (type) {
    case 'drug':
      return <Pill className="h-4 w-4" />;
    case 'food':
      return <Apple className="h-4 w-4" />;
    case 'environmental':
      return <Flower className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'mild':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'moderate':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'severe':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function AllergyManagement({ patientId, canEdit }: AllergyManagementProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: allergies, isLoading } = useQuery<AllergyRecord[]>({
    queryKey: [`/api/patients/${patientId}/allergies`],
  });

  const form = useForm<AllergyForm>({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      allergen: '',
      type: undefined,
      severity: undefined,
      reaction: '',
      notes: '',
    },
  });

  const addAllergyMutation = useMutation({
    mutationFn: (data: AllergyForm) =>
      apiRequest(`/api/patients/${patientId}/allergies`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/allergies`] });
      setIsAddModalOpen(false);
      form.reset();
    },
  });

  const deleteAllergyMutation = useMutation({
    mutationFn: (allergyId: number) =>
      apiRequest(`/api/patients/${patientId}/allergies/${allergyId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/allergies`] });
    },
  });

  const onSubmit = (data: AllergyForm) => {
    addAllergyMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Allergy History
          </span>
          {canEdit && (
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Allergy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Allergy Record</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="allergen"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allergen Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Penicillin, Peanuts, Pollen" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allergy Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select allergy type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="drug">Drug/Medication</SelectItem>
                              <SelectItem value="food">Food</SelectItem>
                              <SelectItem value="environmental">Environmental</SelectItem>
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
                          <FormLabel>Severity Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select severity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="mild">Mild</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="severe">Severe</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reaction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reaction</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Rash, Difficulty breathing" {...field} />
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
                          <FormLabel>Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional information about the allergy" 
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={addAllergyMutation.isPending}
                      >
                        {addAllergyMutation.isPending ? 'Adding...' : 'Add Allergy'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allergies && allergies.length > 0 ? (
          <div className="space-y-4">
            {allergies.map((allergy) => (
              <div key={allergy.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-red-900 flex items-center">
                        {getAllergyIcon(allergy.type)}
                        <span className="ml-2">{allergy.allergen}</span>
                      </h4>
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteAllergyMutation.mutate(allergy.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="capitalize">
                        {allergy.type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${getSeverityColor(allergy.severity)}`}
                      >
                        {allergy.severity}
                      </Badge>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-red-800">
                        <strong>Reaction:</strong> {allergy.reaction}
                      </p>
                    </div>

                    {allergy.notes && (
                      <div className="mt-2 p-2 bg-white rounded border border-red-200">
                        <p className="text-sm text-gray-700">
                          <strong>Notes:</strong> {allergy.notes}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-red-600 mt-2">
                      Added: {new Date(allergy.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No known allergies recorded</p>
            <p className="text-sm">Add allergy information to ensure safe treatment</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}