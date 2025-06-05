import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Pill,
  FileText,
  User,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { Patient } from "@shared/schema";

interface MedicationReviewAssignmentsListProps {
  patientId: number;
  patient?: Patient;
  onCreateAssignment: () => void;
}

interface Assignment {
  assignment: {
    id: number;
    patientId: number;
    prescriptionId?: number;
    assignedBy: number;
    assignedTo: number;
    reviewType: string;
    dueDate: string;
    notes?: string;
    status: string;
    priority: string;
    organizationId?: number;
    createdAt: string;
    assignedAt: string;
    startedAt?: string;
    completedAt?: string;
  };
  assignedToUser: {
    id: number;
    username: string;
    role: string;
  };
  prescription?: {
    id: number;
    medicationName: string;
    dosage: string;
    frequency: string;
  };
}

export function MedicationReviewAssignmentsList({
  patientId,
  patient,
  onCreateAssignment
}: MedicationReviewAssignmentsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["/api/patients", patientId, "medication-review-assignments"],
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => 
      apiRequest(`/api/medication-review-assignments/${id}`, "PATCH", updates),
    onSuccess: () => {
      toast({
        title: "Assignment Updated",
        description: "Assignment status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId, "medication-review-assignments"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update assignment status",
        variant: "destructive",
      });
      console.error("Assignment update error:", error);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "in_progress":
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary" as const;
      case "in_progress":
        return "default" as const;
      case "completed":
        return "default" as const;
      case "cancelled":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "low":
        return "secondary" as const;
      case "normal":
        return "outline" as const;
      case "high":
        return "destructive" as const;
      case "urgent":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const getReviewTypeLabel = (reviewType: string) => {
    switch (reviewType) {
      case "routine":
        return "Routine Review";
      case "urgent":
        return "Urgent Review";
      case "medication_safety":
        return "Safety Review";
      case "dosage_adjustment":
        return "Dosage Review";
      default:
        return reviewType;
    }
  };

  const handleStatusChange = (assignment: Assignment, newStatus: string) => {
    updateAssignmentMutation.mutate({
      id: assignment.assignment.id,
      updates: { status: newStatus }
    });
  };

  const filteredAssignments = Array.isArray(assignments) ? assignments.filter((assignment: Assignment) => {
    if (statusFilter === "all") return true;
    const status = assignment.assignment?.status || assignment.status || 'pending';
    return status === statusFilter;
  }) : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Medication Review Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading assignments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Medication Review Assignments
          </CardTitle>
          <Button onClick={onCreateAssignment} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Assign Review
          </Button>
        </div>
        
        {assignments && assignments.length > 0 && (
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs">
              {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Review Assignments</h3>
            <p className="text-muted-foreground mb-4">
              {statusFilter === "all" 
                ? "No medication review assignments found for this patient."
                : `No ${statusFilter} assignments found.`
              }
            </p>
            <Button onClick={onCreateAssignment} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create First Assignment
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment: Assignment, index: number) => (
              <div key={assignment.assignment?.id || assignment.id || index}>
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(assignment.assignment?.status || assignment.status || 'pending')}
                              <Badge variant={getStatusVariant(assignment.assignment?.status || assignment.status || 'pending')}>
                                {(assignment.assignment?.status || assignment.status || 'pending').replace('_', ' ')}
                              </Badge>
                            </div>
                            <Badge variant={getPriorityVariant(assignment.assignment?.priority || assignment.priority || 'medium')}>
                              {assignment.assignment?.priority || assignment.priority || 'medium'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            #{assignment.assignment?.id || assignment.id || 'N/A'}
                          </div>
                        </div>

                        {/* Review Type */}
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {getReviewTypeLabel(assignment.assignment?.reviewType || assignment.reviewType || 'general')}
                          </span>
                        </div>

                        {/* Prescription */}
                        {assignment.prescription && (
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {assignment.prescription.medicationName} - {assignment.prescription.dosage}
                            </span>
                          </div>
                        )}

                        {/* Assigned To */}
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Assigned to: <span className="font-medium">{assignment.assignedToUser?.username || 'Unknown User'}</span>
                          </span>
                          {assignment.assignedToUser?.role && (
                            <Badge variant="outline" className="text-xs">
                              {assignment.assignedToUser.role}
                            </Badge>
                          )}
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Due: <span className="font-medium">
                              {format(new Date(assignment.assignment.dueDate), "MMM dd, yyyy")}
                            </span>
                          </span>
                        </div>

                        {/* Notes */}
                        {assignment.assignment.notes && (
                          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                            {assignment.assignment.notes}
                          </div>
                        )}

                        {/* Status Actions */}
                        {assignment.assignment.status !== "completed" && assignment.assignment.status !== "cancelled" && (
                          <div className="flex items-center gap-2 pt-2">
                            {assignment.assignment.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(assignment, "in_progress")}
                                disabled={updateAssignmentMutation.isPending}
                              >
                                Start Review
                              </Button>
                            )}
                            {assignment.assignment.status === "in_progress" && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(assignment, "completed")}
                                disabled={updateAssignmentMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusChange(assignment, "cancelled")}
                              disabled={updateAssignmentMutation.isPending}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Created: {format(new Date(assignment.assignment.createdAt), "MMM dd, yyyy 'at' HH:mm")}</div>
                          {assignment.assignment.startedAt && (
                            <div>Started: {format(new Date(assignment.assignment.startedAt), "MMM dd, yyyy 'at' HH:mm")}</div>
                          )}
                          {assignment.assignment.completedAt && (
                            <div>Completed: {format(new Date(assignment.assignment.completedAt), "MMM dd, yyyy 'at' HH:mm")}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {index < filteredAssignments.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}