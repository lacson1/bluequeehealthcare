import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Heart, BarChart3, Users, Stethoscope, FlaskRound, Pill, User, LogOut, UserCheck, Menu, X, Settings, UserCog, Shield, FileText, TrendingUp, Building2, Calculator, HelpCircle, ChevronDown, ChevronRight, Brain, Calendar, ClipboardList, Activity, Star, Building, CreditCard, Mail, DollarSign, Receipt, Syringe, Eye, Baby, Bone, Ear, FileSearch, Video, Clipboard, Package, PieChart, LayoutDashboard, FolderOpen, Wrench, HeartPulse } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole, RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GlobalQuickSearch } from "@/components/global-quick-search";

// All valid roles in the system
const ALL_ROLES = ["super_admin", "superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist", "receptionist", "lab_technician", "user"];

const getNavigationGroupsForRole = (role: string) => {
  // Normalize role to lowercase for comparison
  const normalizedRole = role?.toLowerCase() || 'user';
  
  // Super admin gets enhanced navigation with system-wide access
  const superAdminExtras = (normalizedRole === 'super_admin' || normalizedRole === 'superadmin') ? [
    {
      name: "System Overview",
      icon: Shield,
      color: "red",
      items: [
        { name: "Global Analytics", href: "/superadmin/analytics", icon: TrendingUp, roles: ["super_admin", "superadmin"] },
        { name: "Super Admin Control", href: "/super-admin-control", icon: Shield, roles: ["super_admin", "superadmin"] },
      ]
    }
  ] : [];

  const navigationGroups = [
    // ===== CORE NAVIGATION =====
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      color: "sky",
      items: [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
        { name: "Admin Dashboard", href: "/admin-dashboard", icon: Shield, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Clinical Activity", href: "/visits", icon: Activity, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
      ]
    },

    // ===== PATIENT CARE =====
    {
      name: "Patients",
      icon: Users,
      color: "violet",
      items: [
        { name: "Patient Registry", href: "/patients", icon: Users, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "receptionist", "user"] },
        { name: "Appointments", href: "/appointments", icon: Calendar, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "receptionist", "user"] },
        { name: "Consultations", href: "/consultation-dashboard", icon: Stethoscope, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Patient Access Cards", href: "/patient-access-cards", icon: CreditCard, roles: ["super_admin", "superadmin", "admin", "nurse", "receptionist"] },
        { name: "Communication", href: "/patient-communication", icon: Mail, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "receptionist"] },
      ]
    },

    // ===== CLINICAL SERVICES =====
    {
      name: "Clinical Services",
      icon: HeartPulse,
      color: "emerald",
      items: [
        { name: "AI Consultations", href: "/ai-consultations", icon: Brain, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Laboratory", href: "/laboratory", icon: FlaskRound, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Pharmacy", href: "/pharmacy", icon: Pill, roles: ["super_admin", "superadmin", "admin", "pharmacist"] },
        { name: "Vaccinations", href: "/vaccination-management", icon: Syringe, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Referrals", href: "/referrals", icon: UserCheck, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
      ]
    },

    // ===== SPECIALTY CONSULTATIONS - NEW! =====
    {
      name: "Specialty Care",
      icon: Stethoscope,
      color: "fuchsia",
      items: [
        { name: "Form Builder", href: "/form-builder", icon: FileSearch, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Physiotherapy", href: "/physiotherapy", icon: Bone, roles: ["super_admin", "superadmin", "admin", "physiotherapist", "doctor"] },
        { name: "Telemedicine", href: "/telemedicine", icon: Video, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Exercise Leaflets", href: "/exercise-leaflets", icon: Clipboard, roles: ["super_admin", "superadmin", "admin", "doctor", "physiotherapist"] },
      ]
    },

    // ===== DOCUMENTS =====
    {
      name: "Documents",
      icon: FolderOpen,
      color: "amber",
      items: [
        { name: "Medical Documents", href: "/documents", icon: FileText, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Certificates", href: "/medical-certificates", icon: Shield, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Referral Letters", href: "/referral-letters", icon: UserCheck, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Consent Forms", href: "/consent-management", icon: Clipboard, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Procedural Reports", href: "/procedural-reports", icon: ClipboardList, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
      ]
    },

    // ===== OPERATIONS =====
    {
      name: "Operations",
      icon: Package,
      color: "orange",
      items: [
        { name: "Inventory", href: "/inventory", icon: Package, roles: ["super_admin", "superadmin", "admin", "pharmacist"] },
        { name: "Medical Tools", href: "/medical-tools", icon: Wrench, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
      ]
    },

    // ===== FINANCE & ANALYTICS =====
    {
      name: "Finance & Analytics",
      icon: PieChart,
      color: "teal",
      items: [
        { name: "Billing", href: "/billing", icon: Receipt, roles: ["super_admin", "superadmin", "admin", "nurse", "receptionist"] },
        { name: "Revenue Analytics", href: "/analytics", icon: TrendingUp, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Clinical Performance", href: "/clinical-performance", icon: BarChart3, roles: ["super_admin", "superadmin", "admin", "doctor"] },
        { name: "Compliance", href: "/compliance", icon: Shield, roles: ["super_admin", "superadmin", "admin"] },
      ]
    },

    // ===== ADMINISTRATION =====
    {
      name: "Administration",
      icon: Settings,
      color: "slate",
      items: [
        { name: "User Management", href: "/user-management", icon: UserCog, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Roles & Access", href: "/role-management", icon: Shield, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Staff Control", href: "/staff-access-control", icon: UserCog, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Organization", href: "/organization-management", icon: Building2, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Staff Messages", href: "/staff-messages", icon: Mail, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist", "receptionist"] },
        { name: "Audit Logs", href: "/audit-logs-enhanced", icon: Shield, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Performance", href: "/performance", icon: TrendingUp, roles: ["super_admin", "superadmin", "admin"] },
      ]
    },

    // ===== PERSONAL =====
    {
      name: "My Account",
      icon: User,
      color: "zinc",
      items: [
        { name: "My Profile", href: "/profile", icon: User, roles: ALL_ROLES },
        { name: "Settings", href: "/settings", icon: Settings, roles: ALL_ROLES },
        { name: "Help & Support", href: "/help", icon: HelpCircle, roles: ALL_ROLES },
      ]
    }
  ];

  return [...superAdminExtras, ...navigationGroups].map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(normalizedRole))
  })).filter(group => group.items.length > 0);
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
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['Dashboard', 'Patient Management']));

  const navigationGroups = getNavigationGroupsForRole(user?.role || '');

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  const toggleGroup = (groupName: string) => {
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(groupName)) {
      newOpenGroups.delete(groupName);
    } else {
      newOpenGroups.add(groupName);
    }
    setOpenGroups(newOpenGroups);
  };

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleMobileLinkClick = () => {
    setIsMobileOpen(false);
  };

  // Close mobile sidebar on escape key and prevent body scroll when open
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        e.preventDefault();
        setIsMobileOpen(false);
      }
    };

    if (isMobileOpen) {
      // Prevent body scroll when mobile sidebar is open for better mobile UX
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscapeKey);

      return () => {
        document.body.style.overflow = originalStyle;
        window.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile Overlay with smooth fade transition - starts below topbar */}
      <div
        className={`fixed inset-x-0 top-11 sm:top-12 bottom-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ease-out ${isMobileOpen
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Menu Button - positioned to align with topbar */}
      <Button
        onClick={toggleMobileSidebar}
        variant="ghost"
        size="sm"
        className="fixed top-1.5 sm:top-2 left-2 z-[60] lg:hidden h-8 w-8 bg-card/95 backdrop-blur-sm shadow-md border border-border hover:bg-muted hover:shadow-lg hover:scale-105 transition-[transform,box-shadow,background-color] duration-200 ease-out"
        aria-label="Toggle mobile menu"
        aria-expanded={isMobileOpen}
      >
        <Menu
          className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ease-out ${isMobileOpen ? 'rotate-90' : 'rotate-0'
            }`}
        />
      </Button>

      {/* Sidebar with hardware-accelerated smooth transitions */}
      <aside
        className={`
          fixed lg:relative left-0 z-50 lg:z-30
          top-11 sm:top-12 lg:top-0 bottom-0 lg:inset-y-0
          ${isCollapsed ? 'w-16' : 'w-64'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-sidebar shadow-xl border-r border-sidebar-border flex flex-col 
          transition-[transform,width] duration-300 ease-out
          will-change-[transform,width] transform-gpu
          lg:h-screen overflow-hidden flex-shrink-0
        `}
        style={{ 
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          perspective: 1000 
        }}
      >
        {/* Desktop Toggle Button with smooth icon transition */}
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="sm"
          className="hidden lg:flex absolute -right-2.5 top-6 z-10 h-5 w-5 rounded-full bg-card/80 backdrop-blur-sm shadow-sm border border-border/50 hover:bg-card hover:shadow-md hover:border-border hover:scale-110 p-0 transition-all duration-200 items-center justify-center"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div className="relative w-3 h-3 flex items-center justify-center">
            <Menu
              className={`absolute h-3 w-3 text-muted-foreground hover:text-foreground transition-all duration-200 ${isCollapsed ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
                }`}
            />
            <X
              className={`absolute h-3 w-3 text-muted-foreground hover:text-foreground transition-all duration-200 ${isCollapsed ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                }`}
            />
          </div>
        </Button>

        {/* Logo Section */}
        <div className={`${isCollapsed ? 'p-2' : 'p-5'} border-b border-sidebar-border bg-sidebar transition-all duration-300 flex-shrink-0`}>
          <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className={`${isCollapsed ? 'w-9 h-9' : 'w-11 h-11'} bg-gradient-to-br from-sky-500 via-blue-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25 transition-all duration-300`}>
              <HeartPulse className={`text-white ${isCollapsed ? 'h-5 w-5' : 'h-6 w-6'} transition-all duration-300`} />
            </div>
            <div className={`transition-all duration-300 flex-1 min-w-0 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              <h1 className="text-lg font-bold text-sidebar-foreground leading-tight tracking-tight">ClinicConnect</h1>
              <p className="text-[10px] font-medium text-muted-foreground leading-tight tracking-wide uppercase">Healthcare Management</p>
            </div>
          </div>

          {/* Current Organization Badge - Always visible when not collapsed */}
          {!isCollapsed && user?.organization && (
            <div className="mt-3 w-full">
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200/60 dark:border-emerald-700/40">
                <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 truncate">
                    {user.organization.name}
                  </p>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 capitalize">
                    {user.organization.type || 'Healthcare Facility'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Search - Only show when not collapsed */}
          {!isCollapsed && (
            <div className="mt-3 w-full">
              <GlobalQuickSearch />
            </div>
          )}
        </div>

        {/* Navigation Menu with smooth scrolling */}
        <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'px-3 py-4'} transition-all duration-300 overflow-y-auto sidebar-scrollbar bg-sidebar`}>
          <div className="space-y-1.5">
            {navigationGroups.map((group, index) => {
              // Get color classes based on group color property
              const getGroupStyles = (color: string) => {
                const colorMap: Record<string, { hover: string; active: string; iconBg: string; iconColor: string; chevron: string; activeBorder: string }> = {
                  sky: {
                    hover: 'hover:bg-sky-50',
                    active: 'text-sky-700 bg-gradient-to-r from-sky-50 to-sky-100/50',
                    iconBg: 'bg-sky-100',
                    iconColor: 'text-sky-600',
                    chevron: 'text-sky-500',
                    activeBorder: 'border-sky-500'
                  },
                  violet: {
                    hover: 'hover:bg-violet-50',
                    active: 'text-violet-700 bg-gradient-to-r from-violet-50 to-violet-100/50',
                    iconBg: 'bg-violet-100',
                    iconColor: 'text-violet-600',
                    chevron: 'text-violet-500',
                    activeBorder: 'border-violet-500'
                  },
                  emerald: {
                    hover: 'hover:bg-emerald-50',
                    active: 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-emerald-100/50',
                    iconBg: 'bg-emerald-100',
                    iconColor: 'text-emerald-600',
                    chevron: 'text-emerald-500',
                    activeBorder: 'border-emerald-500'
                  },
                  fuchsia: {
                    hover: 'hover:bg-fuchsia-50',
                    active: 'text-fuchsia-700 bg-gradient-to-r from-fuchsia-50 to-fuchsia-100/50',
                    iconBg: 'bg-fuchsia-100',
                    iconColor: 'text-fuchsia-600',
                    chevron: 'text-fuchsia-500',
                    activeBorder: 'border-fuchsia-500'
                  },
                  amber: {
                    hover: 'hover:bg-amber-50',
                    active: 'text-amber-700 bg-gradient-to-r from-amber-50 to-amber-100/50',
                    iconBg: 'bg-amber-100',
                    iconColor: 'text-amber-600',
                    chevron: 'text-amber-500',
                    activeBorder: 'border-amber-500'
                  },
                  orange: {
                    hover: 'hover:bg-orange-50',
                    active: 'text-orange-700 bg-gradient-to-r from-orange-50 to-orange-100/50',
                    iconBg: 'bg-orange-100',
                    iconColor: 'text-orange-600',
                    chevron: 'text-orange-500',
                    activeBorder: 'border-orange-500'
                  },
                  teal: {
                    hover: 'hover:bg-teal-50',
                    active: 'text-teal-700 bg-gradient-to-r from-teal-50 to-teal-100/50',
                    iconBg: 'bg-teal-100',
                    iconColor: 'text-teal-600',
                    chevron: 'text-teal-500',
                    activeBorder: 'border-teal-500'
                  },
                  slate: {
                    hover: 'hover:bg-muted',
                    active: 'text-foreground bg-muted',
                    iconBg: 'bg-muted',
                    iconColor: 'text-muted-foreground',
                    chevron: 'text-muted-foreground',
                    activeBorder: 'border-muted-foreground'
                  },
                  zinc: {
                    hover: 'hover:bg-zinc-50',
                    active: 'text-zinc-700 bg-gradient-to-r from-zinc-50 to-zinc-100/50',
                    iconBg: 'bg-zinc-200',
                    iconColor: 'text-zinc-600',
                    chevron: 'text-zinc-500',
                    activeBorder: 'border-zinc-500'
                  },
                  red: {
                    hover: 'hover:bg-red-50',
                    active: 'text-red-700 bg-gradient-to-r from-red-50 to-red-100/50',
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                    chevron: 'text-red-500',
                    activeBorder: 'border-red-500'
                  },
                };
                return colorMap[color] || colorMap.slate;
              };

              const groupColor = (group as any).color || 'slate';
              const styles = getGroupStyles(groupColor);
              const isOpen = openGroups.has(group.name);

              return (
                <div key={group.name}>
                  {/* Section divider for visual clarity */}
                  {index > 0 && !isCollapsed && ['Patients', 'Clinical Services', 'Finance & Analytics', 'Administration'].includes(group.name) && (
                    <div className="my-3 border-t border-border/70"></div>
                  )}

                  <Collapsible
                    open={isOpen}
                    onOpenChange={() => toggleGroup(group.name)}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 group relative ${isOpen ? `${styles.active} shadow-sm` : `text-sidebar-foreground ${styles.hover} hover:shadow-sm`
                          }`}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleGroup(group.name);
                        }}
                      >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'}`}>
                          <div className={`p-1.5 rounded-lg shadow-sm ${isOpen ? styles.iconBg : 'bg-muted'}`}>
                            <group.icon className={`w-4 h-4 flex-shrink-0 ${isOpen ? styles.iconColor : 'text-muted-foreground'}`} />
                          </div>
                          <span className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                            {group.name}
                          </span>
                        </div>
                        {!isCollapsed && (
                          isOpen ?
                            <ChevronDown className={`w-4 h-4 ${styles.chevron}`} /> :
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-3 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none shadow-lg border border-border">
                            {group.name}
                          </div>
                        )}
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className={`${isCollapsed ? 'hidden' : 'block'} overflow-visible`}>
                      <div className={`ml-4 mt-1.5 space-y-1 pl-4 py-2 border-l-2 ${isOpen ? styles.activeBorder : 'border-border'} bg-card/80 dark:bg-card/60 rounded-r-lg transition-colors duration-200`}>
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const itemActive = isActive(item.href);

                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`group relative flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${itemActive
                                ? `bg-primary/10 text-primary font-semibold shadow-sm`
                                : "text-foreground/80 font-medium hover:bg-muted hover:text-foreground hover:shadow-sm"
                                }`}
                              onClick={handleMobileLinkClick}
                            >
                              <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${itemActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                              <span className={`transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                                {item.name}
                              </span>

                              {/* Active indicator */}
                              {itemActive && (
                                <div className="absolute right-2.5 w-2 h-2 rounded-full bg-primary ring-2 ring-background"></div>
                              )}

                              {/* Tooltip for collapsed state */}
                              {isCollapsed && (
                                <div className="absolute left-full ml-2 px-3 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none shadow-lg border border-border">
                                  {item.name}
                                </div>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-sidebar-border bg-sidebar transition-all duration-300`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} group relative`}>
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 shadow-sm">
              {user?.firstName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              <p className="text-sm font-semibold text-sidebar-foreground">{user?.firstName || user?.username}</p>
              <p className="text-[11px] text-muted-foreground capitalize font-medium">{user?.role?.replace(/_/g, ' ')}</p>
            </div>

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none border border-border">
                {user?.firstName || user?.username} ({user?.role})
              </div>
            )}
          </div>

          <div className={`mt-3 space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            <Button
              variant="ghost"
              size={isCollapsed ? "sm" : "sm"}
              onClick={handleLogout}
              className={`text-red-600 hover:text-red-700 hover:bg-red-50/80 transition-all duration-200 ${isCollapsed ? 'w-8 h-8 p-1' : 'w-full justify-start text-xs font-medium'
                }`}
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && <span className="ml-2">Sign Out</span>}
            </Button>

            {onStartTour && (
              <div className={isCollapsed ? 'flex flex-col items-center' : ''}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onStartTour}
                  className={`text-sky-600 hover:text-sky-700 hover:bg-sky-50/80 transition-all duration-200 ${isCollapsed ? 'w-8 h-8 p-1' : 'w-full justify-start text-xs font-medium'
                    }`}
                  title="Take a tour of the system"
                >
                  <HelpCircle className="w-4 h-4" />
                  {!isCollapsed && <span className="ml-2">Help & Tour</span>}
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}