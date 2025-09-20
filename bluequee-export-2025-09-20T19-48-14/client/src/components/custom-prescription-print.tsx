import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { MedicalIcons } from '@/lib/medical-icons';
import { exportToPDF, printElement, generateClinicHeader, formatDocumentDate } from './print-export-utils';

interface Prescription {
  id: number;
  patientId: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescribedBy: string;
  startDate: string;
  status: string;
  organizationId: number;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  title?: string;
  phone: string;
  email?: string;
  dateOfBirth: string;
  gender: string;
  address?: string;
}

interface Organization {
  id: number;
  name: string;
  type: string;
  logoUrl?: string;
  themeColor: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

interface CustomPrescriptionPrintProps {
  prescriptions: Prescription[];
  patient: Patient;
  onClose: () => void;
}

export default function CustomPrescriptionPrint({ prescriptions, patient, onClose }: CustomPrescriptionPrintProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch active organization data
  const { data: organization } = useQuery<Organization>({
    queryKey: ['/api/print/organization'],
    retry: false,
  });

  const activePrescriptions = prescriptions.filter(p => p.status === 'active');

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      await printElement('prescription-print-content');
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    setIsGenerating(true);
    try {
      await exportToPDF('prescription-print-content', {
        filename: `prescription_${patient.firstName}_${patient.lastName}_${new Date().toISOString().split('T')[0]}`,
        organization,
        format: 'a4',
        orientation: 'portrait'
      });
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!organization) {
    return (
      <Card className="p-6">
        <CardContent>
          <div className="text-center">
            <MedicalIcons.refresh className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading organization details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Prescription Print Preview</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} disabled={isGenerating}>
                <MedicalIcons.print className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleExportPDF} disabled={isGenerating}>
                <MedicalIcons.download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Print Content - A6 Format with Light Green Background */}
        <div 
          id="prescription-print-content" 
          className="bg-green-50 p-4 print:p-3" 
          style={{ 
            width: '148mm',
            minHeight: '210mm',
            maxWidth: '148mm',
            backgroundColor: '#f0fdf4',
            fontSize: '11px',
            lineHeight: '1.3',
            overflow: 'visible'
          }}
        >
        {/* Organization Header */}
        {generateClinicHeader(organization)}

        {/* Document Title - Compact for A6 */}
        <div className="text-center mb-3">
          <h2 className="text-sm font-bold mb-1" style={{ color: organization.themeColor }}>
            MEDICAL PRESCRIPTION
          </h2>
          <p className="text-xs text-gray-600">
            Date: {formatDocumentDate(new Date())}
          </p>
        </div>

        {/* Patient Information - Compact for A6 */}
        <div className="mb-3 p-2 bg-green-100 rounded print:bg-green-100">
          <h3 className="text-xs font-semibold mb-1" style={{ color: organization.themeColor }}>
            Patient Information
          </h3>
          <div className="space-y-1 text-xs">
            <p><strong>Name:</strong> {patient.title} {patient.firstName} {patient.lastName}</p>
            <p><strong>DOB:</strong> {new Date(patient.dateOfBirth).toLocaleDateString()} | <strong>Gender:</strong> {patient.gender}</p>
            <p><strong>Phone:</strong> {patient.phone}</p>
          </div>
        </div>

        {/* Prescription Details - Compact for A6 */}
        <div className="mb-3">
          <h3 className="text-xs font-semibold mb-2" style={{ color: organization.themeColor }}>
            Prescribed Medications
          </h3>
          
          {activePrescriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MedicalIcons.prescription className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active prescriptions found for this patient.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activePrescriptions.map((prescription, index) => (
                <div key={prescription.id} className="border-l-2 pl-2 py-1" style={{ borderLeftColor: organization.themeColor }}>
                  <div className="mb-1">
                    <h4 className="text-xs font-semibold">{index + 1}. {prescription.medicationName}</h4>
                  </div>
                  
                  <div className="text-xs space-y-1">
                    <p><strong>Dose:</strong> {prescription.dosage} | <strong>Freq:</strong> {prescription.frequency}</p>
                    <p><strong>Duration:</strong> {prescription.duration}</p>
                    {prescription.instructions && (
                      <p><strong>Instructions:</strong> {prescription.instructions}</p>
                    )}
                    <p><strong>By:</strong> Dr. {prescription.prescribedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Compact for A6 */}
        <div className="border-t pt-2 mt-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="font-semibold" style={{ color: organization.themeColor }}>Physician:</p>
              <p>Dr. {activePrescriptions[0]?.prescribedBy || 'N/A'}</p>
              <p className="text-gray-600">Signature: ___________</p>
            </div>
            <div>
              <p className="font-semibold" style={{ color: organization.themeColor }}>Pharmacy:</p>
              <p className="text-gray-600">Dispensed: ___________</p>
              <p className="text-gray-600">Date: ___________</p>
            </div>
          </div>
        </div>

        {/* Legal Notice - Compact */}
        <div className="mt-2 text-xs text-gray-500 text-center border-t pt-2">
          <p>Valid only when issued by licensed practitioner | {organization.name}</p>
          <p>{new Date().toLocaleDateString()}</p>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}