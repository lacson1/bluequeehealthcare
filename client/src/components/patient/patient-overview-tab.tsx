import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { PatientAlertsPanel } from '@/components/patient-alerts-panel';
import { QuickSafetyIndicator } from '@/components/patient-safety-alerts-realtime';
import { formatPatientName } from '@/lib/patient-utils';
import { calculateAge } from '@/lib/date-utils';
import { formatDateMedium } from '@/lib/date-utils';
import {
  Stethoscope,
  User,
  TestTube as BloodTest,
  Pill as Medication,
  Activity as Vitals,
  FileCheck as MedicalRecord,
  ChevronDown,
  ChevronRight,
  MoreVertical as Menu,
  Eye as Vision,
  Edit,
  Copy,
  Trash as Delete,
  History,
  Brain,
  Heart
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Patient } from '@shared/schema';

interface Visit {
  id: number;
  visitDate: string;
  visitType?: string;
  complaint?: string;
  diagnosis?: string;
  bloodPressure?: string;
  heartRate?: string;
}

interface PatientOverviewTabProps {
  patient: Patient;
  visits: Visit[];
  recentLabs: any[];
  activePrescriptions: any[];
  displayPrescriptions: any[];
  onAddPrescription?: () => void;
  onRecordVisit?: () => void;
  onShowPsychologicalTherapyDialog: () => void;
}

