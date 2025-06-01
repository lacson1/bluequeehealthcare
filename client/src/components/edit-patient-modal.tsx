import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User, Phone, Mail, MapPin, Calendar, UserCheck, Pill, AlertTriangle } from 'lucide-react';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  allergies?: string;
  medicalHistory?: string;
  title?: string;
  organizationId?: number;
}

interface Organization {
  id: number;
  name: string;
  type: string;
}

interface EditPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  onPatientUpdated: () => void;
}

export function EditPatientModal({ open, onOpenChange, patient, onPatientUpdated }: EditPatientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    allergies: '',
    medicalHistory: '',
    organizationId: '',
  });

  // Fetch organizations for selection
  const { data: organizations = [] } = useQuery({
    queryKey: ['/api/organizations-dropdown'],
    enabled: open
  });

  // Update form data when patient changes or modal opens
  useEffect(() => {
    if (patient && open) {
      setFormData({
        title: patient.title || '',
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        dateOfBirth: patient.dateOfBirth || '',
        gender: patient.gender || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        allergies: patient.allergies || '',
        medicalHistory: patient.medicalHistory || '',
        organizationId: patient.organizationId?.toString() || '',
      });
    }
  }, [patient, open]);

  const updatePatientMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        organizationId: data.organizationId ? parseInt(data.organizationId) : null
      };
      return apiRequest("PATCH", `/api/patients/${patient.id}`, payload);
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Patient information updated successfully!",
      });
      
      // Comprehensive cache invalidation for immediate UI updates
      await queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      await queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}`] });
      
      // Call the parent callback to handle additional refresh logic
      onPatientUpdated();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update patient information",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Validation Error", 
        description: "Phone number is required",
        variant: "destructive",
      });
      return;
    }

    updatePatientMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPatientAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-blue-600" />
            Edit Patient Information
          </DialogTitle>
          <DialogDescription>
            Update patient details, medical history, and organization assignment.
            Patient ID: HC{patient.id?.toString().padStart(6, "0")}
            {formData.dateOfBirth && ` • Age: ${getPatientAge(formData.dateOfBirth)} years`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="h-4 w-4 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Select value={formData.title} onValueChange={(value) => handleInputChange('title', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Mr">Mr</SelectItem>
                    <SelectItem value="Mrs">Mrs</SelectItem>
                    <SelectItem value="Miss">Miss</SelectItem>
                    <SelectItem value="Ms">Ms</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                    <SelectItem value="Prof">Prof</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
                {formData.dateOfBirth && (
                  <p className="text-sm text-slate-500">Age: {getPatientAge(formData.dateOfBirth)} years old</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationId">Healthcare Organization</Label>
                <Select 
                  value={formData.organizationId} 
                  onValueChange={(value) => handleInputChange('organizationId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No organization assigned</SelectItem>
                    {Array.isArray(organizations) && organizations.map((org: Organization) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name} ({org.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-4 w-4 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Contact Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
                rows={2}
              />
            </div>
          </div>

          {/* Medical Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Pill className="h-4 w-4 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Medical Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allergies" className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  Known Allergies
                </Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  placeholder="List any known allergies, medications, foods, etc."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea
                  id="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                  placeholder="Previous conditions, surgeries, family history, etc."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Current Information Display */}
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h4 className="font-medium text-slate-800 mb-2">Current Patient Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Full Name:</span> 
                <div className="text-slate-600">
                  {[formData.title, formData.firstName, formData.lastName].filter(Boolean).join(' ') || 'Not set'}
                </div>
              </div>
              <div>
                <span className="font-medium">Contact:</span>
                <div className="text-slate-600">{formData.phone || 'No phone'}</div>
                <div className="text-slate-600">{formData.email || 'No email'}</div>
              </div>
              <div>
                <span className="font-medium">Organization:</span>
                <div className="text-slate-600">
                  {Array.isArray(organizations) && organizations.find((org: Organization) => org.id.toString() === formData.organizationId)?.name || 'Not assigned'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updatePatientMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updatePatientMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updatePatientMutation.isPending ? "Updating..." : "Update Patient Information"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}