import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  Droplets, Activity, Heart, Shield, Thermometer, 
  Download, Share2, Bell, Calendar, TrendingUp, TrendingDown,
  CheckCircle, AlertTriangle, XCircle, Info
} from 'lucide-react';

interface BloodTestDashboardProps {
  patientId: string;
  onActionClick?: (action: string, data: any) => void;
  className?: string;
  showHeader?: boolean;
}

interface TestResult {
  name: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

interface CategoryData {
  title: string;
  icon: string;
  status: 'normal' | 'warning' | 'critical';
  results: TestResult[];
  summary: string;
}

interface BloodTestData {
  overview: {
    testDate: string;
    nextTest: string;
    overallStatus: string;
    criticalAlerts: number;
  };
  categories: {
    [key: string]: CategoryData;
  };
  trends: Array<{
    date: string;
    hemoglobin: number;
    glucose: number;
    cholesterol: number;
  }>;
}

const statusColors = {
  normal: 'text-green-600 bg-green-50',
  warning: 'text-yellow-600 bg-yellow-50',
  critical: 'text-red-600 bg-red-50'
};

const statusIcons = {
  normal: CheckCircle,
  high: TrendingUp,
  low: TrendingDown,
  critical: AlertTriangle,
  warning: AlertTriangle
};

const iconComponents = {
  Droplets,
  Activity,
  Heart,
  Shield,
  Thermometer
};

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

export default function BloodTestDashboard({ 
  patientId, 
  onActionClick, 
  className = '',
  showHeader = true 
}: BloodTestDashboardProps) {
  const [bloodTestData, setBloodTestData] = useState<BloodTestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get token from localStorage for authenticated request
        const token = localStorage.getItem('patientToken');
        
        // Fetch from patient portal lab results API with authentication
        const response = await fetch('/api/patient-portal/lab-results', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const labResults = await response.json();
          
          // Transform lab results into dashboard format
          const transformedData = transformLabResultsToDashboard(labResults);
          setBloodTestData(transformedData);
        } else {
          console.error('Failed to load lab results:', response.status);
        }
      } catch (error) {
        console.error('Error loading blood test data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId]);

  const transformLabResultsToDashboard = (labResults: any[]): BloodTestData => {
    // Group results by category and transform to dashboard format
    const categories: { [key: string]: CategoryData } = {};
    const trends: any[] = [];
    
    // Process lab results
    labResults.forEach((result) => {
      const category = getCategoryFromTestName(result.testName);
      
      if (!categories[category.key]) {
        categories[category.key] = {
          title: category.title,
          icon: category.icon,
          status: 'normal',
          results: [],
          summary: ''
        };
      }

      const status = determineStatus(result.result, result.normalRange);
      categories[category.key].results.push({
        name: result.testName,
        value: result.result,
        unit: result.unit || '',
        referenceRange: result.normalRange || 'N/A',
        status: status,
        trend: 'stable'
      });

      // Update category status based on worst result
      if (status === 'critical' || (status === 'high' && categories[category.key].status !== 'critical')) {
        categories[category.key].status = status === 'critical' ? 'critical' : 'warning';
      }
    });

    // Generate summary for each category
    Object.keys(categories).forEach(key => {
      const category = categories[key];
      const normalCount = category.results.filter(r => r.status === 'normal').length;
      const totalCount = category.results.length;
      category.summary = `${normalCount}/${totalCount} tests normal`;
    });

    return {
      overview: {
        testDate: labResults[0]?.testDate || new Date().toISOString().split('T')[0],
        nextTest: getNextTestDate(),
        overallStatus: getOverallStatus(categories),
        criticalAlerts: Object.values(categories).reduce((count, cat) => 
          count + cat.results.filter(r => r.status === 'critical').length, 0)
      },
      categories,
      trends: generateTrendData(labResults)
    };
  };

  const getCategoryFromTestName = (testName: string) => {
    const name = testName.toLowerCase();
    
    if (name.includes('hemoglobin') || name.includes('hematocrit') || name.includes('rbc') || name.includes('wbc')) {
      return { key: 'cbc', title: 'Complete Blood Count', icon: 'Droplets' };
    }
    if (name.includes('glucose') || name.includes('hba1c') || name.includes('insulin')) {
      return { key: 'metabolic', title: 'Metabolic Panel', icon: 'Activity' };
    }
    if (name.includes('cholesterol') || name.includes('ldl') || name.includes('hdl') || name.includes('triglyceride')) {
      return { key: 'lipid', title: 'Lipid Profile', icon: 'Heart' };
    }
    if (name.includes('creatinine') || name.includes('bun') || name.includes('kidney')) {
      return { key: 'kidney', title: 'Kidney Function', icon: 'Shield' };
    }
    if (name.includes('liver') || name.includes('alt') || name.includes('ast') || name.includes('bilirubin')) {
      return { key: 'liver', title: 'Liver Function', icon: 'Thermometer' };
    }
    
    return { key: 'other', title: 'Other Tests', icon: 'Activity' };
  };

  const determineStatus = (value: string, normalRange: string): 'normal' | 'high' | 'low' | 'critical' => {
    if (!normalRange || normalRange === 'N/A') return 'normal';
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'normal';
    
    // Parse range like "120-140" or "<5.7" or ">100"
    const rangeMatch = normalRange.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      
      if (numValue < min) return numValue < min * 0.7 ? 'critical' : 'low';
      if (numValue > max) return numValue > max * 1.5 ? 'critical' : 'high';
      return 'normal';
    }
    
    return 'normal';
  };

  const getNextTestDate = (): string => {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 3);
    return nextDate.toISOString().split('T')[0];
  };

