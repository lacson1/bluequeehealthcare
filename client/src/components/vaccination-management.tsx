import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart, Plus, Calendar, User, Syringe, Edit, Trash2, MoreVertical } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
  const [editingVaccination, setEditingVaccination] = useState<VaccinationRecord | null>(null);
  const [deletingVaccination, setDeletingVaccination] = useState<VaccinationRecord | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({
        title: "Vaccination Added",
        description: "Vaccination record has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add vaccination record",
        variant: "destructive",
      });
    },
  });

  const updateVaccinationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: VaccinationForm }) => {
      // Handle empty date strings
      const processedData = {
        ...data,
        nextDueDate: data.nextDueDate === '' ? undefined : data.nextDueDate,
      };
      return apiRequest(`/api/patients/${patientId}/vaccinations/${id}`, 'PATCH', processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/vaccinations`] });
      setEditingVaccination(null);
      form.reset();
      toast({
        title: "Vaccination Updated",
        description: "Vaccination record has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update vaccination record",
        variant: "destructive",
      });
    },
  });

  const deleteVaccinationMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/patients/${patientId}/vaccinations/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/vaccinations`] });
      setDeletingVaccination(null);
      toast({
        title: "Vaccination Deleted",
        description: "Vaccination record has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete vaccination record",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VaccinationForm) => {
    if (editingVaccination) {
      updateVaccinationMutation.mutate({ id: editingVaccination.id, data });
    } else {
      addVaccinationMutation.mutate(data);
    }
  };

  const handleEdit = (vaccination: VaccinationRecord) => {
    setEditingVaccination(vaccination);
    form.reset({
      vaccineName: vaccination.vaccineName,
      dateAdministered: vaccination.dateAdministered.split('T')[0], // Format date for input
      administeredBy: vaccination.administeredBy,
      batchNumber: vaccination.batchNumber || '',
      manufacturer: vaccination.manufacturer || '',
      notes: vaccination.notes || '',
      nextDueDate: vaccination.nextDueDate ? vaccination.nextDueDate.split('T')[0] : '',
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = (vaccination: VaccinationRecord) => {
    setDeletingVaccination(vaccination);
  };

  const confirmDelete = () => {
    if (deletingVaccination) {
      deleteVaccinationMutation.mutate(deletingVaccination.id);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingVaccination(null);
    form.reset();
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
            <Dialog open={isAddModalOpen} onOpenChange={handleCloseModal}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setEditingVaccination(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vaccination
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingVaccination ? 'Edit Vaccination Record' : 'Add Vaccination Record'}
                  </DialogTitle>
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

                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCloseModal}
                        disabled={addVaccinationMutation.isPending || updateVaccinationMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={addVaccinationMutation.isPending || updateVaccinationMutation.isPending}
                      >
                        {editingVaccination 
                          ? (updateVaccinationMutation.isPending ? 'Updating...' : 'Update Vaccination')
                          : (addVaccinationMutation.isPending ? 'Adding...' : 'Add Vaccination')
                        }
                      </Button>
                    </DialogFooter>
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
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-900 flex items-center">
                        <Syringe className="mr-2 h-4 w-4" />
                        {vaccination.vaccineName}
                      </h4>
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(vaccination)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(vaccination)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingVaccination} onOpenChange={(open) => !open && setDeletingVaccination(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vaccination Record</DialogTitle>
          </DialogHeader>
          {deletingVaccination && (
            <div className="space-y-2 py-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this vaccination record? This action cannot be undone.
              </p>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{deletingVaccination.vaccineName}</p>
                <p className="text-sm text-muted-foreground">
                  Administered: {new Date(deletingVaccination.dateAdministered).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeletingVaccination(null)}
              disabled={deleteVaccinationMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteVaccinationMutation.isPending}
            >
              {deleteVaccinationMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}