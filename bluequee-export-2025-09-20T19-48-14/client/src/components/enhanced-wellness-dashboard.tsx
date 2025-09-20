import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MentalHealthSupport from '@/components/mental-health-support';
import { 
  Heart, 
  Activity, 
  Apple,
  Brain,
  Moon,
  Target,
  TrendingUp,
  Sparkles,
  Zap,
  Star,
  Award,
  Shield,
  Smile,
  Sun,
  CloudRain,
  Wind,
  Leaf,
  Flower,
  TreePine,
  Waves,
  Rainbow,
  Compass,
  Rocket,
  Gift,
  Music,
  Palette,
  Camera,
  Book,
  Coffee,
  Sunrise,
  Mountain
} from 'lucide-react';

interface EnhancedWellnessDashboardProps {
  wellnessScore: number;
  patientData: any;
}

export default function EnhancedWellnessDashboard({ wellnessScore, patientData }: EnhancedWellnessDashboardProps) {
  const [selectedMood, setSelectedMood] = useState('');
  const [mentalHealthMetrics, setMentalHealthMetrics] = useState({
    stressLevel: 3,
    sleepQuality: 7,
    moodRating: 8,
    anxietyLevel: 2,
    energyLevel: 6
  });

  // Enhanced wellness categories with mental health focus
  const wellnessCategories = [
    {
      name: 'Physical Health',
      score: wellnessScore,
      icon: Heart,
      color: 'from-red-400 to-pink-500',
      bgColor: 'bg-red-50',
      description: 'Cardiovascular fitness, strength, and mobility'
    },
    {
      name: 'Mental Wellness',
      score: Math.floor((mentalHealthMetrics.moodRating + (10 - mentalHealthMetrics.stressLevel) + (10 - mentalHealthMetrics.anxietyLevel)) / 3 * 10),
      icon: Brain,
      color: 'from-purple-400 to-indigo-500',
      bgColor: 'bg-purple-50',
      description: 'Emotional balance, stress management, and cognitive health'
    },
    {
      name: 'Nutrition',
      score: 82,
      icon: Apple,
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-50',
      description: 'Balanced diet, hydration, and nutritional awareness'
    },
    {
      name: 'Sleep Quality',
      score: mentalHealthMetrics.sleepQuality * 10,
      icon: Moon,
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'bg-blue-50',
      description: 'Rest patterns, sleep hygiene, and recovery'
    },
    {
      name: 'Activity Level',
      score: 76,
      icon: Activity,
      color: 'from-orange-400 to-amber-500',
      bgColor: 'bg-orange-50',
      description: 'Exercise routine, daily movement, and fitness goals'
    },
    {
      name: 'Life Balance',
      score: mentalHealthMetrics.energyLevel * 12,
      icon: Target,
      color: 'from-teal-400 to-cyan-500',
      bgColor: 'bg-teal-50',
      description: 'Work-life harmony, social connections, and personal fulfillment'
    }
  ];

  // Mental health mood tracking
  const moodOptions = [
    { emoji: '😄', label: 'Excellent', value: 'excellent', color: 'text-green-500' },
    { emoji: '😊', label: 'Good', value: 'good', color: 'text-blue-500' },
    { emoji: '😐', label: 'Neutral', value: 'neutral', color: 'text-yellow-500' },
    { emoji: '😔', label: 'Low', value: 'low', color: 'text-orange-500' },
    { emoji: '😢', label: 'Difficult', value: 'difficult', color: 'text-red-500' }
  ];

  // Mental health activities and resources
  const mentalHealthActivities = [
    {
      category: 'Mindfulness',
      icon: Leaf,
      activities: [
        { name: '5-Minute Breathing Exercise', duration: '5 min', type: 'guided' },
        { name: 'Body Scan Meditation', duration: '15 min', type: 'meditation' },
        { name: 'Gratitude Journaling', duration: '10 min', type: 'writing' },
        { name: 'Mindful Walking', duration: '20 min', type: 'movement' }
      ]
    },
    {
      category: 'Stress Relief',
      icon: Wind,
      activities: [
        { name: 'Progressive Muscle Relaxation', duration: '12 min', type: 'relaxation' },
        { name: 'Calming Music Therapy', duration: '30 min', type: 'audio' },
        { name: 'Stress Ball Exercise', duration: '5 min', type: 'physical' },
        { name: 'Deep Breathing Techniques', duration: '8 min', type: 'breathing' }
      ]
    },
    {
      category: 'Mood Boosting',
      icon: Smile,
      activities: [
        { name: 'Nature Photography', duration: '45 min', type: 'creative' },
        { name: 'Dance Movement', duration: '20 min', type: 'movement' },
        { name: 'Positive Affirmations', duration: '10 min', type: 'mental' },
        { name: 'Creative Arts & Crafts', duration: '60 min', type: 'creative' }
      ]
    },
    {
      category: 'Social Connection',
      icon: Heart,
      activities: [
        { name: 'Video Call with Loved Ones', duration: '30 min', type: 'social' },
        { name: 'Community Volunteer Work', duration: '2 hours', type: 'service' },
        { name: 'Group Exercise Class', duration: '45 min', type: 'group' },
        { name: 'Support Group Meeting', duration: '60 min', type: 'support' }
      ]
    }
  ];

  // Wellness achievements and goals
  const achievements = [
    { name: 'Week Warrior', description: '7 days of consistent wellness tracking', icon: Award, unlocked: true },
    { name: 'Mindful Master', description: '30 meditation sessions completed', icon: Brain, unlocked: true },
    { name: 'Sleep Champion', description: 'Maintained 8+ hours sleep for 2 weeks', icon: Moon, unlocked: false },
    { name: 'Nutrition Ninja', description: 'Met daily nutrition goals for 21 days', icon: Apple, unlocked: false },
    { name: 'Stress Slayer', description: 'Reduced stress levels by 50%', icon: Shield, unlocked: true },
    { name: 'Balance Guru', description: 'Achieved work-life balance score of 90+', icon: Target, unlocked: false }
  ];

  return (
    <div className="space-y-8">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-yellow-300 rounded-full animate-bounce delay-1000"></div>
          <div className="absolute bottom-20 left-32 w-12 h-12 bg-green-300 rounded-full animate-ping delay-500"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-blue-300 rounded-full animate-pulse delay-700"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Sparkles className="w-10 h-10 animate-pulse" />
                Your Wellness Journey
              </h1>
              <p className="text-xl opacity-90">Personalized insights for optimal health and happiness</p>
            </div>
            <div className="text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-2">
                  <span className="text-3xl font-bold">{wellnessScore}</span>
                </div>
                <Progress value={wellnessScore} className="w-24 h-2" />
              </div>
              <p className="text-sm mt-2 opacity-80">Wellness Score</p>
            </div>
          </div>
          
          {/* Quick Mood Check */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Smile className="w-5 h-5" />
              How are you feeling today?
            </h3>
            <div className="flex gap-3">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                    selectedMood === mood.value 
                      ? 'bg-white/30 scale-110' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="text-2xl mb-1">{mood.emoji}</div>
                  <div className="text-xs">{mood.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Wellness Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wellnessCategories.map((category, index) => {
          const IconComponent = category.icon;
          return (
            <Card 
              key={category.name} 
              className={`${category.bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 group cursor-pointer`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${category.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">{category.score}</div>
                    <div className="text-xs text-gray-600">Score</div>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                
                <div className="space-y-2">
                  <Progress 
                    value={category.score} 
                    className="h-2 bg-gray-200" 
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Current</span>
                    <span className="font-medium">{category.score}/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mental Health Focus Section */}
      <Tabs defaultValue="activities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-purple-100 to-pink-100">
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Mental Health Activities
          </TabsTrigger>
          <TabsTrigger value="mood-tracking" className="flex items-center gap-2">
            <Smile className="w-4 h-4" />
            Mood Tracking
          </TabsTrigger>
          <TabsTrigger value="clinical-support" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Clinical Support
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Wellness Goals
          </TabsTrigger>
        </TabsList>

        {/* Mental Health Activities */}
        <TabsContent value="activities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mentalHealthActivities.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Card key={category.category} className="border-purple-200 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardTitle className="flex items-center gap-3 text-purple-800">
                      <IconComponent className="w-5 h-5" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {category.activities.map((activity, actIndex) => (
                        <div 
                          key={actIndex}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors duration-300 cursor-pointer group"
                        >
                          <div>
                            <h4 className="font-medium text-gray-800 group-hover:text-purple-700">
                              {activity.name}
                            </h4>
                            <p className="text-sm text-gray-600">{activity.duration} • {activity.type}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Zap className="w-4 h-4 mr-1" />
                            Start
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Mood Tracking */}
        <TabsContent value="mood-tracking" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Smile className="w-5 h-5" />
                  Daily Mood Pattern
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                    const moodScore = Math.floor(Math.random() * 5) + 1;
                    const moodEmoji = ['😢', '😔', '😐', '😊', '😄'][moodScore - 1];
                    return (
                      <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{day}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{moodEmoji}</span>
                          <Progress value={moodScore * 20} className="w-24 h-2" />
                          <span className="text-sm font-medium">{moodScore}/5</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <TrendingUp className="w-5 h-5" />
                  Mental Health Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[
                    { name: 'Stress Level', value: mentalHealthMetrics.stressLevel, max: 10, inverse: true },
                    { name: 'Sleep Quality', value: mentalHealthMetrics.sleepQuality, max: 10 },
                    { name: 'Mood Rating', value: mentalHealthMetrics.moodRating, max: 10 },
                    { name: 'Anxiety Level', value: mentalHealthMetrics.anxietyLevel, max: 10, inverse: true },
                    { name: 'Energy Level', value: mentalHealthMetrics.energyLevel, max: 10 }
                  ].map((metric) => (
                    <div key={metric.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{metric.name}</span>
                        <span>{metric.value}/{metric.max}</span>
                      </div>
                      <Progress 
                        value={(metric.value / metric.max) * 100} 
                        className={`h-2 ${metric.inverse ? 'bg-red-100' : 'bg-green-100'}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const IconComponent = achievement.icon;
              return (
                <Card 
                  key={achievement.name}
                  className={`transition-all duration-300 hover:scale-105 ${
                    achievement.unlocked 
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-lg' 
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      achievement.unlocked 
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                        : 'bg-gray-300 text-gray-500'
                    }`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <h3 className={`font-semibold mb-2 ${achievement.unlocked ? 'text-orange-800' : 'text-gray-600'}`}>
                      {achievement.name}
                    </h3>
                    <p className={`text-sm ${achievement.unlocked ? 'text-orange-600' : 'text-gray-500'}`}>
                      {achievement.description}
                    </p>
                    {achievement.unlocked && (
                      <Badge className="mt-3 bg-yellow-500 text-yellow-900">
                        <Star className="w-3 h-3 mr-1" />
                        Unlocked!
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Clinical Mental Health Support */}
        <TabsContent value="clinical-support" className="space-y-6">
          <MentalHealthSupport patientId={patientData?.id} />
        </TabsContent>

        {/* Wellness Goals */}
        <TabsContent value="goals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-indigo-200">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="flex items-center gap-2 text-indigo-800">
                  <Target className="w-5 h-5" />
                  Current Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[
                    { goal: 'Exercise 4 times per week', progress: 75, target: '4 sessions', current: '3 sessions' },
                    { goal: 'Meditate daily for 10 minutes', progress: 60, target: '7 days', current: '4 days' },
                    { goal: 'Drink 8 glasses of water daily', progress: 90, target: '8 glasses', current: '7 glasses' },
                    { goal: 'Sleep 8 hours per night', progress: 85, target: '8 hours', current: '7.5 hours' }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-800">{item.goal}</h4>
                        <span className="text-sm text-indigo-600 font-medium">{item.progress}%</span>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Current: {item.current}</span>
                        <span>Target: {item.target}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-pink-200">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
                <CardTitle className="flex items-center gap-2 text-pink-800">
                  <Rocket className="w-5 h-5" />
                  Goal Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {[
                    { suggestion: 'Start a gratitude journal', benefit: 'Improves mental wellbeing', difficulty: 'Easy' },
                    { suggestion: 'Take a nature walk weekly', benefit: 'Reduces stress & anxiety', difficulty: 'Easy' },
                    { suggestion: 'Learn a new stress-relief technique', benefit: 'Better coping skills', difficulty: 'Medium' },
                    { suggestion: 'Join a social wellness group', benefit: 'Enhanced social support', difficulty: 'Medium' }
                  ].map((item, index) => (
                    <div key={index} className="p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 mb-1">{item.suggestion}</h4>
                          <p className="text-sm text-gray-600">{item.benefit}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.difficulty}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}