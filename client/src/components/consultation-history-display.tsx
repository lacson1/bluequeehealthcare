import React, { useState, useMemo } from 'react';
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
  Printer,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { printConsultation } from '@/services/print-utils';
import { useToast } from '@/hooks/use-toast';

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
  const [printingRecordId, setPrintingRecordId] = useState<number | null>(null);
  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const { toast } = useToast();
  
  // Function to print all consultation records
  const handlePrintAllRecords = async () => {
    if (filteredRecords.length === 0) {
      toast({
        title: "No records to print",
        description: "There are no consultation records available to print.",
        variant: "destructive"
      });
      return;
    }
    
    setIsPrintingAll(true);
    try {
      let patientToUse = patientData;
      if (!patientToUse && patientId) {
        const response = await fetch(`/api/patients/${patientId}`, { credentials: 'include' });
        if (response.ok) patientToUse = await response.json();
      }
      
      if (!patientToUse) {
        throw new Error('Patient information is not available.');
      }
      
      // Generate comprehensive report HTML
      const { openPrintWindowWithLetterhead } = await import('@/utils/organization-print');
      const reportContent = generateComprehensiveReportHTML(filteredRecords, patientToUse);
      
      await openPrintWindowWithLetterhead(
        reportContent,
        'Complete Medical History Report',
        {
          documentId: `HISTORY-${patientId}`,
          documentDate: new Date(),
          pageSize: 'A4',
          orientation: 'portrait',
          autoPrint: true
        }
      );
      
      toast({
        title: "Print Preview Opened",
        description: `Printing ${filteredRecords.length} consultation record(s).`,
        duration: 3000
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Print failed",
        description: error instanceof Error ? error.message : 'Failed to print records.'
      });
    } finally {
      setIsPrintingAll(false);
    }
  };
  
  // Generate comprehensive report HTML for all records
  const generateComprehensiveReportHTML = (records: any[], patient: any): string => {
    const formatValue = (value: any): string => {
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'object' && value !== null) {
        return Object.entries(value).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join('; ');
      }
      return String(value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    
    const formatFieldName = (key: string): string => {
      return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, str => str.toUpperCase()).trim();
    };
    
    const recordsHTML = records.map((record, index) => {
      const recordDate = new Date(record.date);
      const dateStr = recordDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      const timeStr = recordDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      const chiefComplaint = record.complaint || record.formData?.chiefComplaint || record.formData?.chief_complaint;
      const diagnosis = record.diagnosis || record.formData?.diagnosis || record.formData?.primary_diagnosis;
      const treatment = record.treatment || record.formData?.treatment || record.formData?.treatment_plan;
      
      let formDataRows = '';
      if (record.formData && typeof record.formData === 'object') {
        formDataRows = Object.entries(record.formData)
          .filter(([_, value]) => value !== null && value !== undefined && value !== '')
          .map(([key, value]) => `
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase; width: 35%; vertical-align: top;">${formatFieldName(key)}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 12px;">${formatValue(value)}</td>
            </tr>
          `).join('');
      }
      
      return `
        <div style="margin-bottom: 25px; page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <!-- Record Header -->
          <div style="background: ${record.type === 'consultation' ? 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)'}; color: white; padding: 12px 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 700; font-size: 14px;">${record.title || 'Medical Record'}</div>
                <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">${dateStr} at ${timeStr}</div>
              </div>
              <div style="text-align: right;">
                <span style="background: rgba(255,255,255,0.25); padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                  ${record.type === 'consultation' ? 'Specialty' : 'Visit'} #${index + 1}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Provider Info -->
          <div style="background: #f8fafc; padding: 10px 18px; border-bottom: 1px solid #e2e8f0;">
            <span style="font-size: 12px; color: #64748b;">Seen by: </span>
            <span style="font-size: 12px; font-weight: 600; color: #1e293b;">${record.conductedBy}</span>
            ${record.specialistRole ? `<span style="font-size: 11px; color: #8b5cf6; margin-left: 8px;">(${record.specialistRole.replace(/_/g, ' ')})</span>` : ''}
          </div>
          
          <!-- Clinical Data -->
          <div style="padding: 15px 18px; background: white;">
            ${chiefComplaint ? `
              <div style="margin-bottom: 12px; padding: 12px; background: #fef9c3; border-left: 4px solid #eab308; border-radius: 4px;">
                <div style="font-weight: 700; color: #854d0e; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Chief Complaint</div>
                <div style="color: #713f12; font-size: 12px;">${formatValue(chiefComplaint)}</div>
              </div>
            ` : ''}
            
            ${diagnosis ? `
              <div style="margin-bottom: 12px; padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <div style="font-weight: 700; color: #92400e; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Diagnosis</div>
                <div style="color: #78350f; font-size: 12px;">${formatValue(diagnosis)}</div>
              </div>
            ` : ''}
            
            ${treatment ? `
              <div style="margin-bottom: 12px; padding: 12px; background: #d1fae5; border-left: 4px solid #10b981; border-radius: 4px;">
                <div style="font-weight: 700; color: #065f46; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Treatment Plan</div>
                <div style="color: #064e3b; font-size: 12px;">${formatValue(treatment)}</div>
              </div>
            ` : ''}
            
            ${formDataRows ? `
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tbody>${formDataRows}</tbody>
              </table>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <style>
        @media print {
          .record-card { page-break-inside: avoid; }
        }
      </style>
      
      <!-- Patient Summary Header -->
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700;">Medical History Summary</h2>
            <div style="font-size: 13px; opacity: 0.9;">
              <strong>Patient:</strong> ${patient.title || ''} ${patient.firstName} ${patient.lastName}<br>
              <strong>DOB:</strong> ${patient.dateOfBirth || 'N/A'} &nbsp;|&nbsp; <strong>Gender:</strong> ${patient.gender || 'N/A'} &nbsp;|&nbsp; <strong>Phone:</strong> ${patient.phone || 'N/A'}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="background: rgba(255,255,255,0.2); padding: 8px 15px; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: 700;">${records.length}</div>
              <div style="font-size: 11px; opacity: 0.9; text-transform: uppercase;">Total Records</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Statistics Bar -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; text-align: center;">
          <div style="font-size: 22px; font-weight: 700; color: #16a34a;">${records.filter(r => r.type === 'visit').length}</div>
          <div style="font-size: 11px; color: #15803d; text-transform: uppercase; font-weight: 600;">Visits</div>
        </div>
        <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 15px; text-align: center;">
          <div style="font-size: 22px; font-weight: 700; color: #9333ea;">${records.filter(r => r.type === 'consultation').length}</div>
          <div style="font-size: 11px; color: #7e22ce; text-transform: uppercase; font-weight: 600;">Specialty</div>
        </div>
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; text-align: center;">
          <div style="font-size: 12px; font-weight: 700; color: #0284c7;">
            ${records.length > 0 ? new Date(records[records.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
          </div>
          <div style="font-size: 11px; color: #0369a1; text-transform: uppercase; font-weight: 600;">First Record</div>
        </div>
      </div>
      
      <!-- Chronological Records -->
      <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px;">
        Chronological Medical Records
      </h3>
      
      ${recordsHTML}
      
      <!-- Footer -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center;">
        <p style="font-size: 11px; color: #64748b;">
          This report contains ${records.length} medical record(s) generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.
        </p>
        <p style="font-size: 10px; color: #94a3b8; margin-top: 5px;">
          This document is confidential and intended solely for the healthcare provider and patient.
        </p>
      </div>
    `;
  };
  
  // Fetch patient data if not provided
  const { data: fetchedPatient, isLoading: patientLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId && !patient,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Use provided patient or fetched patient
  const patientData = patient || fetchedPatient;
  
  // Fetch consultation records and visits
  const { data: consultationRecords = [], isLoading: historyLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/consultation-records`],
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!patientId,
  });

  const { data: visits = [], isLoading: visitsLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/visits`],
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!patientId,
  });

  // Combine consultation records and visits into unified timeline
  const combinedRecords = useMemo(() => {
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
    <div className="w-full">
      {/* Professional Collapsible Header */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Card className={`cursor-pointer transition-all duration-300 border-2 ${
            isOpen 
              ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-md' 
              : 'border-slate-200 bg-white hover:border-purple-200 hover:shadow-sm'
          }`}>
            <CardHeader className="py-4 px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2.5 rounded-xl transition-colors ${
                    isOpen 
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                      : 'bg-gradient-to-br from-slate-600 to-slate-700'
                  }`}>
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Medical History</h3>
                    <p className="text-sm text-slate-500">
                      {combinedRecords.length === 0 
                        ? 'No records yet' 
                        : `${combinedRecords.length} total record${combinedRecords.length !== 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {combinedRecords.length > 0 && (
                    <div className="hidden sm:flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 font-medium">
                        {Array.isArray(visits) ? visits.length : 0} visits
                      </Badge>
                      <Badge className="bg-purple-100 text-purple-700 border-0 font-medium">
                        {Array.isArray(consultationRecords) ? consultationRecords.length : 0} specialty
                      </Badge>
                    </div>
                  )}
                  <div className={`p-1.5 rounded-full transition-all duration-300 ${
                    isOpen ? 'bg-purple-100 rotate-180' : 'bg-slate-100'
                  }`}>
                    <ChevronDown className={`h-4 w-4 transition-colors ${
                      isOpen ? 'text-purple-600' : 'text-slate-500'
                    }`} />
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 animate-in slide-in-from-top-2 duration-300">
          <Card className="border-2 border-purple-100 bg-white shadow-lg overflow-hidden">
            <CardHeader className="pb-4 px-5 pt-5 bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-slate-900">Medical Timeline</h4>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {patient?.firstName} {patient?.lastName}'s consultation history
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {filteredRecords.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrintAllRecords}
                        disabled={isPrintingAll}
                        className="h-8 text-xs font-medium text-purple-700 border-purple-200 bg-white hover:bg-purple-50 hover:border-purple-300"
                      >
                        {isPrintingAll ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Printer className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Print Report
                      </Button>
                      <Badge variant="outline" className="bg-white border-purple-200 text-purple-700">
                        {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              
              {/* Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-slate-200">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 border-slate-200 focus:border-purple-300 focus:ring-purple-200"
                  />
                </div>
                
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-9 border-slate-200 focus:border-purple-300 focus:ring-purple-200">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {uniqueRoles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="h-9 border-slate-200 focus:border-purple-300 focus:ring-purple-200">
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
                <div className="flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-200 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-purple-800 font-medium text-sm">
                      Showing {filteredRecords.length} of {combinedRecords.length} records
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedRole("all");
                      setDateRange("all");
                    }}
                    className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 h-7 px-3"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
              
              {/* View Mode Tabs */}
              <div className="flex gap-2 mt-4 p-1 bg-slate-100 rounded-xl">
                <Button
                  variant={viewMode === "timeline" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("timeline")}
                  className={`flex-1 h-8 text-sm font-medium transition-all ${
                    viewMode === "timeline" 
                      ? "bg-white shadow-sm" 
                      : "hover:bg-white/50"
                  }`}
                >
                  All Records
                </Button>
                <Button
                  variant={viewMode === "visits" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("visits")}
                  className={`flex-1 h-8 text-sm font-medium transition-all ${
                    viewMode === "visits" 
                      ? "bg-white shadow-sm" 
                      : "hover:bg-white/50"
                  }`}
                >
                  Visits ({regularVisits.length})
                </Button>
                <Button
                  variant={viewMode === "specialty" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("specialty")}
                  className={`flex-1 h-8 text-sm font-medium transition-all ${
                    viewMode === "specialty" 
                      ? "bg-white shadow-sm" 
                      : "hover:bg-white/50"
                  }`}
                >
                  Specialty ({specialtyConsultations.length})
                </Button>
              </div>
            </CardHeader>

            <CardContent className="px-5 pb-5">
              {/* Professional Timeline Display */}
              <div className="max-h-[500px] overflow-y-auto scroll-smooth pr-2 -mr-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full border-4 border-purple-100"></div>
                      <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-t-purple-500 animate-spin"></div>
                    </div>
                    <p className="text-slate-500 text-sm mt-4">Loading medical history...</p>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="relative inline-block mb-4">
                      <div className="h-20 w-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto">
                        <FileText className="h-10 w-10 text-slate-400" />
                      </div>
                      {combinedRecords.length === 0 && (
                        <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-emerald-500 rounded-full flex items-center justify-center ring-4 ring-white">
                          <span className="text-white text-xs font-bold">+</span>
                        </div>
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {combinedRecords.length === 0 ? 'No Medical Records Yet' : 'No Matching Records'}
                    </h4>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                      {combinedRecords.length === 0 
                        ? 'Start building this patient\'s medical history by creating a consultation above.'
                        : 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                      }
                    </p>
                    {combinedRecords.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedRole("all");
                          setDateRange("all");
                        }}
                        className="mt-4 border-purple-200 text-purple-600 hover:bg-purple-50"
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRecords.map((record: any, index: number) => {
                      const SpecialtyIcon = record.type === 'consultation' 
                        ? getSpecialtyIcon(record.specialistRole || record.role)
                        : Stethoscope;
                      
                      // Calculate days ago
                      const recordDate = new Date(record.date);
                      const now = new Date();
                      const diffTime = Math.abs(now.getTime() - recordDate.getTime());
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      const isToday = recordDate.toDateString() === now.toDateString();
                      const isYesterday = diffDays === 1;
                      const timeAgo = isToday ? 'Today' : isYesterday ? 'Yesterday' : diffDays < 7 ? `${diffDays} days ago` : diffDays < 30 ? `${Math.floor(diffDays / 7)} weeks ago` : `${Math.floor(diffDays / 30)} months ago`;

                      // Extract key clinical data
                      const chiefComplaint = record.complaint || record.formData?.chiefComplaint || record.formData?.chief_complaint || record.formData?.presenting_complaint;
                      const diagnosis = record.diagnosis || record.formData?.diagnosis || record.formData?.primary_diagnosis;
                      const treatment = record.treatment || record.formData?.treatment || record.formData?.treatment_plan;
                      
                      return (
                      <div 
                        key={record.uniqueKey || record.id} 
                        className={`group rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                          record.type === 'consultation'
                            ? 'bg-gradient-to-r from-purple-50 to-indigo-50/50 border-purple-200 hover:border-purple-300'
                            : 'bg-gradient-to-r from-emerald-50 to-teal-50/50 border-emerald-200 hover:border-emerald-300'
                        }`}
                      >
                        {/* Header Row */}
                        <div className="px-4 py-3 border-b border-slate-200/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Icon */}
                              <div className={`p-2 rounded-lg shadow-sm ${
                                record.type === 'consultation' 
                                  ? 'bg-purple-600' 
                                  : 'bg-emerald-600'
                              }`}>
                                {record.type === 'consultation' ? (
                                  <SpecialtyIcon className="w-4 h-4 text-white" />
                                ) : (
                                  <Stethoscope className="w-4 h-4 text-white" />
                                )}
                              </div>
                              
                              {/* Title & Meta */}
                              <div>
                                <h5 className="font-semibold text-slate-900">{record.title}</h5>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                                  <span className="font-medium text-slate-700">{timeAgo}</span>
                                  <span>•</span>
                                  <span>{recordDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  <span>•</span>
                                  <span>{recordDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Badges & Actions */}
                            <div className="flex items-center gap-2">
                              {record.type === 'consultation' && record.specialistRole && (
                                <Badge className="bg-purple-100 text-purple-800 border-0 font-medium text-xs">
                                  {formatSpecialtyRole(record.specialistRole)}
                                </Badge>
                              )}
                              <Badge 
                                className={`border-0 font-medium text-xs ${
                                  record.type === 'consultation' 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-emerald-600 text-white'
                                }`}
                              >
                                {record.type === 'consultation' ? 'Specialty' : 'Visit'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setPrintingRecordId(record.id);
                                  try {
                                    let patientToUse = patientData;
                                    if (!patientToUse && patientId) {
                                      const response = await fetch(`/api/patients/${patientId}`, { credentials: 'include' });
                                      if (response.ok) patientToUse = await response.json();
                                    }
                                    if (!patientToUse) throw new Error('Patient information is not available.');
                                    const consultationData = {
                                      id: record.id,
                                      formName: record.title || record.formName || 'Consultation Record',
                                      formData: record.formData || { chiefComplaint: record.complaint, diagnosis: record.diagnosis, treatment: record.treatment },
                                      specialistRole: record.specialistRole || record.role,
                                      createdAt: record.date || record.createdAt || new Date().toISOString()
                                    };
                                    await printConsultation(consultationData, patientToUse);
                                    toast({ title: "Print Preview Opened", description: "Check your new window.", duration: 3000 });
                                  } catch (error) {
                                    toast({ variant: "destructive", title: "Print failed", description: error instanceof Error ? error.message : 'Failed to print.' });
                                  } finally {
                                    setPrintingRecordId(null);
                                  }
                                }}
                                disabled={printingRecordId === record.id}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-purple-600 hover:bg-purple-100"
                              >
                                {printingRecordId === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Provider Info */}
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            <User className="h-3 w-3" />
                            <span>Seen by <span className="font-medium text-slate-700">{record.conductedBy}</span></span>
                          </div>
                        </div>
                        
                        {/* Clinical Summary - Professional Medical Layout */}
                        <div className="px-4 py-3">
                          {/* SOAP Format Clinical Data Grid */}
                          <div className="space-y-3">
                            {/* Subjective Section - Chief Complaint */}
                            {chiefComplaint && (
                              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 border-b border-amber-100">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">S</span>
                                    </div>
                                    <span className="text-sm font-semibold text-amber-800 uppercase tracking-wide">Subjective • Chief Complaint</span>
                                  </div>
                                </div>
                                <div className="px-4 py-3">
                                  <p className="text-sm text-slate-700 leading-relaxed">
                                    {String(chiefComplaint)}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* Assessment Section - Diagnosis */}
                            {diagnosis && (
                              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 border-b border-blue-100">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">A</span>
                                    </div>
                                    <span className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Assessment • Diagnosis</span>
                                  </div>
                                </div>
                                <div className="px-4 py-3">
                                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {String(diagnosis)}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* Plan Section - Treatment */}
                            {treatment && (
                              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 border-b border-emerald-100">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">P</span>
                                    </div>
                                    <span className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">Plan • Treatment</span>
                                  </div>
                                </div>
                                <div className="px-4 py-3">
                                  <p className="text-sm text-slate-700 leading-relaxed">
                                    {String(treatment)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Specialty Form Data Preview - Professional Table Layout */}
                          {record.type === 'consultation' && record.formData && !chiefComplaint && !diagnosis && (
                            <div className="mt-3 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-2 border-b border-slate-200">
                                <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Clinical Assessment Data</span>
                              </div>
                              <div className="divide-y divide-slate-100">
                                {Object.entries(record.formData).slice(0, 8).map(([key, value]) => {
                                  if (!value || (typeof value === 'object' && !Object.values(value).some(v => v))) return null;
                                  const displayValue = typeof value === 'object' 
                                    ? Array.isArray(value) ? value.join(', ') : Object.values(value).filter(v => v).join(', ')
                                    : String(value);
                                  const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, str => str.toUpperCase()).trim();
                                  return (
                                    <div key={key} className="flex px-4 py-2.5 hover:bg-slate-50 transition-colors">
                                      <span className="w-40 flex-shrink-0 text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        {fieldName}
                                      </span>
                                      <span className="text-sm text-slate-800 flex-1">
                                        {displayValue}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                            
                          {/* Expandable Full Details - Professional Medical Record Layout */}
                          {(record.type === 'consultation' && record.formData) && (
                            <Collapsible className="mt-3">
                              <CollapsibleTrigger asChild>
                                <Button variant="outline" className="w-full justify-center h-9 text-sm text-purple-700 border-purple-200 bg-white hover:bg-purple-50 hover:border-purple-300 font-medium">
                                  <ChevronDown className="h-4 w-4 mr-2 transition-transform group-data-[state=open]:rotate-180" />
                                  View Complete Assessment Details
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-3 animate-in slide-in-from-top-2 duration-200">
                                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden print:shadow-none">
                                  {/* Professional Header */}
                                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-semibold text-sm uppercase tracking-wide">Complete Clinical Assessment</h4>
                                      <span className="text-xs opacity-90">
                                        {Object.entries(record.formData || {}).filter(([_, v]) => v).length} documented fields
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Data Table Layout */}
                                  <div className="divide-y divide-slate-100">
                                    {Object.entries(record.formData || {}).map(([key, value]) => {
                                      if (!value || (typeof value === 'object' && !Array.isArray(value) && !Object.values(value).some(v => v))) return null;
                                      
                                      const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, str => str.toUpperCase()).trim();
                                      
                                      return (
                                        <div key={key} className="flex flex-col sm:flex-row px-4 py-3 hover:bg-slate-50 transition-colors">
                                          <div className="sm:w-48 flex-shrink-0 mb-1 sm:mb-0">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                              {fieldName}
                                            </span>
                                          </div>
                                          <div className="flex-1 text-sm text-slate-800">
                                            {Array.isArray(value) ? (
                                              <div className="flex flex-wrap gap-1.5">
                                                {value.map((item, i) => (
                                                  <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    {item}
                                                  </span>
                                                ))}
                                              </div>
                                            ) : typeof value === 'object' ? (
                                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs bg-slate-50 rounded-lg p-2">
                                                {Object.entries(value).map(([subKey, subValue]) => 
                                                  subValue ? (
                                                    <div key={subKey} className="flex items-center gap-2">
                                                      <span className="text-slate-500 capitalize">{subKey.replace(/_/g, ' ')}:</span>
                                                      <span className="font-medium text-slate-800">{String(subValue)}</span>
                                                    </div>
                                                  ) : null
                                                )}
                                              </div>
                                            ) : (
                                              <div className="whitespace-pre-wrap leading-relaxed">{String(value)}</div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  {/* Footer with timestamp */}
                                  <div className="bg-slate-50 px-4 py-2 border-t border-slate-200">
                                    <p className="text-xs text-slate-500 text-center">
                                      Documented on {recordDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {recordDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                          
                          {/* Show embedded specialty assessments for visits */}
                          {record.type === 'visit' && record.hasSpecialtyAssessments && (
                            <div className="mt-3 bg-purple-50/50 rounded-lg p-3 border border-purple-200">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                                  Attached Specialty Forms ({record.embeddedSpecialtyAssessments.length})
                                </span>
                              </div>
                              <div className="space-y-2">
                                {record.embeddedSpecialtyAssessments.map((assessment: any, idx: number) => (
                                  <Collapsible key={idx}>
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" className="w-full justify-start h-auto py-2 px-3 text-left bg-white border border-purple-100 rounded-lg hover:bg-purple-50">
                                        <div className="flex items-center gap-2">
                                          <Badge className="bg-purple-600 text-white border-0 text-xs">{assessment.formName}</Badge>
                                          <span className="text-xs text-slate-500">{formatSpecialtyRole(assessment.specialistRole)}</span>
                                          <ChevronDown className="h-3 w-3 ml-auto text-purple-500" />
                                        </div>
                                      </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2 ml-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(assessment.data || {}).map(([key, value]) => (
                                          <div key={key} className="bg-white rounded px-2 py-1.5 border border-purple-100">
                                            <span className="text-xs text-slate-500 block">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
                                            <span className="text-xs font-medium text-slate-800">
                                              {Array.isArray(value) ? value.join(', ') : String(value).substring(0, 60)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                ))}
                              </div>
                            </div>
                          )}
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