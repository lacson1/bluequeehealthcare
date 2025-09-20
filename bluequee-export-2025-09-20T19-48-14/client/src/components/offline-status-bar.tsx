import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react';
import { useOffline } from '@/hooks/use-offline';
import { cn } from '@/lib/utils';

export default function OfflineStatusBar() {
  const { isOnline, pendingActions, syncPendingActions } = useOffline();

  if (isOnline && pendingActions === 0) {
    return null; // Hide when online and no pending actions
  }

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm font-medium text-center transition-all duration-300",
      isOnline 
        ? "bg-green-600 text-white" 
        : "bg-amber-600 text-white"
    )}>
      <div className="flex items-center justify-center gap-3">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Online</span>
            {pendingActions > 0 && (
              <>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {pendingActions} pending
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-white hover:bg-white/20"
                  onClick={syncPendingActions}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync Now
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Working Offline</span>
            {pendingActions > 0 && (
              <Badge variant="secondary" className="bg-white/20 text-white">
                <Clock className="h-3 w-3 mr-1" />
                {pendingActions} changes pending
              </Badge>
            )}
          </>
        )}
      </div>
    </div>
  );
}