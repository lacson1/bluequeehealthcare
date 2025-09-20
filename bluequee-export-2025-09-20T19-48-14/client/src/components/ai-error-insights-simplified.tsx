import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target
} from "lucide-react";

interface AIErrorInsightsProps {
  timeframe: string;
}

export default function AIErrorInsights({ timeframe }: AIErrorInsightsProps) {
  const [activeTab, setActiveTab] = useState("insights");

  const { data: insights, isLoading, error } = useQuery({
    queryKey: ["/api/errors/ai-insights", timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/errors/ai-insights?timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('API unavailable');
      }
      return response.json();
    },
    retry: false
  });

  // Fallback insights when API is unavailable
  const fallbackData = {
    systemHealth: {
      score: 85,
      trend: "stable",
      riskFactors: ["System monitoring active"]
    },
    summary: "Error monitoring system is active. AI insights require configuration to provide advanced analysis.",
    patterns: [
      {
        type: "System Performance",
        riskLevel: "LOW",
        trend: "stable",
        impact: "System operating within normal parameters",
        frequency: 0,
        severity: "info",
        commonMessages: ["System monitoring active"],
        timePattern: "continuous",
        affectedComponents: ["monitoring"]
      }
    ],
    recommendations: {
      immediate: [
        "Verify error tracking is working correctly",
        "Check system performance metrics"
      ],
      shortTerm: [
        "Configure AI insights with proper credentials",
        "Review system error patterns regularly"
      ],
      longTerm: [
        "Implement predictive maintenance workflows",
        "Enhance monitoring coverage"
      ]
    }
  };

  const currentData = insights || fallbackData;

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Powered Error Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2">Loading insights...</span>
          </div>
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
          {error ? "Basic system monitoring active" : "Intelligent analysis and recommendations"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              AI insights API unavailable. Showing basic system status.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">Overview</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
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
                      <span className={`text-2xl font-bold ${getHealthColor(currentData.systemHealth.score)}`}>
                        {currentData.systemHealth.score}
                      </span>
                      <span className="text-gray-500">/100</span>
                    </div>
                    {getTrendIcon(currentData.systemHealth.trend)}
                  </div>
                  <Progress 
                    value={currentData.systemHealth.score} 
                    className="mt-3" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Risk Factors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentData.systemHealth.riskFactors.slice(0, 3).map((factor: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        {factor}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">System Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{currentData.summary}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            {currentData.patterns && currentData.patterns.length > 0 ? (
              currentData.patterns.map((pattern: any, index: number) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{pattern.type}</h4>
                          <Badge className={getRiskColor(pattern.riskLevel)}>
                            {pattern.riskLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{pattern.impact}</p>
                        <div className="text-xs text-gray-500">
                          Pattern: {pattern.timePattern} | Trend: {pattern.trend}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No significant error patterns detected</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Immediate Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentData.recommendations.immediate.map((action: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        {action}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    Short-term Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentData.recommendations.shortTerm.map((action: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                        {action}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    Long-term Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentData.recommendations.longTerm.map((action: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        {action}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}