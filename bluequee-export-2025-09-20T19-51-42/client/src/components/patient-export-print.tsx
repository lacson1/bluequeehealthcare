import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Printer, 
  Download, 
  FileText, 
  Calendar,
  User,
  Activity,
  Pill,
  TestTube,
  Stethoscope
} from "lucide-react";
import { format } from "date-fns";
import { formatPatientName } from "@/lib/patient-utils";

interface PatientExportPrintProps {
  patient: any;
  visits?: any[];
  vitals?: any[];
  labResults?: any[];
  prescriptions?: any[];
  organizationName?: string;
}

export function PatientExportPrint({ 
  patient, 
  visits = [], 
  vitals = [], 
  labResults = [], 
  prescriptions = [],
  organizationName = "ClinicConnect Health Center"
}: PatientExportPrintProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    basicInfo: true,
    visits: true,
    vitals: true,
    labResults: true,
    prescriptions: true,
    includeHeader: true
  });

  const generatePrintableHTML = () => {
    const currentDate = format(new Date(), "PPP");
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Patient Record - ${patient.firstName} ${patient.lastName}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              margin: 0; 
              padding: 20px;
              color: #333;
            }
            .header { 
              text-align: center; 
              border-bottom: 3px solid #2563eb; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
            }
            .clinic-name { 
              font-size: 24px; 
              font-weight: bold; 
              color: #2563eb; 
              margin-bottom: 5px;
            }
            .report-title { 
              font-size: 18px; 
              color: #64748b; 
              margin-bottom: 5px;
            }
            .print-date { 
              font-size: 12px; 
              color: #94a3b8; 
            }
            .section { 
              margin-bottom: 30px; 
              page-break-inside: avoid;
            }
            .section-title { 
              font-size: 16px; 
              font-weight: bold; 
              color: #1e40af; 
              border-bottom: 2px solid #e2e8f0; 
              padding-bottom: 8px; 
              margin-bottom: 15px;
            }
            .patient-info { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin-bottom: 20px;
            }
            .info-group { 
              background: #f8fafc; 
              padding: 15px; 
              border-radius: 8px; 
              border-left: 4px solid #3b82f6;
            }
            .info-label { 
              font-weight: bold; 
              color: #475569; 
              margin-bottom: 4px;
            }
            .info-value { 
              color: #1e293b; 
            }
            .visits-table, .vitals-table, .lab-table, .prescriptions-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .visits-table th, .vitals-table th, .lab-table th, .prescriptions-table th { 
              background: #3b82f6; 
              color: white; 
              padding: 12px 8px; 
              text-align: left; 
              font-weight: 600;
            }
            .visits-table td, .vitals-table td, .lab-table td, .prescriptions-table td { 
              padding: 10px 8px; 
              border-bottom: 1px solid #e2e8f0;
            }
            .visits-table tr:nth-child(even), .vitals-table tr:nth-child(even), 
            .lab-table tr:nth-child(even), .prescriptions-table tr:nth-child(even) { 
              background: #f8fafc;
            }
            .badge { 
              display: inline-block; 
              padding: 4px 8px; 
              background: #dbeafe; 
              color: #1e40af; 
              border-radius: 4px; 
              font-size: 12px; 
              font-weight: 500;
            }
            .urgent { 
              background: #fef2f2; 
              color: #dc2626;
            }
            .completed { 
              background: #f0fdf4; 
              color: #16a34a;
            }
            .footer { 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 1px solid #e2e8f0; 
              text-align: center; 
              font-size: 12px; 
              color: #94a3b8;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${exportOptions.includeHeader ? `
            <div class="header">
              <div class="clinic-name">${organizationName}</div>
              <div class="report-title">Patient Medical Record</div>
              <div class="print-date">Generated on ${currentDate}</div>
            </div>
          ` : ''}

          ${exportOptions.basicInfo ? `
            <div class="section">
              <div class="section-title">Patient Information</div>
              <div class="patient-info">
                <div class="info-group">
                  <div class="info-label">Full Name</div>
                  <div class="info-value">${patient.title ? `${patient.title} ` : ''}${patient.firstName} ${patient.lastName}</div>
                </div>
                <div class="info-group">
                  <div class="info-label">Date of Birth</div>
                  <div class="info-value">${patient.dateOfBirth ? format(new Date(patient.dateOfBirth), "PPP") : 'Not specified'}</div>
                </div>
                <div class="info-group">
                  <div class="info-label">Gender</div>
                  <div class="info-value">${patient.gender || 'Not specified'}</div>
                </div>
                <div class="info-group">
                  <div class="info-label">Phone Number</div>
                  <div class="info-value">${patient.phoneNumber || 'Not provided'}</div>
                </div>
                <div class="info-group">
                  <div class="info-label">Address</div>
                  <div class="info-value">${patient.address || 'Not provided'}</div>
                </div>
                <div class="info-group">
                  <div class="info-label">Emergency Contact</div>
                  <div class="info-value">${patient.emergencyContact || 'Not provided'}</div>
                </div>
              </div>
              ${patient.allergies ? `
                <div class="info-group">
                  <div class="info-label">Known Allergies</div>
                  <div class="info-value">${patient.allergies}</div>
                </div>
              ` : ''}
              ${patient.medicalHistory ? `
                <div class="info-group">
                  <div class="info-label">Medical History</div>
                  <div class="info-value">${patient.medicalHistory}</div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${exportOptions.visits && visits.length > 0 ? `
            <div class="section">
              <div class="section-title">Visit History</div>
              <table class="visits-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Chief Complaint</th>
                    <th>Diagnosis</th>
                    <th>Doctor</th>
                  </tr>
                </thead>
                <tbody>
                  ${visits.map(visit => `
                    <tr>
                      <td>${visit.visitDate ? format(new Date(visit.visitDate), "PPp") : 'N/A'}</td>
                      <td><span class="badge">${visit.visitType || 'General'}</span></td>
                      <td>${visit.chiefComplaint || 'Not recorded'}</td>
                      <td>${visit.diagnosis || 'Pending'}</td>
                      <td>${visit.doctorName || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${exportOptions.vitals && vitals.length > 0 ? `
            <div class="section">
              <div class="section-title">Vital Signs History</div>
              <table class="vitals-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Blood Pressure</th>
                    <th>Heart Rate</th>
                    <th>Temperature</th>
                    <th>Weight</th>
                    <th>Height</th>
                  </tr>
                </thead>
                <tbody>
                  ${vitals.slice(0, 10).map(vital => `
                    <tr>
                      <td>${vital.recordedAt ? format(new Date(vital.recordedAt), "PPp") : 'N/A'}</td>
                      <td>${vital.bloodPressureSystolic && vital.bloodPressureDiastolic ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} mmHg` : 'N/A'}</td>
                      <td>${vital.heartRate ? `${vital.heartRate} bpm` : 'N/A'}</td>
                      <td>${vital.temperature ? `${vital.temperature}°C` : 'N/A'}</td>
                      <td>${vital.weight ? `${vital.weight} kg` : 'N/A'}</td>
                      <td>${vital.height ? `${vital.height} cm` : 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${exportOptions.labResults && labResults.length > 0 ? `
            <div class="section">
              <div class="section-title">Laboratory Results</div>
              <table class="lab-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Test</th>
                    <th>Result</th>
                    <th>Reference Range</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${labResults.slice(0, 15).map(result => `
                    <tr>
                      <td>${result.resultDate ? format(new Date(result.resultDate), "PPp") : 'N/A'}</td>
                      <td>${result.testName || 'N/A'}</td>
                      <td>${result.result || 'Pending'}</td>
                      <td>${result.referenceRange || 'N/A'}</td>
                      <td><span class="badge ${result.status === 'abnormal' ? 'urgent' : 'completed'}">${result.status || 'Normal'}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${exportOptions.prescriptions && prescriptions.length > 0 ? `
            <div class="section">
              <div class="section-title">Prescription History</div>
              <table class="prescriptions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th>Prescribed By</th>
                  </tr>
                </thead>
                <tbody>
                  ${prescriptions.slice(0, 15).map(prescription => `
                    <tr>
                      <td>${prescription.prescribedAt ? format(new Date(prescription.prescribedAt), "PPp") : 'N/A'}</td>
                      <td>${prescription.medicationName || 'N/A'}</td>
                      <td>${prescription.dosage || 'N/A'}</td>
                      <td>${prescription.frequency || 'N/A'}</td>
                      <td>${prescription.duration || 'N/A'}</td>
                      <td>${prescription.prescribedBy || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <div class="footer">
            <p>This is a confidential medical record. Handle in accordance with patient privacy regulations.</p>
            <p>Generated from ${organizationName} Patient Management System</p>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePrintableHTML());
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePrintableHTML());
      printWindow.document.close();
      printWindow.focus();
      // Trigger browser's print to PDF functionality
      printWindow.print();
    }
  };

  const handleExportCSV = () => {
    let csvContent = "Patient Record Export\n\n";
    
    if (exportOptions.basicInfo) {
      csvContent += "PATIENT INFORMATION\n";
      csvContent += `Name,${patient.firstName} ${patient.lastName}\n`;
      csvContent += `Date of Birth,${patient.dateOfBirth ? format(new Date(patient.dateOfBirth), "PPP") : 'Not specified'}\n`;
      csvContent += `Gender,${patient.gender || 'Not specified'}\n`;
      csvContent += `Phone,${patient.phoneNumber || 'Not provided'}\n`;
      csvContent += `Address,${patient.address || 'Not provided'}\n`;
      csvContent += `Emergency Contact,${patient.emergencyContact || 'Not provided'}\n\n`;
    }

    if (exportOptions.visits && visits.length > 0) {
      csvContent += "VISIT HISTORY\n";
      csvContent += "Date,Type,Chief Complaint,Diagnosis,Doctor\n";
      visits.forEach(visit => {
        csvContent += `"${visit.visitDate ? format(new Date(visit.visitDate), "PPp") : 'N/A'}","${visit.visitType || 'General'}","${visit.chiefComplaint || 'Not recorded'}","${visit.diagnosis || 'Pending'}","${visit.doctorName || 'N/A'}"\n`;
      });
      csvContent += "\n";
    }

    if (exportOptions.vitals && vitals.length > 0) {
      csvContent += "VITAL SIGNS\n";
      csvContent += "Date,Blood Pressure,Heart Rate,Temperature,Weight,Height\n";
      vitals.slice(0, 10).forEach(vital => {
        csvContent += `"${vital.recordedAt ? format(new Date(vital.recordedAt), "PPp") : 'N/A'}","${vital.bloodPressureSystolic && vital.bloodPressureDiastolic ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} mmHg` : 'N/A'}","${vital.heartRate ? `${vital.heartRate} bpm` : 'N/A'}","${vital.temperature ? `${vital.temperature}°C` : 'N/A'}","${vital.weight ? `${vital.weight} kg` : 'N/A'}","${vital.height ? `${vital.height} cm` : 'N/A'}"\n`;
      });
      csvContent += "\n";
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `patient_record_${patient.firstName}_${patient.lastName}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={handlePrint}
        className="flex items-center gap-2"
      >
        <Printer className="w-4 h-4" />
        Print
      </Button>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogTrigger asChild>
          <Button 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Patient Record</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Include Sections:</h4>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="basicInfo"
                    checked={exportOptions.basicInfo}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, basicInfo: !!checked }))
                    }
                  />
                  <label htmlFor="basicInfo" className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Patient Information
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="visits"
                    checked={exportOptions.visits}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, visits: !!checked }))
                    }
                  />
                  <label htmlFor="visits" className="text-sm flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    Visit History ({visits.length})
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="vitals"
                    checked={exportOptions.vitals}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, vitals: !!checked }))
                    }
                  />
                  <label htmlFor="vitals" className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Vital Signs ({vitals.length})
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="labResults"
                    checked={exportOptions.labResults}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, labResults: !!checked }))
                    }
                  />
                  <label htmlFor="labResults" className="text-sm flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
                    Lab Results ({labResults.length})
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="prescriptions"
                    checked={exportOptions.prescriptions}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, prescriptions: !!checked }))
                    }
                  />
                  <label htmlFor="prescriptions" className="text-sm flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    Prescriptions ({prescriptions.length})
                  </label>
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeHeader"
                  checked={exportOptions.includeHeader}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeHeader: !!checked }))
                  }
                />
                <label htmlFor="includeHeader" className="text-sm">
                  Include clinic header and date
                </label>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Export Format:</h4>
              <div className="flex gap-2">
                <Button 
                  onClick={handleExportPDF}
                  className="flex-1 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </Button>
                <Button 
                  onClick={handleExportCSV}
                  variant="outline"
                  className="flex-1 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}