import React from 'react';
import LetterheadTemplate from './LetterheadTemplate';
import { useActiveOrganization } from '@/hooks/useActiveOrganization';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer, Download, FileText, AlertCircle } from 'lucide-react';

interface ReferralLetter {
  id: number;
  referralType: string;
  specialistName: string;
  specialistHospital: string;
  specialistAddress: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  clinicalHistory: string;
  currentFindings: string;
  reasonForReferral: string;
  specificQuestions: string;
  currentMedications: string;
  relevantInvestigations: string;
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

interface ReferralLetterDocumentProps {
  referralLetter: ReferralLetter;
  patient: Patient;
  doctor: Doctor;
  onPrint?: () => void;
  onDownload?: () => void;
}

export default function ReferralLetterDocument({
  referralLetter,
  patient,
  doctor,
  onPrint,
  onDownload
}: ReferralLetterDocumentProps) {
  const { organization, isLoading } = useActiveOrganization();

  const handlePrint = () => {
    window.print();
    onPrint?.();
  };

  const handleDownload = () => {
    onDownload?.();
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'EMERGENCY - Immediate attention required';
      case 'urgent': return 'URGENT - Please see within 48 hours';
      default: return 'ROUTINE - Standard referral';
    }
  };

  if (isLoading || !organization) {
    return <div className="flex items-center justify-center p-8">Loading organization data...</div>;
  }

  return (
    <div className="referral-letter-document">
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
        documentType="referral_letter"
        documentTitle="REFERRAL LETTER"
        documentDate={new Date(referralLetter.createdAt)}
        additionalInfo={`Referral #${referralLetter.id}`}
      >
        <div className="referral-content space-y-6">
          {/* Letter Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div 
                className="p-3 rounded-lg text-white"
                style={{ backgroundColor: organization.themeColor || '#3B82F6' }}
              >
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Medical Referral</h3>
                <p className="text-sm text-gray-600">
                  Date: {format(new Date(referralLetter.createdAt), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getUrgencyColor(referralLetter.urgency)}`}>
              {getUrgencyLabel(referralLetter.urgency)}
            </div>
          </div>

          {/* Recipient Information */}
          <div className="recipient-info bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">To:</h4>
            <div className="grid grid-cols-1 gap-2">
              <p className="font-medium text-gray-900">{referralLetter.specialistName}</p>
              <p className="text-gray-700">{referralLetter.referralType} Specialist</p>
              <p className="text-gray-700">{referralLetter.specialistHospital}</p>
              <p className="text-gray-700">{referralLetter.specialistAddress}</p>
            </div>
          </div>

          {/* Subject Line */}
          <div 
            className="subject-line p-4 rounded-lg border-l-4"
            style={{ 
              backgroundColor: `${organization.themeColor || '#3B82F6'}10`,
              borderLeftColor: organization.themeColor || '#3B82F6'
            }}
          >
            <h4 className="font-semibold text-gray-900">
              Re: {patient.title} {patient.firstName} {patient.lastName}
            </h4>
            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
              <div><strong>DOB:</strong> {format(new Date(patient.dateOfBirth), 'MMM dd, yyyy')}</div>
              <div><strong>Gender:</strong> {patient.gender || 'Not specified'}</div>
              <div><strong>Phone:</strong> {patient.phone}</div>
              <div><strong>Specialty Required:</strong> {referralLetter.referralType}</div>
            </div>
          </div>

          {/* Emergency Alert */}
          {referralLetter.urgency === 'emergency' && (
            <div className="emergency-alert bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">EMERGENCY REFERRAL</h4>
                  <p className="text-red-700 text-sm">This patient requires immediate attention. Please prioritize this referral.</p>
                </div>
              </div>
            </div>
          )}

          {/* Clinical History */}
          {referralLetter.clinicalHistory && (
            <div className="clinical-section">
              <h4 className="font-semibold text-gray-900 mb-2">Clinical History:</h4>
              <p className="text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-lg p-4">
                {referralLetter.clinicalHistory}
              </p>
            </div>
          )}

          {/* Current Findings */}
          {referralLetter.currentFindings && (
            <div className="findings-section">
              <h4 className="font-semibold text-gray-900 mb-2">Current Findings:</h4>
              <p className="text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-lg p-4">
                {referralLetter.currentFindings}
              </p>
            </div>
          )}

          {/* Reason for Referral */}
          <div className="reason-section">
            <h4 className="font-semibold text-gray-900 mb-2">Reason for Referral:</h4>
            <p className="text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-lg p-4">
              {referralLetter.reasonForReferral}
            </p>
          </div>

          {/* Specific Questions */}
          {referralLetter.specificQuestions && (
            <div className="questions-section">
              <h4 className="font-semibold text-gray-900 mb-2">Specific Questions for Specialist:</h4>
              <p className="text-gray-700 leading-relaxed bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                {referralLetter.specificQuestions}
              </p>
            </div>
          )}

          {/* Current Medications */}
          {referralLetter.currentMedications && (
            <div className="medications-section">
              <h4 className="font-semibold text-gray-900 mb-2">Current Medications:</h4>
              <p className="text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-lg p-4">
                {referralLetter.currentMedications}
              </p>
            </div>
          )}

          {/* Relevant Investigations */}
          {referralLetter.relevantInvestigations && (
            <div className="investigations-section">
              <h4 className="font-semibold text-gray-900 mb-2">Relevant Investigations:</h4>
              <p className="text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-lg p-4">
                {referralLetter.relevantInvestigations}
              </p>
            </div>
          )}

          {/* Request for Communication */}
          <div className="communication-request bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Request for Communication:</h4>
            <p className="text-blue-700 text-sm">
              I would be grateful if you could see this patient and provide your expert opinion. 
              Please send a copy of your consultation report to our clinic for continuity of care.
            </p>
          </div>

          {/* Contact for Queries */}
          <div className="contact-queries border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">For Any Queries:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p>Contact: {organization.name}</p>
              <p>Phone: {organization.phone}</p>
              <p>Email: {organization.email}</p>
            </div>
          </div>

          {/* Closing */}
          <div className="closing-section">
            <p className="text-gray-700 mb-4">
              Thank you for your time and expertise in managing this patient.
            </p>
            <p className="text-gray-700">
              Yours sincerely,
            </p>
          </div>
        </div>
      </LetterheadTemplate>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .referral-letter-document { 
            background: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}