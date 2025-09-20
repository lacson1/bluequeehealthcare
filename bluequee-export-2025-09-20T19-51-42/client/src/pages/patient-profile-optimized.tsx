import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { AlertCircle, Edit, Stethoscope, Pill, FlaskRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRole } from '@/hooks/useRole';
import { useOptimizedPatientData } from '@/hooks/useOptimizedPatientData';
import { ModernPatientOverview } from '@/components/modern-patient-overview';
import { FloatingActionMenu } from '@/components/floating-action-menu';
import { EnhancedVisitRecording } from '@/components/enhanced-visit-recording';
import { LabResultModal } from '@/components/lab-result-modal';
import { PrescriptionModal } from '@/components/prescription-modal';
import { EditPatientModal } from '@/components/edit-patient-modal';
import { PatientSummaryPrintable } from '@/components/patient-summary-printable';

function OptimizedPatientProfile() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id ? parseInt(params.id) : undefined;
  const { user } = useRole();
  
  // Modal states
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);

  // Single optimized API call that fetches all patient data
  const { 
    data: completeData, 
    isLoading, 
    error 
  } = useOptimizedPatientData(patientId);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !completeData?.patient) {
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

  const { patient, visits, labs, prescriptions, summary } = completeData;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Optimized Header - shows summary data immediately */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {patient.firstName?.[0]?.toUpperCase()}{patient.lastName?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <p className="text-sm text-gray-500">
                Patient ID: HC{patient.id?.toString().padStart(6, "0")} • 
                Age: {patient.age || 'Unknown'} years • 
                {patient.gender}
              </p>
              {/* Quick summary indicators */}
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                <span>{summary.totalVisits} visits</span>
                <span>{summary.activePrescriptions} active prescriptions</span>
                {summary.pendingLabs > 0 && (
                  <span className="text-amber-600">{summary.pendingLabs} pending labs</span>
                )}
                {summary.hasActiveAlerts && (
                  <span className="text-red-600">⚠ Active alerts</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Role-based action buttons */}
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

            {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
              <Button variant="outline" onClick={() => setShowEditPatientModal(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Info
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - uses pre-loaded data, no additional API calls */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-full">
        <div className="w-full max-w-none">
          <ModernPatientOverview
            patient={patient}
            visits={visits}
            recentLabs={labs}
            activePrescriptions={prescriptions}
            onAddPrescription={() => setShowPrescriptionModal(true)}
            onRecordVisit={() => setShowVisitModal(true)}
            onEditPatient={() => setShowEditPatientModal(true)}
            onPrintRecord={() => {
              console.log('Print record clicked');
            }}
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
      <EnhancedVisitRecording
        open={showVisitModal}
        onOpenChange={setShowVisitModal}
        patientId={patientId || 0}
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

      {patient && (
        <EditPatientModal
          open={showEditPatientModal}
          onOpenChange={setShowEditPatientModal}
          patient={patient}
          onPatientUpdated={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Hidden Printable Summary */}
      <div className="hidden">
        <PatientSummaryPrintable
          patient={patient}
          visits={visits}
          organization={undefined}
        />
      </div>
    </div>
  );
}

export default OptimizedPatientProfile;