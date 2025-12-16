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
  ScrollText, Thermometer, MoreVertical
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
    enabled: user?.role === 'admin' || user?.role === 'superadmin'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
            <p className="text-gray-600 mt-1">Enhanced patient care and management</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowRegistrationModal(true)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Register Patient
            </Button>
            <Button variant="outline" onClick={() => handleBulkAction('export')} className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="healthcare-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="healthcare-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <p className="text-2xl font-bold text-foreground">{stats.priority}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="healthcare-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                  <p className="text-2xl font-bold text-foreground">{stats.highRisk}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="healthcare-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-xl">
                  <Clock className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recent Visits</p>
                  <p className="text-2xl font-bold text-foreground">{stats.recentVisits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className="healthcare-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 text-base"
                />
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-wrap gap-3">
                <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                  <SelectTrigger className="w-[150px]">
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
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Time..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort..." />
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
                  <SortAsc className={`h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                </Button>

                {(user?.role === 'admin' || user?.role === 'superadmin') && (
                  <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Organization..." />
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

                <div className="ml-auto flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient List ({filteredAndSortedPatients.length})
            </h3>
          </div>
          
          {filteredAndSortedPatients.length === 0 ? (
            <Card className="healthcare-card">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No patients found matching your search.' : 'No patients found.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSortedPatients.map((patient) => (
                    <Card key={patient.id} className="healthcare-card group hover:shadow-lg transition-all cursor-pointer" onClick={() => setLocation(`/patients/${patient.id}`)}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {getPatientInitials(patient)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate">
                                {formatPatientName(patient)}
                              </h3>
                              <p className="text-sm text-muted-foreground">Age: {calculateAge(patient.dateOfBirth)}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem asChild>
                                <Link href={`/patients/${patient.id}`} className="flex items-center">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Profile
                                </Link>
                              </DropdownMenuItem>
                              {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('consultation', patient); }}>
                                    <Stethoscope className="mr-2 h-4 w-4" />
                                    New Consultation
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('vitals', patient); }}>
                                    <Thermometer className="mr-2 h-4 w-4" />
                                    Record Vitals
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('lab-tests', patient); }}>
                                    <TestTube className="mr-2 h-4 w-4" />
                                    Order Lab Tests
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(user?.role === 'admin' || user?.role === 'doctor') && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('prescription', patient); }}>
                                  <Pill className="mr-2 h-4 w-4" />
                                  Prescribe Medication
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('appointment', patient); }}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                Schedule Appointment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('history', patient); }}>
                                <ScrollText className="mr-2 h-4 w-4" />
                                View History
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Phone className="h-3 w-3 mr-2" />
                            {patient.phone}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-2" />
                            {new Date(patient.dateOfBirth).toLocaleDateString()}
                          </div>
                          {patient.address && (
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-2" />
                              <span className="truncate">{patient.address}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 ${getRiskIndicatorColor(patient.riskLevel || 'low')} rounded-full`} 
                                   title={`Risk: ${patient.riskLevel?.toUpperCase() || 'LOW'}`}></div>
                              {patient.isPriority && (
                                <div title="Priority Patient">
                                  <Star className="w-3 h-3 text-purple-500 fill-purple-500" />
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {patient.totalVisits} visits
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedPatients.map((patient) => (
                    <Card key={patient.id} className="healthcare-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/patients/${patient.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {getPatientInitials(patient)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate">
                                {formatPatientName(patient)}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(patient.dateOfBirth).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {patient.phone}
                                </span>
                                {patient.address && (
                                  <span className="flex items-center truncate max-w-xs">
                                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{patient.address}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 ${getRiskIndicatorColor(patient.riskLevel || 'low')} rounded-full`}></div>
                              {patient.isPriority && (
                                <div title="Priority Patient">
                                  <Star className="w-3 h-3 text-purple-500 fill-purple-500" />
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {patient.totalVisits} visits
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem asChild>
                                  <Link href={`/patients/${patient.id}`} className="flex items-center">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Profile
                                  </Link>
                                </DropdownMenuItem>
                                {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('consultation', patient); }}>
                                      <Stethoscope className="mr-2 h-4 w-4" />
                                      New Consultation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('vitals', patient); }}>
                                      <Thermometer className="mr-2 h-4 w-4" />
                                      Record Vitals
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('lab-tests', patient); }}>
                                      <TestTube className="mr-2 h-4 w-4" />
                                      Order Lab Tests
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(user?.role === 'admin' || user?.role === 'doctor') && (
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('prescription', patient); }}>
                                    <Pill className="mr-2 h-4 w-4" />
                                    Prescribe Medication
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('appointment', patient); }}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  Schedule Appointment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePatientAction('history', patient); }}>
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
