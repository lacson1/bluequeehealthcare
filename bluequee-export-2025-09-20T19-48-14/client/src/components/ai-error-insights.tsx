import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  Target,
  Shield,
  Activity,
  Lightbulb
} from "lucide-react";
import { format } from "date-fns";

interface AIInsight {
  summary: string;
  patterns: Array<{
    type: string;
    riskLevel: string;
    trend: string;
    impact: string;
  }>;
  predictions: Array<{
    riskLevel: string;
    likelihood: number;
    timeframe: string;
    description: string;
    recommendations: string[];
    affectedSystems: string[];
  }>;
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  systemHealth: {
    score: number;
    trend: string;
    riskFactors: string[];
  };
}

interface PredictiveInsight {
  riskLevel: string;
  likelihood: number;
  timeframe: string;
  description: string;
  recommendations: string[];
  affectedSystems: string[];
}

interface AIErrorInsightsProps {
  timeframe: string;
}

export default function AIErrorInsights({ timeframe }: AIErrorInsightsProps) {
  const [activeTab, setActiveTab] = useState("insights");

  const { data: insights, isLoading: insightsLoading, error: insightsError } = useQuery<AIInsight>({
    queryKey: ["/api/errors/ai-insights", timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/errors/ai-insights?timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch AI insights');
      }
      return response.json();
    },
    retry: false
  });

  const { data: predictions, isLoading: predictionsLoading } = useQuery<{ predictions: PredictiveInsight[] }>({
    queryKey: ["/api/errors/predictions"],
    queryFn: async () => {
      const response = await fetch('/api/errors/predictions');
      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }
      return response.json();
    },
    retry: false
  });

  // Fallback data when AI insights are unavailable
  const fallbackInsights: AIInsight = {
    summary: "Basic system monitoring active. AI insights require configuration.",
    patterns: [
      {
        type: "System Performance",
        riskLevel: "MEDIUM",
        trend: "stable",
        impact: "Monitor system resources and performance metrics",
        frequency: 0,
        severity: "medium",
        commonMessages: ["System monitoring active"],
        timePattern: "continuous",
        affectedComponents: ["monitoring"]
      }
    ],
    predictions: [
      {
        riskLevel: "LOW",
        likelihood: 15,
        timeframe: "next 24 hours",
        description: "System performance within normal parameters",
        recommendations: ["Continue monitoring", "Regular system maintenance"],
        affectedSystems: ["monitoring"]
      }
    ],
    recommendations: {
      immediate: ["Verify system monitoring is active", "Check error tracking configuration"],
      shortTerm: ["Configure AI insights with proper API keys", "Review system performance metrics"],
      longTerm: ["Implement predictive maintenance", "Enhance monitoring capabilities"]
    },
    systemHealth: {
      score: 75,
      trend: "stable",
      riskFactors: ["AI insights not configured"]
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'declining': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (insightsLoading || predictionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Analyzing error patterns...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insightsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to generate AI insights. Please check your configuration and try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI-Powered Error Insights
        </CardTitle>
        <CardDescription>
          Intelligent analysis and predictive recommendations for your system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="insights">Overview</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="recommendations">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-6">
            {/* System Health Score */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">System Health Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getHealthColor(insights?.systemHealth.score || 0)}`}>
                        {insights?.systemHealth.score || 0}
                      </span>
                      <span className="text-gray-500">/100</span>
                    </div>
                    {getTrendIcon(insights?.systemHealth.trend || 'stable')}
                  </div>
                  <Progress 
                    value={insights?.systemHealth.score || 0} 
                    className="mt-2" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">AI Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">
                    {insights?.summary || "Analyzing system patterns..."}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Risk Factors */}
            {insights?.systemHealth.riskFactors && insights.systemHealth.riskFactors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-orange-500" />
                    Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {insights.systemHealth.riskFactors.map((factor, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            {insights?.patterns && insights.patterns.length > 0 ? (
              insights.patterns.map((pattern, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{pattern.type}</CardTitle>
                      <Badge className={getRiskColor(pattern.riskLevel)}>
                        {pattern.riskLevel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div><strong>Trend:</strong> {pattern.trend}</div>
                      <div><strong>Impact:</strong> {pattern.impact}</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4" />
                <p>No significant error patterns detected</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            {predictions?.predictions && predictions.predictions.length > 0 ? (
              predictions.predictions.map((prediction, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        {prediction.timeframe}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getRiskColor(prediction.riskLevel)}>
                          {prediction.riskLevel}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {prediction.likelihood}% likely
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700">{prediction.description}</p>
                      
                      {prediction.affectedSystems.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Affected Systems:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prediction.affectedSystems.map((system, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {system}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {prediction.recommendations.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Recommendations:</span>
                          <ul className="mt-1 space-y-1">
                            {prediction.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4" />
                <p>No predictions available yet</p>
                <p className="text-xs">More data needed for accurate predictions</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            {insights?.recommendations && (
              <>
                {/* Immediate Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Immediate Actions
                    </CardTitle>
                    <CardDescription>
                      Actions that should be taken right now
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {insights.recommendations.immediate.length > 0 ? (
                      <ul className="space-y-2">
                        {insights.recommendations.immediate.map((action, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No immediate actions required</p>
                    )}
                  </CardContent>
                </Card>

                {/* Short-term Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Short-term Actions
                    </CardTitle>
                    <CardDescription>
                      Actions to take within the next week
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {insights.recommendations.shortTerm.length > 0 ? (
                      <ul className="space-y-2">
                        {insights.recommendations.shortTerm.map((action, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Clock className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No short-term actions identified</p>
                    )}
                  </CardContent>
                </Card>

                {/* Long-term Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-500" />
                      Long-term Improvements
                    </CardTitle>
                    <CardDescription>
                      Strategic improvements for system reliability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {insights.recommendations.longTerm.length > 0 ? (
                      <ul className="space-y-2">
                        {insights.recommendations.longTerm.map((action, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Lightbulb className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No long-term improvements suggested</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}