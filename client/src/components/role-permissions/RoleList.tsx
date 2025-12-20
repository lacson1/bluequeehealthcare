import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Users, Shield, CheckCircle2 } from "lucide-react";
import type { Role } from "@/types/role-permissions";

interface RoleListProps {
  roles: Role[];
  selectedRoleId: number | null;
  onRoleSelect: (roleId: number) => void;
  onCreateRole?: () => void;
}

const getRoleIcon = (roleName: string) => {
  const icons: Record<string, React.ReactNode> = {
    doctor: "👨‍⚕️",
    nurse: "👩‍⚕️",
    pharmacist: "💊",
    physiotherapist: "🏃",
    receptionist: "📞",
    admin: "⚙️",
    superadmin: "👑",
  };
  return icons[roleName.toLowerCase()] || "👤";
};

export function RoleList({ roles, selectedRoleId, onRoleSelect, onCreateRole }: RoleListProps) {
  return (
    <Card className="lg:col-span-1 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Roles
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              {roles.length} role{roles.length !== 1 ? "s" : ""} available
            </CardDescription>
          </div>
          {onCreateRole && (
            <Button
              size="sm"
              onClick={onCreateRole}
              className="h-8"
              aria-label="Create new role"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-3 pr-2" role="list" aria-label="Available roles">
            {roles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No roles available</p>
                <p className="text-xs mt-1">Create a new role to get started</p>
              </div>
            ) : (
              roles.map((role) => {
              const isSelected = selectedRoleId === role.id;
              const permissionCount = role.permissions?.length || 0;
              
              return (
                <div
                  key={role.id}
                  role="listitem"
                  onClick={() => onRoleSelect(role.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRoleSelect(role.id);
                    }
                  }}
                  tabIndex={0}
                  aria-selected={isSelected}
                  aria-label={`${role.name} role with ${permissionCount} permissions and ${role.userCount || 0} users`}
                  className={`
                    relative p-5 rounded-lg border-2 cursor-pointer transition-all 
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    ${isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-lg"
                      : "bg-card hover:bg-accent/50 border-border hover:border-primary/40 hover:shadow-md"
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="h-5 w-5 text-primary-foreground/90" />
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0 mt-0.5" aria-hidden="true">
                      {getRoleIcon(role.name)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <div className={`font-bold text-base leading-tight mb-1 ${
                          isSelected ? "text-primary-foreground" : "text-foreground"
                        }`}>
                          {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                        </div>
                        {role.description && (
                          <p className={`text-sm leading-relaxed ${
                            isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
                          }`}>
                            {role.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge
                          variant={isSelected ? "secondary" : "outline"}
                          className={`text-xs px-2.5 py-1 ${
                            isSelected 
                              ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30" 
                              : "bg-background"
                          }`}
                        >
                          <Shield className="h-3.5 w-3.5 mr-1.5" />
                          {permissionCount} {permissionCount === 1 ? "permission" : "permissions"}
                        </Badge>
                        <Badge
                          variant={isSelected ? "secondary" : "outline"}
                          className={`text-xs px-2.5 py-1 ${
                            isSelected 
                              ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30" 
                              : "bg-background"
                          }`}
                        >
                          <Users className="h-3.5 w-3.5 mr-1.5" />
                          {role.userCount || 0} {role.userCount === 1 ? "user" : "users"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

