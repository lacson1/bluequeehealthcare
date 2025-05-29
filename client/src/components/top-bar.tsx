import { useState } from "react";
import { Bell, Globe, Moon, Sun, User, Settings, Menu, X, Heart, BarChart3, Users, Stethoscope, FlaskRound, Pill, UserCheck, Calculator, TrendingUp, FileText, UserCog, Building2, Shield } from "lucide-react";
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
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, roles: ["admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
    { name: "Patients", href: "/patients", icon: Users, roles: ["admin", "doctor", "nurse"] },
    { name: "Visits", href: "/visits", icon: Stethoscope, roles: ["admin", "doctor", "nurse"] },
    { name: "Lab Results", href: "/lab-results", icon: FlaskRound, roles: ["admin", "doctor", "nurse"] },
    { name: "Pharmacy", href: "/pharmacy", icon: Pill, roles: ["admin", "pharmacist"] },
    { name: "Referrals", href: "/referrals", icon: UserCheck, roles: ["admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
    { name: "Medical Tools", href: "/medical-tools", icon: Calculator, roles: ["admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
    { name: "Clinical Performance", href: "/clinical-performance", icon: TrendingUp, roles: ["admin", "doctor"] },
    { name: "Form Builder", href: "/form-builder", icon: FileText, roles: ["admin", "doctor", "nurse"] },
    { name: "User Management", href: "/user-management", icon: UserCog, roles: ["admin"] },
    { name: "Organization Management", href: "/organization-management", icon: Building2, roles: ["admin"] },
    { name: "Audit Logs", href: "/audit-logs", icon: Shield, roles: ["admin"] },
    { name: "Profile", href: "/profile", icon: Settings, roles: ["admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
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

        {/* Right Side Actions */}
        <div className="flex items-center space-x-1 md:space-x-4">
        {/* Language Toggle - Hidden on very small screens */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="hidden sm:flex text-slate-600 hover:text-slate-800 text-xs md:text-sm"
        >
          <Globe className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
          {language}
        </Button>

        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDarkMode}
          className="text-slate-600 hover:text-slate-800"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Offline Status Indicator */}
        <OfflineIndicator />



        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-slate-600 hover:text-slate-800">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-white w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">{user?.username}</div>
                <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
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