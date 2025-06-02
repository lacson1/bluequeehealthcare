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

      <LetterheadTemplate
        organization={organization}
        doctor={doctor}
        patient={patient}
        documentType="prescription"
        documentTitle="MEDICAL PRESCRIPTION"
        documentDate={new Date(prescription.createdAt)}
        additionalInfo={`Prescription #${prescription.id}`}
      >
        <div className="prescription-content space-y-6">
          {/* Rx Symbol and Header */}
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="text-4xl font-bold px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: organization.themeColor || '#3B82F6' }}
            >
              Rx
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Prescribed Medications</h3>
              <p className="text-sm text-gray-600">
                Date: {format(new Date(prescription.createdAt), 'MMMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Medications List */}
          <div className="medications-list space-y-4">
            {prescription.medications.map((medication, index) => (
              <div 
                key={medication.id} 
                className="medication-item border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-semibold text-green-700 uppercase">
                    {index + 1}. {medication.name}
                  </h4>
                  {medication.quantity && (
                    <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                      Qty: {medication.quantity}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Dosage:</span>
                    <p className="text-gray-900">{medication.dosage}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Frequency:</span>
                    <p className="text-gray-900">{medication.frequency}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Duration:</span>
                    <p className="text-gray-900">{medication.duration}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Instructions:</span>
                    <p className="text-gray-900">{medication.instructions}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Notes */}
          {prescription.notes && (
            <div 
              className="notes-section p-4 rounded-lg border-l-4"
              style={{ 
                backgroundColor: `${organization.themeColor || '#3B82F6'}10`,
                borderLeftColor: organization.themeColor || '#3B82F6'
              }}
            >
              <h4 className="font-semibold text-gray-900 mb-2">Additional Instructions:</h4>
              <p className="text-gray-700 leading-relaxed">{prescription.notes}</p>
            </div>
          )}

          {/* Important Medication Guidelines */}
          <div className="guidelines-section bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Important Guidelines:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Take medications exactly as prescribed</li>
              <li>• Complete the full course even if you feel better</li>
              <li>• Contact your doctor if you experience adverse reactions</li>
              <li>• Store medications in a cool, dry place away from children</li>
              <li>• Do not share medications with others</li>
            </ul>
          </div>

          {/* Follow-up Instructions */}
          <div className="follow-up bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Follow-up Care:</h4>
            <p className="text-sm text-blue-700">
              Please schedule a follow-up appointment if symptoms persist or worsen. 
              Contact {organization.name} at {organization.phone} for any concerns.
            </p>
          </div>
        </div>
      </LetterheadTemplate>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .prescription-document { 
            background: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}