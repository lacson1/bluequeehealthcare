
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Phone, 
  Calendar, 
  AlertTriangle,
  ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  phone?: string;
  lastVisit?: string;
  hasAllergies?: boolean;
  criticalAlerts?: number;
}

interface MobilePatientCardProps {
  patient: Patient;
  onClick: () => void;
  className?: string;
}

export function MobilePatientCard({ patient, onClick, className }: MobilePatientCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md active:scale-[0.98]",
        "border-l-4 border-l-primary/20",
        patient.criticalAlerts && patient.criticalAlerts > 0 && "border-l-red-500",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {/* Patient Name & Basic Info */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-slate-800 truncate">
                  {patient.firstName} {patient.lastName}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{patient.age}y • {patient.gender}</span>
                  {patient.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span className="truncate">{patient.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-2 mb-2">
              {patient.hasAllergies && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Allergies
                </Badge>
              )}
              {patient.criticalAlerts && patient.criticalAlerts > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {patient.criticalAlerts} Alert{patient.criticalAlerts > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Last Visit */}
            {patient.lastVisit && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>Last visit: {patient.lastVisit}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className="ml-2 px-2 py-1 h-auto text-primary hover:bg-primary/10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
