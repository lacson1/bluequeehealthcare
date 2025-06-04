import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Stethoscope,
  Target,
  Clock,
  User,
  Heart,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LabResult {
  id: number;
  orderItemId: number;
  value: string;
  units: string;
  referenceRange: string;
  status: string;
  notes?: string;
  testName?: string;
  category?: string;
}

interface AIAnalysis {
  summary: string;
  clinicalSignificance: string;
  recommendations: string[];
  riskFactors: string[];
  trends: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  followUpActions: string[];
}

interface LabResultPersonalityIntegrationProps {
  patientId: number;
  labResults: LabResult[];
  patientData: {
    firstName: string;
    lastName: string;
    age?: number;
    gender: string;
    medicalHistory?: string;
    allergies?: string;
  };
  onIntegrationComplete?: () => void;
}

export function LabResultPersonalityIntegration({
  patientId,
  labResults,
  patientData,
  onIntegrationComplete
}: LabResultPersonalityIntegrationProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<'pending' | 'analyzing' | 'reviewed' | 'integrated'>('pending');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [priorityLevel, setPriorityLevel] = useState<'routine' | 'urgent' | 'critical'>('routine');
  
  const queryClient = useQueryClient();

  const analyzeResultsMutation = useMutation({
    mutationFn: async () => {
      const analysisData = {
        patientId,
        labResults,
        patientData,
        clinicalContext: {
          age: patientData.age,
          gender: patientData.gender,
          medicalHistory: patientData.medicalHistory,
          allergies: patientData.allergies
        }
      };

      const response = await apiRequest('/api/lab-results/ai-analysis', {
        method: 'POST',
        body: analysisData,
      });

      return response;
    },
    onSuccess: (analysis) => {
      setAiAnalysis(analysis);
      setIntegrationStatus('analyzed');
      setShowAnalysisDialog(true);
      toast({
        title: "AI Analysis Complete",
        description: "Lab results have been analyzed with clinical insights generated.",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed", 
        description: "Failed to analyze lab results. Please try again.",
        variant: "destructive"
      });
    }
  });

  const integrateToRecordMutation = useMutation({
    mutationFn: async () => {
      const integrationData = {
        patientId,
        labResults,
        aiAnalysis,
        additionalNotes,
        priorityLevel,
        clinicalAssessment: {
          summary: aiAnalysis?.summary,
          recommendations: aiAnalysis?.recommendations,
          riskFactors: aiAnalysis?.riskFactors,
          urgencyLevel: aiAnalysis?.urgencyLevel,
          followUpActions: aiAnalysis?.followUpActions
        }
      };

      const response = await apiRequest('/api/patients/integrate-lab-results', {
        method: 'POST',
        body: integrationData,
      });

      return response;
    },
    onSuccess: () => {
      setIntegrationStatus('integrated');
      setShowAnalysisDialog(false);
      
      // Invalidate relevant queries to refresh patient data
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/visits`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/activity-trail`] });
      
      toast({
        title: "Integration Complete",
        description: "Lab results and AI insights have been added to patient record.",
        variant: "default"
      });

      onIntegrationComplete?.();
    },
    onError: (error) => {
      toast({
        title: "Integration Failed",
        description: "Failed to integrate results to patient record. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAnalyzeResults = () => {
    setIsAnalyzing(true);
    setIntegrationStatus('analyzing');
    analyzeResultsMutation.mutate();
  };

  const handleIntegrateToRecord = () => {
    integrateToRecordMutation.mutate();
  };

  const getUrgencyBadge = (level: string) => {
    const variants = {
      low: { variant: "secondary" as const, color: "text-green-600", icon: CheckCircle },
      medium: { variant: "outline" as const, color: "text-yellow-600", icon: Clock },
      high: { variant: "destructive" as const, color: "text-orange-600", icon: AlertTriangle },
      critical: { variant: "destructive" as const, color: "text-red-600", icon: AlertTriangle }
    };
    
    const config = variants[level as keyof typeof variants] || variants.low;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {level.toUpperCase()}
      </Badge>
    );
  };

  return (
    <>
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            AI-Powered Lab Result Integration
          </CardTitle>
          <CardDescription>
            Analyze lab results with AI insights and integrate findings into patient record
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-900">Lab Results</p>
              <p className="text-2xl font-bold text-blue-600">{labResults.length}</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-900">Patient</p>
              <p className="text-sm font-semibold text-green-600">
                {patientData.firstName} {patientData.lastName}
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-900">Status</p>
              <Badge variant={integrationStatus === 'integrated' ? 'default' : 'secondary'}>
                {integrationStatus.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Lab Results Summary</h4>
              <div className="space-y-2">
                {labResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{result.testName || 'Lab Test'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{result.value} {result.units}</span>
                      <Badge variant={result.status === 'abnormal' ? 'destructive' : 'secondary'} className="text-xs">
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleAnalyzeResults}
                disabled={analyzeResultsMutation.isPending || integrationStatus === 'integrated'}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {analyzeResultsMutation.isPending ? (
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                {analyzeResultsMutation.isPending ? 'Analyzing...' : 'Call Personality AI'}
              </Button>
              
              {aiAnalysis && (
                <Button 
                  variant="outline"
                  onClick={() => setShowAnalysisDialog(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Analysis
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              AI Clinical Analysis & Integration
            </DialogTitle>
            <DialogDescription>
              Review AI-generated insights and integrate findings into patient record
            </DialogDescription>
          </DialogHeader>

          {aiAnalysis && (
            <div className="space-y-6">
              {/* Urgency Level */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Urgency Assessment</span>
                </div>
                {getUrgencyBadge(aiAnalysis.urgencyLevel)}
              </div>

              {/* Clinical Summary */}
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-blue-500" />
                  Clinical Summary
                </h3>
                <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
                  {aiAnalysis.summary}
                </p>
              </div>

              {/* Clinical Significance */}
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Clinical Significance
                </h3>
                <p className="text-gray-700 bg-green-50 p-4 rounded-lg">
                  {aiAnalysis.clinicalSignificance}
                </p>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {aiAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 p-3 bg-purple-50 rounded">
                      <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risk Factors */}
              {aiAnalysis.riskFactors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Risk Factors
                  </h3>
                  <ul className="space-y-2">
                    {aiAnalysis.riskFactors.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up Actions */}
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Follow-up Actions
                </h3>
                <ul className="space-y-2">
                  {aiAnalysis.followUpActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2 p-3 bg-orange-50 rounded">
                      <Clock className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Integration Controls */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold text-lg">Integration Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={priorityLevel} onValueChange={(value: any) => setPriorityLevel(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Additional Clinical Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any additional clinical observations..."
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleIntegrateToRecord}
                    disabled={integrateToRecordMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {integrateToRecordMutation.isPending ? (
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Heart className="w-4 h-4 mr-2" />
                    )}
                    {integrateToRecordMutation.isPending ? 'Integrating...' : 'Integrate to Patient Record'}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setShowAnalysisDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}