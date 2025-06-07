import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ConsultationDropdownMenu } from "./consultation-dropdown-menu";
import { formatStaffName } from "@/lib/patient-utils";
import { FileText, Clock, User, Activity, Pill, Calendar, ChevronDown, ChevronRight, Filter, X, Search, CalendarDays } from "lucide-react";
import { format, subDays, subWeeks, subMonths, isAfter, isBefore, isEqual } from "date-fns";

interface ConsultationHistoryDisplayProps {
  patientId: number;
  patient?: any;
}

export default function ConsultationHistoryDisplay({ patientId, patient }: ConsultationHistoryDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  
  // Enhanced filtering state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedFormType, setSelectedFormType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Custom date range state
  const [customDateFrom, setCustomDateFrom] = useState<Date>();
  const [customDateTo, setCustomDateTo] = useState<Date>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Fetch actual consultation records
  const { data: consultationRecords = [], isLoading: historyLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/consultation-records`],
  });

  // Fetch visits to include in consultation history
  const { data: visits = [], isLoading: visitsLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/visits`],
  });

  // Combine consultation records and visits into unified timeline
  const combinedRecords = React.useMemo(() => {
    const records = [
      // Transform consultation records
      ...(consultationRecords as any[]).map((record: any) => ({
        ...record,
        type: 'consultation',
        date: record.createdAt,
        title: record.formName || 'Consultation',
        conductedBy: record.conductedByFullName || 'Healthcare Staff',
        role: record.conductedByRole || 'staff'
      })),
      // Transform visits
      ...(visits as any[]).map((visit: any) => ({
        ...visit,
        id: `visit-${visit.id}`, // Prefix to avoid ID conflicts
        type: 'visit',
        date: visit.visitDate || visit.createdAt,
        title: `${visit.visitType?.charAt(0).toUpperCase() + visit.visitType?.slice(1) || 'Visit'}`,
        conductedBy: 'Healthcare Staff', // Would need to join with users table for actual name
        role: 'doctor', // Default role for visits
        formName: visit.visitType,
        complaint: visit.complaint,
        diagnosis: visit.diagnosis,
        treatment: visit.treatment
      }))
    ];
    
    // Sort by date descending (newest first)
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [consultationRecords, visits]);

  // Apply filters to combined records
  const filteredRecords = combinedRecords.filter((record: any) => {
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const staffName = formatStaffName({
        role: record.conductedByRole || 'staff',
        firstName: record.conductedByName || record.conductedBy || 'Healthcare',
        lastName: 'Staff'
      }).toLowerCase();
      const formName = (record.formName || '').toLowerCase();
      const title = (record.title || '').toLowerCase();
      const complaint = (record.complaint || '').toLowerCase();
      const diagnosis = (record.diagnosis || '').toLowerCase();
      if (!staffName.includes(searchLower) && !formName.includes(searchLower) && 
          !title.includes(searchLower) && !complaint.includes(searchLower) && 
          !diagnosis.includes(searchLower)) {
        return false;
      }
    }
    
    // Filter by role
    if (selectedRole !== 'all' && record.conductedByRole !== selectedRole) {
      return false;
    }
    
    // Filter by form type
    if (selectedFormType !== 'all' && record.formName !== selectedFormType) {
      return false;
    }
    
    // Filter by date range
    if (dateRange !== 'all') {
      const recordDate = new Date(record.date || record.createdAt);
      const now = new Date();
      
      switch (dateRange) {
        case 'today':
          return recordDate.toDateString() === now.toDateString();
        case 'yesterday':
          const yesterday = subDays(now, 1);
          return recordDate.toDateString() === yesterday.toDateString();
        case 'week':
          const weekAgo = subDays(now, 7);
          return isAfter(recordDate, weekAgo) || isEqual(recordDate, weekAgo);
        case 'month':
          const monthAgo = subMonths(now, 1);
          return isAfter(recordDate, monthAgo) || isEqual(recordDate, monthAgo);
        case '3months':
          const threeMonthsAgo = subMonths(now, 3);
          return isAfter(recordDate, threeMonthsAgo) || isEqual(recordDate, threeMonthsAgo);
        case '6months':
          const sixMonthsAgo = subMonths(now, 6);
          return isAfter(recordDate, sixMonthsAgo) || isEqual(recordDate, sixMonthsAgo);
        case 'year':
          const yearAgo = subMonths(now, 12);
          return isAfter(recordDate, yearAgo) || isEqual(recordDate, yearAgo);
        case 'custom':
          if (customDateFrom && customDateTo) {
            return (isAfter(recordDate, customDateFrom) || isEqual(recordDate, customDateFrom)) &&
                   (isBefore(recordDate, customDateTo) || isEqual(recordDate, customDateTo));
          } else if (customDateFrom) {
            return isAfter(recordDate, customDateFrom) || isEqual(recordDate, customDateFrom);
          } else if (customDateTo) {
            return isBefore(recordDate, customDateTo) || isEqual(recordDate, customDateTo);
          }
          return true;
        default:
          return true;
      }
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

  if (historyLoading || visitsLoading) {
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

  if (!consultationHistory || consultationHistory.length === 0) {
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
                Consultation History ({combinedRecords.length})
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
              {/* Search Input */}
              <div className="flex items-center gap-2 min-w-48">
                <label className="text-sm font-medium text-gray-600">Search:</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-xs w-40"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Role:</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
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
                <label className="text-sm font-medium text-gray-600">Timeline:</label>
                <Select value={dateRange} onValueChange={(value) => {
                  setDateRange(value);
                  if (value !== 'custom') {
                    setCustomDateFrom(undefined);
                    setCustomDateTo(undefined);
                  }
                }}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range Picker */}
              {dateRange === 'custom' && (
                <div className="flex items-center gap-2">
                  <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        <CalendarDays className="h-3 w-3 mr-1" />
                        {customDateFrom && customDateTo
                          ? `${format(customDateFrom, 'MMM d')} - ${format(customDateTo, 'MMM d')}`
                          : customDateFrom
                          ? `From ${format(customDateFrom, 'MMM d')}`
                          : customDateTo
                          ? `Until ${format(customDateTo, 'MMM d')}`
                          : 'Select Dates'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 space-y-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">From Date:</label>
                          <CalendarComponent
                            mode="single"
                            selected={customDateFrom}
                            onSelect={setCustomDateFrom}
                            disabled={(date) => {
                              if (date > new Date()) return true;
                              if (customDateTo && date > customDateTo) return true;
                              return false;
                            }}
                            initialFocus
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">To Date:</label>
                          <CalendarComponent
                            mode="single"
                            selected={customDateTo}
                            onSelect={setCustomDateTo}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(23, 59, 59, 999);
                              if (date > today) return true;
                              if (customDateFrom && date < customDateFrom) return true;
                              return false;
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setCustomDateFrom(undefined);
                              setCustomDateTo(undefined);
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            Clear
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setShowDatePicker(false)}
                            className="flex-1"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Type:</label>
                <Select value={selectedFormType} onValueChange={setSelectedFormType}>
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

              {(selectedRole !== 'all' || dateRange !== 'all' || selectedFormType !== 'all' || customDateFrom || customDateTo || searchTerm) && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {[
                      selectedRole !== 'all' && 'Role',
                      dateRange !== 'all' && 'Timeline', 
                      selectedFormType !== 'all' && 'Type',
                      searchTerm && 'Search',
                      (customDateFrom || customDateTo) && 'Custom Date'
                    ].filter(Boolean).length} filter{[
                      selectedRole !== 'all' && 'Role',
                      dateRange !== 'all' && 'Timeline', 
                      selectedFormType !== 'all' && 'Type',
                      searchTerm && 'Search',
                      (customDateFrom || customDateTo) && 'Custom Date'
                    ].filter(Boolean).length !== 1 ? 's' : ''} active
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRole('all');
                      setDateRange('all');
                      setSelectedFormType('all');
                      setCustomDateFrom(undefined);
                      setCustomDateTo(undefined);
                      setSearchTerm('');
                    }}
                    className="h-8 px-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0">
            <div className="relative max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-50 hover:scrollbar-thumb-blue-500 border-t border-gray-200">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
              
              <div className="space-y-4 p-4">
                {(consultationHistory as any[]).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No consultation records match the current filters</p>
                  </div>
                ) : (
                  (consultationHistory as any[]).map((consultation: any, index: number) => (
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
                  ))
                )}
                
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