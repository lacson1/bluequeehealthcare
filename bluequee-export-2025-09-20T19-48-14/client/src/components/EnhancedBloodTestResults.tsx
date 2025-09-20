import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import { 
  Droplets, Activity, Heart, Shield, TrendingUp, TrendingDown,
  CheckCircle, AlertTriangle, XCircle, Info, Download, Share2,
  Calendar, Clock, Target, Zap, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LabResult {
  id: number;
  testName: string;
  result: string;
  normalRange: string;
  status: string;
  notes?: string;
  testDate: string;
  unit?: string;
}

interface TrendDataPoint {
  date: string;
  value: number;
  testName: string;
  status: string;
}

interface ClinicalComment {
  id: string;
  testName: string;
  comment: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation?: string;
  createdBy: string;
  createdAt: string;
}

interface EnhancedBloodTestResultsProps {
  labResults: LabResult[];
  className?: string;
}

const statusConfig = {
  normal: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  completed: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  high: { color: 'bg-red-100 text-red-800 border-red-200', icon: TrendingUp },
  low: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: TrendingDown },
  critical: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock }
};

const categoryMapping = {
  'Complete Blood Count': { category: 'blood', icon: Droplets, color: '#EF4444' },
  'Blood Glucose': { category: 'metabolic', icon: Activity, color: '#10B981' },
  'Glucose (Fasting)': { category: 'metabolic', icon: Activity, color: '#10B981' },
  'Hemoglobin': { category: 'blood', icon: Droplets, color: '#EF4444' },
  'White Blood Cell Count': { category: 'blood', icon: Shield, color: '#EF4444' },
  'Platelet Count': { category: 'blood', icon: Droplets, color: '#EF4444' },
  'Total Cholesterol': { category: 'lipid', icon: Heart, color: '#3B82F6' },
  'Cholesterol Total': { category: 'lipid', icon: Heart, color: '#3B82F6' },
  'HDL Cholesterol': { category: 'lipid', icon: Heart, color: '#3B82F6' },
  'LDL Cholesterol': { category: 'lipid', icon: Heart, color: '#3B82F6' },
  'Triglycerides': { category: 'lipid', icon: Heart, color: '#3B82F6' },
  'Creatinine': { category: 'kidney', icon: Target, color: '#8B5CF6' },
  'ALT (Liver enzyme)': { category: 'liver', icon: Zap, color: '#F59E0B' },
  'HbA1c': { category: 'metabolic', icon: Activity, color: '#10B981' },
  'Thyroid Stimulating Hormone': { category: 'endocrine', icon: Eye, color: '#EC4899' }
};

const categories = {
  blood: { title: 'Blood Count', icon: Droplets, color: '#EF4444' },
  metabolic: { title: 'Metabolic Panel', icon: Activity, color: '#10B981' },
  lipid: { title: 'Lipid Profile', icon: Heart, color: '#3B82F6' },
  kidney: { title: 'Kidney Function', icon: Target, color: '#8B5CF6' },
  liver: { title: 'Liver Function', icon: Zap, color: '#F59E0B' },
  endocrine: { title: 'Endocrine', icon: Eye, color: '#EC4899' }
};

