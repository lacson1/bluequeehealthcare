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
import { Scan, Plus, Trash, Edit, Calendar, Download, Eye, Image as ImageIcon, Loader2, Printer, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/apiRequest';
import { useToast } from '@/hooks/use-toast';

const imagingSchema = z.object({
  studyType: z.string().min(1, "Study type is required"),
  studyDate: z.string().min(1, "Date is required"),
  bodyPart: z.string().min(1, "Body part is required"),
  indication: z.string().min(1, "Indication is required"),
  findings: z.string().optional(),
  impression: z.string().optional(),
  radiologist: z.string().optional(),
  referringPhysician: z.string().optional(),
  modality: z.string().optional(),
  priority: z.enum(["routine", "urgent", "stat"]),
  status: z.enum(["ordered", "scheduled", "in-progress", "completed", "cancelled"]),
});

type ImagingFormData = z.infer<typeof imagingSchema>;

interface PatientImagingProps {
  patientId: number;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  gender?: string;
}

export function PatientImaging({ patientId }: PatientImagingProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState<any>(null);
  const [viewingStudy, setViewingStudy] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch patient information for print
  const { data: patient } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!patientId,
  });

  const form = useForm<ImagingFormData>({
    resolver: zodResolver(imagingSchema),
    defaultValues: {
      studyType: '',
      studyDate: '',
      bodyPart: '',
      indication: '',
      findings: '',
      impression: '',
      radiologist: '',
      referringPhysician: '',
      modality: '',
      priority: 'routine',
      status: 'ordered',
    },
  });

  // Fetch imaging studies
  const { data: imagingStudies, isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/imaging`],
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!patientId,
  });

  // Add imaging study mutation
  const addImagingMutation = useMutation({
    mutationFn: async (data: ImagingFormData) => {
      const response = await apiRequest(`/api/patients/${patientId}/imaging`, 'POST', data);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add imaging study' }));
        throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/imaging`] });
      toast({ title: "Success", description: "Imaging study added successfully" });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error('Error adding imaging study:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add imaging study", 
        variant: "destructive" 
      });
    },
  });

  // Update imaging study mutation
  const updateImagingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ImagingFormData }) => {
      const response = await apiRequest(`/api/patients/${patientId}/imaging/${id}`, 'PATCH', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/imaging`] });
      toast({ title: "Success", description: "Imaging study updated successfully" });
      setEditingStudy(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update imaging study", variant: "destructive" });
    },
  });

  // Delete imaging study mutation
  const deleteImagingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/patients/${patientId}/imaging/${id}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/imaging`] });
      toast({ title: "Success", description: "Imaging study removed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove imaging study", variant: "destructive" });
    },
  });

  const onSubmit = (data: ImagingFormData) => {
    if (editingStudy) {
      updateImagingMutation.mutate({ id: editingStudy.id, data });
    } else {
      addImagingMutation.mutate(data);
    }
  };

  const handleEdit = (study: any) => {
    setEditingStudy(study);
    form.reset({
      studyType: study.studyType,
      studyDate: study.studyDate,
      bodyPart: study.bodyPart,
      indication: study.indication,
      findings: study.findings || '',
      impression: study.impression || '',
      radiologist: study.radiologist || '',
      referringPhysician: study.referringPhysician || '',
      modality: study.modality || '',
      priority: study.priority,
      status: study.status,
    });
    setIsAddDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'ordered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat':
        return 'bg-red-500 text-white';
      case 'urgent':
        return 'bg-orange-500 text-white';
      case 'routine':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const generatePrintReport = (study: any) => {
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : `Patient #${patientId}`;
    const patientDOB = patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A';
    const studyDate = new Date(study.studyDate).toLocaleDateString();
    const printDate = new Date().toLocaleDateString();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Imaging Study Report - ${study.studyType}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #1f2937;
            line-height: 1.6;
          }
          .header { 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .org-name { 
            font-size: 24px; 
            font-weight: bold; 
            color: #1e40af; 
            margin-bottom: 5px; 
          }
          .org-details { 
            color: #64748b; 
            font-size: 12px; 
          }
          .document-title { 
            text-align: center; 
            font-size: 22px; 
            font-weight: bold; 
            color: #1e40af; 
            margin: 30px 0; 
            padding: 15px; 
            border: 2px solid #e2e8f0; 
            background: #f8fafc; 
          }
          .section { 
            margin: 25px 0; 
            page-break-inside: avoid;
          }
          .section-title { 
            font-weight: bold; 
            color: #374151; 
            border-bottom: 2px solid #e5e7eb; 
            padding-bottom: 8px; 
            margin-bottom: 15px; 
            font-size: 16px;
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            margin-bottom: 20px; 
          }
          .info-item { 
            margin-bottom: 10px; 
          }
          .label { 
            font-weight: bold; 
            color: #4b5563; 
            display: inline-block;
            min-width: 140px;
          }
          .value { 
            color: #1f2937; 
          }
          .findings-box { 
            background: #f9fafb; 
            border: 1px solid #e5e7eb; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 15px 0; 
            white-space: pre-wrap;
          }
          .impression-box { 
            background: #eff6ff; 
            border: 2px solid #3b82f6; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 15px 0; 
            white-space: pre-wrap;
          }
          .badge { 
            display: inline-block; 
            padding: 4px 12px; 
            border-radius: 12px; 
            font-size: 12px; 
            font-weight: bold; 
          }
          .badge-completed { background: #d1fae5; color: #065f46; }
          .badge-in-progress { background: #dbeafe; color: #1e40af; }
          .badge-scheduled { background: #fef3c7; color: #92400e; }
          .badge-ordered { background: #f3f4f6; color: #374151; }
          .badge-stat { background: #fee2e2; color: #991b1b; }
          .badge-urgent { background: #fed7aa; color: #9a3412; }
          .badge-routine { background: #dbeafe; color: #1e40af; }
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            font-size: 11px; 
            color: #6b7280; 
            text-align: center;
          }
          .signature-area { 
            margin-top: 50px; 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 40px; 
          }
          .signature-box { 
            border-top: 1px solid #9ca3af; 
            padding-top: 10px; 
            text-align: center; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="org-name">Bluequee Health Management</div>
          <div class="org-details">
            Medical Imaging & Radiology Department<br>
            Report Generated: ${printDate}
          </div>
        </div>

        <div class="document-title">IMAGING STUDY REPORT</div>

        <div class="section">
          <div class="section-title">PATIENT INFORMATION</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Patient Name:</span>
              <span class="value">${patientName}</span>
            </div>
            <div class="info-item">
              <span class="label">Patient ID:</span>
              <span class="value">#${patientId}</span>
            </div>
            <div class="info-item">
              <span class="label">Date of Birth:</span>
              <span class="value">${patientDOB}</span>
            </div>
            <div class="info-item">
              <span class="label">Gender:</span>
              <span class="value">${patient?.gender || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">STUDY INFORMATION</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Study Type:</span>
              <span class="value"><strong>${study.studyType}</strong></span>
            </div>
            <div class="info-item">
              <span class="label">Study Date:</span>
              <span class="value">${studyDate}</span>
            </div>
            <div class="info-item">
              <span class="label">Body Part:</span>
              <span class="value">${study.bodyPart}</span>
            </div>
            <div class="info-item">
              <span class="label">Status:</span>
              <span class="value">
                <span class="badge badge-${study.status.replace('-', '')}">${study.status.toUpperCase()}</span>
              </span>
            </div>
            <div class="info-item">
              <span class="label">Priority:</span>
              <span class="value">
                <span class="badge badge-${study.priority}">${study.priority.toUpperCase()}</span>
              </span>
            </div>
            ${study.modality ? `
            <div class="info-item">
              <span class="label">Modality:</span>
              <span class="value">${study.modality}</span>
            </div>
            ` : ''}
            ${study.referringPhysician ? `
            <div class="info-item">
              <span class="label">Ordered By:</span>
              <span class="value">${study.referringPhysician}</span>
            </div>
            ` : ''}
            ${study.radiologist ? `
            <div class="info-item">
              <span class="label">Radiologist:</span>
              <span class="value">${study.radiologist}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">CLINICAL INDICATION</div>
          <div class="findings-box">${study.indication}</div>
        </div>

        ${study.findings ? `
        <div class="section">
          <div class="section-title">FINDINGS</div>
          <div class="findings-box">${study.findings}</div>
        </div>
        ` : ''}

        ${study.impression ? `
        <div class="section">
          <div class="section-title">IMPRESSION / CONCLUSION</div>
          <div class="impression-box"><strong>${study.impression}</strong></div>
        </div>
        ` : ''}

        <div class="signature-area">
          <div class="signature-box">
            <div style="margin-bottom: 40px;">Radiologist Signature</div>
            <div>_________________________</div>
            <div style="margin-top: 5px; font-size: 11px;">${study.radiologist || 'N/A'}</div>
          </div>
          <div class="signature-box">
            <div style="margin-bottom: 40px;">Date</div>
            <div>_________________________</div>
            <div style="margin-top: 5px; font-size: 11px;">${studyDate}</div>
          </div>
        </div>

        <div class="footer">
          <p>This is a confidential medical report. Handle in accordance with patient privacy regulations.</p>
          <p>Generated from Bluequee Health Management System on ${printDate}</p>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = (study: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePrintReport(study));
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Scan className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Medical Imaging & Radiology</h3>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => { setEditingStudy(null); form.reset(); }} 
              className="gap-2"
              title="Add Imaging Study"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Study</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStudy ? 'Edit Imaging Study' : 'Add New Imaging Study'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select study type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="X-Ray">X-Ray</SelectItem>
                            <SelectItem value="CT">CT Scan</SelectItem>
                            <SelectItem value="MRI">MRI</SelectItem>
                            <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                            <SelectItem value="Mammography">Mammography</SelectItem>
                            <SelectItem value="PET">PET Scan</SelectItem>
                            <SelectItem value="Fluoroscopy">Fluoroscopy</SelectItem>
                            <SelectItem value="Nuclear Medicine">Nuclear Medicine</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="studyDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bodyPart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body Part *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Chest, Abdomen, Brain" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modality</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., With contrast, Without contrast" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="routine">Routine</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="stat">STAT</SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ordered">Ordered</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
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
                            placeholder="Reason for the imaging study"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="radiologist"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Radiologist</FormLabel>
                        <FormControl>
                          <Input placeholder="Reading radiologist name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referringPhysician"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referring Physician</FormLabel>
                        <FormControl>
                          <Input placeholder="Ordering physician name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="findings"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Findings</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed radiological findings"
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
                    name="impression"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Impression/Conclusion</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Radiologist's impression and conclusion"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addImagingMutation.isPending || updateImagingMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {addImagingMutation.isPending || updateImagingMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingStudy ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        {editingStudy ? 'Update' : 'Add'} Study
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
          <div className="text-slate-500">Loading imaging studies...</div>
        </div>
      ) : !imagingStudies || imagingStudies.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-sm font-medium mb-2">No imaging studies found</p>
              <p className="text-xs text-gray-400 mb-4">Click "Add Study" above to record radiology exams</p>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => { setEditingStudy(null); form.reset(); }} 
                    className="gap-2"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Study
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(Array.isArray(imagingStudies) ? imagingStudies : []).map((study: any) => (
            <Card key={study.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-semibold text-lg">{study.studyType} - {study.bodyPart}</h4>
                      <Badge className={getStatusColor(study.status)}>
                        {study.status}
                      </Badge>
                      <Badge className={getPriorityColor(study.priority)}>
                        {study.priority}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                      <div>
                        <span className="font-medium">Study Date:</span>{' '}
                        <span className="text-gray-700">{new Date(study.studyDate).toLocaleDateString()}</span>
                      </div>
                      
                      {study.modality && (
                        <div>
                          <span className="font-medium">Modality:</span>{' '}
                          <span className="text-gray-700">{study.modality}</span>
                        </div>
                      )}
                      
                      {study.referringPhysician && (
                        <div>
                          <span className="font-medium">Ordered By:</span>{' '}
                          <span className="text-gray-700">{study.referringPhysician}</span>
                        </div>
                      )}
                      
                      {study.radiologist && (
                        <div>
                          <span className="font-medium">Radiologist:</span>{' '}
                          <span className="text-gray-700">{study.radiologist}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Indication:</span>{' '}
                        <span className="text-gray-700">{study.indication}</span>
                      </div>
                      
                      {study.findings && (
                        <div>
                          <span className="font-medium">Findings:</span>{' '}
                          <p className="text-gray-700 mt-1">{study.findings}</p>
                        </div>
                      )}
                      
                      {study.impression && (
                        <div className="bg-blue-50 p-3 rounded-md mt-2">
                          <span className="font-medium text-blue-900">Impression:</span>{' '}
                          <p className="text-blue-800 mt-1">{study.impression}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingStudy(study)}
                      title="View Full Report"
                      className="gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">View Report</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePrint(study)}
                      title="Print Report"
                      className="gap-1"
                    >
                      <Printer className="h-4 w-4" />
                      <span className="hidden sm:inline">Print</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(study)}
                      title="Edit Study"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to remove this imaging study?')) {
                          deleteImagingMutation.mutate(study.id);
                        }
                      }}
                      title="Delete Study"
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

      {/* View Study Details Dialog - Full Report View */}
      <Dialog open={!!viewingStudy} onOpenChange={() => setViewingStudy(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <DialogTitle className="text-xl">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Imaging Study Report</span>
              </div>
            </DialogTitle>
            {viewingStudy && (
              <Button
                onClick={() => handlePrint(viewingStudy)}
                className="gap-2"
                variant="outline"
              >
                <Printer className="h-4 w-4" />
                Print Report
              </Button>
            )}
          </DialogHeader>
          {viewingStudy && (
            <div className="space-y-6 pt-4">
              {/* Study Header */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-blue-900">
                    {viewingStudy.studyType} - {viewingStudy.bodyPart}
                  </h3>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(viewingStudy.status)}>
                      {viewingStudy.status}
                    </Badge>
                    <Badge className={getPriorityColor(viewingStudy.priority)}>
                      {viewingStudy.priority}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="font-semibold text-gray-600">Study Date:</span>
                    <p className="text-gray-900">{new Date(viewingStudy.studyDate).toLocaleDateString()}</p>
                  </div>
                  {viewingStudy.modality && (
                    <div>
                      <span className="font-semibold text-gray-600">Modality:</span>
                      <p className="text-gray-900">{viewingStudy.modality}</p>
                    </div>
                  )}
                  {viewingStudy.referringPhysician && (
                    <div>
                      <span className="font-semibold text-gray-600">Ordered By:</span>
                      <p className="text-gray-900">{viewingStudy.referringPhysician}</p>
                    </div>
                  )}
                  {viewingStudy.radiologist && (
                    <div>
                      <span className="font-semibold text-gray-600">Radiologist:</span>
                      <p className="text-gray-900">{viewingStudy.radiologist}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Clinical Indication */}
              <div className="border-l-4 border-l-blue-500 pl-4">
                <h4 className="font-bold text-lg mb-2 text-gray-800">Clinical Indication</h4>
                <p className="text-gray-700 leading-relaxed">{viewingStudy.indication}</p>
              </div>

              {/* Findings */}
              {viewingStudy.findings && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-lg mb-3 text-gray-800">Findings</h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{viewingStudy.findings}</p>
                </div>
              )}

              {/* Impression */}
              {viewingStudy.impression && (
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                  <h4 className="font-bold text-lg mb-3 text-blue-900">Impression / Conclusion</h4>
                  <p className="text-blue-800 whitespace-pre-wrap leading-relaxed font-medium">
                    {viewingStudy.impression}
                  </p>
                </div>
              )}

              {/* Report Footer Info */}
              <div className="text-xs text-gray-500 pt-4 border-t">
                <p>Report ID: {viewingStudy.id} | Created: {new Date(viewingStudy.createdAt).toLocaleString()}</p>
                {viewingStudy.updatedAt && viewingStudy.updatedAt !== viewingStudy.createdAt && (
                  <p>Last Updated: {new Date(viewingStudy.updatedAt).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

