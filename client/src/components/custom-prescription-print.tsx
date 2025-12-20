import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { MedicalIcons } from '@/lib/medical-icons';
import { exportToPDF, generateClinicHeader, formatDocumentDate, generateBrandedPDF } from './print-export-utils';
import { openPrintWindowWithLetterhead } from '@/utils/organization-print';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { generateMedicationQRText } from '@/utils/qr-code-generator';
import { useLocation } from 'wouter';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

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
  const [printError, setPrintError] = useState<string | null>(null);
  const [includeAllStatuses, setIncludeAllStatuses] = useState(false);
  const { user, refreshUser, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Some user types (e.g. fallback superadmin) may not have organizationId, but they can still
  // carry an organization object (including id 0). Treat that as valid org context for printing.
  const hasOrganizationContext =
    user?.organizationId !== undefined && user?.organizationId !== null
      ? true
      : user?.organization?.id !== undefined && user?.organization?.id !== null;

  // Fetch org data for printing. Avoid /api/organizations/:id (not implemented in modular router);
  // use the print-specific endpoint which returns the best available org for the current session.
  const { data: fetchedOrganization, isLoading: isLoadingOrg, error: orgError } = useQuery<Organization>({
    queryKey: ['/api/print/organization', user?.organizationId, user?.organization?.id],
    queryFn: async () => {
      const res = await fetch('/api/print/organization', { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || body?.message || `Failed to fetch organization: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: !!user && !isLoading,
    retry: false,
  });

  // Prefer org from auth context (e.g. fallback superadmin), otherwise use fetched print org.
  const organization: Organization | undefined = (user?.organization as any) || fetchedOrganization;

  // Filter prescriptions based on status preference
  const activePrescriptions = prescriptions.filter(p => 
    includeAllStatuses ? true : (p.status === 'active' || p.status === 'pending' || !p.status)
  );
  
  const allPrescriptionsCount = prescriptions.length;
  const inactivePrescriptionsCount = prescriptions.filter(p => 
    p.status !== 'active' && p.status !== 'pending' && p.status
  ).length;

  const handlePrint = async () => {
    setIsGenerating(true);
    setPrintError(null);
    try {
      const element = document.getElementById('prescription-print-content');
      if (!element) {
        throw new Error('Prescription content not found');
      }

      if (activePrescriptions.length === 0) {
        throw new Error('No active prescriptions to print');
      }

      // Extract the content HTML (without the wrapper div styles)
      const contentHTML = element.innerHTML;

      const printWindow = await openPrintWindowWithLetterhead(
        contentHTML,
        'Medical Prescription',
        {
          documentId: `RX-${patient.id}-${Date.now()}`,
          documentDate: new Date(),
          organizationId: user?.organizationId,
          organization: organization,
          pageSize: 'A5',
          orientation: 'portrait',
          autoPrint: true
        }
      );

      if (!printWindow) {
        throw new Error('Failed to open print window. Please check your popup blocker settings.');
      }

      toast({
        title: 'Print window opened',
        description: 'The prescription print preview has been opened in a new window.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to print prescription';
      console.error('Print failed:', error);
      setPrintError(errorMessage);
      toast({
        title: 'Print failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    setIsGenerating(true);
    setPrintError(null);
    try {
      const element = document.getElementById('prescription-print-content');
      if (!element) {
        throw new Error('Prescription content not found');
      }

      if (activePrescriptions.length === 0) {
        throw new Error('No active prescriptions to export');
      }

      if (!organization) {
        throw new Error('Organization information not available');
      }

      const contentHTML = element.innerHTML;

      await generateBrandedPDF(
        organization,
        {
          filename: `prescription_${patient.firstName}_${patient.lastName}_${new Date().toISOString().split('T')[0]}`,
          documentTitle: 'Medical Prescription',
          documentId: `RX-${patient.id}-${Date.now()}`,
          documentDate: new Date(),
          pageSize: 'A5',
          orientation: 'portrait',
          showFooter: true
        },
        contentHTML
      );

      toast({
        title: 'PDF exported successfully',
        description: 'The prescription has been saved as a PDF file.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export PDF';
      console.error('PDF export failed:', error);
      setPrintError(errorMessage);
      toast({
        title: 'PDF export failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape to close
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      // Ctrl/Cmd + P to print
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        if (activePrescriptions.length > 0 && !isGenerating) {
          handlePrint();
        }
        return;
      }
      // Ctrl/Cmd + S to export PDF
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (activePrescriptions.length > 0 && !isGenerating) {
          handleExportPDF();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePrescriptions.length, isGenerating, onClose, handlePrint, handleExportPDF]);

  // Don't show "no org assigned" while auth is still resolving; it causes a confusing flash.
  if (isLoading) {
    return (
      <Card className="p-6">
        <CardContent>
          <div className="text-center">
            <MedicalIcons.refresh className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading user session...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we truly have no org context (neither organizationId nor organization object), block printing.
  if (!hasOrganizationContext) {
    const handleGoToUserManagement = () => {
      setLocation('/user-management');
    };

    const handleRefresh = async () => {
      await refreshUser();
      toast({
        title: 'Refreshed',
        description: 'Checking for organization assignment...',
      });
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'super_admin';

    return (
      <Card className="p-6">
        <CardContent>
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <p className="text-destructive font-medium">No organization assigned to your account.</p>
              <p className="text-sm text-muted-foreground mt-2">
                An organization assignment is required to print prescriptions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                className="h-8 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={handleGoToUserManagement}
                  className="h-8 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Assign via Admin Panel
                </Button>
              )}
            </div>
            {!isAdmin && (
              <p className="text-xs text-muted-foreground pt-2">
                Please contact an administrator to assign you to an organization.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingOrg) {
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

  if (orgError || !organization) {
    return (
      <Card className="p-6">
        <CardContent>
          <div className="text-center">
            <p className="text-destructive">Failed to load organization details.</p>
            <p className="text-sm text-muted-foreground mt-2">
              {orgError instanceof Error ? orgError.message : 'Please try again later.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[650px] w-full max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-4 border-b mb-4">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-base sm:text-lg font-semibold flex-shrink-0">
              Prescription Print Preview
              {activePrescriptions.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({activePrescriptions.length} {activePrescriptions.length === 1 ? 'prescription' : 'prescriptions'})
                </span>
              )}
              <span className="ml-2 text-xs font-normal text-gray-400">
                (Press Esc to close, Ctrl+P to print, Ctrl+S to export PDF)
              </span>
            </DialogTitle>
            <div className="flex gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                onClick={handlePrint} 
                disabled={isGenerating || activePrescriptions.length === 0}
                size="sm"
                className="h-8 px-3 text-xs sm:text-sm"
                aria-label="Print prescription"
                title="Print prescription (Ctrl+P)"
              >
                {isGenerating ? (
                  <>
                    <MedicalIcons.refresh className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <MedicalIcons.print className="w-3.5 h-3.5 mr-1.5" />
                    Print
                  </>
                )}
              </Button>
              <Button 
                onClick={handleExportPDF} 
                disabled={isGenerating || activePrescriptions.length === 0}
                size="sm"
                className="h-8 px-3 text-xs sm:text-sm"
                aria-label="Export prescription as PDF"
                title="Export PDF (Ctrl+S)"
              >
                {isGenerating ? (
                  <>
                    <MedicalIcons.refresh className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <MedicalIcons.download className="w-3.5 h-3.5 mr-1.5" />
                    Export PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Error Message */}
        {printError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{printError}</p>
          </div>
        )}

        {/* Status Filter Toggle */}
        {allPrescriptionsCount > 0 && inactivePrescriptionsCount > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Prescription Status Filter</p>
                <p className="text-xs text-blue-700 mt-1">
                  {includeAllStatuses 
                    ? `Showing all ${allPrescriptionsCount} prescription${allPrescriptionsCount > 1 ? 's' : ''}`
                    : `Showing ${activePrescriptions.length} active prescription${activePrescriptions.length > 1 ? 's' : ''} (${inactivePrescriptionsCount} other${inactivePrescriptionsCount > 1 ? 's' : ''} available)`
                  }
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIncludeAllStatuses(!includeAllStatuses)}
                className="h-7 px-3 text-xs"
                aria-label={includeAllStatuses ? "Show only active prescriptions" : "Show all prescriptions"}
              >
                {includeAllStatuses ? 'Show Active Only' : 'Show All'}
              </Button>
            </div>
          </div>
        )}

        {/* Print Content - A5 Format with Light Green Background */}
        <div className="flex justify-center">
          <div
            id="prescription-print-content"
            style={{
              width: '148mm',
              minHeight: '210mm',
              maxWidth: '148mm',
              aspectRatio: '148 / 210',
              backgroundColor: '#f0fdf4',
              padding: '16px',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              fontSize: '11px',
              lineHeight: '1.4',
              color: '#1f2937',
              overflow: 'visible',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              borderRadius: '4px'
            }}
          >
            <style>{`
              @media print {
                @page {
                  size: A5 portrait;
                  margin: 10mm;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
                #prescription-print-content {
                  width: 100% !important;
                  max-width: 100% !important;
                  min-height: auto !important;
                  box-shadow: none !important;
                  border-radius: 0 !important;
                  padding: 10mm !important;
                  background: white !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>
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
            {activePrescriptions.length > 1 && (
              <p style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
                {activePrescriptions.length} medications prescribed
              </p>
            )}
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
                <p style={{ marginBottom: '8px', fontWeight: '500' }}>No active prescriptions found for this patient.</p>
                {allPrescriptionsCount > 0 && (
                  <p style={{ fontSize: '9px', color: '#9ca3af', marginTop: '8px' }}>
                    {inactivePrescriptionsCount > 0 
                      ? `${inactivePrescriptionsCount} prescription${inactivePrescriptionsCount > 1 ? 's' : ''} with other status${inactivePrescriptionsCount > 1 ? 'es' : ''} available.`
                      : 'All prescriptions have been completed or discontinued.'}
                  </p>
                )}
              </div>
            ) : (
              <div>
                {activePrescriptions.map((prescription, index) => (
                  <div
                    key={prescription.id}
                    style={{
                      borderLeft: `3px solid ${organization.themeColor}`,
                      paddingLeft: '10px',
                      marginBottom: '16px',
                      paddingTop: '8px',
                      paddingBottom: '8px',
                      paddingRight: '8px',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#166534', margin: 0 }}>
                        {index + 1}. {prescription.medicationName}
                      </h4>
                      <span style={{ fontSize: '8px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                        RX #{prescription.id}
                      </span>
                    </div>

                    <div style={{ fontSize: '10px', lineHeight: '1.5' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '4px' }}>
                        <p style={{ margin: 0 }}><strong>Dose:</strong> {prescription.dosage || 'As prescribed'}</p>
                        <p style={{ margin: 0 }}><strong>Frequency:</strong> {prescription.frequency || 'As directed'}</p>
                      </div>
                      <p style={{ marginBottom: '4px', marginTop: '4px' }}>
                        <strong>Duration:</strong> {prescription.duration || 'As prescribed'}
                      </p>
                      {prescription.instructions && (
                        <div style={{ 
                          marginTop: '4px', 
                          padding: '6px', 
                          backgroundColor: '#fef3c7', 
                          borderRadius: '4px',
                          borderLeft: '3px solid #f59e0b'
                        }}>
                          <strong style={{ color: '#92400e' }}>Instructions:</strong>
                          <p style={{ margin: '2px 0 0 0', color: '#78350f' }}>{prescription.instructions}</p>
                        </div>
                      )}
                      <p style={{ color: '#6b7280', marginTop: '6px', fontSize: '9px' }}>
                        <strong>Prescribed by:</strong> Dr. {prescription.prescribedBy}
                        {prescription.startDate && (
                          <span style={{ marginLeft: '8px' }}>
                            | <strong>Start:</strong> {new Date(prescription.startDate).toLocaleDateString()}
                          </span>
                        )}
                      </p>
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
                <p style={{ fontWeight: '600', color: organization.themeColor, marginBottom: '4px' }}>Prescribing Physician:</p>
                <p style={{ marginBottom: '4px', fontWeight: '500' }}>Dr. {activePrescriptions[0]?.prescribedBy || 'N/A'}</p>
                <p style={{ color: '#6b7280', marginTop: '30px', borderTop: '1px solid #d1d5db', paddingTop: '4px' }}>
                  Signature: _______________
                </p>
                <p style={{ color: '#6b7280', fontSize: '8px', marginTop: '4px' }}>
                  License No: _______________
                </p>
              </div>
              <div>
                <p style={{ fontWeight: '600', color: organization.themeColor, marginBottom: '4px' }}>Pharmacy Dispensing:</p>
                <p style={{ color: '#6b7280', marginBottom: '4px' }}>Dispensed by: _______________</p>
                <p style={{ color: '#6b7280', marginBottom: '4px' }}>License No: _______________</p>
                <p style={{ color: '#6b7280', marginTop: '20px', borderTop: '1px solid #d1d5db', paddingTop: '4px' }}>
                  Date Dispensed: _______________
                </p>
              </div>
            </div>
          </div>

          {/* QR Code for Verification */}
          {activePrescriptions.length > 0 && (
            <div style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <div style={{ 
                display: 'inline-block',
                padding: '8px',
                backgroundColor: '#ffffff',
                borderRadius: '4px',
                border: '1px solid #d1d5db'
              }}>
                <QRCodeSVG
                  value={generateMedicationQRText(
                    {
                      name: activePrescriptions.length === 1 
                        ? activePrescriptions[0].medicationName
                        : `${activePrescriptions.length} Medications`,
                      dosage: activePrescriptions.length === 1 ? activePrescriptions[0].dosage : undefined,
                      frequency: activePrescriptions.length === 1 ? activePrescriptions[0].frequency : undefined,
                      duration: activePrescriptions.length === 1 ? activePrescriptions[0].duration : undefined,
                      instructions: activePrescriptions.length === 1 ? activePrescriptions[0].instructions : undefined,
                      prescribedBy: activePrescriptions[0]?.prescribedBy,
                      startDate: activePrescriptions[0]?.startDate,
                      prescriptionId: activePrescriptions.map(p => p.id).join(',')
                    },
                    {
                      firstName: patient.firstName,
                      lastName: patient.lastName,
                      phone: patient.phone,
                      dateOfBirth: patient.dateOfBirth,
                      id: patient.id,
                      title: patient.title
                    }
                  )}
                  size={60}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p style={{ fontSize: '7px', color: '#6b7280', marginTop: '4px' }}>
                {activePrescriptions.length === 1 
                  ? 'Scan to verify prescription'
                  : `Scan to verify ${activePrescriptions.length} prescriptions`
                }
              </p>
            </div>
          )}

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
        </div>
      </DialogContent>
    </Dialog>
  );
}