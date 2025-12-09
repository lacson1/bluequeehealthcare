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
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
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

        {/* Print Content - A5 Format with Light Green Background */}
        <div
          id="prescription-print-content"
          style={{
            width: '148mm',
            minHeight: '210mm',
            maxWidth: '148mm',
            backgroundColor: '#f0fdf4',
            padding: '16px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: '11px',
            lineHeight: '1.4',
            color: '#1f2937',
            overflow: 'visible'
          }}
        >
          {/* Organization Header */}
          <div style={{
            borderBottom: `2px solid ${organization.themeColor}`,
            paddingBottom: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {organization.logoUrl && (
                <img
                  src={organization.logoUrl}
                  alt={`${organization.name} Logo`}
                  style={{ height: '48px', width: '48px', objectFit: 'contain' }}
                />
              )}
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: organization.themeColor, marginBottom: '2px' }}>
                  {organization.name}
                </h1>
                <p style={{ fontSize: '10px', color: '#6b7280', textTransform: 'capitalize' }}>{organization.type}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '9px', color: '#6b7280' }}>
              {organization.address && <p>{organization.address}</p>}
              {organization.phone && <p>Tel: {organization.phone}</p>}
              {organization.email && <p>Email: {organization.email}</p>}
            </div>
          </div>

          {/* Document Title */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h2 style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: organization.themeColor,
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              MEDICAL PRESCRIPTION
            </h2>
            <p style={{ fontSize: '10px', color: '#6b7280' }}>
              Date: {formatDocumentDate(new Date())}
            </p>
          </div>

          {/* Patient Information */}
          <div style={{
            marginBottom: '16px',
            padding: '10px',
            backgroundColor: '#dcfce7',
            borderRadius: '6px'
          }}>
            <h3 style={{
              fontSize: '10px',
              fontWeight: '600',
              color: organization.themeColor,
              marginBottom: '8px',
              textTransform: 'uppercase',
              borderBottom: '1px solid #bbf7d0',
              paddingBottom: '4px'
            }}>
              Patient Information
            </h3>
            <div style={{ fontSize: '10px' }}>
              <p style={{ marginBottom: '4px' }}><strong>Name:</strong> {patient.title} {patient.firstName} {patient.lastName}</p>
              <p style={{ marginBottom: '4px' }}><strong>DOB:</strong> {new Date(patient.dateOfBirth).toLocaleDateString()} | <strong>Gender:</strong> {patient.gender}</p>
              <p><strong>Phone:</strong> {patient.phone}</p>
            </div>
          </div>

          {/* Prescription Details */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{
              fontSize: '11px',
              fontWeight: '600',
              color: organization.themeColor,
              marginBottom: '10px',
              textTransform: 'uppercase'
            }}>
              Prescribed Medications
            </h3>

            {activePrescriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                <MedicalIcons.prescription style={{ width: '40px', height: '40px', margin: '0 auto 12px', opacity: 0.5 }} />
                <p>No active prescriptions found for this patient.</p>
              </div>
            ) : (
              <div>
                {activePrescriptions.map((prescription, index) => (
                  <div
                    key={prescription.id}
                    style={{
                      borderLeft: `3px solid ${organization.themeColor}`,
                      paddingLeft: '10px',
                      marginBottom: '12px',
                      paddingTop: '4px',
                      paddingBottom: '4px'
                    }}
                  >
                    <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#166534', marginBottom: '6px' }}>
                      {index + 1}. {prescription.medicationName}
                    </h4>

                    <div style={{ fontSize: '10px' }}>
                      <p style={{ marginBottom: '3px' }}><strong>Dose:</strong> {prescription.dosage} | <strong>Freq:</strong> {prescription.frequency}</p>
                      <p style={{ marginBottom: '3px' }}><strong>Duration:</strong> {prescription.duration}</p>
                      {prescription.instructions && (
                        <p style={{ marginBottom: '3px' }}><strong>Instructions:</strong> {prescription.instructions}</p>
                      )}
                      <p style={{ color: '#6b7280' }}><strong>Prescribed by:</strong> Dr. {prescription.prescribedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Signatures */}
          <div style={{
            borderTop: '1px solid #d1d5db',
            paddingTop: '12px',
            marginTop: '16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '10px' }}>
              <div>
                <p style={{ fontWeight: '600', color: organization.themeColor, marginBottom: '4px' }}>Physician:</p>
                <p style={{ marginBottom: '4px' }}>Dr. {activePrescriptions[0]?.prescribedBy || 'N/A'}</p>
                <p style={{ color: '#6b7280', marginTop: '20px' }}>Signature: _______________</p>
              </div>
              <div>
                <p style={{ fontWeight: '600', color: organization.themeColor, marginBottom: '4px' }}>Pharmacy Use:</p>
                <p style={{ color: '#6b7280', marginBottom: '4px' }}>Dispensed by: _______________</p>
                <p style={{ color: '#6b7280' }}>Date: _______________</p>
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <div style={{
            marginTop: '12px',
            paddingTop: '8px',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
            fontSize: '8px',
            color: '#9ca3af'
          }}>
            <p>Valid only when issued by licensed healthcare practitioner | {organization.name}</p>
            <p>Printed: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}