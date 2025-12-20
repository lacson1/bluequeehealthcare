import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import {
  FileText,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  User,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  Pill,
  ClipboardList,
  Send,
  Eye,
  Printer,
  Activity,
  HeartPulse,
  Sparkles,
  Loader2
} from 'lucide-react';

interface Prescription {
  id: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration?: string;
  status: string;
}

interface MedicalHistoryItem {
  id: number;
  condition: string;
  type: string;
  status: string;
  description: string;
  treatment?: string;
  dateOccurred: string;
}

interface Visit {
  id: number;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  visitDate: string;
  status: string;
}

interface DischargeLetter {
  id: number;
  patientId: number;
  visitId?: number;
  admissionDate: string;
  dischargeDate: string;
  diagnosis: string;
  treatmentSummary: string;
  medicationsOnDischarge?: string;
  followUpInstructions?: string;
  followUpDate?: string;
  dischargeCondition: string;
  specialInstructions?: string;
  restrictions?: string;
  dietaryAdvice?: string;
  warningSymptoms?: string;
  emergencyContact?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  attendingPhysician?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

interface PatientDischargeLetterTabProps {
  patientId: number;
  patientName?: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
}

const dischargeLetterFormSchema = z.object({
  admissionDate: z.string().min(1, 'Admission date is required'),
  dischargeDate: z.string().min(1, 'Discharge date is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  treatmentSummary: z.string().min(1, 'Treatment summary is required'),
  medicationsOnDischarge: z.string().optional(),
  followUpInstructions: z.string().optional(),
  followUpDate: z.string().optional(),
  dischargeCondition: z.enum(['improved', 'stable', 'unchanged', 'critical', 'deceased']),
  specialInstructions: z.string().optional(),
  restrictions: z.string().optional(),
  dietaryAdvice: z.string().optional(),
  warningSymptoms: z.string().optional(),
  emergencyContact: z.string().optional(),
  status: z.enum(['draft', 'finalized', 'sent']).default('draft'),
  visitId: z.number().optional(),
});

type DischargeLetterFormValues = z.infer<typeof dischargeLetterFormSchema>;

export function PatientDischargeLetterTab({
  patientId,
  patientName = 'Patient',
  clinicName = 'Bluequee Health Clinic',
  clinicAddress = 'Southwest Nigeria',
  clinicPhone = ''
}: PatientDischargeLetterTabProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<DischargeLetter | null>(null);

  // Fetch patient's prescriptions for auto-populate
  const { data: patientPrescriptions, isLoading: loadingPrescriptions } = useQuery<Prescription[]>({
    queryKey: [`/api/patients/${patientId}/prescriptions`],
    enabled: !!patientId
  });

  // Fetch patient's medical history for auto-populate
  const { data: patientMedicalHistory, isLoading: loadingHistory } = useQuery<MedicalHistoryItem[]>({
    queryKey: [`/api/patients/${patientId}/medical-history`],
    enabled: !!patientId
  });

  // Fetch patient's recent visits for diagnosis and treatment info
  const { data: patientVisits, isLoading: loadingVisits } = useQuery<Visit[]>({
    queryKey: [`/api/patients/${patientId}/visits`],
    enabled: !!patientId
  });

  const isAutoPopulateLoading = loadingPrescriptions || loadingHistory || loadingVisits;

  const handlePrintLetter = (letter: DischargeLetter) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Could not open print window. Please allow popups.",
        variant: "destructive"
      });
      return;
    }

    const physicianName = letter.attendingPhysician
      ? `Dr. ${letter.attendingPhysician.firstName || ''} ${letter.attendingPhysician.lastName || letter.attendingPhysician.username}`.trim()
      : 'Attending Physician';

    const getConditionLabel = (condition: string) => {
      const labels: Record<string, string> = {
        improved: 'Improved',
        stable: 'Stable',
        unchanged: 'Unchanged',
        critical: 'Critical',
        deceased: 'Deceased'
      };
      return labels[condition] || condition;
    };

    const formatDate = (dateStr: string) => {
      try {
        return format(parseISO(dateStr), 'MMMM d, yyyy');
      } catch {
        return dateStr;
      }
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Discharge Letter - ${patientName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Times New Roman', Times, serif; 
            line-height: 1.6; 
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #0d9488;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .clinic-logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 10px;
            background: linear-gradient(135deg, #0d9488, #14b8a6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: bold;
          }
          .clinic-name {
            font-size: 28px;
            font-weight: bold;
            color: #0d9488;
            margin-bottom: 5px;
          }
          .clinic-info {
            font-size: 14px;
            color: #666;
          }
          .document-title {
            font-size: 22px;
            font-weight: bold;
            text-align: center;
            margin: 25px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #1f2937;
          }
          .patient-info {
            background: #f8fafc;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #0d9488;
          }
          .patient-info h3 {
            color: #0d9488;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .info-row {
            display: flex;
            gap: 40px;
            margin-bottom: 8px;
          }
          .info-item {
            flex: 1;
          }
          .info-label {
            font-weight: bold;
            color: #4b5563;
            font-size: 12px;
            text-transform: uppercase;
          }
          .info-value {
            font-size: 14px;
            color: #1f2937;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: bold;
            color: #0d9488;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
          }
          .section-content {
            font-size: 14px;
            white-space: pre-wrap;
            padding: 10px;
            background: #fafafa;
            border-radius: 4px;
          }
          .warning-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .warning-title {
            color: #dc2626;
            font-weight: bold;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .warning-content {
            color: #7f1d1d;
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
          }
          .signature-box {
            text-align: center;
            width: 45%;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 50px;
            padding-top: 5px;
          }
          .date-printed {
            text-align: right;
            font-size: 12px;
            color: #666;
            margin-top: 30px;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-logo">B</div>
          <div class="clinic-name">${clinicName}</div>
          <div class="clinic-info">
            ${clinicAddress}${clinicPhone ? ` | Tel: ${clinicPhone}` : ''}
          </div>
        </div>

        <div class="document-title">Discharge Summary Letter</div>

        <div class="patient-info">
          <h3>Patient Information</h3>
          <div class="info-row">
            <div class="info-item">
              <div class="info-label">Patient Name</div>
              <div class="info-value">${patientName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Condition at Discharge</div>
              <div class="info-value">${getConditionLabel(letter.dischargeCondition)}</div>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <div class="info-label">Admission Date</div>
              <div class="info-value">${formatDate(letter.admissionDate)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Discharge Date</div>
              <div class="info-value">${formatDate(letter.dischargeDate)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Diagnosis</div>
          <div class="section-content">${letter.diagnosis}</div>
        </div>

        <div class="section">
          <div class="section-title">Treatment Summary</div>
          <div class="section-content">${letter.treatmentSummary}</div>
        </div>

        ${letter.medicationsOnDischarge ? `
        <div class="section">
          <div class="section-title">Medications on Discharge</div>
          <div class="section-content">${letter.medicationsOnDischarge}</div>
        </div>
        ` : ''}

        ${letter.followUpInstructions ? `
        <div class="section">
          <div class="section-title">Follow-up Instructions</div>
          <div class="section-content">${letter.followUpInstructions}</div>
        </div>
        ` : ''}

        ${letter.followUpDate ? `
        <div class="section">
          <div class="section-title">Follow-up Appointment</div>
          <div class="section-content">${formatDate(letter.followUpDate)}</div>
        </div>
        ` : ''}

        ${letter.specialInstructions ? `
        <div class="section">
          <div class="section-title">Special Instructions</div>
          <div class="section-content">${letter.specialInstructions}</div>
        </div>
        ` : ''}

        ${letter.restrictions ? `
        <div class="section">
          <div class="section-title">Activity Restrictions</div>
          <div class="section-content">${letter.restrictions}</div>
        </div>
        ` : ''}

        ${letter.dietaryAdvice ? `
        <div class="section">
          <div class="section-title">Dietary Advice</div>
          <div class="section-content">${letter.dietaryAdvice}</div>
        </div>
        ` : ''}

        ${letter.warningSymptoms ? `
        <div class="warning-box">
          <div class="warning-title">⚠️ Warning Symptoms - Seek Immediate Medical Attention If:</div>
          <div class="warning-content">${letter.warningSymptoms}</div>
        </div>
        ` : ''}

        ${letter.emergencyContact ? `
        <div class="section">
          <div class="section-title">Emergency Contact</div>
          <div class="section-content">${letter.emergencyContact}</div>
        </div>
        ` : ''}

        <div class="footer">
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">${physicianName}</div>
              <div style="font-size: 12px; color: #666;">Attending Physician</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">Date</div>
              <div style="font-size: 12px; color: #666;">${formatDate(letter.dischargeDate)}</div>
            </div>
          </div>
        </div>

        <div class="date-printed">
          Document printed on: ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const { data: letters = [], isLoading, isError, refetch } = useQuery<DischargeLetter[]>({
    queryKey: [`/api/patients/${patientId}/discharge-letters`],
  });

  const form = useForm<DischargeLetterFormValues>({
    resolver: zodResolver(dischargeLetterFormSchema),
    defaultValues: {
      admissionDate: '',
      dischargeDate: '',
      diagnosis: '',
      treatmentSummary: '',
      medicationsOnDischarge: '',
      followUpInstructions: '',
      followUpDate: '',
      dischargeCondition: 'improved',
      specialInstructions: '',
      restrictions: '',
      dietaryAdvice: '',
      warningSymptoms: '',
      emergencyContact: '',
      status: 'draft',
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: DischargeLetterFormValues) => {
      return apiRequest(`/api/patients/${patientId}/discharge-letters`, 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/discharge-letters`] });
      toast({ title: "Success", description: "Discharge letter created successfully" });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create discharge letter", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: DischargeLetterFormValues }) => {
      return apiRequest(`/api/patients/${patientId}/discharge-letters/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/discharge-letters`] });
      toast({ title: "Success", description: "Discharge letter updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedLetter(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update discharge letter", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/patients/${patientId}/discharge-letters/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/discharge-letters`] });
      toast({ title: "Success", description: "Discharge letter deleted successfully" });
      setIsDeleteDialogOpen(false);
      setSelectedLetter(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete discharge letter", variant: "destructive" });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/patients/${patientId}/discharge-letters/${id}`, 'PATCH', { status: 'finalized' });
      // Try to parse JSON, but don't fail if empty
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/discharge-letters`] });
      toast({ title: "Success", description: "Discharge letter finalized successfully" });
    },
    onError: (error: Error) => {
      console.error('Finalize mutation error:', error);
      const errorMessage = error.message?.replace(/^\d+:\s*/, '') || "Failed to finalize discharge letter";
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    },
  });

  const handleEditClick = (letter: DischargeLetter) => {
    setSelectedLetter(letter);
    form.reset({
      admissionDate: letter.admissionDate,
      dischargeDate: letter.dischargeDate,
      diagnosis: letter.diagnosis,
      treatmentSummary: letter.treatmentSummary,
      medicationsOnDischarge: letter.medicationsOnDischarge || '',
      followUpInstructions: letter.followUpInstructions || '',
      followUpDate: letter.followUpDate || '',
      dischargeCondition: letter.dischargeCondition as any,
      specialInstructions: letter.specialInstructions || '',
      restrictions: letter.restrictions || '',
      dietaryAdvice: letter.dietaryAdvice || '',
      warningSymptoms: letter.warningSymptoms || '',
      emergencyContact: letter.emergencyContact || '',
      status: letter.status as any,
    });
    setIsEditDialogOpen(true);
  };

  const handleViewClick = (letter: DischargeLetter) => {
    setSelectedLetter(letter);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (letter: DischargeLetter) => {
    setSelectedLetter(letter);
    setIsDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    form.reset({
      admissionDate: '',
      dischargeDate: format(new Date(), 'yyyy-MM-dd'),
      diagnosis: '',
      treatmentSummary: '',
      medicationsOnDischarge: '',
      followUpInstructions: '',
      followUpDate: '',
      dischargeCondition: 'improved',
      specialInstructions: '',
      restrictions: '',
      dietaryAdvice: '',
      warningSymptoms: '',
      emergencyContact: '',
      status: 'draft',
    });
    setIsAddDialogOpen(true);
  };

  // Function to auto-populate form fields from patient data
  const autoPopulateForm = () => {
    let populatedFields = 0;

    // Auto-populate diagnosis from recent visits or medical history
    const recentVisit = patientVisits?.[0];
    const activeConditions = patientMedicalHistory?.filter(h => h.status === 'active') || [];
    
    if (recentVisit?.diagnosis || activeConditions.length > 0) {
      let diagnosisText = '';
      if (recentVisit?.diagnosis) {
        diagnosisText = recentVisit.diagnosis;
      }
      if (activeConditions.length > 0) {
        const conditionsList = activeConditions.map(c => `• ${c.condition}`).join('\n');
        diagnosisText = diagnosisText 
          ? `${diagnosisText}\n\nActive Conditions:\n${conditionsList}`
          : conditionsList;
      }
      form.setValue('diagnosis', diagnosisText);
      populatedFields++;
    }

    // Auto-populate treatment summary from recent visits
    if (recentVisit?.treatment || recentVisit?.notes) {
      const treatmentText = [recentVisit.treatment, recentVisit.notes]
        .filter(Boolean)
        .join('\n\n');
      if (treatmentText) {
        form.setValue('treatmentSummary', treatmentText);
        populatedFields++;
      }
    }

    // Auto-populate medications from active prescriptions
    if (patientPrescriptions && patientPrescriptions.length > 0) {
      const activeMeds = patientPrescriptions
        .filter(p => p.status === 'active')
        .map(p => `• ${p.medicationName} ${p.dosage} - ${p.frequency}${p.duration ? ` for ${p.duration}` : ''}`)
        .join('\n');
      
      if (activeMeds) {
        form.setValue('medicationsOnDischarge', activeMeds);
        populatedFields++;
      }
    }

    // Auto-populate admission date from earliest recent visit if available
    if (recentVisit?.visitDate) {
      form.setValue('admissionDate', recentVisit.visitDate.split('T')[0]);
      populatedFields++;
    }

    if (populatedFields > 0) {
      toast({
        title: "Form Auto-Populated",
        description: `Successfully filled ${populatedFields} field(s) from patient records.`,
      });
    } else {
      toast({
        title: "No Data Found",
        description: "No medical records found to auto-populate. You can fill in the fields manually.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: DischargeLetterFormValues) => {
    if (selectedLetter) {
      updateMutation.mutate({ id: selectedLetter.id, data });
    } else {
      addMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'finalized':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Finalized</Badge>;
      case 'sent':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Send className="w-3 h-3 mr-1" />Sent</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'improved':
        return <Badge className="bg-green-500"><HeartPulse className="w-3 h-3 mr-1" />Improved</Badge>;
      case 'stable':
        return <Badge className="bg-blue-500"><Activity className="w-3 h-3 mr-1" />Stable</Badge>;
      case 'unchanged':
        return <Badge variant="secondary"><Activity className="w-3 h-3 mr-1" />Unchanged</Badge>;
      case 'critical':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Critical</Badge>;
      case 'deceased':
        return <Badge className="bg-gray-600">Deceased</Badge>;
      default:
        return <Badge variant="outline">{condition}</Badge>;
    }
  };

  const filteredLetters = letters.filter(letter => {
    if (activeTab === 'all') return true;
    return letter.status === activeTab;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <p className="text-gray-600">Failed to load discharge letters</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const renderForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Auto-populate button */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-teal-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <Sparkles className="w-4 h-4" />
              <span>Auto-fill from {patientName}'s medical records</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={autoPopulateForm}
              disabled={isAutoPopulateLoading}
              className="bg-white hover:bg-purple-50 border-purple-300"
            >
              {isAutoPopulateLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
              )}
              Auto-Fill
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="admissionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Admission Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-admission-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dischargeDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discharge Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-discharge-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="diagnosis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Diagnosis *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Primary and secondary diagnoses"
                  className="min-h-[80px]"
                  {...field}
                  data-testid="input-diagnosis"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="treatmentSummary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Treatment Summary *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Summary of treatment provided during admission"
                  className="min-h-[100px]"
                  {...field}
                  data-testid="input-treatment-summary"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dischargeCondition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discharge Condition *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-discharge-condition">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="improved">Improved</SelectItem>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="unchanged">Unchanged</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="deceased">Deceased</SelectItem>
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
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="finalized">Finalized</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="medicationsOnDischarge"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medications on Discharge</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List of medications prescribed at discharge with dosages"
                  className="min-h-[80px]"
                  {...field}
                  data-testid="input-medications"
                />
              </FormControl>
              <FormDescription>Include medication names, dosages, and instructions</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="followUpDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Follow-up Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-followup-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emergencyContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact</FormLabel>
                <FormControl>
                  <Input placeholder="Emergency phone number" {...field} data-testid="input-emergency-contact" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="followUpInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Follow-up Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Instructions for follow-up care"
                  className="min-h-[80px]"
                  {...field}
                  data-testid="input-followup-instructions"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special care instructions for the patient"
                  className="min-h-[60px]"
                  {...field}
                  data-testid="input-special-instructions"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="restrictions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Restrictions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Activity limitations and restrictions"
                  className="min-h-[60px]"
                  {...field}
                  data-testid="input-restrictions"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dietaryAdvice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dietary Advice</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Dietary recommendations and restrictions"
                  className="min-h-[60px]"
                  {...field}
                  data-testid="input-dietary-advice"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="warningSymptoms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Warning Symptoms</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Symptoms that require immediate medical attention"
                  className="min-h-[60px]"
                  {...field}
                  data-testid="input-warning-symptoms"
                />
              </FormControl>
              <FormDescription>List symptoms that should prompt the patient to seek emergency care</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
              form.reset();
            }}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={addMutation.isPending || updateMutation.isPending}
            data-testid="button-submit"
          >
            {addMutation.isPending || updateMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : selectedLetter ? 'Update Letter' : 'Create Letter'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  const renderLetterCard = (letter: DischargeLetter) => (
    <Card key={letter.id} className="hover:shadow-md transition-shadow" data-testid={`card-discharge-letter-${letter.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <CardTitle className="text-lg">
                Discharge Letter
              </CardTitle>
              {getStatusBadge(letter.status)}
            </div>
            <CardDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Discharged: {format(parseISO(letter.dischargeDate), 'MMM d, yyyy')}
              </span>
              {letter.attendingPhysician && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Dr. {letter.attendingPhysician.lastName || letter.attendingPhysician.username}
                </span>
              )}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid={`button-menu-${letter.id}`}>
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewClick(letter)} data-testid={`button-view-${letter.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditClick(letter)} data-testid={`button-edit-${letter.id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {letter.status === 'draft' && (
                <DropdownMenuItem onClick={() => finalizeMutation.mutate(letter.id)} data-testid={`button-finalize-${letter.id}`}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Finalize
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handlePrintLetter(letter)} data-testid={`button-print-${letter.id}`}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(letter)}
                className="text-red-600"
                data-testid={`button-delete-${letter.id}`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {getConditionBadge(letter.dischargeCondition)}
          <span className="text-sm text-gray-500">
            Admission: {format(parseISO(letter.admissionDate), 'MMM d, yyyy')}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <ClipboardList className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Diagnosis</p>
              <p className="text-sm text-gray-600 line-clamp-2">{letter.diagnosis}</p>
            </div>
          </div>

          {letter.medicationsOnDischarge && (
            <div className="flex items-start gap-2">
              <Pill className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Medications</p>
                <p className="text-sm text-gray-600 line-clamp-2">{letter.medicationsOnDischarge}</p>
              </div>
            </div>
          )}

          {letter.followUpDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">
                Follow-up: {format(parseISO(letter.followUpDate), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Discharge Letters</h3>
          <p className="text-sm text-gray-500">Manage patient discharge documentation</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddNew} className="bg-teal-600 hover:bg-teal-700" data-testid="button-add-discharge-letter">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-md bg-gradient-to-r from-slate-50 to-teal-50">
          <TabsTrigger value="all" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white">
            All ({letters.length})
          </TabsTrigger>
          <TabsTrigger value="draft" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            Drafts ({letters.filter(l => l.status === 'draft').length})
          </TabsTrigger>
          <TabsTrigger value="finalized" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
            Finalized ({letters.filter(l => l.status === 'finalized').length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Sent ({letters.filter(l => l.status === 'sent').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredLetters.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Discharge Letters</h3>
          <p className="text-sm text-gray-500 mb-4">
            {activeTab === 'all'
              ? 'Create a discharge letter to document patient discharge information'
              : `No ${activeTab} discharge letters found`}
          </p>
          <Button onClick={handleAddNew} className="bg-teal-600 hover:bg-teal-700" data-testid="button-add-first-discharge-letter" title="Create Discharge Letter">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredLetters.map(renderLetterCard)}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              New Discharge Letter
            </DialogTitle>
            <DialogDescription>
              Create a new discharge letter for this patient
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-teal-600" />
              Edit Discharge Letter
            </DialogTitle>
            <DialogDescription>
              Update the discharge letter details
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Discharge Letter Details
            </DialogTitle>
          </DialogHeader>
          {selectedLetter && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedLetter.status)}
                {getConditionBadge(selectedLetter.dischargeCondition)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Admission Date</p>
                  <p className="text-base">{format(parseISO(selectedLetter.admissionDate), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Discharge Date</p>
                  <p className="text-base">{format(parseISO(selectedLetter.dischargeDate), 'MMMM d, yyyy')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Diagnosis</p>
                <p className="text-base bg-gray-50 p-3 rounded-lg">{selectedLetter.diagnosis}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Treatment Summary</p>
                <p className="text-base bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedLetter.treatmentSummary}</p>
              </div>

              {selectedLetter.medicationsOnDischarge && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Medications on Discharge</p>
                  <p className="text-base bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedLetter.medicationsOnDischarge}</p>
                </div>
              )}

              {selectedLetter.followUpDate && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Follow-up Date</p>
                    <p className="text-base">{format(parseISO(selectedLetter.followUpDate), 'MMMM d, yyyy')}</p>
                  </div>
                  {selectedLetter.emergencyContact && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Emergency Contact</p>
                      <p className="text-base">{selectedLetter.emergencyContact}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedLetter.followUpInstructions && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Follow-up Instructions</p>
                  <p className="text-base bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedLetter.followUpInstructions}</p>
                </div>
              )}

              {selectedLetter.specialInstructions && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Special Instructions</p>
                  <p className="text-base bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedLetter.specialInstructions}</p>
                </div>
              )}

              {selectedLetter.restrictions && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Activity Restrictions</p>
                  <p className="text-base bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedLetter.restrictions}</p>
                </div>
              )}

              {selectedLetter.dietaryAdvice && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Dietary Advice</p>
                  <p className="text-base bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedLetter.dietaryAdvice}</p>
                </div>
              )}

              {selectedLetter.warningSymptoms && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Warning Symptoms</p>
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                      <p className="text-base text-red-800 whitespace-pre-wrap">{selectedLetter.warningSymptoms}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedLetter.attendingPhysician && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-500">Attending Physician</p>
                  <p className="text-base">
                    Dr. {selectedLetter.attendingPhysician.firstName || ''} {selectedLetter.attendingPhysician.lastName || selectedLetter.attendingPhysician.username}
                  </p>
                </div>
              )}

              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePrintLetter(selectedLetter)}
                  data-testid="button-print-letter"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button onClick={() => { setIsViewDialogOpen(false); handleEditClick(selectedLetter); }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Discharge Letter
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this discharge letter? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedLetter && deleteMutation.mutate(selectedLetter.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete Letter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
