import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Heart, Pill, Calendar, Shield } from 'lucide-react';

interface PatientAlert {
  id: string;
  type: 'allergy' | 'medical' | 'medication' | 'appointment' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  date?: string;
}

interface PatientAlertsPanelProps {
  patient: {
    allergies?: string;
    medicalHistory?: string;
  };
  upcomingAppointments?: any[];
  criticalMedications?: any[];
}

export function PatientAlertsPanel({ patient, upcomingAppointments = [], criticalMedications = [] }: PatientAlertsPanelProps) {
  const alerts: PatientAlert[] = [];

  // Process allergies
  if (patient.allergies && patient.allergies.trim() !== '') {
    alerts.push({
      id: 'allergies',
      type: 'allergy',
      severity: 'critical',
      title: 'Allergies',
      description: patient.allergies
    });
  }

  // Process critical medical history
  if (patient.medicalHistory) {
    const criticalConditions = ['diabetes', 'cardiac', 'heart', 'hypertension', 'epilepsy', 'asthma'];
    const hasCriticalCondition = criticalConditions.some(condition => 
      patient.medicalHistory?.toLowerCase().includes(condition)
    );
    
    if (hasCriticalCondition) {
      alerts.push({
        id: 'medical-history',
        type: 'medical',
        severity: 'high',
        title: 'Critical Medical History',
        description: patient.medicalHistory
      });
    }
  }

  // Process upcoming appointments
  upcomingAppointments.forEach((appointment, index) => {
    alerts.push({
      id: `appointment-${index}`,
      type: 'appointment',
      severity: 'medium',
      title: 'Upcoming Appointment',
      description: `Scheduled appointment`,
      date: appointment.date
    });
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'allergy':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medical':
        return <Heart className="w-4 h-4" />;
      case 'medication':
        return <Pill className="w-4 h-4" />;
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      case 'emergency':
        return <Shield className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Patient Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No active alerts</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center">
          <Shield className="w-4 h-4 mr-2" />
          Patient Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start space-x-2">
              {getAlertIcon(alert.type)}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium">{alert.title}</h4>
                <p className="text-xs mt-1 line-clamp-2">{alert.description}</p>
                {alert.date && (
                  <p className="text-xs mt-1 opacity-75">
                    {new Date(alert.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}