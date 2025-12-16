import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Brain, Target, Zap, Clock, Download, ExternalLink, Printer, BookOpen, FileText, Heart, Sparkles, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface PsychologicalTherapyAssessmentProps {
  patientId: number;
  visitId?: number;
  onSuccess?: () => void;
}

export default function PsychologicalTherapyAssessment({ patientId, visitId, onSuccess }: PsychologicalTherapyAssessmentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sessionData, setSessionData] = useState({
    sessionType: '',
    therapyType: '',
    sessionFocus: '',
    presentingConcerns: '',
    moodAssessment: '',
    anxietyLevel: '',
    stressLevel: '',
    sleepQuality: '',
    copingStrategies: '',
    interventionsUsed: '',
    homeworkAssigned: '',
    progressNotes: '',
    goals: '',
    nextSession: '',
    sessionDuration: '',
    riskAssessment: '',
    safetyPlan: '',
    referrals: '',
    sessionOutcome: ''
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/patients/${patientId}/psychological-therapy-session`, 'POST', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Psychological therapy session saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/consultation-records`] });
      queryClient.invalidateQueries({ queryKey: ['/api/consultation-records'] });
      if (onSuccess) {
        onSuccess();
      }
      setSessionData({
        sessionType: '',
        therapyType: '',
        sessionFocus: '',
        presentingConcerns: '',
        moodAssessment: '',
        anxietyLevel: '',
        stressLevel: '',
        sleepQuality: '',
        copingStrategies: '',
        interventionsUsed: '',
        homeworkAssigned: '',
        progressNotes: '',
        goals: '',
        nextSession: '',
        sessionDuration: '',
        riskAssessment: '',
        safetyPlan: '',
        referrals: '',
        sessionOutcome: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save psychological therapy session",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...sessionData,
      visitId,
      recordedAt: new Date().toISOString()
    });
  };

  const updateField = (field: string, value: string) => {
    setSessionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-indigo-50 border-b border-indigo-200">
        <CardTitle className="flex items-center gap-2 text-indigo-800">
          <Brain className="w-5 h-5" />
          Psychological Therapy Session
          <Badge variant="outline" className="ml-auto bg-indigo-100 text-indigo-700">
            Patient #{patientId}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Session Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionType" className="text-sm font-medium">Session Type</Label>
                <Select value={sessionData.sessionType} onValueChange={(value) => updateField('sessionType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select session type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">Initial Assessment</SelectItem>
                    <SelectItem value="follow-up">Follow-up Session</SelectItem>
                    <SelectItem value="crisis">Crisis Intervention</SelectItem>
                    <SelectItem value="termination">Termination Session</SelectItem>
                    <SelectItem value="group">Group Therapy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="therapyType" className="text-sm font-medium">Therapy Type</Label>
                <Select value={sessionData.therapyType} onValueChange={(value) => updateField('therapyType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select therapy type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cbt">Cognitive Behavioral Therapy (CBT)</SelectItem>
                    <SelectItem value="dbt">Dialectical Behavior Therapy (DBT)</SelectItem>
                    <SelectItem value="psychodynamic">Psychodynamic Therapy</SelectItem>
                    <SelectItem value="humanistic">Humanistic Therapy</SelectItem>
                    <SelectItem value="interpersonal">Interpersonal Therapy</SelectItem>
                    <SelectItem value="family">Family Therapy</SelectItem>
                    <SelectItem value="group">Group Therapy</SelectItem>
                    <SelectItem value="supportive">Supportive Therapy</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionDuration" className="text-sm font-medium">Session Duration (minutes)</Label>
                <Input
                  id="sessionDuration"
                  type="number"
                  placeholder="50"
                  value={sessionData.sessionDuration}
                  onChange={(e) => updateField('sessionDuration', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Presenting Concerns */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Presenting Concerns & Session Focus
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="presentingConcerns" className="text-sm font-medium">Presenting Concerns</Label>
                <Textarea
                  id="presentingConcerns"
                  placeholder="Patient's main concerns and issues discussed in this session..."
                  value={sessionData.presentingConcerns}
                  onChange={(e) => updateField('presentingConcerns', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionFocus" className="text-sm font-medium">Session Focus</Label>
                <Textarea
                  id="sessionFocus"
                  placeholder="Main topics, themes, or goals addressed in this session..."
                  value={sessionData.sessionFocus}
                  onChange={(e) => updateField('sessionFocus', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Mental Health Assessment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Mental Health Assessment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="moodAssessment" className="text-sm font-medium">Mood Assessment</Label>
                <Select value={sessionData.moodAssessment} onValueChange={(value) => updateField('moodAssessment', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mood state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="euthymic">Euthymic (Normal)</SelectItem>
                    <SelectItem value="depressed">Depressed</SelectItem>
                    <SelectItem value="elevated">Elevated</SelectItem>
                    <SelectItem value="irritable">Irritable</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                    <SelectItem value="labile">Labile (Unstable)</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anxietyLevel" className="text-sm font-medium">Anxiety Level (1-10)</Label>
                <Input
                  id="anxietyLevel"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="1 = Minimal, 10 = Severe"
                  value={sessionData.anxietyLevel}
                  onChange={(e) => updateField('anxietyLevel', e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stressLevel" className="text-sm font-medium">Stress Level (1-10)</Label>
                <Input
                  id="stressLevel"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="1 = Minimal, 10 = Severe"
                  value={sessionData.stressLevel}
                  onChange={(e) => updateField('stressLevel', e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sleepQuality" className="text-sm font-medium">Sleep Quality</Label>
                <Select value={sessionData.sleepQuality} onValueChange={(value) => updateField('sleepQuality', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sleep quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="very-poor">Very Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Interventions & Treatment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Interventions & Treatment
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interventionsUsed" className="text-sm font-medium">Interventions Used</Label>
                <Textarea
                  id="interventionsUsed"
                  placeholder="Specific therapeutic techniques, exercises, or interventions used in this session (e.g., cognitive restructuring, exposure therapy, mindfulness exercises, role-playing, etc.)..."
                  value={sessionData.interventionsUsed}
                  onChange={(e) => updateField('interventionsUsed', e.target.value)}
                  rows={4}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="copingStrategies" className="text-sm font-medium">Coping Strategies Discussed</Label>
                <Textarea
                  id="copingStrategies"
                  placeholder="Coping strategies, skills, or techniques discussed or practiced..."
                  value={sessionData.copingStrategies}
                  onChange={(e) => updateField('copingStrategies', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="homeworkAssigned" className="text-sm font-medium">Homework/Assignments</Label>
                <Textarea
                  id="homeworkAssigned"
                  placeholder="Homework, exercises, or tasks assigned to the patient between sessions..."
                  value={sessionData.homeworkAssigned}
                  onChange={(e) => updateField('homeworkAssigned', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Progress & Goals */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Progress & Goals</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goals" className="text-sm font-medium">Treatment Goals</Label>
                <Textarea
                  id="goals"
                  placeholder="Short-term and long-term treatment goals, progress toward goals..."
                  value={sessionData.goals}
                  onChange={(e) => updateField('goals', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="progressNotes" className="text-sm font-medium">Progress Notes</Label>
                <Textarea
                  id="progressNotes"
                  placeholder="Observations of patient progress, changes, improvements, or concerns..."
                  value={sessionData.progressNotes}
                  onChange={(e) => updateField('progressNotes', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Risk Assessment & Safety */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Risk Assessment & Safety
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="riskAssessment" className="text-sm font-medium">Risk Assessment</Label>
                <Textarea
                  id="riskAssessment"
                  placeholder="Assessment of suicide risk, self-harm risk, risk to others, or other safety concerns..."
                  value={sessionData.riskAssessment}
                  onChange={(e) => updateField('riskAssessment', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="safetyPlan" className="text-sm font-medium">Safety Plan</Label>
                <Textarea
                  id="safetyPlan"
                  placeholder="Safety plan developed, crisis resources provided, emergency contacts, or protective measures..."
                  value={sessionData.safetyPlan}
                  onChange={(e) => updateField('safetyPlan', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Session Outcome & Follow-up */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Session Outcome & Follow-up</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionOutcome" className="text-sm font-medium">Session Outcome</Label>
                <Select value={sessionData.sessionOutcome} onValueChange={(value) => updateField('sessionOutcome', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select session outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive Progress</SelectItem>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="challenging">Challenging Session</SelectItem>
                    <SelectItem value="crisis">Crisis Addressed</SelectItem>
                    <SelectItem value="breakthrough">Breakthrough Moment</SelectItem>
                    <SelectItem value="resistance">Resistance Noted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextSession" className="text-sm font-medium">Next Session</Label>
                <Input
                  id="nextSession"
                  type="datetime-local"
                  value={sessionData.nextSession}
                  onChange={(e) => updateField('nextSession', e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="referrals" className="text-sm font-medium">Referrals or Recommendations</Label>
                <Textarea
                  id="referrals"
                  placeholder="Referrals to other providers, resources, or recommendations for additional support..."
                  value={sessionData.referrals}
                  onChange={(e) => updateField('referrals', e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSessionData({
                sessionType: '',
                therapyType: '',
                sessionFocus: '',
                presentingConcerns: '',
                moodAssessment: '',
                anxietyLevel: '',
                stressLevel: '',
                sleepQuality: '',
                copingStrategies: '',
                interventionsUsed: '',
                homeworkAssigned: '',
                progressNotes: '',
                goals: '',
                nextSession: '',
                sessionDuration: '',
                riskAssessment: '',
                safetyPlan: '',
                referrals: '',
                sessionOutcome: ''
              })}
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Session'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

