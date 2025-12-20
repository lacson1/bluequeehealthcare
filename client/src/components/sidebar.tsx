import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  LayoutDashboard, Users, Calendar, FlaskRound, Pill, 
  User, LogOut, Settings, Shield, FileText, TrendingUp, 
  Building2, HelpCircle, ChevronLeft, Brain, Activity,
  Video, Receipt, Mail, Syringe, Bone, FolderOpen,
  Package, BarChart3, UserCog, Stethoscope, HeartPulse,
  Search, Sparkles, Menu, X, Heart, AlertTriangle, ClipboardList, BarChart
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// All valid roles in the system
const ALL_ROLES = ["super_admin", "superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist", "receptionist", "lab_technician", "user"];

// Navigation items with streamlined structure
const getNavItems = (role: string) => {
  const normalizedRole = role?.toLowerCase() || 'user';
  
  const navItems = [
    // Main - Core navigation
    { 
      section: "Main",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
        { name: "Patients", href: "/patients", icon: Users, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "receptionist", "user"] },
        { name: "Appointments", href: "/appointments", icon: Calendar, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "receptionist", "user"] },
        { name: "Workflow", href: "/visits", icon: Activity, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
      ]
    },
    // Clinical - Patient care services
    {
      section: "Clinical",
      items: [
        { name: "AI Consultations", href: "/ai-consultations", icon: Brain, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"], badge: "AI" },
        { name: "Laboratory", href: "/laboratory", icon: FlaskRound, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "lab_technician"] },
        { name: "Pharmacy", href: "/pharmacy", icon: Pill, roles: ["super_admin", "superadmin", "admin", "pharmacist", "doctor"] },
        { name: "Vaccinations", href: "/vaccination-management", icon: Syringe, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Telemedicine", href: "/telemedicine", icon: Video, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Physiotherapy", href: "/physiotherapy", icon: Bone, roles: ["super_admin", "superadmin", "admin", "physiotherapist", "doctor"] },
      ]
    },
    // Mental Health - Consolidated psychiatry and mental health
    {
      section: "Mental Health",
      items: [
        { name: "Psychiatry Dashboard", href: "/psychiatry-dashboard", icon: Brain, roles: ["super_admin", "superadmin", "admin", "doctor"] },
        { name: "Risk Monitor", href: "/psychiatry/risk-monitor", icon: AlertTriangle, roles: ["super_admin", "superadmin", "admin", "doctor"] },
        { name: "Assessments", href: "/mental-health", icon: ClipboardList, roles: ["super_admin", "superadmin", "admin", "doctor", "psychologist"] },
        { name: "Therapy", href: "/psychological-therapy", icon: Heart, roles: ["super_admin", "superadmin", "admin", "doctor", "psychologist"] },
        { name: "Outcomes", href: "/psychiatry/outcomes", icon: BarChart, roles: ["super_admin", "superadmin", "admin", "doctor"] },
      ]
    },
    // Business - Operations and documents
    {
      section: "Business",
      items: [
        { name: "Billing", href: "/billing", icon: Receipt, roles: ["super_admin", "superadmin", "admin", "nurse", "receptionist"] },
        { name: "Inventory", href: "/inventory", icon: Package, roles: ["super_admin", "superadmin", "admin", "pharmacist"] },
        { name: "Documents", href: "/documents", icon: FileText, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Form Builder", href: "/form-builder", icon: FolderOpen, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Analytics", href: "/analytics", icon: TrendingUp, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Performance", href: "/clinical-performance", icon: BarChart3, roles: ["super_admin", "superadmin", "admin", "doctor"] },
      ]
    },
    // Admin - System administration
    {
      section: "Admin",
      items: [
        { name: "Users", href: "/user-management", icon: UserCog, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Role Permissions", href: "/role-permissions", icon: Shield, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Organization", href: "/organization-management", icon: Building2, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Staff Messages", href: "/staff-messages", icon: Mail, roles: ALL_ROLES },
        // Audit Logs and Error Monitoring moved to System section for super admin
        { name: "Audit Logs", href: "/audit-logs-enhanced", icon: Shield, roles: ["admin"] },
        { name: "Error Monitoring", href: "/error-monitoring", icon: AlertTriangle, roles: ["admin"] },
      ]
    },
  ];

  // Super admin extras - System section (at the bottom)
  if (normalizedRole === 'super_admin' || normalizedRole === 'superadmin') {
    navItems.push({
      section: "System",
      items: [
        { name: "Super Admin", href: "/super-admin-control", icon: Shield, roles: ["super_admin", "superadmin"] },
        { name: "Global Analytics", href: "/superadmin/analytics", icon: Sparkles, roles: ["super_admin", "superadmin"] },
        { name: "Audit Logs", href: "/audit-logs-enhanced", icon: Shield, roles: ["super_admin", "superadmin"] },
        { name: "Error Monitoring", href: "/error-monitoring", icon: AlertTriangle, roles: ["super_admin", "superadmin"] },
      ]
    });
  }

  return navItems.map(section => ({
    ...section,
    items: section.items.filter(item => item.roles.includes(normalizedRole))
  })).filter(section => section.items.length > 0);
};

