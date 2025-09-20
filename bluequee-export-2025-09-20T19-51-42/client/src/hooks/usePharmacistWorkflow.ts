import { useQuery } from '@tanstack/react-query';

interface PharmacistDashboardData {
  prescriptions: {
    pending: any[];
    dispensingQueue: any[];
    totalPending: number;
    dispensedToday: number;
  };
  activities: any[];
  inventory: {
    lowStock: any[];
    criticalCount: number;
  };
  summary: {
    pendingPrescriptions: number;
    dispensedToday: number;
    lowStockItems: number;
    recentActivities: number;
    lastUpdated: string;
  };
}

/**
 * Optimized hook for pharmacist workflow - fetches all essential data in single request
 * Reduces multiple API calls for prescription queue, inventory, and activities
 */
export function usePharmacistDashboard() {
  return useQuery<PharmacistDashboardData>({
    queryKey: ['/api/pharmacy/dashboard'],
    staleTime: 30 * 1000, // Cache for 30 seconds (shorter than patient data due to active workflow)
    gcTime: 2 * 60 * 1000, // Keep in memory for 2 minutes
  });
}

/**
 * Traditional hook for comparison - demonstrates multiple API calls
 */
export function useTraditionalPharmacistData() {
  const prescriptions = useQuery({
    queryKey: ['/api/prescriptions'],
  });

  const activities = useQuery({
    queryKey: ['/api/pharmacy/activities'],
  });

  const medicines = useQuery({
    queryKey: ['/api/medicines'],
  });

  const pharmacies = useQuery({
    queryKey: ['/api/pharmacies'],
  });

  return {
    prescriptions: prescriptions.data || [],
    activities: activities.data || [],
    medicines: medicines.data || [],
    pharmacies: pharmacies.data || [],
    isLoading: prescriptions.isLoading || activities.isLoading || medicines.isLoading || pharmacies.isLoading,
    error: prescriptions.error || activities.error || medicines.error || pharmacies.error
  };
}