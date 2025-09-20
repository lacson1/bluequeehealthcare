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
import { Activity, Target, Zap, Clock, Download, ExternalLink, Printer, BookOpen, FileText, Heart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface PhysiotherapyAssessmentProps {
  patientId: number;
  visitId?: number;
}

export default function PhysiotherapyAssessment({ patientId, visitId }: PhysiotherapyAssessmentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [assessmentData, setAssessmentData] = useState({
    mobilityAssessment: '',
    rangeOfMotion: '',
    strengthAssessment: '',
    balanceCoordination: '',
    painAssessment: '',
    functionalCapacity: '',
    exercisesPrescribed: '',
    treatmentPlan: '',
    homeExercises: '',
    assistiveDevices: '',
    progressNotes: '',
    goals: '',
    precautions: '',
    nextSession: '',
    sessionDuration: '',
    treatmentModalities: ''
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', `/api/patients/${patientId}/physiotherapy-assessment`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Physiotherapy assessment saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'consultation-records'] });
      setAssessmentData({
        mobilityAssessment: '',
        rangeOfMotion: '',
        strengthAssessment: '',
        balanceCoordination: '',
        painAssessment: '',
        functionalCapacity: '',
        exercisesPrescribed: '',
        treatmentPlan: '',
        homeExercises: '',
        assistiveDevices: '',
        progressNotes: '',
        goals: '',
        precautions: '',
        nextSession: '',
        sessionDuration: '',
        treatmentModalities: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save physiotherapy assessment",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...assessmentData,
      visitId,
      recordedAt: new Date().toISOString()
    });
  };

  const updateField = (field: string, value: string) => {
    setAssessmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-purple-50 border-b border-purple-200">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Activity className="w-5 h-5" />
          Physiotherapy Assessment
          <Badge variant="outline" className="ml-auto bg-purple-100 text-purple-700">
            Patient #{patientId}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Physical Assessment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Physical Assessment
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobilityAssessment" className="text-sm font-medium">Mobility Assessment</Label>
                <Textarea
                  id="mobilityAssessment"
                  placeholder="Gait pattern, walking distance, use of aids..."
                  value={assessmentData.mobilityAssessment}
                  onChange={(e) => updateField('mobilityAssessment', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rangeOfMotion" className="text-sm font-medium">Range of Motion</Label>
                <Textarea
                  id="rangeOfMotion"
                  placeholder="Joint flexibility, limitations, measurements..."
                  value={assessmentData.rangeOfMotion}
                  onChange={(e) => updateField('rangeOfMotion', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="strengthAssessment" className="text-sm font-medium">Strength Assessment</Label>
                <Textarea
                  id="strengthAssessment"
                  placeholder="Muscle strength grading, specific weaknesses..."
                  value={assessmentData.strengthAssessment}
                  onChange={(e) => updateField('strengthAssessment', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="balanceCoordination" className="text-sm font-medium">Balance & Coordination</Label>
                <Textarea
                  id="balanceCoordination"
                  placeholder="Static/dynamic balance, coordination tests..."
                  value={assessmentData.balanceCoordination}
                  onChange={(e) => updateField('balanceCoordination', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Clinical Assessment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Clinical Assessment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="painAssessment" className="text-sm font-medium">Pain Assessment</Label>
                <Textarea
                  id="painAssessment"
                  placeholder="Pain level, location, triggers, relief factors..."
                  value={assessmentData.painAssessment}
                  onChange={(e) => updateField('painAssessment', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="functionalCapacity" className="text-sm font-medium">Functional Capacity</Label>
                <Textarea
                  id="functionalCapacity"
                  placeholder="ADL performance, work capacity, limitations..."
                  value={assessmentData.functionalCapacity}
                  onChange={(e) => updateField('functionalCapacity', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Treatment Plan */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Treatment Plan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="treatmentModalities" className="text-sm font-medium">Treatment Modalities</Label>
                <Textarea
                  id="treatmentModalities"
                  placeholder="Heat, cold, electrical stimulation, manual therapy..."
                  value={assessmentData.treatmentModalities}
                  onChange={(e) => updateField('treatmentModalities', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exercisesPrescribed" className="text-sm font-medium">Exercises Prescribed</Label>
                <Textarea
                  id="exercisesPrescribed"
                  placeholder="Specific exercises, sets, reps, progression..."
                  value={assessmentData.exercisesPrescribed}
                  onChange={(e) => updateField('exercisesPrescribed', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="homeExercises" className="text-sm font-medium">Home Exercise Program</Label>
                <Textarea
                  id="homeExercises"
                  placeholder="Exercises to perform at home, frequency, duration..."
                  value={assessmentData.homeExercises}
                  onChange={(e) => updateField('homeExercises', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assistiveDevices" className="text-sm font-medium">Assistive Devices</Label>
                <Input
                  id="assistiveDevices"
                  placeholder="Crutches, walker, brace, orthotics..."
                  value={assessmentData.assistiveDevices}
                  onChange={(e) => updateField('assistiveDevices', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Goals and Progress */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Goals & Progress</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goals" className="text-sm font-medium">Treatment Goals</Label>
                <Textarea
                  id="goals"
                  placeholder="Short-term and long-term goals, measurable outcomes..."
                  value={assessmentData.goals}
                  onChange={(e) => updateField('goals', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="progressNotes" className="text-sm font-medium">Progress Notes</Label>
                <Textarea
                  id="progressNotes"
                  placeholder="Improvement noted, response to treatment..."
                  value={assessmentData.progressNotes}
                  onChange={(e) => updateField('progressNotes', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Session Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionDuration" className="text-sm font-medium">Session Duration</Label>
                <Input
                  id="sessionDuration"
                  placeholder="45 minutes"
                  value={assessmentData.sessionDuration}
                  onChange={(e) => updateField('sessionDuration', e.target.value)}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nextSession" className="text-sm font-medium">Next Session</Label>
                <Input
                  id="nextSession"
                  placeholder="Date and time for next appointment"
                  value={assessmentData.nextSession}
                  onChange={(e) => updateField('nextSession', e.target.value)}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="precautions" className="text-sm font-medium">Precautions/Contraindications</Label>
                <Input
                  id="precautions"
                  placeholder="Safety considerations, limitations..."
                  value={assessmentData.precautions}
                  onChange={(e) => updateField('precautions', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Exercise Leaflets & Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Exercise Leaflets & Resources
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Exercise Leaflet Generator */}
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Exercise Prescription Leaflet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Exercise Category</Label>
                      <Select>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="back-pain">Back Pain Relief</SelectItem>
                          <SelectItem value="neck-shoulder">Neck & Shoulder</SelectItem>
                          <SelectItem value="knee-rehab">Knee Rehabilitation</SelectItem>
                          <SelectItem value="post-surgical">Post-Surgical Recovery</SelectItem>
                          <SelectItem value="balance-training">Balance Training</SelectItem>
                          <SelectItem value="strength-building">Strength Building</SelectItem>
                          <SelectItem value="flexibility">Flexibility & Mobility</SelectItem>
                          <SelectItem value="sports-injury">Sports Injury Recovery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Difficulty Level</Label>
                      <Select>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Specific Exercises</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {[
                        'Cat-Cow Stretches', 'Wall Push-ups', 'Heel-to-Toe Walking',
                        'Seated Spinal Twist', 'Ankle Pumps', 'Hip Bridges',
                        'Shoulder Blade Squeezes', 'Hamstring Stretches'
                      ].map((exercise) => (
                        <div key={exercise} className="flex items-center space-x-2">
                          <Checkbox id={exercise} />
                          <Label htmlFor={exercise} className="text-xs">{exercise}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Printer className="w-3 h-3 mr-1" />
                          Preview Leaflet
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Exercise Prescription Leaflet</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 p-4 bg-white">
                          <div className="text-center border-b pb-4">
                            <h2 className="text-xl font-bold text-blue-600">Home Exercise Program</h2>
                            <p className="text-sm text-gray-600">Personalized for your recovery</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Patient:</strong> [Patient Name]
                            </div>
                            <div>
                              <strong>Date:</strong> {new Date().toLocaleDateString()}
                            </div>
                            <div>
                              <strong>Condition:</strong> [Primary Condition]
                            </div>
                            <div>
                              <strong>Physiotherapist:</strong> [Your Name]
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h3 className="font-semibold text-blue-600">Prescribed Exercises</h3>
                            {[
                              { name: 'Cat-Cow Stretches', sets: '2-3 sets', reps: '10-15 reps', frequency: 'Daily' },
                              { name: 'Wall Push-ups', sets: '2 sets', reps: '8-12 reps', frequency: '3x/week' },
                              { name: 'Heel-to-Toe Walking', sets: '1 set', reps: '20 steps', frequency: 'Daily' }
                            ].map((exercise, index) => (
                              <div key={index} className="border-l-4 border-blue-300 pl-3 py-2 bg-blue-50">
                                <h4 className="font-medium">{exercise.name}</h4>
                                <p className="text-sm text-gray-600">
                                  {exercise.sets} • {exercise.reps} • {exercise.frequency}
                                </p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                            <h4 className="font-medium text-yellow-800">Important Notes</h4>
                            <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                              <li>• Stop if you experience pain</li>
                              <li>• Progress gradually</li>
                              <li>• Perform exercises as instructed</li>
                              <li>• Contact clinic if concerns arise</li>
                            </ul>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print Leaflet
                          </Button>
                          <Button>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button size="sm" className="flex-1">
                      <Download className="w-3 h-3 mr-1" />
                      Generate PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* External Resources */}
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    External Resources & Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Professional Resources</h4>
                    <div className="space-y-1">
                      {[
                        { name: 'Chartered Society of Physiotherapy', url: 'https://www.csp.org.uk/', category: 'Professional Body' },
                        { name: 'Physiopedia', url: 'https://www.physio-pedia.com/', category: 'Clinical Reference' },
                        { name: 'World Physiotherapy', url: 'https://world.physio/', category: 'Global Standards' }
                      ].map((resource, index) => (
                        <a 
                          key={index}
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group"
                        >
                          <div>
                            <div className="text-xs font-medium text-gray-900">{resource.name}</div>
                            <div className="text-xs text-gray-500">{resource.category}</div>
                          </div>
                          <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-green-600" />
                        </a>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Exercise Databases</h4>
                    <div className="space-y-1">
                      {[
                        { name: 'Exercise Prescription Tool', url: 'https://www.exerciseprescription.com/', category: 'Exercise Library' },
                        { name: 'NHS Exercise Library', url: 'https://www.nhs.uk/live-well/exercise/', category: 'Patient Resources' },
                        { name: 'RehabGuru', url: 'https://www.rehabguru.com/', category: 'Digital Platform' }
                      ].map((resource, index) => (
                        <a 
                          key={index}
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group"
                        >
                          <div>
                            <div className="text-xs font-medium text-gray-900">{resource.name}</div>
                            <div className="text-xs text-gray-500">{resource.category}</div>
                          </div>
                          <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-green-600" />
                        </a>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Nigerian Resources</h4>
                    <div className="space-y-1">
                      {[
                        { name: 'Nigeria Society of Physiotherapy', url: 'https://www.nsp.org.ng/', category: 'National Body' },
                        { name: 'Medical Rehabilitation Therapists Board', url: 'https://www.mrtbn.gov.ng/', category: 'Regulatory Body' }
                      ].map((resource, index) => (
                        <a 
                          key={index}
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group"
                        >
                          <div>
                            <div className="text-xs font-medium text-gray-900">{resource.name}</div>
                            <div className="text-xs text-gray-500">{resource.category}</div>
                          </div>
                          <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-green-600" />
                        </a>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-medium text-blue-800">Quick Access</h5>
                        <p className="text-xs text-blue-600 mt-1">
                          Bookmark these resources for quick reference during patient consultations and treatment planning.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssessmentData({
                mobilityAssessment: '',
                rangeOfMotion: '',
                strengthAssessment: '',
                balanceCoordination: '',
                painAssessment: '',
                functionalCapacity: '',
                exercisesPrescribed: '',
                treatmentPlan: '',
                homeExercises: '',
                assistiveDevices: '',
                progressNotes: '',
                goals: '',
                precautions: '',
                nextSession: '',
                sessionDuration: '',
                treatmentModalities: ''
              })}
            >
              Clear Form
            </Button>
            <Button 
              type="submit" 
              disabled={saveMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Assessment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}