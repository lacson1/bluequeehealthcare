import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Download, Printer, Shield, CheckCircle2, 
  Calendar, User, Syringe, QrCode, Building2
} from 'lucide-react';
import { formatPatientName } from '@/lib/patient-utils';
import { calculatePatientAge } from '@/lib/vaccine-schedules';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
}

interface Vaccination {
  id: number;
  vaccineName: string;
  dateAdministered: string;
  doseNumber?: string;
  administeredBy?: string;
  lotNumber?: string;
  manufacturer?: string;
  site?: string;
  route?: string;
  notes?: string;
}

interface VaccinationCertificateProps {
  patient: Patient;
  onClose: () => void;
}

export function VaccinationCertificate({ patient, onClose }: VaccinationCertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [selectedVaccines, setSelectedVaccines] = useState<Set<number>>(new Set());

  // Fetch patient vaccinations
  const { data: vaccinations = [], isLoading } = useQuery<Vaccination[]>({
    queryKey: [`/api/patients/${patient.id}/immunizations`],
  });

  const age = calculatePatientAge(patient.dateOfBirth);

  const toggleVaccine = (id: number) => {
    const newSelected = new Set(selectedVaccines);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedVaccines(newSelected);
  };

  const selectAll = () => {
    if (selectedVaccines.size === vaccinations.length) {
      setSelectedVaccines(new Set());
    } else {
      setSelectedVaccines(new Set(vaccinations.map(v => v.id)));
    }
  };

  const handlePrint = () => {
    const printContent = certificateRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vaccination Certificate - ${formatPatientName(patient)}</title>
          <style>
            @page { size: A4; margin: 1cm; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .certificate-container {
              border: 3px solid #059669;
              border-radius: 12px;
              padding: 30px;
              background: linear-gradient(to bottom right, #f0fdf4, #ffffff);
            }
            .header {
              text-align: center;
              margin-bottom: 24px;
              border-bottom: 2px solid #059669;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #059669;
              font-size: 28px;
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
            }
            .header h1::before {
              content: "🏥";
            }
            .header p {
              color: #64748b;
              margin: 8px 0 0;
            }
            .patient-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 24px;
              padding: 16px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .patient-info .label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .patient-info .value {
              font-weight: 600;
              color: #1e293b;
            }
            .vaccines-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
            }
            .vaccines-table th {
              background: #059669;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-size: 13px;
            }
            .vaccines-table td {
              padding: 10px 8px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 13px;
            }
            .vaccines-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .signature {
              text-align: center;
            }
            .signature-line {
              width: 200px;
              border-top: 1px solid #1e293b;
              margin-top: 60px;
              padding-top: 8px;
              font-size: 12px;
              color: #64748b;
            }
            .qr-placeholder {
              width: 80px;
              height: 80px;
              border: 2px dashed #cbd5e1;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #94a3b8;
              font-size: 10px;
            }
            .verification {
              text-align: right;
              font-size: 11px;
              color: #64748b;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 11px;
              background: #dcfce7;
              color: #166534;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const filteredVaccinations = selectedVaccines.size > 0 
    ? vaccinations.filter(v => selectedVaccines.has(v.id))
    : vaccinations;

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {selectedVaccines.size > 0 
            ? `${selectedVaccines.size} of ${vaccinations.length} vaccines selected`
            : 'All vaccines will be included'}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            {selectedVaccines.size === vaccinations.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      </div>

      {/* Vaccine Selection */}
      {vaccinations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {vaccinations.map(v => (
            <Badge
              key={v.id}
              variant={selectedVaccines.has(v.id) || selectedVaccines.size === 0 ? 'default' : 'outline'}
              className={`cursor-pointer ${
                selectedVaccines.has(v.id) || selectedVaccines.size === 0 
                  ? 'bg-emerald-500 hover:bg-emerald-600' 
                  : 'hover:bg-slate-100'
              }`}
              onClick={() => toggleVaccine(v.id)}
            >
              <Syringe className="h-3 w-3 mr-1" />
              {v.vaccineName}
            </Badge>
          ))}
        </div>
      )}

      <Separator />

      {/* Certificate Preview */}
      <div 
        ref={certificateRef}
        className="border-4 border-emerald-600 rounded-xl p-8 bg-gradient-to-br from-emerald-50 to-white"
      >
        {/* Header */}
        <div className="text-center mb-6 pb-6 border-b-2 border-emerald-600">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="h-10 w-10 text-emerald-600" />
            <h1 className="text-3xl font-bold text-emerald-700">
              Vaccination Certificate
            </h1>
          </div>
          <p className="text-slate-500">Official Immunization Record</p>
          <p className="text-sm text-slate-400 mt-1">Bluequee Health Management</p>
        </div>

        {/* Patient Information */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Patient Name</p>
            <p className="font-semibold text-slate-900">{formatPatientName(patient)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Patient ID</p>
            <p className="font-semibold text-slate-900">{patient.id}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Date of Birth</p>
            <p className="font-semibold text-slate-900">
              {new Date(patient.dateOfBirth).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Age</p>
            <p className="font-semibold text-slate-900">{age.display}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Gender</p>
            <p className="font-semibold text-slate-900 capitalize">{patient.gender}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Certificate Date</p>
            <p className="font-semibold text-slate-900">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Vaccination Records */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Syringe className="h-5 w-5 text-emerald-600" />
            Vaccination Records
          </h2>
          
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : filteredVaccinations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Syringe className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No vaccination records found</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-emerald-600 text-white">
                  <th className="py-3 px-3 text-left text-sm font-medium rounded-tl-lg">Vaccine</th>
                  <th className="py-3 px-3 text-left text-sm font-medium">Dose</th>
                  <th className="py-3 px-3 text-left text-sm font-medium">Date</th>
                  <th className="py-3 px-3 text-left text-sm font-medium">Manufacturer</th>
                  <th className="py-3 px-3 text-left text-sm font-medium rounded-tr-lg">Lot #</th>
                </tr>
              </thead>
              <tbody>
                {filteredVaccinations.map((v, idx) => (
                  <tr 
                    key={v.id} 
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-b border-slate-200`}
                  >
                    <td className="py-3 px-3 text-sm font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        {v.vaccineName}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm text-slate-600">
                      {v.doseNumber ? `Dose ${v.doseNumber}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-sm text-slate-600">
                      {new Date(v.dateAdministered).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-sm text-slate-600">
                      {v.manufacturer || '-'}
                    </td>
                    <td className="py-3 px-3 text-sm text-slate-600">
                      {v.lotNumber || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end pt-6 border-t border-slate-200">
          <div className="text-center">
            <div className="w-48 border-t border-slate-400 mt-16 pt-2">
              <p className="text-sm text-slate-500">Authorized Signature</p>
            </div>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded flex items-center justify-center">
              <QrCode className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Verification QR</p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>Certificate ID: {`CERT-${patient.id}-${Date.now().toString(36).toUpperCase()}`}</p>
            <p>Generated: {new Date().toLocaleString()}</p>
            <p className="mt-2 text-emerald-600">
              <CheckCircle2 className="h-3 w-3 inline mr-1" />
              Verified by Bluequee
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 no-print">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={handlePrint}
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}

