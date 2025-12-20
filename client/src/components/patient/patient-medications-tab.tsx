import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  Pill as Medication,
  Clock,
  RefreshCw as Refresh,
  FileText,
  Plus,
  Edit,
  Printer as Print,
  QrCode,
  CheckCircle as Success,
  XCircle as Close,
  MoreVertical as Menu,
  Calendar
} from "lucide-react";
import { formatDateMedium } from "@/lib/date-utils";
import { MedicationReviewAssignmentsList } from "@/components/medication-review-assignments-list";

interface Prescription {
  id: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  prescribedBy?: string;
}

interface PatientMedicationsTabProps {
  activeMedications: Prescription[];
  discontinuedMedications: Prescription[];
  repeatMedications: Prescription[];
  prescriptionsLoading: boolean;
  prescriptionsError: any;
  selectedMedications: Set<number>;
  onToggleMedicationSelection: (prescriptionId: number) => void;
  onPrintSelectedMedications: () => void;
  onClearSelection: () => void;
  onAddPrescription: () => void;
  onEditPrescription: (prescription: Prescription) => void;
  onPrintPrescription: (prescription: Prescription) => void;
  onGenerateQRCode: (prescription: Prescription) => void;
  onSendToRepeatMedications: (prescription: Prescription) => void;
  onSendToDispensary: (prescription: Prescription) => void;
  onUpdateMedicationStatus: (prescriptionId: number, newStatus: string) => void;
  onRetryLoading: () => void;
  patientId: number;
  patient: any;
  onCreateReviewAssignment: () => void;
}

