import React from 'react';
import LetterheadTemplate from './LetterheadTemplate';
import { useActiveOrganization } from '@/hooks/useActiveOrganization';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer, Download, Stethoscope, Heart, Thermometer } from 'lucide-react';

interface VitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

interface Visit {
  id: number;
  visitDate: string;
  visitType: string;
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  assessment?: string;
  plan?: string;
  followUpInstructions?: string;
  nextVisitDate?: string;
  vitalSigns?: VitalSigns;
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

interface VisitSummaryDocumentProps {
  visit: Visit;
  patient: Patient;
  doctor: Doctor;
  onPrint?: () => void;
  onDownload?: () => void;
}

export default function VisitSummaryDocument({
  visit,
  patient,
  doctor,
  onPrint,
  onDownload
}: VisitSummaryDocumentProps) {
  const { organization, isLoading } = useActiveOrganization();

  const handlePrint = () => {
    window.print();
    onPrint?.();
  };

  const handleDownload = () => {
    onDownload?.();
  };

  const formatBloodPressure = (systolic?: number, diastolic?: number) => {
    if (systolic && diastolic) {
      return `${systolic}/${diastolic} mmHg`;
    }
    return 'Not recorded';
  };

  if (isLoading || !organization) {
    return <div className="flex items-center justify-center p-8">Loading organization data...</div>;
  }

  return (
    <div className="visit-summary-document">
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
        documentType="medical_letter"
        documentTitle="CONSULTATION VISIT SUMMARY"
        documentDate={new Date(visit.visitDate)}
        additionalInfo={`Visit #${visit.id}`}
      >
        <div className="visit-content space-y-6">
          {/* Visit Header */}
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="p-3 rounded-lg text-white"
              style={{ backgroundColor: organization.themeColor || '#3B82F6' }}
            >
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Medical Consultation Summary</h3>
              <p className="text-sm text-gray-600">
                Visit Date: {format(new Date(visit.visitDate), 'MMMM dd, yyyy')}
              </p>
              <p className="text-sm text-gray-600">
                Visit Type: {visit.visitType}
              </p>
            </div>
          </div>

          {/* Vital Signs */}
          {visit.vitalSigns && (
            <div className="vital-signs-section bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Vital Signs
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Blood Pressure:</span>
                  <p className="text-gray-900">{formatBloodPressure(visit.vitalSigns.bloodPressureSystolic, visit.vitalSigns.bloodPressureDiastolic)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Heart Rate:</span>
                  <p className="text-gray-900">{visit.vitalSigns.heartRate ? `${visit.vitalSigns.heartRate} bpm` : 'Not recorded'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Temperature:</span>
                  <p className="text-gray-900">{visit.vitalSigns.temperature ? `${visit.vitalSigns.temperature}°C` : 'Not recorded'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Respiratory Rate:</span>
                  <p className="text-gray-900">{visit.vitalSigns.respiratoryRate ? `${visit.vitalSigns.respiratoryRate} /min` : 'Not recorded'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Oxygen Saturation:</span>
                  <p className="text-gray-900">{visit.vitalSigns.oxygenSaturation ? `${visit.vitalSigns.oxygenSaturation}%` : 'Not recorded'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Weight:</span>
                  <p className="text-gray-900">{visit.vitalSigns.weight ? `${visit.vitalSigns.weight} kg` : 'Not recorded'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Chief Complaint */}
          <div 
            className="chief-complaint p-4 rounded-lg border-l-4"
            style={{ 
              backgroundColor: `${organization.themeColor || '#3B82F6'}10`,
              borderLeftColor: organization.themeColor || '#3B82F6'
            }}
          >
            <h4 className="font-semibold text-gray-900 mb-2">Chief Complaint:</h4>
            <p className="text-gray-700">{visit.chiefComplaint}</p>
          </div>

          {/* History of Present Illness */}
          {visit.historyOfPresentIllness && (
            <div className="history-section">
              <h4 className="font-semibold text-gray-900 mb-2">History of Present Illness:</h4>
              <p className="text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-lg p-4">
                {visit.historyOfPresentIllness}
              </p>
            </div>
          )}

          {/* Physical Examination */}
          {visit.physicalExamination && (
            <div className="examination-section">
              <h4 className="font-semibold text-gray-900 mb-2">Physical Examination:</h4>
              <p className="text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-lg p-4">
                {visit.physicalExamination}
              </p>
            </div>
          )}

          {/* Assessment */}
          {visit.assessment && (
            <div className="assessment-section">
              <h4 className="font-semibold text-gray-900 mb-2">Clinical Assessment:</h4>
              <p className="text-gray-700 leading-relaxed bg-blue-50 border border-blue-200 rounded-lg p-4">
                {visit.assessment}
              </p>
            </div>
          )}

          {/* Treatment Plan */}
          {visit.plan && (
            <div className="plan-section">
              <h4 className="font-semibold text-gray-900 mb-2">Treatment Plan:</h4>
              <p className="text-gray-700 leading-relaxed bg-green-50 border border-green-200 rounded-lg p-4">
                {visit.plan}
              </p>
            </div>
          )}

          {/* Follow-up Instructions */}
          {visit.followUpInstructions && (
            <div className="followup-section">
              <h4 className="font-semibold text-gray-900 mb-2">Follow-up Instructions:</h4>
              <p className="text-gray-700 leading-relaxed bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                {visit.followUpInstructions}
              </p>
            </div>
          )}

          {/* Next Visit */}
          {visit.nextVisitDate && (
            <div className="next-visit bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-2">Next Appointment:</h4>
              <p className="text-orange-700">
                Please schedule your next visit for: {format(new Date(visit.nextVisitDate), 'MMMM dd, yyyy')}
              </p>
            </div>
          )}

          {/* General Instructions */}
          <div className="general-instructions bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">General Instructions:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Take medications as prescribed</li>
              <li>• Contact the clinic if symptoms worsen</li>
              <li>• Maintain a healthy diet and exercise routine</li>
              <li>• Keep track of any new symptoms</li>
              <li>• Follow up as scheduled</li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="contact-info border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Contact Information:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p>For any questions or concerns, please contact:</p>
              <p><strong>{organization.name}</strong></p>
              <p>Phone: {organization.phone}</p>
              <p>Email: {organization.email}</p>
              <p className="text-xs text-gray-500 mt-2">
                In case of emergency, please visit the nearest emergency room or call emergency services.
              </p>
            </div>
          </div>

          {/* Medical Records Notice */}
          <div className="records-notice bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Medical Records:</h4>
            <p className="text-sm text-blue-700">
              This visit summary is part of your medical record at {organization.name}. 
              Please keep this document for your records and bring it to future appointments.
            </p>
          </div>
        </div>
      </LetterheadTemplate>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .visit-summary-document { 
            background: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}