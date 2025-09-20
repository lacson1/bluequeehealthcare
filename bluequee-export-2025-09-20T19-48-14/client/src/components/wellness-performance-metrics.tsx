import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Heart, 
  Brain,
  Target,
  Users,
  Calendar,
  Award,
  Zap
} from 'lucide-react';

interface WellnessPerformanceMetricsProps {
  wellnessStats: {
    totalPatients: number;
    activeWellnessPlans: number;
    avgWellnessScore: number;
    improvementRate: number;
  };
}

export default function WellnessPerformanceMetrics({ wellnessStats }: WellnessPerformanceMetricsProps) {
  const performanceMetrics = [
    {
      title: 'Total Patients',
      value: wellnessStats.totalPatients,
      icon: Users,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      isPositive: true,
      description: 'Active patient wellness profiles'
    },
    {
      title: 'Active Plans',
      value: wellnessStats.activeWellnessPlans,
      icon: Calendar,
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
      change: '+8%',
      isPositive: true,
      description: 'Patients with wellness plans'
    },
    {
      title: 'Avg Wellness Score',
      value: wellnessStats.avgWellnessScore,
      icon: Heart,
      color: 'from-red-400 to-red-600',
      bgColor: 'bg-red-50',
      change: '+5%',
      isPositive: true,
      description: 'Overall health index'
    },
    {
      title: 'Improvement Rate',
      value: `${wellnessStats.improvementRate}%`,
      icon: TrendingUp,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      change: '+15%',
      isPositive: true,
      description: 'Patients showing progress'
    }
  ];

  const wellnessCategories = [
    {
      name: 'Physical Health',
      score: 82,
      patients: Math.floor(wellnessStats.totalPatients * 0.75),
      trend: 'up',
      color: 'bg-gradient-to-r from-red-100 to-pink-100'
    },
    {
      name: 'Mental Wellness',
      score: 78,
      patients: Math.floor(wellnessStats.totalPatients * 0.65),
      trend: 'up',
      color: 'bg-gradient-to-r from-purple-100 to-indigo-100'
    },
    {
      name: 'Nutrition',
      score: 75,
      patients: Math.floor(wellnessStats.totalPatients * 0.60),
      trend: 'down',
      color: 'bg-gradient-to-r from-green-100 to-emerald-100'
    },
    {
      name: 'Exercise',
      score: 70,
      patients: Math.floor(wellnessStats.totalPatients * 0.55),
      trend: 'up',
      color: 'bg-gradient-to-r from-orange-100 to-amber-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card 
              key={metric.title}
              className={`${metric.bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${metric.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex items-center space-x-1">
                    {metric.isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      metric.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
                  <div className="text-3xl font-bold text-gray-900">{metric.value}</div>
                  <p className="text-xs text-gray-500">{metric.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Wellness Categories Performance */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle className="flex items-center gap-3 text-indigo-800">
            <Activity className="w-6 h-6" />
            Wellness Categories Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wellnessCategories.map((category, index) => (
              <div 
                key={category.name}
                className={`p-6 rounded-2xl ${category.color} border border-gray-200 hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">{category.name}</h4>
                  <div className="flex items-center space-x-2">
                    {category.trend === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <Badge variant="outline" className="bg-white/80">
                      {category.patients} patients
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Score</span>
                    <span className="text-xl font-bold text-gray-800">{category.score}/100</span>
                  </div>
                  
                  <Progress 
                    value={category.score} 
                    className="h-3 bg-white/60"
                  />
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span className="font-medium">Target: 85+</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-3 text-green-800">
              <Award className="w-5 h-5" />
              Top Performing Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                { area: 'Physical Health Tracking', score: 92, improvement: '+18%' },
                { area: 'Mental Health Support', score: 88, improvement: '+12%' },
                { area: 'Preventive Care Adherence', score: 85, improvement: '+8%' },
                { area: 'Wellness Goal Achievement', score: 82, improvement: '+15%' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-800">{item.area}</h5>
                    <p className="text-sm text-green-600 font-medium">{item.improvement} improvement</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">{item.score}%</div>
                    <Progress value={item.score} className="w-16 h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="flex items-center gap-3 text-orange-800">
              <Target className="w-5 h-5" />
              Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                { area: 'Sleep Quality Improvement', current: 68, target: 85, priority: 'High' },
                { area: 'Stress Management Programs', current: 72, target: 85, priority: 'Medium' },
                { area: 'Nutrition Compliance', current: 75, target: 85, priority: 'Medium' },
                { area: 'Exercise Routine Consistency', current: 70, target: 85, priority: 'High' }
              ].map((item, index) => (
                <div key={index} className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-800">{item.area}</h5>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        item.priority === 'High' ? 'border-red-300 text-red-700' : 'border-yellow-300 text-yellow-700'
                      }`}
                    >
                      {item.priority}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current: {item.current}%</span>
                      <span className="text-gray-600">Target: {item.target}%</span>
                    </div>
                    <Progress value={item.current} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}