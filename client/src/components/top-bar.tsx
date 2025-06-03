import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Globe, Moon, Sun, User, Settings, Menu, X, Heart, BarChart3, Users, Stethoscope, FlaskRound, Pill, UserCheck, Calculator, TrendingUp, FileText, UserCog, Building2, Shield, Video, DollarSign, BookOpen, Download, MapPin, MessageSquare, Plus, UserPlus, CalendarPlus, TestTube } from "lucide-react";
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

const getNavigationForRole = (role: string) => {
  const allNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, roles: ["superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
    { name: "Patients", href: "/patients", icon: Users, roles: ["superadmin", "admin", "doctor", "nurse"] },
    { name: "Visits", href: "/visits", icon: Stethoscope, roles: ["superadmin", "admin", "doctor", "nurse"] },
    { name: "Lab Results", href: "/lab-results", icon: FlaskRound, roles: ["superadmin", "admin", "doctor", "nurse"] },
    { name: "Pharmacy", href: "/pharmacy", icon: Pill, roles: ["superadmin", "admin", "pharmacist"] },
    { name: "Referrals", href: "/referrals", icon: UserCheck, roles: ["superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
    { name: "Medical Tools", href: "/medical-tools", icon: Calculator, roles: ["superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
    { name: "Clinical Performance", href: "/clinical-performance", icon: TrendingUp, roles: ["superadmin", "admin", "doctor"] },
    { name: "Revenue Analytics", href: "/analytics", icon: DollarSign, roles: ["superadmin", "admin"] },
    { name: "Telemedicine", href: "/telemedicine", icon: Video, roles: ["superadmin", "admin", "doctor", "nurse"] },
    { name: "Clinical Protocols", href: "/protocols", icon: BookOpen, roles: ["superadmin", "admin", "doctor", "nurse"] },
    { name: "Staff Messages", href: "/staff-messages", icon: MessageSquare, roles: ["superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
    { name: "Compliance Export", href: "/compliance", icon: Download, roles: ["superadmin", "admin"] },
    { name: "Form Builder", href: "/form-builder", icon: FileText, roles: ["superadmin", "admin", "doctor", "nurse"] },
    { name: "User Management", href: "/user-management", icon: UserCog, roles: ["superadmin", "admin"] },
    { name: "Organization Management", href: "/organization-management", icon: Building2, roles: ["superadmin"] },
    { name: "Audit Logs", href: "/audit-logs", icon: Shield, roles: ["superadmin", "admin"] },
    { name: "Profile", href: "/profile", icon: Settings, roles: ["superadmin", "admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
  ];
  
  return allNavigation.filter(item => item.roles.includes(role));
};

export default function TopBar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState("EN");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useRole();

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
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  const navigation = getNavigationForRole(user?.role || '');

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const toggleLanguage = () => {
    setLanguage(language === "EN" ? "HA" : "EN");
  };

  return (
    <>
      <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-full">
            
            {/* Left Section: Logo & Navigation */}
            <div className="flex items-center space-x-6">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Menu className="h-5 w-5" />
              </Button>
              

              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                {navigation.slice(0, 4).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive(item.href)
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden lg:block">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

            </div>

            {/* Center Section: Organization Context */}
            {user?.organization && (
              <div className="hidden lg:flex items-center">
                <div className="flex items-center gap-4 px-5 py-2.5 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: user.organization.themeColor || '#3B82F6' }}
                    />
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {user.organization.name}
                      </span>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                    >
                      {user.organization.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      Online
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Right Section: Actions & Profile */}
            <div className="flex items-center space-x-1">
              
              {/* Quick Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="sr-only">Quick Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="text-sm font-semibold">Quick Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/patients/new" className="flex items-center w-full py-2">
                      <UserPlus className="mr-3 h-4 w-4 text-blue-600" />
                      <span>Add New Patient</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/appointments/new" className="flex items-center w-full py-2">
                      <CalendarPlus className="mr-3 h-4 w-4 text-green-600" />
                      <span>Schedule Appointment</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/prescriptions/new" className="flex items-center w-full py-2">
                      <FileText className="mr-3 h-4 w-4 text-purple-600" />
                      <span>New Prescription</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/lab-orders/new" className="flex items-center w-full py-2">
                      <TestTube className="mr-3 h-4 w-4 text-orange-600" />
                      <span>Order Lab Test</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full border border-white dark:border-slate-900">
                        <span className="sr-only">{unreadCount} notifications</span>
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span className="font-semibold">Notifications</span>
                    <Badge variant="secondary" className="h-5 text-xs">3</Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex gap-3">
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            New appointment scheduled
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Patient: John Doe - 2:30 PM today
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex gap-3">
                        <div className="h-2 w-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Lab results available
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Patient: Mary Smith - CBC Test completed
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="flex gap-3">
                        <div className="h-2 w-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Prescription expiring soon
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Patient: Robert Johnson - Review needed
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs justify-center">
                      View All Notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="hidden sm:flex h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Globe className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="sr-only">Language: {language}</span>
              </Button>

              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Offline Status */}
              <OfflineIndicator />

              {/* Divider */}
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-3 h-10 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="relative">
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-sm">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border border-white dark:border-slate-900" />
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {user?.username}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {user?.role}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.username}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user?.role} • {user?.organization?.name}
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
      </div>

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
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive(item.href)
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