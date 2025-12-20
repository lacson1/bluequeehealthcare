import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Download, Printer, Search, User, Building, Phone, Mail, Globe, UserCheck, Stethoscope, Clock, Save, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatDateOfBirth } from '@/lib/date-utils';
import { SPECIALTY_OPTIONS } from '@/lib/medical-specialties';

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
  dateOccurred: string;
}

interface LabResult {
  id: number;
  testName: string;
  result: string;
  status: string;
  createdAt: string;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  title?: string;
  gender?: string;
}

export default function ReferralLettersPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [referralType, setReferralType] = useState('');
  const [specialistName, setSpecialistName] = useState('');
  const [specialistHospital, setSpecialistHospital] = useState('');
  const [specialistAddress, setSpecialistAddress] = useState('');
  const [urgency, setUrgency] = useState('routine');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clinicalHistory, setClinicalHistory] = useState('');
  const [currentFindings, setCurrentFindings] = useState('');
  const [reasonForReferral, setReasonForReferral] = useState('');
  const [specificQuestions, setSpecificQuestions] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [relevantInvestigations, setRelevantInvestigations] = useState('');

  const { user } = useAuth();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Fetch organization data for letterhead
  const { data: organizationData } = useQuery({
    queryKey: ['/api/organizations', user?.organizationId],
    queryFn: () => fetch(`/api/organizations/${user?.organizationId}`).then(res => res.json()),
    enabled: !!user?.organizationId
  });

  // Fetch patient's prescriptions for auto-populate
  const { data: patientPrescriptions, isLoading: loadingPrescriptions } = useQuery<Prescription[]>({
    queryKey: [`/api/patients/${selectedPatient?.id}/prescriptions`],
    enabled: !!selectedPatient?.id
  });

  // Fetch patient's medical history for auto-populate
  const { data: patientMedicalHistory, isLoading: loadingHistory } = useQuery<MedicalHistoryItem[]>({
    queryKey: [`/api/patients/${selectedPatient?.id}/medical-history`],
    enabled: !!selectedPatient?.id
  });

  // Fetch patient's lab results for auto-populate
  const { data: patientLabResults, isLoading: loadingLabs } = useQuery<LabResult[]>({
    queryKey: [`/api/patients/${selectedPatient?.id}/labs`],
    enabled: !!selectedPatient?.id
  });

  const isAutoPopulateLoading = loadingPrescriptions || loadingHistory || loadingLabs;

  // Function to auto-populate form fields from patient data
  const autoPopulateFromPatient = () => {
    if (!selectedPatient) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient first before auto-populating.",
        variant: "destructive",
      });
      return;
    }

    let populatedFields = 0;

    // Auto-populate current medications from prescriptions
    if (patientPrescriptions && patientPrescriptions.length > 0) {
      const activeMeds = patientPrescriptions
        .filter(p => p.status === 'active')
        .map(p => `• ${p.medicationName} ${p.dosage} - ${p.frequency}${p.duration ? ` for ${p.duration}` : ''}`)
        .join('\n');
      
      if (activeMeds) {
        setCurrentMedications(activeMeds);
        populatedFields++;
      }
    }

    // Auto-populate clinical history from medical history
    if (patientMedicalHistory && patientMedicalHistory.length > 0) {
      const historyText = patientMedicalHistory
        .map(h => {
          const date = new Date(h.dateOccurred).toLocaleDateString();
          return `• ${h.condition} (${h.type}, ${h.status}) - ${date}\n  ${h.description}`;
        })
        .join('\n\n');
      
      if (historyText) {
        setClinicalHistory(historyText);
        populatedFields++;
      }
    }

    // Auto-populate relevant investigations from lab results
    if (patientLabResults && patientLabResults.length > 0) {
      const recentLabs = patientLabResults
        .slice(0, 10) // Last 10 results
        .map(l => {
          const date = new Date(l.createdAt).toLocaleDateString();
          return `• ${l.testName}: ${l.result} (${date})`;
        })
        .join('\n');
      
      if (recentLabs) {
        setRelevantInvestigations(recentLabs);
        populatedFields++;
      }
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

  // Save referral letter as document mutation
  const saveReferralMutation = useMutation({
    mutationFn: async (documentData: any) => {
      const response = await apiRequest('/api/patient-documents', 'POST', documentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Referral Letter Saved",
        description: "The referral letter has been saved to the patient's documents.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${selectedPatient?.id}/documents`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to save referral letter. Please try again.",
        variant: "destructive",
      });
      console.error('Save error:', error);
    },
  });

  // Function to save referral letter as document
  const saveReferralLetter = () => {
    if (!selectedPatient || !referralType || !reasonForReferral) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields before saving.",
        variant: "destructive",
      });
      return;
    }

    const referralLetterContent = generateReferralLetterContent();
    
    const documentData = {
      patientId: selectedPatient.id,
      title: `Referral Letter - ${referralTypes.find(t => t.value === referralType)?.label}`,
      description: `Referral to ${referralTypes.find(t => t.value === referralType)?.label} specialist`,
      content: referralLetterContent,
      documentType: 'referral_letter',
      createdBy: user?.username || 'System',
      organizationId: user?.organizationId,
    };

    saveReferralMutation.mutate(documentData);
  };

  // Function to generate referral letter content for saving
  const generateReferralLetterContent = () => {
    const specialtyLabel = referralTypes.find(t => t.value === referralType)?.label;
    const urgencyLabel = urgencyLevels.find(l => l.value === urgency)?.label;
    
    let content = `REFERRAL LETTER\n\n`;
    content += `Date: ${new Date().toLocaleDateString()}\n`;
    content += `Urgency: ${urgencyLabel}\n\n`;
    
    if (specialistName || specialistHospital) {
      content += `To: ${specialistName ? specialistName : 'Dear Colleague'}\n`;
      if (specialistHospital) content += `${specialistHospital}\n`;
      if (specialistAddress) content += `${specialistAddress}\n`;
      content += `\n`;
    }
    
    content += `Re: ${selectedPatient?.title || ''} ${selectedPatient?.firstName} ${selectedPatient?.lastName}\n`;
    content += `DOB: ${selectedPatient?.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}\n`;
    content += `Gender: ${selectedPatient?.gender || 'Not specified'}\n`;
    content += `Phone: ${selectedPatient?.phone}\n`;
    content += `Specialty Required: ${specialtyLabel}\n\n`;
    
    if (urgency === 'urgent') {
      content += `URGENT REFERRAL - Please see within 48 hours\n\n`;
    }
    
    content += `I would be grateful if you could see this patient for ${specialtyLabel?.toLowerCase()} consultation. ${reasonForReferral}\n\n`;
    
    if (clinicalHistory) {
      content += `Clinical History:\n${clinicalHistory}\n\n`;
    }
    
    if (currentFindings) {
      content += `Current Findings:\n${currentFindings}\n\n`;
    }
    
    if (currentMedications) {
      content += `Current Medications:\n${currentMedications}\n\n`;
    }
    
    if (relevantInvestigations) {
      content += `Relevant Investigations:\n${relevantInvestigations}\n\n`;
    }
    
    if (specificQuestions) {
      content += `Specific Questions:\n${specificQuestions}\n\n`;
    }
    
    content += `I would appreciate your expert opinion and recommendations for further management. Please feel free to contact me if you require any additional information.\n\n`;
    content += `Thank you for your assistance in the care of this patient.\n\n`;
    content += `Yours sincerely,\n`;
    content += `${user?.username}\n`;
    content += `${user?.role}\n`;
    if (organizationData) content += `${organizationData.name}\n`;
    
    return content;
  };

  const filteredPatients = patients?.filter(patient => 
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  ) || [];

  const referralTypes = [
    ...SPECIALTY_OPTIONS,
    { value: 'general', label: 'General Consultation' }
  ];

  const urgencyLevels = [
    { value: 'urgent', label: 'Urgent (Within 48 hours)' },
    { value: 'semi-urgent', label: 'Semi-urgent (Within 2 weeks)' },
    { value: 'routine', label: 'Routine (Within 6 weeks)' }
  ];

  const generatePDF = () => {
    const printContent = document.querySelector('.referral-letter-content');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      const printContents = printContent.innerHTML;
      
      document.body.innerHTML = `
        <html>
          <head>
            <title>Referral Letter - ${selectedPatient?.firstName} ${selectedPatient?.lastName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .text-center { text-align: center; }
              .border-b-2 { border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
              .text-blue-600 { color: #2563eb; }
              .text-gray-600 { color: #6b7280; }
              .grid { display: grid; gap: 16px; }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .bg-gray-50 { background-color: #f9fafb; padding: 16px; border-radius: 8px; }
              .bg-blue-50 { background-color: #eff6ff; padding: 16px; border-radius: 8px; }
              .bg-yellow-50 { background-color: #fefce8; padding: 16px; border-radius: 8px; border: 1px solid #fde047; }
              .space-y-4 > * + * { margin-top: 16px; }
              .text-sm { font-size: 14px; }
              .text-xs { font-size: 12px; }
              .font-bold { font-weight: bold; }
              .font-semibold { font-weight: 600; }
              .flex { display: flex; align-items: center; gap: 4px; }
              .justify-center { justify-content: center; }
              .border-t { border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 20px; }
              .letter-content { margin: 30px 0; }
              .signature-line { border-bottom: 1px solid #000; width: 200px; margin: 20px 0; }
            </style>
          </head>
          <body>${printContents}</body>
        </html>
      `;
      
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Letters</h1>
          <p className="text-gray-600">Generate professional referral letters with organization branding</p>
        </div>
        <div className="flex items-center gap-2 text-blue-600">
          <UserCheck className="w-8 h-8" />
          <FileText className="w-8 h-8" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Select Patient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchTerm && (
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                      selectedPatient?.id === patient.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="font-medium">
                      {patient.title || ''} {patient.firstName} {patient.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{patient.phone}</div>
                  </div>
                ))}
              </div>
            )}
            
            {selectedPatient && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800">Selected Patient</h3>
                <p className="text-blue-700">
                  {selectedPatient.title || ''} {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
                <p className="text-sm text-blue-600">{selectedPatient.phone}</p>
                <p className="text-sm text-blue-600">DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              Referral Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="referral-type">Specialty</Label>
                <Select value={referralType} onValueChange={setReferralType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {referralTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="urgency">Urgency</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="specialist-name">Specialist Name (Optional)</Label>
              <Input
                id="specialist-name"
                placeholder="Dr. John Smith"
                value={specialistName}
                onChange={(e) => setSpecialistName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="specialist-hospital">Hospital/Clinic</Label>
              <Input
                id="specialist-hospital"
                placeholder="Lagos University Teaching Hospital"
                value={specialistHospital}
                onChange={(e) => setSpecialistHospital(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="specialist-address">Address</Label>
              <Textarea
                id="specialist-address"
                placeholder="Hospital address..."
                value={specialistAddress}
                onChange={(e) => setSpecialistAddress(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Clinical Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Clinical Information
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={autoPopulateFromPatient}
                disabled={!selectedPatient || isAutoPopulateLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200"
              >
                {isAutoPopulateLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-purple-600" />
                )}
                <span className="text-purple-700">Auto-Fill from Patient Record</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPatient && (
              <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 mb-4">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Click "Auto-Fill" to populate fields with {selectedPatient.firstName}'s medical history, 
                    medications, and lab results automatically.
                  </span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clinical-history">Clinical History</Label>
                <Textarea
                  id="clinical-history"
                  placeholder="Brief medical history relevant to referral..."
                  value={clinicalHistory}
                  onChange={(e) => setClinicalHistory(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="current-findings">Current Findings</Label>
                <Textarea
                  id="current-findings"
                  placeholder="Physical examination findings, symptoms..."
                  value={currentFindings}
                  onChange={(e) => setCurrentFindings(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="reason-for-referral">Reason for Referral</Label>
                <Textarea
                  id="reason-for-referral"
                  placeholder="Specific reason for specialist consultation..."
                  value={reasonForReferral}
                  onChange={(e) => setReasonForReferral(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="specific-questions">Specific Questions</Label>
                <Textarea
                  id="specific-questions"
                  placeholder="What would you like the specialist to address?"
                  value={specificQuestions}
                  onChange={(e) => setSpecificQuestions(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="current-medications">Current Medications</Label>
                <Textarea
                  id="current-medications"
                  placeholder="List current medications and dosages..."
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="relevant-investigations">Relevant Investigations</Label>
                <Textarea
                  id="relevant-investigations"
                  placeholder="Recent lab results, imaging, etc..."
                  value={relevantInvestigations}
                  onChange={(e) => setRelevantInvestigations(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Letter Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Letter Preview & Generate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  className="w-full" 
                  disabled={!selectedPatient || !referralType || !reasonForReferral}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Preview Referral Letter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Referral Letter Preview</DialogTitle>
                </DialogHeader>
                
                <div className="referral-letter-content space-y-6 p-6 bg-white">
                  {/* Organization Header */}
                  {organizationData && (
                    <div className="text-center border-b-2 border-blue-600 pb-4 mb-6">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <Building className="w-8 h-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-blue-600">{organizationData.name}</h1>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {organizationData.address && (
                          <p className="flex items-center justify-center gap-1">
                            <Building className="w-3 h-3" />
                            {organizationData.address}
                          </p>
                        )}
                        <div className="flex items-center justify-center gap-4">
                          {organizationData.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {organizationData.phone}
                            </span>
                          )}
                          {organizationData.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {organizationData.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Letter Header */}
                  <div className="grid grid-cols-2 gap-8 mb-6">
                    <div>
                      <p className="text-sm text-gray-600">Date:</p>
                      <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Urgency:</p>
                      <p className={`font-semibold ${urgency === 'urgent' ? 'text-red-600' : urgency === 'semi-urgent' ? 'text-orange-600' : 'text-green-600'}`}>
                        {urgencyLevels.find(l => l.value === urgency)?.label}
                      </p>
                    </div>
                  </div>

                  {/* Recipient */}
                  <div className="mb-6">
                    <p className="font-semibold text-gray-800">
                      {specialistName ? `${specialistName},` : 'Dear Colleague,'}
                    </p>
                    {specialistHospital && <p className="text-gray-700">{specialistHospital}</p>}
                    {specialistAddress && <p className="text-gray-700">{specialistAddress}</p>}
                  </div>

                  {/* Letter Body */}
                  <div className="letter-content space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg text-blue-800 mb-2">
                        Re: {selectedPatient?.title || ''} {selectedPatient?.firstName} {selectedPatient?.lastName}
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4 text-sm">
                        <div><strong>DOB:</strong> {selectedPatient?.dateOfBirth ? formatDateOfBirth(selectedPatient.dateOfBirth) : 'N/A'}</div>
                        <div><strong>Gender:</strong> {selectedPatient?.gender || 'Not specified'}</div>
                        <div><strong>Phone:</strong> {selectedPatient?.phone}</div>
                        <div><strong>Specialty Required:</strong> {referralTypes.find(t => t.value === referralType)?.label}</div>
                      </div>
                    </div>

                    {urgency === 'urgent' && (
                      <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg">
                        <p className="font-semibold text-red-800">URGENT REFERRAL - Please see within 48 hours</p>
                      </div>
                    )}

                    <p>
                      I would be grateful if you could see this patient for {referralTypes.find(t => t.value === referralType)?.label.toLowerCase()} consultation. 
                      {reasonForReferral && ` ${reasonForReferral}`}
                    </p>

                    {clinicalHistory && (
                      <div>
                        <h4 className="font-semibold text-gray-800">Clinical History:</h4>
                        <p className="text-justify">{clinicalHistory}</p>
                      </div>
                    )}

                    {currentFindings && (
                      <div>
                        <h4 className="font-semibold text-gray-800">Current Findings:</h4>
                        <p className="text-justify">{currentFindings}</p>
                      </div>
                    )}

                    {currentMedications && (
                      <div>
                        <h4 className="font-semibold text-gray-800">Current Medications:</h4>
                        <p className="text-justify">{currentMedications}</p>
                      </div>
                    )}

                    {relevantInvestigations && (
                      <div>
                        <h4 className="font-semibold text-gray-800">Relevant Investigations:</h4>
                        <p className="text-justify">{relevantInvestigations}</p>
                      </div>
                    )}

                    {specificQuestions && (
                      <div>
                        <h4 className="font-semibold text-gray-800">Specific Questions:</h4>
                        <p className="text-justify">{specificQuestions}</p>
                      </div>
                    )}

                    <p>
                      I would appreciate your expert opinion and recommendations for further management. 
                      Please feel free to contact me if you require any additional information.
                    </p>

                    <p>Thank you for your assistance in the care of this patient.</p>
                  </div>

                  {/* Signature */}
                  <div className="mt-8">
                    <p>Yours sincerely,</p>
                    <div className="signature-line"></div>
                    <p className="font-semibold">{user?.username}</p>
                    <p className="text-sm text-gray-600">{user?.role}</p>
                    {organizationData && <p className="text-sm text-gray-600">{organizationData.name}</p>}
                  </div>

                  {/* Organization Footer */}
                  {organizationData && (
                    <div className="text-center text-sm text-gray-600 border-t border-gray-300 pt-4 mt-8">
                      <div className="space-y-2">
                        <p className="font-medium text-blue-600">{organizationData.name}</p>
                        <div className="flex items-center justify-center gap-4 text-xs">
                          {organizationData.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {organizationData.phone}
                            </span>
                          )}
                          {organizationData.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {organizationData.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={saveReferralLetter}
                    disabled={saveReferralMutation.isPending || !selectedPatient || !referralType || !reasonForReferral}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveReferralMutation.isPending ? 'Saving...' : 'Save to Patient Documents'}
                  </Button>
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Letter
                  </Button>
                  <Button onClick={() => generatePDF()}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <div className="text-sm text-gray-600">
              <p><strong>Patient:</strong> {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'None selected'}</p>
              <p><strong>Specialty:</strong> {referralType ? referralTypes.find(t => t.value === referralType)?.label : 'None selected'}</p>
              <p><strong>Urgency:</strong> {urgencyLevels.find(l => l.value === urgency)?.label}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}