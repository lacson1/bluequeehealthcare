import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Printer,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Filter,
  X
} from "lucide-react";
import { Patient } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { t } from "@/lib/i18n";
import { formatDateMedium } from "@/lib/date-utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ClinicalNote {
  id: number;
  consultationId?: number | null;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  diagnosis?: string;
  recommendations?: string;
  followUpInstructions?: string;
  followUpDate?: string;
  consultationDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClinicalNotesTabProps {
  patient: Patient;
}

interface NoteFormData {
  chiefComplaint: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  diagnosis: string;
  recommendations: string;
  followUpInstructions: string;
  followUpDate: string;
  consultationDate: string;
}

const initialFormData: NoteFormData = {
  chiefComplaint: "",
  subjective: "",
  objective: "",
  assessment: "",
  plan: "",
  diagnosis: "",
  recommendations: "",
  followUpInstructions: "",
  followUpDate: "",
  consultationDate: new Date().toISOString().split('T')[0],
};

export function ClinicalNotesTab({ patient }: ClinicalNotesTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [formData, setFormData] = useState<NoteFormData>(initialFormData);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [filterType, setFilterType] = useState<"all" | "recent" | "hasFollowUp">("all");

  // Query
  const { data: notes, isLoading, refetch } = useQuery<ClinicalNote[]>({
    queryKey: [`/api/patients/${patient.id}/clinical-notes`],
    enabled: !!patient.id,
  });

  // Mutations
  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const response = await apiRequest("POST", `/api/patients/${patient.id}/clinical-notes`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/clinical-notes`] });
      setShowAddDialog(false);
      setFormData(initialFormData);
      toast({
        title: "Note Created",
        description: "Clinical note has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create clinical note.",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: NoteFormData }) => {
      const response = await apiRequest("PATCH", `/api/patients/${patient.id}/clinical-notes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/clinical-notes`] });
      setShowEditDialog(false);
      setSelectedNote(null);
      setFormData(initialFormData);
      toast({
        title: "Note Updated",
        description: "Clinical note has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update clinical note.",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/patients/${patient.id}/clinical-notes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/clinical-notes`] });
      setShowDeleteDialog(false);
      setSelectedNote(null);
      toast({
        title: "Note Deleted",
        description: "Clinical note has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete clinical note.",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleAddNote = () => {
    setFormData(initialFormData);
    setShowAddDialog(true);
  };

  const handleEditNote = (note: ClinicalNote) => {
    setSelectedNote(note);
    setFormData({
      chiefComplaint: note.chiefComplaint || "",
      subjective: note.subjective || "",
      objective: note.objective || "",
      assessment: note.assessment || "",
      plan: note.plan || "",
      diagnosis: note.diagnosis || "",
      recommendations: note.recommendations || "",
      followUpInstructions: note.followUpInstructions || "",
      followUpDate: note.followUpDate ? note.followUpDate.split('T')[0] : "",
      consultationDate: note.consultationDate ? note.consultationDate.split('T')[0] : "",
    });
    setShowEditDialog(true);
  };

  const handleDeleteNote = (note: ClinicalNote) => {
    setSelectedNote(note);
    setShowDeleteDialog(true);
  };

  const handleCopyNote = (note: ClinicalNote) => {
    const noteText = `
Clinical Note - ${note.consultationDate ? formatDateMedium(note.consultationDate) : 'N/A'}

${note.chiefComplaint ? `Chief Complaint:\n${note.chiefComplaint}\n\n` : ''}
${note.subjective ? `Subjective:\n${note.subjective}\n\n` : ''}
${note.objective ? `Objective:\n${note.objective}\n\n` : ''}
${note.assessment ? `Assessment:\n${note.assessment}\n\n` : ''}
${note.plan ? `Plan:\n${note.plan}\n\n` : ''}
${note.diagnosis ? `Diagnosis: ${note.diagnosis}\n\n` : ''}
${note.recommendations ? `Recommendations:\n${note.recommendations}\n\n` : ''}
${note.followUpInstructions ? `Follow-up Instructions:\n${note.followUpInstructions}\n\n` : ''}
${note.followUpDate ? `Follow-up Date: ${formatDateMedium(note.followUpDate)}` : ''}
    `.trim();

    navigator.clipboard.writeText(noteText);
    toast({
      title: "Copied",
      description: "Note copied to clipboard.",
    });
  };

  const handlePrintNote = (note: ClinicalNote) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Clinical Note - ${patient.firstName} ${patient.lastName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
              h1 { color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 10px; }
              h2 { color: #2d3748; margin-top: 20px; }
              p { line-height: 1.6; color: #4a5568; }
              .date { color: #718096; font-size: 14px; }
              .section { margin-bottom: 15px; }
              .label { font-weight: bold; color: #2d3748; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <h1>Clinical Note</h1>
            <p class="date">Patient: ${patient.firstName} ${patient.lastName}</p>
            <p class="date">Date: ${note.consultationDate ? formatDateMedium(note.consultationDate) : 'N/A'}</p>
            
            ${note.chiefComplaint ? `<div class="section"><span class="label">Chief Complaint:</span><p>${note.chiefComplaint}</p></div>` : ''}
            ${note.subjective ? `<div class="section"><span class="label">Subjective:</span><p>${note.subjective}</p></div>` : ''}
            ${note.objective ? `<div class="section"><span class="label">Objective:</span><p>${note.objective}</p></div>` : ''}
            ${note.assessment ? `<div class="section"><span class="label">Assessment:</span><p>${note.assessment}</p></div>` : ''}
            ${note.plan ? `<div class="section"><span class="label">Plan:</span><p>${note.plan}</p></div>` : ''}
            ${note.diagnosis ? `<div class="section"><span class="label">Diagnosis:</span><p>${note.diagnosis}</p></div>` : ''}
            ${note.recommendations ? `<div class="section"><span class="label">Recommendations:</span><p>${note.recommendations}</p></div>` : ''}
            ${note.followUpInstructions ? `<div class="section"><span class="label">Follow-up Instructions:</span><p>${note.followUpInstructions}</p></div>` : ''}
            ${note.followUpDate ? `<div class="section"><span class="label">Follow-up Date:</span><p>${formatDateMedium(note.followUpDate)}</p></div>` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const toggleNoteExpanded = (noteId: number) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const handleFormChange = (field: keyof NoteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitAdd = () => {
    createNoteMutation.mutate(formData);
  };

  const handleSubmitEdit = () => {
    if (selectedNote) {
      updateNoteMutation.mutate({ id: selectedNote.id, data: formData });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedNote) {
      deleteNoteMutation.mutate(selectedNote.id);
    }
  };

  // Filter notes
  const filteredNotes = notes?.filter(note => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      note.chiefComplaint?.toLowerCase().includes(searchLower) ||
      note.subjective?.toLowerCase().includes(searchLower) ||
      note.objective?.toLowerCase().includes(searchLower) ||
      note.assessment?.toLowerCase().includes(searchLower) ||
      note.plan?.toLowerCase().includes(searchLower) ||
      note.diagnosis?.toLowerCase().includes(searchLower);

    // Type filter
    let matchesFilter = true;
    if (filterType === "recent") {
      const noteDate = note.consultationDate ? new Date(note.consultationDate) : new Date(note.createdAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      matchesFilter = noteDate >= sevenDaysAgo;
    } else if (filterType === "hasFollowUp") {
      matchesFilter = !!note.followUpDate;
    }

    return matchesSearch && matchesFilter;
  }) || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">{t('notes.clinicalNotes')}</h2>
          <Badge variant="secondary" className="ml-2">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterType("all")}>
                All Notes {filterType === "all" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("recent")}>
                Last 7 Days {filterType === "recent" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("hasFollowUp")}>
                With Follow-up {filterType === "hasFollowUp" && "✓"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh */}
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Add Note */}
          <Button onClick={handleAddNote} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Note</span>
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {filteredNotes.length === 0 && !searchQuery && filterType === "all" && (
        <EmptyState
          icon={BookOpen}
          title={t('notes.noNotes')}
          description={t('notes.noNotesDescription')}
          action={
            <Button onClick={handleAddNote} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Note
            </Button>
          }
        />
      )}

      {/* No results for search/filter */}
      {filteredNotes.length === 0 && (searchQuery || filterType !== "all") && (
        <Card className="p-8 text-center">
          <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No notes found matching your criteria.</p>
          <Button 
            variant="link" 
            onClick={() => { setSearchQuery(""); setFilterType("all"); }}
            className="mt-2"
          >
            Clear filters
          </Button>
        </Card>
      )}

      {/* Notes list */}
      {filteredNotes.map((note) => {
        const isExpanded = expandedNotes.has(note.id);
        const isFromVisit = note.id > 1000000; // Visit-based notes have offset IDs
        
        return (
          <Collapsible key={note.id} open={isExpanded} onOpenChange={() => toggleNoteExpanded(note.id)}>
            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 text-left flex-1 hover:text-blue-600 transition-colors">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        {note.chiefComplaint || note.diagnosis || t('notes.clinicalNote')}
                      </CardTitle>
                    </button>
                  </CollapsibleTrigger>

                  <div className="flex items-center gap-2">
                    {note.followUpDate && (
                      <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-300">
                        <Calendar className="h-3 w-3" />
                        Follow-up: {formatDateMedium(note.followUpDate)}
                      </Badge>
                    )}
                    
                    {note.consultationDate && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateMedium(note.consultationDate)}
                      </Badge>
                    )}

                    {isFromVisit && (
                      <Badge variant="secondary" className="text-xs">
                        From Visit
                      </Badge>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyNote(note)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy to Clipboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrintNote(note)}>
                          <Printer className="h-4 w-4 mr-2" />
                          Print Note
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!isFromVisit && (
                          <>
                            <DropdownMenuItem onClick={() => handleEditNote(note)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Note
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteNote(note)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Note
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Preview when collapsed */}
                {!isExpanded && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 ml-6">
                    {note.subjective || note.assessment || note.plan || "No content preview available"}
                  </p>
                )}
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="space-y-4 pt-2">
                  {/* SOAP Format */}
                  {note.subjective && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                      <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold">S</span>
                        {t('notes.subjective')}
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap ml-8">{note.subjective}</p>
                    </div>
                  )}

                  {note.objective && (
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                      <h4 className="font-semibold text-sm text-green-700 dark:text-green-400 mb-1 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs font-bold">O</span>
                        {t('notes.objective')}
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap ml-8">{note.objective}</p>
                    </div>
                  )}

                  {note.assessment && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                      <h4 className="font-semibold text-sm text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-xs font-bold">A</span>
                        {t('notes.assessment')}
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap ml-8">{note.assessment}</p>
                    </div>
                  )}

                  {note.plan && (
                    <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
                      <h4 className="font-semibold text-sm text-purple-700 dark:text-purple-400 mb-1 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-bold">P</span>
                        {t('notes.plan')}
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap ml-8">{note.plan}</p>
                    </div>
                  )}

                  {/* Additional Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                    {note.chiefComplaint && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">{t('notes.chiefComplaint')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{note.chiefComplaint}</p>
                      </div>
                    )}

                    {note.diagnosis && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">{t('notes.diagnosis')}</h4>
                        <Badge variant="secondary" className="text-sm">{note.diagnosis}</Badge>
                      </div>
                    )}

                    {note.recommendations && (
                      <div className="md:col-span-2">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">{t('notes.recommendations')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{note.recommendations}</p>
                      </div>
                    )}

                    {note.followUpInstructions && (
                      <div className="md:col-span-2">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">{t('notes.followUpInstructions')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{note.followUpInstructions}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      {/* Add Note Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Add Clinical Note
            </DialogTitle>
            <DialogDescription>
              Create a new clinical note for {patient.firstName} {patient.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Consultation Date</Label>
                <Input
                  type="date"
                  value={formData.consultationDate}
                  onChange={(e) => handleFormChange("consultationDate", e.target.value)}
                />
              </div>
              <div>
                <Label>Follow-up Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => handleFormChange("followUpDate", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Chief Complaint</Label>
              <Input
                placeholder="Main reason for visit..."
                value={formData.chiefComplaint}
                onChange={(e) => handleFormChange("chiefComplaint", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">S</span>
                  Subjective
                </Label>
                <Textarea
                  placeholder="Patient's symptoms in their own words..."
                  value={formData.subjective}
                  onChange={(e) => handleFormChange("subjective", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">O</span>
                  Objective
                </Label>
                <Textarea
                  placeholder="Physical examination findings..."
                  value={formData.objective}
                  onChange={(e) => handleFormChange("objective", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">A</span>
                  Assessment
                </Label>
                <Textarea
                  placeholder="Clinical assessment and diagnosis..."
                  value={formData.assessment}
                  onChange={(e) => handleFormChange("assessment", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">P</span>
                  Plan
                </Label>
                <Textarea
                  placeholder="Treatment plan and next steps..."
                  value={formData.plan}
                  onChange={(e) => handleFormChange("plan", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div>
              <Label>Diagnosis</Label>
              <Input
                placeholder="Primary diagnosis..."
                value={formData.diagnosis}
                onChange={(e) => handleFormChange("diagnosis", e.target.value)}
              />
            </div>

            <div>
              <Label>Recommendations</Label>
              <Textarea
                placeholder="Recommendations for the patient..."
                value={formData.recommendations}
                onChange={(e) => handleFormChange("recommendations", e.target.value)}
              />
            </div>

            <div>
              <Label>Follow-up Instructions</Label>
              <Textarea
                placeholder="Instructions for follow-up care..."
                value={formData.followUpInstructions}
                onChange={(e) => handleFormChange("followUpInstructions", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAdd} 
              disabled={createNoteMutation.isPending}
            >
              {createNoteMutation.isPending ? "Creating..." : "Create Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Clinical Note
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Consultation Date</Label>
                <Input
                  type="date"
                  value={formData.consultationDate}
                  onChange={(e) => handleFormChange("consultationDate", e.target.value)}
                />
              </div>
              <div>
                <Label>Follow-up Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => handleFormChange("followUpDate", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Chief Complaint</Label>
              <Input
                placeholder="Main reason for visit..."
                value={formData.chiefComplaint}
                onChange={(e) => handleFormChange("chiefComplaint", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">S</span>
                  Subjective
                </Label>
                <Textarea
                  placeholder="Patient's symptoms in their own words..."
                  value={formData.subjective}
                  onChange={(e) => handleFormChange("subjective", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">O</span>
                  Objective
                </Label>
                <Textarea
                  placeholder="Physical examination findings..."
                  value={formData.objective}
                  onChange={(e) => handleFormChange("objective", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">A</span>
                  Assessment
                </Label>
                <Textarea
                  placeholder="Clinical assessment and diagnosis..."
                  value={formData.assessment}
                  onChange={(e) => handleFormChange("assessment", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">P</span>
                  Plan
                </Label>
                <Textarea
                  placeholder="Treatment plan and next steps..."
                  value={formData.plan}
                  onChange={(e) => handleFormChange("plan", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <div>
              <Label>Diagnosis</Label>
              <Input
                placeholder="Primary diagnosis..."
                value={formData.diagnosis}
                onChange={(e) => handleFormChange("diagnosis", e.target.value)}
              />
            </div>

            <div>
              <Label>Recommendations</Label>
              <Textarea
                placeholder="Recommendations for the patient..."
                value={formData.recommendations}
                onChange={(e) => handleFormChange("recommendations", e.target.value)}
              />
            </div>

            <div>
              <Label>Follow-up Instructions</Label>
              <Textarea
                placeholder="Instructions for follow-up care..."
                value={formData.followUpInstructions}
                onChange={(e) => handleFormChange("followUpInstructions", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitEdit} 
              disabled={updateNoteMutation.isPending}
            >
              {updateNoteMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Clinical Note
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this clinical note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedNote && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 my-4">
              <p className="font-medium">{selectedNote.chiefComplaint || selectedNote.diagnosis || "Clinical Note"}</p>
              <p className="text-sm text-gray-500">
                {selectedNote.consultationDate ? formatDateMedium(selectedNote.consultationDate) : "No date"}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete} 
              disabled={deleteNoteMutation.isPending}
            >
              {deleteNoteMutation.isPending ? "Deleting..." : "Delete Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
