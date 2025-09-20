import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, User, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface ConsultationRecord {
  id: number;
  patientId: number;
  formId: number;
  filledBy: number;
  formData: Record<string, any>;
  createdAt: string;
  formName: string;
  specialistRole: string;
  formDescription: string;
}

interface ConsultationHistoryProps {
  patientId: number;
}

export default function ConsultationHistory({ patientId }: ConsultationHistoryProps) {
  const [expandedRecords, setExpandedRecords] = useState<Set<number>>(new Set());

  const { data: consultations = [], isLoading } = useQuery<ConsultationRecord[]>({
    queryKey: ['/api/patients', patientId, 'consultations'],
  });

  const toggleExpanded = (recordId: number) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRecords(newExpanded);
  };

  const renderFieldValue = (key: string, value: any) => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }
    return String(value || "Not provided");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consultation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading consultation history...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Consultation History
          <Badge variant="secondary" className="ml-auto">
            {consultations.length} records
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {consultations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No consultation records found</p>
            <p className="text-sm">Consultation records will appear here when forms are completed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => {
              const isExpanded = expandedRecords.has(consultation.id);
              
              return (
                <Card key={consultation.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {consultation.formName}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {consultation.specialistRole}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(consultation.createdAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(consultation.id)}
                        className="flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            View Details
                          </>
                        )}
                      </Button>
                    </div>

                    {consultation.formDescription && (
                      <p className="text-sm text-gray-600 mb-3">
                        {consultation.formDescription}
                      </p>
                    )}

                    {isExpanded && (
                      <div className="border-t pt-4">
                        <h5 className="font-medium text-gray-900 mb-3">Assessment Details</h5>
                        <div className="grid gap-3">
                          {consultation.formData && typeof consultation.formData === 'object' ? (
                            Object.entries(consultation.formData).map(([key, value]) => (
                              <div key={key} className="bg-gray-50 rounded-lg p-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <div className="font-medium text-gray-700 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                  </div>
                                  <div className="md:col-span-2 text-gray-900">
                                    {renderFieldValue(key, value)}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-500 italic">
                              No assessment data available
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}