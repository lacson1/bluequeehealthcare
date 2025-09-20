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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, Shield, Edit, Trash2, Phone, Mail, MapPin, Calendar, DollarSign } from 'lucide-react';

const insuranceSchema = z.object({
  provider: z.string().min(1, 'Insurance provider is required'),
  policyNumber: z.string().min(1, 'Policy number is required'),
  groupNumber: z.string().optional(),
  membershipNumber: z.string().optional(),
  coverageType: z.enum(['primary', 'secondary', 'tertiary']),
  policyStatus: z.enum(['active', 'inactive', 'suspended', 'expired']),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  expirationDate: z.string().optional(),
  deductible: z.number().min(0).optional(),
  copay: z.number().min(0).optional(),
  coinsurance: z.number().min(0).max(100).optional(),
  maximumBenefit: z.number().min(0).optional(),
  notes: z.string().optional(),
  // Contact information
  providerPhone: z.string().optional(),
  providerEmail: z.string().optional(),
  providerAddress: z.string().optional(),
  // Coverage details
  coverageDetails: z.string().optional(),
  preAuthRequired: z.boolean().default(false),
  referralRequired: z.boolean().default(false)
});

type InsuranceFormData = z.infer<typeof insuranceSchema>;

interface InsuranceManagementProps {
  patientId: number;
}

