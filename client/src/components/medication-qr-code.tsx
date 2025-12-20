import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  QrCode,
  Download,
  Printer,
  Pill,
  User,
  Calendar,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/date-utils';
import { openPrintWindowWithLetterhead } from '@/utils/organization-print';
import { useAuth } from '@/contexts/AuthContext';

interface MedicationData {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  prescribedBy?: string;
  startDate?: string;
  endDate?: string;
  patientName?: string;
  patientId?: number;
  prescriptionId?: number;
}

interface MedicationQRCodeProps {
  medication: MedicationData;
  patient?: {
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    id: number;
  };
  className?: string;
  showButton?: boolean;
}

export function MedicationQRCode({
  medication,
  patient,
  className = '',
  showButton = true,
}: MedicationQRCodeProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const generateQRData = () => {
    const qrData = {
      type: 'MEDICATION_PRESCRIPTION',
      medication: {
        name: medication.name,
        dosage: medication.dosage || 'As prescribed',
        frequency: medication.frequency || 'As directed',
        duration: medication.duration || 'As needed',
        instructions: medication.instructions || 'Take as directed',
      },
      patient: patient
        ? {
            name: `${patient.firstName} ${patient.lastName}`,
            id: patient.id,
            phone: patient.phone || 'Not provided',
            dateOfBirth: patient.dateOfBirth || 'Not provided',
          }
        : medication.patientName
        ? { name: medication.patientName }
        : null,
      prescriber: medication.prescribedBy
        ? { name: medication.prescribedBy }
        : null,
      dates: {
        startDate: medication.startDate || new Date().toISOString(),
        endDate: medication.endDate || null,
      },
      prescriptionId: medication.prescriptionId || null,
      generatedAt: new Date().toISOString(),
    };

    return JSON.stringify(qrData, null, 2);
  };

  const generateQRText = () => {
    const patientName = patient
      ? `${patient.firstName} ${patient.lastName}`
      : medication.patientName || 'Patient';

    return `MEDICATION PRESCRIPTION

RX NUMBER: ${medication.prescriptionId ? `RX-${medication.prescriptionId}` : 'N/A'}
PATIENT: ${patientName}
${patient?.phone ? `PHONE: ${patient.phone}` : ''}
${patient?.dateOfBirth ? `DOB: ${patient.dateOfBirth}` : ''}

MEDICATION: ${medication.name}
STRENGTH: ${medication.dosage || 'As prescribed'}
FREQUENCY: ${medication.frequency || 'As directed'}
DURATION: ${medication.duration || 'As needed'}
INSTRUCTIONS: ${medication.instructions || 'Take as directed'}

${medication.prescribedBy ? `PRESCRIBER: ${medication.prescribedBy}` : ''}
${medication.startDate ? `DATE ISSUED: ${formatDateTime(medication.startDate)}` : ''}
${medication.endDate ? `EXPIRES: ${formatDateTime(medication.endDate)}` : ''}

Generated: ${new Date().toLocaleString()}
This is a valid medication prescription for pharmacy dispensing.`;
  };

  const handleDownload = () => {
    try {
      const qrData = generateQRData();
      const blob = new Blob([qrData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitizedName = medication.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      a.download = `medication-${sanitizedName}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Downloaded',
        description: 'Medication QR code data downloaded successfully.',
      });
    } catch (error) {
      console.error('Error downloading medication QR code:', error);
      toast({
        title: 'Download Failed',
        description: 'Unable to download medication QR code data.',
        variant: 'destructive',
      });
    }
  };

  const handlePrint = async () => {
    try {
      const qrText = generateQRText();
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;

      const contentHTML = `
        <style>
          .qr-container {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f0fdf4;
            border-radius: 8px;
          }
          .medication-info {
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid #22c55e;
          }
          .medication-name {
            font-weight: bold;
            color: #059669;
            font-size: 18px;
            margin-bottom: 10px;
          }
          .detail-line {
            margin: 5px 0;
            font-size: 14px;
            color: #374151;
          }
        </style>
        
        <div class="medication-info">
          <div class="medication-name">${medication.name}</div>
          ${medication.dosage ? `<div class="detail-line"><strong>Dosage:</strong> ${medication.dosage}</div>` : ''}
          ${medication.frequency ? `<div class="detail-line"><strong>Frequency:</strong> ${medication.frequency}</div>` : ''}
          ${medication.duration ? `<div class="detail-line"><strong>Duration:</strong> ${medication.duration}</div>` : ''}
          ${medication.instructions ? `<div class="detail-line"><strong>Instructions:</strong> ${medication.instructions}</div>` : ''}
          ${patient ? `<div class="detail-line"><strong>Patient:</strong> ${patient.firstName} ${patient.lastName}</div>` : ''}
          ${medication.prescribedBy ? `<div class="detail-line"><strong>Prescribed By:</strong> ${medication.prescribedBy}</div>` : ''}
        </div>
        <div class="qr-container">
          <img src="${qrCodeUrl}" alt="Medication QR Code" style="border: 2px solid #22c55e; padding: 8px; background: white; max-width: 100%;" />
          <div style="margin-top: 10px; font-size: 12px; color: #059669;">
            <strong>Scan this QR code for complete medication information</strong>
          </div>
        </div>
        <div style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>This is a valid medication prescription for pharmacy dispensing.</p>
        </div>
      `;

      await openPrintWindowWithLetterhead(
        contentHTML,
        'Medication QR Code Prescription',
        {
          documentId: medication.prescriptionId ? `RX-QR-${medication.prescriptionId}` : `QR-${Date.now()}`,
          documentDate: new Date(),
          organizationId: user?.organizationId,
          pageSize: 'A5',
          orientation: 'portrait',
          autoPrint: true
        }
      );
    } catch (error: any) {
      toast({
        title: 'Print Failed',
        description: error?.message || 'Unable to open print window. Please check your popup blocker settings.',
        variant: 'destructive',
      });
    }
  };

  const qrValue = generateQRText();

  return (
    <>
      {showButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={className}
        >
          <QrCode className="w-4 h-4 mr-2" />
          QR Code
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              Medication QR Code
            </DialogTitle>
            <DialogDescription>
              Scan this QR code to view medication prescription details
            </DialogDescription>
          </DialogHeader>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{medication.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Medication Details */}
              <div className="space-y-2 text-sm">
                {medication.dosage && (
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Dosage:</span>
                    <span className="font-medium">{medication.dosage}</span>
                  </div>
                )}
                {medication.frequency && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="font-medium">{medication.frequency}</span>
                  </div>
                )}
                {medication.duration && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{medication.duration}</span>
                  </div>
                )}
                {patient && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Patient:</span>
                    <span className="font-medium">
                      {patient.firstName} {patient.lastName}
                    </span>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="flex justify-center bg-white p-4 rounded-lg border-2 border-slate-200">
                <QRCodeSVG
                  value={qrValue}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  className="flex-1"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}

