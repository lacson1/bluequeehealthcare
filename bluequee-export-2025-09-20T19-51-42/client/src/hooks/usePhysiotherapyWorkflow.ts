import { useQuery } from '@tanstack/react-query';

interface PhysiotherapyDashboardData {
  patients: {
    active: any[];
    totalActive: number;
  };
  sessions: {
    recent: any[];
    completedToday: number;
  };
  appointments: {
    upcoming: any[];
    scheduledToday: number;
  };
  compliance: {
    exerciseTracking: any[];
    averageCompliance: number;
  };
  summary: {
    activePatients: number;
    sessionsCompleted: number;
    upcomingAppointments: number;
    avgCompliance: number;
    lastUpdated: string;
  };
}

/**
 * Optimized physiotherapy workflow hook - consolidates patient data, sessions, appointments, and compliance tracking
 * Reduces from 4-5 separate API calls to single optimized request
 */
export function usePhysiotherapyDashboard() {
  return useQuery<PhysiotherapyDashboardData>({
    queryKey: ['/api/physiotherapy/dashboard'],
    staleTime: 90 * 1000, // Cache for 90 seconds (physiotherapy data changes less frequently)
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
  });
}

/**
 * Traditional approach for comparison - multiple API calls
 */
export function useTraditionalPhysiotherapyData() {
  const consultationRecords = useQuery({
    queryKey: ['/api/consultation-records'],
  });

  const appointments = useQuery({
    queryKey: ['/api/appointments'],
  });

  const patients = useQuery({
    queryKey: ['/api/patients'],
  });

  const exerciseLeaflets = useQuery({
    queryKey: ['/api/exercise-leaflets'],
  });

  return {
    consultationRecords: consultationRecords.data || [],
    appointments: appointments.data || [],
    patients: patients.data || [],
    exerciseLeaflets: exerciseLeaflets.data || [],
    isLoading: consultationRecords.isLoading || appointments.isLoading || patients.isLoading || exerciseLeaflets.isLoading,
    error: consultationRecords.error || appointments.error || patients.error || exerciseLeaflets.error
  };
}