import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptimizedPharmacyDashboard } from "@/hooks/useOptimizedPharmacyDashboard";
import { Pill, Clock, AlertTriangle, CheckCircle, Package, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function OptimizedPharmacyWorkflow() {
  const { data: dashboard, isLoading, error } = useOptimizedPharmacyDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load pharmacy dashboard</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboard) return null;

  const { prescriptions, activities, inventory, summary } = dashboard;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Prescriptions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingPrescriptions}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting dispensing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Activities</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activitiesCompletedToday}</div>
            <p className="text-xs text-muted-foreground">
              Completed dispensing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.lowStockAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Require restocking
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Pending Prescriptions
            </CardTitle>
            <CardDescription>
              {prescriptions.totalPending} prescriptions awaiting dispensing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prescriptions.pending.length > 0 ? (
                prescriptions.pending.map((prescription: any) => (
                  <div key={prescription.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{prescription.patientName}</div>
                      <div className="text-sm text-muted-foreground">
                        {prescription.medications?.length || 0} medications
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Prescribed {formatDistanceToNow(new Date(prescription.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={prescription.priority === 'urgent' ? 'destructive' : 'secondary'}>
                        {prescription.priority || 'standard'}
                      </Badge>
                      <Button size="sm">Dispense</Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No pending prescriptions
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Activities
            </CardTitle>
            <CardDescription>
              Latest dispensing and pharmacy activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.recent.length > 0 ? (
                activities.recent.map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.patientFirstName} {activity.patientLastName} - {activity.medicationName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                        {activity.status}
                      </Badge>
                      {activity.quantity && (
                        <span className="text-sm text-muted-foreground">
                          Qty: {activity.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No recent activities
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>
              Medications requiring restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventory.lowStock.length > 0 ? (
                inventory.lowStock.map((medicine: any) => (
                  <div key={medicine.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{medicine.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Current stock: {medicine.quantity} {medicine.unit}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Reorder level: {medicine.reorderLevel} {medicine.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Low Stock</Badge>
                      <Button size="sm" variant="outline">Reorder</Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  All medications well stocked
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Summary
            </CardTitle>
            <CardDescription>
              Breakdown by activity type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(activities.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
              {Object.keys(activities.byType).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No activity data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {formatDistanceToNow(new Date(summary.lastUpdated), { addSuffix: true })}
      </div>
    </div>
  );
}