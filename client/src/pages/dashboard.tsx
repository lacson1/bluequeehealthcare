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
  const isAdmin = user?.role === 'admin';
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Top Bar */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome to Bluequee Healthcare Clinical Management - Your comprehensive healthcare overview</p>
          </div>
          <div className="flex items-center space-x-3">
            {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
              <Button onClick={() => setShowPatientModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Patient
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              className="stat-card stat-card-patients text-white card-selection-feedback cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setLocation('/patients')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <p className="text-sm font-medium text-white/80 uppercase tracking-wide">TOTAL PATIENTS</p>
                  <div className="text-3xl font-bold text-white">{stats?.totalPatients || 6}</div>
                  <p className="text-xs text-white/70">Click to view all patients</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
          </Card>

          <Card 
            className="stat-card stat-card-visits text-white card-selection-feedback cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setLocation('/appointments')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <p className="text-sm font-medium text-white/80 uppercase tracking-wide">TODAY'S VISITS</p>
                <div className="text-3xl font-bold text-white">{stats?.todayVisits || 0}</div>
                <p className="text-xs text-white/70">Click to view appointments</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="stat-card stat-card-pending text-white card-selection-feedback cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setLocation('/lab-orders')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <p className="text-sm font-medium text-white/80 uppercase tracking-wide">PENDING LABS</p>
                <div className="text-3xl font-bold text-white">{stats?.pendingLabs || 0}</div>
                <p className="text-xs text-white/70">Click to view lab orders</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="stat-card stat-card-revenue text-white cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setLocation('/pharmacy')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <p className="text-sm font-medium text-white/80 uppercase tracking-wide">LOW STOCK ITEMS</p>
                <div className="text-3xl font-bold text-white">{stats?.lowStockItems || 0}</div>
                <p className="text-xs text-white/70">Click to view inventory</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Admin Dashboard */}
        {isAdmin && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Admin Dashboard</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Management */}
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    User Management
                  </CardTitle>
                  <p className="text-sm text-gray-600">Manage clinic staff accounts</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    asChild
                  >
                    <Link href="/user-management">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New User
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    asChild
                  >
                    <Link href="/user-management">
                      <Eye className="mr-2 h-4 w-4" />
                      View All Users
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* System Overview */}
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                    <Activity className="mr-2 h-5 w-5" />
                    System Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Patients:</span>
                      <span className="font-medium">{stats?.totalPatients || 6}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Today Visits:</span>
                      <span className="font-medium">{stats?.todayVisits || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Low Stock:</span>
                      <span className="font-medium">{stats?.lowStockItems || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start" 
                    asChild
                  >
                    <Link href="/patients">Manage Patients</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start" 
                    asChild
                  >
                    <Link href="/pharmacy">Manage Pharmacy</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start" 
                    asChild
                  >
                    <Link href="/referrals">Manage Referrals</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start" 
                    asChild
                  >
                    <Link href="/patients">Record Visit</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Recent Patients & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Patients</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/patients">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(allPatients) && allPatients.length > 0 ? (
                  allPatients.slice(0, 5).map((patient: any) => (
                    <div key={patient.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{patient.firstName} {patient.lastName}</p>
                        <p className="text-sm text-gray-500">{patient.phone}</p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/patients/${patient.id}`}>View</Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No patients registered yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setShowPatientModal(true)} 
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add New Patient
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/visits">
                  <Activity className="mr-2 h-4 w-4" />
                  Record Visit
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/lab-results">
                  <Activity className="mr-2 h-4 w-4" />
                  Lab Results
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/pharmacy">
                  <Activity className="mr-2 h-4 w-4" />
                  Pharmacy
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        </div>
      </main>

      {/* Patient Registration Modal */}
      <PatientRegistrationModal
        open={showPatientModal}
        onOpenChange={setShowPatientModal}
      />
    </div>
  );
}