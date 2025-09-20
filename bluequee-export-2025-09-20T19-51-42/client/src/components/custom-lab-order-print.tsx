import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { MedicalIcons } from '@/lib/medical-icons';
import { exportToPDF, printElement, generateClinicHeader, formatDocumentDate } from './print-export-utils';

interface LabOrder {
  id: number;
  patientId: number;
  testName: string;
  category: string;
  urgency: string;
  status: string;
  orderedBy: string;
  notes?: string;
  createdAt: string;
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

interface CustomLabOrderPrintProps {
  labOrders: LabOrder[];
  patient: Patient;
  onClose: () => void;
}

export default function CustomLabOrderPrint({ labOrders, patient, onClose }: CustomLabOrderPrintProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch active organization data
  const { data: organization } = useQuery<Organization>({
    queryKey: ['/api/print/organization'],
    retry: false,
  });

  const pendingOrders = labOrders.filter(order => order.status === 'pending' || order.status === 'ordered');

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      await printElement('lab-order-print-content');
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    setIsGenerating(true);
    try {
      await exportToPDF('lab-order-print-content', {
        filename: `lab_order_${patient.firstName}_${patient.lastName}_${new Date().toISOString().split('T')[0]}`,
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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'stat': return 'text-red-800 bg-red-100';
      case 'routine': return 'text-green-600 bg-green-50';
      default: return 'text-blue-600 bg-blue-50';
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
            <span>Laboratory Order Print Preview</span>
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

        {/* Print Content */}
        <div id="lab-order-print-content" className="bg-white p-8 print:p-0" style={{ minHeight: '297mm' }}>
        {/* Organization Header */}
        {generateClinicHeader(organization)}

        {/* Document Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: organization.themeColor }}>
            LABORATORY ORDER FORM
          </h2>
          <p className="text-sm text-gray-600">
            Date: {formatDocumentDate(new Date())}
          </p>
        </div>

        {/* Patient Information */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg print:bg-gray-100">
          <h3 className="text-lg font-semibold mb-4" style={{ color: organization.themeColor }}>
            Patient Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Name:</strong> {patient.title} {patient.firstName} {patient.lastName}</p>
              <p><strong>Phone:</strong> {patient.phone}</p>
              {patient.email && <p><strong>Email:</strong> {patient.email}</p>}
            </div>
            <div>
              <p><strong>Date of Birth:</strong> {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
              <p><strong>Gender:</strong> {patient.gender}</p>
              {patient.address && <p><strong>Address:</strong> {patient.address}</p>}
            </div>
          </div>
        </div>

        {/* Lab Orders */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4" style={{ color: organization.themeColor }}>
            Requested Laboratory Tests
          </h3>
          
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MedicalIcons.labOrder className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending laboratory orders found for this patient.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map((order, index) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold">{index + 1}. {order.testName}</h4>
                      <p className="text-sm text-gray-600 capitalize">Category: {order.category}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(order.urgency)}`}>
                        {order.urgency.toUpperCase()}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Ordered: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {order.notes && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded print:bg-gray-100">
                      <p><strong>Clinical Notes:</strong> {order.notes}</p>
                    </div>
                  )}
                  
                  <div className="mt-3 text-sm text-gray-600">
                    <p><strong>Ordered by:</strong> Dr. {order.orderedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lab Instructions */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg print:bg-gray-100">
          <h3 className="text-lg font-semibold mb-3" style={{ color: organization.themeColor }}>
            Laboratory Instructions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Patient Preparation:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Fast for 8-12 hours if required</li>
                <li>Bring valid identification</li>
                <li>Inform about current medications</li>
                <li>Follow specific test preparations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Sample Collection:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Collect samples as per protocol</li>
                <li>Ensure proper labeling</li>
                <li>Maintain chain of custody</li>
                <li>Process within recommended time</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Signatures Section */}
        <div className="border-t pt-6 mt-12">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold mb-2" style={{ color: organization.themeColor }}>
                Ordering Physician
              </h4>
              <div className="border-t border-gray-300 mt-8 pt-2">
                <p className="text-sm">Dr. {pendingOrders[0]?.orderedBy || 'N/A'}</p>
                <p className="text-sm text-gray-600">Signature & Date</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: organization.themeColor }}>
                Sample Collection
              </h4>
              <div className="border-t border-gray-300 mt-8 pt-2">
                <p className="text-sm text-gray-600">Collected by: ________________</p>
                <p className="text-sm text-gray-600 mt-2">Date/Time: ________________</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2" style={{ color: organization.themeColor }}>
                Laboratory Use
              </h4>
              <div className="border-t border-gray-300 mt-8 pt-2">
                <p className="text-sm text-gray-600">Received by: ________________</p>
                <p className="text-sm text-gray-600 mt-2">Lab ID: ________________</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with barcode space */}
        <div className="mt-8 pt-4 border-t">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium" style={{ color: organization.themeColor }}>
                Patient Copy
              </p>
              <p className="text-xs text-gray-500">Keep this copy for your records</p>
            </div>
            <div className="text-right">
              <div className="w-32 h-8 border border-gray-300 flex items-center justify-center text-xs text-gray-500">
                BARCODE SPACE
              </div>
              <p className="text-xs text-gray-500 mt-1">Lab Reference #</p>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="mt-8 text-xs text-gray-500 text-center border-t pt-4">
          <p>This laboratory order is valid only when issued by a licensed medical practitioner.</p>
          <p>Results will be available within the specified turnaround time and communicated as per protocol.</p>
          <p className="mt-2">Generated on {new Date().toLocaleString()} | {organization.name}</p>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}