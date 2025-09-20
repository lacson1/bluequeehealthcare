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
import { History, Plus, X, Calendar, FileText } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const medicalHistorySchema = z.object({
  condition: z.string().min(1, 'Condition/diagnosis is required'),
  type: z.enum(['diagnosis', 'surgery', 'hospitalization', 'chronic_condition'], {
    required_error: 'Please select a type',
  }),
  dateOccurred: z.string().min(1, 'Date is required'),
  status: z.enum(['active', 'resolved', 'ongoing'], {
    required_error: 'Please select status',
  }),
  description: z.string().min(1, 'Description is required'),
  treatment: z.string().optional(),
  notes: z.string().optional(),
});

type MedicalHistoryForm = z.infer<typeof medicalHistorySchema>;

interface MedicalHistoryRecord {
  id: number;
  condition: string;
  type: 'diagnosis' | 'surgery' | 'hospitalization' | 'chronic_condition';
  dateOccurred: string;
  status: 'active' | 'resolved' | 'ongoing';
  description: string;
  treatment?: string;
  notes?: string;
  patientId: number;
  createdAt: string;
}

interface MedicalHistoryManagementProps {
  patientId: number;
  canEdit: boolean;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'surgery':
      return '🏥';
    case 'hospitalization':
      return '🛏️';
    case 'chronic_condition':
      return '⚕️';
    case 'diagnosis':
    default:
      return '📋';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'ongoing':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'resolved':
      return 'bg-green-50 text-green-700 border-green-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function MedicalHistoryManagement({ patientId, canEdit }: MedicalHistoryManagementProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: medicalHistory, isLoading } = useQuery<MedicalHistoryRecord[]>({
    queryKey: [`/api/patients/${patientId}/medical-history`],
  });

  const form = useForm<MedicalHistoryForm>({
    resolver: zodResolver(medicalHistorySchema),
    defaultValues: {
      condition: '',
      type: undefined,
      dateOccurred: '',
      status: undefined,
      description: '',
      treatment: '',
      notes: '',
    },
  });

  const addHistoryMutation = useMutation({
    mutationFn: (data: MedicalHistoryForm) =>
      apiRequest(`/api/patients/${patientId}/medical-history`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/medical-history`] });
      setIsAddModalOpen(false);
      form.reset();
    },
  });

  const deleteHistoryMutation = useMutation({
    mutationFn: (historyId: number) =>
      apiRequest(`/api/patients/${patientId}/medical-history/${historyId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/medical-history`] });
    },
  });

  const onSubmit = (data: MedicalHistoryForm) => {
    addHistoryMutation.mutate(data);
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
            <History className="mr-2 h-5 w-5" />
            Past Medical History
          </span>
          {canEdit && (
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Record
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Medical History Record</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition/Diagnosis</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Hypertension, Appendectomy" {...field} />
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
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="diagnosis">Diagnosis</SelectItem>
                              <SelectItem value="surgery">Surgery</SelectItem>
                              <SelectItem value="hospitalization">Hospitalization</SelectItem>
                              <SelectItem value="chronic_condition">Chronic Condition</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateOccurred"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Occurred</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="ongoing">Ongoing</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Detailed description of the condition or procedure" 
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
                      name="treatment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treatment (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Treatment received or ongoing" {...field} />
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
                              placeholder="Additional information or follow-up notes" 
                              rows={2}
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
                        disabled={addHistoryMutation.isPending}
                      >
                        {addHistoryMutation.isPending ? 'Adding...' : 'Add Record'}
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
        {medicalHistory && medicalHistory.length > 0 ? (
          <div className="space-y-4">
            {medicalHistory.map((record) => (
              <div key={record.id} className="border rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900 flex items-center">
                        <span className="mr-2 text-lg">{getTypeIcon(record.type)}</span>
                        {record.condition}
                      </h4>
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteHistoryMutation.mutate(record.id)}
                          className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="capitalize">
                        {record.type.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${getStatusColor(record.status)}`}
                      >
                        {record.status}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(record.dateOccurred).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-slate-700">
                        <strong>Description:</strong> {record.description}
                      </p>
                    </div>

                    {record.treatment && (
                      <div className="mt-2">
                        <p className="text-sm text-slate-700">
                          <strong>Treatment:</strong> {record.treatment}
                        </p>
                      </div>
                    )}

                    {record.notes && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p className="text-sm text-gray-700">
                          <strong>Notes:</strong> {record.notes}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-slate-500 mt-2">
                      Recorded: {new Date(record.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <History className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No medical history recorded</p>
            <p className="text-sm">Add past medical history for comprehensive care</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}