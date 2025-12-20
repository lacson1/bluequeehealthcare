
import React from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Activity, 
  Pill,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

export function MobileNavigation({ currentPath, onNavigate, className }: MobileNavigationProps) {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const navigationItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/patients', icon: Users, label: 'Patients' },
    { path: '/visits', icon: Calendar, label: 'Workflow' },
    { path: '/lab-results', icon: Activity, label: 'Labs' },
    { path: '/pharmacy', icon: Pill, label: 'Pharmacy' },
  ];

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-1 z-50",
      "grid grid-cols-5 gap-1",
      className
    )}>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path;
        
        return (
          <Button
            key={item.path}
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center h-12 px-1 py-1",
              "text-xs font-medium transition-colors",
              isActive 
                ? "text-primary bg-primary/10" 
                : "text-slate-600 hover:text-slate-800"
            )}
          >
            <Icon className={cn("h-4 w-4 mb-1", isActive && "text-primary")} />
            <span className="truncate">{item.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