interface PatientInsurance {
  id: number;
  patientId: number;
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  membershipNumber?: string;
  coverageType: 'primary' | 'secondary' | 'tertiary';
  policyStatus: 'active' | 'inactive' | 'suspended' | 'expired';
  effectiveDate: string;
  expirationDate?: string;
  deductible?: number;
  copay?: number;
  coinsurance?: number;
  maximumBenefit?: number;
  notes?: string;
  providerPhone?: string;
  providerEmail?: string;
  providerAddress?: string;
  coverageDetails?: string;
  preAuthRequired: boolean;
  referralRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function InsuranceManagement({ patientId }: InsuranceManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<PatientInsurance | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsuranceFormData>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      coverageType: 'primary',
      policyStatus: 'active',
      preAuthRequired: false,
      referralRequired: false
    }
  });

  // Fetch patient insurance information
  const { data: insuranceRecords = [], isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/insurance`],
    enabled: !!patientId
  });

  // Create insurance mutation
  const createInsuranceMutation = useMutation({
    mutationFn: (data: InsuranceFormData) =>
      apiRequest(`/api/patients/${patientId}/insurance`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/insurance`] });
      toast({
        title: "Success",
        description: "Insurance information added successfully"
      });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add insurance information",
        variant: "destructive"
      });
    }
  });

  // Update insurance mutation
  const updateInsuranceMutation = useMutation({
    mutationFn: (data: InsuranceFormData) =>
      apiRequest(`/api/patients/${patientId}/insurance/${editingInsurance?.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/insurance`] });
      toast({
        title: "Success",
        description: "Insurance information updated successfully"
      });
      setIsOpen(false);
      setEditingInsurance(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update insurance information",
        variant: "destructive"
      });
    }
  });

  // Delete insurance mutation
  const deleteInsuranceMutation = useMutation({
    mutationFn: (insuranceId: number) =>
      apiRequest(`/api/patients/${patientId}/insurance/${insuranceId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/insurance`] });
      toast({
        title: "Success",
        description: "Insurance information deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete insurance information",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: InsuranceFormData) => {
    if (editingInsurance) {
      updateInsuranceMutation.mutate(data);
    } else {
      createInsuranceMutation.mutate(data);
    }
  };

  const handleEdit = (insurance: PatientInsurance) => {
    setEditingInsurance(insurance);
    form.reset({
      provider: insurance.provider,
      policyNumber: insurance.policyNumber,
      groupNumber: insurance.groupNumber || '',
      membershipNumber: insurance.membershipNumber || '',
      coverageType: insurance.coverageType,
      policyStatus: insurance.policyStatus,
      effectiveDate: insurance.effectiveDate,
      expirationDate: insurance.expirationDate || '',
      deductible: insurance.deductible || 0,
      copay: insurance.copay || 0,
      coinsurance: insurance.coinsurance || 0,
      maximumBenefit: insurance.maximumBenefit || 0,
      notes: insurance.notes || '',
      providerPhone: insurance.providerPhone || '',
      providerEmail: insurance.providerEmail || '',
      providerAddress: insurance.providerAddress || '',
      coverageDetails: insurance.coverageDetails || '',
      preAuthRequired: insurance.preAuthRequired,
      referralRequired: insurance.referralRequired
    });
    setIsOpen(true);
  };

  const handleDelete = (insuranceId: number) => {
    if (confirm('Are you sure you want to delete this insurance record?')) {
      deleteInsuranceMutation.mutate(insuranceId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCoverageTypeColor = (type: string) => {
    switch (type) {
      case 'primary': return 'bg-blue-100 text-blue-800';
      case 'secondary': return 'bg-purple-100 text-purple-800';
      case 'tertiary': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading insurance information...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Insurance Information</h3>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingInsurance(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Insurance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInsurance ? 'Edit Insurance Information' : 'Add Insurance Information'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance Provider *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Blue Cross Blue Shield" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="policyNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Policy number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="groupNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Group number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="membershipNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Membership Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Membership number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Coverage Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="coverageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coverage Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select coverage type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                            <SelectItem value="tertiary">Tertiary</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="policyStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Date Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="effectiveDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effective Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expirationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Financial Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="deductible"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deductible ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="copay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Copay ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coinsurance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coinsurance (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            min="0" 
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maximumBenefit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Benefit ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="providerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="providerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="providerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Coverage Details */}
                <FormField
                  control={form.control}
                  name="coverageDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coverage Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what is covered, limitations, etc." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes about this insurance" 
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
                    disabled={createInsuranceMutation.isPending || updateInsuranceMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {createInsuranceMutation.isPending || updateInsuranceMutation.isPending 
                      ? "Saving..." 
                      : editingInsurance 
                        ? "Update Insurance" 
                        : "Add Insurance"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Insurance Records Display */}
      {insuranceRecords.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Shield className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Insurance Information</h3>
          <p className="text-sm text-gray-500 mb-4">Add insurance details to manage patient coverage</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insuranceRecords.map((insurance: PatientInsurance) => (
            <Card key={insurance.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      {insurance.provider}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className={getCoverageTypeColor(insurance.coverageType)}>
                        {insurance.coverageType}
                      </Badge>
                      <Badge className={getStatusColor(insurance.policyStatus)}>
                        {insurance.policyStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(insurance)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(insurance.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-gray-500">Policy Number</Label>
                    <p className="font-medium">{insurance.policyNumber}</p>
                  </div>
                  {insurance.groupNumber && (
                    <div>
                      <Label className="text-gray-500">Group Number</Label>
                      <p className="font-medium">{insurance.groupNumber}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <Label className="text-gray-500">Effective</Label>
                      <p className="font-medium">{new Date(insurance.effectiveDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {insurance.expirationDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <Label className="text-gray-500">Expires</Label>
                        <p className="font-medium">{new Date(insurance.expirationDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {(insurance.deductible || insurance.copay || insurance.coinsurance) && (
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {insurance.deductible && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <div>
                          <Label className="text-gray-500">Deductible</Label>
                          <p className="font-medium">${insurance.deductible}</p>
                        </div>
                      </div>
                    )}
                    {insurance.copay && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <div>
                          <Label className="text-gray-500">Copay</Label>
                          <p className="font-medium">${insurance.copay}</p>
                        </div>
                      </div>
                    )}
                    {insurance.coinsurance && (
                      <div>
                        <Label className="text-gray-500">Coinsurance</Label>
                        <p className="font-medium">{insurance.coinsurance}%</p>
                      </div>
                    )}
                  </div>
                )}

                {(insurance.providerPhone || insurance.providerEmail) && (
                  <div className="border-t pt-3 space-y-2">
                    {insurance.providerPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{insurance.providerPhone}</span>
                      </div>
                    )}
                    {insurance.providerEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{insurance.providerEmail}</span>
                      </div>
                    )}
                    {insurance.providerAddress && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{insurance.providerAddress}</span>
                      </div>
                    )}
                  </div>
                )}

                {insurance.notes && (
                  <div className="border-t pt-3">
                    <Label className="text-gray-500 text-sm">Notes</Label>
                    <p className="text-sm text-gray-700 mt-1">{insurance.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}