import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ConsultationDropdownMenu } from "./consultation-dropdown-menu";
import { FileText, Clock, User, Activity, Pill, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface ConsultationHistoryDisplayProps {
  patientId: number;
  patient?: any;
}

export default function ConsultationHistoryDisplay({ patientId, patient }: ConsultationHistoryDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  
  // Fetch consultation visits (visits with type="consultation")
  const { data: visitData = [], isLoading: historyLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/visits`],
  });

  // Fetch staff data to get actual doctor names
  const { data: staffData = [] } = useQuery({
    queryKey: ['/api/staff'],
    enabled: visitData.length > 0,
  });

  // Filter for consultation-type visits and format them with actual doctor names
  const consultationHistory = visitData.filter((visit: any) => 
    visit.visitType === 'consultation'
  ).map((visit: any) => {
    // Find the doctor who conducted this visit
    const doctor = staffData.find((staff: any) => staff.id === visit.doctorId);
    const doctorName = doctor ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() : doctor?.username || 'Healthcare Staff';
    
    return {
      id: visit.id,
      patientId: visit.patientId,
      formName: 'General Consultation',
      formDescription: 'Patient consultation visit',
      conductedByUsername: doctor?.username || 'healthcare-staff',
      conductedByFirstName: doctor?.firstName,
      conductedByLastName: doctor?.lastName,
      conductedByFullName: doctorName,
      conductedByRole: doctor?.role || 'doctor',
      roleDisplayName: doctor?.role ? doctor.role.charAt(0).toUpperCase() + doctor.role.slice(1) : 'Doctor',
      specialistRole: 'General',
      specialistRoleDisplay: 'General Medicine',
      createdAt: visit.visitDate || visit.createdAt,
      formData: {
        'Chief Complaint': visit.complaint,
        'Diagnosis': visit.diagnosis,
        'Treatment Plan': visit.treatment,
        'Vital Signs': {
          'Blood Pressure': visit.bloodPressure,
          'Heart Rate': visit.heartRate,
          'Temperature': visit.temperature,
          'Weight': visit.weight
        },
        'Visit Type': visit.visitType,
        'Status': visit.status
      }
    };
  });

  // Handle viewing consultation details - navigate to visit edit page for now
  const handleViewConsultation = (consultation: any) => {
    navigate(`/patients/${patientId}/visits/${consultation.id}/edit`);
  };

  if (historyLoading) {
    return (
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Consultation History (Loading...)
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  if (!consultationHistory || (consultationHistory as any[]).length === 0) {
    return (
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Consultation History (0)
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <p className="text-gray-500 text-center py-8">No consultation records found for this patient.</p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  return (
    <Card data-testid="consultation-history">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Consultation History ({(consultationHistory as any[]).length})
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0">
            <div className="relative max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
              
              <div className="space-y-4 p-4">
                {(consultationHistory as any[]).map((consultation: any, index: number) => (
                  <div key={consultation.id} className="relative flex items-start" data-testid="consultation-record">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    
                    {/* Consultation content - Compact version */}
                    <div className="ml-4 flex-1">
                      <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex flex-col gap-1">
                              <h4 className="font-semibold text-base text-gray-900">
                                {consultation.formName || 'Consultation'}
                              </h4>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-600">By:</span>
                                <span className="font-medium text-blue-800">
                                  {consultation.conductedByFullName || 'Healthcare Staff'}
                                </span>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs px-1 py-0">
                                  {consultation.roleDisplayName || 'Staff'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                #{consultation.id}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {new Date(consultation.createdAt).toLocaleDateString()}
                              </Badge>
                              <ConsultationDropdownMenu 
                                consultation={consultation} 
                                patient={patient}
                                onView={handleViewConsultation}
                              />
                            </div>
                          </div>
                          
                          {/* Compact consultation details */}
                          <div className="space-y-2">
                            <div className="text-xs text-gray-600">
                              <strong>Date:</strong> {new Date(consultation.createdAt).toLocaleDateString()} at {new Date(consultation.createdAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            
                            {/* Core consultation information - Compact display */}
                            {consultation.formData && (
                              <div className="mt-2 p-2 bg-gray-50 rounded border">
                                <div className="space-y-1 text-xs">
                                  {consultation.formData['Chief Complaint'] && (
                                    <div>
                                      <span className="font-medium text-gray-700">Complaint:</span> {consultation.formData['Chief Complaint']}
                                    </div>
                                  )}
                                  {consultation.formData['Diagnosis'] && (
                                    <div>
                                      <span className="font-medium text-gray-700">Diagnosis:</span> {consultation.formData['Diagnosis']}
                                    </div>
                                  )}
                                  {consultation.formData['Treatment Plan'] && (
                                    <div>
                                      <span className="font-medium text-gray-700">Treatment:</span> {consultation.formData['Treatment Plan']}
                                    </div>
                                  )}
                                  {consultation.formData['Vital Signs'] && Object.values(consultation.formData['Vital Signs']).some(v => v) && (
                                    <div>
                                      <span className="font-medium text-gray-700">Vitals:</span>
                                      <span className="ml-1">
                                        {consultation.formData['Vital Signs']['Blood Pressure'] && `BP: ${consultation.formData['Vital Signs']['Blood Pressure']}`}
                                        {consultation.formData['Vital Signs']['Temperature'] && `, Temp: ${consultation.formData['Vital Signs']['Temperature']}°C`}
                                        {consultation.formData['Vital Signs']['Heart Rate'] && `, HR: ${consultation.formData['Vital Signs']['Heart Rate']}`}
                                        {consultation.formData['Vital Signs']['Weight'] && `, Weight: ${consultation.formData['Vital Signs']['Weight']}kg`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
                
                {/* End of timeline indicator */}
                <div className="relative flex items-center mt-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  </div>
                  <div className="ml-4 text-sm text-gray-500">
                    Start of consultation history
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}