import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Heart, BarChart3, Users, Stethoscope, FlaskRound, Pill, User, LogOut, UserCheck, Menu, X, Settings, UserCog, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole, RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";

const getNavigationForRole = (role: string) => {
  const allNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, roles: ["admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
    { name: "Patients", href: "/patients", icon: Users, roles: ["admin", "doctor", "nurse"] },
    { name: "Visits", href: "/visits", icon: Stethoscope, roles: ["admin", "doctor", "nurse"] },
    { name: "Lab Results", href: "/lab-results", icon: FlaskRound, roles: ["admin", "doctor", "nurse"] },
    { name: "Pharmacy", href: "/pharmacy", icon: Pill, roles: ["admin", "pharmacist"] },
    { name: "Referrals", href: "/referrals", icon: UserCheck, roles: ["admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
    { name: "User Management", href: "/user-management", icon: UserCog, roles: ["admin"] },
    { name: "Audit Logs", href: "/audit-logs", icon: Shield, roles: ["admin"] },
    { name: "Profile", href: "/profile", icon: Settings, roles: ["admin", "doctor", "nurse", "pharmacist", "physiotherapist"] },
  ];
  
  return allNavigation.filter(item => item.roles.includes(role));
};

export default function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { user } = useRole();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = getNavigationForRole(user?.role || '');

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg flex flex-col transition-all duration-300 ease-in-out relative`}>
      {/* Toggle Button */}
      <Button
        onClick={toggleSidebar}
        variant="ghost"
        size="sm"
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full bg-white shadow-md border border-slate-200 hover:bg-slate-50 p-0"
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
            <h1 className="text-xl font-bold text-slate-800 whitespace-nowrap">HealthCore</h1>
            <p className="text-sm text-slate-500 whitespace-nowrap">Clinic Management</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'} transition-all duration-300`}>
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg font-medium transition-all duration-200 group relative ${
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
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
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* User Profile */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-slate-200 transition-all duration-300`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} group relative`}>
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
            <User className="text-white w-4 h-4" />
          </div>
          <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            <p className="text-sm font-medium text-slate-700 whitespace-nowrap">{user?.username}</p>
            <p className="text-xs text-slate-500 capitalize whitespace-nowrap">{user?.role}</p>
          </div>
          
          {/* Tooltip for collapsed user info */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
              {user?.username} ({user?.role})
            </div>
          )}
          
          {!isCollapsed && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-600 p-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Logout button for collapsed state */}
        {isCollapsed && (
          <div className="mt-2 flex justify-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-600 p-1 w-8 h-8"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
