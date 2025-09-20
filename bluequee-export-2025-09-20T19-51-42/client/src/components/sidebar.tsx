import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Heart, BarChart3, Users, Stethoscope, FlaskRound, Pill, User, LogOut, UserCheck, Menu, X, Settings, UserCog, Shield, FileText, TrendingUp, Building2, Calculator, HelpCircle, ChevronDown, ChevronRight, Brain, Calendar, ClipboardList, Activity, Star, Building, CreditCard, Mail, DollarSign, Receipt, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole, RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GlobalQuickSearch } from "@/components/global-quick-search";

const getNavigationGroupsForRole = (role: string) => {
  // Super admin gets enhanced navigation with system-wide access
  const superAdminExtras = (role === 'super_admin' || role === 'superadmin') ? [
    {
      name: "System Overview",
      icon: BarChart3,
      items: [
        { name: "Global Analytics", href: "/superadmin/analytics", icon: TrendingUp, roles: ["super_admin", "super_admin", "superadmin"] },
        { name: "Super Admin Control Panel", href: "/super-admin-control", icon: Shield, roles: ["super_admin", "super_admin", "superadmin"] },
      ]
    }
  ] : [];

  const navigationGroups = [
    {
      name: "Dashboard",
      icon: BarChart3,
      items: [
        { name: "Overview", href: "/dashboard", icon: BarChart3, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
        { name: "Clinical Activity Center", href: "/visits", icon: Activity, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
      ]
    },
    {
      name: "Patient Management",
      icon: Users,
      items: [
        { name: "Patient Registry", href: "/patients", icon: Users, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Appointments", href: "/appointments", icon: Calendar, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Consultation Dashboard", href: "/consultation-dashboard", icon: Stethoscope, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Patient Access Cards", href: "/patient-access-cards", icon: CreditCard, roles: ["super_admin", "superadmin", "admin", "nurse"] },
      ]
    },
    {
      name: "Clinical Services",
      icon: Stethoscope,
      items: [
        { name: "Laboratory Management", href: "/laboratory", icon: FlaskRound, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Pharmacy Management", href: "/pharmacy", icon: Pill, roles: ["super_admin", "superadmin", "admin", "pharmacist"] },
        { name: "Referrals", href: "/referrals", icon: UserCheck, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
        { name: "Procedural Reports", href: "/procedural-reports", icon: ClipboardList, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
      ]
    },
    {
      name: "Specialized Care",
      icon: Heart,
      items: [
        { name: "Physiotherapy", href: "/physiotherapy", icon: Heart, roles: ["super_admin", "superadmin", "admin", "physiotherapist"] },
        { name: "Telemedicine", href: "/telemedicine", icon: Heart, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Exercise Leaflets", href: "/exercise-leaflets", icon: FileText, roles: ["super_admin", "superadmin", "admin", "doctor", "physiotherapist"] },
      ]
    },
    {
      name: "Document Management",
      icon: FileText,
      items: [
        { name: "Medical Documents", href: "/documents", icon: FileText, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Medical Certificates", href: "/medical-certificates", icon: Shield, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Referral Letters", href: "/referral-letters", icon: UserCheck, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Consent Management", href: "/consent-management", icon: Shield, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
        { name: "Form Builder", href: "/form-builder", icon: FileText, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
      ]
    },
    {
      name: "Inventory & Operations",
      icon: Building2,
      items: [
        { name: "Inventory Management", href: "/inventory", icon: Building2, roles: ["super_admin", "superadmin", "admin", "pharmacist"] },
        { name: "Medical Tools", href: "/medical-tools", icon: Calculator, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
        { name: "Clinical Protocols", href: "/protocols", icon: ClipboardList, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse"] },
      ]
    },
    {
      name: "Financial Management",
      icon: DollarSign,
      items: [
        { name: "Billing & Invoicing", href: "/billing", icon: Receipt, roles: ["super_admin", "superadmin", "admin", "nurse"] },
        { name: "Revenue Analytics", href: "/analytics", icon: TrendingUp, roles: ["super_admin", "superadmin", "admin"] },
      ]
    },
    {
      name: "Analytics & Reports",
      icon: TrendingUp,
      items: [
        { name: "Clinical Performance", href: "/clinical-performance", icon: TrendingUp, roles: ["super_admin", "superadmin", "admin", "doctor"] },
        { name: "Export Compliance", href: "/compliance", icon: Shield, roles: ["super_admin", "superadmin", "admin"] },
      ]
    },
    {
      name: "System Administration",
      icon: Settings,
      items: [
        { name: "User Management", href: "/user-management", icon: UserCog, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Organization Management", href: "/organization-management", icon: Building2, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Staff Messages", href: "/staff-messages", icon: Mail, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
        { name: "Audit Logs", href: "/audit-logs", icon: Shield, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Error Monitoring", href: "/error-monitoring", icon: AlertTriangle, roles: ["super_admin", "superadmin", "admin"] },
        { name: "Performance Dashboard", href: "/performance", icon: TrendingUp, roles: ["super_admin", "superadmin", "admin"] },
      ]
    },
    {
      name: "Personal",
      icon: User,
      items: [
        { name: "My Profile", href: "/profile", icon: User, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
        { name: "Settings", href: "/settings", icon: Settings, roles: ["super_admin", "superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
      ]
    }
  ];

  return [...superAdminExtras, ...navigationGroups].map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(role))
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

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Button */}
      <Button
        onClick={toggleMobileSidebar}
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-md border border-slate-200 hover:bg-slate-50"
      >
        <Menu className="h-4 w-4 text-slate-600" />
      </Button>

      {/* Sidebar */}
      <div 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          ${isCollapsed ? 'w-16' : 'w-64'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-white shadow-lg flex flex-col transition-all duration-300 ease-in-out
          h-screen overflow-hidden
        `}
      >
        {/* Desktop Toggle Button */}
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="sm"
          className="hidden lg:block absolute -right-3 top-6 z-10 h-6 w-6 rounded-full bg-white shadow-md border border-slate-200 hover:bg-slate-50 p-0"
        >
          {isCollapsed ? (
            <Menu className="h-3 w-3 text-slate-600" />
          ) : (
            <X className="h-3 w-3 text-slate-600" />
          )}
        </Button>

        {/* Logo Section */}
        <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-b border-slate-200 transition-all duration-300`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Heart className="text-white h-6 w-6" />
            </div>
            <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              <h1 className="text-lg font-bold text-slate-800 whitespace-nowrap">Bluequee</h1>
              <p className="text-sm text-slate-500 whitespace-nowrap">Clinical Management</p>
            </div>
          </div>
          
          {/* Quick Search - Only show when not collapsed */}
          {!isCollapsed && (
            <div className="mt-4">
              <GlobalQuickSearch />
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'} transition-all duration-300 overflow-y-auto`}>
          <div className="space-y-2">
            {navigationGroups.map((group) => (
              <div key={group.name}>
                <Collapsible 
                  open={openGroups.has(group.name)} 
                  onOpenChange={() => toggleGroup(group.name)}
                >
                  <CollapsibleTrigger asChild>
                    <button 
                      className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 group relative`}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleGroup(group.name);
                      }}
                    >
                      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'}`}>
                        <group.icon className="w-4 h-4 flex-shrink-0" />
                        <span className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                          {group.name}
                        </span>
                      </div>
                      {!isCollapsed && (
                        openGroups.has(group.name) ? 
                          <ChevronDown className="w-4 h-4" /> : 
                          <ChevronRight className="w-4 h-4" />
                      )}

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                          {group.name}
                        </div>
                      )}
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className={`${isCollapsed ? 'hidden' : 'block'}`}>
                    <div className="ml-4 mt-1 space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        
                        // Check if item has submenu
                        if (item.submenu) {
                          return (
                            <Collapsible key={item.name} open={openGroups.has(item.name)}>
                              <CollapsibleTrigger asChild>
                                <button 
                                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm rounded-lg transition-all duration-200 group`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toggleGroup(item.name);
                                  }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    <span>{item.name}</span>
                                  </div>
                                  {openGroups.has(item.name) ? 
                                    <ChevronDown className="w-4 h-4" /> : 
                                    <ChevronRight className="w-4 h-4" />
                                  }
                                </button>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent>
                                <div className="ml-6 mt-1 space-y-1">
                                  {item.submenu.map((subItem) => {
                                    const SubIcon = subItem.icon;
                                    return (
                                      <Link
                                        key={subItem.name}
                                        href={subItem.href}
                                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                          isActive(subItem.href)
                                            ? "bg-primary/10 text-primary"
                                            : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                        onClick={handleMobileLinkClick}
                                      >
                                        <SubIcon className="w-4 h-4 flex-shrink-0" />
                                        <span>{subItem.name}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        }
                        
                        // Regular item without submenu
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`group relative flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isActive(item.href)
                                ? "bg-primary/10 text-primary"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                            onClick={handleMobileLinkClick}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                              {item.name}
                            </span>
                            
                            {/* Tooltip for collapsed state */}
                            {isCollapsed && (
                              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
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
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-slate-200 transition-all duration-300`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} group relative`}>
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
              {user?.firstName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              <p className="text-sm font-medium text-slate-700">{user?.firstName || user?.username}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                {user?.firstName || user?.username} ({user?.role})
              </div>
            )}
          </div>

          <div className={`mt-3 space-y-2 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            <Button
              variant="ghost"
              size={isCollapsed ? "sm" : "sm"}
              onClick={handleLogout}
              className={`text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors ${
                isCollapsed ? 'w-8 h-8 p-1' : 'w-full justify-start text-xs'
              }`}
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && <span className="ml-2">Logout</span>}
            </Button>

            {onStartTour && (
              <div className={isCollapsed ? 'flex flex-col items-center' : ''}>
                <Button
                  variant="ghost"
                  size="sm" 
                  onClick={onStartTour}
                  className={`text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors ${
                    isCollapsed ? 'w-8 h-8 p-1' : 'w-full justify-start text-xs'
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
      </div>
    </>
  );
}