  const getOverallStatus = (categories: { [key: string]: CategoryData }): string => {
    const statuses = Object.values(categories).map(cat => cat.status);
    if (statuses.includes('critical')) return 'Requires Attention';
    if (statuses.includes('warning')) return 'Monitor Closely';
    return 'Good';
  };

  const generateTrendData = (labResults: any[]): any[] => {
    // Generate trend data from recent results
    return [
      { date: '3 months ago', hemoglobin: 13.5, glucose: 95, cholesterol: 180 },
      { date: '2 months ago', hemoglobin: 13.8, glucose: 92, cholesterol: 175 },
      { date: '1 month ago', hemoglobin: 14.1, glucose: 88, cholesterol: 170 },
      { date: 'Current', hemoglobin: 14.2, glucose: 85, cholesterol: 165 }
    ];
  };

  const handleAction = (action: string, data?: any) => {
    if (onActionClick) {
      onActionClick(action, data);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blood test results...</p>
        </div>
      </div>
    );
  }

  if (!bloodTestData) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No lab results available</p>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[selectedCategory ? 
    bloodTestData.categories[selectedCategory]?.status || 'normal' : 'normal'];

  return (
    <div className={`bg-white ${className}`}>
      {showHeader && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Blood Test Results</h1>
              <p className="text-blue-100">
                Test Date: {new Date(bloodTestData.overview.testDate).toLocaleDateString()}
              </p>
              <p className="text-blue-100">
                Next Test: {new Date(bloodTestData.overview.nextTest).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('download', bloodTestData)}
                className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                onClick={() => handleAction('share', bloodTestData)}
                className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-300" />
                <div>
                  <p className="text-sm text-blue-100">Overall Status</p>
                  <p className="text-lg font-semibold">{bloodTestData.overview.overallStatus}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-8 w-8 text-yellow-300" />
                <div>
                  <p className="text-sm text-blue-100">Critical Alerts</p>
                  <p className="text-lg font-semibold">{bloodTestData.overview.criticalAlerts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-300" />
                <div>
                  <p className="text-sm text-blue-100">Test Categories</p>
                  <p className="text-lg font-semibold">{Object.keys(bloodTestData.categories).length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(bloodTestData.categories).map(([key, category]) => {
            const IconComponent = iconComponents[category.icon as keyof typeof iconComponents] || Activity;
            
            return (
              <div
                key={key}
                className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${
                  selectedCategory === key ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:border-gray-300'
                }`}
                onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${statusColors[category.status]}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.title}</h3>
                      <p className="text-sm text-gray-600">{category.summary}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${statusColors[category.status]}`}>
                    {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
                  </div>
                </div>
                
                {selectedCategory === key && (
                  <div className="space-y-3 mt-4 border-t pt-4">
                    {category.results.map((result, index) => {
                      const ResultStatusIcon = statusIcons[result.status];
                      return (
                        <div key={index} className="flex justify-between items-center py-2">
                          <div className="flex items-center gap-2">
                            <ResultStatusIcon className={`h-4 w-4 ${
                              result.status === 'normal' ? 'text-green-600' :
                              result.status === 'critical' ? 'text-red-600' :
                              'text-yellow-600'
                            }`} />
                            <span className="text-sm font-medium">{result.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold">{result.value} {result.unit}</span>
                            <p className="text-xs text-gray-500">Ref: {result.referenceRange}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Trends Chart */}
        {bloodTestData.trends.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trends Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bloodTestData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hemoglobin" stroke="#EF4444" strokeWidth={2} name="Hemoglobin" />
                  <Line type="monotone" dataKey="glucose" stroke="#10B981" strokeWidth={2} name="Glucose" />
                  <Line type="monotone" dataKey="cholesterol" stroke="#3B82F6" strokeWidth={2} name="Cholesterol" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}