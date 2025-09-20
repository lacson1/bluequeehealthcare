import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Stethoscope, FlaskRound, Pill, FileText, Activity } from 'lucide-react';

interface TimelineEvent {
  id: number;
  type: 'visit' | 'lab' | 'lab_result' | 'prescription' | 'consultation';
  date: string;
  title: string;
  description?: string;
  conductedBy?: string;
  conductedByRole?: string;
  data?: Record<string, any>;
  status?: string;
  details?: Record<string, any>;
}

interface PatientTimelineProps {
  events: TimelineEvent[];
}

export function PatientTimeline({ events }: PatientTimelineProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'visit':
        return <Stethoscope className="w-4 h-4" />;
      case 'lab':
      case 'lab_result':
        return <FlaskRound className="w-4 h-4" />;
      case 'prescription':
        return <Pill className="w-4 h-4" />;
      case 'consultation':
        return <FileText className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'visit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lab':
      case 'lab_result':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'prescription':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'consultation':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const sortedEvents = events
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10); // Show latest 10 events

  if (sortedEvents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Events</h3>
          <p className="text-gray-600">Patient history will appear here as visits and treatments are recorded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Patient Timeline</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {sortedEvents.map((event, index) => (
          <div key={`${event.type}-${event.id}`} className="relative flex items-start space-x-4 pb-4">
            {/* Timeline dot */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getEventColor(event.type)} flex items-center justify-center relative z-10 border-2`}>
              {getEventIcon(event.type)}
            </div>
            
            {/* Event content */}
            <div className="flex-1 min-w-0">
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(event.date).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  )}

                  {/* Conducted by information */}
                  {event.conductedBy && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {event.conductedBy}
                      </Badge>
                      {event.conductedByRole && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {event.conductedByRole.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Type-specific data display */}
                  {event.data && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      {event.type === 'visit' && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {event.data.visitType && (
                            <div><span className="font-medium">Type:</span> {event.data.visitType}</div>
                          )}
                          {event.data.bloodPressure && (
                            <div><span className="font-medium">BP:</span> {event.data.bloodPressure}</div>
                          )}
                          {event.data.heartRate && (
                            <div><span className="font-medium">HR:</span> {event.data.heartRate} bpm</div>
                          )}
                          {event.data.temperature && (
                            <div><span className="font-medium">Temp:</span> {event.data.temperature}°C</div>
                          )}
                          {event.data.weight && (
                            <div><span className="font-medium">Weight:</span> {event.data.weight} kg</div>
                          )}
                          {event.data.diagnosis && (
                            <div className="col-span-2"><span className="font-medium">Diagnosis:</span> {event.data.diagnosis}</div>
                          )}
                        </div>
                      )}

                      {(event.type === 'lab' || event.type === 'lab_result') && (
                        <div className="space-y-1 text-xs">
                          {event.data.result && (
                            <div><span className="font-medium">Result:</span> {event.data.result} {event.data.units || ''}</div>
                          )}
                          {event.data.normalRange && (
                            <div><span className="font-medium">Normal Range:</span> {event.data.normalRange}</div>
                          )}
                          {event.data.status && (
                            <Badge variant={event.data.status === 'abnormal' ? 'destructive' : 'secondary'} className="text-xs">
                              {event.data.status}
                            </Badge>
                          )}
                        </div>
                      )}

                      {event.type === 'prescription' && (
                        <div className="space-y-1 text-xs">
                          {event.data.dosage && (
                            <div><span className="font-medium">Dosage:</span> {event.data.dosage}</div>
                          )}
                          {event.data.frequency && (
                            <div><span className="font-medium">Frequency:</span> {event.data.frequency}</div>
                          )}
                          {event.data.duration && (
                            <div><span className="font-medium">Duration:</span> {event.data.duration}</div>
                          )}
                          {event.data.status && (
                            <Badge variant={event.data.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {event.data.status}
                            </Badge>
                          )}
                        </div>
                      )}

                      {event.type === 'consultation' && (
                        <div className="space-y-1 text-xs">
                          {event.data.formName && (
                            <div><span className="font-medium">Form:</span> {event.data.formName}</div>
                          )}
                          {event.data.specialistRole && (
                            <div><span className="font-medium">Specialist:</span> {event.data.specialistRole}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}