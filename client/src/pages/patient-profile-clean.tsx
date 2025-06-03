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
import { EditPatientModal } from "@/components/edit-patient-modal";
import PatientQRCard from "@/components/patient-qr-card";
import PatientChat from "@/components/patient-chat";
import LabOrderForm from "@/components/lab-order-form";
import LabOrdersList from "@/components/lab-orders-list";
import ConsultationHistory from "@/components/consultation-history";
import VaccinationManagement from "@/components/vaccination-management";
import AllergyManagement from "@/components/allergy-management";
import MedicalHistoryManagement from "@/components/medical-history-management";

import { PatientSummaryPrintable } from "@/components/patient-summary-printable";
import { ModernPatientOverview } from "@/components/modern-patient-overview";
import { FloatingActionMenu } from "@/components/floating-action-menu";
import { useRole } from "@/components/role-guard";
import { formatPatientName, getPatientInitials } from "@/lib/patient-utils";
import type { Patient, Visit, LabResult, Prescription } from "@shared/schema";

interface Organization {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export default function PatientProfile() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id ? parseInt(params.id) : undefined;
  const { user } = useRole();
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);

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
  const currentOrganization = Array.isArray(organizations) 
    ? organizations.find(org => org.id === (user as any)?.organizationId)
    : undefined;

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {getPatientInitials(patient)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {formatPatientName(patient)}
              </h1>
              <p className="text-sm text-gray-500">
                Patient ID: HC{patient.id?.toString().padStart(6, "0")} • 
                Age: {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years • 
                {patient.gender}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
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
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-full">
        <div className="w-full max-w-none">
          <ModernPatientOverview
            patient={patient as Patient}
            visits={visits || []}
            recentLabs={labResults || []}
            activePrescriptions={prescriptions || []}
            onAddPrescription={() => setShowPrescriptionModal(true)}
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

      {/* Edit Patient Modal */}
      {patient && (
        <EditPatientModal
          open={showEditPatientModal}
          onOpenChange={setShowEditPatientModal}
          patient={patient as any}
          onPatientUpdated={() => {
            // Refresh patient data after update
            window.location.reload();
          }}
        />
      )}

      {/* Hidden Printable Patient Summary */}
      <div className="hidden">
        <PatientSummaryPrintable
          patient={patient as Patient}
          visits={visits || []}
          organization={currentOrganization}
        />
      </div>
    </div>
  );
}