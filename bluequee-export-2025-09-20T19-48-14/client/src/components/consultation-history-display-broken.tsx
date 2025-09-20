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
      // Transform consultation records - include all records
      ...(consultationRecords as any[])
        .map((record: any) => ({
          ...record,
          type: 'consultation',
          date: record.createdAt,
          title: record.formName || 'Consultation',
          conductedBy: record.conductedByFullName || 'Healthcare Staff',
          role: record.conductedByRole || 'staff',
          uniqueKey: `consultation-${record.id}-${record.createdAt}`
        })),
      // Transform visits - include all visits
      ...(visits as any[])
        .map((visit: any) => ({
          ...visit,
          id: `visit-${visit.id}`,
          type: 'visit',
          date: visit.visitDate || visit.createdAt,
          title: `${visit.visitType?.charAt(0).toUpperCase() + visit.visitType?.slice(1) || 'Medical Visit'}`,
          conductedBy: visit.doctorName || 'Healthcare Staff',
          role: 'doctor',
          formName: visit.visitType,
          complaint: visit.complaint,
          diagnosis: visit.diagnosis,
          treatment: visit.treatment,
          uniqueKey: `visit-${visit.id}-${visit.visitDate || visit.createdAt}`
        }))
    ];
    
    // Sort by date descending (newest first) - show all records
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
              {/* Enhanced Vertical Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-gray-300 rounded-full shadow-sm"></div>
              
              <div className="space-y-4 p-4">
                {(consultationHistory as any[]).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No consultation records match the current filters</p>
                  </div>
                ) : (
                  (consultationHistory as any[]).map((consultation: any, index: number) => (
                    <div key={consultation.id} className="relative flex items-start mb-6" data-testid="consultation-record">
                      {/* Enhanced Timeline dot with specialty indication */}
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      
                      {/* Enhanced Consultation content */}
                      <div className="ml-4 flex-1">
                        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-all duration-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-bold text-lg text-gray-900 flex items-center">
                                    {consultation.type === 'consultation' ? '🩺' : '📋'} {consultation.title}
                                  </h4>
                                  <Badge variant="outline" className={`${
                                    consultation.type === 'consultation' 
                                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                      : 'bg-green-50 text-green-700 border-green-200'
                                  }`}>
                                    {new Date(consultation.date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </Badge>
                                  <Badge variant={consultation.type === 'consultation' ? 'default' : 'secondary'} className="text-xs">
                                    {consultation.type === 'consultation' ? 'Consultation' : 'Visit'}
                                  </Badge>
                                </div>
                                
                                {/* Enhanced metadata with emojis */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <div>
                                      <span className="font-medium text-gray-700">📅 {new Date(consultation.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}</span>
                                      <div className="text-xs text-gray-500">
                                        🕐 {new Date(consultation.date).toLocaleTimeString('en-US', { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-green-500" />
                                    <div>
                                      <span className="font-medium text-gray-700">
                                        👤 {consultation.conductedByFullName || `${consultation.conductedBy || 'Healthcare Staff'}`}
                                      </span>
                                      <div className="text-xs text-gray-500">
                                        {consultation.roleDisplayName || consultation.conductedByRole || 'Staff'}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Activity className="h-4 w-4 text-purple-500" />
                                    <div>
                                      <span className="font-medium text-gray-700">
                                        🏥 {consultation.specialistRole || consultation.roleDisplayName || 'General'}
                                      </span>
                                      <div className="text-xs text-gray-500">Specialty</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <ConsultationDropdownMenu 
                                  consultation={consultation} 
                                  patient={patient}
                                  onView={handleViewConsultation}
                                />
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pt-0">
                            {/* Consultation content with View Full Note expandable */}
                            <div className="space-y-3">
                                {/* Preview of key data - different display for consultations vs visits */}
                                {consultation.type === 'consultation' && consultation.formData ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {Object.entries(consultation.formData).slice(0, 4).map(([key, value]) => {
                                      if (!value || (typeof value === 'object' && !Object.values(value).some(v => v))) return null;
                                      
                                      return (
                                        <div key={key} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                          <span className="font-medium text-blue-800 capitalize text-sm block mb-1">
                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                          </span>
                                          <div className="text-blue-700 text-sm">
                                            {typeof value === 'object' ? (
                                              <div className="space-y-1">
                                                {Object.entries(value).slice(0, 2).map(([subKey, subValue]) => 
                                                  subValue ? (
                                                    <div key={subKey} className="text-xs">
                                                      <span className="font-medium">{subKey}:</span> {String(subValue).substring(0, 50)}
                                                      {String(subValue).length > 50 && '...'}
                                                    </div>
                                                  ) : null
                                                )}
                                              </div>
                                            ) : (
                                              <span>
                                                {String(value).substring(0, 100)}
                                                {String(value).length > 100 && '...'}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : consultation.type === 'visit' ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Visit-specific data display */}
                                    {consultation.complaint && (
                                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                        <span className="font-medium text-red-800 text-sm block mb-1">Chief Complaint:</span>
                                        <div className="text-red-700 text-sm">{consultation.complaint}</div>
                                      </div>
                                    )}
                                    {consultation.diagnosis && (
                                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                        <span className="font-medium text-blue-800 text-sm block mb-1">Diagnosis:</span>
                                        <div className="text-blue-700 text-sm">{consultation.diagnosis}</div>
                                      </div>
                                    )}
                                    {consultation.treatment && (
                                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                        <span className="font-medium text-green-800 text-sm block mb-1">Treatment:</span>
                                        <div className="text-green-700 text-sm">{consultation.treatment}</div>
                                      </div>
                                    )}
                                    {/* Vital signs if available */}
                                    {(consultation.bloodPressure || consultation.heartRate || consultation.temperature || consultation.weight) && (
                                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                        <span className="font-medium text-purple-800 text-sm block mb-1">Vital Signs:</span>
                                        <div className="text-purple-700 text-xs space-y-1">
                                          {consultation.bloodPressure && <div>BP: {consultation.bloodPressure}</div>}
                                          {consultation.heartRate && <div>HR: {consultation.heartRate} bpm</div>}
                                          {consultation.temperature && <div>Temp: {consultation.temperature}°C</div>}
                                          {consultation.weight && <div>Weight: {consultation.weight} kg</div>}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                                
                                {/* View Full Note expandable section */}
                                <Collapsible>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full justify-center">
                                      <FileText className="h-4 w-4 mr-2" />
                                      View Full Note
                                      <ChevronDown className="h-4 w-4 ml-2" />
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-4">
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                      <h5 className="font-semibold text-blue-800 mb-3 flex items-center">
                                        📋 Complete Consultation Record
                                      </h5>
                                      <div className="max-h-64 overflow-y-auto space-y-3">
                                        {Object.entries(consultation.formData).map(([key, value]) => {
                                          if (!value || (typeof value === 'object' && !Object.values(value).some(v => v))) return null;
                                          
                                          return (
                                            <div key={key} className="bg-white p-3 rounded border">
                                              <span className="font-medium text-gray-700 capitalize block mb-2">
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                              </span>
                                              <div className="text-gray-600">
                                                {typeof value === 'object' ? (
                                                  <div className="space-y-2">
                                                    {Object.entries(value).map(([subKey, subValue]) => 
                                                      subValue ? (
                                                        <div key={subKey} className="flex justify-between p-2 bg-gray-50 rounded">
                                                          <span className="font-medium text-sm">{subKey}:</span>
                                                          <span className="text-sm">{String(subValue)}</span>
                                                        </div>
                                                      ) : null
                                                    )}
                                                  </div>
                                                ) : (
                                                  <div className="whitespace-pre-wrap">{String(value)}</div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
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