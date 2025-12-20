import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  MessageSquare, 
  Calendar, 
  User, 
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
  Activity
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDateMedium, formatDateTime } from "@/lib/date-utils";
import { t } from "@/lib/i18n";
import type { AiConsultation } from "@shared/schema";

export default function AiConsultationsListPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: consultations = [], isLoading } = useQuery<AiConsultation[]>({
    queryKey: ['/api/ai-consultations']
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients']
  });

  // Filter and search consultations
  const filteredConsultations = useMemo(() => {
    return consultations.filter((consultation) => {
      const matchesSearch = 
        !searchQuery ||
        consultation.chiefComplaint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        consultation.id?.toString().includes(searchQuery);
      
      const matchesStatus = 
        statusFilter === "all" || 
        consultation.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [consultations, searchQuery, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = consultations.length;
    const completed = consultations.filter(c => c.status === 'completed').length;
    const inProgress = consultations.filter(c => c.status === 'in_progress').length;
    const pending = consultations.filter(c => c.status === 'review_pending' || c.status === 'auto_draft_ready').length;
    
    return { total, completed, inProgress, pending };
  }, [consultations]);

  const createConsultationMutation = useMutation({
    mutationFn: async (data: { patientId: number; chiefComplaint: string }) => {
      const response = await apiRequest('/api/ai-consultations', 'POST', data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: "AI consultation started"
      });
      setDialogOpen(false);
      setSelectedPatientId("");
      setChiefComplaint("");
      queryClient.invalidateQueries({ queryKey: ['/api/ai-consultations'] });
      navigate(`/ai-consultations/${data.id}`);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to start consultation";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleCreate = () => {
    if (selectedPatientId && chiefComplaint) {
      createConsultationMutation.mutate({
        patientId: parseInt(selectedPatientId),
        chiefComplaint
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any, label: string }> = {
      'in_progress': { variant: 'secondary', icon: Activity, label: 'In Progress' },
      'completed': { variant: 'default', icon: CheckCircle, label: 'Completed' },
      'review_pending': { variant: 'outline', icon: AlertCircle, label: 'Review Pending' },
      'auto_draft_ready': { variant: 'outline', icon: FileText, label: 'Draft Ready' },
      'cancelled': { variant: 'destructive', icon: XCircle, label: 'Cancelled' },
      'archived': { variant: 'secondary', icon: FileText, label: 'Archived' },
    };
    
    const config = statusConfig[status] || { variant: 'secondary' as const, icon: AlertCircle, label: status };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find((p: any) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : `Patient #${patientId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-blue-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                AI-Powered Consultations
              </h1>
              <p className="text-muted-foreground text-lg">
                Simulate patient conversations and generate clinical notes automatically with AI assistance
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg" data-testid="button-new-consultation">
                  <Plus className="h-4 w-4 mr-2" />
                  New Consultation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Start AI Consultation
                  </DialogTitle>
                  <DialogDescription>
                    Create a new AI-powered consultation to simulate patient interactions and generate clinical documentation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="patient" className="text-sm font-medium">Patient *</Label>
                    <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                      <SelectTrigger id="patient" data-testid="select-patient" className="mt-1.5">
                        <SelectValue placeholder={patients.length === 0 ? "No patients available" : "Select patient"} />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.length === 0 ? (
                          <div className="p-4 text-sm text-center text-muted-foreground">
                            No patients found. Please create a patient first.
                          </div>
                        ) : (
                          patients.map((patient: any) => (
                            <SelectItem key={patient.id} value={patient.id.toString()}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{patient.firstName} {patient.lastName}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {patients.length === 0 && (
                      <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        You need to create at least one patient before starting an AI consultation.
                        <a href="/patients" className="ml-1 underline font-medium hover:text-amber-700">
                          Go to Patient Registry
                        </a>
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="complaint" className="text-sm font-medium">Chief Complaint *</Label>
                    <Input
                      id="complaint"
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="e.g., Persistent headache for 3 days, Chest pain, Fever and cough"
                      data-testid="input-chief-complaint"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Describe the patient's primary reason for the visit
                    </p>
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={!selectedPatientId || !chiefComplaint || createConsultationMutation.isPending || patients.length === 0}
                    className="w-full mt-2"
                    data-testid="button-create"
                    size="lg"
                  >
                    {createConsultationMutation.isPending ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Start Consultation
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Consultations</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
                  </div>
                  <div className="p-2 bg-blue-200 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Completed</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">{stats.completed}</p>
                  </div>
                  <div className="p-2 bg-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">In Progress</p>
                    <p className="text-2xl font-bold text-orange-900 mt-1">{stats.inProgress}</p>
                  </div>
                  <div className="p-2 bg-orange-200 rounded-lg">
                    <Activity className="h-5 w-5 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Pending Review</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">{stats.pending}</p>
                  </div>
                  <div className="p-2 bg-purple-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by complaint, patient, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="review_pending">Review Pending</SelectItem>
                <SelectItem value="auto_draft_ready">Draft Ready</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Consultations List */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground text-lg">Loading consultations...</p>
          </div>
        ) : filteredConsultations.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Sparkles className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                {searchQuery || statusFilter !== "all" 
                  ? "No consultations match your filters" 
                  : "No consultations yet"}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Start your first AI-powered consultation to simulate doctor-patient interactions and generate clinical notes automatically"}
              </p>
              {(!searchQuery && statusFilter === "all") && (
                <Button onClick={() => setDialogOpen(true)} size="lg">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start First Consultation
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredConsultations.map((consultation) => {
              const messageCount = Array.isArray(consultation.transcript) ? consultation.transcript.length : 0;
              const patientName = consultation.patientId ? getPatientName(consultation.patientId) : "Unknown Patient";
              
              return (
                <Card
                  key={consultation.id}
                  className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/50 cursor-pointer"
                  onClick={() => navigate(`/ai-consultations/${consultation.id}`)}
                  data-testid={`consultation-card-${consultation.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Sparkles className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                                {consultation.chiefComplaint || "Untitled Consultation"}
                              </h3>
                              {getStatusBadge(consultation.status || 'in_progress')}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{patientName}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Created:</span>
                            {consultation.createdAt ? formatDateMedium(new Date(consultation.createdAt)) : "N/A"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            <span className="font-medium">{messageCount}</span>
                            <span>{messageCount === 1 ? 'message' : 'messages'}</span>
                          </span>
                          {consultation.completedAt && (
                            <span className="flex items-center gap-1.5">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium">Completed:</span>
                              {formatDateMedium(new Date(consultation.completedAt))}
                            </span>
                          )}
                          {consultation.updatedAt && consultation.updatedAt !== consultation.createdAt && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">Updated:</span>
                              {formatDateTime(new Date(consultation.updatedAt))}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="group-hover:bg-primary/10 group-hover:text-primary"
                        >
                          View Details
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
