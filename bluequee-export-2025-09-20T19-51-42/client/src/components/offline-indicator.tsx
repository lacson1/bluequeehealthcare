import { Wifi, WifiOff, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOffline } from "@/hooks/useOffline";
import { cn } from "@/lib/utils";

export default function OfflineIndicator() {
  const { isOnline, offlineQueue, syncOfflineQueue, getOfflineStatus } = useOffline();
  const { queueLength, hasQueuedActions } = getOfflineStatus();

  return (
    <div className="flex items-center space-x-2">
      {/* Connection Status */}
      <div className={cn(
        "flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium",
        isOnline 
          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      )}>
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </>
        )}
      </div>

      {/* Pending Sync Queue */}
      {hasQueuedActions && (
        <div className="flex items-center space-x-1">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{queueLength} pending</span>
          </Badge>
          
          {isOnline && (
            <Button
              size="sm"
              variant="outline"
              onClick={syncOfflineQueue}
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Sync Now
            </Button>
          )}
        </div>
      )}
    </div>
  );
}