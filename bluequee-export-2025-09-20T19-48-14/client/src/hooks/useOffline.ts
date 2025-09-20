import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineAction {
  url: string;
  method: string;
  data: any;
  timestamp: number;
}

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/src/sw.js')
        .then((registration) => {
          console.log('🏥 Clinic offline mode activated');
        })
        .catch((error) => {
          console.error('Service worker registration failed:', error);
        });
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "🟢 Connection Restored",
        description: "Syncing offline actions...",
      });
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "🔴 Working Offline",
        description: "Your work will be saved and synced when connection returns",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load existing offline queue
    loadOfflineQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineQueue = () => {
    try {
      const stored = localStorage.getItem('clinic-offline-queue');
      if (stored) {
        setOfflineQueue(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  };

  const syncOfflineQueue = async () => {
    const queue = [...offlineQueue];
    if (queue.length === 0) return;

    console.log(`📡 Syncing ${queue.length} offline medical records...`);
    
    const syncResults: Array<{ success: boolean; action: OfflineAction }> = [];
    
    for (const action of queue) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(action.data)
        });
        
        if (response.ok) {
          syncResults.push({ success: true, action });
          console.log('✅ Synced medical record:', action.method, action.url);
        } else {
          syncResults.push({ success: false, action });
        }
      } catch (error) {
        syncResults.push({ success: false, action });
        console.error('❌ Sync failed for medical record:', error);
      }
    }
    
    // Keep only failed actions in queue
    const failedActions = syncResults
      .filter(result => !result.success)
      .map(result => result.action);
    
    setOfflineQueue(failedActions);
    localStorage.setItem('clinic-offline-queue', JSON.stringify(failedActions));
    
    const successCount = syncResults.filter(r => r.success).length;
    
    if (successCount > 0) {
      toast({
        title: "✅ Sync Complete",
        description: `${successCount} medical records synced successfully`,
      });
    }
    
    if (failedActions.length > 0) {
      toast({
        title: "⚠️ Partial Sync",
        description: `${failedActions.length} records need retry`,
        variant: "destructive",
      });
    }
  };

  const getOfflineStatus = () => ({
    isOnline,
    queueLength: offlineQueue.length,
    hasQueuedActions: offlineQueue.length > 0
  });

  return {
    isOnline,
    offlineQueue,
    syncOfflineQueue,
    getOfflineStatus
  };
}