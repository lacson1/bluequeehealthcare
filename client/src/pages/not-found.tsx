import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Home, ArrowLeft, Search, Plus, Lightbulb } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

// Available routes in the system
const availableRoutes = [
  { path: "/dashboard", name: "Dashboard", description: "Main overview and statistics" },
  { path: "/patients", name: "Patients", description: "Patient management and records" },
  { path: "/visits", name: "Visits", description: "Patient visit history and management" },
  { path: "/appointments", name: "Appointments", description: "Schedule and manage appointments" },
  { path: "/lab-results", name: "Lab Results", description: "Laboratory test results" },
  { path: "/lab-orders", name: "Lab Orders", description: "Order laboratory tests" },
  { path: "/pharmacy", name: "Pharmacy", description: "Medication and inventory management" },
  { path: "/prescriptions", name: "Prescriptions", description: "Prescription management and forms" },
  { path: "/referrals", name: "Referrals", description: "Patient referral system" },
  { path: "/documents", name: "Documents", description: "Medical documents and files" },
  { path: "/analytics", name: "Analytics", description: "Revenue and business analytics" },
  { path: "/telemedicine", name: "Telemedicine", description: "Remote consultation platform" },
  { path: "/physiotherapy", name: "Physiotherapy", description: "Physical therapy management" },
  { path: "/exercise-leaflets", name: "Exercise Leaflets", description: "Patient exercise guides" },
  { path: "/staff-messages", name: "Staff Messages", description: "Patient communication and messaging" },
  { path: "/form-builder", name: "Form Builder", description: "Custom medical form creation" },
  { path: "/medical-tools", name: "Medical Tools", description: "Clinical calculation tools" },
  { path: "/clinical-performance", name: "Clinical Performance", description: "Performance metrics and KPIs" },
  { path: "/profile", name: "Profile", description: "User profile and settings" },
  { path: "/user-management", name: "User Management", description: "System user administration" },
  { path: "/audit-logs", name: "Audit Logs", description: "System activity and security logs" },
  { path: "/error-monitoring", name: "Error Monitoring", description: "System error tracking and monitoring" },
  { path: "/organization-management", name: "Organization Management", description: "Multi-tenant organization settings" }
];

export default function NotFound() {
  const [location, setLocation] = useLocation();
  const [showCreateOptions, setShowCreateOptions] = useState(false);

  function findSimilarPages(currentPath: string) {
    const path = currentPath.toLowerCase();
    return availableRoutes.filter(route => {
      const routeName = route.name.toLowerCase();
      const routePath = route.path.toLowerCase();
      return routeName.includes(path.slice(1)) ||
        routePath.includes(path) ||
        path.includes(routeName.replace(/\s+/g, '-')) ||
        calculateSimilarity(path, routePath) > 0.3;
    }).slice(0, 4);
  }

  function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  function getEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    return matrix[str2.length][str1.length];
  }

  const suggestedPages = findSimilarPages(location);

  const createPageOptions = [
    {
      type: "report",
      title: "Analytics Report",
      description: "Create a custom analytics dashboard for " + location.slice(1),
      action: () => setLocation("/analytics")
    },
    {
      type: "form",
      title: "Custom Form",
      description: "Build a medical form for " + location.slice(1),
      action: () => setLocation("/form-builder")
    },
    {
      type: "workflow",
      title: "Clinical Workflow",
      description: "Design a clinical protocol for " + location.slice(1),
      action: () => setLocation("/protocols")
    }
  ];

  return (
    <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Main 404 Card */}
        <Card className="shadow-xl border-0 overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-green-600 text-white">
            <div className="mx-auto mb-4 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <AlertCircle className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">
              Page Not Found
            </CardTitle>
            <p className="text-blue-100 mt-2">
              The healthcare page you're looking for doesn't exist
            </p>
            <p className="text-white/80 text-sm mt-1">
              Path: <span className="font-mono bg-white/20 px-2 py-1 rounded text-sm">{location}</span>
            </p>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <Button
                onClick={() => setLocation('/')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>

              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowCreateOptions(!showCreateOptions)}
                className="flex-1 border-green-200 text-green-600 hover:bg-green-50 justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Page
              </Button>
            </div>

            {/* Suggested Similar Pages */}
            {suggestedPages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Did you mean?</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestedPages.map((page, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer border-blue-100"
                      onClick={() => setLocation(page.path)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{page.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">{page.description}</p>
                          </div>
                          <ArrowLeft className="w-4 h-4 text-blue-600 rotate-180" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Create Options */}
            {showCreateOptions && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Create Something New</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {createPageOptions.map((option, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer border-green-100"
                      onClick={option.action}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{option.type}</Badge>
                              <h4 className="font-medium text-gray-900">{option.title}</h4>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                          </div>
                          <Plus className="w-4 h-4 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Available Pages */}
            <details className="group">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
                <Search className="w-4 h-4" />
                Browse All Available Pages
                <span className="text-xs bg-blue-100 px-2 py-1 rounded-full">{availableRoutes.length}</span>
              </summary>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {availableRoutes.map((route, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="h-auto p-3 justify-start text-left"
                    onClick={() => setLocation(route.path)}
                  >
                    <div>
                      <div className="font-medium text-sm">{route.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{route.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </details>

            <div className="mt-6 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg text-center border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm sm:text-base text-blue-700 font-semibold">
                  Bluequee Health Management
                </p>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Comprehensive digital health platform for modern healthcare delivery
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}