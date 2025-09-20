import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, Send, Edit, Trash2, Calendar, Clock, MapPin, User, Stethoscope, AlertCircle } from 'lucide-react';

const referralSchema = z.object({
  referredToDoctor: z.string().optional(),
  referredToFacility: z.string().min(1, 'Referred facility is required'),
  specialty: z.string().min(1, 'Specialty is required'),
  reason: z.string().min(1, 'Reason for referral is required'),
  urgency: z.enum(['urgent', 'routine', 'non-urgent']),
  appointmentDate: z.string().optional(),
  notes: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional()
});

type ReferralFormData = z.infer<typeof referralSchema>;

interface ReferralManagementProps {
  patientId: number;
}

interface PatientReferral {
  id: number;
  patientId: number;
  referredToDoctor?: string;
  referredToFacility: string;
  specialty: string;
  reason: string;
  urgency: 'urgent' | 'routine' | 'non-urgent';
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  referralDate: string;
  appointmentDate?: string;
  notes?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  createdAt: string;
  referringDoctor: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

// Common specialties in Nigerian healthcare
const MEDICAL_SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'General Surgery',
  'Gynecology',
  'Neurology',
  'Obstetrics',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Otolaryngology (ENT)',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Rheumatology',
  'Urology'
];

// Common healthcare facilities in Southwest Nigeria
const HEALTHCARE_FACILITIES = [
  'Lagos University Teaching Hospital (LUTH)',
  'University College Hospital (UCH), Ibadan',
  'Obafemi Awolowo University Teaching Hospital, Ile-Ife',
  'Lagos State University Teaching Hospital (LASUTH)',
  'Federal Medical Centre, Abeokuta',
  'Federal Medical Centre, Owo',
  'Olabisi Onabanjo University Teaching Hospital',
  'Irrua Specialist Teaching Hospital',
  'National Hospital, Abuja',
  'Lagos Island Maternity Hospital',
  'St. Nicholas Hospital, Lagos',
  'Reddington Hospital',
  'The Bridge Clinic',
  'Vedic Lifecare Hospital',
  'EKO Hospital'
];

export default function ReferralManagement({ patientId }: ReferralManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState<PatientReferral | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      urgency: 'routine',
      followUpRequired: false
    }
  });

  // Fetch patient referrals
  const { data: referrals = [], isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/referrals`],
    enabled: !!patientId
  });

  // Create referral mutation
  const createReferralMutation = useMutation({
    mutationFn: (data: ReferralFormData) =>
      apiRequest(`/api/patients/${patientId}/referrals`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/referrals`] });
      toast({
        title: "Success",
        description: "Referral created successfully"
      });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create referral",
        variant: "destructive"
      });
    }
  });

  // Update referral mutation
  const updateReferralMutation = useMutation({
    mutationFn: (data: ReferralFormData) =>
      apiRequest(`/api/patients/${patientId}/referrals/${editingReferral?.id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/referrals`] });
      toast({
        title: "Success",
        description: "Referral updated successfully"
      });
      setIsOpen(false);
      setEditingReferral(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update referral",
        variant: "destructive"
      });
    }
  });

  // Delete referral mutation
  const deleteReferralMutation = useMutation({
    mutationFn: (referralId: number) =>
      apiRequest(`/api/patients/${patientId}/referrals/${referralId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/referrals`] });
      toast({
        title: "Success",
        description: "Referral deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete referral",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ReferralFormData) => {
    if (editingReferral) {
      updateReferralMutation.mutate(data);
    } else {
      createReferralMutation.mutate(data);
    }
  };

  const handleEdit = (referral: PatientReferral) => {
    setEditingReferral(referral);
    form.reset({
      referredToDoctor: referral.referredToDoctor || '',
      referredToFacility: referral.referredToFacility,
      specialty: referral.specialty,
      reason: referral.reason,
      urgency: referral.urgency,
      appointmentDate: referral.appointmentDate || '',
      notes: referral.notes || '',
      followUpRequired: referral.followUpRequired,
      followUpDate: referral.followUpDate || ''
    });
    setIsOpen(true);
  };

  const handleDelete = (referralId: number) => {
    if (confirm('Are you sure you want to delete this referral?')) {
      deleteReferralMutation.mutate(referralId);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'routine': return 'bg-blue-100 text-blue-800';
      case 'non-urgent': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading referrals...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Patient Referrals</h3>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingReferral(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" />
              New Referral
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReferral ? 'Edit Referral' : 'Create New Referral'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Facility and Specialty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="referredToFacility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referred to Facility *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select facility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {HEALTHCARE_FACILITIES.map((facility) => (
                              <SelectItem key={facility} value={facility}>
                                {facility}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialty *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select specialty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MEDICAL_SPECIALTIES.map((specialty) => (
                              <SelectItem key={specialty} value={specialty}>
                                {specialty}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Doctor and Urgency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="referredToDoctor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referred to Doctor (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Doctor's name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select urgency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="routine">Routine</SelectItem>
                            <SelectItem value="non-urgent">Non-urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Reason for Referral */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Referral *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the reason for this referral..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Appointment Date */}
                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Appointment Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Follow-up */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="followUpRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Follow-up Required</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("followUpRequired") && (
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
                  )}
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional information or instructions..." 
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
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createReferralMutation.isPending || updateReferralMutation.isPending}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    {createReferralMutation.isPending || updateReferralMutation.isPending 
                      ? "Saving..." 
                      : editingReferral 
                        ? "Update Referral" 
                        : "Create Referral"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Referrals Display */}
      {referrals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Send className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Referrals</h3>
          <p className="text-sm text-gray-500 mb-4">Create referrals to specialists and other facilities</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {referrals.map((referral: PatientReferral) => (
            <Card key={referral.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-cyan-600" />
                      {referral.specialty}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className={getUrgencyColor(referral.urgency)}>
                        {referral.urgency}
                      </Badge>
                      <Badge className={getStatusColor(referral.status)}>
                        {referral.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(referral)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(referral.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{referral.referredToFacility}</span>
                </div>

                {referral.referredToDoctor && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>Dr. {referral.referredToDoctor}</span>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-lg">
                  <Label className="text-gray-500 text-sm">Reason for Referral</Label>
                  <p className="text-sm text-gray-700 mt-1">{referral.reason}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <Label className="text-gray-500">Referred</Label>
                      <p className="font-medium">{new Date(referral.referralDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {referral.appointmentDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <Label className="text-gray-500">Appointment</Label>
                        <p className="font-medium">{new Date(referral.appointmentDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {referral.followUpRequired && (
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Follow-up required</span>
                      {referral.followUpDate && (
                        <span>by {new Date(referral.followUpDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                )}

                {referral.notes && (
                  <div className="border-t pt-3">
                    <Label className="text-gray-500 text-sm">Notes</Label>
                    <p className="text-sm text-gray-700 mt-1">{referral.notes}</p>
                  </div>
                )}

                <div className="border-t pt-3 text-xs text-gray-500">
                  Referred by Dr. {referral.referringDoctor.firstName || referral.referringDoctor.username} 
                  ({referral.referringDoctor.role})
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}