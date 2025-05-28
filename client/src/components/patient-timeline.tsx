import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Stethoscope, FlaskRound, Pill, FileText, Activity } from 'lucide-react';

interface TimelineEvent {
  id: number;
  type: 'visit' | 'lab' | 'prescription' | 'consultation';
  date: string;
  title: string;
  description?: string;
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
        return 'bg-blue-100 text-blue-800';
      case 'lab':
        return 'bg-green-100 text-green-800';
      case 'prescription':
        return 'bg-purple-100 text-purple-800';
      case 'consultation':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <div key={event.id} className="relative flex items-start space-x-4 pb-4">
            {/* Timeline dot */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getEventColor(event.type)} flex items-center justify-center relative z-10`}>
              {getEventIcon(event.type)}
            </div>
            
            {/* Event content */}
            <div className="flex-1 min-w-0">
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  )}
                  
                  {event.status && (
                    <Badge variant="secondary" className="text-xs">
                      {event.status}
                    </Badge>
                  )}
                  
                  {/* Additional details based on event type */}
                  {event.type === 'visit' && event.details && (
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      {event.details.bloodPressure && (
                        <div>BP: {event.details.bloodPressure}</div>
                      )}
                      {event.details.temperature && (
                        <div>Temp: {event.details.temperature}°C</div>
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