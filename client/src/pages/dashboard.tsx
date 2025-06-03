import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, Calendar, Activity, Search, UserPlus, Plus, 
  Eye, Settings
} from "lucide-react";
import { Link, useLocation } from "wouter";
import PatientRegistrationModal from "@/components/patient-registration-modal";
import { useRole } from "@/components/role-guard";
import { useGlobalShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface DashboardStats {
  totalPatients: number;
  todayVisits: number;
  pendingLabs: number;
  lowStockItems: number;
}

export default function Dashboard() {
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useRole();
  const [, setLocation] = useLocation();

  // Initialize global keyboard shortcuts
  useGlobalShortcuts();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: allPatients } = useQuery({
    queryKey: ['/api/patients'],
  });

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="healthcare-header px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded-lg w-64 mb-4"></div>
              <div className="h-4 bg-white/20 rounded-lg w-96"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="metric-card animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-4"></div>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Healthcare Header */}
      <div className="healthcare-header px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Clinical Dashboard
              </h1>
              <p className="text-white/80 text-lg">
                Welcome back, Dr. {user?.username || 'User'} • Lagos Island Hospital
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                <Input
                  placeholder="Search patients, orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
                />
              </div>
              <Button 
                onClick={() => setShowPatientModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="metric-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <span className="status-badge info text-xs">Today</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">{stats?.totalPatients || 0}</p>
              <p className="text-sm text-muted-foreground">Total Patients</p>
              <p className="text-xs text-success">+12% from last month</p>
            </div>
          </div>

          <div className="metric-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <span className="status-badge success text-xs">Active</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">{stats?.todayVisits || 0}</p>
              <p className="text-sm text-muted-foreground">Today's Visits</p>
              <p className="text-xs text-info">3 scheduled next</p>
            </div>
          </div>

          <div className="metric-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Activity className="h-6 w-6 text-warning" />
              </div>
              <span className="status-badge warning text-xs">Pending</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">{stats?.pendingLabs || 0}</p>
              <p className="text-sm text-muted-foreground">Lab Orders</p>
              <p className="text-xs text-muted-foreground">Awaiting results</p>
            </div>
          </div>

          <div className="metric-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-destructive/10 rounded-lg">
                <Settings className="h-6 w-6 text-destructive" />
              </div>
              <span className="status-badge error text-xs">Alert</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">{stats?.lowStockItems || 0}</p>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-xs text-destructive">Needs attention</p>
            </div>
          </div>
        </div>

        {/* Premium Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card 
            className="healthcare-card group cursor-pointer hover:scale-105 transition-all duration-300"
            onClick={() => setLocation('/patients')}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="gradient-text">Patient Management</span>
                <Eye className="h-5 w-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Comprehensive patient records and care coordination</p>
              <div className="flex items-center text-sm text-primary">
                <span>View all patients</span>
                <Plus className="h-4 w-4 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="healthcare-card group cursor-pointer hover:scale-105 transition-all duration-300"
            onClick={() => setLocation('/lab-orders')}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="gradient-text">Laboratory Orders</span>
                <Activity className="h-5 w-5 text-accent" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Create and track lab orders and test results</p>
              <div className="flex items-center text-sm text-accent">
                <span>Manage lab orders</span>
                <Plus className="h-4 w-4 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="healthcare-card group cursor-pointer hover:scale-105 transition-all duration-300"
            onClick={() => setLocation('/appointments')}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="gradient-text">Appointments</span>
                <Calendar className="h-5 w-5 text-info" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Schedule and manage patient appointments</p>
              <div className="flex items-center text-sm text-info">
                <span>View schedule</span>
                <Plus className="h-4 w-4 ml-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Patient Registration Modal */}
      {showPatientModal && (
        <PatientRegistrationModal 
          open={showPatientModal}
          onOpenChange={setShowPatientModal}
        />
      )}
    </div>
  );
}