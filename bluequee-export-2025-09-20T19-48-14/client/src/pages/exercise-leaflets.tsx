import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Printer, BookOpen, ExternalLink, Heart, Search, User, Building, Phone, Mail, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
}

export default function ExerciseLeafletsPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState('');

  const { user } = useAuth();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Fetch organization data for letterhead
  const { data: organizationData } = useQuery({
    queryKey: ['/api/organizations', user?.organizationId],
    queryFn: () => fetch(`/api/organizations/${user?.organizationId}`).then(res => res.json()),
    enabled: !!user?.organizationId
  });

  const filteredPatients = patients?.filter(patient => 
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  ) || [];

  const exerciseCategories = [
    { value: 'back-pain', label: 'Back Pain Relief', exercises: ['Cat-Cow Stretches', 'Pelvic Tilts', 'Knee-to-Chest Stretches', 'Lower Back Extensions'] },
    { value: 'neck-shoulder', label: 'Neck & Shoulder', exercises: ['Neck Rotations', 'Shoulder Blade Squeezes', 'Upper Trap Stretches', 'Chin Tucks'] },
    { value: 'knee-rehab', label: 'Knee Rehabilitation', exercises: ['Straight Leg Raises', 'Quad Sets', 'Hamstring Stretches', 'Calf Raises'] },
    { value: 'post-surgical', label: 'Post-Surgical Recovery', exercises: ['Breathing Exercises', 'Ankle Pumps', 'Gentle Range of Motion', 'Progressive Walking'] },
    { value: 'balance-training', label: 'Balance Training', exercises: ['Heel-to-Toe Walking', 'Single Leg Stands', 'Tandem Stance', 'Balance Board Exercises'] },
    { value: 'strength-building', label: 'Strength Building', exercises: ['Wall Push-ups', 'Chair Squats', 'Resistance Band Exercises', 'Core Strengthening'] },
    { value: 'flexibility', label: 'Flexibility & Mobility', exercises: ['Hip Flexor Stretches', 'Hamstring Stretches', 'Shoulder Stretches', 'Spinal Twists'] },
    { value: 'sports-injury', label: 'Sports Injury Recovery', exercises: ['Dynamic Warm-ups', 'Plyometric Exercises', 'Sport-specific Movements', 'Agility Drills'] }
  ];

  const currentCategoryExercises = exerciseCategories.find(cat => cat.value === selectedCategory)?.exercises || [];

  const generatePDF = () => {
    const printContent = document.querySelector('.exercise-leaflet-content');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      const printContents = printContent.innerHTML;
      
      document.body.innerHTML = `
        <html>
          <head>
            <title>Exercise Prescription - ${selectedPatient?.firstName} ${selectedPatient?.lastName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .text-center { text-align: center; }
              .border-b-2 { border-bottom: 2px solid #2563eb; padding-bottom: 16px; }
              .text-blue-600 { color: #2563eb; }
              .text-gray-600 { color: #6b7280; }
              .grid { display: grid; gap: 16px; }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .bg-gray-50 { background-color: #f9fafb; padding: 16px; border-radius: 8px; }
              .bg-blue-50 { background-color: #eff6ff; padding: 16px; border-radius: 8px; }
              .bg-yellow-50 { background-color: #fefce8; padding: 16px; border-radius: 8px; border: 2px solid #fde047; }
              .border-l-4 { border-left: 4px solid #60a5fa; padding-left: 16px; }
              .space-y-4 > * + * { margin-top: 16px; }
              .text-sm { font-size: 14px; }
              .text-xs { font-size: 12px; }
              .font-bold { font-weight: bold; }
              .font-semibold { font-weight: 600; }
              .flex { display: flex; align-items: center; gap: 4px; }
              .justify-center { justify-content: center; }
            </style>
          </head>
          <body>${printContents}</body>
        </html>
      `;
      
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  const handleExerciseToggle = (exercise: string) => {
    setSelectedExercises(prev => 
      prev.includes(exercise) 
        ? prev.filter(e => e !== exercise)
        : [...prev, exercise]
    );
  };

  const getExerciseDetails = (exerciseName: string) => {
    const exerciseDetails: { [key: string]: { sets: string; reps: string; frequency: string } } = {
      'Cat-Cow Stretches': { sets: '2-3 sets', reps: '10-15 reps', frequency: 'Daily' },
      'Wall Push-ups': { sets: '2 sets', reps: '8-12 reps', frequency: '3x/week' },
      'Heel-to-Toe Walking': { sets: '1 set', reps: '20 steps', frequency: 'Daily' },
      'Straight Leg Raises': { sets: '3 sets', reps: '10-15 reps', frequency: 'Daily' },
      'Shoulder Blade Squeezes': { sets: '3 sets', reps: '15-20 reps', frequency: 'Daily' },
      'Chair Squats': { sets: '2-3 sets', reps: '10-15 reps', frequency: '3x/week' },
      'Ankle Pumps': { sets: '3 sets', reps: '20-30 reps', frequency: 'Every hour' },
      'Single Leg Stands': { sets: '3 sets', reps: '30 seconds', frequency: 'Daily' }
    };
    return exerciseDetails[exerciseName] || { sets: '2-3 sets', reps: '10-15 reps', frequency: 'Daily' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exercise Leaflet Generator</h1>
          <p className="text-gray-600 mt-1">Create personalized exercise programs and patient handouts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Select Patient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search Patient</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or phone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {searchTerm && (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPatient?.id === patient.id 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                    <div className="text-sm text-gray-500">{patient.phone}</div>
                  </div>
                ))}
              </div>
            )}
            
            {selectedPatient && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="font-medium text-green-800">Selected Patient</div>
                <div className="text-green-700">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                <div className="text-sm text-green-600">{selectedPatient.phone}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exercise Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Exercise Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Condition</Label>
              <Input
                placeholder="e.g., Lower back pain, Knee injury"
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Exercise Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {exerciseCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {currentCategoryExercises.length > 0 && (
              <div className="space-y-2">
                <Label>Select Exercises</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {currentCategoryExercises.map((exercise) => (
                    <div key={exercise} className="flex items-center space-x-2">
                      <Checkbox 
                        id={exercise}
                        checked={selectedExercises.includes(exercise)}
                        onCheckedChange={() => handleExerciseToggle(exercise)}
                      />
                      <Label htmlFor={exercise} className="text-sm">{exercise}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions & Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Generate Leaflet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <div><strong>Patient:</strong> {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'None selected'}</div>
              <div><strong>Condition:</strong> {customCondition || 'Not specified'}</div>
              <div><strong>Category:</strong> {exerciseCategories.find(c => c.value === selectedCategory)?.label || 'None selected'}</div>
              <div><strong>Exercises:</strong> {selectedExercises.length} selected</div>
            </div>
            
            <div className="space-y-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    disabled={!selectedPatient || selectedExercises.length === 0}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Preview Leaflet
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Exercise Prescription Leaflet</DialogTitle>
                  </DialogHeader>
                  
                  <div className="exercise-leaflet-content space-y-6 p-6 bg-white">
                    {/* Organization Header */}
                    {organizationData && (
                      <div className="text-center border-b-2 border-blue-600 pb-4 mb-6">
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <Building className="w-8 h-8 text-blue-600" />
                          <h1 className="text-2xl font-bold text-blue-600">{organizationData.name}</h1>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {organizationData.address && (
                            <p className="flex items-center justify-center gap-1">
                              <Building className="w-3 h-3" />
                              {organizationData.address}
                            </p>
                          )}
                          <div className="flex items-center justify-center gap-4">
                            {organizationData.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {organizationData.phone}
                              </span>
                            )}
                            {organizationData.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {organizationData.email}
                              </span>
                            )}
                            {organizationData.website && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {organizationData.website}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Exercise Program Header */}
                    <div className="text-center border-b border-gray-300 pb-4">
                      <h2 className="text-xl font-bold text-gray-800">Home Exercise Program</h2>
                      <p className="text-gray-600">Personalized Physiotherapy Prescription</p>
                    </div>
                    
                    {/* Patient Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div><strong>Patient:</strong> {selectedPatient?.firstName} {selectedPatient?.lastName}</div>
                      <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                      <div><strong>Condition:</strong> {customCondition || 'General wellness'}</div>
                      <div><strong>Difficulty:</strong> {selectedDifficulty?.charAt(0).toUpperCase() + selectedDifficulty?.slice(1) || 'Not specified'}</div>
                    </div>
                    
                    {/* Exercise Instructions */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-blue-600">Prescribed Exercises</h2>
                      {selectedExercises.map((exercise, index) => {
                        const details = getExerciseDetails(exercise);
                        return (
                          <div key={index} className="border-l-4 border-blue-400 pl-4 py-3 bg-blue-50 rounded-r-lg">
                            <h3 className="font-semibold text-lg">{exercise}</h3>
                            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                              <div><strong>Sets:</strong> {details.sets}</div>
                              <div><strong>Repetitions:</strong> {details.reps}</div>
                              <div><strong>Frequency:</strong> {details.frequency}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Safety Guidelines */}
                    <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg">
                      <h3 className="font-semibold text-yellow-800 mb-2">Important Safety Guidelines</h3>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Stop immediately if you experience sharp or increasing pain</li>
                        <li>• Progress gradually - don't rush the rehabilitation process</li>
                        <li>• Perform exercises exactly as demonstrated</li>
                        <li>• Maintain proper breathing throughout each exercise</li>
                        <li>• Contact your physiotherapist if you have any concerns</li>
                      </ul>
                    </div>
                    
                    {/* Prescribing Provider */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border-t border-blue-200">
                      <div>
                        <h3 className="font-semibold text-blue-800 mb-2">Prescribed by:</h3>
                        <p className="text-sm text-blue-700">
                          {user?.username}
                        </p>
                        <p className="text-xs text-blue-600">{user?.role}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-800 mb-2">Date prescribed:</h3>
                        <p className="text-sm text-blue-700">{new Date().toLocaleDateString()}</p>
                        <p className="text-xs text-blue-600">Follow-up recommended in 2-3 weeks</p>
                      </div>
                    </div>

                    {/* Organization Footer */}
                    {organizationData && (
                      <div className="text-center text-sm text-gray-600 border-t border-gray-300 pt-4 mt-6">
                        <div className="space-y-2">
                          <p className="font-medium text-blue-600">{organizationData.name}</p>
                          <div className="flex items-center justify-center gap-4 text-xs">
                            {organizationData.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {organizationData.phone}
                              </span>
                            )}
                            {organizationData.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {organizationData.email}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            For questions or concerns about this exercise program, please contact our physiotherapy department
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => window.print()}>
                      <Printer className="w-4 h-4 mr-2" />
                      Print Leaflet
                    </Button>
                    <Button onClick={() => generatePDF()}>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                className="w-full"
                disabled={!selectedPatient || selectedExercises.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
            </div>
            
            {/* Quick Templates */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Templates</Label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { name: 'Lower Back Pain', category: 'back-pain', exercises: ['Cat-Cow Stretches', 'Pelvic Tilts'] },
                  { name: 'Post-Surgery', category: 'post-surgical', exercises: ['Breathing Exercises', 'Ankle Pumps'] },
                  { name: 'Balance Training', category: 'balance-training', exercises: ['Heel-to-Toe Walking', 'Single Leg Stands'] }
                ].map((template) => (
                  <Button
                    key={template.name}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(template.category);
                      setSelectedExercises(template.exercises);
                      setCustomCondition(template.name);
                    }}
                    className="text-xs"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* External Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Professional Resources & References
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Exercise Databases</h4>
              {[
                { name: 'Physiopedia Exercise Library', url: 'https://www.physio-pedia.com/Category:Exercises' },
                { name: 'NHS Exercise Resources', url: 'https://www.nhs.uk/live-well/exercise/' },
                { name: 'Exercise Prescription Tool', url: 'https://www.exerciseprescription.com/' }
              ].map((resource, index) => (
                <a 
                  key={index}
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded border hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
                >
                  <span>{resource.name}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Professional Bodies</h4>
              {[
                { name: 'World Physiotherapy', url: 'https://world.physio/' },
                { name: 'Nigeria Society of Physiotherapy', url: 'https://www.nsp.org.ng/' },
                { name: 'Chartered Society of Physiotherapy', url: 'https://www.csp.org.uk/' }
              ].map((resource, index) => (
                <a 
                  key={index}
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded border hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
                >
                  <span>{resource.name}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Clinical Guidelines</h4>
              {[
                { name: 'Evidence-Based Practice Guidelines', url: 'https://www.physio-pedia.com/Evidence_Based_Practice' },
                { name: 'Exercise Therapy Protocols', url: 'https://www.physio-pedia.com/Exercise_Therapy' },
                { name: 'Rehabilitation Standards', url: 'https://www.mrtbn.gov.ng/' }
              ].map((resource, index) => (
                <a 
                  key={index}
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded border hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
                >
                  <span>{resource.name}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}