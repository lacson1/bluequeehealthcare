import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { PermissionItem } from "./PermissionItem";
import type { Permission } from "@/types/role-permissions";

interface PermissionCategoryProps {
  category: string;
  permissions: Permission[];
  isExpanded: boolean;
  selectedPermissions: number[];
  onToggleCategory: () => void;
  onTogglePermission: (permissionId: number) => void;
  onSelectAllInCategory: (permissions: Permission[]) => void;
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    patients: "👥",
    visits: "📋",
    lab: "🧪",
    consultations: "📝",
    medications: "💊",
    referrals: "↗️",
    users: "👤",
    organizations: "🏢",
    files: "📁",
    dashboard: "📊",
    appointments: "📅",
    billing: "💰",
  };
  return icons[category.toLowerCase()] || "🔑";
};

export function PermissionCategory({
  category,
  permissions,
  isExpanded,
  selectedPermissions,
  onToggleCategory,
  onTogglePermission,
  onSelectAllInCategory,
}: PermissionCategoryProps) {
  const categorySelected = permissions.every((p) =>
    selectedPermissions.includes(p.id)
  );
  const categoryPartial =
    permissions.some((p) => selectedPermissions.includes(p.id)) &&
    !categorySelected;
  
  const selectedCount = permissions.filter((p) => 
    selectedPermissions.includes(p.id)
  ).length;

  return (
    <div className="border-2 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow" role="group" aria-label={`${category} permissions`}>
      <div
        className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/30 cursor-pointer hover:from-muted hover:to-muted/50 transition-all"
        onClick={onToggleCategory}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleCategory();
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${category} category`}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="text-xl" aria-hidden="true">
            {getCategoryIcon(category)}
          </div>
          {isExpanded ? (
            <ChevronDown
              className="h-5 w-5 text-muted-foreground transition-transform"
              aria-hidden="true"
            />
          ) : (
            <ChevronRight
              className="h-5 w-5 text-muted-foreground transition-transform"
              aria-hidden="true"
            />
          )}
          <div className="flex-1">
            <span className="font-bold text-base capitalize">{category}</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {permissions.length} {permissions.length === 1 ? "permission" : "permissions"}
              </Badge>
              {categorySelected && (
                <Badge variant="default" className="text-xs flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  All Selected
                </Badge>
              )}
              {categoryPartial && (
                <Badge variant="secondary" className="text-xs">
                  {selectedCount}/{permissions.length} Selected
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelectAllInCategory(permissions);
          }}
          className="ml-2"
          aria-label={
            categorySelected
              ? `Deselect all ${category} permissions`
              : `Select all ${category} permissions`
          }
        >
          {categorySelected ? "Deselect All" : "Select All"}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-3 bg-background space-y-2 border-t" role="list" aria-label={`${category} permission list`}>
          {permissions.map((perm) => (
            <PermissionItem
              key={perm.id}
              permission={perm}
              isSelected={selectedPermissions.includes(perm.id)}
              onToggle={onTogglePermission}
            />
          ))}
        </div>
      )}
    </div>
  );
}

