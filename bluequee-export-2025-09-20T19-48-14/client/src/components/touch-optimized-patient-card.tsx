import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Calendar,
  Phone,
  MapPin,
  MoreVertical,
  Stethoscope,
  Activity,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address?: string;
  lastVisit?: string;
  urgentFlag?: boolean;
}

interface TouchOptimizedPatientCardProps {
  patient: Patient;
  onQuickAction?: (action: string, patientId: number) => void;
}

export default function TouchOptimizedPatientCard({ 
  patient, 
  onQuickAction 
}: TouchOptimizedPatientCardProps) {
  const [, setLocation] = useLocation();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleQuickAction = (action: string) => {
    if (onQuickAction) {
      onQuickAction(action, patient.id);
    } else {
      // Default navigation actions
      switch (action) {
        case 'visit':
          setLocation(`/patients/${patient.id}/record-visit`);
          break;
        case 'vitals':
          setLocation(`/patients/${patient.id}`);
          break;
        case 'view':
          setLocation(`/patients/${patient.id}`);
          break;
        default:
          break;
      }
    }
  };

  return (
    <Card className={cn(
      "touch-none select-none transition-all duration-200 hover:shadow-md active:scale-[0.98]",
      patient.urgentFlag && "border-red-200 bg-red-50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm",
              patient.urgentFlag 
                ? "bg-red-500" 
                : patient.gender === 'Female' 
                  ? "bg-pink-500" 
                  : "bg-blue-500"
            )}>
              {getInitials(patient.firstName, patient.lastName)}
            </div>

            {/* Patient Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {patient.firstName} {patient.lastName}
                </h3>
                {patient.urgentFlag && (
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>{calculateAge(patient.dateOfBirth)} years</span>
                <span className="capitalize">{patient.gender}</span>
              </div>
            </div>
          </div>

          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 touch-none"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleQuickAction('view')}>
                <User className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('visit')}>
                <Stethoscope className="h-4 w-4 mr-2" />
                Record Visit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('vitals')}>
                <Activity className="h-4 w-4 mr-2" />
                Record Vitals
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {patient.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{patient.phone}</span>
            </div>
          )}
          {patient.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{patient.address}</span>
            </div>
          )}
        </div>

        {/* Last Visit */}
        {patient.lastVisit && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Calendar className="h-3 w-3" />
            <span>Last visit: {new Date(patient.lastVisit).toLocaleDateString()}</span>
          </div>
        )}

        {/* Touch-Optimized Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-10 text-xs touch-none active:bg-blue-50"
            onClick={() => handleQuickAction('visit')}
          >
            <Stethoscope className="h-3 w-3 mr-1" />
            Visit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10 text-xs touch-none active:bg-green-50"
            onClick={() => handleQuickAction('vitals')}
          >
            <Activity className="h-3 w-3 mr-1" />
            Vitals
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}