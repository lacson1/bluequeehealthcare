import React from 'react';
import LetterheadTemplate from './LetterheadTemplate';
import { useActiveOrganization } from '@/hooks/useActiveOrganization';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer, Download, TestTube } from 'lucide-react';

interface LabTest {
  id: number;
  name: string;
  category: string;
  description?: string;
  urgency?: 'routine' | 'urgent' | 'stat';
}

interface LabOrder {
  id: number;
  tests: LabTest[];
  clinicalNotes?: string;
  urgency: 'routine' | 'urgent' | 'stat';
  createdAt: string;
  status: string;
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

interface LabOrderDocumentProps {
  labOrder: LabOrder;
  patient: Patient;
  doctor: Doctor;
  onPrint?: () => void;
  onDownload?: () => void;
}

export default function LabOrderDocument({
  labOrder,
  patient,
  doctor,
  onPrint,
  onDownload
}: LabOrderDocumentProps) {
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
      case 'stat': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'stat': return 'STAT - Immediate';
      case 'urgent': return 'URGENT - Within 2 hours';
      default: return 'ROUTINE - Within 24 hours';
    }
  };

  if (isLoading || !organization) {
    return <div className="flex items-center justify-center p-8">Loading organization data...</div>;
  }

  return (
    <div className="lab-order-document">
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
        documentType="lab_order"
        documentTitle="LABORATORY ORDER"
        documentDate={new Date(labOrder.createdAt)}
        additionalInfo={`Lab Order #${labOrder.id}`}
      >
        <div className="lab-order-content space-y-6">
          {/* Order Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div 
                className="p-3 rounded-lg text-white"
                style={{ backgroundColor: organization.themeColor || '#3B82F6' }}
              >
                <TestTube className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Laboratory Tests Requested</h3>
                <p className="text-sm text-gray-600">
                  Order Date: {format(new Date(labOrder.createdAt), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getUrgencyColor(labOrder.urgency)}`}>
              {getUrgencyLabel(labOrder.urgency)}
            </div>
          </div>

          {/* Tests by Category */}
          <div className="tests-section">
            {Object.entries(
              labOrder.tests.reduce((acc, test) => {
                if (!acc[test.category]) acc[test.category] = [];
                acc[test.category].push(test);
                return acc;
              }, {} as Record<string, LabTest[]>)
            ).map(([category, tests]) => (
              <div key={category} className="category-section mb-6">
                <h4 
                  className="text-lg font-semibold mb-3 pb-2 border-b-2"
                  style={{ borderBottomColor: organization.themeColor || '#3B82F6' }}
                >
                  {category}
                </h4>
                <div className="tests-grid space-y-3">
                  {tests.map((test) => (
                    <div 
                      key={test.id} 
                      className="test-item bg-gray-50 border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{test.name}</h5>
                          {test.description && (
                            <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                          )}
                        </div>
                        {test.urgency && test.urgency !== labOrder.urgency && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(test.urgency)}`}>
                            {test.urgency.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Clinical Information */}
          {labOrder.clinicalNotes && (
            <div 
              className="clinical-notes p-4 rounded-lg border-l-4"
              style={{ 
                backgroundColor: `${organization.themeColor || '#3B82F6'}10`,
                borderLeftColor: organization.themeColor || '#3B82F6'
              }}
            >
              <h4 className="font-semibold text-gray-900 mb-2">Clinical Information:</h4>
              <p className="text-gray-700 leading-relaxed">{labOrder.clinicalNotes}</p>
            </div>
          )}

          {/* Special Instructions */}
          <div className="instructions-section bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Patient Preparation Instructions:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Follow any fasting requirements as specified</li>
              <li>• Bring a valid ID and insurance card</li>
              <li>• Inform lab staff of any medications you are taking</li>
              <li>• Report any allergies or medical conditions</li>
              <li>• Arrive at least 15 minutes before appointment</li>
            </ul>
          </div>

          {/* Collection Information */}
          <div className="collection-info bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">For Laboratory Use:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Collection Date:</span>
                <p className="border-b border-blue-300 mt-1 pb-1">_______________</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Collection Time:</span>
                <p className="border-b border-blue-300 mt-1 pb-1">_______________</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Collected By:</span>
                <p className="border-b border-blue-300 mt-1 pb-1">_______________</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Lab Tech ID:</span>
                <p className="border-b border-blue-300 mt-1 pb-1">_______________</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="contact-info border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Questions or Results Inquiry:</h4>
            <p className="text-sm text-gray-700">
              Contact {organization.name} at {organization.phone} or email {organization.email}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Results will be available within 2-5 business days depending on test complexity
            </p>
          </div>
        </div>
      </LetterheadTemplate>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .lab-order-document { 
            background: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}