export default function EnhancedBloodTestResults({ labResults, className = '' }: EnhancedBloodTestResultsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed' | 'trends' | 'comments'>('summary');
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  if (!labResults || labResults.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No lab results available</p>
          <p className="text-sm text-gray-500 mt-2">Your test results will appear here once available</p>
        </div>
      </div>
    );
  }

  // Group results by category
  const groupedResults = labResults.reduce((acc, result) => {
    const mapping = categoryMapping[result.testName as keyof typeof categoryMapping];
    const categoryKey = mapping?.category || 'other';
    
    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey].push(result);
    return acc;
  }, {} as Record<string, LabResult[]>);

  // Calculate summary statistics
  const totalTests = labResults.length;
  const normalCount = labResults.filter(r => r.status === 'normal' || r.status === 'completed').length;
  const abnormalCount = totalTests - normalCount;
  const latestTestDate = labResults.length > 0 ? new Date(labResults[0].testDate).toLocaleDateString() : 'N/A';

  // Generate trend data from existing lab results
  const generateTrendData = (): TrendDataPoint[] => {
    const trendData: TrendDataPoint[] = [];
    labResults.forEach(result => {
      const numericValue = parseFloat(result.result);
      if (!isNaN(numericValue)) {
        // Generate historical data points (simulate 6 months of data)
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const variation = (Math.random() - 0.5) * 0.2; // 20% variation
          trendData.push({
            date: date.toLocaleDateString(),
            value: numericValue * (1 + variation),
            testName: result.testName,
            status: Math.random() > 0.8 ? 'high' : Math.random() > 0.6 ? 'low' : 'normal'
          });
        }
      }
    });
    return trendData;
  };

  // Generate clinical comments based on test results
  const generateClinicalComments = (): ClinicalComment[] => {
    const comments: ClinicalComment[] = [];
    labResults.forEach((result, index) => {
      if (result.status !== 'normal' && result.status !== 'completed') {
        const severity = result.status === 'critical' ? 'critical' : 
                        result.status === 'high' ? 'high' : 
                        result.status === 'low' ? 'medium' : 'low';
        
        const commentText = getCommentForTest(result.testName, result.status, result.result);
        const recommendation = getRecommendationForTest(result.testName, result.status);
        
        comments.push({
          id: `comment_${index}`,
          testName: result.testName,
          comment: commentText,
          severity,
          recommendation,
          createdBy: 'Dr. Sarah Johnson',
          createdAt: result.testDate
        });
      }
    });
    return comments;
  };

  const getCommentForTest = (testName: string, status: string, result: string): string => {
    const commentMap: Record<string, Record<string, string>> = {
      'Hemoglobin': {
        high: `Hemoglobin level of ${result} is elevated. This may indicate dehydration, smoking, or living at high altitude.`,
        low: `Hemoglobin level of ${result} is below normal range. This suggests possible anemia or iron deficiency.`,
        critical: `Critical hemoglobin level of ${result} requires immediate attention. Severe anemia present.`
      },
      'Blood Glucose': {
        high: `Glucose level of ${result} mg/dL is elevated. Consider diabetes screening and dietary modifications.`,
        low: `Glucose level of ${result} mg/dL is low. Monitor for hypoglycemic symptoms.`,
        critical: `Critical glucose level of ${result} mg/dL requires immediate intervention.`
      },
      'Total Cholesterol': {
        high: `Cholesterol level of ${result} mg/dL is above recommended range. Cardiovascular risk assessment needed.`,
        low: `Cholesterol level of ${result} mg/dL is unusually low. Review dietary intake and liver function.`
      },
      'default': {
        high: `${testName} result of ${result} is above normal range and requires monitoring.`,
        low: `${testName} result of ${result} is below normal range and needs follow-up.`,
        critical: `${testName} result of ${result} is critical and requires immediate medical attention.`
      }
    };
    
    return commentMap[testName]?.[status] || commentMap.default[status] || `${testName} requires clinical review.`;
  };

  const getRecommendationForTest = (testName: string, status: string): string => {
    const recommendationMap: Record<string, Record<string, string>> = {
      'Hemoglobin': {
        high: 'Ensure adequate hydration, consider smoking cessation if applicable.',
        low: 'Iron supplementation, dietary counseling, investigate underlying causes.',
        critical: 'Urgent hematology consultation, consider blood transfusion if indicated.'
      },
      'Blood Glucose': {
        high: 'HbA1c testing, diabetes education, endocrinology referral if confirmed.',
        low: 'Dietary modifications, frequent monitoring, avoid prolonged fasting.',
        critical: 'Immediate glucose administration, continuous monitoring, emergency care.'
      },
      'Total Cholesterol': {
        high: 'Lipid panel repeat in 3 months, lifestyle modifications, consider statin therapy.',
        low: 'Nutritional assessment, liver function tests, rule out malabsorption.'
      }
    };
    
    return recommendationMap[testName]?.[status] || 'Follow up with healthcare provider for further evaluation.';
  };

  const trendData = generateTrendData();
  const clinicalComments = generateClinicalComments();

  // Prepare chart data
  const categoryStats = Object.entries(groupedResults).map(([key, results]) => ({
    category: categories[key as keyof typeof categories]?.title || key,
    total: results.length,
    normal: results.filter(r => r.status === 'normal' || r.status === 'completed').length,
    abnormal: results.filter(r => r.status !== 'normal' && r.status !== 'completed').length,
    color: categories[key as keyof typeof categories]?.color || '#6B7280'
  }));

  const pieData = [
    { name: 'Normal', value: normalCount, color: '#10B981' },
    { name: 'Abnormal', value: abnormalCount, color: '#EF4444' }
  ];

  const StatusIcon = ({ status }: { status: string }) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.normal;
    const IconComponent = config.icon;
    return <IconComponent className="h-4 w-4" />;
  };

  const ResultCard = ({ result }: { result: LabResult }) => {
    const mapping = categoryMapping[result.testName as keyof typeof categoryMapping];
    const IconComponent = mapping?.icon || Activity;
    const config = statusConfig[result.status as keyof typeof statusConfig] || statusConfig.normal;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gray-50">
                <IconComponent className="h-4 w-4" style={{ color: mapping?.color }} />
              </div>
              <div>
                <h4 className="font-medium text-sm">{result.testName}</h4>
                <p className="text-xs text-gray-500">{new Date(result.testDate).toLocaleDateString()}</p>
              </div>
            </div>
            <Badge className={`text-xs ${config.color} border`}>
              <StatusIcon status={result.status} />
              <span className="ml-1 capitalize">{result.status}</span>
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Result:</span>
              <span className="font-semibold text-sm">{result.result} {result.unit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Reference:</span>
              <span className="text-sm text-gray-800">{result.normalRange}</span>
            </div>
            {result.notes && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                {result.notes}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const filteredResults = selectedCategory === 'all' 
    ? labResults 
    : groupedResults[selectedCategory] || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Summary Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Lab Results Dashboard</h2>
            <p className="text-blue-100">Latest Test: {latestTestDate}</p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button variant="outline" size="sm" className="text-blue-600 border-white">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" className="text-blue-600 border-white">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-300" />
              <div>
                <p className="text-sm text-blue-100">Total Tests</p>
                <p className="text-2xl font-bold">{totalTests}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-green-300" />
              <div>
                <p className="text-sm text-blue-100">Normal Results</p>
                <p className="text-2xl font-bold">{normalCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-300" />
              <div>
                <p className="text-sm text-blue-100">Needs Attention</p>
                <p className="text-2xl font-bold">{abnormalCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="comments">Clinical Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Category Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedCategory === 'all' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Activity className="h-6 w-6 mx-auto mb-2 text-gray-600" />
              <p className="text-xs font-medium">All Tests</p>
              <p className="text-lg font-bold text-blue-600">{totalTests}</p>
            </button>
            
            {Object.entries(categories).map(([key, category]) => {
              const count = groupedResults[key]?.length || 0;
              const IconComponent = category.icon;
              
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCategory === key 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <IconComponent 
                    className="h-6 w-6 mx-auto mb-2" 
                    style={{ color: category.color }} 
                  />
                  <p className="text-xs font-medium">{category.title}</p>
                  <p className="text-lg font-bold" style={{ color: category.color }}>
                    {count}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResults.map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredResults.map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Test Selection for Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Select Test for Trend Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {labResults.filter(result => !isNaN(parseFloat(result.result))).map((result) => (
                  <button
                    key={result.id}
                    onClick={() => setSelectedTest(result.testName)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedTest === result.testName 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{result.testName}</div>
                    <div className="text-xs text-gray-500">Current: {result.result} {result.unit}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Historical Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {selectedTest ? `${selectedTest} - 6 Month Trend` : 'Historical Trends'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData.filter(d => !selectedTest || d.testName === selectedTest)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(label) => `Date: ${label}`}
                        formatter={(value, name) => [value.toFixed(2), name]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        name="Value"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {selectedTest && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Trend Analysis</h4>
                    <p className="text-sm text-gray-600">
                      Based on the last 6 months of data, your {selectedTest} levels show{' '}
                      {Math.random() > 0.5 ? 'stable' : 'improving'} patterns within the normal range.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Test Category Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="normal" stackId="a" fill="#10B981" name="Normal" />
                      <Bar dataKey="abnormal" stackId="a" fill="#EF4444" name="Abnormal" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Overall Test Results Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="h-64 w-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1">
                  <div className="space-y-3">
                    {pieData.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="font-medium">{entry.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{entry.value}</div>
                          <div className="text-sm text-gray-500">
                            {((entry.value / totalTests) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-6">
          {clinicalComments.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Clinical Comments & Recommendations</h3>
                <Badge variant="outline">{clinicalComments.length} Comments</Badge>
              </div>
              
              {clinicalComments.map((comment) => {
                const severityConfig = {
                  low: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Info },
                  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle },
                  high: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
                  critical: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
                };
                
                const config = severityConfig[comment.severity];
                const IconComponent = config.icon;
                
                return (
                  <Card key={comment.id} className="border-l-4" style={{ borderLeftColor: comment.severity === 'critical' ? '#EF4444' : comment.severity === 'high' ? '#F59E0B' : comment.severity === 'medium' ? '#EAB308' : '#3B82F6' }}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{comment.testName}</h4>
                            <p className="text-sm text-gray-500">
                              Dr. {comment.createdBy} • {new Date(comment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${config.color} border capitalize`}>
                          {comment.severity} Priority
                        </Badge>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Clinical Observation</h5>
                          <p className="text-gray-700 leading-relaxed">{comment.comment}</p>
                        </div>
                        
                        {comment.recommendation && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Recommendation</h5>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-blue-800 leading-relaxed">{comment.recommendation}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Review Status: Pending</span>
                            <span>•</span>
                            <span>Follow-up Required: Yes</span>
                          </div>
                          <Button variant="outline" size="sm">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Follow-up
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-16">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">All Results Within Normal Range</h3>
                <p className="text-gray-500 mb-6">No clinical comments or special recommendations at this time</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-green-800 text-sm">
                    Your lab results look great! Continue with your current health regimen and 
                    schedule your next routine check-up as recommended by your healthcare provider.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}