export function PatientMedicationsTab({
  activeMedications,
  discontinuedMedications,
  repeatMedications,
  prescriptionsLoading,
  prescriptionsError,
  selectedMedications,
  onToggleMedicationSelection,
  onPrintSelectedMedications,
  onClearSelection,
  onAddPrescription,
  onEditPrescription,
  onPrintPrescription,
  onGenerateQRCode,
  onSendToRepeatMedications,
  onSendToDispensary,
  onUpdateMedicationStatus,
  onRetryLoading,
  patientId,
  patient,
  onCreateReviewAssignment
}: PatientMedicationsTabProps) {
  return (
    <>
    <Card className="shadow-md border-slate-200/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Medication className="h-5 w-5 text-purple-500" />
          Medications & Prescriptions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="w-full">
          <div className="flex items-center justify-between mb-4">
            {selectedMedications.size > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <Button
                  onClick={onPrintSelectedMedications}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Print className="w-4 h-4 mr-2" />
                  Print Selected ({selectedMedications.size})
                </Button>
                <Button
                  onClick={onClearSelection}
                  variant="outline"
                  size="sm"
                >
                  Clear Selection
                </Button>
              </div>
            )}
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger
                value="current"
                className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200"
                data-testid="tab-current-medications"
              >
                <Medication className="w-4 h-4" />
                Current ({activeMedications.length})
              </TabsTrigger>
              <TabsTrigger
                value="past"
                className="flex items-center gap-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-orange-200"
                data-testid="tab-past-medications"
              >
                <Clock className="w-4 h-4" />
                Past ({discontinuedMedications.length})
              </TabsTrigger>
              <TabsTrigger
                value="repeat"
                className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
                data-testid="tab-repeat-medications"
              >
                <Refresh className="w-4 h-4" />
                Repeat ({repeatMedications.length})
              </TabsTrigger>
              <TabsTrigger
                value="summary"
                className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-purple-200"
                data-testid="tab-medication-summary"
              >
                <FileText className="w-4 h-4" />
                Summary
              </TabsTrigger>
            </TabsList>
            <Button
              onClick={onAddPrescription}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              title="Add Medication"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Current Medications Tab */}
          <TabsContent value="current" className="space-y-2">
            {prescriptionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">Loading prescriptions...</div>
              </div>
            ) : prescriptionsError ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="text-red-500">Failed to load prescriptions</div>
                <Button
                  onClick={onRetryLoading}
                  variant="outline"
                  size="sm"
                >
                  <Refresh className="w-4 h-4 mr-2" />
                  Retry Loading
                </Button>
              </div>
            ) : activeMedications.length > 0 ? (
              <div className="grid gap-1.5">
                {activeMedications.map((prescription) => {
                  const isSelected = selectedMedications.has(prescription.id);
                  return (
                    <div
                      key={prescription.id}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) {
                          return;
                        }
                        onToggleMedicationSelection(prescription.id);
                      }}
                      className={`border rounded-lg p-2.5 hover:shadow-sm transition-all cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'border-blue-400 bg-blue-50/50 shadow-sm ring-2 ring-blue-200'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-slate-500 pb-1.5 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => onToggleMedicationSelection(prescription.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-3.5 w-3.5"
                              />
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Started: {prescription.startDate ? formatDateMedium(prescription.startDate) : 'Not specified'}</span>
                                </div>
                                {prescription.endDate && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>Ends: {formatDateMedium(prescription.endDate)}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800 h-6 w-6 p-0">
                                    <Menu className="w-3.5 h-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[180px]">
                                  <DropdownMenuItem onClick={() => onEditPrescription(prescription)}>
                                    <Edit className="w-3 h-3 mr-2" />
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onPrintPrescription(prescription)}>
                                    <Print className="w-3 h-3 mr-2" />
                                    Print
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onGenerateQRCode(prescription)}>
                                    <QrCode className="w-3 h-3 mr-2" />
                                    Generate QR Code
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => onSendToRepeatMedications(prescription)}>
                                    <Refresh className="w-3 h-3 mr-2 text-blue-600" />
                                    Add to Repeat Medications
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onSendToDispensary(prescription)}>
                                    <Plus className="w-3 h-3 mr-2 text-green-600" />
                                    Send to Dispensary
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => onUpdateMedicationStatus(prescription.id, 'completed')}>
                                    <Success className="w-3 h-3 mr-2 text-blue-600" />
                                    Mark Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onUpdateMedicationStatus(prescription.id, 'discontinued')}>
                                    <Close className="w-3 h-3 mr-2 text-orange-600" />
                                    Discontinue
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <h4 className="font-semibold text-slate-800 text-sm">
                              {prescription.medicationName}
                            </h4>
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              {prescription.status || 'Active'}
                            </Badge>
                          </div>

                          <div className="text-xs text-slate-600 space-y-0.5">
                            <div><strong>Dosage:</strong> {prescription.dosage}</div>
                            <div><strong>Frequency:</strong> {prescription.frequency}</div>
                            {prescription.duration && (
                              <div><strong>Duration:</strong> {prescription.duration}</div>
                            )}
                            {prescription.instructions && (
                              <div><strong>Instructions:</strong> {prescription.instructions}</div>
                            )}
                            {prescription.prescribedBy && (
                              <div className="text-slate-500 mt-1">
                                Prescribed by: {prescription.prescribedBy}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Medication className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active medications</p>
              </div>
            )}
          </TabsContent>

          {/* Past Medications Tab */}
          <TabsContent value="past" className="space-y-2">
            {discontinuedMedications.length > 0 ? (
              <div className="grid gap-1.5">
                {discontinuedMedications.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="border rounded-lg p-2.5 bg-slate-50 space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <h4 className="font-semibold text-slate-700 text-sm">
                        {prescription.medicationName}
                      </h4>
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        {prescription.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600">
                      <div><strong>Dosage:</strong> {prescription.dosage}</div>
                      <div><strong>Frequency:</strong> {prescription.frequency}</div>
                      {prescription.endDate && (
                        <div className="text-slate-500 mt-1">
                          Ended: {formatDateMedium(prescription.endDate)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No past medications</p>
              </div>
            )}
          </TabsContent>

          {/* Repeat Medications Tab */}
          <TabsContent value="repeat" className="space-y-2">
            {repeatMedications.length > 0 ? (
              <div className="grid gap-1.5">
                {repeatMedications.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="border rounded-lg p-2.5 bg-blue-50/50 space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <h4 className="font-semibold text-slate-800 text-sm">
                        {prescription.medicationName}
                      </h4>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Repeat
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600">
                      <div><strong>Dosage:</strong> {prescription.dosage}</div>
                      <div><strong>Frequency:</strong> {prescription.frequency}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Refresh className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No repeat medications</p>
              </div>
            )}
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-2">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{activeMedications.length}</div>
                  <div className="text-sm text-slate-600">Active Medications</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{discontinuedMedications.length}</div>
                  <div className="text-sm text-slate-600">Past Medications</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{repeatMedications.length}</div>
                  <div className="text-sm text-slate-600">Repeat Medications</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    {/* Repeat Medications Review Assignments Section */}
    {repeatMedications.length > 0 && (
      <Card className="mt-4 shadow-md border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-sm">Repeat Medication Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="mt-6">
              <MedicationReviewAssignmentsList
                patientId={patientId}
                patient={patient}
                onCreateAssignment={onCreateReviewAssignment}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    )}
    </>
  );
}

