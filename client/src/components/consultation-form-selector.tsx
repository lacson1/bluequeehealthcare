import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, Send, Clock, User, Calendar, Activity, Pill, Search, 
  ChevronDown, ChevronUp, Filter, Pin, PinOff, Star, X, Stethoscope, 
  ArrowLeft, CheckCircle2, ClipboardList, Heart, Brain, Eye, Ear, 
  Baby, Bone, Sparkles, TrendingUp, History, Plus, Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import ConsultationHistoryDisplay from "./consultation-history-display";

// Icon mapping for specialist roles
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
    general: ClipboardList,
  };
  return roleMap[role?.toLowerCase()] || ClipboardList;
};

interface ConsultationForm {
  id: number;
  name: string;
  description: string;
  specialistRole: string;
  formStructure: {
    fields: FormField[];
  };
  isActive: boolean;
  isPinned?: boolean;
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'number' | 'date' | 'time' | 'email' | 'phone';
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  section?: string;
  medicalCategory?: 'symptoms' | 'vitals' | 'history' | 'examination' | 'diagnosis' | 'treatment' | 'followup';
}

interface ConsultationFormSelectorProps {
  patientId: number;
  visitId?: number;
  patient?: any;
  onFormSubmit?: (data: any) => void;
}

export default function ConsultationFormSelector({
  patientId,
  visitId,
  patient,
  onFormSubmit
}: ConsultationFormSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterByRole, setFilterByRole] = useState("all");
  const [step, setStep] = useState<'select' | 'fill'>('select');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available consultation forms
  const { data: forms = [], isLoading: formsLoading } = useQuery<ConsultationForm[]>({
    queryKey: ['/api/consultation-forms'],
  });

  // Separate pinned and regular forms, then filter
  const pinnedForms = forms.filter(form => form.isPinned);
  const regularForms = forms.filter(form => !form.isPinned);

  // Filter forms based on search and role filter
  const filteredPinnedForms = pinnedForms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterByRole || filterByRole === "all" || form.specialistRole.toLowerCase().includes(filterByRole.toLowerCase());
    return matchesSearch && matchesRole;
  });

  const filteredRegularForms = regularForms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterByRole || filterByRole === "all" || form.specialistRole.toLowerCase().includes(filterByRole.toLowerCase());
    return matchesSearch && matchesRole;
  });

  const filteredForms = [...filteredPinnedForms, ...filteredRegularForms];

  // Get unique specialist roles for filter dropdown
  const uniqueRoles = Array.from(new Set(forms.map(form => form.specialistRole))).sort();

  // Get selected form details
  const selectedForm = forms.find(form => form.id === selectedFormId);

  // Create consultation record mutation
  const createConsultationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/consultation-records', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Consultation Saved",
        description: "The consultation record has been created successfully",
      });
      handleCloseDialog();
      // Invalidate the correct query key format used by ConsultationHistoryDisplay
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/consultation-records`] });
      if (onFormSubmit) onFormSubmit(formData);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create consultation record",
        variant: "destructive",
      });
    },
  });

  // Pin form mutation
  const pinFormMutation = useMutation({
    mutationFn: (formId: number) => apiRequest(`/api/consultation-forms/${formId}/pin`, 'POST'),
    onSuccess: () => {
      toast({
        title: "Form Pinned",
        description: "This form will now appear at the top of your list",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/consultation-forms'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to pin form",
        variant: "destructive",
      });
    },
  });

  // Unpin form mutation
  const unpinFormMutation = useMutation({
    mutationFn: (formId: number) => apiRequest(`/api/consultation-forms/${formId}/pin`, 'DELETE'),
    onSuccess: () => {
      toast({
        title: "Form Unpinned",
        description: "Form removed from pinned list",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/consultation-forms'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unpin form",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handlePinToggle = (formId: number, isPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinned) {
      unpinFormMutation.mutate(formId);
    } else {
      pinFormMutation.mutate(formId);
    }
  };

  const handleSelectForm = (formId: number) => {
    setSelectedFormId(formId);
    setStep('fill');
  };

  const handleBackToSelect = () => {
    setStep('select');
    setFormData({});
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedFormId(null);
    setFormData({});
    setStep('select');
    setSearchQuery("");
    setFilterByRole("all");
  };

  const handleSubmit = () => {
    if (!selectedForm) return;

    const consultationData = {
      patientId,
      visitId,
      formId: selectedForm.id,
      formData: formData,
      status: 'completed'
    };

    createConsultationMutation.mutate(consultationData);
  };

  const renderFormField = (field: FormField) => {
    const fieldValue = formData[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            value={fieldValue}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="bg-white dark:bg-slate-800"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={fieldValue}
            onChange={(e) => handleInputChange(field.id, parseFloat(e.target.value) || '')}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
            className="bg-white dark:bg-slate-800"
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={fieldValue}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            rows={4}
            className="bg-white dark:bg-slate-800"
          />
        );

      case 'select':
        return (
          <Select
            value={fieldValue || undefined}
            onValueChange={(value) => handleInputChange(field.id, value)}
          >
            <SelectTrigger className="bg-white dark:bg-slate-800">
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options && field.options.length > 0 ? (
                field.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-options" disabled>
                  No options available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={fieldValue === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(fieldValue) ? fieldValue.includes(option) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(fieldValue) ? fieldValue : [];
                    if (e.target.checked) {
                      handleInputChange(field.id, [...currentValues, option]);
                    } else {
                      handleInputChange(field.id, currentValues.filter((v: any) => v !== option));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={fieldValue}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="bg-white dark:bg-slate-800"
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={fieldValue}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="bg-white dark:bg-slate-800"
          />
        );

      default:
        return (
          <Input
            type="text"
            placeholder={field.placeholder}
            value={fieldValue}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="bg-white dark:bg-slate-800"
          />
        );
    }
  };

  // Group fields by section if sections exist
  const groupedFields = selectedForm?.formStructure?.fields?.reduce((acc, field) => {
    const section = field.section || 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {} as Record<string, FormField[]>) || {};

  const FormCard = ({ form, isPinned }: { form: ConsultationForm; isPinned: boolean }) => (
    <div
      data-testid="form-card"
      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 group ${isPinned
          ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 hover:border-amber-300 hover:shadow-md'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 hover:shadow-md hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
        }`}
      onClick={() => handleSelectForm(form.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isPinned && <Star className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />}
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{form.name}</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{form.description}</p>
          <div className="flex items-center gap-2 mt-3">
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0">
              {form.specialistRole}
            </Badge>
            <Badge variant="outline" className="text-slate-500 dark:text-slate-400">
              {form.formStructure?.fields?.length || 0} fields
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => handlePinToggle(form.id, form.isPinned || false, e)}
          disabled={pinFormMutation.isPending || unpinFormMutation.isPending}
          className={`h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${isPinned ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
            }`}
          title={isPinned ? "Unpin form" : "Pin form"}
        >
          <Star className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
        </Button>
      </div>
    </div>
  );

  // Fetch consultation records for stats
  const { data: consultationRecords = [] } = useQuery<any[]>({
    queryKey: [`/api/patients/${patientId}/consultation-records`],
    enabled: !!patientId,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const records = consultationRecords || [];
    const today = new Date();
    const thisWeek = records.filter((r: any) => {
      const date = new Date(r.createdAt);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    });
    const thisMonth = records.filter((r: any) => {
      const date = new Date(r.createdAt);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return date >= monthAgo;
    });
    return {
      total: records.length,
      thisWeek: thisWeek.length,
      thisMonth: thisMonth.length,
      lastConsultation: records[0]?.createdAt ? new Date(records[0].createdAt) : null,
    };
  }, [consultationRecords]);

  return (
    <div className="space-y-4" data-testid="consultation-forms">
      {/* Main Consultation Card with Quick Access */}
      <div 
        className="overflow-hidden rounded-2xl shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #4338ca 100%)',
        }}
      >
        <div className="p-0">
          {/* Header Section */}
          <div className="p-5 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-3 bg-white/15 backdrop-blur-sm rounded-2xl ring-2 ring-white/25 shadow-lg">
                    <Stethoscope className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-400 rounded-full ring-2 ring-blue-900 flex items-center justify-center shadow-lg">
                    <Plus className="h-3 w-3 text-emerald-900" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl tracking-tight text-white">Specialist Consultations</h3>
                  <p className="text-sm text-blue-200 mt-0.5">
                    {forms.length} specialist forms • {pinnedForms.length} pinned
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                size="lg"
                className="bg-white text-blue-900 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Consultation
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3.5 border border-white/20 shadow-lg">
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-medium text-blue-100">This Week</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.thisWeek}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3.5 border border-white/20 shadow-lg">
                <div className="flex items-center gap-2 mb-1.5">
                  <Calendar className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-medium text-blue-100">This Month</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.thisMonth}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3.5 border border-white/20 shadow-lg">
                <div className="flex items-center gap-2 mb-1.5">
                  <History className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-medium text-blue-100">Total Records</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          {/* Quick Access Forms - Pinned forms shown here */}
          {pinnedForms.length > 0 && (
            <div className="px-5 pb-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-300">Quick Access</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                <TooltipProvider>
                  {pinnedForms.slice(0, 4).map((form) => {
                    const IconComponent = getSpecialtyIcon(form.specialistRole);
                    return (
                      <Tooltip key={form.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              setSelectedFormId(form.id);
                              setStep('fill');
                              setIsDialogOpen(true);
                            }}
                            className="group flex items-center gap-2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/15 hover:border-white/30 transition-all duration-200 text-left shadow-md hover:shadow-lg"
                          >
                            <div className="p-2 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-lg group-hover:scale-110 transition-transform">
                              <IconComponent className="h-4 w-4 text-amber-300" />
                            </div>
                            <span className="text-sm font-medium truncate flex-1 text-white">{form.name}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-slate-900 text-white border-slate-700">
                          <p>{form.description}</p>
                          <p className="text-xs text-slate-400 mt-1">{form.specialistRole}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
                {pinnedForms.length > 4 && (
                  <button
                    onClick={() => setIsDialogOpen(true)}
                    className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl border border-dashed border-white/25 hover:border-white/40 transition-all duration-200"
                  >
                    <span className="text-sm text-blue-200">+{pinnedForms.length - 4} more</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* No pinned forms hint */}
          {pinnedForms.length === 0 && forms.length > 0 && (
            <div className="px-5 pb-5">
              <div className="flex items-center gap-3 p-4 bg-white/8 rounded-xl border border-dashed border-white/25">
                <Star className="h-5 w-5 text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm text-blue-100">
                    Pin your frequently used forms for quick access
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                  className="text-amber-300 hover:text-amber-100 hover:bg-white/10 border border-amber-400/30"
                >
                  Browse Forms
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Consultation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0 overflow-hidden">
          {/* Dialog Header */}
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-900/20">
            <div className="flex items-center gap-3">
              {step === 'fill' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToSelect}
                  className="h-8 w-8 p-0 mr-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                {step === 'select' ? (
                  <ClipboardList className="h-5 w-5 text-white" />
                ) : (
                  <FileText className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {step === 'select' ? 'Select Consultation Form' : selectedForm?.name}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {step === 'select'
                    ? `Choose a specialist form for ${patient?.firstName || 'the patient'}'s consultation`
                    : selectedForm?.description
                  }
                </DialogDescription>
              </div>
            </div>
            {step === 'fill' && selectedForm && (
              <Badge className="absolute top-4 right-6 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                {selectedForm.specialistRole}
              </Badge>
            )}
          </DialogHeader>

          {/* Dialog Content */}
          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <div className="p-6">
              {step === 'select' ? (
                <div className="space-y-4">
                  {/* Search and Filter */}
                  {forms.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800/50 dark:to-blue-900/20 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex-1 relative group">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          placeholder="Search forms..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <Filter className="h-4 w-4 text-blue-500" />
                          <Select value={filterByRole} onValueChange={setFilterByRole}>
                            <SelectTrigger className="w-40 border-0 shadow-none p-0 h-auto focus:ring-0 bg-transparent">
                              <SelectValue placeholder="All Specialists" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Specialists</SelectItem>
                              {uniqueRoles.map((role) => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {(searchQuery || filterByRole !== "all") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSearchQuery("");
                              setFilterByRole("all");
                            }}
                            className="text-slate-500 hover:text-red-500 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {formsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                      <span className="text-slate-600">Loading forms...</span>
                    </div>
                  )}

                  {/* Empty State */}
                  {!formsLoading && filteredForms.length === 0 && (
                    <div className="text-center py-12">
                      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                        {forms.length === 0 ? 'No Forms Available' : 'No Matching Forms'}
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">
                        {forms.length === 0
                          ? 'Create consultation forms in the Form Builder first'
                          : 'Try adjusting your search or filter criteria'
                        }
                      </p>
                      {forms.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setFilterByRole("all"); }}>
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Pinned Forms */}
                  {filteredPinnedForms.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">Pinned Forms</h4>
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0">
                          {filteredPinnedForms.length}
                        </Badge>
                      </div>
                      <div className="grid gap-3">
                        {filteredPinnedForms.map((form) => (
                          <FormCard key={form.id} form={form} isPinned={true} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regular Forms */}
                  {filteredRegularForms.length > 0 && (
                    <div>
                      {filteredPinnedForms.length > 0 && (
                        <div className="flex items-center gap-2 mb-3 mt-6">
                          <FileText className="h-4 w-4 text-slate-500" />
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">All Forms</h4>
                          <Badge variant="secondary">{filteredRegularForms.length}</Badge>
                        </div>
                      )}
                      <div className="grid gap-3">
                        {filteredRegularForms.map((form) => (
                          <FormCard key={form.id} form={form} isPinned={false} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Form Filling View */
                <div className="space-y-6" data-testid="consultation-form">
                  {/* Form Fields by Section */}
                  {Object.entries(groupedFields).map(([sectionName, fields]) => (
                    <div key={sectionName} className="space-y-4">
                      {sectionName !== 'General' && (
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                            {sectionName}
                          </h3>
                        </div>
                      )}
                      <div className="grid gap-4">
                        {fields.map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label htmlFor={field.id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {renderFormField(field)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Dialog Footer */}
          {step === 'fill' && (
            <div className="px-6 py-4 border-t bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handleBackToSelect}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createConsultationMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 min-w-[140px]"
                data-testid="submit-consultation"
              >
                {createConsultationMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save Consultation
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Consultation History */}
      <ConsultationHistoryDisplay patientId={patientId} patient={patient} />
    </div>
  );
}
