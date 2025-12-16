import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  Calendar,
  FileText,
  Pill,
  TestTube,
  Filter,
  X,
  Clock,
  TrendingUp,
  Star,
  History,
  Zap,
  ChevronRight
} from "lucide-react";
import { useLocation } from "wouter";
import { format, subDays, subMonths } from "date-fns";

interface SearchFilter {
  dateRange?: 'today' | 'week' | 'month' | 'all';
  status?: string;
  type?: string;
  department?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  action: string;
  category: string;
  shortcut?: string;
}

interface RecentSearch {
  query: string;
  timestamp: string;
  type: string;
}

interface SearchSuggestion {
  id: string;
  type: 'patient' | 'action' | 'page';
  title: string;
  subtitle: string;
  path: string;
  icon: any;
  matchScore: number;
}

const quickActions: QuickAction[] = [
  {
    id: 'new-patient',
    title: 'New Patient Registration',
    description: 'Register a new patient in the system',
    icon: Users,
    action: '/patients?action=new',
    category: 'Patient Management',
    shortcut: 'Alt+N'
  },
  {
    id: 'schedule-appointment',
    title: 'Schedule Appointment',
    description: 'Book a new patient appointment',
    icon: Calendar,
    action: '/appointments?action=new',
    category: 'Scheduling',
    shortcut: 'Alt+A'
  },
  {
    id: 'new-prescription',
    title: 'New Prescription',
    description: 'Create a medication prescription',
    icon: Pill,
    action: '/prescriptions?action=new',
    category: 'Clinical',
    shortcut: 'Alt+P'
  },
  {
    id: 'order-lab',
    title: 'Order Lab Test',
    description: 'Request laboratory investigations',
    icon: TestTube,
    action: '/lab-orders?action=new',
    category: 'Laboratory',
    shortcut: 'Alt+L'
  },
  {
    id: 'view-results',
    title: 'View Lab Results',
    description: 'Review laboratory test results',
    icon: FileText,
    action: '/lab-results',
    category: 'Laboratory'
  }
];

export function AdvancedSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState<SearchFilter>({
    dateRange: 'all',
  });
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [, setLocation] = useLocation();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save search to recent
  const saveSearch = (query: string, type: string) => {
    const newSearch: RecentSearch = {
      query,
      timestamp: new Date().toISOString(),
      type
    };
    const updated = [newSearch, ...recentSearches.filter(s => s.query !== query)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Advanced search with filters
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search/advanced', searchTerm, activeTab, filters],
    enabled: searchTerm.length >= 2,
    staleTime: 1000,
  });

  // Smart suggestions based on partial input
  const { data: suggestions } = useQuery<SearchSuggestion[]>({
    queryKey: ['/api/search/suggestions', searchTerm],
    enabled: searchTerm.length >= 1 && searchTerm.length < 3,
    staleTime: 2000,
  });

  const handleNavigate = (path: string, query?: string) => {
    if (query) {
      saveSearch(query, activeTab);
    }
    setLocation(path);
    onClose();
  };

  const clearFilters = () => {
    setFilters({ dateRange: 'all' });
  };

  const hasActiveFilters = filters.dateRange !== 'all' || filters.status || filters.type || filters.department;

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Alt+N: New Patient
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        handleNavigate('/patients?action=new');
      }
      // Alt+A: Appointments
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        handleNavigate('/appointments?action=new');
      }
      // Alt+P: Prescription
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        handleNavigate('/prescriptions?action=new');
      }
      // Alt+L: Lab Order
      if (e.altKey && e.key === 'l') {
        e.preventDefault();
        handleNavigate('/lab-orders?action=new');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold leading-snug">
            <Search className="w-5 h-5" />
            Advanced Search & Quick Actions
          </DialogTitle>
          <p className="mt-1 text-sm text-gray-500">
            Search patients and records, refine with filters, or trigger quick actions.
          </p>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients, records, or type a command..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 h-11 text-base"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="patients">Patients</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>

            {/* Filters */}
            {(activeTab === 'all' || activeTab === 'records' || activeTab === 'patients') && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Filter className="h-4 w-4" />
                  <span className="font-medium">Filters</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value: any) => setFilters({ ...filters, dateRange: value })}
                  >
                    <SelectTrigger className="w-36 h-9 text-xs">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                    </SelectContent>
                  </Select>

                  {activeTab === 'records' && (
                    <Select
                      value={filters.type || 'all'}
                      onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? undefined : value })}
                    >
                      <SelectTrigger className="w-40 h-9 text-xs">
                        <SelectValue placeholder="Record type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="visit">Visits</SelectItem>
                        <SelectItem value="prescription">Prescriptions</SelectItem>
                        <SelectItem value="lab">Lab Results</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-9 px-2 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* All Results */}
            <TabsContent value="all" className="mt-4 max-h-96 overflow-y-auto">
              {searchTerm.length < 2 ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-gray-800">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {quickActions.slice(0, 4).map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.id}
                            onClick={() => handleNavigate(action.action)}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                              <Icon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium leading-snug">{action.title}</div>
                              <div className="text-xs text-gray-500 leading-snug">{action.description}</div>
                            </div>
                            {action.shortcut && (
                              <Badge variant="secondary" className="text-[11px]">
                                {action.shortcut}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : searchResults?.results?.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.results.map((result: any) => (
                    <button
                      key={result.id}
                      onClick={() => handleNavigate(result.path, searchTerm)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium leading-snug">{result.title}</div>
                        <div className="text-xs text-gray-500 leading-snug">{result.subtitle}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-base mb-1">No results found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </TabsContent>

            {/* Quick Actions Tab */}
            <TabsContent value="actions" className="mt-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {Object.entries(
                  quickActions.reduce((acc, action) => {
                    if (!acc[action.category]) acc[action.category] = [];
                    acc[action.category].push(action);
                    return acc;
                  }, {} as Record<string, QuickAction[]>)
                ).map(([category, actions]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold mb-2 text-gray-800">{category}</h3>
                    <div className="space-y-2">
                      {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.id}
                            onClick={() => handleNavigate(action.action)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                              <Icon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium leading-snug">{action.title}</div>
                              <div className="text-xs text-gray-500 leading-snug">{action.description}</div>
                            </div>
                            {action.shortcut && (
                              <Badge variant="secondary" className="text-[11px]">
                                {action.shortcut}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Recent Searches Tab */}
            <TabsContent value="recent" className="mt-4 max-h-96 overflow-y-auto">
              {recentSearches.length > 0 ? (
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchTerm(search.query)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors text-left"
                    >
                      <History className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{search.query}</div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(search.timestamp), 'PPp')}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {search.type}
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No recent searches</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer with shortcuts */}
        <div className="px-6 py-3 border-t bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white rounded border text-xs">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white rounded border text-xs">Enter</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white rounded border text-xs">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
            <span className="text-xs text-gray-400">
              Use Alt+[key] for quick actions
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


