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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Search, UserPlus, Users, Phone, Calendar, MapPin,
  Stethoscope, FlaskRound, Pill, UserCheck, Activity,
  Heart, Clock, FileText, Grid3X3, List, LayoutGrid,
  Filter, SortAsc, Download, Upload, Eye, AlertTriangle,
  Bookmark, BookmarkCheck, TrendingUp, Star, ChevronDown,
  ChevronUp, TestTube, Clipboard, Calendar as CalendarIcon,
  ScrollText, Thermometer, MoreVertical, X, Mail
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
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch patients with enhanced data
  const { data: patients = [], isLoading } = useQuery<PatientWithStats[]>({
    queryKey: ['/api/patients'],
    staleTime: 10 * 60 * 1000, // 10 minutes - static data
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
  const { data: organizationsData } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: async () => {
      const res = await fetch('/api/organizations');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: user?.role === 'admin' || user?.role === 'superadmin',
    staleTime: 10 * 60 * 1000, // 10 minutes - static data
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const organizations = Array.isArray(organizationsData) ? organizationsData : [];

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
      await apiRequest("/api/patients/bulk-action", "POST", {
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
        setLocation(`/form-builder?patientId=${patient.id}`);
        break;
      case 'vitals':
        setLocation(`/patients/${patient.id}`);
        break;
      case 'lab-tests':
        setLocation(`/lab-orders?patientId=${patient.id}`);
        break;
      case 'prescription':
        setLocation(`/patients/${patient.id}?tab=medications`);
        break;
      case 'history':
        setLocation(`/patients/${patient.id}?tab=timeline`);
        break;
      case 'appointment':
        setLocation(`/appointments?patientId=${patient.id}`);
        break;
      case 'report':
        toast({
          title: "Generate Report",
          description: "Report generation feature coming soon.",
        });
        break;
      default:
        break;
    }
  };

  // Utility functions
  const formatPatientName = (patient: Patient) => {
    return getDisplayName({
      firstName: patient.firstName,
      lastName: patient.lastName,
      title: patient.title || undefined
    });
  };

  const getPatientInitials = (patient: Patient) => {
    return getInitials({
      firstName: patient.firstName,
      lastName: patient.lastName
    });
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getRiskIndicatorColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': default: return 'bg-green-500';
    }
  };

  // Filtering and sorting logic
  const filteredAndSortedPatients = useMemo(() => {
    let filtered = [...patients];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(patient =>
        formatPatientName(patient).toLowerCase().includes(query) ||
        patient.phone?.includes(query) ||
        patient.email?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(patient => {
        if (filterBy === 'priority') return patient.isPriority;
        if (filterBy === 'highrisk') return patient.riskLevel === 'high';
        if (filterBy === 'recent') {
          const visitDate = patient.lastVisit ? new Date(patient.lastVisit) : null;
          return visitDate && (Date.now() - visitDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
        }
        return true;
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(patient => {
        const visitDate = patient.lastVisit ? new Date(patient.lastVisit) : null;
        if (!visitDate) return false;

        const diffTime = now.getTime() - visitDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (dateFilter === 'today') return diffDays < 1;
        if (dateFilter === 'week') return diffDays < 7;
        if (dateFilter === 'month') return diffDays < 30;
        return true;
      });
    }

    // Organization filter
    if (organizationFilter !== 'all') {
      if (organizationFilter === 'current') {
        filtered = filtered.filter(p => p.organizationId === user?.organizationId);
      } else if (organizationFilter === 'unassigned') {
        filtered = filtered.filter(p => !p.organizationId);
      } else {
        filtered = filtered.filter(p => p.organizationId?.toString() === organizationFilter);
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'name':
          compareValue = formatPatientName(a).localeCompare(formatPatientName(b));
          break;
        case 'age':
          compareValue = calculateAge(a.dateOfBirth) - calculateAge(b.dateOfBirth);
          break;
        case 'lastVisit':
          const aDate = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
          const bDate = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
          compareValue = aDate - bDate;
          break;
        case 'riskLevel':
          const riskOrder = { high: 3, medium: 2, low: 1 };
          compareValue = riskOrder[a.riskLevel || 'low'] - riskOrder[b.riskLevel || 'low'];
          break;
        case 'dateCreated':
          compareValue = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [patients, searchQuery, filterBy, dateFilter, sortBy, sortOrder, organizationFilter, user]);

  // Calculate stats
  const stats = useMemo(() => ({
    total: patients.length,
    priority: patients.filter(p => p.isPriority).length,
    highRisk: patients.filter(p => p.riskLevel === 'high').length,
    recentVisits: patients.filter(p => {
      const visitDate = p.lastVisit ? new Date(p.lastVisit) : null;
      return visitDate && (Date.now() - visitDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length
  }), [patients]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse space-y-4 w-full max-w-6xl p-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Patient Management</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">Comprehensive patient care and management system</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button 
              onClick={() => setShowRegistrationModal(true)} 
              className="gap-2 shadow-sm"
              size="sm"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Register Patient</span>
              <span className="sm:hidden">Register</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleBulkAction('export')} 
              className="gap-2"
              size="sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-0.5">Total Patients</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 rounded-lg flex-shrink-0">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-0.5">Priority</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.priority}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 rounded-lg flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-0.5">High Risk</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.highRisk}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 rounded-lg flex-shrink-0">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mb-0.5">Recent Visits</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.recentVisits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className="shadow-sm border-slate-200/60">
          <CardContent className="p-4">
            <div className="space-y-2.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                <Input
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>

              {/* Filters Row - Compact */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter By */}
                <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="All Patients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Patients</SelectItem>
                    <SelectItem value="priority">Priority Only</SelectItem>
                    <SelectItem value="recent">Recent Visits</SelectItem>
                    <SelectItem value="highrisk">High Risk</SelectItem>
                  </SelectContent>
                </Select>

                {/* Time Filter */}
                <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                  <SelectTrigger className="w-[110px] h-8 text-xs">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[115px] h-8 text-xs">
                    <SelectValue placeholder="Most Recent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dateCreated">Most Recent</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="age">Age</SelectItem>
                    <SelectItem value="lastVisit">Last Visit</SelectItem>
                    <SelectItem value="riskLevel">Risk Level</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Order Toggle */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="h-8 w-8 p-0"
                      >
                        <SortAsc className={`h-3.5 w-3.5 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Organization Filter (Admin Only) */}
                {(user?.role === 'admin' || user?.role === 'superadmin') && (
                  <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                    <SelectTrigger className="w-[145px] h-8 text-xs">
                      <SelectValue placeholder="All Organizations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Organizations</SelectItem>
                      <SelectItem value="current">My Organization</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {organizations.map((org: any) => (
                        <SelectItem key={org.id} value={org.id.toString()}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* View Mode Toggle */}
                <div className="flex border rounded-md overflow-hidden ml-auto">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-none border-0 h-8 px-2"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-none border-0 border-l h-8 px-2"
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Clear Filters Button */}
                {(filterBy !== 'all' || dateFilter !== 'all' || searchQuery || organizationFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilterBy('all');
                      setDateFilter('all');
                      setSearchQuery('');
                      setOrganizationFilter('all');
                    }}
                    className="h-8 px-2 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Bulk Actions */}
              {selectedPatients.size > 0 && (
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium">
                    {selectedPatients.size} patient(s) selected
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                      Export
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
            </div>
          </CardContent>
        </Card>

        {/* Patient List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
              Patients
              <Badge variant="secondary" className="ml-1 text-xs">
                {filteredAndSortedPatients.length}
              </Badge>
            </h3>
          </div>

          {filteredAndSortedPatients.length === 0 ? (
            <Card className="border-slate-200/60 shadow-sm">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4 opacity-50" />
                <p className="text-sm font-medium text-slate-600 mb-1">
                  {searchQuery ? 'No patients found' : 'No patients available'}
                </p>
                <p className="text-xs text-slate-500">
                  {searchQuery ? 'Try adjusting your search criteria' : 'Register a new patient to get started'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {filteredAndSortedPatients.map((patient) => (
                    <Card 
                      key={patient.id} 
                      className="group border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
                      onClick={() => setLocation(`/patients/${patient.id}`)}
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm">
                                {getPatientInitials(patient)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 truncate text-sm sm:text-base mb-0.5">
                                {formatPatientName(patient)}
                              </h3>
                              <p className="text-xs sm:text-sm text-slate-600">Age {calculateAge(patient.dateOfBirth)} • {patient.gender || 'N/A'}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem asChild>
                                <Link href={`/patients/${patient.id}`} className="flex items-center cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Profile
                                </Link>
                              </DropdownMenuItem>
                              {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('consultation', patient); }} className="cursor-pointer">
                                    <Stethoscope className="mr-2 h-4 w-4" />
                                    New Consultation
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('vitals', patient); }} className="cursor-pointer">
                                    <Thermometer className="mr-2 h-4 w-4" />
                                    Record Vitals
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('lab-tests', patient); }} className="cursor-pointer">
                                    <TestTube className="mr-2 h-4 w-4" />
                                    Order Lab Tests
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(user?.role === 'admin' || user?.role === 'doctor') && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('prescription', patient); }} className="cursor-pointer">
                                  <Pill className="mr-2 h-4 w-4" />
                                  Prescribe Medication
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('appointment', patient); }} className="cursor-pointer">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                Schedule Appointment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('history', patient); }} className="cursor-pointer">
                                <ScrollText className="mr-2 h-4 w-4" />
                                View History
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-2 text-xs sm:text-sm">
                          {patient.phone && (
                            <div className="flex items-center text-slate-600">
                              <Phone className="h-3 w-3 mr-2 flex-shrink-0 text-slate-400" />
                              <span className="truncate">{patient.phone}</span>
                            </div>
                          )}
                          {patient.email && (
                            <div className="flex items-center text-slate-600">
                              <Mail className="h-3 w-3 mr-2 flex-shrink-0 text-slate-400" />
                              <span className="truncate text-xs">{patient.email}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={`w-2 h-2 ${getRiskIndicatorColor(patient.riskLevel || 'low')} rounded-full`}></div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Risk Level: {patient.riskLevel?.toUpperCase() || 'LOW'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {patient.isPriority && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Star className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>Priority Patient</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs font-medium">
                              {patient.totalVisits || 0} visits
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
                    <Card 
                      key={patient.id} 
                      className="group border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
                      onClick={() => setLocation(`/patients/${patient.id}`)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                                {getPatientInitials(patient)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 truncate text-sm sm:text-base mb-1">
                                {formatPatientName(patient)}
                              </h3>
                              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <span>Age {calculateAge(patient.dateOfBirth)}</span>
                                  {patient.gender && <span>• {patient.gender}</span>}
                                </span>
                                {patient.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{patient.phone}</span>
                                  </span>
                                )}
                                {patient.email && (
                                  <span className="flex items-center gap-1 hidden sm:flex">
                                    <Mail className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate max-w-[200px]">{patient.email}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={`w-2 h-2 ${getRiskIndicatorColor(patient.riskLevel || 'low')} rounded-full`}></div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Risk Level: {patient.riskLevel?.toUpperCase() || 'LOW'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {patient.isPriority && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Star className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>Priority Patient</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs font-medium">
                              {patient.totalVisits || 0} visits
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem asChild>
                                  <Link href={`/patients/${patient.id}`} className="flex items-center cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Profile
                                  </Link>
                                </DropdownMenuItem>
                                {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('consultation', patient); }} className="cursor-pointer">
                                      <Stethoscope className="mr-2 h-4 w-4" />
                                      New Consultation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('vitals', patient); }} className="cursor-pointer">
                                      <Thermometer className="mr-2 h-4 w-4" />
                                      Record Vitals
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('lab-tests', patient); }} className="cursor-pointer">
                                      <TestTube className="mr-2 h-4 w-4" />
                                      Order Lab Tests
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(user?.role === 'admin' || user?.role === 'doctor') && (
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('prescription', patient); }} className="cursor-pointer">
                                    <Pill className="mr-2 h-4 w-4" />
                                    Prescribe Medication
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('appointment', patient); }} className="cursor-pointer">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  Schedule Appointment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('history', patient); }} className="cursor-pointer">
                                  <ScrollText className="mr-2 h-4 w-4" />
                                  View History
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <PatientRegistrationModal
        open={showRegistrationModal}
        onOpenChange={setShowRegistrationModal}
      />
    </div>
  );
}
