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
import { Heart, Plus, Calendar, User, Syringe } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const vaccinationSchema = z.object({
  vaccineName: z.string().min(1, 'Vaccine name is required'),
  dateAdministered: z.string().min(1, 'Date is required'),
  administeredBy: z.string().min(1, 'Administrator name is required'),
  batchNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  notes: z.string().optional(),
  nextDueDate: z.string().optional().transform(val => val === '' ? undefined : val),
});

type VaccinationForm = z.infer<typeof vaccinationSchema>;

interface VaccinationRecord {
  id: number;
  vaccineName: string;
  dateAdministered: string;
  administeredBy: string;
  batchNumber?: string;
  manufacturer?: string;
  notes?: string;
  nextDueDate?: string;
  patientId: number;
}

interface VaccinationManagementProps {
  patientId: number;
  canEdit: boolean;
}

export default function VaccinationManagement({ patientId, canEdit }: VaccinationManagementProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: vaccinations, isLoading } = useQuery<VaccinationRecord[]>({
    queryKey: [`/api/patients/${patientId}/vaccinations`],
  });

  const form = useForm<VaccinationForm>({
    resolver: zodResolver(vaccinationSchema),
    defaultValues: {
      vaccineName: '',
      dateAdministered: '',
      administeredBy: '',
      batchNumber: '',
      manufacturer: '',
      notes: '',
      nextDueDate: '',
    },
  });

  const addVaccinationMutation = useMutation({
    mutationFn: (data: VaccinationForm) =>
      apiRequest(`/api/patients/${patientId}/vaccinations`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/vaccinations`] });
      setIsAddModalOpen(false);
      form.reset();
    },
  });

  const onSubmit = (data: VaccinationForm) => {
    addVaccinationMutation.mutate(data);
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
            <Heart className="mr-2 h-5 w-5" />
            Vaccination History
          </span>
          {canEdit && (
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vaccination
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Vaccination Record</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="vaccineName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vaccine Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., COVID-19, Hepatitis B" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateAdministered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Administered</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              onKeyDown={(e) => {
                                if (e.key === 'Tab' || e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="administeredBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Administered By</FormLabel>
                          <FormControl>
                            <Input placeholder="Healthcare provider name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="batchNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Vaccine batch number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="manufacturer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manufacturer (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Pfizer, Moderna" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nextDueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Due Date (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              onKeyDown={(e) => {
                                if (e.key === 'Tab' || e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                            />
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
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes or reactions" 
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
                        disabled={addVaccinationMutation.isPending}
                      >
                        {addVaccinationMutation.isPending ? 'Adding...' : 'Add Vaccination'}
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
        {vaccinations && vaccinations.length > 0 ? (
          <div className="space-y-4">
            {vaccinations.map((vaccination) => (
              <div key={vaccination.id} className="border rounded-lg p-4 bg-green-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900 flex items-center">
                      <Syringe className="mr-2 h-4 w-4" />
                      {vaccination.vaccineName}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm text-green-800">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>Administered: {new Date(vaccination.dateAdministered).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <User className="mr-1 h-3 w-3" />
                        <span>By: {vaccination.administeredBy}</span>
                      </div>
                      
                      {vaccination.manufacturer && (
                        <div className="col-span-full">
                          <strong>Manufacturer:</strong> {vaccination.manufacturer}
                        </div>
                      )}
                      
                      {vaccination.batchNumber && (
                        <div className="col-span-full">
                          <strong>Batch:</strong> {vaccination.batchNumber}
                        </div>
                      )}
                    </div>

                    {vaccination.nextDueDate && (
                      <div className="mt-2">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Next due: {new Date(vaccination.nextDueDate).toLocaleDateString()}
                        </Badge>
                      </div>
                    )}

                    {vaccination.notes && (
                      <div className="mt-3 p-2 bg-white rounded border">
                        <p className="text-sm text-gray-700">
                          <strong>Notes:</strong> {vaccination.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Heart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No vaccination records found</p>
            <p className="text-sm">Add vaccination records to track immunization history</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}