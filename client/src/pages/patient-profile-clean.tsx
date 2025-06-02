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
      {/* Comprehensive Patient Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-6">
        <div className="space-y-4">
          {/* Patient Identity & Basic Info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                  {patient.firstName?.[0]?.toUpperCase()}{patient.lastName?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {patient.title ? `${patient.title} ` : ''}{patient.firstName} {patient.lastName}
                </h1>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Patient ID: HC{patient.id?.toString().padStart(6, "0")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years • {patient.gender}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-xs px-3 py-1">
                Active Patient
              </Badge>
            </div>
          </div>

          {/* Contact & Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            {patient.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Phone:</span>
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-green-500" />
                <span className="font-medium">Email:</span>
                <span>{patient.email}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="font-medium">Address:</span>
                <span className="truncate">{patient.address}</span>
              </div>
            )}
          </div>

          {/* Quick Stats & Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Total Visits:</span>
                <Badge variant="outline">{visits?.length || 0}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <FlaskRound className="w-4 h-4 text-green-500" />
                <span className="font-medium">Lab Results:</span>
                <Badge variant="outline">{labResults?.length || 0}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Active Prescriptions:</span>
                <Badge variant="outline">{prescriptions?.filter(p => p.status === 'active')?.length || 0}</Badge>
              </div>
            </div>
            
            {/* Edit Button moved to bottom right */}
            {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
              <Button variant="outline" onClick={() => setShowEditPatientModal(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Patient Info
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-full">
        <div className="w-full max-w-none">
          {/* Tabs for different sections */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="labs">Lab Results</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Patient Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {visits?.slice(0, 3).map((visit: any) => (
                        <div key={visit.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{visit.reason}</p>
                            <p className="text-sm text-gray-500">{new Date(visit.visitDate).toLocaleDateString()}</p>
                          </div>
                          <Badge variant="outline">{visit.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Vital Signs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Latest Vitals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Blood Pressure:</span>
                        <span className="font-medium">120/80 mmHg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Heart Rate:</span>
                        <span className="font-medium">72 bpm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Temperature:</span>
                        <span className="font-medium">36.5°C</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Allergies & Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Health Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patient.allergies ? (
                      <div className="space-y-2">
                        <Badge variant="destructive" className="w-full justify-center">
                          Allergies: {patient.allergies}
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No known allergies</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="visits">
              <ConsultationHistory patientId={patient.id} />
            </TabsContent>

            <TabsContent value="labs">
              <Card>
                <CardHeader>
                  <CardTitle>Laboratory Results</CardTitle>
                  <CardDescription>Recent lab tests and results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {labResults?.map((lab: any) => (
                      <div key={lab.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{lab.testName}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(lab.testDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={lab.status === 'normal' ? 'default' : 'destructive'}>
                            {lab.status}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm">
                            <span className="font-medium">Result:</span> {lab.result} {lab.unit}
                          </p>
                          {lab.referenceRange && (
                            <p className="text-sm text-gray-500">
                              Reference: {lab.referenceRange}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prescriptions">
              <Card>
                <CardHeader>
                  <CardTitle>Medications & Prescriptions</CardTitle>
                  <CardDescription>Current and past prescriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {prescriptions?.map((prescription: any) => (
                      <div key={prescription.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{prescription.medicationName}</h4>
                            <p className="text-sm text-gray-500">
                              {prescription.dosage} - {prescription.frequency}
                            </p>
                            <p className="text-sm">Duration: {prescription.duration}</p>
                          </div>
                          <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                            {prescription.status}
                          </Badge>
                        </div>
                        {prescription.instructions && (
                          <p className="text-sm text-gray-600 mt-2">
                            Instructions: {prescription.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Documents</CardTitle>
                  <CardDescription>Medical records and patient files</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No documents yet</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Patient documents will appear here when uploaded.
                    </p>
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