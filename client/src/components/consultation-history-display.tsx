import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  User, 
  FileText, 
  ChevronDown, 
  Search, 
  Clock,
  Stethoscope,
  ClipboardList,
  Eye,
  Ear,
  Baby,
  Brain,
  Heart,
  Bone,
  Pill,
  Activity,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { printConsultation } from '@/services/print-utils';

interface ConsultationHistoryDisplayProps {
  patientId: number;
  patient?: any;
}

// Helper function to get specialty icon
const getSpecialtyIcon = (role: string) => {
  const roleMap: Record<string, any> = {
    ophthalmologist: Eye,
    ent_specialist: Ear,
    pediatrician: Baby,
    psychiatrist: Brain,
    psychologist: Brain,
    cardiologist: Heart,
    orthopedist: Bone,
    physiotherapist: Activity,
    pharmacist: Pill,
    nurse: Activity,
    doctor: Stethoscope,
  };
  return roleMap[role?.toLowerCase()] || ClipboardList;
};

// Helper to format specialty role name
const formatSpecialtyRole = (role: string) => {
  if (!role) return 'Healthcare Staff';
  return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function ConsultationHistoryDisplay({ patientId, patient }: ConsultationHistoryDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [viewMode, setViewMode] = useState<string>("timeline");
  
  // Fetch consultation records and visits
  const { data: consultationRecords = [], isLoading: historyLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/consultation-records`],
  });

  const { data: visits = [], isLoading: visitsLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/visits`],
  });

  // Combine consultation records and visits into unified timeline
  const combinedRecords = React.useMemo(() => {
    const records = [
      // Transform consultation records (specialty forms)
      ...(consultationRecords as any[]).map((record: any) => ({
        ...record,
        type: 'consultation',
        date: record.createdAt,
        title: record.formName || 'Specialty Consultation',
        conductedBy: record.conductedByFullName || 'Healthcare Staff',
        role: record.conductedByRole || record.specialistRole || 'staff',
        specialistRole: record.specialistRole,
        isSpecialtyForm: true,
        uniqueKey: `consultation-${record.id}-${record.createdAt}`
      })),
      // Transform visits (regular consultations)
      ...(visits as any[]).map((visit: any) => {
        // Check if visit has embedded specialty assessments in notes
        let parsedNotes: any = null;
        let embeddedSpecialtyAssessments: any[] = [];
        try {
          if (visit.notes && typeof visit.notes === 'string') {
            parsedNotes = JSON.parse(visit.notes);
            embeddedSpecialtyAssessments = parsedNotes?.specialtyAssessments || [];
          }
        } catch (e) {
          // Notes is not JSON, that's fine
        }
        
        return {
          ...visit,
          id: `visit-${visit.id}`,
          type: 'visit',
          date: visit.visitDate || visit.createdAt,
          title: `${visit.visitType?.charAt(0).toUpperCase() + visit.visitType?.slice(1) || 'Medical Visit'}`,
          conductedBy: visit.doctorFirstName && visit.doctorLastName 
            ? `${visit.doctorFirstName} ${visit.doctorLastName}`
            : visit.doctorName || 'Healthcare Staff',
          role: visit.doctorRole || 'doctor',
          formName: visit.visitType,
          complaint: visit.chiefComplaint || visit.complaint,
          diagnosis: visit.diagnosis,
          treatment: visit.treatment,
          parsedNotes,
          embeddedSpecialtyAssessments,
          hasSpecialtyAssessments: embeddedSpecialtyAssessments.length > 0,
          uniqueKey: `visit-${visit.id}-${visit.visitDate || visit.createdAt}`
        };
      })
    ];
    
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [consultationRecords, visits]);
  
  // Separate specialty consultations and regular visits for tabs view
  const specialtyConsultations = combinedRecords.filter((r: any) => r.type === 'consultation');
  const regularVisits = combinedRecords.filter((r: any) => r.type === 'visit');

  // Apply filters
  const filteredRecords = combinedRecords.filter((record: any) => {
    // Filter by view mode first
    if (viewMode === "visits" && record.type !== "visit") return false;
    if (viewMode === "specialty" && record.type !== "consultation") return false;
    
    if (searchTerm && !record.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !record.conductedBy.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (selectedRole !== "all" && record.role !== selectedRole) {
      return false;
    }
    
    if (dateRange !== "all") {
      const recordDate = new Date(record.date);
      const now = new Date();
      
      switch (dateRange) {
        case "today":
          if (recordDate.toDateString() !== now.toDateString()) return false;
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (recordDate < weekAgo) return false;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (recordDate < monthAgo) return false;
          break;
      }
    }
    
    return true;
  });

  const isLoading = historyLoading || visitsLoading;
  const uniqueRoles = combinedRecords.reduce((acc: string[], record) => {
    if (!acc.includes(record.role)) {
      acc.push(record.role);
    }
    return acc;
  }, []);

  return (
    <div className="w-full mb-4">
      {/* Professional Collapsible Header */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:shadow-sm transition-all duration-200 border border-slate-200 bg-slate-50/50">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-slate-700 p-1.5 rounded">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 text-sm">Medical History</h3>
                    <p className="text-xs text-slate-600">
                      {combinedRecords.length} total records
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs border-slate-300 text-slate-600 bg-white">
                    {Array.isArray(consultationRecords) ? consultationRecords.length : 0} consultations • {Array.isArray(visits) ? visits.length : 0} visits
                  </Badge>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3 px-4 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900">Patient Medical Timeline</h4>
                <div className="text-xs text-slate-600">
                  {patient?.firstName} {patient?.lastName}
                </div>
              </div>
              
              {/* Compact Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-8 text-xs border-slate-200"
                  />
                </div>
                
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-8 text-xs border-slate-200">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {uniqueRoles.map(role => (
                      <SelectItem key={role} value={role} className="text-xs">{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="h-8 text-xs border-slate-200">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Past Week</SelectItem>
                    <SelectItem value="month">Past Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results Summary */}
              {filteredRecords.length !== combinedRecords.length && (
                <div className="flex items-center justify-between bg-blue-50 p-2 rounded border border-blue-200 mt-3">
                  <span className="text-blue-800 font-medium text-xs">
                    {filteredRecords.length} of {combinedRecords.length} records shown
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedRole("all");
                      setDateRange("all");
                    }}
                    className="text-blue-600 hover:text-blue-800 h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              )}
              
              {/* View Mode Tabs */}
              <div className="flex gap-2 mt-3">
                <Button
                  variant={viewMode === "timeline" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("timeline")}
                  className="text-xs h-7"
                >
                  All Records
                </Button>
                <Button
                  variant={viewMode === "visits" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("visits")}
                  className="text-xs h-7"
                >
                  Visits ({regularVisits.length})
                </Button>
                <Button
                  variant={viewMode === "specialty" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("specialty")}
                  className="text-xs h-7"
                >
                  Specialty Forms ({specialtyConsultations.length})
                </Button>
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-4">
              {/* Professional Timeline Display */}
              <div className="max-h-[500px] overflow-y-auto scroll-smooth">
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="text-slate-500 text-sm">Loading medical history...</div>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No medical records found.</p>
                    {combinedRecords.length > 0 && <p className="text-xs">Try adjusting your filters.</p>}
                  </div>
                ) : (
                  <div className="relative">
                    {/* Professional Timeline Line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                    
                    {filteredRecords.map((record: any, index: number) => {
                      const SpecialtyIcon = record.type === 'consultation' 
                        ? getSpecialtyIcon(record.specialistRole || record.role)
                        : Stethoscope;
                      
                      return (
                      <div key={record.uniqueKey || record.id} className="relative flex items-start mb-3 last:mb-0">
                        {/* Timeline Dot */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                          record.type === 'consultation' 
                            ? 'bg-purple-600' 
                            : record.hasSpecialtyAssessments 
                              ? 'bg-gradient-to-br from-emerald-500 to-purple-500'
                              : 'bg-emerald-600'
                        }`}>
                          {record.type === 'consultation' ? (
                            <SpecialtyIcon className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Stethoscope className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                        
                        {/* Professional Record Content */}
                        <div className="ml-3 flex-1 min-w-0">
                          <div className={`border rounded-lg p-3 ${
                            record.type === 'consultation'
                              ? 'bg-purple-50 border-purple-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-slate-900 text-sm truncate">
                                  {record.title}
                                </h5>
                                <div className="flex items-center space-x-4 mt-1 text-xs text-slate-600">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(record.date).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{new Date(record.date).toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <User className="h-3 w-3" />
                                    <span className="truncate">{record.conductedBy}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                {record.type === 'consultation' && record.specialistRole && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs bg-purple-100 text-purple-800 border-purple-300"
                                  >
                                    {formatSpecialtyRole(record.specialistRole)}
                                  </Badge>
                                )}
                                <Badge 
                                  variant={record.type === 'consultation' ? 'default' : 'secondary'} 
                                  className={`text-xs ${
                                    record.type === 'consultation' 
                                      ? 'bg-purple-600' 
                                      : ''
                                  }`}
                                >
                                  {record.type === 'consultation' ? 'Specialty' : 'Visit'}
                                </Badge>
                                {record.hasSpecialtyAssessments && (
                                  <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                                    +{record.embeddedSpecialtyAssessments.length} forms
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Format consultation data for print service
                                    const consultationData = {
                                      id: record.id,
                                      formName: record.title,
                                      formData: record.formData || {
                                        chiefComplaint: record.complaint,
                                        diagnosis: record.diagnosis,
                                        treatment: record.treatment
                                      },
                                      specialistRole: record.specialistRole || record.role,
                                      createdAt: record.date
                                    };
                                    printConsultation(consultationData, patient);
                                  }}
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-purple-600 hover:bg-purple-50"
                                  title="Print this record"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Professional Content Preview */}
                            {record.type === 'consultation' && record.formData ? (
                              <div className="space-y-1">
                                {Object.entries(record.formData).slice(0, 2).map(([key, value]) => {
                                  if (!value || (typeof value === 'object' && !Object.values(value).some(v => v))) return null;
                                  
                                  return (
                                    <div key={key} className="text-xs">
                                      <span className="font-medium text-slate-700 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                      </span>
                                      <span className="text-slate-600 ml-1">
                                        {typeof value === 'object' 
                                          ? Object.values(value).slice(0, 2).join(', ')
                                          : String(value).substring(0, 120)
                                        }
                                        {(typeof value === 'object' ? Object.values(value).join('').length : String(value).length) > 120 && '...'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : record.type === 'visit' ? (
                              <div className="space-y-1">
                                {record.complaint && (
                                  <div className="text-xs">
                                    <span className="font-medium text-slate-700">Chief Complaint:</span>
                                    <span className="text-slate-600 ml-1">{record.complaint.substring(0, 100)}{record.complaint.length > 100 && '...'}</span>
                                  </div>
                                )}
                                {record.diagnosis && (
                                  <div className="text-xs">
                                    <span className="font-medium text-slate-700">Diagnosis:</span>
                                    <span className="text-slate-600 ml-1">{record.diagnosis.substring(0, 100)}{record.diagnosis.length > 100 && '...'}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500 italic">
                                Record available - click to expand for details
                              </div>
                            )}
                            
                            {/* Expandable Full Details */}
                            {(record.type === 'consultation' && record.formData) && (
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" className="w-full justify-start p-2 h-8 mt-2 text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50">
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    View Full Specialty Assessment
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2">
                                  <div className="bg-white border border-purple-200 rounded p-2 space-y-2">
                                    {Object.entries(record.formData || {}).map(([key, value]) => {
                                      if (!value || (typeof value === 'object' && !Array.isArray(value) && !Object.values(value).some(v => v))) return null;
                                      
                                      return (
                                        <div key={key} className="border-b border-purple-100 pb-2 last:border-b-0">
                                          <div className="font-medium text-slate-800 capitalize text-xs mb-1">
                                            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, str => str.toUpperCase())}
                                          </div>
                                          <div className="text-slate-600 text-xs">
                                            {Array.isArray(value) ? (
                                              <div className="flex flex-wrap gap-1">
                                                {value.map((item, i) => (
                                                  <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                                                ))}
                                              </div>
                                            ) : typeof value === 'object' ? (
                                              <div className="space-y-1">
                                                {Object.entries(value).map(([subKey, subValue]) => 
                                                  subValue ? (
                                                    <div key={subKey} className="flex justify-between">
                                                      <span className="font-medium">{subKey}:</span>
                                                      <span>{String(subValue)}</span>
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
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                            
                            {/* Show embedded specialty assessments for visits */}
                            {record.type === 'visit' && record.hasSpecialtyAssessments && (
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" className="w-full justify-start p-2 h-8 mt-2 text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50">
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    View Attached Specialty Forms ({record.embeddedSpecialtyAssessments.length})
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2">
                                  <div className="space-y-2">
                                    {record.embeddedSpecialtyAssessments.map((assessment: any, idx: number) => (
                                      <div key={idx} className="bg-purple-50 border border-purple-200 rounded p-2">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">
                                            {assessment.formName}
                                          </Badge>
                                          <span className="text-xs text-purple-600">
                                            {formatSpecialtyRole(assessment.specialistRole)}
                                          </span>
                                        </div>
                                        <div className="space-y-1">
                                          {Object.entries(assessment.data || {}).slice(0, 4).map(([key, value]) => (
                                            <div key={key} className="text-xs">
                                              <span className="font-medium text-slate-700">
                                                {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:
                                              </span>
                                              <span className="text-slate-600 ml-1">
                                                {Array.isArray(value) ? value.join(', ') : String(value).substring(0, 80)}
                                                {typeof value === 'string' && value.length > 80 ? '...' : ''}
                                              </span>
                                            </div>
                                          ))}
                                          {Object.keys(assessment.data || {}).length > 4 && (
                                            <p className="text-xs text-purple-600 italic">
                                              +{Object.keys(assessment.data).length - 4} more fields
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                          </div>
                        </div>
                      </div>
                    );})}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}