import React from 'react';
import LetterheadTemplate from './LetterheadTemplate';
import { useActiveOrganization } from '@/hooks/useActiveOrganization';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity?: number;
}

interface Prescription {
  id: number;
  medications: Medication[];
  notes?: string;
  createdAt: string;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  phone?: string;
  title?: string;
}

interface Doctor {
  firstName?: string;
  lastName?: string;
  username: string;
  role: string;
  credentials?: string;
}

interface PrescriptionDocumentProps {
  prescription: Prescription;
  patient: Patient;
  doctor: Doctor;
  onPrint?: () => void;
  onDownload?: () => void;
}

export default function PrescriptionDocument({
  prescription,
  patient,
  doctor,
  onPrint,
  onDownload
}: PrescriptionDocumentProps) {
  const { organization, isLoading } = useActiveOrganization();

  const handlePrint = () => {
    window.print();
    onPrint?.();
  };

  const handleDownload = () => {
    // Generate PDF or trigger download
    onDownload?.();
  };

  if (isLoading || !organization) {
    return <div className="flex items-center justify-center p-8">Loading organization data...</div>;
  }

  return (
    <div className="prescription-document">
      <div className="no-print flex justify-end gap-2 mb-4">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* A6 Prescription Card with Light Green Background */}
      <div className="prescription-card bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto shadow-lg">
        {/* Organization Header */}
        <div className="text-center mb-4 border-b border-green-200 pb-3">
          <h2 className="text-lg font-bold text-green-800">{organization.name}</h2>
          <p className="text-sm text-green-700">{organization.type}</p>
          <p className="text-xs text-green-600">{organization.address}</p>
          <p className="text-xs text-green-600">{organization.phone} | {organization.email}</p>
        </div>

        {/* Prescription Header */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-green-800 mb-1">PRESCRIPTION</h3>
          <p className="text-sm text-green-700">Rx #{prescription.id}</p>
          <p className="text-xs text-green-600">{format(new Date(prescription.createdAt), 'MMM dd, yyyy')}</p>
        </div>

        {/* Patient Info */}
        <div className="mb-4 bg-white rounded p-3 border border-green-100">
          <h4 className="font-semibold text-green-800 mb-1">Patient:</h4>
          <p className="text-sm text-green-700">
            {patient.title ? `${patient.title} ` : ''}{patient.firstName} {patient.lastName}
          </p>
          {patient.phone && (
            <p className="text-xs text-green-600">{patient.phone}</p>
          )}
        </div>

        {/* Medications */}
        <div className="mb-6">
          <h4 className="font-semibold text-green-800 mb-2">Medications:</h4>
          <div className="space-y-3">
            {prescription.medications.map((medication, index) => (
              <div key={medication.id} className="bg-white rounded p-3 border border-green-100">
                <h5 className="font-medium text-green-800 mb-1">
                  {index + 1}. {medication.name}
                </h5>
                <div className="text-xs text-green-700 space-y-1">
                  <p><span className="font-medium">Dosage:</span> {medication.dosage}</p>
                  <p><span className="font-medium">Frequency:</span> {medication.frequency}</p>
                  <p><span className="font-medium">Duration:</span> {medication.duration}</p>
                  {medication.instructions && (
                    <p><span className="font-medium">Instructions:</span> {medication.instructions}</p>
                  )}
                  {medication.quantity && (
                    <p><span className="font-medium">Quantity:</span> {medication.quantity}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        {prescription.notes && (
          <div className="mb-4 bg-white rounded p-3 border border-green-100">
            <h4 className="font-semibold text-green-800 mb-1">Notes:</h4>
            <p className="text-xs text-green-700">{prescription.notes}</p>
          </div>
        )}

        {/* Doctor Signature Section */}
        <div className="mt-6 pt-4 border-t border-green-200">
          <div className="text-center">
            <div className="mb-2">
              <div className="h-8 border-b border-green-300 w-48 mx-auto mb-1"></div>
              <p className="text-xs text-green-700">Doctor's Signature</p>
            </div>
            <p className="text-sm font-medium text-green-800">
              Dr. {doctor.firstName || doctor.username} {doctor.lastName || ''}
            </p>
            <p className="text-xs text-green-600">{doctor.role}</p>
            {doctor.credentials && (
              <p className="text-xs text-green-600">{doctor.credentials}</p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .prescription-card { 
            width: 105mm !important;
            height: 148mm !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 8mm !important;
            background: #f0fdf4 !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
            border: 1px solid #bbf7d0 !important;
          }
          @page {
            size: A6;
            margin: 5mm;
          }
          body {
            font-size: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}