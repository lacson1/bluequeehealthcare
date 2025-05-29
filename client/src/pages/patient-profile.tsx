import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  AlertCircle, 
  History, 
  Stethoscope, 
  FlaskRound,
  Plus,
  Pill,
  Activity,
  Heart,
  Clock,
  UserCheck,
  FileText,
  Edit
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EnhancedVisitRecording } from "@/components/enhanced-visit-recording";
import LabResultModal from "@/components/lab-result-modal";
import PrescriptionModal from "@/components/prescription-modal";
import PatientQRCard from "@/components/patient-qr-card";
import PatientChat from "@/components/patient-chat";
import LabOrderForm from "@/components/lab-order-form";
import LabOrdersList from "@/components/lab-orders-list";
import ConsultationHistory from "@/components/consultation-history";
import VaccinationManagement from "@/components/vaccination-management";
import AllergyManagement from "@/components/allergy-management";
import MedicalHistoryManagement from "@/components/medical-history-management";
import { PrintExportToolbar } from "@/components/print-export-toolbar";
import { PatientSummaryPrintable } from "@/components/patient-summary-printable";
import { ModernPatientOverview } from "@/components/modern-patient-overview";
import { FloatingActionMenu } from "@/components/floating-action-menu";
import { useRole } from "@/components/role-guard";
import type { Patient, Visit, LabResult, Prescription } from "@shared/schema";

