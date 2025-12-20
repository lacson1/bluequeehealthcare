import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { 
  History, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Stethoscope, 
  Scissors, 
  Building, 
  Activity,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Pill,
  Printer
} from 'lucide-react';
import { printWithBranding, type Organization } from './print-export-utils';
import { useAuth } from '@/contexts/AuthContext';

interface MedicalHistory {
  id: number;
  patientId: number;
  condition: string;
  type: string;
  dateOccurred: string;
  status: string;
  description: string;
  treatment?: string;
  notes?: string;
  createdAt?: string;
}

interface PatientHistoryTabProps {
  patientId: number;
}

const historyFormSchema = z.object({
  condition: z.string().min(1, 'Condition name is required'),
  type: z.enum(['diagnosis', 'surgery', 'hospitalization', 'chronic_condition']),
  dateOccurred: z.string().min(1, 'Date is required'),
  status: z.enum(['active', 'resolved', 'ongoing']),
  description: z.string().min(1, 'Description is required'),
  treatment: z.string().optional(),
  notes: z.string().optional(),
});

type HistoryFormValues = z.infer<typeof historyFormSchema>;

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
}

export function PatientHistoryTab({ patientId }: PatientHistoryTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<MedicalHistory | null>(null);

  const { data: historyRecords = [], isLoading, isError, refetch } = useQuery<MedicalHistory[]>({
    queryKey: [`/api/patients/${patientId}/medical-history`],
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!patientId,
  });

  // Fetch patient data
  const { data: patient } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  // Fetch organization data for print header
  const { data: organization } = useQuery<Organization>({
    queryKey: ['/api/organizations', (user as any)?.organizationId],
    queryFn: () => fetch(`/api/organizations/${(user as any)?.organizationId}`).then(res => res.json()),
    enabled: !!(user as any)?.organizationId,
  });

  // Print medical history with organization header
  const handlePrintMedicalHistory = () => {
    if (!organization || !patient) {
      toast({
        title: "Cannot Print",
        description: "Organization or patient data not available",
        variant: "destructive"
      });
      return;
    }

    const recordsToDisplay = activeTab === 'all' 
      ? historyRecords 
      : historyRecords.filter(h => h.type === activeTab);

    const getTypeLabel = (type: string) => {
      const labels: Record<string, string> = {
        diagnosis: 'Diagnosis',
        surgery: 'Surgery',
        hospitalization: 'Hospitalization',
        chronic_condition: 'Chronic Condition'
      };
      return labels[type] || type;
    };

    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
        active: 'Active',
        resolved: 'Resolved',
        ongoing: 'Ongoing'
      };
      return labels[status] || status;
    };

    const getStatusColor = (status: string) => {
      const colors: Record<string, string> = {
        active: '#EF4444',
        resolved: '#22C55E',
        ongoing: '#3B82F6'
      };
      return colors[status] || '#6B7280';
    };

    const getTypeColor = (type: string) => {
      const colors: Record<string, string> = {
        diagnosis: '#3B82F6',
        surgery: '#8B5CF6',
        hospitalization: '#F97316',
        chronic_condition: '#EF4444'
      };
      return colors[type] || '#6B7280';
    };

    const contentHTML = `
      <div style="padding: 20px;">
        <!-- Patient Information -->
        <div style="background: #F8FAFC; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid ${organization.themeColor || '#3B82F6'};">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #374151;">Patient Information</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
            <div><strong>Name:</strong> ${patient.firstName} ${patient.lastName}</div>
            ${patient.dateOfBirth ? `<div><strong>Date of Birth:</strong> ${new Date(patient.dateOfBirth).toLocaleDateString()}</div>` : ''}
            ${patient.gender ? `<div><strong>Gender:</strong> ${patient.gender}</div>` : ''}
            ${patient.phoneNumber ? `<div><strong>Phone:</strong> ${patient.phoneNumber}</div>` : ''}
          </div>
        </div>

        <!-- Medical History Summary -->
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1F2937; border-bottom: 2px solid ${organization.themeColor || '#3B82F6'}; padding-bottom: 8px;">
            Medical History Summary
          </h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;">
            <div style="background: #EFF6FF; padding: 12px; border-radius: 6px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #3B82F6;">${historyRecords.filter(h => h.type === 'diagnosis').length}</div>
              <div style="font-size: 12px; color: #6B7280;">Diagnoses</div>
            </div>
            <div style="background: #F3E8FF; padding: 12px; border-radius: 6px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #8B5CF6;">${historyRecords.filter(h => h.type === 'surgery').length}</div>
              <div style="font-size: 12px; color: #6B7280;">Surgeries</div>
            </div>
            <div style="background: #FFF7ED; padding: 12px; border-radius: 6px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #F97316;">${historyRecords.filter(h => h.type === 'hospitalization').length}</div>
              <div style="font-size: 12px; color: #6B7280;">Hospitalizations</div>
            </div>
            <div style="background: #FEF2F2; padding: 12px; border-radius: 6px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #EF4444;">${historyRecords.filter(h => h.type === 'chronic_condition').length}</div>
              <div style="font-size: 12px; color: #6B7280;">Chronic</div>
            </div>
          </div>
        </div>

        <!-- Medical History Records -->
        <div>
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1F2937;">
            ${activeTab === 'all' ? 'All Medical History Records' : getTypeLabel(activeTab) + ' Records'} (${recordsToDisplay.length})
          </h3>
          
          ${recordsToDisplay.length === 0 ? `
            <div style="text-align: center; padding: 40px; color: #6B7280; background: #F9FAFB; border-radius: 8px;">
              <p style="margin: 0;">No medical history records found</p>
            </div>
          ` : recordsToDisplay.map(record => `
            <div style="border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin-bottom: 16px; border-left: 4px solid ${getTypeColor(record.type)};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                  <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1F2937;">${record.condition}</h4>
                  <div style="display: flex; gap: 12px; font-size: 12px; color: #6B7280;">
                    <span style="background: ${getTypeColor(record.type)}20; color: ${getTypeColor(record.type)}; padding: 2px 8px; border-radius: 4px;">${getTypeLabel(record.type)}</span>
                    <span style="background: ${getStatusColor(record.status)}20; color: ${getStatusColor(record.status)}; padding: 2px 8px; border-radius: 4px;">${getStatusLabel(record.status)}</span>
                  </div>
                </div>
                <div style="font-size: 12px; color: #6B7280;">
                  ${format(parseISO(record.dateOccurred), 'MMMM d, yyyy')}
                </div>
              </div>
              
              <div style="margin-bottom: 8px;">
                <strong style="font-size: 12px; color: #6B7280;">Description:</strong>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #374151;">${record.description}</p>
              </div>
              
              ${record.treatment ? `
                <div style="margin-bottom: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
                  <strong style="font-size: 12px; color: #6B7280;">Treatment:</strong>
                  <p style="margin: 4px 0 0 0; font-size: 14px; color: #374151;">${record.treatment}</p>
                </div>
              ` : ''}
              
              ${record.notes ? `
                <div style="background: #F9FAFB; padding: 8px; border-radius: 4px; margin-top: 8px;">
                  <strong style="font-size: 12px; color: #6B7280;">Notes:</strong>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #6B7280; font-style: italic;">${record.notes}</p>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Footer Note -->
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; text-align: center;">
          <p style="margin: 0;">This is a confidential medical record. Handle in accordance with patient privacy regulations.</p>
          <p style="margin: 4px 0 0 0;">Generated on ${format(new Date(), 'MMMM d, yyyy')} at ${format(new Date(), 'h:mm a')}</p>
        </div>
      </div>
    `;

    printWithBranding(
      organization,
      {
        documentTitle: 'Medical History Report',
        documentId: `MH-${patient.id}-${Date.now()}`,
        pageSize: 'A4',
        showFooter: true
      },
      contentHTML
    );

    toast({
      title: "Print Initiated",
      description: "Medical history report sent to printer"
    });
  };

  const form = useForm<HistoryFormValues>({
    resolver: zodResolver(historyFormSchema),
    defaultValues: {
      condition: '',
      type: 'diagnosis',
      dateOccurred: '',
      status: 'active',
      description: '',
      treatment: '',
      notes: '',
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: HistoryFormValues) => {
      return apiRequest(`/api/patients/${patientId}/medical-history`, 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/medical-history`] });
      toast({ title: "Success", description: "Medical history entry added successfully" });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add medical history entry", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: HistoryFormValues }) => {
      return apiRequest(`/api/patients/${patientId}/medical-history/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/medical-history`] });
      toast({ title: "Success", description: "Medical history entry updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedHistory(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update medical history entry", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/patients/${patientId}/medical-history/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/medical-history`] });
      toast({ title: "Success", description: "Medical history entry deleted successfully" });
      setIsDeleteDialogOpen(false);
      setSelectedHistory(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete medical history entry", variant: "destructive" });
    },
  });

  const diagnoses = historyRecords.filter(h => h.type === 'diagnosis');
  const surgeries = historyRecords.filter(h => h.type === 'surgery');
  const hospitalizations = historyRecords.filter(h => h.type === 'hospitalization');
  const chronicConditions = historyRecords.filter(h => h.type === 'chronic_condition');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'diagnosis':
        return <Stethoscope className="w-5 h-5 text-blue-600" />;
      case 'surgery':
        return <Scissors className="w-5 h-5 text-purple-600" />;
      case 'hospitalization':
        return <Building className="w-5 h-5 text-orange-600" />;
      case 'chronic_condition':
        return <Activity className="w-5 h-5 text-red-600" />;
      default:
        return <History className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'diagnosis':
        return <Badge className="bg-blue-100 text-blue-800">Diagnosis</Badge>;
      case 'surgery':
        return <Badge className="bg-purple-100 text-purple-800">Surgery</Badge>;
      case 'hospitalization':
        return <Badge className="bg-orange-100 text-orange-800">Hospitalization</Badge>;
      case 'chronic_condition':
        return <Badge className="bg-red-100 text-red-800">Chronic Condition</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Active</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Resolved</Badge>;
      case 'ongoing':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1"><Clock className="w-3 h-3" /> Ongoing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleEdit = (history: MedicalHistory) => {
    setSelectedHistory(history);
    form.reset({
      condition: history.condition,
      type: history.type as 'diagnosis' | 'surgery' | 'hospitalization' | 'chronic_condition',
      dateOccurred: history.dateOccurred,
      status: history.status as 'active' | 'resolved' | 'ongoing',
      description: history.description,
      treatment: history.treatment || '',
      notes: history.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (history: MedicalHistory) => {
    setSelectedHistory(history);
    setIsDeleteDialogOpen(true);
  };

  const onSubmitAdd = (data: HistoryFormValues) => {
    addMutation.mutate(data);
  };

  const onSubmitEdit = (data: HistoryFormValues) => {
    if (selectedHistory) {
      updateMutation.mutate({ id: selectedHistory.id, data });
    }
  };

  const renderHistoryCard = (history: MedicalHistory) => (
    <Card key={history.id} className="mb-4" data-testid={`history-card-${history.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {getTypeIcon(history.type)}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{history.condition}</CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(parseISO(history.dateOccurred), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getTypeBadge(history.type)}
            {getStatusBadge(history.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid={`history-menu-${history.id}`}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(history)} data-testid={`edit-history-${history.id}`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Entry
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDelete(history)} 
                  className="text-red-600"
                  data-testid={`delete-history-${history.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Entry
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3" /> Description
            </p>
            <p className="text-sm">{history.description}</p>
          </div>

          {history.treatment && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Pill className="w-3 h-3" /> Treatment
              </p>
              <p className="text-sm">{history.treatment}</p>
            </div>
          )}

          {history.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-muted-foreground">{history.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (type: string) => {
    const typeLabels: Record<string, string> = {
      all: 'medical history entries',
      diagnosis: 'diagnoses',
      surgery: 'surgeries',
      hospitalization: 'hospitalizations',
      chronic_condition: 'chronic conditions',
    };

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" data-testid={`empty-${type}-history`}>
        <History className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No {typeLabels[type] || type}
        </h3>
        <p className="text-sm text-gray-500 mb-4 max-w-md">
          {type === 'all' 
            ? 'Add medical history entries to maintain a complete patient record.' 
            : `No ${typeLabels[type] || type} recorded for this patient.`}
        </p>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-history-empty" title="Add Medical History">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  const renderForm = (isEdit: boolean) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(isEdit ? onSubmitEdit : onSubmitAdd)} className="space-y-4">
        <FormField
          control={form.control}
          name="condition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condition / Procedure Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Type 2 Diabetes, Appendectomy" {...field} data-testid="input-condition" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-type">
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
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="dateOccurred"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} data-testid="input-date-occurred" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the condition, symptoms, diagnosis details, or procedure..." 
                  {...field} 
                  data-testid="input-description"
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
              <FormLabel>Treatment</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Treatment plan, medications, interventions..." 
                  {...field} 
                  data-testid="input-treatment"
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes or observations..." 
                  {...field} 
                  data-testid="input-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => isEdit ? setIsEditDialogOpen(false) : setIsAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={addMutation.isPending || updateMutation.isPending} data-testid="button-submit-history">
            {(addMutation.isPending || updateMutation.isPending) ? 'Saving...' : (isEdit ? 'Update Entry' : 'Add Entry')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-500">Loading medical history...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="text-red-500">Failed to load medical history</div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Loading
        </Button>
      </div>
    );
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger 
              value="all" 
              className="flex items-center gap-1 data-[state=active]:bg-gray-100"
              data-testid="tab-all-history"
            >
              <History className="w-4 h-4" />
              All ({historyRecords.length})
            </TabsTrigger>
            <TabsTrigger 
              value="diagnosis" 
              className="flex items-center gap-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              data-testid="tab-diagnoses"
            >
              <Stethoscope className="w-4 h-4" />
              Diagnoses ({diagnoses.length})
            </TabsTrigger>
            <TabsTrigger 
              value="surgery" 
              className="flex items-center gap-1 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
              data-testid="tab-surgeries"
            >
              <Scissors className="w-4 h-4" />
              Surgeries ({surgeries.length})
            </TabsTrigger>
            <TabsTrigger 
              value="hospitalization" 
              className="flex items-center gap-1 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700"
              data-testid="tab-hospitalizations"
            >
              <Building className="w-4 h-4" />
              Hospital ({hospitalizations.length})
            </TabsTrigger>
            <TabsTrigger 
              value="chronic_condition" 
              className="flex items-center gap-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-700"
              data-testid="tab-chronic"
            >
              <Activity className="w-4 h-4" />
              Chronic ({chronicConditions.length})
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrintMedicalHistory}
              disabled={historyRecords.length === 0}
              data-testid="button-print-history"
              title="Print Medical History"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-history">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-history">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          {historyRecords.length > 0 ? (
            <div>{historyRecords.map(renderHistoryCard)}</div>
          ) : renderEmptyState('all')}
        </TabsContent>

        <TabsContent value="diagnosis" className="space-y-4">
          {diagnoses.length > 0 ? (
            <div>{diagnoses.map(renderHistoryCard)}</div>
          ) : renderEmptyState('diagnosis')}
        </TabsContent>

        <TabsContent value="surgery" className="space-y-4">
          {surgeries.length > 0 ? (
            <div>{surgeries.map(renderHistoryCard)}</div>
          ) : renderEmptyState('surgery')}
        </TabsContent>

        <TabsContent value="hospitalization" className="space-y-4">
          {hospitalizations.length > 0 ? (
            <div>{hospitalizations.map(renderHistoryCard)}</div>
          ) : renderEmptyState('hospitalization')}
        </TabsContent>

        <TabsContent value="chronic_condition" className="space-y-4">
          {chronicConditions.length > 0 ? (
            <div>{chronicConditions.map(renderHistoryCard)}</div>
          ) : renderEmptyState('chronic_condition')}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Add Medical History
            </DialogTitle>
            <DialogDescription>
              Add a new medical history entry for this patient.
            </DialogDescription>
          </DialogHeader>
          {renderForm(false)}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit Medical History
            </DialogTitle>
            <DialogDescription>
              Update medical history entry.
            </DialogDescription>
          </DialogHeader>
          {renderForm(true)}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Medical History Entry
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this medical history entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedHistory && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(selectedHistory.type)}
                  <p className="font-medium">{selectedHistory.condition}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(selectedHistory.dateOccurred), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedHistory && deleteMutation.mutate(selectedHistory.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-history"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
