import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, User, Settings, Menu, X, Heart, BarChart3, Users, Stethoscope, FlaskRound, Pill, UserCheck, Calculator, TrendingUp, FileText, UserCog, Building2, Shield, Video, DollarSign, BookOpen, MessageSquare, Plus, UserPlus, ClipboardList, HeartHandshake, Trash2, Settings2, Moon, Sun, Search, HelpCircle, RefreshCw, Calendar, Activity } from "lucide-react";
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

const getNavigationForRole = (role: string) => {
  const allNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, roles: ["superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
    { name: "Clinical Activity", href: "/clinical-activity", icon: Heart, roles: ["superadmin", "admin", "doctor", "nurse"] },
    { name: "Patients", href: "/patients", icon: Users, roles: ["superadmin", "admin", "doctor", "nurse"] },
    { name: "Visits", href: "/patients", icon: Stethoscope, roles: ["superadmin", "admin", "doctor", "nurse"] },
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

  return (
    <>
      {/* Responsive Header: Height adjusts based on screen size */}
      <header className="h-11 sm:h-12 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
        <div className="h-full w-full px-1.5 xs:px-2 sm:px-3 md:px-4 lg:px-6">
          <div className="flex items-center justify-between h-full gap-1 sm:gap-2">

            {/* Left: Brand + Navigation - Responsive */}
            <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-1.5 flex-1 min-w-0 overflow-hidden">
              {/* Mobile Menu - Only on small screens */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden h-7 w-7 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md flex-shrink-0"
                title="Menu"
              >
                {mobileMenuOpen ? <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Menu className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </Button>

              {/* Brand/Logo - Responsive sizing */}
              <Link
                href="/dashboard"
                className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex-shrink-0"
                title={user?.organization?.name ? `${user.organization.name} • Bluequee` : "Bluequee"}
              >
                <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400 flex-shrink-0" />
                <span className="hidden xs:inline text-[10px] sm:text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
                  Bluequee
                </span>
              </Link>

              {/* Current Page Label - Helps orientation, truncates cleanly */}
              <div className="hidden sm:flex items-center min-w-0">
                <span className="mx-1 text-slate-300 dark:text-slate-600">•</span>
                <span
                  className="min-w-0 truncate text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                  title={currentPageLabel}
                >
                  {currentPageLabel}
                </span>
              </div>

              {/* Desktop Navigation - Responsive item count */}
              <nav className="hidden md:flex items-center gap-0.5 ml-1 lg:ml-2 overflow-x-auto scrollbar-none">
                {/* Show fewer items on medium screens, more on large */}
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center gap-1 lg:gap-1.5 px-1.5 lg:px-2 py-1 rounded-md text-[10px] lg:text-[11px] font-medium transition-all flex-shrink-0 ${active
                        ? "bg-blue-500 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      title={item.name}
                    >
                      <Icon className={`w-3 h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                      <span className="hidden lg:inline xl:inline whitespace-nowrap">{item.name}</span>
                    </Link>
                  );
                })}

                {/* More Menu - Shows remaining items */}
                {overflowNavItems.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 lg:px-2 text-[10px] lg:text-[11px] hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
                        title="More"
                      >
                        <Menu className="h-3 w-3 mr-0.5 lg:mr-1" />
                        <span className="hidden lg:inline">More</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 sm:w-56">
                      {overflowNavItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem key={item.name} asChild>
                            <Link href={item.href} className="flex items-center gap-2 w-full text-sm">
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

            {/* Center: Organization Badge - Only on larger screens */}
            {user?.organization && (
              <div className="hidden 2xl:flex items-center flex-shrink-0 max-w-[200px]">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-md border border-blue-200/50 dark:border-blue-700/50">
                  <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                    {user.organization.name}
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-blue-300 dark:border-blue-700 flex-shrink-0">
                    {user.organization.type}
                  </Badge>
                </div>
              </div>
            )}

            {/* Right: Actions & Profile - Responsive */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">

              {/* Quick Actions - Responsive (Configurable) */}
              {getVisibleIcons('right').some(i => i.id === 'quick-actions') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors flex-shrink-0"
                    title="Quick Actions"
                  >
                    <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Organization Functions
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Patient Management */}
                  <DropdownMenuItem asChild>
                    <Link href="/patients/new" className="flex items-center w-full py-2.5">
                      <UserPlus className="mr-3 h-4 w-4 text-blue-600" />
                      <div className="flex flex-col">
                        <span className="font-medium">Add New Patient</span>
                        <span className="text-xs text-slate-500">Register new patient to system</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  {/* Staff Management */}
                  <DropdownMenuItem asChild>
                    <Link href="/user-management" className="flex items-center w-full py-2.5">
                      <UserCog className="mr-3 h-4 w-4 text-emerald-600" />
                      <div className="flex flex-col">
                        <span className="font-medium">Manage Staff</span>
                        <span className="text-xs text-slate-500">Add, edit, and assign staff roles</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  {/* Clinical Workflows */}
                  <DropdownMenuItem asChild>
                    <Link href="/clinical-activity" className="flex items-center w-full py-2.5">
                      <HeartHandshake className="mr-3 h-4 w-4 text-red-600" />
                      <div className="flex flex-col">
                        <span className="font-medium">Clinical Workflows</span>
                        <span className="text-xs text-slate-500">Patient queue and consultation management</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  {/* Forms & Templates */}
                  <DropdownMenuItem asChild>
                    <Link href="/form-builder" className="flex items-center w-full py-2.5">
                      <ClipboardList className="mr-3 h-4 w-4 text-purple-600" />
                      <div className="flex flex-col">
                        <span className="font-medium">Custom Forms</span>
                        <span className="text-xs text-slate-500">Build consultation and assessment forms</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  {/* Organization Settings */}
                  {(user?.role === 'admin' || user?.role === 'superadmin') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/organization-management" className="flex items-center w-full py-2.5">
                          <Building2 className="mr-3 h-4 w-4 text-indigo-600" />
                          <div className="flex flex-col">
                            <span className="font-medium">Organization Setup</span>
                            <span className="text-xs text-slate-500">Configure clinic settings and branding</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link href="/analytics" className="flex items-center w-full py-2.5">
                          <TrendingUp className="mr-3 h-4 w-4 text-orange-600" />
                          <div className="flex flex-col">
                            <span className="font-medium">Performance Analytics</span>
                            <span className="text-xs text-slate-500">Revenue, efficiency, and clinical metrics</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              )}

              {/* Notifications - Responsive (Configurable) */}
              {getVisibleIcons('right').some(i => i.id === 'notifications') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 transition-colors flex-shrink-0"
                    aria-label={`${unreadCount} notifications`}
                    title={`${unreadCount} notifications`}
                  >
                    <Bell className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${unreadCount > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[12px] sm:min-w-[14px] h-3 sm:h-3.5 px-0.5 sm:px-1 bg-red-500 text-white text-[8px] sm:text-[9px] font-bold rounded-full flex items-center justify-center border border-white dark:border-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span className="font-semibold">Notifications</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="h-5 text-xs">
                        {clearNotificationsMutation.isPending ? '...' : notifications.length}
                      </Badge>
                      {notifications.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearNotifications}
                          disabled={clearNotificationsMutation.isPending}
                          className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Clear all notifications"
                        >
                          {clearNotificationsMutation.isPending ? (
                            <div className="h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification, index) => (
                        <Link
                          key={notification.id}
                          href="/staff-messages"
                          className={`group block p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 cursor-pointer ${deleteNotificationMutation.isPending && deleteNotificationMutation.variables === notification.id
                              ? 'opacity-50 pointer-events-none'
                              : ''
                            } ${index < notifications.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${notification.color || 'bg-blue-500'}`} />
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
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all duration-200 disabled:opacity-50"
                              title="Delete notification"
                            >
                              {deleteNotificationMutation.isPending && deleteNotificationMutation.variables === notification.id ? (
                                <div className="h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs justify-center">
                      View All Notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              )}

              {/* Additional Configurable Icons */}
              {getVisibleIcons('right').some(i => i.id === 'messages') && (
                <Link href="/staff-messages">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors flex-shrink-0"
                    title="Staff Messages"
                  >
                    <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </Link>
              )}

              {getVisibleIcons('right').some(i => i.id === 'calendar') && (
                <Link href="/appointments">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 transition-colors flex-shrink-0"
                    title="Appointments"
                  >
                    <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </Link>
              )}

              {getVisibleIcons('right').some(i => i.id === 'activity') && (
                <Link href="/performance">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 transition-colors flex-shrink-0"
                    title="System Activity"
                  >
                    <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </Link>
              )}

              {getVisibleIcons('right').some(i => i.id === 'help') && (
                <Link href="/help">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                    title="Help & Support"
                  >
                    <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </Link>
              )}

              {/* System Status */}
              <OfflineIndicator />

              {/* System Admin Link - Configurable */}
              {getVisibleIcons('right').some(i => i.id === 'admin-panel') && (user?.role === 'admin' || user?.role === 'superadmin') && (
                <Link href="/super-admin-control-panel" className="hidden xs:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 transition-colors flex-shrink-0"
                    title="System Administration"
                  >
                    <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </Link>
              )}

              {/* TopBar Customizer - Admin only */}
              {(user?.role === 'admin' || user?.role === 'superadmin') && (
                <TopBarCustomizer
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden sm:flex h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                      title="Customize TopBar"
                    >
                      <Settings2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-500" />
                    </Button>
                  }
                />
              )}

              {/* Divider - Hidden on very small screens */}
              <div className="hidden xs:block h-3 sm:h-4 w-px bg-slate-300 dark:bg-slate-600 flex-shrink-0" />

              {/* User Profile - Responsive */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 sm:gap-1.5 h-6 sm:h-7 px-1 sm:px-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="h-5 w-5 sm:h-6 sm:w-6 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-md flex items-center justify-center shadow-sm ring-1 ring-blue-600/20">
                        <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 bg-emerald-500 rounded-full border border-white dark:border-slate-900" />
                    </div>
                    <div className="hidden md:block text-left pr-0.5 sm:pr-1">
                      <div className="text-[10px] sm:text-[11px] font-semibold text-slate-900 dark:text-slate-100 leading-tight max-w-[80px] truncate">
                        {user?.username}
                      </div>
                      <div className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 capitalize leading-tight">
                        {user?.role}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {user?.firstName && user?.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user?.username || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {[user?.role, user?.organization?.name]
                          .filter(Boolean)
                          .join(' • ') || 'No role assigned'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/my-profile" className="flex items-center py-2">
                      <User className="mr-3 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center py-2">
                      <Settings className="mr-3 h-4 w-4" />
                      <span>Account Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/help" className="flex items-center py-2">
                      <BookOpen className="mr-3 h-4 w-4" />
                      <span>Help & Support</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                    onClick={() => window.location.href = '/api/logout'}
                  >
                    <User className="mr-3 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive(item.href)
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}