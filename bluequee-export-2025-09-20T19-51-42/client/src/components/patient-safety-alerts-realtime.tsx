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
  compact?: boolean;
}

export function PatientSafetyAlertsRealtime({ 
  patientId, 
  compact = false 
}: PatientSafetyAlertsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real-time safety alerts from backend
  const { data: alertsData, isLoading, refetch } = useQuery({
    queryKey: [`/api/patients/${patientId}/safety-alerts`],
    enabled: !!patientId,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
    retry: 1, // Reduce retries to prevent excessive errors
  });

  // Ensure alerts is always an array
  const alerts = Array.isArray(alertsData) ? alertsData : [];

  // Mutation to resolve alerts
  const resolveAlert = useMutation({
    mutationFn: (alertId: string | number) => 
      apiRequest(`/api/safety-alerts/${alertId}/resolve`, 'PATCH'),
    onSuccess: () => {
      toast({
        title: "Alert Resolved",
        description: "Safety alert has been marked as resolved.",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'chronic':
        return <Heart className="h-4 w-4 text-purple-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertColors = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-200 bg-red-50 border-l-red-500';
      case 'warning':
        return 'border-orange-200 bg-orange-50 border-l-orange-500';
      case 'chronic':
        return 'border-purple-200 bg-purple-50 border-l-purple-500';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50 border-l-blue-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-orange-100 text-orange-800',
      low: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={`text-xs ${variants[priority as keyof typeof variants] || variants.low}`}>
        {priority?.toUpperCase()}
      </Badge>
    );
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'outline';
      case 'chronic':
        return 'secondary';
      case 'info':
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading safety alerts...</p>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return compact ? null : (
      <div className="text-center py-4">
        <Shield className="mx-auto h-8 w-8 text-green-500 mb-2" />
        <p className="text-sm text-gray-600">No safety alerts for this patient</p>
        <p className="text-xs text-gray-500">System automatically monitors for allergies, conditions, and vital signs</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {alerts.slice(0, 3).map((alert) => (
          <Badge key={alert.id} variant={getAlertVariant(alert.type)} className="text-xs">
            {getAlertIcon(alert.type)}
            <span className="ml-1">{alert.title}</span>
          </Badge>
        ))}
        {alerts.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{alerts.length - 3} more
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Safety Alerts</h3>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-7 px-2 text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        {alerts.map((alert) => (
          <Alert key={alert.id} className={`${getAlertColors(alert.type)} border-l-4`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    {getPriorityBadge(alert.priority)}
                    {alert.metadata?.autoGenerated && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        Auto-Generated
                      </Badge>
                    )}
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
              {!alert.metadata?.autoGenerated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resolveAlert.mutate(alert.id)}
                  disabled={resolveAlert.isPending}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </Alert>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        <Info className="inline h-3 w-3 mr-1" />
        Real-time alerts based on patient allergies, medical history, and vital signs. Always verify before treatment.
      </div>
    </div>
  );
}

export function QuickSafetyIndicator({ 
  patientId 
}: { 
  patientId: number;
}) {
  // Fetch real-time safety alerts for indicator
  const { data: alerts = [] } = useQuery({
    queryKey: [`/api/patients/${patientId}/safety-alerts`],
    enabled: !!patientId,
    refetchInterval: 60000, // Refresh every minute
  });

  const criticalAlerts = Array.isArray(alerts) ? alerts.filter((alert: SafetyAlert) => alert.type === 'critical') : [];
  const warningAlerts = Array.isArray(alerts) ? alerts.filter((alert: SafetyAlert) => alert.type === 'warning') : [];
  
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