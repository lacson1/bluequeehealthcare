import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Search, Printer, Download, QrCode, User, Mail, Phone, Calendar, CreditCard, Scan, Send, Users } from 'lucide-react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  email?: string;
  gender?: string;
}

interface AccessCardData {
  patient: Patient;
  qrCode?: string;
  barcode?: string;
  portalUrl: string;
  generatedAt: string;
}

export default function PatientAccessCards() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);
  const [cardFormat, setCardFormat] = useState<'standard' | 'compact' | 'business'>('standard');
  const [includeQR, setIncludeQR] = useState(true);
  const [includeBarcode, setIncludeBarcode] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [accessCards, setAccessCards] = useState<AccessCardData[]>([]);
  const [activeTab, setActiveTab] = useState('search');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['/api/patients'],
  });

  const filteredPatients = patients.filter((patient: Patient) =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  // Generate QR Code for patient portal access
  const generateQRCode = async (patient: Patient): Promise<string> => {
    const portalUrl = `${window.location.origin}/patient-portal`;
    const qrData = JSON.stringify({
      url: portalUrl,
      patientId: patient.id,
      phone: patient.phone,
      dob: patient.dateOfBirth,
      name: `${patient.firstName} ${patient.lastName}`
    });
    
    try {
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 120,
        margin: 1,
        color: { dark: '#2563eb', light: '#ffffff' }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  // Generate Barcode for patient ID
  const generateBarcode = (patient: Patient): string => {
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, `PT${patient.id.toString().padStart(6, '0')}`, {
        format: "CODE128",
        width: 2,
        height: 40,
        displayValue: false,
        background: '#ffffff',
        lineColor: '#000000'
      });
      return canvas.toDataURL();
    } catch (error) {
      console.error('Error generating barcode:', error);
      return '';
    }
  };

  // Add patient with code generation
  const addPatient = async (patient: Patient) => {
    if (selectedPatients.find(p => p.id === patient.id)) return;
    
    const qrCode = includeQR ? await generateQRCode(patient) : undefined;
    const barcode = includeBarcode ? generateBarcode(patient) : undefined;
    
    const accessCard: AccessCardData = {
      patient,
      qrCode,
      barcode,
      portalUrl: `${window.location.origin}/patient-portal`,
      generatedAt: new Date().toISOString()
    };
    
    setSelectedPatients([...selectedPatients, patient]);
    setAccessCards(prev => [...prev, accessCard]);
    
    toast({
      title: "Patient Added",
      description: `${patient.first_name} ${patient.last_name} added to access card generation queue.`
    });
  };

  const removePatient = (patientId: number) => {
    setSelectedPatients(selectedPatients.filter(p => p.id !== patientId));
    setAccessCards(accessCards.filter(card => card.patient.id !== patientId));
  };

  // Send notifications mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { patientIds: number[], type: 'email' | 'sms' }) => {
      const response = await fetch('/api/patient-portal/send-access-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send notifications');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notifications Sent",
        description: "Portal access information sent to selected patients."
      });
    },
    onError: () => {
      toast({
        title: "Notification Failed",
        description: "Failed to send notifications. Please try again.",
        variant: "destructive"
      });
    }
  });

  const printCards = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const getCardHTML = (card: AccessCardData) => {
      const { patient, qrCode, barcode } = card;
      const cardClass = `access-card ${cardFormat}`;
      
      return `
        <div class="${cardClass}">
          <div class="header">
            <div class="clinic-logo">🏥</div>
            <div class="clinic-name">Bluequee Patient Portal</div>
          </div>
          <div class="patient-section">
            <div class="patient-name">${patient.first_name} ${patient.last_name}</div>
            <div class="credentials">
              <div class="credential-row">
                <span class="label">Patient ID:</span>
                <span class="value">PT${patient.id.toString().padStart(6, '0')}</span>
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
          ${qrCode ? `
            <div class="qr-section">
              <img src="${qrCode}" alt="QR Code" class="qr-code" />
              <div class="qr-label">Scan to Access Portal</div>
            </div>
          ` : ''}
          ${barcode ? `
            <div class="barcode-section">
              <img src="${barcode}" alt="Barcode" class="barcode" />
            </div>
          ` : ''}
          <div class="portal-info">
            <div class="website">${window.location.origin}/patient-portal</div>
            <div class="features">Access: Appointments • Messages • Records • Lab Results</div>
          </div>
        </div>
      `;
    };

    const cardHTML = accessCards.map(getCardHTML).join('');

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
            background: #f5f5f5;
          }
          .access-card {
            background: white;
            border: 2px solid #2563eb;
            border-radius: 12px;
            margin: 15px;
            page-break-inside: avoid;
            display: inline-block;
            vertical-align: top;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
          }
          .access-card.standard {
            width: 85mm;
            height: 54mm;
            padding: 12px;
          }
          .access-card.compact {
            width: 70mm;
            height: 45mm;
            padding: 8px;
          }
          .access-card.business {
            width: 90mm;
            height: 50mm;
            padding: 10px;
          }
          .header {
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .clinic-logo {
            font-size: 18px;
            margin-bottom: 2px;
          }
          .clinic-name {
            font-size: 12px;
            font-weight: bold;
            color: #2563eb;
          }
          .patient-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 8px;
            text-align: center;
            color: #1f2937;
          }
          .credentials {
            margin: 8px 0;
          }
          .credential-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            font-size: 10px;
          }
          .label {
            font-weight: bold;
            color: #6b7280;
          }
          .value {
            font-family: monospace;
            color: #1f2937;
          }
          .qr-section {
            text-align: center;
            margin: 8px 0;
          }
          .qr-code {
            width: 60px;
            height: 60px;
          }
          .qr-label {
            font-size: 8px;
            color: #6b7280;
            margin-top: 2px;
          }
          .barcode-section {
            text-align: center;
            margin: 6px 0;
          }
          .barcode {
            height: 25px;
            width: auto;
          }
          .portal-info {
            text-align: center;
            margin-top: 8px;
          }
          .website {
            font-size: 9px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 4px;
          }
          .features {
            font-size: 8px;
            color: #6b7280;
          }
          @media print {
            body { margin: 0; padding: 10px; background: white; }
            .access-card { margin: 8px; box-shadow: none; }
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
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Portal Access Cards</h1>
        <p className="text-gray-600">Generate professional access cards with QR codes and barcodes for easy patient portal setup</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Find Patients
          </TabsTrigger>
          <TabsTrigger value="customize" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Customize Cards
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Preview & Print
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Notifications
          </TabsTrigger>
        </TabsList>

        {/* Patient Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                            className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => addPatient(patient)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">
                                  {patient.firstName} {patient.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: PT{patient.id.toString().padStart(6, '0')} • Phone: {patient.phone} • DOB: {patient.dateOfBirth}
                                </div>
                              </div>
                              <Badge variant={selectedPatients.find(p => p.id === patient.id) ? "default" : "outline"}>
                                {selectedPatients.find(p => p.id === patient.id) ? "Selected" : "Add"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Selected Patients ({selectedPatients.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPatients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No patients selected</p>
                    <p className="text-sm">Click on patients from the search results to add them.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedPatients.map((patient) => (
                      <div key={patient.id} className="p-3 border rounded-lg bg-blue-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {patient.firstName} {patient.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              ID: PT{patient.id.toString().padStart(6, '0')}<br />
                              Phone: {patient.phone}<br />
                              DOB: {patient.dateOfBirth}
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
        </TabsContent>

        {/* Customize Cards Tab */}
        <TabsContent value="customize" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Format Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="card-format">Card Size</Label>
                  <Select value={cardFormat} onValueChange={(value: 'standard' | 'compact' | 'business') => setCardFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (85mm x 54mm)</SelectItem>
                      <SelectItem value="compact">Compact (70mm x 45mm)</SelectItem>
                      <SelectItem value="business">Business (90mm x 50mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-qr"
                      checked={includeQR}
                      onCheckedChange={(checked) => setIncludeQR(checked === true)}
                    />
                    <Label htmlFor="include-qr" className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      Include QR Code for easy scanning
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-barcode"
                      checked={includeBarcode}
                      onCheckedChange={(checked) => setIncludeBarcode(checked === true)}
                    />
                    <Label htmlFor="include-barcode" className="flex items-center gap-2">
                      <Scan className="h-4 w-4" />
                      Include Barcode for patient ID
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={(checked) => setEmailNotifications(checked === true)}
                  />
                  <Label htmlFor="email-notifications" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Send portal access via email
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sms-notifications"
                    checked={smsNotifications}
                    onCheckedChange={(checked) => setSmsNotifications(checked === true)}
                  />
                  <Label htmlFor="sms-notifications" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Send portal access via SMS
                  </Label>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    Notifications will include portal URL and login instructions
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preview & Print Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Access Cards Preview</span>
                {accessCards.length > 0 && (
                  <div className="flex gap-2">
                    <Button onClick={printCards} className="flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      Print All Cards
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export PDF
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accessCards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No access cards generated yet</p>
                  <p className="text-sm">Select patients and customize settings to generate cards.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accessCards.map((card, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="text-center mb-3">
                        <div className="text-sm font-medium text-blue-600 mb-1">🏥 Bluequee Patient Portal</div>
                        <div className="font-bold text-lg">{card.patient.firstName} {card.patient.lastName}</div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Patient ID:</span>
                          <span className="font-mono">PT{card.patient.id.toString().padStart(6, '0')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Phone:</span>
                          <span className="font-mono">{card.patient.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">DOB:</span>
                          <span className="font-mono">{card.patient.dateOfBirth}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-center space-x-4">
                        {card.qrCode && (
                          <div className="text-center">
                            <img src={card.qrCode} alt="QR Code" className="w-16 h-16 mx-auto" />
                            <div className="text-xs text-gray-500 mt-1">Scan to Access</div>
                          </div>
                        )}
                        {card.barcode && (
                          <div className="text-center">
                            <img src={card.barcode} alt="Barcode" className="h-8 mx-auto" />
                            <div className="text-xs text-gray-500 mt-1">Patient ID</div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 text-center">
                        <div className="text-xs text-blue-600 font-medium">{card.portalUrl}</div>
                        <div className="text-xs text-gray-500">Appointments • Messages • Records • Lab Results</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Portal Access Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPatients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Send className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No patients selected for notifications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-medium mb-2">Ready to notify {selectedPatients.length} patients</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Notifications will include portal URL, login instructions, and patient credentials.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => sendNotificationMutation.mutate({ 
                          patientIds: selectedPatients.map(p => p.id), 
                          type: 'email' 
                        })}
                        disabled={sendNotificationMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Send Email Notifications
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => sendNotificationMutation.mutate({ 
                          patientIds: selectedPatients.map(p => p.id), 
                          type: 'sms' 
                        })}
                        disabled={sendNotificationMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Send SMS Notifications
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Selected Patients:</h4>
                    {selectedPatients.map((patient) => (
                      <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                          <div className="text-sm text-gray-500">
                            {patient.email && <span className="mr-3">📧 {patient.email}</span>}
                            📱 {patient.phone}
                          </div>
                        </div>
                        <Badge variant="outline">PT{patient.id.toString().padStart(6, '0')}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Staff Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 text-sm">
              <h4 className="font-medium">How to Generate Access Cards:</h4>
              <div><strong>1. Find Patients:</strong> Search and select patients who need portal access</div>
              <div><strong>2. Customize:</strong> Choose card format, QR codes, and notification settings</div>
              <div><strong>3. Preview:</strong> Review generated cards with barcodes and QR codes</div>
              <div><strong>4. Distribute:</strong> Print cards or send notifications to patients</div>
            </div>
            <div className="space-y-3 text-sm">
              <h4 className="font-medium">Patient Instructions:</h4>
              <div><strong>QR Code:</strong> Patients can scan to go directly to the portal</div>
              <div><strong>Manual Login:</strong> Use Patient ID, phone number, and date of birth</div>
              <div><strong>Barcode:</strong> Staff can scan for quick patient identification</div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <strong>Important:</strong> Ensure patients understand they need to use their registered phone number and date of birth exactly as provided.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}