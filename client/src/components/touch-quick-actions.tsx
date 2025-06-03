import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Plus,
  UserPlus,
  Calendar,
  Stethoscope,
  TestTube,
  Pill,
  FileText,
  Clock,
  User,
  Activity,
  Search,
  Zap,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  description: string;
  roles: string[];
  urgent?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: 'record-visit',
    label: 'Record Visit',
    icon: <Stethoscope className="h-5 w-5" />,
    route: '/patients',
    description: 'Record patient consultation',
    roles: ['doctor', 'nurse', 'physiotherapist'],
    urgent: true
  },
  {
    id: 'new-appointment',
    label: 'Book Appointment',
    icon: <Calendar className="h-5 w-5" />,
    route: '/appointments',
    description: 'Schedule patient appointment',
    roles: ['doctor', 'nurse', 'admin']
  },
  {
    id: 'add-patient',
    label: 'Add Patient',
    icon: <UserPlus className="h-5 w-5" />,
    route: '/patients',
    description: 'Register new patient',
    roles: ['doctor', 'nurse', 'admin']
  },
  {
    id: 'lab-order',
    label: 'Lab Order',
    icon: <TestTube className="h-5 w-5" />,
    route: '/lab-orders',
    description: 'Order laboratory tests',
    roles: ['doctor', 'nurse']
  },
  {
    id: 'prescribe',
    label: 'Prescribe',
    icon: <Pill className="h-5 w-5" />,
    route: '/pharmacy',
    description: 'Create prescription',
    roles: ['doctor', 'pharmacist']
  },
  {
    id: 'vitals',
    label: 'Record Vitals',
    icon: <Activity className="h-5 w-5" />,
    route: '/patients',
    description: 'Take patient vital signs',
    roles: ['nurse', 'doctor'],
    urgent: true
  },
  {
    id: 'search',
    label: 'Search',
    icon: <Search className="h-5 w-5" />,
    route: '/patients',
    description: 'Find patient records',
    roles: ['doctor', 'nurse', 'pharmacist', 'admin']
  },
  {
    id: 'emergency',
    label: 'Emergency',
    icon: <Zap className="h-5 w-5" />,
    route: '/patients',
    description: 'Emergency consultation',
    roles: ['doctor', 'nurse'],
    urgent: true
  }
];

export default function TouchQuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDesktopActions, setShowDesktopActions] = useState(true);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const userRole = user?.role || '';
  const availableActions = quickActions.filter(action => 
    action.roles.includes(userRole)
  );

  const urgentActions = availableActions.filter(action => action.urgent);
  const regularActions = availableActions.filter(action => !action.urgent);

  const handleAction = (action: QuickAction) => {
    setIsOpen(false);
    setLocation(action.route);
  };

  const handleDesktopClose = () => {
    setShowDesktopActions(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              size="lg" 
              className="h-16 w-16 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-8 w-8" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="text-xl">Quick Actions</SheetTitle>
              <SheetDescription>
                Touch-optimized shortcuts for common tasks
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              {/* Urgent Actions */}
              {urgentActions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold text-red-700">Urgent</h3>
                    <Badge variant="destructive" className="text-xs">Priority</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {urgentActions.map((action) => (
                      <Button
                        key={action.id}
                        variant="outline"
                        className="h-20 flex flex-col gap-2 border-red-200 hover:bg-red-50 active:bg-red-100 touch-none"
                        onClick={() => handleAction(action)}
                      >
                        <div className="text-red-600">{action.icon}</div>
                        <span className="text-sm font-medium text-red-700">
                          {action.label}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Actions */}
              {regularActions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    General Tasks
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {regularActions.map((action) => (
                      <Button
                        key={action.id}
                        variant="outline"
                        className="h-20 flex flex-col gap-2 hover:bg-blue-50 active:bg-blue-100 touch-none"
                        onClick={() => handleAction(action)}
                      >
                        <div className="text-blue-600">{action.icon}</div>
                        <span className="text-sm font-medium">
                          {action.label}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Touch-friendly close area */}
            <div className="mt-8 pt-4 border-t">
              <Button 
                variant="ghost" 
                className="w-full h-12 text-gray-500"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>


    </>
  );
}