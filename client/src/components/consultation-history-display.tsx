import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, Clock, User, Activity, Pill, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ConsultationHistoryDisplayProps {
  patientId: number;
}

export default function ConsultationHistoryDisplay({ patientId }: ConsultationHistoryDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch detailed consultation records with complete form data
  const { data: consultationHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['/api/patients', patientId, 'consultation-records'],
  });

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
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
              
              <div className="space-y-6">
                {(consultationHistory as any[]).map((consultation: any, index: number) => (
                  <div key={consultation.id} className="relative flex items-start" data-testid="consultation-record">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    
                    {/* Consultation content */}
                    <div className="ml-4 flex-1">
                      <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-lg text-gray-900">
                              {consultation.formName || 'Consultation'}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                #{consultation.id}
                              </Badge>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {consultation.specialistRole || 'General'}
                              </Badge>
                              <Badge variant="secondary">
                                {new Date(consultation.createdAt).toLocaleDateString()}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Enhanced Staff Information */}
                          <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-blue-900">
                                      {consultation.conductedByFullName || consultation.conductedByFirstName || consultation.conductedByUsername || 'Healthcare Staff'}
                                    </span>
                                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs font-medium">
                                      {consultation.roleDisplayName || consultation.conductedByRole || 'Staff'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-blue-700">
                                    {consultation.conductedByUsername && (
                                      <span>
                                        <strong>Username:</strong> {consultation.conductedByUsername}
                                      </span>
                                    )}
                                    {consultation.specialistRoleDisplay && consultation.specialistRoleDisplay !== 'General' && (
                                      <span>
                                        <strong>Specialty:</strong> {consultation.specialistRoleDisplay}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 text-xs">
                                  {consultation.specialistRoleDisplay || 'General'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* Consultation details */}
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <span className="text-gray-600">
                                <strong>Date:</strong> {new Date(consultation.createdAt).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </span>
                              <span className="text-gray-600">
                                <strong>Time:</strong> {new Date(consultation.createdAt).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            
                            {/* Vital Signs Section */}
                            {consultation.vitalSigns && (
                              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <h5 className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-2">
                                  <Activity className="w-3 h-3" />
                                  Vital Signs
                                </h5>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {consultation.vitalSigns.bloodPressure && (
                                    <span className="text-gray-700">
                                      <strong>BP:</strong> {consultation.vitalSigns.bloodPressure}
                                    </span>
                                  )}
                                  {consultation.vitalSigns.heartRate && (
                                    <span className="text-gray-700">
                                      <strong>HR:</strong> {consultation.vitalSigns.heartRate} bpm
                                    </span>
                                  )}
                                  {consultation.vitalSigns.temperature && (
                                    <span className="text-gray-700">
                                      <strong>Temp:</strong> {consultation.vitalSigns.temperature}°C
                                    </span>
                                  )}
                                  {consultation.vitalSigns.weight && (
                                    <span className="text-gray-700">
                                      <strong>Weight:</strong> {consultation.vitalSigns.weight} kg
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Nursing Notes Section */}
                            {consultation.nursingNotes && (
                              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <h5 className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-2">
                                  <User className="w-3 h-3" />
                                  Nursing Assessment
                                </h5>
                                <div className="space-y-1 text-xs">
                                  {consultation.nursingNotes.assessment && (
                                    <div>
                                      <strong className="text-green-700">Assessment:</strong>
                                      <p className="text-gray-700 ml-2">{consultation.nursingNotes.assessment}</p>
                                    </div>
                                  )}
                                  {consultation.nursingNotes.medications && (
                                    <div>
                                      <strong className="text-green-700">Medications Administered:</strong>
                                      <p className="text-gray-700 ml-2">{consultation.nursingNotes.medications}</p>
                                    </div>
                                  )}
                                  {consultation.nursingNotes.notes && (
                                    <div>
                                      <strong className="text-green-700">Notes:</strong>
                                      <p className="text-gray-700 ml-2">{consultation.nursingNotes.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Physiotherapy Section */}
                            {consultation.physiotherapyNotes && (
                              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                <h5 className="text-xs font-semibold text-purple-800 mb-2 flex items-center gap-2">
                                  <Activity className="w-3 h-3" />
                                  Physiotherapy Assessment
                                </h5>
                                <div className="space-y-1 text-xs">
                                  {consultation.physiotherapyNotes.mobility && (
                                    <div>
                                      <strong className="text-purple-700">Mobility:</strong>
                                      <p className="text-gray-700 ml-2">{consultation.physiotherapyNotes.mobility}</p>
                                    </div>
                                  )}
                                  {consultation.physiotherapyNotes.exercises && (
                                    <div>
                                      <strong className="text-purple-700">Prescribed Exercises:</strong>
                                      <p className="text-gray-700 ml-2">{consultation.physiotherapyNotes.exercises}</p>
                                    </div>
                                  )}
                                  {consultation.physiotherapyNotes.progress && (
                                    <div>
                                      <strong className="text-purple-700">Progress:</strong>
                                      <p className="text-gray-700 ml-2">{consultation.physiotherapyNotes.progress}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Pharmacy Section */}
                            {consultation.pharmacyNotes && (
                              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                <h5 className="text-xs font-semibold text-orange-800 mb-2 flex items-center gap-2">
                                  <Pill className="w-3 h-3" />
                                  Pharmacy Review
                                </h5>
                                <div className="space-y-1 text-xs">
                                  {consultation.pharmacyNotes.interactions && (
                                    <div>
                                      <strong className="text-orange-700">Drug Interactions:</strong>
                                      <p className="text-gray-700 ml-2">{consultation.pharmacyNotes.interactions}</p>
                                    </div>
                                  )}
                                  {consultation.pharmacyNotes.counseling && (
                                    <div>
                                      <strong className="text-orange-700">Patient Counseling:</strong>
                                      <p className="text-gray-700 ml-2">{consultation.pharmacyNotes.counseling}</p>
                                    </div>
                                  )}
                                  {consultation.pharmacyNotes.recommendations && (
                                    <div>
                                      <strong className="text-orange-700">Recommendations:</strong>
                                      <p className="text-gray-700 ml-2">{consultation.pharmacyNotes.recommendations}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Continuity of Care */}
                            {consultation.followUp && (
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <h5 className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                  <Calendar className="w-3 h-3" />
                                  Follow-up & Continuity
                                </h5>
                                <div className="space-y-1 text-xs">
                                  {consultation.followUp.nextAppointment && (
                                    <div>
                                      <strong className="text-blue-700">Next Appointment:</strong>
                                      <p className="text-gray-700 ml-2">{consultation.followUp.nextAppointment}</p>
                                    </div>
                                  )}
                                  {consultation.followUp.instructions && (
                                    <div>
                                      <strong className="text-blue-700">Care Instructions:</strong>
                                      <p className="text-gray-700 ml-2">{consultation.followUp.instructions}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {consultation.formDescription && (
                              <div className="text-xs text-gray-600">
                                <strong>Type:</strong> {consultation.formDescription}
                              </div>
                            )}
                            
                            {/* Complete Consultation Data Display */}
                            {consultation.formData && Object.keys(consultation.formData).length > 0 && (
                              <div className="mt-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Detailed Consultation Information
                                </p>
                                <div className="space-y-3">
                                  {Object.entries(consultation.formData).map(([key, value]: [string, any]) => {
                                    // Skip empty or null values
                                    if (!value || (typeof value === 'string' && value.trim() === '')) {
                                      return null;
                                    }
                                    
                                    // Format field names for better display
                                    const formatFieldName = (fieldKey: string) => {
                                      if (fieldKey.includes('field_')) {
                                        return 'Clinical Notes';
                                      }
                                      // Convert camelCase or snake_case to proper labels
                                      return fieldKey
                                        .replace(/([A-Z])/g, ' $1')
                                        .replace(/[_-]/g, ' ')
                                        .replace(/^./, str => str.toUpperCase())
                                        .trim();
                                    };

                                    // Format values for better display
                                    const formatValue = (val: any) => {
                                      if (Array.isArray(val)) {
                                        return val.filter(item => item && item.toString().trim()).join(', ');
                                      }
                                      if (typeof val === 'object' && val !== null) {
                                        return JSON.stringify(val, null, 2);
                                      }
                                      return String(val);
                                    };

                                    const formattedValue = formatValue(value);
                                    if (!formattedValue || formattedValue.trim() === '') {
                                      return null;
                                    }

                                    return (
                                      <div key={key} className="bg-white p-3 rounded-md shadow-sm border border-gray-100">
                                        <div className="flex flex-col gap-2">
                                          <span className="font-medium text-gray-700 text-sm flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            {formatFieldName(key)}
                                          </span>
                                          <div className="text-gray-900 text-sm ml-4">
                                            <span className="whitespace-pre-wrap leading-relaxed">{formattedValue}</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {/* Consultation Summary */}
                                <div className="mt-4 pt-3 border-t border-gray-200">
                                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                                    <div>
                                      <strong>Form Type:</strong> {consultation.formName || 'General Consultation'}
                                    </div>
                                    <div>
                                      <strong>Completed At:</strong> {new Date(consultation.createdAt).toLocaleString()}
                                    </div>
                                    <div>
                                      <strong>Specialist Area:</strong> {consultation.specialistRoleDisplay || 'General Medicine'}
                                    </div>
                                    <div>
                                      <strong>Record ID:</strong> #{consultation.id}
                                    </div>
                                  </div>
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