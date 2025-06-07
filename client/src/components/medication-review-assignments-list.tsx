import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Stethoscope, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Pill,
  FileText,
  User,
  Plus,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { Patient } from "@shared/schema";

interface MedicationReviewAssignmentsListProps {
  patientId: number;
  patient?: Patient;
  onCreateAssignment?: () => void;
}

interface Prescription {
  id: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  prescribedDate: string;
  duration?: string;
  status: string;
}

interface MedicationReview {
  id: number;
  patientId: number;
  prescriptionId: number;
  reviewType: 'general' | 'safety' | 'efficacy' | 'adherence' | 'interaction';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedBy: number;
  assignedTo?: number;
  dueDate: string;
  notes?: string;
  findings?: string;
  recommendations?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  prescription: Prescription;
  assignedByUser: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  assignedToUser?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

export function MedicationReviewAssignmentsList({
  patientId,
  patient,
  onCreateAssignment
}: MedicationReviewAssignmentsListProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch medication reviews for the patient
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/medication-reviews`],
    enabled: !!patientId
  });

  // Update review status mutation
  const updateReviewMutation = useMutation({
    mutationFn: ({ reviewId, status }: { reviewId: number; status: string }) =>
      apiRequest(`/api/medication-reviews/${reviewId}`, 'PATCH', { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/medication-reviews`] });
      toast({
        title: "Success",
        description: "Review status updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update review status",
        variant: "destructive"
      });
    }
  });

  // Filter reviews based on status
  const filteredReviews = Array.isArray(reviews) ? reviews.filter((review: MedicationReview) => {
    if (statusFilter === "all") return true;
    return review.status === statusFilter;
  }) : [];

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'in_progress':
        return <Stethoscope className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary' as const;
      case 'in_progress':
        return 'default' as const;
      case 'completed':
        return 'secondary' as const;
      case 'cancelled':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive' as const;
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'default' as const;
      case 'low':
        return 'secondary' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getReviewTypeLabel = (reviewType: string) => {
    switch (reviewType) {
      case 'general':
        return 'General Review';
      case 'safety':
        return 'Safety Assessment';
      case 'efficacy':
        return 'Efficacy Review';
      case 'adherence':
        return 'Adherence Check';
      case 'interaction':
        return 'Drug Interaction Review';
      default:
        return 'Medication Review';
    }
  };

  const handleStatusChange = (review: MedicationReview, newStatus: string) => {
    updateReviewMutation.mutate({
      reviewId: review.id,
      status: newStatus
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading medication reviews...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            Medication Review Assignments
          </CardTitle>
          {onCreateAssignment && (
            <Button onClick={onCreateAssignment} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Assign Review
            </Button>
          )}
        </div>
        
        {filteredReviews.length > 0 && (
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs">
              {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="font-medium text-gray-600 mb-1">No medication reviews found</h3>
            <p className="text-sm">
              {statusFilter === "all" 
                ? "No medication review assignments have been created for this patient yet." 
                : `No ${statusFilter.replace('_', ' ')} reviews found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review: MedicationReview, index: number) => (
              <div key={review.id}>
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(review.status)}
                              <Badge variant={getStatusVariant(review.status)}>
                                {review.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <Badge variant={getPriorityVariant(review.priority)}>
                              {review.priority}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            #{review.id}
                          </div>
                        </div>

                        {/* Review Type */}
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {getReviewTypeLabel(review.reviewType)}
                          </span>
                        </div>

                        {/* Prescription Details */}
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {review.prescription.medicationName} - {review.prescription.dosage}
                            {review.prescription.frequency && ` (${review.prescription.frequency})`}
                          </span>
                        </div>

                        {/* Assigned To */}
                        {review.assignedToUser && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              Assigned to: {review.assignedToUser.firstName && review.assignedToUser.lastName 
                                ? `${review.assignedToUser.firstName} ${review.assignedToUser.lastName}`
                                : review.assignedToUser.username} ({review.assignedToUser.role})
                            </span>
                          </div>
                        )}

                        {/* Due Date */}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Due: <span className="font-medium">
                              {format(new Date(review.dueDate), "MMM dd, yyyy")}
                            </span>
                          </span>
                        </div>

                        {/* Notes */}
                        {review.notes && (
                          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                            <strong>Notes:</strong> {review.notes}
                          </div>
                        )}

                        {/* Findings */}
                        {review.findings && (
                          <div className="text-sm text-muted-foreground bg-green-50 p-3 rounded-md">
                            <strong>Findings:</strong> {review.findings}
                          </div>
                        )}

                        {/* Recommendations */}
                        {review.recommendations && (
                          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                            <strong>Recommendations:</strong> {review.recommendations}
                          </div>
                        )}

                        {/* Status Actions */}
                        {review.status !== "completed" && review.status !== "cancelled" && (
                          <div className="flex items-center gap-2 pt-2">
                            {review.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(review, "in_progress")}
                                disabled={updateReviewMutation.isPending}
                              >
                                Start Review
                              </Button>
                            )}
                            {review.status === "in_progress" && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(review, "completed")}
                                disabled={updateReviewMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusChange(review, "cancelled")}
                              disabled={updateReviewMutation.isPending}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Created: {format(new Date(review.createdAt), "MMM dd, yyyy 'at' HH:mm")}</div>
                          {review.startedAt && (
                            <div>Started: {format(new Date(review.startedAt), "MMM dd, yyyy 'at' HH:mm")}</div>
                          )}
                          {review.completedAt && (
                            <div>Completed: {format(new Date(review.completedAt), "MMM dd, yyyy 'at' HH:mm")}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {index < filteredReviews.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}