import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ConsultationDropdownMenu } from "./consultation-dropdown-menu";
import { formatStaffName } from "@/lib/patient-utils";
import { FileText, Clock, User, Activity, Pill, Calendar, ChevronDown, ChevronRight, Filter, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface ConsultationHistoryDisplayProps {
  patientId: number;
  patient?: any;
}

export default function ConsultationHistoryDisplay({ patientId, patient }: ConsultationHistoryDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState({
    role: 'all',
    dateRange: 'all',
    formType: 'all'
  });
  
  // Fetch actual consultation records
  const { data: consultationRecords = [], isLoading: historyLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/consultation-records`],
  });

  // Apply filters to consultation records
  const filteredRecords = (consultationRecords as any[]).filter((record: any) => {
    // Filter by role
    if (filters.role !== 'all' && record.conductedByRole !== filters.role) {
      return false;
    }
    
    // Filter by date range
    if (filters.dateRange !== 'all') {
      const recordDate = new Date(record.createdAt);
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          return recordDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return recordDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return recordDate >= monthAgo;
        default:
          return true;
      }
    }
    
    // Filter by form type
    if (filters.formType !== 'all' && record.formName !== filters.formType) {
      return false;
    }
    
    return true;
  });

  // Map consultation records to display format
  const consultationHistory = filteredRecords.map((record: any) => {
    const title = record.conductedByTitle || '';
    const firstName = record.conductedByFirstName || '';
    const lastName = record.conductedByLastName || '';
    
    // Remove title prefix from firstName if it already contains it
    const cleanFirstName = firstName.startsWith(title) ? firstName.substring(title.length).trim() : firstName;
    const fullName = `${title} ${cleanFirstName} ${lastName}`.trim() || record.conductedByUsername || 'Healthcare Staff';
    
    return {
      id: record.id,
      patientId: record.patientId,
      formName: record.formName || 'General Consultation',
      formDescription: record.formDescription || 'Patient consultation record',
      conductedByUsername: record.conductedByUsername || 'healthcare-staff',
      conductedByFirstName: firstName,
      conductedByLastName: lastName,
      conductedByTitle: title,
      conductedByFullName: fullName,
      conductedByRole: record.conductedByRole || 'doctor',
      roleDisplayName: record.conductedByRole ? record.conductedByRole.charAt(0).toUpperCase() + record.conductedByRole.slice(1) : 'Doctor',
      specialistRole: record.specialistRole || 'General',
      specialistRoleDisplay: 'General Medicine',
      createdAt: record.createdAt,
      formData: record.formData || {}
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle filter visibility
                  }}
                  className="flex items-center gap-1 h-8"
                >
                  <Filter className="h-3 w-3" />
                  Filter
                </Button>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </CardTitle>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Role:</label>
                <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="doctor">Doctors</SelectItem>
                    <SelectItem value="nurse">Nurses</SelectItem>
                    <SelectItem value="pharmacist">Pharmacists</SelectItem>
                    <SelectItem value="physiotherapist">Physiotherapists</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Period:</label>
                <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Type:</label>
                <Select value={filters.formType} onValueChange={(value) => setFilters(prev => ({ ...prev, formType: value }))}>
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="General Assessment">General</SelectItem>
                    <SelectItem value="ENT Assessment">ENT</SelectItem>
                    <SelectItem value="Cardiology Assessment">Cardiology</SelectItem>
                    <SelectItem value="Nursing Assessment">Nursing</SelectItem>
                    <SelectItem value="Pharmacy Consultation">Pharmacy</SelectItem>
                    <SelectItem value="Physiotherapy Assessment">Physiotherapy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(filters.role !== 'all' || filters.dateRange !== 'all' || filters.formType !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ role: 'all', dateRange: 'all', formType: 'all' })}
                  className="h-8 px-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0">
            <div className="relative max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 border-t border-gray-200">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
              
              <div className="space-y-3 p-3">
                {(consultationHistory as any[]).map((consultation: any, index: number) => (
                  <div key={consultation.id} className="relative flex items-start" data-testid="consultation-record">
                    {/* Timeline dot - smaller */}
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    
                    {/* Consultation content - Very compact version */}
                    <div className="ml-3 flex-1">
                      <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex flex-col gap-0.5">
                              <h4 className="font-semibold text-sm text-gray-900">
                                {consultation.formName || 'Consultation'}
                              </h4>
                              <div className="flex items-center gap-1 text-xs">
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
                          
                          {/* Very compact consultation details */}
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600">
                              <strong>Date:</strong> {new Date(consultation.createdAt).toLocaleDateString()} at {new Date(consultation.createdAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            
                            {/* Scrollable consultation content */}
                            {consultation.formData && (
                              <div className="mt-1 p-1.5 bg-gray-50 rounded border">
                                <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 space-y-0.5 text-xs">
                                  {/* Display all form data dynamically */}
                                  {Object.entries(consultation.formData).map(([key, value]) => {
                                    if (!value || (typeof value === 'object' && !Object.values(value).some(v => v))) return null;
                                    
                                    return (
                                      <div key={key} className="pb-1">
                                        <span className="font-medium text-gray-700 capitalize">
                                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                        </span>
                                        <div className="ml-2 text-gray-600">
                                          {typeof value === 'object' ? (
                                            <div className="space-y-0.5">
                                              {Object.entries(value).map(([subKey, subValue]) => 
                                                subValue ? (
                                                  <div key={subKey}>
                                                    <span className="font-medium">{subKey}:</span> {subValue}
                                                  </div>
                                                ) : null
                                              )}
                                            </div>
                                          ) : (
                                            <span>{value}</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
                
                {/* End of timeline indicator - smaller */}
                <div className="relative flex items-center mt-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  </div>
                  <div className="ml-3 text-xs text-gray-500">
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