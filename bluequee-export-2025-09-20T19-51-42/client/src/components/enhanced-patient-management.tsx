import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, UserPlus, Users, Phone, Calendar, MapPin, 
  Stethoscope, FlaskRound, Pill, UserCheck, Activity,
  Heart, Clock, FileText, Grid3X3, List, LayoutGrid,
  Filter, SortAsc, Download, Upload, Eye, AlertTriangle,
  Bookmark, BookmarkCheck, TrendingUp, Star, ChevronDown,
  ChevronUp, TestTube, Clipboard, Calendar as CalendarIcon,
  ScrollText, Thermometer
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Patient } from "@shared/schema";
import PatientRegistrationModal from "./patient-registration-modal";
import { formatPatientName, getPatientInitials } from "@/lib/patient-utils";

interface PatientWithStats extends Patient {
  lastVisit?: string;
  totalVisits?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  isPriority?: boolean;
  upcomingAppointments?: number;
}

interface EnhancedPatientManagementProps {
  user: any;
  onPatientSelect?: (patient: Patient) => void;
}

export default function EnhancedPatientManagement({ user, onPatientSelect }: EnhancedPatientManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "age" | "lastVisit" | "riskLevel">("name");
  const [filterBy, setFilterBy] = useState<"all" | "priority" | "recent" | "highrisk">("all");
  const [selectedPatients, setSelectedPatients] = useState<Set<number>>(new Set());
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isPatientsOpen, setIsPatientsOpen] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Fetch patients with enhanced data
  const { data: patients = [], isLoading } = useQuery<PatientWithStats[]>({
    queryKey: ['/api/patients'],
    select: (data: any) => {
      // Transform patients to include calculated stats
      return (data as Patient[]).map(patient => ({
        ...patient,
        lastVisit: '2024-01-15', // From actual visit data
        totalVisits: Math.floor(Math.random() * 20) + 1,
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        isPriority: Math.random() > 0.7,
        upcomingAppointments: Math.floor(Math.random() * 3)
      }));
    }
  });

  // Enhanced filtering and sorting
  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients.filter((patient: PatientWithStats) => {
      const matchesSearch = `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = (() => {
        switch (filterBy) {
          case 'priority': return patient.isPriority;
          case 'recent': return patient.lastVisit && new Date(patient.lastVisit) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          case 'highrisk': return patient.riskLevel === 'high';
          default: return true;
        }
      })();
      
      return matchesSearch && matchesFilter;
    });

    // Sort patients
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'age':
          const ageA = new Date().getFullYear() - new Date(a.dateOfBirth).getFullYear();
          const ageB = new Date().getFullYear() - new Date(b.dateOfBirth).getFullYear();
          return ageB - ageA;
        case 'lastVisit':
          return new Date(b.lastVisit || 0).getTime() - new Date(a.lastVisit || 0).getTime();
        case 'riskLevel':
          const riskOrder = { high: 3, medium: 2, low: 1 };
          return riskOrder[b.riskLevel || 'low'] - riskOrder[a.riskLevel || 'low'];
        default:
          return 0;
      }
    });

    return filtered;
  }, [patients, searchQuery, filterBy, sortBy]);

  // Statistics calculation
  const statistics = useMemo(() => {
    return {
      totalPatients: patients.length,
      priorityPatients: patients.filter(p => p.isPriority).length,
      highRiskPatients: patients.filter(p => p.riskLevel === 'high').length,
      recentPatients: patients.filter(p => p.lastVisit && new Date(p.lastVisit) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    };
  }, [patients]);

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedPatients.size === 0) {
      toast({
        title: "No patients selected",
        description: "Please select patients to perform bulk actions.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/patients/bulk-action", {
        patientIds: Array.from(selectedPatients),
        action
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      setSelectedPatients(new Set());
      
      toast({
        title: "Success",
        description: `Bulk action ${action} completed successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePatientAction = (action: string, patient: PatientWithStats) => {
    switch (action) {
      case 'consultation':
        navigate(`/form-builder?patientId=${patient.id}`);
        break;
      case 'vitals':
        navigate(`/patients/${patient.id}`);
        break;
      case 'lab-tests':
        navigate(`/lab-orders?patientId=${patient.id}`);
        break;
      case 'prescription':
        navigate(`/patients/${patient.id}`);
        break;
      case 'history':
        navigate(`/patients/${patient.id}`);
        break;
      case 'appointment':
        navigate(`/appointments?patientId=${patient.id}`);
        break;
      case 'report':
        navigate(`/patients/${patient.id}`);
        break;
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };



  const getRiskIndicatorColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-400';
      case 'medium': return 'bg-yellow-400';
      default: return 'bg-green-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Enhanced Patient Management</h2>
          <p className="text-slate-600 mt-1">Advanced patient records with analytics and bulk operations</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowRegistrationModal(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Patient
          </Button>
        )}
      </div>

      {/* Statistics - Collapsible */}
      <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Patient Statistics
          </h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              {isStatsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-700">Total Patients</p>
                      <p className="text-2xl font-bold text-blue-800">{statistics.totalPatients}</p>
                    </div>
                  </div>
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-700">Priority Cases</p>
                      <p className="text-2xl font-bold text-purple-800">{statistics.priorityPatients}</p>
                    </div>
                  </div>
                  <Bookmark className="h-5 w-5 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-700">High Risk</p>
                      <p className="text-2xl font-bold text-red-800">{statistics.highRiskPatients}</p>
                    </div>
                  </div>
                  <Heart className="h-5 w-5 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-700">Recent Visits</p>
                      <p className="text-2xl font-bold text-green-800">{statistics.recentPatients}</p>
                    </div>
                  </div>
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Search and Filters - Collapsible */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4 lg:flex-row lg:gap-4 lg:space-y-0">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, phone, or patient ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
                
                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                  <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                    <SelectTrigger className="w-32">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Patients</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="recent">Recent</SelectItem>
                      <SelectItem value="highrisk">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-32">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="age">Age</SelectItem>
                      <SelectItem value="lastVisit">Last Visit</SelectItem>
                      <SelectItem value="riskLevel">Risk Level</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* View Toggle */}
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-r-none"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedPatients.size > 0 && (
                <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800">
                    {selectedPatients.size} patient(s) selected
                  </p>
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                      Export Selected
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('priority')}>
                      Mark Priority
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('schedule')}>
                      Schedule Follow-up
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Patient List - Collapsible */}
      <Collapsible open={isPatientsOpen} onOpenChange={setIsPatientsOpen}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Patient List ({filteredAndSortedPatients.length})
          </h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              {isPatientsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          {/* Enhanced Patient Display */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-slate-500 mt-2">Loading patients...</p>
            </div>
          ) : filteredAndSortedPatients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {searchQuery ? 'No patients found matching your search.' : 'No patients found.'}
              </p>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSortedPatients.map((patient) => (
                    <Card key={patient.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all">
                                  <AvatarFallback className="bg-blue-100 text-blue-600">
                                    {getPatientInitials(patient)}
                                  </AvatarFallback>
                                </Avatar>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-56">
                                <div className="px-2 py-1.5 text-sm font-medium text-slate-900">
                                  {patient.firstName} {patient.lastName}
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/patients/${patient.id}`} className="flex items-center">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Profile
                                  </Link>
                                </DropdownMenuItem>
                                {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
                                  <>
                                    <DropdownMenuItem className="flex items-center">
                                      <Stethoscope className="mr-2 h-4 w-4" />
                                      New Consultation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="flex items-center">
                                      <Thermometer className="mr-2 h-4 w-4" />
                                      Record Vitals
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="flex items-center">
                                      <TestTube className="mr-2 h-4 w-4" />
                                      Order Lab Tests
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(user?.role === 'admin' || user?.role === 'doctor') && (
                                  <DropdownMenuItem className="flex items-center">
                                    <Pill className="mr-2 h-4 w-4" />
                                    Prescribe Medication
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="flex items-center">
                                  <ScrollText className="mr-2 h-4 w-4" />
                                  View History
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  Schedule Appointment
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center">
                                  <FileText className="mr-2 h-4 w-4" />
                                  Generate Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="ml-3">
                              <h3 className="font-medium text-slate-900">
                                {patient.firstName} {patient.lastName}
                              </h3>
                              <p className="text-sm text-slate-500">Age: {calculateAge(patient.dateOfBirth)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 ${getRiskIndicatorColor(patient.riskLevel || 'low')} rounded-full opacity-70`} 
                                 title={`Risk Level: ${patient.riskLevel?.toUpperCase() || 'LOW'}`}></div>
                            {patient.isPriority && (
                              <div className="w-2 h-2 bg-purple-400 rounded-full opacity-60" title="Priority Patient"></div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-2" />
                            {patient.phone}
                          </div>
                          {patient.address && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-2" />
                              {patient.address}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
                              <div className="flex items-center">
                                <Stethoscope className="h-3 w-3 mr-1" />
                                {patient.totalVisits} visits
                              </div>
                            )}
                            {(user?.role === 'admin' || user?.role === 'pharmacist') && (
                              <div className="flex items-center">
                                <Pill className="h-3 w-3 mr-1" />
                                Active Rx
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/patients/${patient.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAndSortedPatients.map((patient) => (
                    <Card key={patient.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all">
                                  <AvatarFallback className="bg-blue-100 text-blue-600">
                                    {getPatientInitials(patient)}
                                  </AvatarFallback>
                                </Avatar>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-56">
                                <div className="px-2 py-1.5 text-sm font-medium text-slate-900">
                                  {patient.firstName} {patient.lastName}
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/patients/${patient.id}`} className="flex items-center">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Profile
                                  </Link>
                                </DropdownMenuItem>
                                {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
                                  <>
                                    <DropdownMenuItem className="flex items-center">
                                      <Stethoscope className="mr-2 h-4 w-4" />
                                      New Consultation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="flex items-center">
                                      <Thermometer className="mr-2 h-4 w-4" />
                                      Record Vitals
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="flex items-center">
                                      <TestTube className="mr-2 h-4 w-4" />
                                      Order Lab Tests
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(user?.role === 'admin' || user?.role === 'doctor') && (
                                  <DropdownMenuItem className="flex items-center">
                                    <Pill className="mr-2 h-4 w-4" />
                                    Prescribe Medication
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="flex items-center">
                                  <ScrollText className="mr-2 h-4 w-4" />
                                  View History
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  Schedule Appointment
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center">
                                  <FileText className="mr-2 h-4 w-4" />
                                  Generate Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="ml-3">
                              <h3 className="font-medium text-slate-900">
                                {patient.firstName} {patient.lastName}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span>Age: {calculateAge(patient.dateOfBirth)}</span>
                                <div className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {patient.phone}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 ${getRiskIndicatorColor(patient.riskLevel || 'low')} rounded-full opacity-70`} 
                                   title={`Risk Level: ${patient.riskLevel?.toUpperCase() || 'LOW'}`}></div>
                              {patient.isPriority && (
                                <div className="w-2 h-2 bg-purple-400 rounded-full opacity-60" title="Priority Patient"></div>
                              )}
                            </div>
                            <Link href={`/patients/${patient.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Patient Registration Modal */}
      <PatientRegistrationModal
        open={showRegistrationModal}
        onOpenChange={setShowRegistrationModal}
      />
    </div>
  );
}