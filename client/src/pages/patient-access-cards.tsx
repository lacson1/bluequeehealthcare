import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Printer, Download } from 'lucide-react';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
}

export default function PatientAccessCards() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['/api/patients'],
  });

  const filteredPatients = patients.filter((patient: Patient) =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const addPatient = (patient: Patient) => {
    if (!selectedPatients.find(p => p.id === patient.id)) {
      setSelectedPatients([...selectedPatients, patient]);
    }
  };

  const removePatient = (patientId: number) => {
    setSelectedPatients(selectedPatients.filter(p => p.id !== patientId));
  };

  const printCards = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardHTML = selectedPatients.map(patient => `
      <div class="access-card">
        <div class="header">
          <strong>🏥 ClinicConnect Patient Portal</strong>
        </div>
        <div class="patient-info">
          <div class="patient-name">${patient.first_name} ${patient.last_name}</div>
          <div class="credentials">
            <div class="credential-row">
              <span class="label">Patient ID:</span>
              <span class="value">${patient.id}</span>
            </div>
            <div class="credential-row">
              <span class="label">Phone:</span>
              <span class="value">${patient.phone}</span>
            </div>
            <div class="credential-row">
              <span class="label">DOB:</span>
              <span class="value">${patient.date_of_birth}</span>
            </div>
          </div>
        </div>
        <div class="website">
          <strong>Website:</strong> ${window.location.origin}/patient-portal
        </div>
        <div class="features">
          Access: Appointments • Messages • Records • Lab Results
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Portal Access Cards</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .access-card {
            width: 85mm;
            height: 54mm;
            border: 2px solid #2563eb;
            border-radius: 8px;
            padding: 12px;
            margin: 10px;
            page-break-inside: avoid;
            display: inline-block;
            vertical-align: top;
            background: white;
            box-sizing: border-box;
          }
          .header {
            text-align: center;
            font-size: 14px;
            color: #2563eb;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .patient-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
            text-align: center;
          }
          .credentials {
            margin: 8px 0;
          }
          .credential-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
            font-size: 12px;
          }
          .label {
            font-weight: bold;
          }
          .value {
            font-family: monospace;
          }
          .website {
            font-size: 10px;
            margin: 6px 0;
            text-align: center;
          }
          .features {
            font-size: 9px;
            text-align: center;
            color: #6b7280;
            margin-top: 6px;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .access-card { margin: 5px; }
          }
        </style>
      </head>
      <body>
        ${cardHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Portal Access Cards</h1>
        <p className="text-gray-600">Generate access cards for patients to use the patient portal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Search by name or phone</Label>
                <Input
                  id="search"
                  placeholder="Enter patient name or phone number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-4">Loading patients...</div>
                ) : (
                  <div className="space-y-2">
                    {filteredPatients.map((patient: Patient) => (
                      <div
                        key={patient.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => addPatient(patient)}
                      >
                        <div className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {patient.id} • Phone: {patient.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Patients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Selected Patients ({selectedPatients.length})</span>
              {selectedPatients.length > 0 && (
                <Button onClick={printCards} className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print Cards
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPatients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No patients selected. Click on patients from the search results to add them.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedPatients.map((patient) => (
                  <div key={patient.id} className="p-3 border rounded-lg bg-blue-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          ID: {patient.id}<br />
                          Phone: {patient.phone}<br />
                          DOB: {patient.date_of_birth}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePatient(patient.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instructions for Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>1. Search for patients:</strong> Use the search box to find patients by name or phone number
            </div>
            <div>
              <strong>2. Select patients:</strong> Click on patients from the search results to add them to the printing list
            </div>
            <div>
              <strong>3. Print cards:</strong> Click "Print Cards" to generate access cards for all selected patients
            </div>
            <div>
              <strong>4. Give to patients:</strong> Hand the printed cards to patients and explain how to use the portal
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <strong>Important:</strong> Make sure patients understand they need to use their registered phone number and date of birth exactly as shown on the card.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}