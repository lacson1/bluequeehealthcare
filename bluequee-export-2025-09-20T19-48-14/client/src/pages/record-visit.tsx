import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { EnhancedVisitRecording } from "@/components/enhanced-visit-recording";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function RecordVisitPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [, navigate] = useLocation();
  
  const patientIdNum = parseInt(patientId || "0");

  const { data: patient } = useQuery({
    queryKey: [`/api/patients/${patientIdNum}`],
    enabled: !!patientIdNum,
  });

  if (!patientIdNum) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Patient ID</h1>
          <p className="text-gray-600 mt-2">Please select a valid patient to record a visit.</p>
          <Button onClick={() => navigate("/patients")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(`/patients/${patientIdNum}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Patient
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Record Visit - {patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Patient'}
                </h1>
                <p className="text-sm text-gray-500">
                  Comprehensive patient visit documentation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EnhancedVisitRecording 
          patientId={patientIdNum}
          onSave={() => navigate(`/patients/${patientIdNum}`)}
        />
      </div>
    </div>
  );
}