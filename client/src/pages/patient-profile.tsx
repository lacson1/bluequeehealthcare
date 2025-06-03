import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { AlertCircle, Edit, Stethoscope, Pill, FlaskRound, Plus, History, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisitRecordingModal } from "@/components/visit-recording-modal";
import { LabResultModal } from "@/components/lab-result-modal";
import { PrescriptionModal } from "@/components/prescription-modal";
import { PatientSummaryPrintable } from "@/components/patient-summary-printable";
import { ModernPatientOverview } from "@/components/modern-patient-overview";
import { FloatingActionMenu } from "@/components/floating-action-menu";
import { useRole } from "@/components/role-guard";
import { formatPatientName, getPatientInitials } from "@/lib/patient-utils";
import type { Patient, Visit, LabResult, Prescription, Organization } from "@shared/schema";

export default function PatientProfile() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id ? parseInt(params.id) : undefined;
  const { role: user } = useRole();

  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // Fetch patient data
  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  // Fetch visits
  const { data: visits, isLoading: visitsLoading } = useQuery<Visit[]>({
    queryKey: [`/api/patients/${patientId}/visits`],
    enabled: !!patientId,
  });

  // Fetch lab results
  const { data: labResults, isLoading: labsLoading, error: labsError } = useQuery<LabResult[]>({
    queryKey: [`/api/patients/${patientId}/labs`],
    enabled: !!patientId,
  });

  // Debug logging
  console.log('Lab results query:', { patientId, labResults, labsLoading, labsError });

  // Fetch prescriptions
  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery<Prescription[]>({
    queryKey: [`/api/patients/${patientId}/prescriptions`],
    enabled: !!patientId,
  });

  // Fetch current organization
  const { data: currentOrganization } = useQuery<Organization>({
    queryKey: ["/api/organizations/current"],
  });

  if (!patientId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">Invalid patient ID</h3>
          <p className="mt-2 text-sm text-slate-500">Please provide a valid patient ID.</p>
        </div>
      </div>
    );
  }

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "normal":
        return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
      case "abnormal":
        return <Badge className="bg-red-100 text-red-800">Abnormal</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const printPrescription = async (prescription: any, patient: any) => {
    try {
      const { printPrescription: printPrescriptionService } = await import('../services/print-utils');
      await printPrescriptionService(prescription, patient);
    } catch (error) {
      console.error('Failed to print prescription:', error);
      window.print();
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
                {getPatientInitials(patient)}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {formatPatientName(patient)}
              </h2>
              <p className="text-sm text-slate-500">
                ID: HC{patient.id?.toString().padStart(6, "0")} | Age: {getPatientAge(patient.dateOfBirth)} | {patient.gender}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Info
              </Button>
            )}
            
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
            
            {(user?.role === 'nurse' || user?.role === 'doctor') && (
              <Button variant="outline" onClick={() => setShowLabModal(true)}>
                <FlaskRound className="mr-2 h-4 w-4" />
                Add Lab Result
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
            onAddPrescription={() => setShowPrescriptionModal(true)}
          />
        </div>

        {/* Detailed Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="visits" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="labs">Lab Results</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="visits">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <History className="mr-2 h-5 w-5" />
                      Visit History
                    </span>
                    {user?.role === 'doctor' && (
                      <Button size="sm" onClick={() => setShowVisitModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Visit
                      </Button>
                    )}
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
                        <div key={visit.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-slate-800">
                                Visit on {new Date(visit.visitDate).toLocaleDateString()}
                              </h4>
                              <p className="text-sm text-slate-600 mt-1">
                                <strong>Reason:</strong> {visit.reasonForVisit}
                              </p>
                              {visit.diagnosis && (
                                <p className="text-sm text-slate-600">
                                  <strong>Diagnosis:</strong> {visit.diagnosis}
                                </p>
                              )}
                              {visit.treatmentPlan && (
                                <p className="text-sm text-slate-600 mt-1">
                                  <strong>Treatment:</strong> {visit.treatmentPlan}
                                </p>
                              )}
                            </div>
                            <Badge>{visit.status || 'Completed'}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="mx-auto h-12 w-12 text-slate-400" />
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
                    {(user?.role === 'nurse' || user?.role === 'doctor') && (
                      <Button size="sm" onClick={() => setShowLabModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Result
                      </Button>
                    )}
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
                    {user?.role === 'doctor' && (
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
                          <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
                          <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : prescriptions && prescriptions.length > 0 ? (
                    <div className="space-y-4">
                      {prescriptions.map((prescription) => (
                        <div key={prescription.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-slate-800">{prescription.medicationName || `Medicine ID: ${prescription.medicationId}`}</h4>
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
                              <div className="flex items-center gap-2 mt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => printPrescription(prescription, patient)}
                                >
                                  <Printer className="mr-1 h-3 w-3" />
                                  Print
                                </Button>
                              </div>
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
                    <div className="text-center py-8">
                      <Pill className="mx-auto h-12 w-12 text-slate-400" />
                      <h3 className="mt-4 text-sm font-medium text-slate-900">No prescriptions</h3>
                      <p className="mt-2 text-sm text-slate-500">Add the first prescription for this patient.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Medical History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {patient.medicalHistory ? (
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-700">{patient.medicalHistory}</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p>No medical history recorded</p>
                      </div>
                    )}
                    
                    {patient.allergies && (
                      <div>
                        <h4 className="font-medium text-slate-800 mb-2">Allergies</h4>
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm text-red-700">{patient.allergies}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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