export default function PatientProfile() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id ? parseInt(params.id) : undefined;
  const { user } = useRole();
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  const { data: visits, isLoading: visitsLoading } = useQuery<Visit[]>({
    queryKey: [`/api/patients/${patientId}/visits`],
    enabled: !!patientId,
  });

  const { data: labResults, isLoading: labsLoading } = useQuery<LabResult[]>({
    queryKey: ["/api/patients", patientId, "labs"],
    enabled: !!patientId,
  });

  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/patients", patientId, "prescriptions"],
    enabled: !!patientId,
  });

  // Fetch organization data for branding
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  // Get current user's organization
  const currentOrganization = organizations.find(org => org.id === user?.organizationId);

  if (patientLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">Patient not found</h3>
          <p className="mt-2 text-sm text-slate-500">The patient you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const getPatientAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getPatientInitials = (firstName: string, lastName: string) => {
    const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
    return initials ? initials.toUpperCase() : 'N/A';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "abnormal":
        return <Badge className="bg-red-100 text-red-800">Abnormal</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-full flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {getPatientInitials(patient.firstName, patient.lastName)}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {patient.firstName} {patient.lastName}
              </h2>
              <p className="text-sm text-slate-500">
                ID: HC{patient.id?.toString().padStart(6, "0")} | Age: {getPatientAge(patient.dateOfBirth)} | {patient.gender}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {/* Print & Export Patient Summary */}
            <PrintExportToolbar
              elementId="patient-summary-print"
              filename={`patient_${patient.firstName}_${patient.lastName}_summary`}
              organization={currentOrganization}
              data={visits || []}
              showCSV={false}
              className="mr-2"
            />
            
            {/* Doctor-only actions */}
            {user?.role === 'doctor' && (
              <>
                <Button onClick={() => setShowVisitModal(true)}>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Record Visit
                </Button>
                <Button variant="outline" onClick={() => setShowPrescriptionModal(true)}>
                  <Pill className="mr-2 h-4 w-4" />
                  Add Prescription
                </Button>
              </>
            )}
            
            {/* Nurse and Doctor can add lab results */}
            {(user?.role === 'nurse' || user?.role === 'doctor') && (
              <Button variant="outline" onClick={() => setShowLabModal(true)}>
                <FlaskRound className="mr-2 h-4 w-4" />
                Add Lab Result
              </Button>
            )}
            
            {/* Admin has access to all actions */}
            {user?.role === 'admin' && (
              <>
                <Button onClick={() => setShowVisitModal(true)}>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Record Visit
                </Button>
                <Button variant="outline" onClick={() => setShowLabModal(true)}>
                  <FlaskRound className="mr-2 h-4 w-4" />
                  Add Lab Result
                </Button>
                <Button variant="outline" onClick={() => setShowPrescriptionModal(true)}>
                  <Pill className="mr-2 h-4 w-4" />
                  Add Prescription
                </Button>
              </>
            )}
            
            {/* Edit patient info - available to admin, doctor, nurse */}
            {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Info
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-full">
        <div className="w-full max-w-none">
          <ModernPatientOverview
            patient={patient}
            visits={visits || []}
            recentLabs={labResults || []}
            activePrescriptions={prescriptions || []}
          />
        </div>
        
        {/* Floating Action Menu */}
        <FloatingActionMenu
          onRecordVisit={() => setShowVisitModal(true)}
          onAddLabResult={() => setShowLabModal(true)}
          onAddPrescription={() => setShowPrescriptionModal(true)}
          onCreateConsultation={() => setShowVisitModal(true)}
          userRole={user?.role || 'guest'}
        />
      </main>

      {/* Modals */}
      <VisitRecordingModal
        open={showVisitModal}
        onOpenChange={setShowVisitModal}
        patientId={patientId}
      />
      <LabResultModal
        open={showLabModal}
        onOpenChange={setShowLabModal}
        patientId={patientId}
      />
      <PrescriptionModal
        open={showPrescriptionModal}
        onOpenChange={setShowPrescriptionModal}
        patientId={patientId}
      />

      {/* Hidden Printable Patient Summary */}
      <div className="hidden">
        <PatientSummaryPrintable
          patient={patient}
          visits={visits || []}
          organization={currentOrganization}
        />
      </div>
    </div>
  );
}

              <TabsContent value="overview">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="mr-2 h-5 w-5" />
                        Quick Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Recent Visits</h4>
                          <p className="text-2xl font-bold text-blue-700">{visits?.length || 0}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-2">Active Prescriptions</h4>
                          <p className="text-2xl font-bold text-green-700">{prescriptions?.length || 0}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="font-medium text-purple-900 mb-2">Pending Labs</h4>
                          <p className="text-2xl font-bold text-purple-700">{labResults?.filter(lab => lab.status === 'pending').length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="medical-records">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        Medical Records Hub
                      </CardTitle>
                      <CardDescription>
                        Comprehensive view of patient's medical history and specialist consultations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="consultations" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="consultations">Consultations</TabsTrigger>
                          <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
                          <TabsTrigger value="allergies">Allergies</TabsTrigger>
                          <TabsTrigger value="history">Medical History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="consultations">
                          <ConsultationHistory patientId={patient.id} />
                        </TabsContent>

                        <TabsContent value="vaccinations">
                          <VaccinationManagement 
                            patientId={patient.id} 
                            canEdit={user?.role === 'doctor' || user?.role === 'nurse' || user?.role === 'admin'} 
                          />
                        </TabsContent>

                        <TabsContent value="allergies">
                          <AllergyManagement 
                            patientId={patient.id} 
                            canEdit={user?.role === 'doctor' || user?.role === 'nurse' || user?.role === 'admin'} 
                          />
                        </TabsContent>

                        <TabsContent value="history">
                          <MedicalHistoryManagement 
                            patientId={patient.id} 
                            canEdit={user?.role === 'doctor' || user?.role === 'admin'} 
                          />
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="lab-orders">
                <div className="space-y-6">
                  {/* Lab Order Form */}
                  {(user?.role === 'doctor' || user?.role === 'nurse' || user?.role === 'admin') && (
                    <LabOrderForm 
                      patientId={patient.id} 
                      onOrderCreated={() => {
                        // Refresh lab orders list
                      }}
                    />
                  )}
                  
                  {/* Lab Orders List */}
                  <LabOrdersList patientId={patient.id} />
                </div>
              </TabsContent>

              <TabsContent value="medications">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Pill className="mr-2 h-5 w-5" />
                        Prescriptions
                      </span>
                      {(user?.role === 'doctor' || user?.role === 'admin') && (
                        <Button size="sm" onClick={() => setShowPrescriptionModal(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Prescription
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prescriptionsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
                            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                          </div>
                        ))}
                      </div>
                    ) : prescriptions && prescriptions.length > 0 ? (
                      <div className="space-y-4">
                        {prescriptions.map((prescription) => (
                          <div key={prescription.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-slate-800">Medicine ID: {prescription.medicineId}</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                  <strong>Dosage:</strong> {prescription.dosage}
                                </p>
                                <p className="text-sm text-slate-600">
                                  <strong>Frequency:</strong> {prescription.frequency}
                                </p>
                                <p className="text-sm text-slate-600">
                                  <strong>Duration:</strong> {prescription.duration}
                                </p>
                                {prescription.instructions && (
                                  <p className="text-sm text-slate-600 mt-2">
                                    <strong>Instructions:</strong> {prescription.instructions}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                                  {prescription.status}
                                </Badge>
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(prescription.startDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Pill className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p>No prescriptions found</p>
                        <p className="text-sm">Add prescriptions to track patient medications</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visits">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <History className="mr-2 h-5 w-5" />
                        Visit History
                      </span>
                      <Button size="sm" onClick={() => setShowVisitModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Visit
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {visitsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
                            <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                          </div>
                        ))}
                      </div>
                    ) : visits && visits.length > 0 ? (
                      <div className="space-y-4">
                        {visits.map((visit) => (
                          <div key={visit.id} className="border-l-4 border-primary pl-4 py-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-slate-800">
                                  {visit.visitType} - {new Date(visit.visitDate).toLocaleDateString()}
                                </h4>
                                {visit.complaint && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    <strong>Complaint:</strong> {visit.complaint}
                                  </p>
                                )}
                                {visit.diagnosis && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    <strong>Diagnosis:</strong> {visit.diagnosis}
                                  </p>
                                )}
                                {visit.treatment && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    <strong>Treatment:</strong> {visit.treatment}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-sm text-slate-500">
                                {visit.bloodPressure && <p>BP: {visit.bloodPressure}</p>}
                                {visit.temperature && <p>Temp: {visit.temperature}°C</p>}
                                {visit.weight && <p>Weight: {visit.weight}kg</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Stethoscope className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-4 text-sm font-medium text-slate-900">No visits recorded</h3>
                        <p className="mt-2 text-sm text-slate-500">Record the first visit for this patient.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="labs">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <FlaskRound className="mr-2 h-5 w-5" />
                        Lab Results
                      </span>
                      <Button size="sm" onClick={() => setShowLabModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Result
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {labsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
                            <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                          </div>
                        ))}
                      </div>
                    ) : labResults && labResults.length > 0 ? (
                      <div className="space-y-4">
                        {labResults.map((result) => (
                          <div key={result.id} className="border border-slate-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-slate-800">{result.testName}</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                  <strong>Result:</strong> {result.result}
                                </p>
                                {result.normalRange && (
                                  <p className="text-sm text-slate-600">
                                    <strong>Normal Range:</strong> {result.normalRange}
                                  </p>
                                )}
                                {result.notes && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    <strong>Notes:</strong> {result.notes}
                                  </p>
                                )}
                                <p className="text-xs text-slate-400 mt-2">
                                  {new Date(result.testDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div>{getStatusBadge(result.status)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FlaskRound className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-4 text-sm font-medium text-slate-900">No lab results</h3>
                        <p className="mt-2 text-sm text-slate-500">Add the first lab result for this patient.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="prescriptions">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Pill className="mr-2 h-5 w-5" />
                        Prescriptions
                      </span>
                      <Button size="sm" onClick={() => setShowPrescriptionModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Prescription
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prescriptionsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
                            <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                          </div>
                        ))}
                      </div>
                    ) : prescriptions && prescriptions.length > 0 ? (
                      <div className="space-y-4">
                        {prescriptions.map((prescription) => (
                          <div key={prescription.id} className="border border-slate-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-slate-800">Medicine ID: {prescription.medicineId}</h4>
                                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-slate-600">
                                  <div>
                                    <strong>Dosage:</strong> {prescription.dosage}
                                  </div>
                                  <div>
                                    <strong>Frequency:</strong> {prescription.frequency}
                                  </div>
                                  <div>
                                    <strong>Duration:</strong> {prescription.duration}
                                  </div>
                                  <div>
                                    <strong>Prescribed by:</strong> {prescription.prescribedBy}
                                  </div>
                                </div>
                                {prescription.instructions && (
                                  <p className="text-sm text-slate-600 mt-2">
                                    <strong>Instructions:</strong> {prescription.instructions}
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400">
                                  <span>Start: {new Date(prescription.startDate).toLocaleDateString()}</span>
                                  {prescription.endDate && (
                                    <span>End: {new Date(prescription.endDate).toLocaleDateString()}</span>
                                  )}
                                  <span>Created: {new Date(prescription.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div>
                                <Badge className={
                                  prescription.status === "active" 
                                    ? "bg-green-100 text-green-800" 
                                    : prescription.status === "completed"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }>
                                  {prescription.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Pill className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-4 text-sm font-medium text-slate-900">No prescriptions</h3>
                        <p className="mt-2 text-sm text-slate-500">Add the first prescription for this patient.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Modals */}
      <VisitRecordingModal
        open={showVisitModal}
        onOpenChange={setShowVisitModal}
        patientId={patientId}
      />
      <LabResultModal
        open={showLabModal}
        onOpenChange={setShowLabModal}
        patientId={patientId}
      />
      <PrescriptionModal
        open={showPrescriptionModal}
        onOpenChange={setShowPrescriptionModal}
        patientId={patientId}
      />

      {/* Hidden Printable Patient Summary */}
      <div className="hidden">
        <PatientSummaryPrintable
          patient={patient}
          visits={visits || []}
          organization={currentOrganization}
        />
      </div>
    </>
  );
}
