import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Stethoscope, Pill, FlaskRound, Search, Bell, ArrowUp, TriangleAlert, Clock, UserPlus, UserCheck, UserCog, Settings, Activity, TrendingUp, CheckCircle, Calendar, TestTube, User, AlertTriangle } from "lucide-react";
import PatientRegistrationModal from "@/components/patient-registration-modal";
import VisitRecordingModal from "@/components/visit-recording-modal";
import LabResultModal from "@/components/lab-result-modal";
import { Link } from "wouter";
import { useRole } from "@/components/role-guard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [reorderQuantity, setReorderQuantity] = useState("");
  const { user, isDoctor } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentPatients, isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients/recent"],
  });

  const { data: lowStockMedicines, isLoading: medicinesLoading } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines/low-stock"],
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ medicineId, quantity }: { medicineId: number, quantity: number }) => {
      const response = await apiRequest("PATCH", `/api/medicines/${medicineId}`, {
        quantity: quantity
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Medicine Restocked",
        description: `${selectedMedicine?.name} has been restocked successfully.`,
      });
      setShowReorderModal(false);
      setReorderQuantity("");
      setSelectedMedicine(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restock medicine. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReorderMedicine = (medicine: any) => {
    setSelectedMedicine(medicine);
    setReorderQuantity("100"); // Default reorder quantity
    setShowReorderModal(true);
  };

  const handleConfirmReorder = () => {
    if (!selectedMedicine || !reorderQuantity) return;

    const newQuantity = parseInt(selectedMedicine.quantity) + parseInt(reorderQuantity);
    reorderMutation.mutate({
      medicineId: selectedMedicine.id,
      quantity: newQuantity
    });
  };

  // Doctor-specific data
  const { data: doctorReferrals, isLoading: referralsLoading } = useQuery({
    queryKey: ["/api/referrals", { toRole: "doctor" }],
    enabled: isDoctor,
  });

  const { data: allPatients, isLoading: allPatientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: isDoctor,
  });

  // Filter patients based on search query for doctors
  const filteredPatients = allPatients?.filter(patient => 
    patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
      <header className="bg-white shadow-sm border-b border-slate-200 px-4 md:px-6 py-4">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Dashboard</h2>
            <p className="text-sm text-slate-500">Welcome back, monitor your clinic's performance</p>
          </div>
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search patients..."
                className="w-full md:w-80 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card stat-card-patients">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Total Patients
            </CardTitle>
            <Users className="h-5 w-5 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats?.totalPatients || 0}</div>
            <p className="text-xs text-white/70 mt-1">
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +20.1% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card stat-card-visits">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Today's Visits
            </CardTitle>
            <Calendar className="h-5 w-5 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats?.todayVisits || 0}</div>
            <p className="text-xs text-white/70 mt-1">
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +180.1% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card stat-card-pending">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Pending Lab Results
            </CardTitle>
            <TestTube className="h-5 w-5 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats?.pendingLabs || 0}</div>
            <p className="text-xs text-white/70 mt-1">
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +19% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card stat-card-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats?.lowStockItems || 0}</div>
            <p className="text-xs text-white/70 mt-1">
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Requires attention
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

        {/* Nurse-Specific Dashboard */}
        {user?.role === 'nurse' && (
          <div className="mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-semibold text-slate-800 mb-3 md:mb-4">Nurse Dashboard</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Today's Visits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Stethoscope className="mr-2 h-5 w-5" />
                    Today's Patient Visits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      onClick={() => setShowPatientModal(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Register New Patient
                    </Button>

                    <Button
                      onClick={() => setShowLabModal(true)}
                      className="w-full"
                    >
                      <FlaskRound className="mr-2 h-4 w-4" />
                      Add Lab Result
                    </Button>

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-slate-600 mb-3">Quick Actions</p>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/visits">View All Visits</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Patient Referrals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCheck className="mr-2 h-5 w-5" />
                    Patient Referrals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">Refer patients to specialists</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/referrals">To Pharmacist</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/referrals">To Physiotherapist</Link>
                      </Button>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/referrals">Manage All Referrals</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Pharmacist-Specific Dashboard */}
        {user?.role === 'pharmacist' && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Pharmacist Dashboard</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Medicine Inventory */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Pill className="mr-2 h-5 w-5" />
                    Medicine Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-red-800">Low Stock Alert</p>
                        <p className="text-sm text-red-600">
                          {stats?.lowStockItems || 0} items need attention
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/pharmacy">View Details</Link>
                      </Button>
                    </div>

                    <Button className="w-full" asChild>
                      <Link href="/pharmacy">
                        <Pill className="mr-2 h-4 w-4" />
                        Manage Pharmacy
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Prescription Referrals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCheck className="mr-2 h-5 w-5" />
                    Prescription Referrals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">Referrals assigned to pharmacy</p>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/referrals">View Pharmacy Referrals</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Admin-Specific Dashboard */}
        {user?.role === 'admin' && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Admin Dashboard</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCog className="mr-2 h-5 w-5" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">Manage clinic staff accounts</p>
                    <Button className="w-full" variant="outline">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add New User
                    </Button>
                    <Button variant="outline" className="w-full">
                      View All Users
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5" />
                    System Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-600">Patients:</div>
                      <div className="font-medium">{stats?.totalPatients || 0}</div>
                      <div className="text-slate-600">Today Visits:</div>
                      <div className="font-medium">{stats?.todayVisits || 0}</div>
                      <div className="text-slate-600">Low Stock:</div>
                      <div className="font-medium text-red-600">{stats?.lowStockItems || 0}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/patients">Manage Patients</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/pharmacy">Manage Pharmacy</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/referrals">Manage Referrals</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/visits">View All Visits</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Physiotherapist-Specific Dashboard */}
        {user?.role === 'physiotherapist' && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Physiotherapist Dashboard</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Patient Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search patients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    </div>

                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/patients">View All Patients</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Assigned Referrals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCheck className="mr-2 h-5 w-5" />
                    Therapy Referrals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">Referrals assigned to physiotherapy</p>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/referrals">View Therapy Referrals</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Doctor-Specific Dashboard */}
        {user?.role === 'doctor' && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Doctor Dashboard</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Search & Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Patient Search & Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search patients by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    </div>

                    {searchQuery && (
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {filteredPatients.slice(0, 5).map((patient) => (
                          <Link
                            key={patient.id}
                            href={`/patients/${patient.id}`}
                            className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">
                                {getPatientInitials(patient.firstName, patient.lastName)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-800">
                                {patient.firstName} {patient.lastName}
                              </p>
                              <p className="text-sm text-slate-500">
                                Age: {getPatientAge(patient.dateOfBirth)} | ID: HC{patient.id.toString().padStart(6, "0")}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={() => setShowVisitModal(true)}
                      className="w-full"
                    >
                      <Stethoscope className="mr-2 h-4 w-4" />
                      Record New Visit
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Doctor Referrals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCheck className="mr-2 h-5 w-5" />
                    Referrals Assigned to You
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {referralsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : doctorReferrals && doctorReferrals.length > 0 ? (
                    <div className="space-y-3">
                      {doctorReferrals.slice(0, 3).map((referral: any) => (
                        <div key={referral.id} className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-slate-800">
                                Patient: {referral.patient?.firstName} {referral.patient?.lastName}
                              </p>
                              <p className="text-sm text-slate-600 mt-1">
                                From: {referral.fromUser?.username}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Reason: {referral.reason}
                              </p>
                            </div>
                            <Badge variant={referral.status === 'pending' ? 'outline' : 'secondary'}>
                              {referral.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/referrals">View All Referrals</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <UserCheck className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="mt-2 text-sm text-slate-500">No referrals assigned</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 medical-card animate-fade-in">
          <CardHeader className="medical-card-header">
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5 text-blue-600" />
              Recent Patients
            </CardTitle>
          </CardHeader>
          <CardContent className="medical-card-content">
            <div className="space-y-4">
              {recentPatients?.map((patient, index) => (
                <div 
                  key={patient.id} 
                  className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-200 dark:border-gray-700"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                      {patient.firstName?.[0]}{patient.lastName?.[0]}
                    </div>
                  </div>
                  <div className="ml-4 flex-1 space-y-1">
                    <p className="text-sm font-semibold leading-none text-gray-900 dark:text-gray-100">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {patient.email}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Registered
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 medical-card animate-fade-in">
          <CardHeader className="medical-card-header">
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="medical-card-content">
            <div className="space-y-3">
              {lowStockMedicines?.slice(0, 5).map((medicine, index) => (
                <div 
                  key={medicine.id} 
                  className="flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-sm"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    borderColor: medicine.stockQuantity === 0 ? 'rgb(239 68 68)' : 'rgb(251 191 36)'
                  }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {medicine.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Stock: {medicine.quantity} {medicine.unit}
                    </p>
                  </div>
                  <div className="ml-3">
                    <Badge 
                      variant={medicine.stockQuantity === 0 ? "destructive" : "secondary"}
                      className={`${
                        medicine.stockQuantity === 0 
                          ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800" 
                          : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800"
                      } font-medium`}
                    >
                      {medicine.stockQuantity === 0 ? "Out of Stock" : "Low Stock"}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!lowStockMedicines || lowStockMedicines.length === 0) && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">All items are well stocked</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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

      {/* Medicine Reorder Modal */}
      <Dialog open={showReorderModal} onOpenChange={setShowReorderModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restock Medicine</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Medicine</Label>
              <p className="text-lg font-semibold text-slate-800">{selectedMedicine?.name}</p>
              <p className="text-sm text-slate-600">Current stock: {selectedMedicine?.quantity} {selectedMedicine?.unit}</p>
            </div>

            <div>
              <Label htmlFor="reorder-quantity" className="text-sm font-medium">
                Quantity to Add
              </Label>
              <Input
                id="reorder-quantity"
                type="number"
                value={reorderQuantity}
                onChange={(e) => setReorderQuantity(e.target.value)}
                placeholder="Enter quantity to add"
                className="mt-1"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-600">New Total Stock:</p>
              <p className="text-lg font-semibold text-green-600">
                {selectedMedicine && reorderQuantity 
                  ? parseInt(selectedMedicine.quantity) + parseInt(reorderQuantity || "0")
                  : selectedMedicine?.quantity} {selectedMedicine?.unit}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowReorderModal(false)}
                disabled={reorderMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleConfirmReorder}
                disabled={!reorderQuantity || reorderMutation.isPending}
              >
                {reorderMutation.isPending ? "Restocking..." : "Confirm Restock"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}