import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineData {
  patients: any[];
  visits: any[];
  appointments: any[];
  medications: any[];
  lastSync: Date | null;
}

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "🟢 Back Online",
        description: "Connection restored. Syncing pending changes...",
        duration: 3000,
      });
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "🔴 Offline Mode",
        description: "Working offline. Changes will sync when connection returns.",
        duration: 5000,
      });
      cacheCurrentData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load cached data on startup
    loadCachedData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cacheCurrentData = async () => {
    try {
      // Cache essential data for offline use
      const patients = JSON.parse(localStorage.getItem('clinic_patients') || '[]');
      const visits = JSON.parse(localStorage.getItem('clinic_visits') || '[]');
      const appointments = JSON.parse(localStorage.getItem('clinic_appointments') || '[]');
      const medications = JSON.parse(localStorage.getItem('clinic_medications') || '[]');

      const offlineData: OfflineData = {
        patients,
        visits,
        appointments,
        medications,
        lastSync: new Date()
      };

      localStorage.setItem('clinic_offline_data', JSON.stringify(offlineData));
      setOfflineData(offlineData);
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  };

  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem('clinic_offline_data');
      if (cached) {
        setOfflineData(JSON.parse(cached));
      }

      const pending = localStorage.getItem('clinic_pending_actions');
      if (pending) {
        setPendingActions(JSON.parse(pending));
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
  };

  const addPendingAction = (action: any) => {
    const newActions = [...pendingActions, { ...action, timestamp: Date.now() }];
    setPendingActions(newActions);
    localStorage.setItem('clinic_pending_actions', JSON.stringify(newActions));
  };

  const syncPendingActions = async () => {
    if (pendingActions.length === 0) return;

    try {
      // Process pending actions one by one
      for (const action of pendingActions) {
        await fetch(action.url, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
            ...action.headers
          },
          body: action.body ? JSON.stringify(action.body) : undefined
        });
      }

      // Clear pending actions after successful sync
      setPendingActions([]);
      localStorage.removeItem('clinic_pending_actions');
      
      toast({
        title: "✅ Sync Complete",
        description: `${pendingActions.length} changes synchronized successfully.`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "❌ Sync Failed",
        description: "Some changes couldn't be synchronized. Will retry when connection improves.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return {
    isOnline,
    offlineData,
    pendingActions: pendingActions.length,
    addPendingAction,
    syncPendingActions,
    cacheCurrentData
  };
}