interface SidebarProps {
  onStartTour?: () => void;
}

export default function Sidebar({ onStartTour }: SidebarProps = {}) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { user } = useRole();
  const [sidebarState, setSidebarState] = useState<'expanded' | 'collapsed' | 'closed'>('expanded');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user can assign roles (admin or superadmin)
  const canAssignRoles = useMemo(() => {
    const role = user?.role?.toLowerCase() || '';
    return role === 'admin' || role === 'superadmin' || role === 'super_admin';
  }, [user?.role]);

  // Fetch users for role assignment (only if user can assign roles)
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: canAssignRoles && assignRoleDialogOpen,
  });

  // Fetch RBAC roles
  const { data: rbacRoles = [] } = useQuery({
    queryKey: ["/api/access-control/roles"],
    enabled: canAssignRoles && assignRoleDialogOpen,
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      const response = await fetch(`/api/access-control/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ roleId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to assign role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "Role assigned successfully",
      });
      setAssignRoleDialogOpen(false);
      setSelectedUserId("");
      setSelectedRoleId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    },
  });

  const handleAssignRole = () => {
    if (!selectedUserId || !selectedRoleId) {
      toast({
        title: "Error",
        description: "Please select both a user and a role",
        variant: "destructive",
      });
      return;
    }
    assignRoleMutation.mutate({
      userId: parseInt(selectedUserId),
      roleId: parseInt(selectedRoleId),
    });
  };

  const isCollapsed = sidebarState === 'collapsed';
  const isClosed = sidebarState === 'closed';

  // Fetch RBAC roles to get role name if user has roleId but no role
  const { data: userRoleData = [] } = useQuery({
    queryKey: ["/api/access-control/roles"],
    enabled: !!(user as any)?.roleId && !user?.role,
  });

  // Get role name - prefer legacy role, fallback to RBAC role name
  const displayRole = useMemo(() => {
    if (user?.role) {
      return user.role;
    }
    if ((user as any)?.roleId && userRoleData.length > 0) {
      const role = userRoleData.find((r: any) => r.id === (user as any).roleId);
      return role?.name || null;
    }
    return null;
  }, [user?.role, (user as any)?.roleId, userRoleData]);

  const navSections = useMemo(() => getNavItems(user?.role || displayRole || ''), [user?.role, displayRole]);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  // Filter items based on search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return navSections;
    
    const query = searchQuery.toLowerCase();
    return navSections.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.name.toLowerCase().includes(query)
      )
    })).filter(section => section.items.length > 0);
  }, [navSections, searchQuery]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isMobileOpen]);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300",
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Mobile Toggle */}
      <Button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        variant="ghost"
        size="sm"
        className="fixed top-2 left-2 z-[60] lg:hidden h-9 w-9 bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform"
        aria-label="Toggle mobile menu"
      >
        {isMobileOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <Menu className="h-4 w-4" />
        )}
      </Button>

      {/* Floating reopen button - shown when sidebar is completely closed */}
      {isClosed && (
        <Button
          onClick={() => setSidebarState('expanded')}
          variant="ghost"
          size="sm"
          className={cn(
            "fixed top-4 left-4 z-[60] hidden lg:flex h-10 w-10 p-0 rounded-lg",
            "bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-700",
            "hover:bg-slate-100 dark:hover:bg-slate-800",
            "text-slate-600 dark:text-slate-300",
            "transition-all duration-300"
          )}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col",
          "bg-gradient-to-b from-slate-50 via-white to-slate-50",
          "dark:from-slate-950 dark:via-slate-900 dark:to-slate-950",
          "border-r border-slate-200/80 dark:border-slate-800/80",
          "transition-all duration-300 ease-out",
          isClosed ? "lg:w-0 lg:overflow-hidden lg:border-r-0 lg:opacity-0 lg:pointer-events-none" : isCollapsed ? "w-[72px]" : "w-[260px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center gap-3 p-4 border-b border-slate-200/60 dark:border-slate-800/60",
          isCollapsed && "justify-center px-2"
        )}>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Bluequee
              </h1>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Health System
              </p>
            </div>
          )}

          {/* Collapse toggle - desktop only */}
          {!isClosed && (
            <Button
              onClick={() => {
                if (sidebarState === 'expanded') {
                  setSidebarState('collapsed');
                } else if (sidebarState === 'collapsed') {
                  setSidebarState('closed');
                } else {
                  setSidebarState('expanded');
                }
              }}
              variant="ghost"
              size="sm"
              className={cn(
                "hidden lg:flex h-7 w-7 p-0 rounded-lg",
                "hover:bg-slate-100 dark:hover:bg-slate-800",
                "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                isCollapsed && "absolute -right-3 top-6 bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700"
              )}
            >
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform duration-300",
                isCollapsed && "rotate-180"
              )} />
            </Button>
          )}
        </div>

        {/* Organization Badge - Simplified */}
        {!isCollapsed && user?.organization && (
          <div className="px-4 py-1.5">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
              <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                {user.organization.name}
              </p>
            </div>
          </div>
        )}

        {/* Search - Collapsible */}
        {!isCollapsed && (
          <div className="px-4 py-1.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full h-8 pl-8 pr-2.5 rounded-md text-xs",
                  "bg-slate-100/60 dark:bg-slate-800/60",
                  "border border-slate-200/40 dark:border-slate-700/40",
                  "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                  "focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500/40",
                  "transition-all duration-200"
                )}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {filteredSections.map((section) => (
            <div key={section.section} className="mb-4">
              {/* Section Label - More subtle */}
              {!isCollapsed && (
                <div className="px-3 py-1 mb-0.5">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {section.section}
                  </span>
                </div>
              )}

              {/* Section Divider for collapsed state */}
              {isCollapsed && section.section !== filteredSections[0]?.section && (
                <div className="mx-3 my-2 border-t border-slate-200 dark:border-slate-800" />
              )}

              {/* Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl",
                        "transition-all duration-200",
                        active ? [
                          "bg-gradient-to-r from-indigo-500 to-violet-500",
                          "text-white shadow-lg shadow-indigo-500/25",
                        ] : [
                          "text-slate-600 dark:text-slate-400",
                          "hover:bg-slate-100 dark:hover:bg-slate-800/80",
                          "hover:text-slate-900 dark:hover:text-white",
                        ],
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className={cn(
                        "w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200",
                        !active && "group-hover:scale-110"
                      )} />
                      
                      {!isCollapsed && (
                        <>
                          <span className="text-sm font-medium flex-1">{item.name}</span>
                          
                          {/* Badge */}
                          {'badge' in item && item.badge && (
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                              active 
                                ? "bg-white/20 text-white" 
                                : "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className={cn(
                          "absolute left-full ml-2 px-2.5 py-1.5 rounded-lg",
                          "bg-slate-900 dark:bg-white text-white dark:text-slate-900",
                          "text-xs font-medium whitespace-nowrap",
                          "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
                          "transition-all duration-200 z-50",
                          "shadow-lg"
                        )}>
                          {item.name}
                          {'badge' in item && item.badge && (
                            <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-indigo-500 text-white">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn(
          "border-t border-slate-200/60 dark:border-slate-800/60",
          isCollapsed ? "p-2" : "p-2.5"
        )}>
          {/* User Profile - Compact */}
          <div className={cn(
            "flex items-center gap-2.5 mb-2",
            isCollapsed && "justify-center mb-2"
          )}>
            <div className="relative flex-shrink-0">
              <div className={cn(
                "rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm",
                isCollapsed ? "w-8 h-8 text-xs" : "w-8 h-8 text-xs"
              )}>
                {user?.firstName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.firstName || user?.username || 'User'}
                </p>
                {displayRole && (
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 capitalize truncate leading-tight mt-0.5">
                    {displayRole.replace(/_/g, " ")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions - Compact Grid */}
          {!isCollapsed ? (
            <div className="grid grid-cols-2 gap-1 mb-1.5">
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-1.5 h-7 text-slate-600 dark:text-slate-400",
                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                    "hover:text-slate-900 dark:hover:text-white",
                    "text-[11px] px-2"
                  )}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </Button>
              </Link>

              <Link href="/settings">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-1.5 h-7 text-slate-600 dark:text-slate-400",
                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                    "hover:text-slate-900 dark:hover:text-white",
                    "text-[11px] px-2"
                  )}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </Button>
              </Link>

              {canAssignRoles && (
                <Dialog open={assignRoleDialogOpen} onOpenChange={setAssignRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-1.5 h-7 text-indigo-600 dark:text-indigo-400",
                        "hover:bg-indigo-50 dark:hover:bg-indigo-950/50",
                        "text-[11px] px-2"
                      )}
                    >
                      <UserCog className="w-3.5 h-3.5" />
                      <span>Assign Role</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Assign Role to User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="user-select">Select User</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger id="user-select">
                            <SelectValue placeholder="Choose a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {(Array.isArray(users) ? users : []).map((u: any) => {
                              const userName = u.firstName && u.lastName
                                ? `${u.firstName} ${u.lastName}`
                                : u.username || `User #${u.id}`;
                              const currentRole = u.role || (u.roleId && rbacRoles.find((r: any) => r.id === u.roleId)?.name) || "No role";
                              return (
                                <SelectItem key={u.id} value={u.id.toString()}>
                                  <div className="flex flex-col">
                                    <span>{userName}</span>
                                    <span className="text-xs text-gray-500">Current: {currentRole}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role-select">Select Role</Label>
                        <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                          <SelectTrigger id="role-select">
                            <SelectValue placeholder="Choose a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {(Array.isArray(rbacRoles) ? rbacRoles : []).map((role: any) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                                {role.description && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    - {role.description}
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAssignRoleDialogOpen(false);
                            setSelectedUserId("");
                            setSelectedRoleId("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAssignRole}
                          disabled={assignRoleMutation.isPending || !selectedUserId || !selectedRoleId}
                        >
                          {assignRoleMutation.isPending ? "Assigning..." : "Assign Role"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {onStartTour && (
                <Button
                  onClick={onStartTour}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-1.5 h-7 text-indigo-600 dark:text-indigo-400",
                    "hover:bg-indigo-50 dark:hover:bg-indigo-950/50",
                    "text-[11px] px-2"
                  )}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Help & Tour</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 mb-1.5">
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <User className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/settings">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              {canAssignRoles && (
                <Dialog open={assignRoleDialogOpen} onOpenChange={setAssignRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                    >
                      <UserCog className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Assign Role to User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="user-select">Select User</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger id="user-select">
                            <SelectValue placeholder="Choose a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {(Array.isArray(users) ? users : []).map((u: any) => {
                              const userName = u.firstName && u.lastName
                                ? `${u.firstName} ${u.lastName}`
                                : u.username || `User #${u.id}`;
                              const currentRole = u.role || (u.roleId && rbacRoles.find((r: any) => r.id === u.roleId)?.name) || "No role";
                              return (
                                <SelectItem key={u.id} value={u.id.toString()}>
                                  <div className="flex flex-col">
                                    <span>{userName}</span>
                                    <span className="text-xs text-gray-500">Current: {currentRole}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role-select">Select Role</Label>
                        <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                          <SelectTrigger id="role-select">
                            <SelectValue placeholder="Choose a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {(Array.isArray(rbacRoles) ? rbacRoles : []).map((role: any) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                                {role.description && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    - {role.description}
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAssignRoleDialogOpen(false);
                            setSelectedUserId("");
                            setSelectedRoleId("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAssignRole}
                          disabled={assignRoleMutation.isPending || !selectedUserId || !selectedRoleId}
                        >
                          {assignRoleMutation.isPending ? "Assigning..." : "Assign Role"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {onStartTour && (
                <Button
                  onClick={onStartTour}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* Logout - Full Width */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start gap-1.5 h-7 text-rose-600 dark:text-rose-400",
              "hover:bg-rose-50 dark:hover:bg-rose-950/50",
              "text-[11px] px-2",
              isCollapsed && "w-8 h-8 p-0 justify-center"
            )}
          >
            <LogOut className={cn("flex-shrink-0", isCollapsed ? "w-4 h-4" : "w-3.5 h-3.5")} />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
