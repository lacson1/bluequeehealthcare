import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  Activity,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Stethoscope,
  FileText,
  Zap,
  BarChart3,
  Lightbulb,
  Target,
  Clock,
  RefreshCw
} from "lucide-react";

interface ClinicalInsight {
  id: string;
  type: 'risk_assessment' | 'treatment_recommendation' | 'medication_interaction' | 'care_gap' | 'outcome_prediction';
  priority: 'critical' | 'high' | 'medium' | 'low';
  patientId: number;
  patientName: string;
  title: string;
  description: string;
  recommendations: string[];
  confidence: number;
  createdAt: string;
  status: 'new' | 'reviewed' | 'implemented' | 'dismissed';
}

interface PatientRiskProfile {
  patientId: number;
  patientName: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: {
    category: string;
    factor: string;
    severity: number;
    description: string;
  }[];
  predictedOutcomes: {
    condition: string;
    probability: number;
    timeframe: string;
  }[];
}

interface ClinicalMetrics {
  totalInsights: number;
  criticalAlerts: number;
  patientsAtRisk: number;
  avgConfidence: number;
  implementationRate: number;
  outcomeImprovement: number;
}

export default function AIClinicalInsights() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ["/api/ai/clinical-insights"],
    refetchInterval: 30000
  });

  const { data: riskProfiles = [] } = useQuery({
    queryKey: ["/api/ai/risk-profiles"]
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/ai/clinical-metrics"]
  });

  // Mutations
  const updateInsightMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/ai/insights/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("Failed to update insight");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/clinical-insights"] });
      toast({ title: "Insight Updated", description: "Status has been updated successfully." });
    }
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to generate insights");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/clinical-insights"] });
      toast({ title: "Insights Generated", description: "New AI insights have been generated." });
    }
  });

  // Filter insights
  const filteredInsights = insights.filter((insight: ClinicalInsight) => {
    const matchesType = filterType === "all" || insight.type === filterType;
    const matchesPriority = filterPriority === "all" || insight.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || insight.status === filterStatus;
    const matchesSearch = searchTerm === "" || 
      insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insight.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insight.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesPriority && matchesStatus && matchesSearch;
  });

  // Priority colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "risk_assessment": return <AlertTriangle className="h-4 w-4" />;
      case "treatment_recommendation": return <Stethoscope className="h-4 w-4" />;
      case "medication_interaction": return <Zap className="h-4 w-4" />;
      case "care_gap": return <Target className="h-4 w-4" />;
      case "outcome_prediction": return <TrendingUp className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Clinical Insights
          </h1>
          <p className="text-gray-600 mt-1">AI-powered clinical decision support and patient risk analysis</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries()}
            disabled={generateInsightsMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => generateInsightsMutation.mutate()}
            disabled={generateInsightsMutation.isPending}
          >
            <Brain className="h-4 w-4 mr-2" />
            Generate Insights
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Insights</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalInsights}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.criticalAlerts}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Patients at Risk</p>
                  <p className="text-2xl font-bold text-orange-600">{metrics.patientsAtRisk}</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.avgConfidence}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Implementation</p>
                  <p className="text-2xl font-bold text-purple-600">{metrics.implementationRate}%</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Improvement</p>
                  <p className="text-2xl font-bold text-indigo-600">{metrics.outcomeImprovement}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Insights Dashboard
          </TabsTrigger>
          <TabsTrigger value="risk-profiles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Risk Profiles
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Insights Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center flex-wrap">
            <Input
              placeholder="Search insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                <SelectItem value="treatment_recommendation">Treatment</SelectItem>
                <SelectItem value="medication_interaction">Medication</SelectItem>
                <SelectItem value="care_gap">Care Gap</SelectItem>
                <SelectItem value="outcome_prediction">Prediction</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Insights List */}
          <div className="space-y-4">
            {insightsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredInsights.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No insights found</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => generateInsightsMutation.mutate()}
                    disabled={generateInsightsMutation.isPending}
                  >
                    Generate AI Insights
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredInsights.map((insight: ClinicalInsight) => (
                <Card key={insight.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getTypeIcon(insight.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <p className="text-sm text-gray-600">Patient: {insight.patientName}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(insight.priority)}>
                          {insight.priority}
                        </Badge>
                        <Badge variant="outline">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-gray-700">{insight.description}</p>
                      
                      {insight.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Recommendations:
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            {insight.recommendations.map((rec, index) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {new Date(insight.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          {insight.status === 'new' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateInsightMutation.mutate({ id: insight.id, status: 'reviewed' })}
                              >
                                Mark Reviewed
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => updateInsightMutation.mutate({ id: insight.id, status: 'implemented' })}
                              >
                                Implement
                              </Button>
                            </>
                          )}
                          {insight.status === 'reviewed' && (
                            <Button 
                              size="sm"
                              onClick={() => updateInsightMutation.mutate({ id: insight.id, status: 'implemented' })}
                            >
                              Implement
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => updateInsightMutation.mutate({ id: insight.id, status: 'dismissed' })}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Risk Profiles */}
        <TabsContent value="risk-profiles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riskProfiles.map((profile: PatientRiskProfile) => (
              <Card key={profile.patientId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{profile.patientName}</CardTitle>
                      <p className="text-sm text-gray-600">Patient ID: {profile.patientId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getRiskColor(profile.overallRisk)}`}></div>
                      <Badge className={getPriorityColor(profile.overallRisk)}>
                        {profile.overallRisk} risk
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Risk Factors:</h4>
                      <div className="space-y-1">
                        {profile.riskFactors.slice(0, 3).map((factor, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">{factor.factor}</span>
                            <Badge variant="outline" className="text-xs">
                              {factor.severity}/10
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Predicted Outcomes:</h4>
                      <div className="space-y-1">
                        {profile.predictedOutcomes.slice(0, 2).map((outcome, index) => (
                          <div key={index} className="text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-700">{outcome.condition}</span>
                              <span className="font-medium">{outcome.probability}%</span>
                            </div>
                            <p className="text-xs text-gray-500">{outcome.timeframe}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Insight Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Risk Assessments</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Treatment Recommendations</span>
                    <span className="font-medium">30%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medication Interactions</span>
                    <span className="font-medium">15%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Care Gaps</span>
                    <span className="font-medium">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Implementation Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Critical Priority</span>
                    <span className="font-medium text-green-600">95%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">High Priority</span>
                    <span className="font-medium text-green-600">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medium Priority</span>
                    <span className="font-medium text-yellow-600">65%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low Priority</span>
                    <span className="font-medium text-gray-600">45%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}