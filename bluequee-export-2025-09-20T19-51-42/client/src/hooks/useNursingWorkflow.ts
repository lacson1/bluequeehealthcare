import { useQuery } from '@tanstack/react-query';

interface NursingDashboardData {
  vitals: {
    pending: any[];
    recordedToday: number;
  };
  assessments: {
    recent: any[];
    completedToday: number;
  };
  alerts: {
    critical: any[];
    totalActive: number;
  };
  schedule: {
    todaysAppointments: any[];
    totalScheduled: number;
  };
  summary: {
    vitalsRecorded: number;
    assessmentsCompleted: number;
    criticalAlerts: number;
    scheduledAppointments: number;
    lastUpdated: string;
  };
}

/**
 * Optimized nursing workflow hook - consolidates vital signs, assessments, alerts, and schedule
 * Reduces from 5-6 separate API calls to single optimized request
 */
export function useNursingDashboard() {
  return useQuery<NursingDashboardData>({
    queryKey: ['/api/nursing/dashboard'],
    staleTime: 60 * 1000, // Cache for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in memory for 5 minutes
  });
}

/**
 * Traditional approach for comparison - multiple API calls
 */
export function useTraditionalNursingData() {
  const vitals = useQuery({
    queryKey: ['/api/vitals'],
  });

  const assessments = useQuery({
    queryKey: ['/api/consultation-records'],
  });

  const alerts = useQuery({
    queryKey: ['/api/safety-alerts'],
  });

  const appointments = useQuery({
    queryKey: ['/api/appointments'],
  });

  const patients = useQuery({
    queryKey: ['/api/patients'],
  });

  return {
    vitals: vitals.data || [],
    assessments: assessments.data || [],
    alerts: alerts.data || [],
    appointments: appointments.data || [],
    patients: patients.data || [],
    isLoading: vitals.isLoading || assessments.isLoading || alerts.isLoading || appointments.isLoading || patients.isLoading,
    error: vitals.error || assessments.error || alerts.error || appointments.error || patients.error
  };
}