import { useQuery } from "@tanstack/react-query";

export interface OptimizedPharmacyDashboard {
  prescriptions: {
    pending: any[];
    recent: any[];
    totalPending: number;
  };
  activities: {
    recent: any[];
    byType: Record<string, number>;
    completedToday: number;
  };
  inventory: {
    lowStock: any[];
    recentUpdates: any[];
    totalMedicines: number;
  };
  summary: {
    pendingPrescriptions: number;
    activitiesCompletedToday: number;
    lowStockAlerts: number;
    lastUpdated: string;
  };
}

export function useOptimizedPharmacyDashboard() {
  return useQuery<OptimizedPharmacyDashboard>({
    queryKey: ["/api/pharmacy/dashboard"],
    staleTime: 60 * 1000, // 60 seconds - pharmacy data updates frequently
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}