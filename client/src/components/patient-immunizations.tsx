import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Syringe, Plus, Trash, Edit, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/apiRequest';
import { useToast } from '@/hooks/use-toast';
import { STANDARD_VACCINE_SCHEDULES } from '@/lib/vaccine-schedules';
import { Link } from 'wouter';

interface Immunization {
  id: number;
  vaccineName: string;
  dateAdministered: string;
  doseNumber?: string;
  administeredBy?: string;
  lotNumber?: string;
  manufacturer?: string;
  site?: string;
  route?: string;
  nextDueDate?: string;
  notes?: string;
}

const immunizationSchema = z.object({
  vaccineName: z.string().min(1, "Vaccine name is required"),
  dateAdministered: z.string().min(1, "Date is required"),
  doseNumber: z.string().optional(),
  administeredBy: z.string().optional(),
  lotNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  site: z.string().optional(),
  route: z.string().optional(),
  nextDueDate: z.string().optional(),
  notes: z.string().optional(),
});

type ImmunizationFormData = z.infer<typeof immunizationSchema>;

interface PatientImmunizationsProps {
  readonly patientId: number;
}

export function PatientImmunizations({ patientId }: PatientImmunizationsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<Immunization | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ImmunizationFormData>({
    resolver: zodResolver(immunizationSchema),
    defaultValues: {
      vaccineName: '',
      dateAdministered: '',
      doseNumber: '',
      administeredBy: '',
      lotNumber: '',
      manufacturer: '',
      site: '',
      route: '',
      nextDueDate: '',
      notes: '',
    },
  });

  // Fetch immunizations
  const { data: immunizations, isLoading } = useQuery<Immunization[]>({
    queryKey: [`/api/patients/${patientId}/immunizations`],
  });

  // Add immunization mutation
  const addImmunizationMutation = useMutation({
    mutationFn: async (data: ImmunizationFormData) => {
      const response = await apiRequest(`/api/patients/${patientId}/immunizations`, 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/immunizations`] });
      toast({ title: "Success", description: "Immunization record added successfully" });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add immunization", variant: "destructive" });
    },
  });

  // Update immunization mutation
  const updateImmunizationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ImmunizationFormData }) => {
      const response = await apiRequest(`/api/patients/${patientId}/immunizations/${id}`, 'PATCH', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/immunizations`] });
      toast({ title: "Success", description: "Immunization record updated successfully" });
      setEditingVaccine(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update immunization", variant: "destructive" });
    },
  });

  // Delete immunization mutation
  const deleteImmunizationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/patients/${patientId}/immunizations/${id}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/immunizations`] });
      toast({ title: "Success", description: "Immunization record removed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove immunization", variant: "destructive" });
    },
  });

  const onSubmit = (data: ImmunizationFormData) => {
    if (editingVaccine) {
      updateImmunizationMutation.mutate({ id: editingVaccine.id, data });
    } else {
      addImmunizationMutation.mutate(data);
    }
  };

  const handleEdit = (vaccine: Immunization) => {
    setEditingVaccine(vaccine);
    form.reset({
      vaccineName: vaccine.vaccineName,
      dateAdministered: vaccine.dateAdministered,
      doseNumber: vaccine.doseNumber || '',
      administeredBy: vaccine.administeredBy || '',
      lotNumber: vaccine.lotNumber || '',
      manufacturer: vaccine.manufacturer || '',
      site: vaccine.site || '',
      route: vaccine.route || '',
      nextDueDate: vaccine.nextDueDate || '',
      notes: vaccine.notes || '',
    });
    setIsAddDialogOpen(true);
  };

  const isUpcoming = (nextDueDate: string) => {
    if (!nextDueDate) return false;
    const dueDate = new Date(nextDueDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.setDate(today.getDate() + 30));
    return dueDate <= thirtyDaysFromNow && dueDate >= new Date();
  };

  const isOverdue = (nextDueDate: string) => {
    if (!nextDueDate) return false;
    return new Date(nextDueDate) < new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Syringe className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Immunizations & Vaccinations</h3>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/vaccination-management">
            <Button variant="outline" size="sm" title="View Vaccination Management">
              <ExternalLink className="h-4 w-4 mr-1" />
              Management
            </Button>
          </Link>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingVaccine(null); form.reset(); }} title="Add Immunization">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingVaccine ? 'Edit Immunization' : 'Add New Immunization'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="vaccineName"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Vaccine Name *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select or type vaccine name" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {STANDARD_VACCINE_SCHEDULES.map(v => (
                                <SelectItem key={v.id} value={v.name}>
                                  <span className="font-medium">{v.shortName}</span>
                                  <span className="text-slate-500 ml-2">- {v.name}</span>
                                </SelectItem>
                              ))}
                              <SelectItem value="Other">Other (specify in notes)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateAdministered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Administered *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="doseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dose Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 1, 2, Booster" {...field} />
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
                      name="manufacturer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manufacturer</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Pfizer, Moderna" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lotNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lot Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Vaccine lot number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="site"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Injection Site</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select site" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="left-arm">Left Arm</SelectItem>
                              <SelectItem value="right-arm">Right Arm</SelectItem>
                              <SelectItem value="left-thigh">Left Thigh</SelectItem>
                              <SelectItem value="right-thigh">Right Thigh</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="route"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Route</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select route" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="intramuscular">Intramuscular (IM)</SelectItem>
                              <SelectItem value="subcutaneous">Subcutaneous (SC)</SelectItem>
                              <SelectItem value="intradermal">Intradermal (ID)</SelectItem>
                              <SelectItem value="oral">Oral</SelectItem>
                              <SelectItem value="nasal">Nasal</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nextDueDate"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Next Dose Due Date</FormLabel>
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
                        <FormItem className="col-span-2">
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any reactions, side effects, or additional information"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addImmunizationMutation.isPending || updateImmunizationMutation.isPending}>
                      {editingVaccine ? 'Update' : 'Add'} Immunization
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-slate-500">Loading immunization records...</div>
        </div>
      )}

      {!isLoading && (!immunizations || immunizations.length === 0) && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <Syringe className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-sm">No immunization records found</p>
              <p className="text-xs text-gray-400 mt-2">Click "Add Immunization" to record vaccinations</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && immunizations && immunizations.length > 0 && (
        <div className="grid gap-4">
          {immunizations.map((vaccine) => {
            const getBorderColor = () => {
              if (vaccine.nextDueDate && isOverdue(vaccine.nextDueDate)) return 'border-l-red-500';
              if (vaccine.nextDueDate && isUpcoming(vaccine.nextDueDate)) return 'border-l-yellow-500';
              return 'border-l-green-500';
            };
            return (
              <Card key={vaccine.id} className={`border-l-4 ${getBorderColor()}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{vaccine.vaccineName}</h4>
                        {vaccine.doseNumber && (
                          <Badge variant="outline">Dose {vaccine.doseNumber}</Badge>
                        )}
                        {vaccine.nextDueDate && isOverdue(vaccine.nextDueDate) && (
                          <Badge className="bg-red-500 text-white">Overdue</Badge>
                        )}
                        {vaccine.nextDueDate && isUpcoming(vaccine.nextDueDate) && (
                          <Badge className="bg-yellow-500 text-white">Due Soon</Badge>
                        )}
                        {!vaccine.nextDueDate && (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="font-medium">Date Given:</span>{' '}
                          <span className="text-gray-700">{new Date(vaccine.dateAdministered).toLocaleDateString()}</span>
                        </div>

                        {vaccine.administeredBy && (
                          <div>
                            <span className="font-medium">Given By:</span>{' '}
                            <span className="text-gray-700">{vaccine.administeredBy}</span>
                          </div>
                        )}

                        {vaccine.manufacturer && (
                          <div>
                            <span className="font-medium">Manufacturer:</span>{' '}
                            <span className="text-gray-700">{vaccine.manufacturer}</span>
                          </div>
                        )}

                        {vaccine.lotNumber && (
                          <div>
                            <span className="font-medium">Lot #:</span>{' '}
                            <span className="text-gray-700">{vaccine.lotNumber}</span>
                          </div>
                        )}

                        {vaccine.site && (
                          <div>
                            <span className="font-medium">Site:</span>{' '}
                            <span className="text-gray-700">{vaccine.site}</span>
                          </div>
                        )}

                        {vaccine.route && (
                          <div>
                            <span className="font-medium">Route:</span>{' '}
                            <span className="text-gray-700">{vaccine.route}</span>
                          </div>
                        )}

                        {vaccine.nextDueDate && (
                          <div className="col-span-2 flex items-center gap-1 text-gray-600">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">Next Due:</span>{' '}
                            <span>{new Date(vaccine.nextDueDate).toLocaleDateString()}</span>
                          </div>
                        )}

                        {vaccine.notes && (
                          <div className="col-span-2">
                            <span className="font-medium">Notes:</span>{' '}
                            <span className="text-gray-700">{vaccine.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(vaccine)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to remove this immunization record?')) {
                            deleteImmunizationMutation.mutate(vaccine.id);
                          }
                        }}
                      >
                        <Trash className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

