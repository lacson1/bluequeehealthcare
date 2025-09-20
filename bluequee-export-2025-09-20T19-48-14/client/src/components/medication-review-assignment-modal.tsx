import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, UserCheck, AlertTriangle, Clock, FileText, Pill } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Patient, Prescription } from "@shared/schema";

interface MedicationReviewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  patient?: Patient;
  selectedPrescription?: Prescription;
}

interface AssignmentFormData {
  patientId: number;
  prescriptionId?: number;
  assignedTo: string;
  reviewType: string;
  dueDate: string;
  notes: string;
  priority: string;
}

export function MedicationReviewAssignmentModal({
  isOpen,
  onClose,
  patientId,
  patient,
  selectedPrescription
}: MedicationReviewAssignmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState<AssignmentFormData>({
    patientId,
    prescriptionId: selectedPrescription?.id,
    assignedTo: "",
    reviewType: "routine",
    dueDate: "",
    notes: "",
    priority: "normal"
  });

  // Fetch available staff for assignment
  const { data: reviewers, isLoading: reviewersLoading } = useQuery({
    queryKey: ["/api/users/doctors/search"],
    enabled: isOpen,
  });

  // Fetch patient prescriptions if no specific prescription selected
  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ["/api/patients", patientId, "prescriptions"],
    enabled: isOpen && !selectedPrescription,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data: AssignmentFormData) => apiRequest("/api/medication-review-assignments", "POST", data),
    onSuccess: () => {
      toast({
        title: "Assignment Created",
        description: "Medication review has been successfully assigned",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId, "medication-review-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medication-review-assignments"] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: "Failed to create medication review assignment",
        variant: "destructive",
      });
      console.error("Assignment creation error:", error);
    },
  });

  const handleClose = () => {
    setFormData({
      patientId,
      prescriptionId: selectedPrescription?.id,
      assignedTo: "",
      reviewType: "routine",
      dueDate: "",
      notes: "",
      priority: "normal"
    });
    setSelectedDate(undefined);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.assignedTo || !selectedDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      dueDate: format(selectedDate, "yyyy-MM-dd")
    };

    createAssignmentMutation.mutate(submitData);
  };

  useEffect(() => {
    if (selectedPrescription) {
      setFormData(prev => ({ ...prev, prescriptionId: selectedPrescription.id }));
    }
  }, [selectedPrescription]);

  const reviewTypeOptions = [
    { value: "routine", label: "Routine Review", icon: FileText, description: "Standard medication review" },
    { value: "urgent", label: "Urgent Review", icon: AlertTriangle, description: "High priority review needed" },
    { value: "medication_safety", label: "Safety Review", icon: UserCheck, description: "Focus on drug interactions and safety" },
    { value: "dosage_adjustment", label: "Dosage Review", icon: Pill, description: "Review dosage and frequency" }
  ];

  const priorityOptions = [
    { value: "low", label: "Low", variant: "secondary" as const },
    { value: "normal", label: "Normal", variant: "default" as const },
    { value: "high", label: "High", variant: "destructive" as const },
    { value: "urgent", label: "Urgent", variant: "destructive" as const }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Assign Medication Review
          </DialogTitle>
          <DialogDescription>
            Create a medication review assignment for {patient?.firstName} {patient?.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium">{patient?.title} {patient?.firstName} {patient?.lastName}</p>
                  <p className="text-sm text-muted-foreground">Patient ID: {patientId}</p>
                </div>
                {selectedPrescription && (
                  <Badge variant="outline" className="shrink-0">
                    {selectedPrescription.medicationName}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Prescription Selection */}
          {!selectedPrescription && (
            <div className="space-y-2">
              <Label htmlFor="prescription">Prescription (Optional)</Label>
              <Select
                value={formData.prescriptionId?.toString() || ""}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  prescriptionId: value && value !== "all" ? parseInt(value) : undefined 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select prescription to review" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Medications</SelectItem>
                  {prescriptions?.map((prescription: Prescription) => (
                    <SelectItem key={prescription.id} value={prescription.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4" />
                        <span>{prescription.medicationName} - {prescription.dosage}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assign To */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To *</Label>
            <Select
              value={formData.assignedTo}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reviewer" />
              </SelectTrigger>
              <SelectContent>
                {reviewers?.map((reviewer: any) => (
                  <SelectItem key={reviewer.id} value={reviewer.id.toString()}>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      <span>{reviewer.username}</span>
                      <Badge variant="outline" className="ml-auto">
                        {reviewer.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Review Type */}
          <div className="space-y-3">
            <Label>Review Type *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviewTypeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Card
                    key={option.value}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      formData.reviewType === option.value
                        ? "ring-2 ring-blue-500 border-blue-500"
                        : "border-muted"
                    )}
                    onClick={() => setFormData(prev => ({ ...prev, reviewType: option.value }))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{option.label}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority *</Label>
            <div className="flex gap-2">
              {priorityOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={formData.priority === option.value ? option.variant : "outline"}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, priority: option.value }))}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any specific instructions or concerns for the reviewer..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createAssignmentMutation.isPending || !formData.assignedTo || !selectedDate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createAssignmentMutation.isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Create Assignment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}