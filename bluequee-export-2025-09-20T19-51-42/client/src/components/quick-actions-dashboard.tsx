import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  AlertTriangle, 
  Pill, 
  MessageSquare, 
  Clock,
  Users,
  TestTube,
  Stethoscope,
  UserPlus,
  FileText,
  ArrowRight,
  Bell
} from "lucide-react";
import { useLocation } from "wouter";
import { useRole } from "@/components/role-guard";

interface QuickActionCard {
  title: string;
  description: string;
  count?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
  visible: (role: string) => boolean;
}

export function QuickActionsDashboard() {
  const { user } = useRole();
  const [, setLocation] = useLocation();

  // Fetch real-time data for quick actions
  const { data: urgentLabResults } = useQuery({
    queryKey: ['/api/lab-results/urgent'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: pendingPrescriptions } = useQuery({
    queryKey: ['/api/prescriptions/pending'],
    refetchInterval: 30000
  });

  const { data: unreadMessages } = useQuery({
    queryKey: ['/api/staff/messages/unread'],
    refetchInterval: 10000 // Check messages more frequently
  });

  const { data: todaysAppointments } = useQuery({
    queryKey: ['/api/appointments/today'],
    refetchInterval: 60000
  });

  const quickActions: QuickActionCard[] = [
    {
      title: "Today's Schedule",
      description: "View upcoming appointments",
      count: todaysAppointments?.length || 0,
      priority: 'medium',
      icon: <Calendar className="h-5 w-5" />,
      action: () => setLocation('/appointments'),
      shortcut: "Alt+3",
      visible: (role) => ['doctor', 'nurse', 'admin'].includes(role)
    },
    {
      title: "Urgent Lab Results",
      description: "Critical results requiring attention",
      count: urgentLabResults?.filter((lab: any) => lab.status === 'abnormal')?.length || 0,
      priority: urgentLabResults?.some((lab: any) => lab.status === 'abnormal') ? 'urgent' : 'low',
      icon: <TestTube className="h-5 w-5" />,
      action: () => setLocation('/lab-results?filter=urgent'),
      shortcut: "Alt+4",
      visible: (role) => ['doctor', 'nurse', 'admin', 'lab_tech'].includes(role)
    },
    {
      title: "Pending Prescriptions",
      description: "Medications awaiting review",
      count: pendingPrescriptions?.length || 0,
      priority: pendingPrescriptions?.length > 5 ? 'high' : 'medium',
      icon: <Pill className="h-5 w-5" />,
      action: () => setLocation('/pharmacy?filter=pending'),
      shortcut: "Alt+5",
      visible: (role) => ['doctor', 'pharmacist', 'admin'].includes(role)
    },
    {
      title: "Patient Messages",
      description: "Unread communications",
      count: unreadMessages?.length || 0,
      priority: unreadMessages?.some((msg: any) => msg.priority === 'urgent') ? 'urgent' : 'medium',
      icon: <MessageSquare className="h-5 w-5" />,
      action: () => setLocation('/staff-messages'),
      shortcut: "Ctrl+Shift+M",
      visible: () => true
    },
    {
      title: "New Patient",
      description: "Register new patient",
      icon: <UserPlus className="h-5 w-5" />,
      action: () => {
        const event = new CustomEvent('open-patient-modal');
        window.dispatchEvent(event);
      },
      shortcut: "Ctrl+N",
      visible: (role) => ['doctor', 'nurse', 'admin', 'receptionist'].includes(role)
    },
    {
      title: "Quick Visit",
      description: "Record patient visit",
      icon: <Stethoscope className="h-5 w-5" />,
      action: () => setLocation('/patients'),
      shortcut: "Ctrl+Shift+V",
      visible: (role) => ['doctor', 'nurse'].includes(role)
    }
  ];

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const visibleActions = quickActions.filter(action => 
    action.visible(user?.role || 'guest')
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="flex items-center text-xs text-gray-500">
          <Bell className="h-3 w-3 mr-1" />
          Real-time updates
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleActions.map((action, index) => (
          <Card 
            key={index}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              action.priority === 'urgent' ? 'ring-2 ring-red-200' : ''
            }`}
            onClick={action.action}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${getPriorityColor(action.priority)}`}>
                    {action.icon}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {action.title}
                    </CardTitle>
                    {action.shortcut && (
                      <div className="text-xs text-gray-500 font-mono">
                        {action.shortcut}
                      </div>
                    )}
                  </div>
                </div>
                {action.count !== undefined && (
                  <Badge 
                    variant={action.priority === 'urgent' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {action.count}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-gray-600 mb-3">{action.description}</p>
              <div className="flex items-center justify-end">
                <ArrowRight className="h-3 w-3 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Critical Alerts Section */}
      {(urgentLabResults?.some((lab: any) => lab.status === 'abnormal') || 
        unreadMessages?.some((msg: any) => msg.priority === 'urgent')) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {urgentLabResults?.filter((lab: any) => lab.status === 'abnormal')
              .slice(0, 3).map((lab: any, index: number) => (
              <div key={index} className="text-xs text-red-700 bg-white p-2 rounded border">
                <strong>{lab.patientName}:</strong> {lab.testName} - {lab.result}
              </div>
            ))}
            {unreadMessages?.filter((msg: any) => msg.priority === 'urgent')
              .slice(0, 2).map((msg: any, index: number) => (
              <div key={index} className="text-xs text-red-700 bg-white p-2 rounded border">
                <strong>Urgent Message:</strong> {msg.subject}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}