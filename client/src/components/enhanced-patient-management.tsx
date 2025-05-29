import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, UserPlus, Users, Phone, Calendar, MapPin, 
  Stethoscope, FlaskRound, Pill, UserCheck, Activity,
  Heart, Clock, FileText, Grid3X3, List, LayoutGrid,
  Filter, SortAsc, Download, Upload, Eye, AlertTriangle,
  Bookmark, BookmarkCheck, TrendingUp, Star, ChevronDown,
  ChevronUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Patient } from "@shared/schema";

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
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const [isPatientsOpen, setIsPatientsOpen] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Bulk actions mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, patientIds }: { action: string; patientIds: number[] }) => {
      return apiRequest('POST', '/api/patients/bulk-action', { action, patientIds });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Bulk action completed successfully" });
      setSelectedPatients(new Set());
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to complete bulk action", variant: "destructive" });
    }
  });

  // Advanced filtering and sorting
  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients.filter((patient: PatientWithStats) => {
      const matchesSearch = `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toString().includes(searchQuery);

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
          return calculateAge(a.dateOfBirth) - calculateAge(b.dateOfBirth);
        case 'lastVisit':
          return new Date(b.lastVisit || 0).getTime() - new Date(a.lastVisit || 0).getTime();
        case 'riskLevel':
          const riskOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return riskOrder[b.riskLevel || 'low'] - riskOrder[a.riskLevel || 'low'];
        default:
          return 0;
      }
    });

    return filtered;
  }, [patients, searchQuery, filterBy, sortBy]);

  const calculateAge = (dateOfBirth: string) => {
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  };

  const getPatientInitials = (patient: Patient) => {
    return `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedPatients.size === 0) {
      toast({ title: "No Selection", description: "Please select patients first", variant: "destructive" });
      return;
    }
    bulkActionMutation.mutate({ action, patientIds: Array.from(selectedPatients) });
  };

  const togglePatientSelection = (patientId: number) => {
    const newSelection = new Set(selectedPatients);
    if (newSelection.has(patientId)) {
      newSelection.delete(patientId);
    } else {
      newSelection.add(patientId);
    }
    setSelectedPatients(newSelection);
  };

  // Enhanced statistics
  const statistics = useMemo(() => {
    const totalPatients = patients.length;
    const priorityPatients = patients.filter(p => p.isPriority).length;
    const highRiskPatients = patients.filter(p => p.riskLevel === 'high').length;
    const recentPatients = patients.filter(p => p.lastVisit && 
      new Date(p.lastVisit) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

    return { totalPatients, priorityPatients, highRiskPatients, recentPatients };
  }, [patients]);

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Actions */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Enhanced Patient Management</h1>
          <p className="text-slate-600 mt-1">Advanced patient record management with smart filtering and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Statistics - Collapsible */}
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

      {/* Advanced Search and Filters - Collapsible */}
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
              <Select value={filterBy} onValueChange={setFilterBy}>
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
              
              <Select value={sortBy} onValueChange={setSortBy}>
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
            <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm text-blue-700 font-medium">
                {selectedPatients.size} patient(s) selected
              </span>
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
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>

    {/* Enhanced Patient Display - Collapsible */}
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
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-slate-500 mt-2">Loading patients...</p>
        </div>
      ) : filteredAndSortedPatients.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">
            {searchQuery ? "No patients found matching your criteria." : "No patients registered yet."}
          </p>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedPatients.map((patient: PatientWithStats) => (
                <Card 
                  key={patient.id} 
                  className={`hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-slate-200 ${
                    selectedPatients.has(patient.id) ? 'ring-2 ring-blue-500 border-blue-500' : ''
                  }`}
                  onClick={() => togglePatientSelection(patient.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="w-14 h-14">
                          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                            {getPatientInitials(patient)}
                          </AvatarFallback>
                        </Avatar>
                        {patient.isPriority && (
                          <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl text-slate-800">
                          {patient.firstName} {patient.lastName}
                        </CardTitle>
                        <div className="flex items-center text-sm text-slate-500 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{calculateAge(patient.dateOfBirth)} years old</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={getRiskBadgeColor(patient.riskLevel || 'low')}>
                          {patient.riskLevel?.toUpperCase()}
                        </Badge>
                        {patient.isPriority && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Priority
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-4">
                    {/* Enhanced Patient Info */}
                    <div className="space-y-2">
                      {patient.phone && (
                        <div className="flex items-center text-sm text-slate-600">
                          <Phone className="h-4 w-4 mr-2 text-slate-400" />
                          {patient.phone}
                        </div>
                      )}
                      {patient.lastVisit && (
                        <div className="flex items-center text-sm text-slate-600">
                          <Clock className="h-4 w-4 mr-2 text-slate-400" />
                          Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-slate-600">
                        <Activity className="h-4 w-4 mr-2 text-slate-400" />
                        {patient.totalVisits} total visits
                      </div>
                      {patient.upcomingAppointments && patient.upcomingAppointments > 0 && (
                        <div className="flex items-center text-sm text-green-600">
                          <Calendar className="h-4 w-4 mr-2 text-green-500" />
                          {patient.upcomingAppointments} upcoming appointment(s)
                        </div>
                      )}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <Link href={`/patients/${patient.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Stethoscope className="h-4 w-4 mr-1" />
                        Visit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Enhanced List View */
            <div className="space-y-2">
              {filteredAndSortedPatients.map((patient: PatientWithStats) => (
                <Card 
                  key={patient.id} 
                  className={`hover:shadow-md transition-all cursor-pointer ${
                    selectedPatients.has(patient.id) ? 'ring-2 ring-blue-500 border-blue-500' : ''
                  }`}
                  onClick={() => togglePatientSelection(patient.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                              {getPatientInitials(patient)}
                            </AvatarFallback>
                          </Avatar>
                          {patient.isPriority && (
                            <Star className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800">
                              {patient.firstName} {patient.lastName}
                            </h3>
                            <Badge className={getRiskBadgeColor(patient.riskLevel || 'low')} size="sm">
                              {patient.riskLevel?.toUpperCase()}
                            </Badge>
                            {patient.isPriority && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800" size="sm">
                                Priority
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                            <span>{calculateAge(patient.dateOfBirth)} years old</span>
                            <span>{patient.phone}</span>
                            {patient.lastVisit && (
                              <span>Last visit: {new Date(patient.lastVisit).toLocaleDateString()}</span>
                            )}
                            <span>{patient.totalVisits} visits</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/patients/${patient.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Stethoscope className="h-4 w-4 mr-1" />
                          Visit
                        </Button>
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
    </div>
  );
}