import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, User, Settings, Menu, X, Heart, BarChart3, Users, Stethoscope, FlaskRound, Pill, UserCheck, Calculator, TrendingUp, FileText, UserCog, Building2, Shield, Video, DollarSign, BookOpen, MessageSquare, Plus, UserPlus, ClipboardList, HeartHandshake, Trash2, Settings2, Moon, Sun, Search, HelpCircle, RefreshCw, Calendar, Activity, ChevronRight, Command, Globe, Keyboard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/components/role-guard";
import { Link, useLocation } from "wouter";
import OfflineIndicator from "@/components/offline-indicator";
import { useToast } from "@/hooks/use-toast";
import { useTopBarConfig } from "@/hooks/use-topbar-config";
import { TopBarCustomizer } from "@/components/topbar-customizer";
import { GlobalSearch } from "@/components/global-search";

const getNavigationForRole = (role: string) => {
  const allNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, roles: ["superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
    { name: "Clinical Activity", href: "/clinical-activity", icon: Heart, roles: ["superadmin", "admin", "doctor", "nurse"] },
    { name: "Patients", href: "/patients", icon: Users, roles: ["superadmin", "admin", "doctor", "nurse"] },
    { name: "Workflow", href: "/visits", icon: Stethoscope, roles: ["superadmin", "admin", "doctor", "nurse"] },
    { name: "Lab Results", href: "/lab-results", icon: FlaskRound, roles: ["superadmin", "admin", "doctor", "nurse"] },
    { name: "Pharmacy", href: "/pharmacy", icon: Pill, roles: ["superadmin", "admin", "pharmacist"] },
    { name: "Referrals", href: "/referrals", icon: UserCheck, roles: ["superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
    { name: "Medical Tools", href: "/medical-tools", icon: Calculator, roles: ["superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
    { name: "Clinical Performance", href: "/clinical-performance", icon: TrendingUp, roles: ["superadmin", "admin", "doctor"] },
    { name: "Revenue Analytics", href: "/analytics", icon: DollarSign, roles: ["superadmin", "admin"] },
    { name: "Telemedicine", href: "/telemedicine", icon: Video, roles: ["superadmin", "admin", "doctor", "nurse"] },
    { name: "Staff Messages", href: "/staff-messages", icon: MessageSquare, roles: ["superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
    { name: "Form Builder", href: "/form-builder", icon: FileText, roles: ["superadmin", "admin", "doctor", "nurse"] },
    { name: "User Management", href: "/user-management", icon: UserCog, roles: ["superadmin", "admin"] },
    { name: "Organization Management", href: "/organization-management", icon: Building2, roles: ["superadmin"] },
    { name: "Audit Logs", href: "/audit-logs", icon: Shield, roles: ["superadmin", "admin"] },
    { name: "Profile", href: "/profile", icon: Settings, roles: ["superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
  ];

  return allNavigation.filter(item => item.roles.includes(role));
};

function getNavLimit(width: number) {
  // Keep logic aligned with Tailwind breakpoints used in the header:
  // md: >= 768 (nav becomes visible), lg: >= 1024, xl: >= 1280
  if (width >= 1280) return 5;
  if (width >= 1024) return 4;
  return 3;
}

function getCurrentPageLabel(location: string, navigation: { name: string; href: string }[]) {
  // Prefer the longest matching href (e.g. "/patients" beats "/")
  const normalized = location === "/" ? "/dashboard" : location;
  const match = navigation
    .filter(n => normalized === n.href || normalized.startsWith(n.href + "/") || normalized.startsWith(n.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (match) return match.name;

  // Fallbacks for common routes not in navigation for some roles
  const fallbacks: Array<{ prefix: string; label: string }> = [
    { prefix: "/appointments", label: "Appointments" },
    { prefix: "/my-profile", label: "My Profile" },
    { prefix: "/settings", label: "Settings" },
    { prefix: "/help", label: "Help & Support" },
  ];
  const fb = fallbacks.find(f => normalized === f.prefix || normalized.startsWith(f.prefix + "/") || normalized.startsWith(f.prefix));
  return fb?.label ?? "Dashboard";
}

export default function TopBar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState("EN");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useRole();
  const { toast } = useToast();
  const { getVisibleIcons } = useTopBarConfig(user?.role || '');
  const [navLimit, setNavLimit] = useState(() => (typeof window === "undefined" ? 3 : getNavLimit(window.innerWidth)));

  // Fetch real-time notifications
  const { data: notificationsData, isLoading: notificationsLoading } = useQuery<{
    notifications: Array<{
      id: string;
      type: string;
      priority: string;
      title: string;
      description: string;
      timestamp: string;
      color: string;
    }>;
    totalCount: number;
    unreadCount: number;
  }>({
    queryKey: ['/api/notifications'],
    refetchInterval: 2 * 60 * 1000, // Reduced from 30s to 2 minutes
    staleTime: 60 * 1000, // Cache for 1 minute
    retry: false,
    enabled: true, // Always fetch, but handle errors gracefully in queryClient
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;
  const queryClient = useQueryClient();

  // Clear all notifications mutation
  const clearNotificationsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/notifications/clear', 'POST');
      return response.json();
    },
    onSuccess: (data) => {
      // Refresh notifications data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Notifications cleared",
        description: `Successfully cleared ${data.clearedCount || 'all'} notification${data.clearedCount !== 1 ? 's' : ''}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear notifications. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete individual notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest(`/api/notifications/${notificationId}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      // Refresh notifications data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Notification deleted",
        description: "Notification removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete notification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClearNotifications = () => {
    clearNotificationsMutation.mutate();
  };

  const handleDeleteNotification = (notificationId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    deleteNotificationMutation.mutate(notificationId);
  };

  const navigation = getNavigationForRole(user?.role || '');

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  useEffect(() => {
    const update = () => setNavLimit(getNavLimit(window.innerWidth));
    update();
    window.addEventListener("resize", update, { passive: true } as AddEventListenerOptions);
    return () => window.removeEventListener("resize", update as EventListener);
  }, []);

  const currentPageLabel = useMemo(() => getCurrentPageLabel(location, navigation), [location, navigation]);
  const primaryNavItems = useMemo(() => navigation.slice(0, navLimit), [navigation, navLimit]);
  const overflowNavItems = useMemo(() => navigation.slice(navLimit), [navigation, navLimit]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const toggleLanguage = () => {
    setLanguage(language === "EN" ? "HA" : "EN");
  };

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Get breadcrumb path
  const breadcrumbs = useMemo(() => {
    const pathSegments = location.split('/').filter(Boolean);
    const crumbs: Array<{ name: string; href: string }> = [{ name: 'Dashboard', href: '/dashboard' }];
    const seenHrefs = new Set<string>(['/dashboard']);
    
    pathSegments.forEach((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const navItem = navigation.find(n => n.href === href || href.startsWith(n.href + '/'));
      if (navItem && !seenHrefs.has(navItem.href)) {
        seenHrefs.add(navItem.href);
        crumbs.push({ name: navItem.name, href: navItem.href });
      }
    });
    
    return crumbs;
  }, [location, navigation]);

  return (
    <>
      {/* Premium Responsive Header with Enhanced Design */}
      <header className="h-12 sm:h-14 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] sticky top-0 z-50 backdrop-blur-xl bg-white/95 dark:bg-slate-950/95 supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-slate-950/80">
        <div className="h-full w-full px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-full gap-2 sm:gap-3">

            {/* Left: Brand + Navigation - Simplified Layout */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
              {/* Mobile Menu */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden h-8 w-8 p-0"
                title="Menu"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>

              {/* Brand/Logo - Simplified */}
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                title={user?.organization?.name || "Bluequee"}
              >
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="hidden sm:inline text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap max-w-[140px] truncate">
                  {user?.organization?.name || "Bluequee"}
                </span>
              </Link>

              {/* Current Page Label - Simplified */}
              <div className="hidden sm:flex items-center min-w-0 ml-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">•</span>
                <span
                  className="ml-2 min-w-0 truncate text-xs font-medium text-slate-700 dark:text-slate-300"
                  title={currentPageLabel}
                >
                  {currentPageLabel}
                </span>
              </div>

              {/* Desktop Navigation - Simplified, fewer items */}
              <nav className="hidden lg:flex items-center gap-1 ml-3 overflow-x-auto scrollbar-none">
                {primaryNavItems.slice(0, Math.min(navLimit, 4)).map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex-shrink-0 ${
                        active
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      title={item.name}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="hidden xl:inline whitespace-nowrap">{item.name}</span>
                    </Link>
                  );
                })}

                {/* More Menu - Simplified */}
                {(overflowNavItems.length > 0 || primaryNavItems.length > 4) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex-shrink-0"
                        title="More"
                      >
                        <Menu className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden xl:inline">More</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 rounded-lg">
                      <DropdownMenuLabel className="text-xs text-slate-500 uppercase">
                        More Options
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {[...primaryNavItems.slice(4), ...overflowNavItems].map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <DropdownMenuItem 
                            key={item.name} 
                            asChild
                            className={active ? 'bg-blue-50 dark:bg-blue-950/30' : ''}
                          >
                            <Link href={item.href} className="flex items-center gap-2 w-full text-sm py-2">
                              <Icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </nav>
            </div>

            {/* Right: Actions & Profile - Simplified Layout */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              
              {/* Global Search - Simplified */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-1.5 h-8 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Search (⌘K)"
              >
                <Search className="h-4 w-4" />
                <span className="hidden xl:inline text-xs">Search</span>
              </Button>

              {/* Quick Actions - Simplified */}
              {getVisibleIcons('right').some(i => i.id === 'quick-actions') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                    title="Quick Actions"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 rounded-xl shadow-lg border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                  <DropdownMenuLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    Quick Actions
                  </DropdownMenuLabel>

                  {/* Patient Management */}
                  <DropdownMenuItem asChild>
                    <Link href="/patients/new" className="flex items-center w-full py-3 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                        <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">Add New Patient</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Register new patient to system</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  {/* Staff Management */}
                  <DropdownMenuItem asChild>
                    <Link href="/user-management" className="flex items-center w-full py-3 px-4 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mr-3">
                        <UserCog className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">Manage Staff</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Add, edit, and assign staff roles</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  {/* Clinical Workflows */}
                  <DropdownMenuItem asChild>
                    <Link href="/clinical-activity" className="flex items-center w-full py-3 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                        <HeartHandshake className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">Clinical Workflows</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Patient queue and consultation management</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  {/* Forms & Templates */}
                  <DropdownMenuItem asChild>
                    <Link href="/form-builder" className="flex items-center w-full py-3 px-4 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                        <ClipboardList className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">Custom Forms</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Build consultation and assessment forms</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  {/* Organization Settings */}
                  {(user?.role === 'admin' || user?.role === 'superadmin') && (
                    <>
                      <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-2" />
                      <DropdownMenuItem asChild>
                        <Link href="/organization-management" className="flex items-center w-full py-3 px-4 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                            <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">Organization Setup</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Configure clinic settings and branding</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link href="/analytics" className="flex items-center w-full py-3 px-4 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mr-3">
                            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">Performance Analytics</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Revenue, efficiency, and clinical metrics</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              )}

              {/* Notifications - Simplified */}
              {getVisibleIcons('right').some(i => i.id === 'notifications') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-8 w-8 p-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                    aria-label={`${unreadCount} notifications`}
                    title={`${unreadCount} notifications`}
                  >
                    <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white dark:border-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 rounded-lg">
                  <DropdownMenuLabel className="flex items-center justify-between px-3 py-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="h-4 px-1.5 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearNotifications}
                        disabled={clearNotificationsMutation.isPending}
                        className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Clear all"
                      >
                        {clearNotificationsMutation.isPending ? (
                          <div className="h-3 w-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification, index) => (
                        <Link
                          key={notification.id}
                          href="/staff-messages"
                          className={`group block p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer rounded-md mx-1 my-0.5 ${deleteNotificationMutation.isPending && deleteNotificationMutation.variables === notification.id
                              ? 'opacity-50 pointer-events-none'
                              : ''
                            }`}
                        >
                          <div className="flex gap-2">
                            <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${notification.color || 'bg-blue-500'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {notification.description}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              disabled={deleteNotificationMutation.isPending}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 rounded"
                              title="Delete"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="p-2">
                        <Button variant="ghost" size="sm" className="w-full text-xs justify-center">
                          View All
                        </Button>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              )}

              {/* System Status - Hidden by default, can be enabled via customizer */}
              {getVisibleIcons('right').some(i => i.id === 'offline-indicator') && <OfflineIndicator />}

              {/* System Admin Link - Only show if enabled */}
              {getVisibleIcons('right').some(i => i.id === 'admin-panel') && (user?.role === 'admin' || user?.role === 'superadmin') && (
                <Link href="/super-admin-control-panel">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                    title="System Administration"
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                </Link>
              )}

              {/* TopBar Customizer - Admin only, hidden by default */}
              {getVisibleIcons('right').some(i => i.id === 'customizer') && (user?.role === 'admin' || user?.role === 'superadmin') && (
                <TopBarCustomizer
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                      title="Customize TopBar"
                    >
                      <Settings2 className="h-4 w-4 text-slate-500" />
                    </Button>
                  }
                />
              )}

              {/* Divider */}
              <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

              {/* User Profile Dropdown - Simplified */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                  >
                    <div className="h-7 w-7 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-tight max-w-[80px] truncate">
                        {user?.username}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize leading-tight">
                        {user?.role}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-lg">
                  <DropdownMenuLabel className="px-3 py-2 border-b">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user?.username || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate">
                          {user?.role || 'No role'}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <div className="p-1">
                    <DropdownMenuItem asChild>
                      <Link href="/my-profile" className="flex items-center gap-2 py-2 px-2 rounded-md">
                        <User className="h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2 py-2 px-2 rounded-md">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-1">
                    <DropdownMenuItem
                      className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                      onClick={() => window.location.href = '/api/logout'}
                    >
                      <User className="h-4 w-4 mr-2" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Mobile Navigation Menu - Premium Design */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl">
          <div className="px-4 py-4 space-y-2">
            {/* Mobile Search Button */}
            <Button
              variant="outline"
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
              className="w-full justify-start gap-2 h-10 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Search...</span>
              <kbd className="ml-auto h-5 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-600 dark:text-slate-400">
                <Command className="h-2.5 w-2.5" />
                <span>K</span>
              </kbd>
            </Button>
            
            {/* Navigation Items */}
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className={`p-1.5 rounded-lg ${active ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <Icon className={`w-5 h-5 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {active && (
                    <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}