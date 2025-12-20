import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";

interface QuickActionsProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  selectedCount: number;
  totalCount: number;
}

export function QuickActions({
  onExpandAll,
  onCollapseAll,
  onSelectAll,
  onDeselectAll,
  selectedCount,
  totalCount,
}: QuickActionsProps) {
  const percentage = totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0;
  
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border-2 border-primary/20"
      role="toolbar"
      aria-label="Quick actions for permissions"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-sm font-semibold text-muted-foreground">
          <Zap className="h-4 w-4" />
          Quick Actions:
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onExpandAll}
          aria-label="Expand all permission categories"
          className="h-8"
        >
          <ChevronDown className="h-4 w-4 mr-1" aria-hidden="true" />
          Expand All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCollapseAll}
          aria-label="Collapse all permission categories"
          className="h-8"
        >
          <ChevronRight className="h-4 w-4 mr-1" aria-hidden="true" />
          Collapse All
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          aria-label="Select all permissions"
          className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" aria-hidden="true" />
          Select All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDeselectAll}
          aria-label="Deselect all permissions"
          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <XCircle className="h-4 w-4 mr-1" aria-hidden="true" />
          Deselect All
        </Button>
      </div>
      <div className="flex items-center gap-3" aria-live="polite">
        <div className="flex flex-col items-end">
          <div className="text-sm font-semibold text-foreground">
            {selectedCount} / {totalCount} permissions
          </div>
          <div className="text-xs text-muted-foreground">
            {percentage}% selected
          </div>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {selectedCount === totalCount ? "All Selected" : 
           selectedCount === 0 ? "None Selected" : 
           `${selectedCount} Selected`}
        </Badge>
      </div>
    </div>
  );
}

