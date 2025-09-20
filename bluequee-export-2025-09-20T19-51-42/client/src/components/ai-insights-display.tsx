import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Brain, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface AIAnalysis {
  summary: string;
  systemHealth: {
    score: number;
    trend: string;
    riskFactors: string[];
  };
  patterns: string[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  predictions: string[];
}

interface AIInsightsResponse {
  success: boolean;
  aiAnalysis: AIAnalysis;
  timestamp: string;
  model: string;
  error?: string;
  details?: string;
}

export function AIInsightsDisplay() {
  const [insights, setInsights] = useState<AIInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAIInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai-analysis');
      const data = await response.json();
      
      if (data.success) {
        setInsights(data);
      } else {
        setError(data.error || 'AI analysis failed');
      }
    } catch (err) {
      setError('Failed to fetch AI insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIInsights();
  }, []);

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Analyzing errors with AI...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button onClick={fetchAIInsights} className="ml-2" size="sm">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!insights) {
    return (
      <Alert>
        <AlertDescription>
          No AI insights available
          <Button onClick={fetchAIInsights} className="ml-2" size="sm">
            Generate Insights
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const { aiAnalysis } = insights;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Error Analysis
          </CardTitle>
          <CardDescription>
            Intelligent insights powered by Claude Sonnet 4.0 • Generated {new Date(insights.timestamp).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{aiAnalysis.summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            System Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-3xl font-bold ${getHealthScoreColor(aiAnalysis.systemHealth.score)}`}>
              {aiAnalysis.systemHealth.score}/100
            </div>
            <Badge className={getHealthScoreBadge(aiAnalysis.systemHealth.score)}>
              {aiAnalysis.systemHealth.trend}
            </Badge>
          </div>
          
          {aiAnalysis.systemHealth.riskFactors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Risk Factors:</h4>
              <ul className="space-y-1">
                {aiAnalysis.systemHealth.riskFactors.map((factor, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {aiAnalysis.patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Error Patterns Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {aiAnalysis.patterns.map((pattern, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  {pattern}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiAnalysis.recommendations.immediate.length > 0 && (
            <div>
              <Badge variant="destructive" className="mb-2">Immediate Actions</Badge>
              <ul className="space-y-1">
                {aiAnalysis.recommendations.immediate.map((rec, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-500 mt-1 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aiAnalysis.recommendations.shortTerm.length > 0 && (
            <div>
              <Badge variant="secondary" className="mb-2">Short-term Improvements</Badge>
              <ul className="space-y-1">
                {aiAnalysis.recommendations.shortTerm.map((rec, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-yellow-500 mt-1 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aiAnalysis.recommendations.longTerm.length > 0 && (
            <div>
              <Badge variant="outline" className="mb-2">Long-term Strategy</Badge>
              <ul className="space-y-1">
                {aiAnalysis.recommendations.longTerm.map((rec, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <TrendingUp className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {aiAnalysis.predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Predictive Insights</CardTitle>
            <CardDescription>AI predictions for the next 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {aiAnalysis.predictions.map((prediction, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <Brain className="h-3 w-3 text-purple-500 mt-1 flex-shrink-0" />
                  {prediction}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button onClick={fetchAIInsights} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
          Refresh AI Analysis
        </Button>
      </div>
    </div>
  );
}