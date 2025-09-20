
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ArrowLeft, Save } from 'lucide-react';

interface MobileFormLayoutProps {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  className?: string;
}

export function MobileFormLayout({ 
  title, 
  children, 
  onBack, 
  onSave, 
  isSaving = false,
  className 
}: MobileFormLayoutProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("min-h-screen bg-slate-50", className)}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <h1 className="text-lg font-semibold text-slate-800 truncate">
              {title}
            </h1>
          </div>
          {onSave && (
            <Button
              onClick={onSave}
              disabled={isSaving}
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Content */}
      <div className="p-4 pb-20">
        <Card>
          <CardContent className="p-4">
            {children}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Bottom Action Bar (if needed) */}
      {onSave && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
