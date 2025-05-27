import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Stethoscope, Pill, FlaskRound, Search, Bell, ArrowUp, TriangleAlert, Clock, UserPlus } from "lucide-react";
import PatientRegistrationModal from "@/components/patient-registration-modal";
import VisitRecordingModal from "@/components/visit-recording-modal";
import LabResultModal from "@/components/lab-result-modal";
import { Link } from "wouter";
import type { Patient, Medicine } from "@shared/schema";

interface DashboardStats {
  totalPatients: number;
  todayVisits: number;
  lowStockItems: number;
  pendingLabs: number;
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentPatients, isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients/recent"],
  });

  const { data: lowStockMedicines, isLoading: medicinesLoading } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines/low-stock"],
  });

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getPatientAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <>
      {/* Top Bar */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
            <p className="text-sm text-slate-500">Welcome back, monitor your clinic's performance</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search patients..."
                className="w-80 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            </div>
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total Patients</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">
                    {statsLoading ? "..." : stats?.totalPatients || 0}
                  </p>
                  <p className="text-sm text-secondary mt-1">
                    <ArrowUp className="inline w-3 h-3" /> +12% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Today's Visits</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">
                    {statsLoading ? "..." : stats?.todayVisits || 0}
                  </p>
                  <p className="text-sm text-secondary mt-1">
                    <ArrowUp className="inline w-3 h-3" /> +5 from yesterday
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Stethoscope className="text-secondary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Low Stock Items</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {statsLoading ? "..." : stats?.lowStockItems || 0}
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    <TriangleAlert className="inline w-3 h-3" /> Requires attention
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Pill className="text-red-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Pending Labs</p>
                  <p className="text-3xl font-bold text-amber-600 mt-2">
                    {statsLoading ? "..." : stats?.pendingLabs || 0}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    <Clock className="inline w-3 h-3" /> Awaiting results
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <FlaskRound className="text-amber-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Patients */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Patients</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/patients">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {patientsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="rounded-full bg-slate-200 h-12 w-12"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentPatients && recentPatients.length > 0 ? (
                <div className="space-y-4">
                  {recentPatients.map((patient) => (
                    <Link
                      key={patient.id}
                      href={`/patients/${patient.id}`}
                      className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {getPatientInitials(patient.firstName, patient.lastName)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-800">
                          {patient.firstName} {patient.lastName}
                        </h4>
                        <p className="text-sm text-slate-500">
                          ID: HC{patient.id.toString().padStart(6, "0")} | Age: {getPatientAge(patient.dateOfBirth)}
                        </p>
                        <p className="text-xs text-slate-400">
                          Registered: {new Date(patient.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">Regular</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-4 text-sm font-medium text-slate-900">No patients yet</h3>
                  <p className="mt-2 text-sm text-slate-500">Get started by registering your first patient.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setShowPatientModal(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add New Patient
                </Button>
                
                <Button
                  onClick={() => setShowVisitModal(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Record Visit
                </Button>
                
                <Button
                  onClick={() => setShowLabModal(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FlaskRound className="mr-2 h-4 w-4" />
                  Add Lab Result
                </Button>
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TriangleAlert className="text-red-500 mr-2 h-5 w-5" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medicinesLoading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : lowStockMedicines && lowStockMedicines.length > 0 ? (
                  <div className="space-y-3">
                    {lowStockMedicines.slice(0, 2).map((medicine) => (
                      <div key={medicine.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-slate-800">{medicine.name}</h4>
                          <p className="text-sm text-red-600">
                            Only {medicine.quantity} {medicine.unit} left
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" className="text-primary">
                          Reorder
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Pill className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500">All medicines are well stocked</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modals */}
      <PatientRegistrationModal
        open={showPatientModal}
        onOpenChange={setShowPatientModal}
      />
      <VisitRecordingModal
        open={showVisitModal}
        onOpenChange={setShowVisitModal}
      />
      <LabResultModal
        open={showLabModal}
        onOpenChange={setShowLabModal}
      />
    </>
  );
}
