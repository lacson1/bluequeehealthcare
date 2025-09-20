import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity,
  Lightbulb,
  Stethoscope
} from "lucide-react";

interface AIInsight {
  id: string;
  patientId: number;
  patientName: string;
  testName: string;
  result: string;
  status: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  interpretation: string;
  recommendations: string;
  followUpNeeded: boolean;
  additionalTests?: string[];
  createdAt: string;
}

interface CriticalAlert {
  id: string;
  patientName: string;
  testName: string;
  result: string;
  urgency: string;
  interpretation: string;
  timestamp: string;
}

export default function AILabInsightsDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  const { data: criticalAlerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['/api/lab-insights/critical'],
    enabled: false // We'll implement this endpoint
  });

  const { data: recentInsights = [], isLoading: loadingInsights } = useQuery({
    queryKey: ['/api/lab-insights/recent'],
    enabled: false // We'll implement this endpoint
  });

  // Mock data for demonstration
  const mockCriticalAlerts: CriticalAlert[] = [
    {
      id: '1',
      patientName: 'Dr. Amina Hassan',
      testName: 'Glucose (Fasting)',
      result: '145 mg/dL',
      urgency: 'high',
      interpretation: 'Elevated fasting glucose indicating possible diabetes or glucose intolerance',
      timestamp: '2 hours ago'
    },
    {
      id: '2', 
      patientName: 'Mr. Chinedu Okafor',
      testName: 'Creatinine',
      result: '2.8 mg/dL',
      urgency: 'critical',
      interpretation: 'Significantly elevated creatinine suggesting acute kidney injury',
      timestamp: '45 minutes ago'
    }
  ];

  const mockRecentInsights: AIInsight[] = [
    {
      id: '1',
      patientId: 12,
      patientName: 'Dr. Amina Hassan',
      testName: 'Complete Blood Count',
      result: 'WBC: 12,500/μL, RBC: 4.2M/μL, Hgb: 11.8 g/dL',
      status: 'abnormal',
      urgency: 'medium',
      interpretation: 'Mild leukocytosis with borderline anemia. Suggests possible infection or inflammatory process.',
      recommendations: 'Consider differential WBC count, reticulocyte count, and clinical correlation for infection source.',
      followUpNeeded: true,
      additionalTests: ['Blood Culture', 'C-Reactive Protein', 'Reticulocyte Count'],
      createdAt: '2025-06-04T21:30:00Z'
    },
    {
      id: '2',
      patientId: 13,
      patientName: 'Mr. Chinedu Okafor', 
      testName: 'Lipid Panel',
      result: 'Total Cholesterol: 280 mg/dL, LDL: 190 mg/dL, HDL: 35 mg/dL',
      status: 'abnormal',
      urgency: 'medium',
      interpretation: 'Significantly elevated cholesterol and LDL with low HDL indicating high cardiovascular risk.',
      recommendations: 'Initiate statin therapy, lifestyle modifications, and cardiovascular risk assessment.',
      followUpNeeded: true,
      additionalTests: ['HbA1c', 'Thyroid Function Tests'],
      createdAt: '2025-06-04T20:15:00Z'
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Brain className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">AI Lab Insights Dashboard</h2>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Powered by AI Analysis
        </Badge>
      </div>

      {/* Critical Alerts */}
      {mockCriticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Critical Lab Results Require Immediate Attention</AlertTitle>
          <AlertDescription className="text-red-700">
            {mockCriticalAlerts.length} patient(s) have critical lab values that need urgent clinical review.
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="critical">Critical Alerts</TabsTrigger>
          <TabsTrigger value="insights">Recent Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Results</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{mockCriticalAlerts.filter(a => a.urgency === 'critical').length}</div>
                <p className="text-xs text-muted-foreground">Requiring immediate action</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{mockCriticalAlerts.filter(a => a.urgency === 'high').length}</div>
                <p className="text-xs text-muted-foreground">Need clinical review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
                <Brain className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{mockRecentInsights.length}</div>
                <p className="text-xs text-muted-foreground">Generated today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
                <Stethoscope className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{mockRecentInsights.filter(i => i.followUpNeeded).length}</div>
                <p className="text-xs text-muted-foreground">Requiring follow-up</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Critical Alerts Tab */}
        <TabsContent value="critical" className="space-y-4">
          <div className="space-y-4">
            {mockCriticalAlerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getUrgencyIcon(alert.urgency)}
                      <CardTitle className="text-lg">{alert.patientName}</CardTitle>
                      <Badge className={getUrgencyColor(alert.urgency)}>
                        {alert.urgency.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">{alert.timestamp}</span>
                  </div>
                  <CardDescription>
                    <strong>{alert.testName}:</strong> {alert.result}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">AI Interpretation:</h4>
                      <p className="text-gray-700">{alert.interpretation}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        Contact Patient
                      </Button>
                      <Button size="sm" variant="outline">
                        Review Full Results
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recent Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {mockRecentInsights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{insight.patientName}</CardTitle>
                      <Badge className={getUrgencyColor(insight.urgency)}>
                        {insight.urgency}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(insight.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardDescription>
                    <strong>{insight.testName}:</strong> {insight.result}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Clinical Interpretation:</h4>
                    <p className="text-gray-700">{insight.interpretation}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Recommendations:</h4>
                    <p className="text-gray-700">{insight.recommendations}</p>
                  </div>

                  {insight.additionalTests && insight.additionalTests.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Suggested Additional Tests:</h4>
                      <div className="flex flex-wrap gap-2">
                        {insight.additionalTests.map((test, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                            {test}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {insight.followUpNeeded && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Follow-up required within 24-48 hours for optimal patient care.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lab Result Trends & Patterns</CardTitle>
              <CardDescription>
                AI-powered analysis of laboratory trends and patterns across your patient population
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Trend Analysis Coming Soon</h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  Advanced AI algorithms will analyze patterns in lab results to identify population health trends and early warning indicators.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}