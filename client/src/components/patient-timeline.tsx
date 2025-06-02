import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  FlaskRound, 
  Pill, 
  Stethoscope, 
  Clock,
  Activity,
  Filter
} from "lucide-react";
import { useState } from "react";
import TimelineFilterItem from "@/components/TimelineFilterItem";

interface PatientTimelineProps {
  patientId: number;
}

interface TimelineEvent {
  id: string;
  type: 'visit' | 'lab' | 'prescription' | 'consultation';
  title: string;
  description: string;
  date: string;
  status?: string;
}

export default function PatientTimeline({ patientId }: PatientTimelineProps) {
  const [eventFilters, setEventFilters] = useState({
    visits: true,
    labResults: true,
    consultations: true,
    prescriptions: true
  });

  // Fetch visits data
  const { data: visits = [] } = useQuery({
    queryKey: [`/api/patients/${patientId}/visits`],
    enabled: !!patientId,
  });

  // Fetch lab orders data
  const { data: labOrders = [] } = useQuery({
    queryKey: [`/api/patients/${patientId}/lab-orders`],
    enabled: !!patientId,
  });

  // Fetch prescriptions data
  const { data: prescriptions = [] } = useQuery({
    queryKey: [`/api/patients/${patientId}/prescriptions`],
    enabled: !!patientId,
  });

  // Combine all events into timeline format
  const timelineEvents: TimelineEvent[] = [
    // Add visits
    ...(eventFilters.visits ? visits.map((visit: any) => ({
      id: `visit-${visit.id}`,
      type: 'visit' as const,
      title: 'Medical Visit',
      description: visit.reason || 'Regular visit',
      date: visit.visitDate,
      status: visit.status
    })) : []),
    
    // Add lab orders
    ...(eventFilters.labResults ? labOrders.map((order: any) => ({
      id: `lab-${order.id}`,
      type: 'lab' as const,
      title: 'Lab Order',
      description: `Ordered by Dr. ${order.doctorName || order.orderedBy}`,
      date: order.createdAt,
      status: order.status
    })) : []),
    
    // Add prescriptions
    ...(eventFilters.prescriptions ? prescriptions.map((prescription: any) => ({
      id: `prescription-${prescription.id}`,
      type: 'prescription' as const,
      title: 'Prescription',
      description: prescription.medicineName || 'Medication prescribed',
      date: prescription.createdAt,
      status: prescription.status
    })) : [])
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'visit':
        return <Stethoscope className="w-4 h-4 text-blue-600" />;
      case 'lab':
        return <FlaskRound className="w-4 h-4 text-green-600" />;
      case 'prescription':
        return <Pill className="w-4 h-4 text-purple-600" />;
      case 'consultation':
        return <Activity className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-orange-100 text-orange-800 border-orange-200',
      active: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </Badge>
    );
  };

  const toggleFilter = (filterKey: keyof typeof eventFilters) => {
    setEventFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" />
            Filter Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Event Types</p>
            <div className="space-y-2">
              <TimelineFilterItem
                id="visits"
                checked={eventFilters.visits}
                onCheckedChange={() => toggleFilter('visits')}
                icon={Stethoscope}
                iconColor="text-blue-600"
                label="Visits"
              />
              <TimelineFilterItem
                id="labResults"
                checked={eventFilters.labResults}
                onCheckedChange={() => toggleFilter('labResults')}
                icon={FlaskRound}
                iconColor="text-green-600"
                label="Lab Results"
              />
              <TimelineFilterItem
                id="consultations"
                checked={eventFilters.consultations}
                onCheckedChange={() => toggleFilter('consultations')}
                icon={Activity}
                iconColor="text-orange-600"
                label="Consultations"
              />
              <TimelineFilterItem
                id="prescriptions"
                checked={eventFilters.prescriptions}
                onCheckedChange={() => toggleFilter('prescriptions')}
                icon={Pill}
                iconColor="text-purple-600"
                label="Prescriptions"
              />
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-500">
                Showing {timelineEvents.length} events
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs mt-1 h-6 px-2"
                onClick={() => setEventFilters({
                  visits: true,
                  labResults: true,
                  consultations: true,
                  prescriptions: true
                })}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Patient Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timelineEvents.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-sm font-medium text-gray-900">No events found</h3>
              <p className="text-sm text-gray-500 mt-1">
                No timeline events match your current filters.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-6">
                {timelineEvents.map((event, index) => (
                  <div key={event.id} className="relative flex items-start gap-4">
                    {/* Timeline icon */}
                    <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-200 rounded-full">
                      {getEventIcon(event.type)}
                    </div>
                    
                    {/* Event content */}
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {event.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {event.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              month: '2-digit',
                              day: '2-digit',
                              year: '2-digit'
                            })}
                          </span>
                          {event.status && getStatusBadge(event.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}