import { Link, useLocation } from "wouter";
import { Heart, BarChart3, Users, Stethoscope, FlaskRound, Pill, User, LogOut } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Visits", href: "/visits", icon: Stethoscope },
  { name: "Lab Results", href: "/lab-results", icon: FlaskRound },
  { name: "Pharmacy", href: "/pharmacy", icon: Pill },
];

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Heart className="text-white h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">HealthCore</h1>
            <p className="text-sm text-slate-500">Clinic Management</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <User className="text-white w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700">Dr. Adebayo</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
