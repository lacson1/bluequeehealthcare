import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Heart, Shield, Info, Clock, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface SafetyAlert {
  id: string | number;
  type: 'critical' | 'warning' | 'info' | 'chronic';
  title: string;
  description: string;
  category: 'allergy' | 'medication' | 'condition' | 'vitals' | 'note' | 'emergency';
  priority: 'high' | 'medium' | 'low';
  dateAdded?: string;
  isActive?: boolean;
  metadata?: any;
}

interface PatientSafetyAlertsProps {
  patientId: number;
  patient?: {
    allergies?: string;
    medicalHistory?: string;
    firstName?: string;
    lastName?: string;
  };
  alerts?: SafetyAlert[];
  compact?: boolean;
}

// Sample alerts based on common Nigerian clinic scenarios
const sampleAlerts: SafetyAlert[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Penicillin Allergy',
    description: 'Severe allergic reaction to penicillin-based medications. Use alternative antibiotics.',
    category: 'allergy',
    priority: 'high',
    dateAdded: '2024-01-15'
  },
  {
    id: '2',
    type: 'warning',
    title: 'Hypertension',
    description: 'Patient has chronic hypertension. Monitor blood pressure regularly.',
    category: 'condition',
    priority: 'medium',
    dateAdded: '2024-02-10'
  },
  {
    id: '3',
    type: 'info',
    title: 'Prefers Local Language',
    description: 'Patient is more comfortable communicating in Yoruba.',
    category: 'note',
    priority: 'low',
    dateAdded: '2024-03-01'
  }
];

