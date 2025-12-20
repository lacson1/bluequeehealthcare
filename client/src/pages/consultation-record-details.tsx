import React, { useMemo } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  User,
  Clock,
  ArrowLeft,
  Download,
  Printer,
  Pill
} from 'lucide-react';
import { formatDateTime } from '@/lib/date-utils';
import { MedicationQRCode } from '@/components/medication-qr-code';

interface ConsultationRecord {
  id: number;
  patientId: number;
  templateName: string;
  responses: Record<string, any>;
  recordedBy: string;
  recordedAt: string;
  status: string;
  patient?: {
    firstName: string;
    lastName: string;
    id: number;
  };
}

export default function ConsultationRecordDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: consultation, isLoading, error } = useQuery<ConsultationRecord>({
    queryKey: [`/api/consultation-records/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
            <div className="w-48 h-6 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid gap-6">
          <div className="w-full h-64 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Consultation Record Not Found
            </h3>
            <p className="text-muted-foreground">
              The consultation record you're looking for doesn't exist or you don't have permission to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }


  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    try {
      // Create downloadable content
      const content = JSON.stringify(consultation, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Sanitize filename to remove special characters
      const sanitizedName = (consultation.templateName || 'consultation')
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase();
      a.download = `consultation-${consultation.id}-${sanitizedName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading consultation record:', error);
    }
  };

  // Extract medications from consultation responses
  const medications = useMemo(() => {
    if (!consultation?.responses) return [];

    const meds: Array<{
      name: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      instructions?: string;
      prescribedBy?: string;
      startDate?: string;
      endDate?: string;
    }> = [];

    // Helper function to recursively search for medication data
    const findMedications = (obj: any, path: string = ''): void => {
      if (!obj || typeof obj !== 'object') return;

      // Check if this object looks like a medication
      const medicationKeys = ['medication', 'medicationName', 'medicine', 'drug', 'prescription'];
      const hasMedicationKey = Object.keys(obj).some(key =>
        medicationKeys.some(mk => key.toLowerCase().includes(mk.toLowerCase()))
      );

      if (hasMedicationKey) {
        const name = obj.medication || obj.medicationName || obj.medicine || obj.drug || obj.name || 'Unknown Medication';
        if (name && name !== 'Unknown Medication') {
          meds.push({
            name: String(name),
            dosage: obj.dosage || obj.strength || obj.dose,
            frequency: obj.frequency || obj.timing,
            duration: obj.duration || obj.course,
            instructions: obj.instructions || obj.directions,
            prescribedBy: obj.prescribedBy || obj.prescriber || consultation.recordedBy,
            startDate: obj.startDate || obj.date || consultation.recordedAt,
            endDate: obj.endDate || obj.expiryDate,
          });
        }
      }

      // Check if this is an array of medications
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            findMedications(item, `${path}[${index}]`);
          }
        });
      } else {
        // Recursively search nested objects
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            findMedications(value, path ? `${path}.${key}` : key);
          }
        });
      }
    };

    findMedications(consultation.responses);
    return meds;
  }, [consultation]);

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Hide navigation and action buttons */
          button,
          .no-print {
            display: none !important;
          }
          
          /* Print-friendly layout */
          * {
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          /* Cards and containers */
          [class*="Card"],
          [class*="card"],
          div[class*="space-y"] {
            background: white !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          
          /* Headers */
          h1, h2, h3, h4, h5, h6 {
            color: black !important;
            page-break-after: avoid;
          }
          
          /* Text colors */
          [class*="text-foreground"],
          [class*="text-muted"],
          [class*="text-gray"],
          p, span, div {
            color: black !important;
          }
          
          /* Icons - hide or make visible */
          svg {
            display: none !important;
          }
          
          /* Badges */
          [class*="Badge"],
          [class*="badge"] {
            border: 1px solid #000 !important;
            background: white !important;
            color: black !important;
            padding: 2px 8px !important;
          }
          
          /* Code blocks */
          pre {
            background: #f5f5f5 !important;
            border: 1px solid #ccc !important;
            color: black !important;
            page-break-inside: avoid;
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
          }
          
          /* Borders */
          [class*="border"] {
            border-color: #000 !important;
          }
          
          /* Spacing for print */
          .space-y-6 > * + * {
            margin-top: 1rem !important;
          }
          
          /* Page breaks */
          .page-break-before {
            page-break-before: always;
          }
          
          .page-break-after {
            page-break-after: always;
          }
          
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => window.history.back()} className="no-print">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {consultation.templateName}
              </h1>
              <p className="text-muted-foreground">
                Consultation Record #{consultation.id}
              </p>
            </div>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Consultation Details */}
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card className="page-break-inside-avoid">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary no-print" />
                <span>Consultation Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground no-print" />
                  <div>
                    <p className="text-sm text-muted-foreground">Patient</p>
                    <p className="font-medium text-foreground">
                      {consultation.patient ?
                        `${consultation.patient.firstName} ${consultation.patient.lastName}` :
                        `Patient ID: ${consultation.patientId}`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground no-print" />
                  <div>
                    <p className="text-sm text-muted-foreground">Recorded</p>
                    <p className="font-medium text-foreground">{formatDateTime(consultation.recordedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground no-print" />
                  <div>
                    <p className="text-sm text-muted-foreground">Recorded By</p>
                    <p className="font-medium text-foreground">{consultation.recordedBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={consultation.status === 'completed' ? 'default' : 'secondary'}>
                    {consultation.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medications Section */}
          {medications.length > 0 && (
            <Card className="page-break-inside-avoid">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary no-print" />
                  <span>Medications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medications.map((medication, index) => (
                    <div
                      key={index}
                      className="border border-border rounded-lg p-4 space-y-2 page-break-inside-avoid"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Pill className="w-4 h-4 text-primary no-print" />
                            {medication.name}
                          </h4>
                          <div className="grid md:grid-cols-2 gap-2 text-sm">
                            {medication.dosage && (
                              <div>
                                <span className="text-muted-foreground">Dosage: </span>
                                <span className="font-medium">{medication.dosage}</span>
                              </div>
                            )}
                            {medication.frequency && (
                              <div>
                                <span className="text-muted-foreground">Frequency: </span>
                                <span className="font-medium">{medication.frequency}</span>
                              </div>
                            )}
                            {medication.duration && (
                              <div>
                                <span className="text-muted-foreground">Duration: </span>
                                <span className="font-medium">{medication.duration}</span>
                              </div>
                            )}
                            {medication.prescribedBy && (
                              <div>
                                <span className="text-muted-foreground">Prescribed By: </span>
                                <span className="font-medium">{medication.prescribedBy}</span>
                              </div>
                            )}
                          </div>
                          {medication.instructions && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Instructions: </span>
                              <span className="font-medium">{medication.instructions}</span>
                            </div>
                          )}
                        </div>
                        <div className="no-print">
                          <MedicationQRCode
                            medication={medication}
                            patient={consultation.patient}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consultation Responses */}
          <Card className="page-break-inside-avoid">
            <CardHeader>
              <CardTitle>Consultation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {consultation.responses && Object.keys(consultation.responses).length > 0 ? (
                  Object.entries(consultation.responses).map(([key, value]) => (
                    <div key={key} className="border-b border-border pb-4 last:border-b-0 page-break-inside-avoid">
                      <h4 className="font-medium text-foreground mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h4>
                      <div className="text-foreground">
                        {typeof value === 'object' && value !== null ? (
                          <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded border border-border page-break-inside-avoid">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-sm">{String(value || '')}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No consultation details available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}