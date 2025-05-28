import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Stethoscope, FlaskRound, Pill, Edit } from "lucide-react";
import { Link } from "wouter";
import { ModernPatientOverview } from "@/components/modern-patient-overview";
import { FloatingActionMenu } from "@/components/floating-action-menu";
import { PrintExportToolbar } from "@/components/print-export-toolbar";
import { PatientSummaryPrintable } from "@/components/patient-summary-printable";
import VisitRecordingModal from "@/components/visit-recording-modal";
import LabResultModal from "@/components/lab-result-modal";
import PrescriptionModal from "@/components/prescription-modal";
import { EditPatientModal } from "@/components/edit-patient-modal";
import PatientVitalSignsTracker from "@/components/patient-vital-signs-tracker";
import SmartAppointmentScheduler from "@/components/smart-appointment-scheduler";
import PatientCommunicationHub from "@/components/patient-communication-hub";
import { useAuth } from "@/contexts/AuthContext";

export default function PatientProfile() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id ? parseInt(params.id) : undefined;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["/api/patients", patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const response = await fetch(`/api/patients/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clinic_token')}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch patient');
      }
      
      return response.json();
    },
    enabled: !!patientId,
  });

  const { data: visitsData } = useQuery({
    queryKey: ["/api/patients", patientId, "visits"],
    enabled: !!patientId,
  });

  const visits = Array.isArray(visitsData) ? visitsData.map((visit: any) => ({
    ...visit,
    visitDate: typeof visit.visitDate === 'string' ? visit.visitDate : visit.visitDate?.toISOString?.()?.split('T')[0] || new Date().toISOString().split('T')[0]
  })) : [];

  const { data: labResults } = useQuery({
    queryKey: ["/api/lab-results", patientId],
    enabled: !!patientId,
  });

  const { data: prescriptions } = useQuery({
    queryKey: ["/api/prescriptions", patientId],
    enabled: !!patientId,
  });

  const { data: currentOrganization } = useQuery({
    queryKey: ["/api/organizations/current"],
  });

  if (patientLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Not Found</h2>
          <p className="text-gray-600 mb-4">The patient you're looking for doesn't exist.</p>
          <Link href="/patients">
            <Button>Back to Patients</Button>
          </Link>
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

  return (
    <>
      {/* Navigation Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-2">
        <Link href="/patients">
          <Button variant="ghost" size="sm" className="hover:bg-slate-200">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Button>
        </Link>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
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
              <Button variant="outline" onClick={() => setShowEditPatientModal(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Info
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <ModernPatientOverview
          patient={patient}
          visits={visits || []}
          recentLabs={labResults || []}
          activePrescriptions={prescriptions || []}
        />
        
        {/* Vital Signs Tracker Widget */}
        {patient && (
          <PatientVitalSignsTracker patientId={patient.id} />
        )}
        
        {/* Smart Appointment Scheduler Widget */}
        {patient && (
          <SmartAppointmentScheduler patientId={patient.id} />
        )}
        
        {/* Patient Communication Hub Widget - Temporarily disabled due to error */}
        {/* {patient && (
          <PatientCommunicationHub 
            patientId={patient.id} 
            patientName={`${patient.firstName} ${patient.lastName}`}
          />
        )} */}
        
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
      <EditPatientModal
        open={showEditPatientModal}
        onOpenChange={setShowEditPatientModal}
        patient={patient}
        onPatientUpdated={() => {
          // Force complete cache refresh for this specific patient
          queryClient.removeQueries({ queryKey: ["/api/patients", patientId] });
          queryClient.refetchQueries({ queryKey: ["/api/patients", patientId] });
        }}
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