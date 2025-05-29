import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { 
  Users, 
  Calendar, 
  UserPlus, 
  Activity, 
  Search, 
  User, 
  UserCheck, 
  TriangleAlert,
  Settings,
  Building,
  Shield,
  FileText,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import PatientRegistrationModal from "@/components/patient-registration-modal";
import VisitRecordingModal from "@/components/visit-recording-modal";
import LabResultModal from "@/components/lab-result-modal";

interface DashboardStats {
  totalPatients: number;
  todayVisits: number;
  lowStockItems: number;
  pendingLabs: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [reorderQuantity, setReorderQuantity] = useState("");

  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor';

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    enabled: !!user,
  });

  // Fetch recent patients
  const { data: recentPatients } = useQuery({
    queryKey: ['/api/patients/recent'],
    enabled: !!user,
  });

  // Fetch all patients for search
  const { data: allPatients } = useQuery({
    queryKey: ['/api/patients'],
    enabled: !!user,
  });

  // Fetch low stock medicines
  const { data: lowStockMedicines } = useQuery({
    queryKey: ['/api/medicines/low-stock'],
    enabled: !!user,
  });

  // Fetch referrals for doctors
  const { data: doctorReferrals, isLoading: referralsLoading } = useQuery({
    queryKey: ['/api/referrals'],
    enabled: isDoctor,
  });

  // Filter patients based on search
  const filteredPatients = (allPatients && Array.isArray(allPatients)) ? allPatients.filter((patient: any) =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Helper functions
  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };

  const getPatientAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Medicine reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ medicineId, quantity }: { medicineId: number; quantity: number }) => {
      return apiRequest("PATCH", `/api/medicines/${medicineId}`, { 
        quantity: quantity 
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Medicine restocked successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/medicines'] });
      setShowReorderModal(false);
      setSelectedMedicine(null);
      setReorderQuantity("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restock medicine",
        variant: "destructive",
      });
    },
  });

  const handleReorderMedicine = (medicine: any) => {
    setSelectedMedicine(medicine);
    setShowReorderModal(true);
  };

  const handleConfirmReorder = () => {
    if (selectedMedicine && reorderQuantity) {
      const newQuantity = parseInt(selectedMedicine.quantity) + parseInt(reorderQuantity);
      reorderMutation.mutate({
        medicineId: selectedMedicine.id,
        quantity: newQuantity,
      });
    }
  };

  if (statsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
            <p className="text-slate-600">Welcome back, {user?.username}</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setShowPatientModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
            {isDoctor && (
              <Button onClick={() => setShowVisitModal(true)} variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                Record Visit
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="stat-card stat-card-patients text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
              <p className="text-xs opacity-80">Registered patients</p>
            </CardContent>
          </Card>

          <Card className="stat-card stat-card-visits text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
              <Calendar className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayVisits || 0}</div>
              <p className="text-xs opacity-80">Appointments today</p>
            </CardContent>
          </Card>

          <Card className="stat-card stat-card-pending text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Labs</CardTitle>
              <Activity className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingLabs || 0}</div>
              <p className="text-xs opacity-80">Awaiting results</p>
            </CardContent>
          </Card>

          <Card className="stat-card stat-card-revenue text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <TriangleAlert className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.lowStockItems || 0}</div>
              <p className="text-xs opacity-80">Need restocking</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Dashboard */}
        {isAdmin && (
          <div className="mb-8 space-y-6">
            <h3 className="text-xl font-semibold text-slate-800">Admin Overview</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Organization Management */}
              <Card className="admin-widget admin-detail-widget">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="mr-2 h-5 w-5" />
                    Organization Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-600">Active Orgs:</div>
                      <div className="font-medium">3</div>
                      <div className="text-slate-600">Total Users:</div>
                      <div className="font-medium">25</div>
                      <div className="text-slate-600">Active Sessions:</div>
                      <div className="font-medium">8</div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/admin/organizations">Manage Organizations</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Performance */}
              <Card className="admin-widget admin-performance-widget">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-600">Uptime:</div>
                      <div className="font-medium text-green-600">99.8%</div>
                      <div className="text-slate-600">Response Time:</div>
                      <div className="font-medium">120ms</div>
                      <div className="text-slate-600">Storage Used:</div>
                      <div className="font-medium">2.1 GB</div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/admin/system">View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="admin-widget admin-actions-widget">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/admin/users">Manage Users</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/admin/audit-logs">View Audit Logs</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/admin/settings">System Settings</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Doctor Dashboard */}
        {isDoctor && (
          <div className="mb-8 space-y-6">
            <h3 className="text-xl font-semibold text-slate-800">Doctor's Overview</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Patient Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search patients..."
                        className="w-full pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    </div>

                    {searchQuery && filteredPatients.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {filteredPatients.slice(0, 5).map((patient: any) => (
                          <div key={patient.id} className="flex items-center justify-between p-2 bg-slate-50 rounded hover:bg-slate-100">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                                {getPatientInitials(patient.firstName, patient.lastName)}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{patient.firstName} {patient.lastName}</p>
                                <p className="text-xs text-slate-500">Age: {getPatientAge(patient.dateOfBirth)}</p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setShowVisitModal(true)}
                            >
                              Record Visit
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : searchQuery ? (
                      <p className="text-sm text-slate-500">No patients found</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              {/* Referrals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCheck className="mr-2 h-5 w-5" />
                    Patient Referrals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {referralsLoading ? (
                    <p className="text-sm text-slate-500">Loading referrals...</p>
                  ) : (
                    <div className="space-y-3">
                      {doctorReferrals && Array.isArray(doctorReferrals) && doctorReferrals.length > 0 ? (
                        doctorReferrals.slice(0, 3).map((referral: any) => (
                          <div key={referral.id} className="p-3 bg-slate-50 rounded">
                            <p className="font-medium text-sm">{referral.patient?.firstName} {referral.patient?.lastName}</p>
                            <p className="text-xs text-slate-600">{referral.reason}</p>
                            <p className="text-xs text-slate-500">Status: {referral.status}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No active referrals</p>
                      )}
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/referrals">View All Referrals</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Recent Patients - For all roles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPatients && Array.isArray(recentPatients) && recentPatients.length > 0 ? (
                  recentPatients.slice(0, 5).map((patient: any, index: number) => (
                    <div key={patient.id || index} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                        {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{patient.firstName} {patient.lastName}</p>
                        <p className="text-xs text-slate-500">{patient.phone}</p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/patients/${patient.id}`}>View</Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No recent patients</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Medicines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TriangleAlert className="mr-2 h-5 w-5 text-red-500" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockMedicines && Array.isArray(lowStockMedicines) && lowStockMedicines.length > 0 ? (
                  lowStockMedicines.slice(0, 5).map((medicine: any, index: number) => (
                    <div key={medicine.id || index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <div>
                        <p className="font-medium text-sm text-red-800">{medicine.name}</p>
                        <p className="text-xs text-red-600">Stock: {medicine.quantity} {medicine.unit}</p>
                      </div>
                      {user?.role === 'pharmacist' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleReorderMedicine(medicine)}
                          className="text-red-700 border-red-300 hover:bg-red-100"
                        >
                          Reorder
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">All medicines well stocked</p>
                )}
                {lowStockMedicines && Array.isArray(lowStockMedicines) && lowStockMedicines.length > 5 && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/pharmacy">View All ({lowStockMedicines.length} items)</Link>
                  </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reorder Medicine</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="font-medium">{selectedMedicine?.name}</p>
              <p className="text-sm text-slate-600">Current stock: {selectedMedicine?.quantity} {selectedMedicine?.unit}</p>
            </div>
            <div>
              <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
              <Input
                id="reorderQuantity"
                type="number"
                value={reorderQuantity}
                onChange={(e) => setReorderQuantity(e.target.value)}
                placeholder="Enter quantity to add"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleConfirmReorder}
                disabled={!selectedMedicine || !reorderQuantity || reorderMutation.isPending}
                className="flex-1"
              >
                {reorderMutation.isPending ? "Restocking..." : "Confirm Restock"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowReorderModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}