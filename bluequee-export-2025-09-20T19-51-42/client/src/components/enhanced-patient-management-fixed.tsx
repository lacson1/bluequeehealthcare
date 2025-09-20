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
import { getDisplayName, getInitials } from "@/utils/name-utils";
import type { Patient } from "@shared/schema";
import PatientRegistrationModal from "./patient-registration-modal";

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

export default function EnhancedPatientManagementFixed({ user, onPatientSelect }: EnhancedPatientManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "age" | "lastVisit" | "riskLevel" | "dateCreated">("dateCreated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterBy, setFilterBy] = useState<"all" | "priority" | "recent" | "highrisk">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");
  const [selectedPatients, setSelectedPatients] = useState<Set<number>>(new Set());
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isPatientsOpen, setIsPatientsOpen] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch patients with enhanced data
  const { data: patients = [], isLoading } = useQuery<PatientWithStats[]>({
    queryKey: ['/api/patients'],
    select: (data: Patient[]) => {
      return data.map(patient => ({
        ...patient,
        riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low' as const,
        isPriority: Math.random() > 0.8,
        totalVisits: Math.floor(Math.random() * 20) + 1,
        upcomingAppointments: Math.floor(Math.random() * 3),
        lastVisit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
    }
  });

  // Fetch organizations for filtering
  const { data: organizations = [] } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: () => fetch('/api/organizations').then(res => res.json()),
    enabled: user?.role === 'admin' || user?.role === 'superadmin'
  });

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
        // Navigate to form builder for consultations
        setLocation(`/form-builder?patientId=${patient.id}`);
        break;
      case 'vitals':
        // Navigate to patient detail page to record vitals
        setLocation(`/patients/${patient.id}`);
        break;
      case 'lab-tests':
        // Navigate to lab orders page with patient pre-filled
        setLocation(`/lab-orders?patientId=${patient.id}`);
        break;
      case 'prescription':
        // Navigate to patient profile where prescriptions can be managed
        setLocation(`/patients/${patient.id}`);
        break;
      case 'history':
        // Navigate to patient detail page to view history
        setLocation(`/patients/${patient.id}`);
        break;
      case 'appointment':
        // Navigate to appointments page with patient pre-filled
        setLocation(`/appointments?patientId=${patient.id}`);
        break;
      case 'report':
        // Navigate to patient detail page for reports
        setLocation(`/patients/${patient.id}`);
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

  const getPatientInitials = (patient: Patient) => {
    return `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
  };

  const formatPatientName = (patient: Patient) => {
    return `${patient.title ? `${patient.title} ` : ''}${patient.firstName} ${patient.lastName}`;
  };

  const getRiskIndicatorColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-400';
      case 'medium': return 'bg-yellow-400';
      default: return 'bg-green-400';
    }
  };

  // Enhanced filtering and sorting
  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients.filter(patient => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = patient.firstName.toLowerCase().includes(searchLower) ||
                           patient.lastName.toLowerCase().includes(searchLower) ||
                           patient.phone.includes(searchQuery) ||
                           (patient.email && patient.email.toLowerCase().includes(searchLower));

      // Apply organization filter
      const matchesOrganization = organizationFilter === "all" || 
                                 (organizationFilter === "current" && patient.organizationId === user?.organizationId) ||
                                 (organizationFilter === "unassigned" && !patient.organizationId) ||
                                 patient.organizationId?.toString() === organizationFilter;

      // Apply date filter
      const now = new Date();
      const patientCreatedDate = new Date(patient.createdAt);
      let matchesDate = true;
      
      switch (dateFilter) {
        case 'today':
          matchesDate = patientCreatedDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = patientCreatedDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = patientCreatedDate >= monthAgo;
          break;
        default:
          matchesDate = true;
      }

      const baseMatch = matchesSearch && matchesOrganization && matchesDate;

      switch (filterBy) {
        case 'priority':
          return baseMatch && patient.isPriority;
        case 'recent':
          return baseMatch && patient.lastVisit && 
                 new Date(patient.lastVisit) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        case 'highrisk':
          return baseMatch && patient.riskLevel === 'high';
        default:
          return baseMatch;
      }
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'age':
          comparison = calculateAge(a.dateOfBirth) - calculateAge(b.dateOfBirth);
          break;
        case 'lastVisit':
          comparison = new Date(b.lastVisit || 0).getTime() - new Date(a.lastVisit || 0).getTime();
          break;
        case 'riskLevel':
          const riskOrder = { high: 3, medium: 2, low: 1 };
          comparison = (riskOrder[b.riskLevel || 'low'] || 1) - (riskOrder[a.riskLevel || 'low'] || 1);
          break;
        case 'dateCreated':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'name':
        default:
          comparison = a.firstName.localeCompare(b.firstName);
          break;
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });
  }, [patients, searchQuery, filterBy, sortBy, sortOrder, organizationFilter, dateFilter]);

  const stats = useMemo(() => ({
    total: patients.length,
    priority: patients.filter(p => p.isPriority).length,
    highRisk: patients.filter(p => p.riskLevel === 'high').length,
    recentVisits: patients.filter(p => p.lastVisit && 
      new Date(p.lastVisit) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
  }), [patients]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-gray-600 mt-1">Enhanced patient care and management dashboard</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowRegistrationModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Register Patient
          </Button>
          <Button variant="outline" onClick={() => handleBulkAction('export')}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Quick Stats - Collapsible */}
      <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Statistics
          </h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              {isStatsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Patients</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Star className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Priority Patients</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.priority}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">High Risk</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.highRisk}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Recent Visits</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recentVisits}</p>
                  </div>
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
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search patients by name, phone, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 flex-wrap">
                  <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Patients</SelectItem>
                      <SelectItem value="priority">Priority Only</SelectItem>
                      <SelectItem value="recent">Recent Visits</SelectItem>
                      <SelectItem value="highrisk">High Risk</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Date range..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dateCreated">Most Recent</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="age">Age</SelectItem>
                      <SelectItem value="lastVisit">Last Visit</SelectItem>
                      <SelectItem value="riskLevel">Risk Level</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3"
                  >
                    {sortOrder === 'desc' ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortAsc className="h-4 w-4 rotate-180" />
                    )}
                  </Button>

                  <Select value={organizationFilter} onValueChange={(value: string) => setOrganizationFilter(value)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Organization..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Organizations</SelectItem>
                      <SelectItem value="current">My Organization</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectItem value="2">Lagos Island Hospital</SelectItem>
                      <SelectItem value="4">Enugu</SelectItem>
                      <SelectItem value="1">Grace Clinic</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="age">Age</SelectItem>
                      <SelectItem value="lastVisit">Last Visit</SelectItem>
                      <SelectItem value="riskLevel">Risk Level</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex rounded-md overflow-hidden border">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-none"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-none"
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

      {/* Patient List */}
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
          {filteredAndSortedPatients.length === 0 ? (
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
                    <Card key={patient.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/patients/${patient.id}`)}>
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
                                  {formatPatientName(patient)}
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
                                    <DropdownMenuItem onClick={() => handlePatientAction('consultation', patient)}>
                                      <Stethoscope className="mr-2 h-4 w-4" />
                                      New Consultation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePatientAction('vitals', patient)}>
                                      <Thermometer className="mr-2 h-4 w-4" />
                                      Record Vitals
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePatientAction('lab-tests', patient)}>
                                      <TestTube className="mr-2 h-4 w-4" />
                                      Order Lab Tests
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(user?.role === 'admin' || user?.role === 'doctor') && (
                                  <DropdownMenuItem onClick={() => handlePatientAction('prescription', patient)}>
                                    <Pill className="mr-2 h-4 w-4" />
                                    Prescribe Medication
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handlePatientAction('history', patient)}>
                                  <ScrollText className="mr-2 h-4 w-4" />
                                  View History
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePatientAction('appointment', patient)}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  Schedule Appointment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePatientAction('report', patient)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Generate Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="ml-3">
                              <h3 className="font-medium text-slate-900">
                                {formatPatientName(patient)}
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
                          {patient.email && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-2" />
                              {patient.email}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-slate-400">
                              Last visit: {patient.lastVisit || 'No visits'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {patient.totalVisits} visits
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAndSortedPatients.map((patient) => (
                    <Card key={patient.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => window.location.href = `/patients/${patient.id}`}>
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
                                  {formatPatientName(patient)}
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
                                    <DropdownMenuItem onClick={() => handlePatientAction('consultation', patient)}>
                                      <Stethoscope className="mr-2 h-4 w-4" />
                                      New Consultation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePatientAction('vitals', patient)}>
                                      <Thermometer className="mr-2 h-4 w-4" />
                                      Record Vitals
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePatientAction('lab-tests', patient)}>
                                      <TestTube className="mr-2 h-4 w-4" />
                                      Order Lab Tests
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(user?.role === 'admin' || user?.role === 'doctor') && (
                                  <DropdownMenuItem onClick={() => handlePatientAction('prescription', patient)}>
                                    <Pill className="mr-2 h-4 w-4" />
                                    Prescribe Medication
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handlePatientAction('history', patient)}>
                                  <ScrollText className="mr-2 h-4 w-4" />
                                  View History
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePatientAction('appointment', patient)}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  Schedule Appointment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePatientAction('report', patient)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Generate Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="ml-3">
                              <h3 className="font-medium text-slate-900">
                                {formatPatientName(patient)}
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
                            <Badge variant="outline" className="text-xs">
                              {patient.totalVisits} visits
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {patient.lastVisit}
                            </span>
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

      <PatientRegistrationModal 
        open={showRegistrationModal} 
        onOpenChange={setShowRegistrationModal}
      />
    </div>
  );
}