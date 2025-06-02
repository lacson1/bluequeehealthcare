import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Bell, 
  Heart, 
  Activity, 
  Thermometer, 
  Droplets,
  X,
  Plus,
  Settings,
  Trash2,
  Check
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VitalSignsAlertsProps {
  patientId: number;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface VitalAlert {
  id?: number;
  patientId: number;
  vitalType: string;
  condition: 'above' | 'below' | 'between';
  thresholdMin?: number;
  thresholdMax?: number;
  severity: 'low' | 'medium' | 'high';
  isActive: boolean;
  alertMethod: 'notification' | 'email' | 'both';
  createdBy: string;
  createdAt?: Date;
}

export default function VitalSignsAlerts({ 
  patientId, 
  patientName, 
  isOpen, 
  onClose 
}: VitalSignsAlertsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newAlert, setNewAlert] = useState<Partial<VitalAlert>>({
    patientId,
    vitalType: 'bloodPressureSystolic',
    condition: 'above',
    severity: 'medium',
    isActive: true,
    alertMethod: 'notification'
  });

  // Fetch existing alerts
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/vital-alerts`],
    enabled: isOpen,
  });

  // Fetch latest vital signs to show current status
  const { data: latestVitals = [] } = useQuery({
    queryKey: [`/api/patients/${patientId}/vitals`],
    enabled: isOpen,
  });

  const currentVitals = latestVitals[0] || {};

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (alertData: Partial<VitalAlert>) => {
      return await apiRequest('POST', `/api/patients/${patientId}/vital-alerts`, alertData);
    },
    onSuccess: () => {
      toast({
        title: "Alert Created",
        description: "Vital signs alert has been set up successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/vital-alerts`] });
      setNewAlert({
        patientId,
        vitalType: 'bloodPressureSystolic',
        condition: 'above',
        severity: 'medium',
        isActive: true,
        alertMethod: 'notification'
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create vital signs alert.",
        variant: "destructive",
      });
    }
  });

  // Toggle alert mutation
  const toggleAlertMutation = useMutation({
    mutationFn: async ({ alertId, isActive }: { alertId: number; isActive: boolean }) => {
      return await apiRequest('PATCH', `/api/vital-alerts/${alertId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/vital-alerts`] });
    }
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return await apiRequest('DELETE', `/api/vital-alerts/${alertId}`);
    },
    onSuccess: () => {
      toast({
        title: "Alert Deleted",
        description: "Vital signs alert has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/vital-alerts`] });
    }
  });

  const handleCreateAlert = () => {
    if (!newAlert.vitalType || !newAlert.condition) return;
    
    if (newAlert.condition === 'between' && (!newAlert.thresholdMin || !newAlert.thresholdMax)) {
      toast({
        title: "Invalid Range",
        description: "Please specify both minimum and maximum values for range alerts.",
        variant: "destructive",
      });
      return;
    }
    
    if (newAlert.condition !== 'between' && !newAlert.thresholdMax) {
      toast({
        title: "Missing Threshold",
        description: "Please specify a threshold value for the alert.",
        variant: "destructive",
      });
      return;
    }

    createAlertMutation.mutate(newAlert);
  };

  // Check if current vitals trigger any alerts
  const checkAlertStatus = (alert: VitalAlert) => {
    if (!alert.isActive) return 'inactive';
    
    const currentValue = currentVitals[alert.vitalType];
    if (!currentValue) return 'no-data';
    
    const value = parseFloat(currentValue);
    
    switch (alert.condition) {
      case 'above':
        return value > (alert.thresholdMax || 0) ? 'triggered' : 'normal';
      case 'below':
        return value < (alert.thresholdMin || 0) ? 'triggered' : 'normal';
      case 'between':
        return value < (alert.thresholdMin || 0) || value > (alert.thresholdMax || 0) ? 'triggered' : 'normal';
      default:
        return 'normal';
    }
  };

  const getVitalTypeLabel = (vitalType: string) => {
    const labels: Record<string, string> = {
      bloodPressureSystolic: 'Blood Pressure (Systolic)',
      bloodPressureDiastolic: 'Blood Pressure (Diastolic)',
      heartRate: 'Heart Rate',
      temperature: 'Temperature',
      oxygenSaturation: 'Oxygen Saturation',
      respiratoryRate: 'Respiratory Rate'
    };
    return labels[vitalType] || vitalType;
  };

  const getVitalUnit = (vitalType: string) => {
    const units: Record<string, string> = {
      bloodPressureSystolic: 'mmHg',
      bloodPressureDiastolic: 'mmHg',
      heartRate: 'bpm',
      temperature: '°C',
      oxygenSaturation: '%',
      respiratoryRate: '/min'
    };
    return units[vitalType] || '';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'triggered':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'normal':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'no-data':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl">Vital Signs Alerts</span>
              <p className="text-sm font-normal text-gray-600 mt-1">{patientName}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="active-alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active-alerts">Active Alerts</TabsTrigger>
            <TabsTrigger value="create-alert">Create New Alert</TabsTrigger>
          </TabsList>

          <TabsContent value="active-alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-600" />
                  Current Alert Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentVitals && Object.keys(currentVitals).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium">Blood Pressure</span>
                      </div>
                      <span className="font-bold text-red-900">
                        {currentVitals.bloodPressureSystolic && currentVitals.bloodPressureDiastolic
                          ? `${currentVitals.bloodPressureSystolic}/${currentVitals.bloodPressureDiastolic}`
                          : '--/--'
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-200">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-pink-600" />
                        <span className="text-sm font-medium">Heart Rate</span>
                      </div>
                      <span className="font-bold text-pink-900">
                        {currentVitals.heartRate || '--'} bpm
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium">Temperature</span>
                      </div>
                      <span className="font-bold text-orange-900">
                        {currentVitals.temperature || '--'}°C
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No recent vital signs data available
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Configured Alerts</h4>
                  {alerts.length > 0 ? (
                    alerts.map((alert: VitalAlert) => {
                      const alertStatus = checkAlertStatus(alert);
                      return (
                        <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={alert.isActive}
                                onCheckedChange={(checked) => 
                                  toggleAlertMutation.mutate({ alertId: alert.id!, isActive: checked })
                                }
                              />
                              <span className="text-sm font-medium">
                                {getVitalTypeLabel(alert.vitalType)}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              {alert.condition === 'above' && `Above ${alert.thresholdMax} ${getVitalUnit(alert.vitalType)}`}
                              {alert.condition === 'below' && `Below ${alert.thresholdMin} ${getVitalUnit(alert.vitalType)}`}
                              {alert.condition === 'between' && 
                                `Outside ${alert.thresholdMin}-${alert.thresholdMax} ${getVitalUnit(alert.vitalType)}`}
                            </div>
                            
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity} priority
                            </Badge>
                            
                            <Badge className={getStatusColor(alertStatus)}>
                              {alertStatus === 'triggered' && 'ALERT TRIGGERED'}
                              {alertStatus === 'normal' && 'Normal'}
                              {alertStatus === 'inactive' && 'Inactive'}
                              {alertStatus === 'no-data' && 'No Data'}
                            </Badge>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAlertMutation.mutate(alert.id!)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No alerts configured for this patient</p>
                      <p className="text-sm">Switch to "Create New Alert" tab to set up monitoring</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-alert" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Configure New Alert
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Vital Sign Type</Label>
                    <Select 
                      value={newAlert.vitalType} 
                      onValueChange={(value) => setNewAlert({...newAlert, vitalType: value})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select vital sign" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bloodPressureSystolic">Blood Pressure (Systolic)</SelectItem>
                        <SelectItem value="bloodPressureDiastolic">Blood Pressure (Diastolic)</SelectItem>
                        <SelectItem value="heartRate">Heart Rate</SelectItem>
                        <SelectItem value="temperature">Temperature</SelectItem>
                        <SelectItem value="oxygenSaturation">Oxygen Saturation</SelectItem>
                        <SelectItem value="respiratoryRate">Respiratory Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Alert Condition</Label>
                    <Select 
                      value={newAlert.condition} 
                      onValueChange={(value: 'above' | 'below' | 'between') => 
                        setNewAlert({...newAlert, condition: value})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above threshold</SelectItem>
                        <SelectItem value="below">Below threshold</SelectItem>
                        <SelectItem value="between">Outside normal range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newAlert.condition === 'between' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Minimum Value ({getVitalUnit(newAlert.vitalType || '')})
                      </Label>
                      <Input
                        type="number"
                        value={newAlert.thresholdMin || ''}
                        onChange={(e) => setNewAlert({...newAlert, thresholdMin: parseFloat(e.target.value)})}
                        placeholder="Min value"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Maximum Value ({getVitalUnit(newAlert.vitalType || '')})
                      </Label>
                      <Input
                        type="number"
                        value={newAlert.thresholdMax || ''}
                        onChange={(e) => setNewAlert({...newAlert, thresholdMax: parseFloat(e.target.value)})}
                        placeholder="Max value"
                        className="mt-2"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Threshold Value ({getVitalUnit(newAlert.vitalType || '')})
                    </Label>
                    <Input
                      type="number"
                      value={newAlert.condition === 'above' ? (newAlert.thresholdMax || '') : (newAlert.thresholdMin || '')}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (newAlert.condition === 'above') {
                          setNewAlert({...newAlert, thresholdMax: value});
                        } else {
                          setNewAlert({...newAlert, thresholdMin: value});
                        }
                      }}
                      placeholder="Enter threshold"
                      className="mt-2"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Alert Priority</Label>
                    <Select 
                      value={newAlert.severity} 
                      onValueChange={(value: 'low' | 'medium' | 'high') => 
                        setNewAlert({...newAlert, severity: value})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Alert Method</Label>
                    <Select 
                      value={newAlert.alertMethod} 
                      onValueChange={(value: 'notification' | 'email' | 'both') => 
                        setNewAlert({...newAlert, alertMethod: value})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select alert method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notification">System Notification</SelectItem>
                        <SelectItem value="email">Email Alert</SelectItem>
                        <SelectItem value="both">Both Methods</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newAlert.isActive}
                      onCheckedChange={(checked) => setNewAlert({...newAlert, isActive: checked})}
                    />
                    <Label className="text-sm font-medium text-gray-700">
                      Activate alert immediately
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateAlert}
                    disabled={createAlertMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}