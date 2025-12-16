import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
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
import { cn } from "@/lib/utils";

// All valid roles in the system
const ALL_ROLES = ["super_admin", "superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist", "receptionist", "lab_technician", "user"];

// Navigation items with streamlined structure
const getNavItems = (role: string) => {
  const normalizedRole = role?.toLowerCase() || 'user';
  
  const navItems = [
    // Main
    { 
      section: "Main",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
        { name: "Psychiatry Dashboard", href: "/psychiatry-dashboard", icon: Brain, roles: ["super_admin", "superadmin", "admin", "doctor"] },
        { name: "Patients", href: "/patients", icon: Users, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "receptionist", "user"] },
        { name: "Appointments", href: "/appointments", icon: Calendar, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "receptionist", "user"] },
        { name: "Visits", href: "/visits", icon: Activity, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
      ]
    },
    // Clinical
    {
      section: "Clinical",
      items: [
        { name: "AI Consultations", href: "/ai-consultations", icon: Brain, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"], badge: "AI" },
        { name: "Laboratory", href: "/laboratory", icon: FlaskRound, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "lab_technician"] },
        { name: "Pharmacy", href: "/pharmacy", icon: Pill, roles: ["super_admin", "superadmin", "admin", "pharmacist"] },
        { name: "Vaccinations", href: "/vaccination-management", icon: Syringe, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Telemedicine", href: "/telemedicine", icon: Video, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Physiotherapy", href: "/physiotherapy", icon: Bone, roles: ["super_admin", "superadmin", "admin", "physiotherapist", "doctor"] },
      ]
    },
    // Psychiatry (for psychiatrists)
    {
      section: "Psychiatry",
      items: [
        { name: "Psychiatry Dashboard", href: "/psychiatry-dashboard", icon: Brain, roles: ["super_admin", "superadmin", "admin", "doctor"] },
        { name: "Risk Monitor", href: "/psychiatry/risk-monitor", icon: AlertTriangle, roles: ["super_admin", "superadmin", "admin", "doctor"] },
        { name: "Assessments", href: "/mental-health", icon: ClipboardList, roles: ["super_admin", "superadmin", "admin", "doctor"] },
        { name: "Medications", href: "/pharmacy", icon: Pill, roles: ["super_admin", "superadmin", "admin", "doctor"] },
        { name: "Therapy", href: "/psychological-therapy", icon: Heart, roles: ["super_admin", "superadmin", "admin", "doctor"] },
        { name: "Outcomes", href: "/psychiatry/outcomes", icon: BarChart, roles: ["super_admin", "superadmin", "admin", "doctor"] },
      ]
    },
    // Mental Health
    {
      section: "Mental Health",
      items: [
        { name: "Psychological Therapy", href: "/psychological-therapy", icon: Brain, roles: ["super_admin", "superadmin", "admin", "doctor", "psychologist"] },
        { name: "Mental Health Support", href: "/mental-health", icon: Heart, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "psychologist"] },
      ]
    },
    // Documents
    {
      section: "Documents",
      items: [
        { name: "Medical Docs", href: "/documents", icon: FileText, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Form Builder", href: "/form-builder", icon: FolderOpen, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
      ]
    },
    // Operations
    {
      section: "Operations",
      items: [
        { name: "Billing", href: "/billing", icon: Receipt, roles: ["super_admin", "superadmin", "admin", "nurse", "receptionist"] },
        { name: "Inventory", href: "/inventory", icon: Package, roles: ["super_admin", "superadmin", "admin", "pharmacist"] },
        { name: "Analytics", href: "/analytics", icon: TrendingUp, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Performance", href: "/clinical-performance", icon: BarChart3, roles: ["super_admin", "superadmin", "admin", "doctor"] },
      ]
    },
    // Admin
    {
      section: "Admin",
      items: [
        { name: "Users", href: "/user-management", icon: UserCog, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Organization", href: "/organization-management", icon: Building2, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Staff Messages", href: "/staff-messages", icon: Mail, roles: ALL_ROLES },
        { name: "Audit Logs", href: "/audit-logs-enhanced", icon: Shield, roles: ["super_admin", "superadmin", "admin"] },
      ]
    },
  ];

  // Super admin extras
  if (normalizedRole === 'super_admin' || normalizedRole === 'superadmin') {
    navItems.unshift({
      section: "System",
      items: [
        { name: "Super Admin", href: "/super-admin-control", icon: Shield, roles: ["super_admin", "superadmin"] },
        { name: "Global Analytics", href: "/superadmin/analytics", icon: Sparkles, roles: ["super_admin", "superadmin"] },
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navSections = useMemo(() => getNavItems(user?.role || ''), [user?.role]);

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

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col",
          "bg-gradient-to-b from-slate-50 via-white to-slate-50",
          "dark:from-slate-950 dark:via-slate-900 dark:to-slate-950",
          "border-r border-slate-200/80 dark:border-slate-800/80",
          "transition-all duration-300 ease-out",
          isCollapsed ? "w-[72px]" : "w-[260px]",
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
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Health System
                </p>
                {user?.role && (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                    Role: {user.role.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Collapse toggle - desktop only */}
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
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
        </div>

        {/* Organization Badge */}
        {!isCollapsed && user?.organization && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/50 dark:border-emerald-800/30">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 truncate">
                  {user.organization.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        {!isCollapsed && (
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full h-9 pl-9 pr-3 rounded-lg text-sm",
                  "bg-slate-100/80 dark:bg-slate-800/80",
                  "border border-slate-200/50 dark:border-slate-700/50",
                  "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50",
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
              {/* Section Label */}
              {!isCollapsed && (
                <div className="px-3 py-1.5 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
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
          "border-t border-slate-200/60 dark:border-slate-800/60 p-3",
          isCollapsed && "px-2"
        )}>
          {/* User Profile */}
          <div className={cn(
            "flex items-center gap-3 mb-3",
            isCollapsed && "justify-center"
          )}>
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                {user?.firstName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.firstName || user?.username || 'User'}
                </p>
                {user?.role && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize truncate">
                    Signed in as {user.role.replace(/_/g, " ")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={cn(
            "flex gap-1",
            isCollapsed ? "flex-col items-center" : "flex-row"
          )}>
            <Link href="/profile" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start gap-2 text-slate-600 dark:text-slate-400",
                  "hover:bg-slate-100 dark:hover:bg-slate-800",
                  "hover:text-slate-900 dark:hover:text-white",
                  isCollapsed && "w-8 h-8 p-0 justify-center"
                )}
              >
                <User className="w-4 h-4" />
                {!isCollapsed && <span className="text-xs">Profile</span>}
              </Button>
            </Link>

            <Link href="/settings" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start gap-2 text-slate-600 dark:text-slate-400",
                  "hover:bg-slate-100 dark:hover:bg-slate-800",
                  "hover:text-slate-900 dark:hover:text-white",
                  isCollapsed && "w-8 h-8 p-0 justify-center"
                )}
              >
                <Settings className="w-4 h-4" />
                {!isCollapsed && <span className="text-xs">Settings</span>}
              </Button>
            </Link>
          </div>

          {/* Help & Logout */}
          <div className={cn(
            "flex gap-1 mt-1",
            isCollapsed ? "flex-col items-center" : "flex-row"
          )}>
            {onStartTour && (
              <Button
                onClick={onStartTour}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 justify-start gap-2 text-indigo-600 dark:text-indigo-400",
                  "hover:bg-indigo-50 dark:hover:bg-indigo-950/50",
                  isCollapsed && "w-8 h-8 p-0 justify-center"
                )}
              >
                <HelpCircle className="w-4 h-4" />
                {!isCollapsed && <span className="text-xs">Help & Tour</span>}
              </Button>
            )}

            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 justify-start gap-2 text-rose-600 dark:text-rose-400",
                "hover:bg-rose-50 dark:hover:bg-rose-950/50",
                isCollapsed && "w-8 h-8 p-0 justify-center"
              )}
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && <span className="text-xs">Sign Out</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
