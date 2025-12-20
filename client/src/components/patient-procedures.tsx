import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, Plus, Trash, Edit, Calendar, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/apiRequest';
import { useToast } from '@/hooks/use-toast';

const procedureSchema = z.object({
  procedureName: z.string().min(1, "Procedure name is required"),
  procedureDate: z.string().min(1, "Date is required"),
  procedureType: z.enum(["surgical", "diagnostic", "therapeutic", "minor", "other"]),
  performedBy: z.string().optional(),
  assistant: z.string().optional(),
  indication: z.string().min(1, "Indication is required"),
  description: z.string().optional(),
  outcome: z.string().optional(),
  complications: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional(),
  location: z.string().optional(),
  anesthesiaType: z.string().optional(),
  notes: z.string().optional(),
});

type ProcedureFormData = z.infer<typeof procedureSchema>;

interface PatientProceduresProps {
  patientId: number;
}

export function PatientProcedures({ patientId }: PatientProceduresProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      procedureName: '',
      procedureDate: '',
      procedureType: 'minor',
      performedBy: '',
      assistant: '',
      indication: '',
      description: '',
      outcome: '',
      complications: '',
      followUpRequired: false,
      followUpDate: '',
      location: '',
      anesthesiaType: '',
      notes: '',
    },
  });

  // Fetch procedures
  const { data: procedures, isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/procedures`],
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!patientId,
  });

  // Add procedure mutation
  const addProcedureMutation = useMutation({
    mutationFn: async (data: ProcedureFormData) => {
      const response = await apiRequest(`/api/patients/${patientId}/procedures`, 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/procedures`] });
      toast({ title: "Success", description: "Procedure added successfully" });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add procedure", variant: "destructive" });
    },
  });

  // Update procedure mutation
  const updateProcedureMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProcedureFormData }) => {
      const response = await apiRequest(`/api/patients/${patientId}/procedures/${id}`, 'PATCH', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/procedures`] });
      toast({ title: "Success", description: "Procedure updated successfully" });
      setEditingProcedure(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update procedure", variant: "destructive" });
    },
  });

  // Delete procedure mutation
  const deleteProcedureMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/patients/${patientId}/procedures/${id}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/procedures`] });
      toast({ title: "Success", description: "Procedure removed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove procedure", variant: "destructive" });
    },
  });

  const onSubmit = (data: ProcedureFormData) => {
    if (editingProcedure) {
      updateProcedureMutation.mutate({ id: editingProcedure.id, data });
    } else {
      addProcedureMutation.mutate(data);
    }
  };

  const handleEdit = (procedure: any) => {
    setEditingProcedure(procedure);
    form.reset({
      procedureName: procedure.procedureName,
      procedureDate: procedure.procedureDate,
      procedureType: procedure.procedureType,
      performedBy: procedure.performedBy || '',
      assistant: procedure.assistant || '',
      indication: procedure.indication,
      description: procedure.description || '',
      outcome: procedure.outcome || '',
      complications: procedure.complications || '',
      followUpRequired: procedure.followUpRequired || false,
      followUpDate: procedure.followUpDate || '',
      location: procedure.location || '',
      anesthesiaType: procedure.anesthesiaType || '',
      notes: procedure.notes || '',
    });
    setIsAddDialogOpen(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'surgical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'diagnostic':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'therapeutic':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'minor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Medical Procedures & Interventions</h3>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingProcedure(null); form.reset(); }} title="Add Procedure">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProcedure ? 'Edit Procedure' : 'Add New Procedure'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="procedureName"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Procedure Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Appendectomy, Colonoscopy, Skin biopsy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="procedureDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Procedure Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="procedureType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Procedure Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="surgical">Surgical</SelectItem>
                            <SelectItem value="diagnostic">Diagnostic</SelectItem>
                            <SelectItem value="therapeutic">Therapeutic</SelectItem>
                            <SelectItem value="minor">Minor Procedure</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="performedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Performed By</FormLabel>
                        <FormControl>
                          <Input placeholder="Surgeon/Physician name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assistant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assistant(s)</FormLabel>
                        <FormControl>
                          <Input placeholder="Assisting personnel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Operating Room 1, Clinic" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="anesthesiaType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anesthesia Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select anesthesia type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="local">Local</SelectItem>
                            <SelectItem value="regional">Regional</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="sedation">Conscious Sedation</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="indication"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Clinical Indication *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Reason for the procedure"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Procedure Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed description of what was done"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="outcome"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Outcome</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Results and immediate outcome of the procedure"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complications"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Complications</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any complications or adverse events"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followUpRequired"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Follow-up Required</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followUpDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follow-up Date</FormLabel>
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
                            placeholder="Any additional information"
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
                  <Button type="submit" disabled={addProcedureMutation.isPending || updateProcedureMutation.isPending}>
                    {editingProcedure ? 'Update' : 'Add'} Procedure
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-slate-500">Loading procedure records...</div>
        </div>
      ) : !procedures || procedures.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <Stethoscope className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-sm">No procedures recorded</p>
              <p className="text-xs text-gray-400 mt-2">Click "Add Procedure" to record surgical or medical procedures</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(Array.isArray(procedures) ? procedures : []).map((procedure: any) => (
            <Card key={procedure.id} className="border-l-4 border-l-indigo-500">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-semibold text-lg">{procedure.procedureName}</h4>
                      <Badge variant="outline" className={getTypeColor(procedure.procedureType)}>
                        {procedure.procedureType}
                      </Badge>
                      {procedure.followUpRequired && (
                        <Badge className="bg-orange-500 text-white">
                          <Clock className="h-3 w-3 mr-1" />
                          Follow-up Required
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="font-medium">Date:</span>{' '}
                        <span className="text-gray-700">{new Date(procedure.procedureDate).toLocaleDateString()}</span>
                      </div>
                      
                      {procedure.performedBy && (
                        <div>
                          <span className="font-medium">Performed By:</span>{' '}
                          <span className="text-gray-700">{procedure.performedBy}</span>
                        </div>
                      )}
                      
                      {procedure.location && (
                        <div>
                          <span className="font-medium">Location:</span>{' '}
                          <span className="text-gray-700">{procedure.location}</span>
                        </div>
                      )}
                      
                      {procedure.anesthesiaType && (
                        <div>
                          <span className="font-medium">Anesthesia:</span>{' '}
                          <span className="text-gray-700">{procedure.anesthesiaType}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Indication:</span>{' '}
                        <span className="text-gray-700">{procedure.indication}</span>
                      </div>
                      
                      {procedure.description && (
                        <div>
                          <span className="font-medium">Description:</span>{' '}
                          <p className="text-gray-700 mt-1">{procedure.description}</p>
                        </div>
                      )}
                      
                      {procedure.outcome && (
                        <div className="bg-green-50 p-3 rounded-md">
                          <span className="font-medium text-green-900">Outcome:</span>{' '}
                          <p className="text-green-800 mt-1">{procedure.outcome}</p>
                        </div>
                      )}
                      
                      {procedure.complications && (
                        <div className="bg-red-50 p-3 rounded-md">
                          <span className="font-medium text-red-900">Complications:</span>{' '}
                          <p className="text-red-800 mt-1">{procedure.complications}</p>
                        </div>
                      )}
                      
                      {procedure.followUpDate && (
                        <div className="flex items-center gap-1 text-orange-700 bg-orange-50 p-2 rounded">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Follow-up scheduled:</span>{' '}
                          <span>{new Date(procedure.followUpDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {procedure.notes && (
                        <div>
                          <span className="font-medium">Notes:</span>{' '}
                          <p className="text-gray-700 mt-1">{procedure.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(procedure)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to remove this procedure record?')) {
                          deleteProcedureMutation.mutate(procedure.id);
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

