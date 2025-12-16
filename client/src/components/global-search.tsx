import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Users, 
  Calendar, 
  FileText, 
  Pill, 
  TestTube, 
  Settings, 
  BarChart3, 
  Shield, 
  MessageCircle, 
  Printer,
  Heart,
  Stethoscope,
  Building,
  UserCheck,
  ClipboardList,
  Activity,
  Package,
  Archive,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Eye,
  Download,
  Upload,
  Filter,
  RefreshCw
} from "lucide-react";
import { useLocation } from "wouter";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: any;
  path: string;
  keywords: string[];
}

interface LiveSearchResult {
  id: number;
  type: string;
  title: string;
  subtitle: string;
  description: string;
  metadata: any;
}

const searchableItems: SearchResult[] = [
  // Dashboard & Analytics
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Overview of clinic statistics and quick actions",
    category: "Overview",
    icon: BarChart3,
    path: "/",
    keywords: ["dashboard", "overview", "stats", "statistics", "home", "main"]
  },
  
  // Patient Management
  {
    id: "patients",
    title: "Patient Management",
    description: "View, add, and manage patient records",
    category: "Patients",
    icon: Users,
    path: "/patients",
    keywords: ["patients", "patient", "records", "medical records", "demographics"]
  },
  {
    id: "add-patient",
    title: "Add New Patient",
    description: "Register a new patient in the system",
    category: "Patients",
    icon: Plus,
    path: "/patients?action=add",
    keywords: ["add patient", "new patient", "register", "registration", "enroll"]
  },
  
  // Appointments
  {
    id: "appointments",
    title: "Appointments",
    description: "Schedule and manage patient appointments",
    category: "Scheduling",
    icon: Calendar,
    path: "/appointments",
    keywords: ["appointments", "schedule", "booking", "calendar", "visit"]
  },
  {
    id: "book-appointment",
    title: "Book Appointment",
    description: "Schedule a new appointment for patients",
    category: "Scheduling",
    icon: Plus,
    path: "/appointments?action=book",
    keywords: ["book", "schedule", "new appointment", "reserve"]
  },
  
  // Medical Services
  {
    id: "consultations",
    title: "Consultations",
    description: "Conduct patient consultations and examinations",
    category: "Medical",
    icon: Stethoscope,
    path: "/consultations",
    keywords: ["consultation", "examination", "visit", "checkup", "medical"]
  },
  {
    id: "prescriptions",
    title: "Prescriptions",
    description: "Create and manage medication prescriptions",
    category: "Medical",
    icon: FileText,
    path: "/prescriptions",
    keywords: ["prescription", "medication", "drugs", "treatment", "therapy"]
  },
  {
    id: "lab-orders",
    title: "Lab Orders",
    description: "Order and track laboratory tests",
    category: "Medical",
    icon: TestTube,
    path: "/lab-orders",
    keywords: ["lab", "laboratory", "tests", "blood", "urine", "diagnostics"]
  },
  {
    id: "lab-results",
    title: "Lab Results",
    description: "View and manage laboratory test results",
    category: "Medical",
    icon: ClipboardList,
    path: "/lab-results",
    keywords: ["results", "lab results", "test results", "reports"]
  },
  
  // Pharmacy
  {
    id: "pharmacy",
    title: "Pharmacy Management",
    description: "Manage medication inventory and dispensing",
    category: "Pharmacy",
    icon: Pill,
    path: "/pharmacy",
    keywords: ["pharmacy", "medication", "drugs", "inventory", "dispensing"]
  },
  {
    id: "medication-review",
    title: "Medication Review",
    description: "Review patient medication history and interactions",
    category: "Pharmacy",
    icon: Eye,
    path: "/pharmacy?tab=reviews",
    keywords: ["medication review", "drug interactions", "pharmacy review"]
  },
  {
    id: "inventory",
    title: "Medicine Inventory",
    description: "Track medication stock and supplies",
    category: "Pharmacy",
    icon: Package,
    path: "/inventory",
    keywords: ["inventory", "stock", "supplies", "medicine", "medication"]
  },
  
  // Administrative
  {
    id: "settings",
    title: "Settings",
    description: "Configure system settings and preferences",
    category: "Settings",
    icon: Settings,
    path: "/settings",
    keywords: ["settings", "configuration", "preferences", "setup"]
  },
  {
    id: "profile",
    title: "User Profile",
    description: "Manage your profile and account settings",
    category: "Settings",
    icon: UserCheck,
    path: "/profile",
    keywords: ["profile", "account", "user", "personal"]
  },
  {
    id: "organization",
    title: "Organization Management",
    description: "Manage clinic organization and staff",
    category: "Administration",
    icon: Building,
    path: "/organization",
    keywords: ["organization", "clinic", "staff", "management", "admin"]
  },
  {
    id: "audit-logs",
    title: "Audit Logs",
    description: "View system activity and security logs",
    category: "Administration",
    icon: Shield,
    path: "/audit-logs",
    keywords: ["audit", "logs", "security", "activity", "history"]
  },
  
  // Communication
  {
    id: "messages",
    title: "Messages",
    description: "Internal messaging and communication",
    category: "Communication",
    icon: MessageCircle,
    path: "/messages",
    keywords: ["messages", "chat", "communication", "notifications"]
  },
  
  // Reports & Analytics
  {
    id: "reports",
    title: "Reports",
    description: "Generate and view system reports",
    category: "Reports",
    icon: BarChart3,
    path: "/reports",
    keywords: ["reports", "analytics", "statistics", "data"]
  },
  {
    id: "patient-portal",
    title: "Patient Portal",
    description: "Patient access and portal management",
    category: "Patient Services",
    icon: Heart,
    path: "/patient-portal",
    keywords: ["patient portal", "access", "portal", "patient access"]
  },
  
  // Forms & Templates
  {
    id: "form-builder",
    title: "Form Builder",
    description: "Create and manage consultation forms",
    category: "Forms",
    icon: Edit,
    path: "/form-builder",
    keywords: ["forms", "builder", "templates", "consultation forms"]
  },
  {
    id: "consent-forms",
    title: "Consent Management",
    description: "Manage patient consent forms and signatures",
    category: "Forms",
    icon: CheckCircle,
    path: "/consent-forms",
    keywords: ["consent", "forms", "signatures", "agreements"]
  },
  
  // Emergency & Urgent
  {
    id: "emergency",
    title: "Emergency Actions",
    description: "Quick access to emergency procedures",
    category: "Emergency",
    icon: AlertTriangle,
    path: "/emergency",
    keywords: ["emergency", "urgent", "critical", "alert"]
  }
];

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchType, setSearchType] = useState("features");
  const [, setLocation] = useLocation();

  // Live search for patient data
  const { data: liveSearchResults } = useQuery<{results: LiveSearchResult[], totalCount: number}>({
    queryKey: ['/api/search/global', searchTerm, searchType === "data" ? "all" : ""],
    enabled: searchTerm.length >= 2 && searchType === "data",
    staleTime: 1000, // 1 second
  });

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredResults(searchableItems.slice(0, 8)); // Show popular items
      return;
    }

    const results = searchableItems.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
      );
    });

    setFilteredResults(results.slice(0, 10));
    setSelectedIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        navigateToResult(filteredResults[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const navigateToResult = (result: SearchResult) => {
    setLocation(result.path);
    onClose();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Overview": "bg-blue-100 text-blue-800",
      "Patients": "bg-green-100 text-green-800",
      "Scheduling": "bg-purple-100 text-purple-800",
      "Medical": "bg-red-100 text-red-800",
      "Pharmacy": "bg-orange-100 text-orange-800",
      "Administration": "bg-indigo-100 text-indigo-800",
      "Settings": "bg-gray-100 text-gray-800",
      "Communication": "bg-cyan-100 text-cyan-800",
      "Reports": "bg-yellow-100 text-yellow-800",
      "Forms": "bg-pink-100 text-pink-800",
      "Emergency": "bg-red-200 text-red-900",
      "Patient Services": "bg-teal-100 text-teal-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "patient": return Users;
      case "vaccination": return Heart;
      case "prescription": return Pill;
      case "lab_result": return TestTube;
      default: return FileText;
    }
  };

  const navigateToLiveResult = (result: LiveSearchResult) => {
    if (result.type === "patient") {
      setLocation(`/patients/${result.id}`);
    } else if (result.type === "vaccination") {
      setLocation(`/patients/${result.metadata.patientId}?tab=vaccinations`);
    } else if (result.type === "prescription") {
      setLocation(`/patients/${result.metadata.patientId}?tab=prescriptions`);
    } else if (result.type === "lab_result") {
      setLocation(`/patients/${result.metadata.patientId}?tab=lab-results`);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold leading-snug">
            <Search className="w-5 h-5" />
            Enhanced Global Search
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-5 space-y-4">
          <Tabs value={searchType} onValueChange={setSearchType} className="mb-1">
            <TabsList className="grid w-full grid-cols-2 text-sm">
              <TabsTrigger value="features">Features & Pages</TabsTrigger>
              <TabsTrigger value="data">Patient Data</TabsTrigger>
            </TabsList>
          </Tabs>

          <Input
            placeholder={searchType === "features" ? "Search for functions, pages, or features..." : "Search patients, vaccinations, prescriptions, lab results..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="mb-3 h-11 text-base"
            autoFocus
          />
          
{searchType === "features" ? (
            filteredResults.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredResults.map((result, index) => {
                  const IconComponent = result.icon;
                  return (
                    <div
                      key={result.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        index === selectedIndex 
                          ? "bg-blue-50 border-blue-200" 
                          : "hover:bg-gray-50 border-gray-200"
                      }`}
                      onClick={() => navigateToResult(result)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          index === selectedIndex ? "bg-blue-100" : "bg-gray-100"
                        }`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold leading-snug">{result.title}</h3>
                            <Badge variant="secondary" className={`text-[11px] font-medium ${getCategoryColor(result.category)}`}>
                              {result.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 leading-snug">{result.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-base text-gray-600 mb-1">No results found</p>
                <p className="text-sm text-gray-400">Try searching for features like "patients", "pharmacy", or "appointments"</p>
              </div>
            )
          ) : (
            liveSearchResults?.results.length ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {liveSearchResults.results.map((result, index) => {
                  const IconComponent = getTypeIcon(result.type);
                  return (
                    <div
                      key={`${result.type}-${result.id}`}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        index === selectedIndex 
                          ? "bg-green-50 border-green-200" 
                          : "hover:bg-gray-50 border-gray-200"
                      }`}
                      onClick={() => navigateToLiveResult(result)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          index === selectedIndex ? "bg-green-100" : "bg-gray-100"
                        }`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold leading-snug">{result.title}</h3>
                            <Badge variant="outline" className="text-[11px] capitalize">
                              {result.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 leading-snug mb-0.5">{result.subtitle}</p>
                          <p className="text-xs text-gray-500 leading-snug">{result.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : searchTerm.length >= 2 ? (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-base text-gray-600 mb-1">No patient data found</p>
                <p className="text-sm text-gray-400">Try searching for patient names, vaccination types, or medication names</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-blue-300" />
                <p className="text-base text-gray-600 mb-1">Search patient data</p>
                <p className="text-sm text-gray-400">Find patients, vaccinations, prescriptions, and lab results</p>
              </div>
            )
          )}
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {searchType === "features" 
                ? `${filteredResults.length} results`
                : `${liveSearchResults?.totalCount ?? 0} matches`}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}