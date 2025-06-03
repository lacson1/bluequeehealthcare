import { useState } from "react";
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
      <div className="h-14 md:h-16 bg-white border-b border-slate-200 px-3 md:px-6 flex items-center justify-between">
        {/* Mobile Menu Button & Logo */}
        <div className="flex items-center space-x-2 md:space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2 md:hidden">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="text-white h-4 w-4 md:h-5 md:w-5" />
            </div>
            <span className="text-base md:text-lg font-bold text-slate-800">HealthCore</span>
          </div>
          <h2 className="hidden md:block text-lg font-semibold text-slate-800">Dashboard</h2>
        </div>

        {/* Professional Organization Context Panel */}
        {user?.organization && (
          <div className="hidden md:flex items-center gap-3">
            {/* Organization Badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: user.organization.themeColor || '#3B82F6' }}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {user.organization.name}
                    </span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-xs w-fit bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 font-medium"
                  >
                    {user.organization.type}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Stats Indicator */}
            <div className="flex items-center gap-1 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Active
              </span>
            </div>
          </div>
        )}

        {/* Professional Action Panel */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Quick Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 p-2"
              >
                <Plus className="w-5 h-5" />
                <span className="sr-only">Quick Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/patients/new" className="flex items-center w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add New Patient
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/appointments/new" className="flex items-center w-full">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/prescriptions/new" className="flex items-center w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  New Prescription
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/lab-orders/new" className="flex items-center w-full">
                  <TestTube className="mr-2 h-4 w-4" />
                  Order Lab Test
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
                className="relative text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 p-2"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  3
                </span>
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Recent Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        New appointment scheduled
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Patient: John Doe - 2:30 PM today
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        Lab results available
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Patient: Mary Smith - CBC Test completed
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        Prescription expiring soon
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Patient: Robert Johnson - Review needed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  View All Notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="hidden sm:flex text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs md:text-sm p-2"
          >
            <Globe className="w-4 h-4 mr-1" />
            {language}
          </Button>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 p-2"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Offline Status Indicator */}
          <OfflineIndicator />



          {/* Enhanced User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                      <User className="text-white w-5 h-5" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {user?.username}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                        {user?.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-semibold">
                <div className="flex flex-col">
                  <span>{user?.username}</span>
                  <span className="text-xs text-muted-foreground font-normal capitalize">
                    {user?.role} • {user?.organization?.name}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/my-profile" className="flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/help" className="flex items-center w-full">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Help & Support
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                onClick={() => window.location.href = '/api/logout'}
              >
                <User className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-lg">
          <div className="px-4 py-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-100"
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