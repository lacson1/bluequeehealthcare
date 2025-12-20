import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { MedicalIcons } from '@/lib/medical-icons';
import { exportToPDF, printElement, generateClinicHeader, formatDocumentDate } from './print-export-utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

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
                An organization assignment is required to print lab orders.
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
              Laboratory Order Print Preview
            </DialogTitle>
            <div className="flex gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                onClick={handlePrint} 
                disabled={isGenerating}
                size="sm"
                className="h-8 px-3 text-xs sm:text-sm"
              >
                <MedicalIcons.print className="w-3.5 h-3.5 mr-1.5" />
                Print
              </Button>
              <Button 
                onClick={handleExportPDF} 
                disabled={isGenerating}
                size="sm"
                className="h-8 px-3 text-xs sm:text-sm"
              >
                <MedicalIcons.download className="w-3.5 h-3.5 mr-1.5" />
                Export PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Print Content - Force light mode with explicit styles */}
        <div className="flex justify-center">
          <div 
            id="lab-order-print-content" 
            className="bg-white dark:bg-white text-gray-900 dark:text-gray-900 p-8 print:p-0" 
            style={{ 
              width: '210mm',
              minHeight: '297mm',
              maxWidth: '210mm',
              aspectRatio: '210 / 297',
              colorScheme: 'light',
              backgroundColor: 'white',
              color: '#1f2937',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              borderRadius: '4px'
            }}
          >
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
        </div>
      </DialogContent>
    </Dialog>
  );
}