export function PatientOverviewTab({
  patient,
  visits,
  recentLabs,
  activePrescriptions,
  displayPrescriptions,
  onAddPrescription,
  onRecordVisit,
  onShowPsychologicalTherapyDialog
}: PatientOverviewTabProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isConsultationHistoryOpen, setIsConsultationHistoryOpen] = useState(false);

  // Combine visits
  const combinedVisits = React.useMemo(() => {
    const allVisits = [
      ...visits.map(visit => ({
        ...visit,
        type: 'visit',
        date: visit.visitDate,
        title: visit.visitType || 'Consultation',
        description: visit.complaint || visit.diagnosis || 'No details recorded'
      }))
    ];

    return allVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visits]);

  const handleViewVisit = (visitId: number) => {
    navigate(`/patients/${patient.id}/visits/${visitId}`);
  };

  const handleEditVisit = (visitId: number) => {
    navigate(`/patients/${patient.id}/visits/${visitId}/edit`);
  };

  const handleCopyVisit = (visit: any) => {
    const visitDetails = `Visit Date: ${formatDateMedium(visit.visitDate)}
Type: ${visit.visitType || 'Consultation'}
Complaint: ${visit.complaint || 'N/A'}
Diagnosis: ${visit.diagnosis || 'N/A'}
Treatment: ${visit.treatment || 'N/A'}
Blood Pressure: ${visit.bloodPressure || 'N/A'}
Heart Rate: ${visit.heartRate || 'N/A'}`;

    navigator.clipboard.writeText(visitDetails);
    toast({
      title: "Visit details copied",
      description: "Visit information has been copied to clipboard",
    });
  };

  const handleDeleteVisit = async (visitId: number) => {
    // Delete visit logic - to be implemented
    toast({
      title: "Delete Visit",
      description: "Visit deletion functionality to be implemented",
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Quick Stats - Enhanced */}
        <Card className="shadow-md border-slate-200/60 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2.5">
            <CardTitle className="text-sm font-medium">Medical Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center space-x-2">
                <Vitals className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm text-slate-700">Total Visits</span>
              </div>
              <Badge variant="secondary" className="font-semibold">{visits.length}</Badge>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center space-x-2">
                <BloodTest className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-slate-700">Lab Results</span>
              </div>
              <Badge variant="secondary" className="font-semibold">{recentLabs.length}</Badge>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center space-x-2">
                <Medication className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="text-sm text-slate-700">Active Meds</span>
              </div>
              <Badge variant="secondary" className="font-semibold">{displayPrescriptions.length}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Patient Summary - Industry Standard Format - Spans 2 columns on large screens */}
        <Card className="shadow-md border-slate-200/60 hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
              <User className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" style={{ color: '#0051CC' }} />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {/* DOB - Critical for patient identification */}
              <div className="col-span-2 flex justify-between items-center bg-blue-50/50 rounded px-2 py-1.5">
                <span className="text-xs font-medium text-blue-700">DOB</span>
                <span className="text-xs font-bold text-blue-900">
                  {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center min-w-0">
                <span className="text-xs text-gray-600 truncate">Age/Sex</span>
                <span className="text-xs font-medium text-gray-800 whitespace-nowrap ml-2">
                  {patient?.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'N/A'}y {patient?.gender?.charAt(0).toUpperCase() || ''}
                </span>
              </div>

              <div className="flex justify-between items-center min-w-0">
                <span className="text-xs text-gray-600 truncate">Blood Type</span>
                <Badge variant="outline" className="text-xs text-red-600 border-red-300/60 h-5 bg-red-50/80 flex-shrink-0 ml-2">
                  {(patient as any)?.bloodType || 'Unknown'}
                </Badge>
              </div>

              <div className="col-span-2 flex justify-between items-center min-w-0">
                <span className="text-xs text-gray-600 flex-shrink-0">Phone</span>
                {patient?.phone ? (
                  <a
                    href={`tel:${patient.phone.replace(/\s+/g, '')}`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline truncate ml-2 transition-colors cursor-pointer min-w-0 flex-1 text-right"
                    title={`Call ${patient.phone}`}
                  >
                    {patient.phone}
                  </a>
                ) : (
                  <span className="text-xs font-medium text-gray-800 ml-2">N/A</span>
                )}
              </div>

              <div className="col-span-2 flex justify-between items-center min-w-0">
                <span className="text-xs text-gray-600 flex-shrink-0">Email</span>
                {patient?.email ? (
                  <a
                    href={`mailto:${patient.email}`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline truncate ml-2 transition-colors cursor-pointer min-w-0 flex-1 text-right"
                    title={`Send email to ${patient.email}`}
                  >
                    {patient.email}
                  </a>
                ) : (
                  <span className="text-xs font-medium text-gray-800 ml-2">N/A</span>
                )}
              </div>

              <div className="flex justify-between items-center min-w-0">
                <span className="text-xs text-gray-600 truncate">Language</span>
                <span className="text-xs font-medium text-gray-800 truncate ml-2 text-right">
                  {(patient as any)?.preferredLanguage || 'English'}
                </span>
              </div>

              <div className="flex justify-between items-center min-w-0">
                <span className="text-xs text-gray-600 truncate">Insurance</span>
                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300/60 h-5 bg-emerald-50/80 flex-shrink-0 ml-2">
                  Active
                </Badge>
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-gray-200/60">
              <h4 className="text-xs font-medium text-gray-900 mb-1.5">Allergies</h4>
              <div className="flex flex-wrap gap-1">
                {patient?.allergies ? (
                  <Badge variant="secondary" className="text-xs bg-red-50/90 text-red-700 border border-red-200/60 h-5">
                    {patient.allergies.length > 20 ? patient.allergies.substring(0, 20) + '...' : patient.allergies}
                  </Badge>
                ) : (
                  <span className="text-xs text-gray-500">None reported</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Safety Indicator */}
        <Card className="shadow-md border-slate-200/60 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2.5">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Vitals className="w-4 h-4 text-red-500 flex-shrink-0" />
              Safety Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuickSafetyIndicator patientId={patient.id} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Card */}
      <Card className="border-l-4 border-l-indigo-500 shadow-md border-slate-200/60 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-indigo-600" />
            Clinical Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {onRecordVisit && (
              <Button
                onClick={onRecordVisit}
                variant="outline"
                className="w-full justify-start gap-2 min-w-0"
                size="sm"
              >
                <Stethoscope className="w-4 h-4 shrink-0" />
                <span className="truncate min-w-0">Record Visit</span>
              </Button>
            )}
            {onAddPrescription && (
              <Button
                onClick={onAddPrescription}
                variant="outline"
                className="w-full justify-start gap-2 min-w-0"
                size="sm"
              >
                <Medication className="w-4 h-4 shrink-0" />
                <span className="truncate min-w-0">Prescription</span>
              </Button>
            )}
            <Button
              onClick={() => navigate(`/patients/${patient.id}/lab-orders/new`)}
              variant="outline"
              className="w-full justify-start gap-2 min-w-0"
              size="sm"
            >
              <BloodTest className="w-4 h-4 shrink-0" />
              <span className="truncate min-w-0">Lab Order</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mental Health Section */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            Mental Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={onShowPsychologicalTherapyDialog}
              variant="outline"
              className="w-full justify-start border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700"
              size="sm"
            >
              <Brain className="w-4 h-4 mr-2" />
              Therapy Session
            </Button>
            <Button
              onClick={() => navigate(`/mental-health?patientId=${patient.id}`)}
              variant="outline"
              className="w-full justify-start border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700"
              size="sm"
            >
              <Heart className="w-4 h-4 mr-2" />
              Support Resources
            </Button>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Access psychological therapy sessions, mental health assessments, and support resources for this patient.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Collapsible Consultation History */}
      <Collapsible
        open={isConsultationHistoryOpen}
        onOpenChange={setIsConsultationHistoryOpen}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MedicalRecord className="h-5 w-5 text-gray-600" />
                  Recent Visits & Consultations
                  <Badge variant="secondary" className="ml-2">
                    {combinedVisits.length}
                  </Badge>
                </CardTitle>
                {isConsultationHistoryOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {combinedVisits.length > 0 ? (
                <div className="space-y-3">
                  {combinedVisits.slice(0, 5).map((item: any) => (
                    <div key={`${item.type}-${item.id}`} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${item.type === 'consultation' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                            >
                              {item.title}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">
                            {item.description}
                          </p>
                          {item.type === 'visit' && item.bloodPressure && (
                            <div className="text-xs text-gray-500">
                              BP: {item.bloodPressure}
                              {item.heartRate && ` • HR: ${item.heartRate}`}
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Menu className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[200px]">
                            {item.type === 'visit' ? (
                              <>
                                <DropdownMenuItem onClick={() => handleViewVisit(item.id)}>
                                  <Vision className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditVisit(item.id)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Visit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopyVisit(item)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteVisit(item.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Delete className="mr-2 h-4 w-4" />
                                  Delete Visit
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem onClick={() => handleViewVisit(item.id)}>
                                  <Vision className="mr-2 h-4 w-4" />
                                  View Consultation
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(JSON.stringify(item.responses || {}, null, 2))}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy Responses
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="font-medium text-gray-600 mb-1">No visits or consultations recorded yet</h3>
                  <p className="text-sm">Start by recording the first visit for this patient</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Active Problems/Diagnoses - Industry Standard Requirement */}
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-amber-600" />
              Active Problems / Diagnoses
            </div>
            <Badge variant="outline" className="text-xs">
              {visits.filter((v: any) => v.diagnosis).length} recorded
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Extract unique diagnoses from visits */}
          {(() => {
            const uniqueDiagnoses = Array.from(new Set(
              visits
                .filter((v: any) => v.diagnosis)
                .map((v: any) => v.diagnosis)
            )).slice(0, 5);

            if (uniqueDiagnoses.length === 0) {
              return (
                <div className="text-sm text-gray-500 py-2">
                  No active diagnoses recorded. Add diagnoses during patient visits.
                </div>
              );
            }

            return (
              <div className="space-y-2">
                {uniqueDiagnoses.map((diagnosis, index) => (
                  <div key={index} className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <span className="text-sm text-gray-800">{diagnosis as string}</span>
                      {patient?.medicalHistory?.toLowerCase().includes((diagnosis as string).toLowerCase().split(' ')[0]) && (
                        <Badge variant="outline" className="ml-2 text-xs bg-orange-50 text-orange-700 border-orange-200">
                          Chronic
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {visits.filter((v: any) => v.diagnosis).length > 5 && (
                  <div className="text-xs text-blue-600 hover:underline cursor-pointer pt-1">
                    View all {visits.filter((v: any) => v.diagnosis).length} diagnoses →
                  </div>
                )}
              </div>
            );
          })()}

          {/* Medical History as chronic conditions */}
          {patient?.medicalHistory && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                <History className="h-3 w-3" />
                Chronic Conditions / Medical History
              </h4>
              <p className="text-sm text-gray-700 bg-amber-50/50 p-2 rounded border border-amber-100">
                {patient.medicalHistory}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Alerts - Full Width */}
      <PatientAlertsPanel
        patient={patient as any}
        upcomingAppointments={[]}
        criticalMedications={activePrescriptions}
      />
    </div>
  );
}

