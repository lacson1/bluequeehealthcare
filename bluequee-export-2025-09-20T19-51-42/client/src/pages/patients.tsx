import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, Users, Calendar, UserPlus
} from "lucide-react";
import PatientRegistrationModal from "@/components/patient-registration-modal";
import SmartAppointmentScheduler from "@/components/smart-appointment-scheduler";
import EnhancedPatientManagementFixed from "@/components/enhanced-patient-management-fixed";
import PatientAnalyticsDashboard from "@/components/patient-analytics-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRole } from "@/components/role-guard";

export default function Patients() {
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [activeTab, setActiveTab] = useState("patients");
  const { user } = useRole();

  return (
    <div className="fixed-layout-container">
      {/* Enhanced Fixed Header Section */}
      <div className="fixed-header-section">
        <div className="fixed-header-content healthcare-header">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-sm">Patient Management</h1>
              <p className="text-white/90 mt-1 font-medium">Manage patient records and coordinate care</p>
            </div>
            <div className="flex items-center space-x-3">
              {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
                <Button onClick={() => setShowPatientModal(true)} className="bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white shadow-lg transition-all duration-200">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add New Patient
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Fixed Tab Navigation */}
      <div className="fixed-tabs-container bg-gradient-to-r from-background/95 to-muted/30 backdrop-blur-sm border-b border-border/60">
        <div className="px-6 py-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100/80 backdrop-blur-sm border border-slate-200/60 rounded-lg p-1 shadow-sm">
              <TabsTrigger value="patients" className="flex items-center gap-2 text-slate-600 font-medium transition-all duration-200 hover:text-slate-900 hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-blue-200/50">
                <Users className="w-4 h-4" />
                Patient Records
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 text-slate-600 font-medium transition-all duration-200 hover:text-slate-900 hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-green-200/50">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="appointments" className="flex items-center gap-2 text-slate-600 font-medium transition-all duration-200 hover:text-slate-900 hover:bg-white/80 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-purple-200/50">
                <Calendar className="w-4 h-4" />
                Appointments
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="scrollable-content bg-gradient-to-br from-slate-50/60 via-white to-blue-50/30">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="w-full max-w-7xl mx-auto">
            <TabsContent value="patients" className="mt-0">
              <EnhancedPatientManagementFixed user={user} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <PatientAnalyticsDashboard />
            </TabsContent>

            <TabsContent value="appointments" className="mt-0">
              <SmartAppointmentScheduler />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Patient Registration Modal */}
      <PatientRegistrationModal 
        open={showPatientModal} 
        onOpenChange={setShowPatientModal} 
      />
    </div>
  );
}