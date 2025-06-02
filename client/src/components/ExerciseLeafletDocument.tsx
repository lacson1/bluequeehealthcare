import React from 'react';
import LetterheadTemplate from './LetterheadTemplate';
import { useActiveOrganization } from '@/hooks/useActiveOrganization';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer, Download, Activity, Clock, AlertTriangle } from 'lucide-react';

interface Exercise {
  id: number;
  name: string;
  description: string;
  duration: string;
  frequency: string;
  sets?: number;
  repetitions?: string;
  intensity?: 'low' | 'moderate' | 'high';
  precautions?: string;
}

interface ExerciseProgram {
  id: number;
  title: string;
  exercises: Exercise[];
  generalInstructions?: string;
  goals?: string;
  duration: string;
  warnings?: string;
  createdAt: string;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  phone?: string;
  title?: string;
}

interface Doctor {
  firstName?: string;
  lastName?: string;
  username: string;
  role: string;
  credentials?: string;
}

interface ExerciseLeafletDocumentProps {
  exerciseProgram: ExerciseProgram;
  patient: Patient;
  doctor: Doctor;
  onPrint?: () => void;
  onDownload?: () => void;
}

export default function ExerciseLeafletDocument({
  exerciseProgram,
  patient,
  doctor,
  onPrint,
  onDownload
}: ExerciseLeafletDocumentProps) {
  const { organization, isLoading } = useActiveOrganization();

  const handlePrint = () => {
    window.print();
    onPrint?.();
  };

  const handleDownload = () => {
    onDownload?.();
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (isLoading || !organization) {
    return <div className="flex items-center justify-center p-8">Loading organization data...</div>;
  }

  return (
    <div className="exercise-leaflet-document">
      <div className="no-print flex justify-end gap-2 mb-4">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <LetterheadTemplate
        organization={organization}
        doctor={doctor}
        patient={patient}
        documentType="medical_letter"
        documentTitle="THERAPEUTIC EXERCISE PROGRAM"
        documentDate={new Date(exerciseProgram.createdAt)}
        additionalInfo={`Program ID: ${exerciseProgram.id}`}
      >
        <div className="exercise-content space-y-6">
          {/* Program Header */}
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="p-3 rounded-lg text-white"
              style={{ backgroundColor: organization.themeColor || '#3B82F6' }}
            >
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{exerciseProgram.title}</h3>
              <p className="text-sm text-gray-600">
                Program Duration: {exerciseProgram.duration}
              </p>
            </div>
          </div>

          {/* Goals and Instructions */}
          {exerciseProgram.goals && (
            <div 
              className="goals-section p-4 rounded-lg border-l-4"
              style={{ 
                backgroundColor: `${organization.themeColor || '#3B82F6'}10`,
                borderLeftColor: organization.themeColor || '#3B82F6'
              }}
            >
              <h4 className="font-semibold text-gray-900 mb-2">Treatment Goals:</h4>
              <p className="text-gray-700">{exerciseProgram.goals}</p>
            </div>
          )}

          {exerciseProgram.generalInstructions && (
            <div className="instructions-section bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">General Instructions:</h4>
              <p className="text-blue-700">{exerciseProgram.generalInstructions}</p>
            </div>
          )}

          {/* Exercise List */}
          <div className="exercises-section">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Exercise Program:</h4>
            <div className="exercises-grid space-y-4">
              {exerciseProgram.exercises.map((exercise, index) => (
                <div 
                  key={exercise.id} 
                  className="exercise-item border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="text-lg font-semibold text-gray-900">
                      {index + 1}. {exercise.name}
                    </h5>
                    {exercise.intensity && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIntensityColor(exercise.intensity)}`}>
                        {exercise.intensity.toUpperCase()} INTENSITY
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-3">{exercise.description}</p>
                  
                  <div className="exercise-details grid grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Duration:</strong> {exercise.duration}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Frequency:</strong> {exercise.frequency}
                      </span>
                    </div>
                    {exercise.sets && (
                      <div className="text-sm">
                        <strong>Sets:</strong> {exercise.sets}
                      </div>
                    )}
                    {exercise.repetitions && (
                      <div className="text-sm">
                        <strong>Repetitions:</strong> {exercise.repetitions}
                      </div>
                    )}
                  </div>

                  {exercise.precautions && (
                    <div className="precautions bg-yellow-50 border border-yellow-200 rounded p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium text-yellow-800">Precautions:</span>
                          <p className="text-sm text-yellow-700">{exercise.precautions}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {exerciseProgram.warnings && (
            <div className="warnings-section bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 mb-2">Important Warnings:</h4>
                  <p className="text-red-700">{exerciseProgram.warnings}</p>
                </div>
              </div>
            </div>
          )}

          {/* Safety Guidelines */}
          <div className="safety-section bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Safety Guidelines:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Stop immediately if you experience pain, dizziness, or shortness of breath</li>
              <li>• Start slowly and gradually increase intensity as tolerated</li>
              <li>• Maintain proper form and technique throughout exercises</li>
              <li>• Stay hydrated and take breaks as needed</li>
              <li>• Warm up before exercising and cool down afterward</li>
              <li>• Contact your healthcare provider if symptoms worsen</li>
            </ul>
          </div>

          {/* Progress Tracking */}
          <div className="tracking-section border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Progress Tracking:</h4>
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              <div className="font-medium">Week</div>
              <div className="font-medium">Mon</div>
              <div className="font-medium">Tue</div>
              <div className="font-medium">Wed</div>
              <div className="font-medium">Thu</div>
              <div className="font-medium">Fri</div>
              <div className="font-medium">Weekend</div>
              {[1, 2, 3, 4].map(week => (
                <React.Fragment key={week}>
                  <div className="py-2 font-medium">{week}</div>
                  {[...Array(6)].map((_, day) => (
                    <div key={day} className="border border-gray-300 h-8"></div>
                  ))}
                </React.Fragment>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Check the box when you complete your exercises for that day
            </p>
          </div>

          {/* Contact Information */}
          <div className="contact-info border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Questions or Concerns:</h4>
            <p className="text-sm text-gray-700">
              Contact {organization.name} at {organization.phone} or email {organization.email}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Schedule a follow-up appointment to monitor your progress
            </p>
          </div>
        </div>
      </LetterheadTemplate>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .exercise-leaflet-document { 
            background: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}