const getAlertIcon = (type: SafetyAlert['type']) => {
  switch (type) {
    case 'critical':
      return <AlertTriangle className="h-4 w-4" />;
    case 'warning':
      return <Heart className="h-4 w-4" />;
    case 'chronic':
      return <Clock className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getAlertVariant = (type: SafetyAlert['type']) => {
  switch (type) {
    case 'critical':
      return 'destructive';
    case 'warning':
      return 'default';
    case 'chronic':
      return 'secondary';
    default:
      return 'default';
  }
};

const getAlertColors = (type: SafetyAlert['type']) => {
  switch (type) {
    case 'critical':
      return 'border-red-200 bg-red-50 text-red-800';
    case 'warning':
      return 'border-orange-200 bg-orange-50 text-orange-800';
    case 'chronic':
      return 'border-blue-200 bg-blue-50 text-blue-800';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-800';
  }
};

const getPriorityBadge = (priority: SafetyAlert['priority']) => {
  switch (priority) {
    case 'high':
      return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
    case 'medium':
      return <Badge variant="secondary" className="text-xs">Medium</Badge>;
    case 'low':
      return <Badge variant="outline" className="text-xs">Low</Badge>;
    default:
      return null;
  }
};

export function PatientSafetyAlerts({ patientId, patient, alerts, compact = false }: PatientSafetyAlertsProps) {
  // Generate real alerts from patient data
  const generateAlertsFromPatient = (): SafetyAlert[] => {
    const generatedAlerts: SafetyAlert[] = [];
    
    // Process allergies
    if (patient?.allergies && patient.allergies.trim() !== '') {
      generatedAlerts.push({
        id: `allergy-${patientId}`,
        type: 'critical',
        title: 'Allergy Alert',
        description: `Patient is allergic to: ${patient.allergies}. Avoid prescribing these medications.`,
        category: 'allergy',
        priority: 'high',
        dateAdded: new Date().toISOString().split('T')[0]
      });
    }

    // Process medical history for chronic conditions
    if (patient?.medicalHistory) {
      const conditions = ['diabetes', 'hypertension', 'cardiac', 'heart', 'epilepsy', 'asthma', 'kidney', 'liver'];
      const patientHistory = patient.medicalHistory.toLowerCase();
      
      conditions.forEach(condition => {
        if (patientHistory.includes(condition)) {
          generatedAlerts.push({
            id: `condition-${condition}-${patientId}`,
            type: 'warning',
            title: `${condition.charAt(0).toUpperCase() + condition.slice(1)} History`,
            description: `Patient has a history of ${condition}. Monitor relevant parameters and adjust treatment accordingly.`,
            category: 'condition',
            priority: 'medium',
            dateAdded: new Date().toISOString().split('T')[0]
          });
        }
      });
    }

    // Add sample communication preference if no other alerts
    if (generatedAlerts.length === 0) {
      generatedAlerts.push({
        id: `info-${patientId}`,
        type: 'info',
        title: 'No Critical Alerts',
        description: 'No critical safety alerts on file. Always verify current medications and allergies before treatment.',
        category: 'note',
        priority: 'low',
        dateAdded: new Date().toISOString().split('T')[0]
      });
    }

    return generatedAlerts;
  };

  const displayAlerts = alerts || generateAlertsFromPatient();
  if (!displayAlerts || displayAlerts.length === 0) {
    return compact ? null : (
      <div className="text-center py-4">
        <Shield className="mx-auto h-8 w-8 text-green-500 mb-2" />
        <p className="text-sm text-gray-600">No safety alerts for this patient</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {displayAlerts.slice(0, 3).map((alert) => (
          <Badge key={alert.id} variant={getAlertVariant(alert.type)} className="text-xs">
            {getAlertIcon(alert.type)}
            <span className="ml-1">{alert.title}</span>
          </Badge>
        ))}
        {displayAlerts.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{displayAlerts.length - 3} more
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Safety Alerts</h3>
        <Badge variant="outline" className="text-xs">
          {displayAlerts.length} Alert{displayAlerts.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      <div className="space-y-2">
        {displayAlerts.map((alert) => (
          <Alert key={alert.id} className={`${getAlertColors(alert.type)} border-l-4`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    {getPriorityBadge(alert.priority)}
                  </div>
                  <AlertDescription className="text-xs">
                    {alert.description}
                  </AlertDescription>
                  {alert.dateAdded && (
                    <p className="text-xs opacity-70 mt-1">
                      Added: {new Date(alert.dateAdded).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Alert>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        <Info className="inline h-3 w-3 mr-1" />
        Always verify patient allergies and conditions before prescribing medications or treatments.
      </div>
    </div>
  );
}

export function QuickSafetyIndicator({ 
  alerts, 
  patient 
}: { 
  alerts?: SafetyAlert[];
  patient?: {
    allergies?: string;
    medicalHistory?: string;
  };
}) {
  // Generate alerts if not provided
  const generateQuickAlerts = (): SafetyAlert[] => {
    const quickAlerts: SafetyAlert[] = [];
    
    if (patient?.allergies && patient.allergies.trim() !== '') {
      quickAlerts.push({
        id: 'quick-allergy',
        type: 'critical',
        title: 'Allergy',
        description: patient.allergies,
        category: 'allergy',
        priority: 'high'
      });
    }

    if (patient?.medicalHistory) {
      const criticalConditions = ['diabetes', 'hypertension', 'cardiac', 'heart', 'epilepsy'];
      const hasCondition = criticalConditions.some(condition => 
        patient.medicalHistory?.toLowerCase().includes(condition)
      );
      
      if (hasCondition) {
        quickAlerts.push({
          id: 'quick-condition',
          type: 'warning',
          title: 'Chronic Condition',
          description: 'Has chronic medical condition',
          category: 'condition',
          priority: 'medium'
        });
      }
    }

    return quickAlerts;
  };

  const displayAlerts = alerts || generateQuickAlerts();
  const criticalAlerts = displayAlerts.filter(alert => alert.type === 'critical');
  const warningAlerts = displayAlerts.filter(alert => alert.type === 'warning');
  
  if (criticalAlerts.length === 0 && warningAlerts.length === 0) {
    return (
      <div className="flex items-center space-x-1 text-green-600">
        <Shield className="h-4 w-4" />
        <span className="text-xs">No alerts</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center space-x-2">
      {criticalAlerts.length > 0 && (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs font-medium">{criticalAlerts.length}</span>
        </div>
      )}
      {warningAlerts.length > 0 && (
        <div className="flex items-center space-x-1 text-orange-600">
          <Heart className="h-4 w-4" />
          <span className="text-xs font-medium">{warningAlerts.length}</span>
        </div>
      )}
    </div>
  );
}