import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Printer, Search, User, Building, Phone, Mail, Globe, Calendar, Stethoscope } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  title?: string;
}

export default function MedicalCertificatesPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [certificateType, setCertificateType] = useState('');
  const [medicalCondition, setMedicalCondition] = useState('');
  const [recommendedDays, setRecommendedDays] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [restrictions, setRestrictions] = useState('');

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

  const filteredPatients = patients?.filter(patient => 
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  ) || [];

  const certificateTypes = [
    { value: 'sick-leave', label: 'Sick Leave Certificate' },
    { value: 'fitness-to-work', label: 'Fitness to Work Certificate' },
    { value: 'medical-clearance', label: 'Medical Clearance Certificate' },
    { value: 'travel-fitness', label: 'Travel Fitness Certificate' },
    { value: 'pre-employment', label: 'Pre-Employment Medical Certificate' },
    { value: 'disability', label: 'Disability Assessment Certificate' },
    { value: 'vaccination', label: 'Vaccination Certificate' },
    { value: 'general-medical', label: 'General Medical Certificate' }
  ];

  const generatePDF = () => {
    const printContent = document.querySelector('.medical-certificate-content');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      const printContents = printContent.innerHTML;
      
      document.body.innerHTML = `
        <html>
          <head>
            <title>Medical Certificate - ${selectedPatient?.firstName} ${selectedPatient?.lastName}</title>
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
              .space-y-4 > * + * { margin-top: 16px; }
              .text-sm { font-size: 14px; }
              .text-xs { font-size: 12px; }
              .font-bold { font-weight: bold; }
              .font-semibold { font-weight: 600; }
              .flex { display: flex; align-items: center; gap: 4px; }
              .justify-center { justify-content: center; }
              .border-t { border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 20px; }
              .certificate-body { margin: 30px 0; padding: 20px; border: 1px solid #ddd; }
              .signature-line { border-bottom: 1px solid #000; width: 200px; margin: 20px auto; }
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

  const calculateEndDate = (days: string) => {
    if (days && startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + parseInt(days) - 1);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  React.useEffect(() => {
    if (recommendedDays && startDate) {
      calculateEndDate(recommendedDays);
    }
  }, [recommendedDays, startDate]);

  const getCertificateContent = () => {
    const type = certificateTypes.find(t => t.value === certificateType);
    
    switch (certificateType) {
      case 'sick-leave':
        return `This is to certify that ${selectedPatient?.title || ''} ${selectedPatient?.firstName} ${selectedPatient?.lastName} was examined by me on ${new Date().toLocaleDateString()} and found to be suffering from ${medicalCondition}. In my medical opinion, ${selectedPatient?.firstName} is unfit for work and requires medical rest for ${recommendedDays} day(s) from ${new Date(startDate).toLocaleDateString()} to ${endDate ? new Date(endDate).toLocaleDateString() : 'TBD'}.`;
      
      case 'fitness-to-work':
        return `This is to certify that ${selectedPatient?.title || ''} ${selectedPatient?.firstName} ${selectedPatient?.lastName} was medically examined by me on ${new Date().toLocaleDateString()}. Based on my clinical assessment, I hereby certify that ${selectedPatient?.firstName} is medically fit to return to work with ${restrictions || 'no restrictions'}.`;
      
      case 'medical-clearance':
        return `This is to certify that ${selectedPatient?.title || ''} ${selectedPatient?.firstName} ${selectedPatient?.lastName} has been medically examined by me on ${new Date().toLocaleDateString()}. Based on the clinical assessment and review of medical history, I hereby certify that ${selectedPatient?.firstName} is medically cleared for the requested activity/procedure.`;
      
      case 'travel-fitness':
        return `This is to certify that ${selectedPatient?.title || ''} ${selectedPatient?.firstName} ${selectedPatient?.lastName} was examined by me on ${new Date().toLocaleDateString()}. Based on my medical assessment, I certify that ${selectedPatient?.firstName} is medically fit to travel by air/land/sea and has no contraindications to travel.`;
      
      default:
        return `This is to certify that ${selectedPatient?.title || ''} ${selectedPatient?.firstName} ${selectedPatient?.lastName} was examined by me on ${new Date().toLocaleDateString()}. ${medicalCondition ? `Medical findings: ${medicalCondition}.` : ''} This certificate is issued upon request for official purposes.`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Certificates</h1>
          <p className="text-gray-600">Generate official medical certificates with organization branding</p>
        </div>
        <div className="flex items-center gap-2 text-blue-600">
          <Stethoscope className="w-8 h-8" />
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificate Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Certificate Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="certificate-type">Certificate Type</Label>
              <Select value={certificateType} onValueChange={setCertificateType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select certificate type" />
                </SelectTrigger>
                <SelectContent>
                  {certificateTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(certificateType === 'sick-leave' || certificateType === 'general-medical') && (
              <div>
                <Label htmlFor="medical-condition">Medical Condition/Diagnosis</Label>
                <Textarea
                  id="medical-condition"
                  placeholder="Enter medical condition or diagnosis..."
                  value={medicalCondition}
                  onChange={(e) => setMedicalCondition(e.target.value)}
                />
              </div>
            )}

            {certificateType === 'sick-leave' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recommended-days">Recommended Days Off</Label>
                    <Input
                      id="recommended-days"
                      type="number"
                      placeholder="Number of days"
                      value={recommendedDays}
                      onChange={(e) => setRecommendedDays(e.target.value)}
                    />
                  </div>
                </div>
                
                {endDate && (
                  <div className="text-sm text-gray-600">
                    End Date: {new Date(endDate).toLocaleDateString()}
                  </div>
                )}
              </>
            )}

            {(certificateType === 'fitness-to-work' || certificateType === 'medical-clearance') && (
              <div>
                <Label htmlFor="restrictions">Restrictions/Recommendations</Label>
                <Textarea
                  id="restrictions"
                  placeholder="Any work restrictions or recommendations..."
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="additional-notes">Additional Notes</Label>
              <Textarea
                id="additional-notes"
                placeholder="Any additional medical notes or recommendations..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Certificate Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Certificate Preview & Generate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  className="w-full" 
                  disabled={!selectedPatient || !certificateType}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Preview Certificate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Medical Certificate Preview</DialogTitle>
                </DialogHeader>
                
                <div className="medical-certificate-content space-y-6 p-6 bg-white">
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
                          {organizationData.website && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {organizationData.website}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Certificate Title */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">MEDICAL CERTIFICATE</h2>
                    <p className="text-gray-600">
                      {certificateTypes.find(t => t.value === certificateType)?.label}
                    </p>
                  </div>

                  {/* Certificate Body */}
                  <div className="certificate-body">
                    <p className="text-justify leading-relaxed">
                      {getCertificateContent()}
                    </p>
                    
                    {additionalNotes && (
                      <div className="mt-4">
                        <p className="font-semibold">Additional Notes:</p>
                        <p className="text-justify">{additionalNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Physician Information */}
                  <div className="grid grid-cols-2 gap-8 mt-8">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Date of Examination:</p>
                      <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Examining Physician:</p>
                      <p className="font-semibold">{user?.username}</p>
                      <p className="text-sm text-gray-600">{user?.role}</p>
                      <div className="signature-line mt-4"></div>
                      <p className="text-xs text-center mt-1">Physician Signature</p>
                    </div>
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
                        <p className="text-xs text-gray-500">
                          This is an official medical certificate issued by a licensed medical practitioner
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Certificate
                  </Button>
                  <Button onClick={() => generatePDF()}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <div className="text-sm text-gray-600">
              <p><strong>Selected Patient:</strong> {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'None selected'}</p>
              <p><strong>Certificate Type:</strong> {certificateType ? certificateTypes.find(t => t.value === certificateType)?.label : 'None selected'}</p>
              {recommendedDays && <p><strong>Duration:</strong> {recommendedDays} days</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}