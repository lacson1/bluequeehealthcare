import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Pill, AlertTriangle, BookOpen, Clock } from 'lucide-react';

interface PharmacyReviewProps {
  patientId: number;
  visitId?: number;
}

export default function PharmacyReview({ patientId, visitId }: PharmacyReviewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch patient's current prescriptions for review
  const { data: prescriptions = [] } = useQuery({
    queryKey: ['/api/patients', patientId, 'prescriptions'],
    enabled: !!patientId,
  });
  
  const [reviewData, setReviewData] = useState({
    drugInteractions: '',
    allergyCheck: '',
    dosageReview: '',
    contraindications: '',
    patientCounseling: '',
    medicationReconciliation: '',
    adherenceAssessment: '',
    sideEffectsMonitoring: '',
    pharmacistRecommendations: '',
    clinicalNotes: '',
    dispensingInstructions: '',
    followUpRequired: '',
    costConsiderations: '',
    therapeuticAlternatives: ''
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/patients/${patientId}/pharmacy-review`, 'POST', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Pharmacy review saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'consultation-records'] });
      setReviewData({
        drugInteractions: '',
        allergyCheck: '',
        dosageReview: '',
        contraindications: '',
        patientCounseling: '',
        medicationReconciliation: '',
        adherenceAssessment: '',
        sideEffectsMonitoring: '',
        pharmacistRecommendations: '',
        clinicalNotes: '',
        dispensingInstructions: '',
        followUpRequired: '',
        costConsiderations: '',
        therapeuticAlternatives: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save pharmacy review",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...reviewData,
      visitId,
      recordedAt: new Date().toISOString(),
      prescriptionsReviewed: prescriptions.length
    });
  };

  const updateField = (field: string, value: string) => {
    setReviewData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-orange-50 border-b border-orange-200">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Pill className="w-5 h-5" />
          Pharmacy Review & Counseling
          <Badge variant="outline" className="ml-auto bg-orange-100 text-orange-700">
            Patient #{patientId}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Current Prescriptions Summary */}
        {prescriptions.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Current Prescriptions Under Review</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {prescriptions.slice(0, 6).map((prescription: any) => (
                <div key={prescription.id} className="text-xs text-blue-700">
                  • {prescription.medicationName} - {prescription.dosage}
                </div>
              ))}
              {prescriptions.length > 6 && (
                <div className="text-xs text-blue-600">
                  +{prescriptions.length - 6} more prescriptions
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Safety Assessment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Safety Assessment
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drugInteractions" className="text-sm font-medium">Drug Interactions Check</Label>
                <Textarea
                  id="drugInteractions"
                  placeholder="Check for drug-drug, drug-food, drug-disease interactions..."
                  value={reviewData.drugInteractions}
                  onChange={(e) => updateField('drugInteractions', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="allergyCheck" className="text-sm font-medium">Allergy & Sensitivity Check</Label>
                <Textarea
                  id="allergyCheck"
                  placeholder="Review patient allergies against prescribed medications..."
                  value={reviewData.allergyCheck}
                  onChange={(e) => updateField('allergyCheck', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dosageReview" className="text-sm font-medium">Dosage Review</Label>
                <Textarea
                  id="dosageReview"
                  placeholder="Verify appropriate dosing based on age, weight, renal/hepatic function..."
                  value={reviewData.dosageReview}
                  onChange={(e) => updateField('dosageReview', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contraindications" className="text-sm font-medium">Contraindications</Label>
                <Textarea
                  id="contraindications"
                  placeholder="Review contraindications based on patient condition..."
                  value={reviewData.contraindications}
                  onChange={(e) => updateField('contraindications', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Clinical Review */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Clinical Review</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medicationReconciliation" className="text-sm font-medium">Medication Reconciliation</Label>
                <Textarea
                  id="medicationReconciliation"
                  placeholder="Compare current medications with previous records..."
                  value={reviewData.medicationReconciliation}
                  onChange={(e) => updateField('medicationReconciliation', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adherenceAssessment" className="text-sm font-medium">Adherence Assessment</Label>
                <Textarea
                  id="adherenceAssessment"
                  placeholder="Evaluate patient's ability to adhere to medication regimen..."
                  value={reviewData.adherenceAssessment}
                  onChange={(e) => updateField('adherenceAssessment', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sideEffectsMonitoring" className="text-sm font-medium">Side Effects Monitoring</Label>
                <Textarea
                  id="sideEffectsMonitoring"
                  placeholder="Parameters to monitor, warning signs to watch for..."
                  value={reviewData.sideEffectsMonitoring}
                  onChange={(e) => updateField('sideEffectsMonitoring', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="therapeuticAlternatives" className="text-sm font-medium">Therapeutic Alternatives</Label>
                <Textarea
                  id="therapeuticAlternatives"
                  placeholder="Alternative medications, generic options, cost-effective choices..."
                  value={reviewData.therapeuticAlternatives}
                  onChange={(e) => updateField('therapeuticAlternatives', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Patient Counseling */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Patient Counseling & Education
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientCounseling" className="text-sm font-medium">Counseling Provided</Label>
                <Textarea
                  id="patientCounseling"
                  placeholder="Information provided to patient about medications, administration, storage..."
                  value={reviewData.patientCounseling}
                  onChange={(e) => updateField('patientCounseling', e.target.value)}
                  rows={4}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dispensingInstructions" className="text-sm font-medium">Dispensing Instructions</Label>
                <Textarea
                  id="dispensingInstructions"
                  placeholder="Special handling, storage requirements, dispensing notes..."
                  value={reviewData.dispensingInstructions}
                  onChange={(e) => updateField('dispensingInstructions', e.target.value)}
                  rows={4}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Recommendations & Follow-up */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recommendations & Follow-up
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pharmacistRecommendations" className="text-sm font-medium">Pharmacist Recommendations</Label>
                <Textarea
                  id="pharmacistRecommendations"
                  placeholder="Clinical recommendations, therapy optimization suggestions..."
                  value={reviewData.pharmacistRecommendations}
                  onChange={(e) => updateField('pharmacistRecommendations', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="followUpRequired" className="text-sm font-medium">Follow-up Required</Label>
                <Textarea
                  id="followUpRequired"
                  placeholder="When to return, monitoring parameters, next review date..."
                  value={reviewData.followUpRequired}
                  onChange={(e) => updateField('followUpRequired', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="costConsiderations" className="text-sm font-medium">Cost Considerations</Label>
                <Input
                  id="costConsiderations"
                  placeholder="Insurance coverage, cost-saving options, financial assistance..."
                  value={reviewData.costConsiderations}
                  onChange={(e) => updateField('costConsiderations', e.target.value)}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clinicalNotes" className="text-sm font-medium">Additional Clinical Notes</Label>
                <Input
                  id="clinicalNotes"
                  placeholder="Other relevant pharmacy observations..."
                  value={reviewData.clinicalNotes}
                  onChange={(e) => updateField('clinicalNotes', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewData({
                drugInteractions: '',
                allergyCheck: '',
                dosageReview: '',
                contraindications: '',
                patientCounseling: '',
                medicationReconciliation: '',
                adherenceAssessment: '',
                sideEffectsMonitoring: '',
                pharmacistRecommendations: '',
                clinicalNotes: '',
                dispensingInstructions: '',
                followUpRequired: '',
                costConsiderations: '',
                therapeuticAlternatives: ''
              })}
            >
              Clear Form
            </Button>
            <Button 
              type="submit" 
              disabled={saveMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Review'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}