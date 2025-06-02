import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/use-onboarding";
import OnboardingTour from "@/components/onboarding-tour";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";
import TouchQuickActions from "@/components/touch-quick-actions";
import OfflineStatusBar from "@/components/offline-status-bar";
import { GlobalSearch } from "@/components/global-search";
import { ErrorBoundary } from "@/components/error-boundary";
import { Search } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import PatientProfile from "@/pages/patient-profile-clean";
import EnhancedPatientProfile from "@/pages/enhanced-patient-profile";
import Visits from "@/pages/visits";
import LabResults from "@/pages/lab-results";
import Pharmacy from "@/pages/pharmacy";
import EnhancedPharmacy from "@/pages/pharmacy-enhanced";
import InventoryPage from "@/pages/inventory";
import Referrals from "@/pages/referrals";
import ProfilePage from "@/pages/profile";
import UserManagementEnhanced from "@/pages/user-management-enhanced";
import AuditLogs from "@/pages/audit-logs";
import FormBuilder from "@/pages/form-builder";
import ClinicalPerformance from "@/pages/clinical-performance";
import OrganizationManagement from "@/pages/organization-management";
import { MedicalToolsPage } from "@/pages/medical-tools";
import PatientPortal from "@/pages/patient-portal";
import RecordVisitPage from "@/pages/record-visit";
import EditVisit from "@/pages/edit-visit";
import AppointmentsPage from "@/pages/appointments";
import LabOrdersPage from "@/pages/lab-orders";
import DocumentsPage from "@/pages/documents";
import RevenueAnalytics from "@/pages/revenue-analytics";
import TelemedicinePage from "@/pages/telemedicine";
import PhysiotherapyPage from "@/pages/physiotherapy";
import ExerciseLeafletsPage from "@/pages/exercise-leaflets";
import MedicalCertificatesPage from "@/pages/medical-certificates";
import ReferralLettersPage from "@/pages/referral-letters";
import WellnessPage from "@/pages/wellness";
import WellnessPlansPage from "@/pages/wellness-plans";
import WellnessAnalyticsPage from "@/pages/wellness-analytics";
import MentalHealthPage from "@/pages/mental-health";
import ClinicalProtocols from "@/components/clinical-protocols";
import ExportCompliance from "@/components/export-compliance";
import PatientAccessCards from "@/pages/patient-access-cards";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import SuperAdminAnalytics from "@/pages/superadmin-analytics";
import SuperAdminControlPanel from "@/pages/super-admin-control-panel";
import ProceduralReports from "@/pages/procedural-reports";
import ConsentManagement from "@/pages/consent-management";
import StaffMessages from "@/pages/staff-messages";
import BillingPage from "@/pages/billing";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import ConsultationRecordDetails from "@/pages/consultation-record-details";

function AuthenticatedApp() {
  const { user } = useAuth();
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const {
    showTour,
    isNewUser,
    completeTour,
    startTour,
    skipTour
  } = useOnboarding(user?.id || 0, user?.role || '');

  // Global keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <OfflineStatusBar />
      <Sidebar onStartTour={startTour} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <TopBar />
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30">
          {/* Enhanced Container with Better Responsive Design */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 max-w-7xl">
              {/* Page Content with Smooth Transitions */}
              <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
                <Switch>
                  <Route path="/" component={Dashboard} />
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/patients" component={Patients} />
                  <Route path="/patients/:id" component={PatientProfile} />
                  <Route path="/patients/:id/enhanced" component={EnhancedPatientProfile} />
                  <Route path="/patients/:patientId/record-visit" component={RecordVisitPage} />
                  <Route path="/patients/:patientId/visits/:visitId/edit" component={EditVisit} />
                  <Route path="/consultation-records/:id" component={ConsultationRecordDetails} />
                  <Route path="/visits" component={Visits} />
                  <Route path="/lab-results" component={LabResults} />
                  <Route path="/pharmacy" component={Pharmacy} />
                  <Route path="/pharmacy-enhanced" component={EnhancedPharmacy} />
                  <Route path="/inventory" component={InventoryPage} />
                  <Route path="/referrals" component={Referrals} />
                  <Route path="/appointments" component={AppointmentsPage} />
                  <Route path="/lab-orders" component={LabOrdersPage} />
                  <Route path="/documents" component={DocumentsPage} />
                  <Route path="/billing" component={BillingPage} />
                  <Route path="/analytics" component={RevenueAnalytics} />
                  <Route path="/revenue-analytics" component={RevenueAnalytics} />
                  <Route path="/telemedicine" component={TelemedicinePage} />
                  <Route path="/physiotherapy" component={PhysiotherapyPage} />
                  <Route path="/exercise-leaflets" component={ExerciseLeafletsPage} />
                  <Route path="/medical-certificates" component={MedicalCertificatesPage} />
                  <Route path="/referral-letters" component={ReferralLettersPage} />
                  <Route path="/wellness" component={WellnessPage} />
                  <Route path="/wellness/plans" component={WellnessPlansPage} />
                  <Route path="/wellness/analytics" component={WellnessAnalyticsPage} />
                  <Route path="/mental-health" component={MentalHealthPage} />
                  <Route path="/protocols" component={ClinicalProtocols} />
                  <Route path="/compliance" component={ExportCompliance} />
                  <Route path="/form-builder" component={FormBuilder} />
                  <Route path="/medical-tools" component={MedicalToolsPage} />
                  <Route path="/clinical-performance" component={ClinicalPerformance} />
                  <Route path="/profile" component={ProfilePage} />
                  <Route path="/my-profile" component={Profile} />
                  <Route path="/settings" component={Settings} />
                  <Route path="/user-management" component={UserManagementEnhanced} />
                  <Route path="/audit-logs" component={AuditLogs} />
                  <Route path="/organization-management" component={OrganizationManagement} />
                  <Route path="/patient-access-cards" component={PatientAccessCards} />
                  <Route path="/procedural-reports" component={ProceduralReports} />
                  <Route path="/consent-management" component={ConsentManagement} />
                  <Route path="/staff-messages" component={StaffMessages} />
                  <Route path="/global-analytics" component={SuperAdminAnalytics} />
                  <Route path="/super-admin-control" component={SuperAdminControlPanel} />
                  <Route component={NotFound} />
                </Switch>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Touch Actions */}
      <TouchQuickActions />

      {/* Global Search Button - Floating */}
      <Button
        onClick={() => setShowGlobalSearch(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 group"
        size="lg"
      >
        <Search className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </Button>

      {/* Global Search Modal */}
      <GlobalSearch 
        isOpen={showGlobalSearch} 
        onClose={() => setShowGlobalSearch(false)} 
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        userRole={user?.role || ''}
        userName={user?.username || 'Team Member'}
        onComplete={completeTour}
        isOpen={showTour}
        onClose={skipTour}
      />
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  // Patient Portal Route - Independent of staff authentication
  return (
    <Switch>
      <Route path="/patient-portal" component={PatientPortal} />
      <Route>
        {() => {
          if (isLoading) {
            return (
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500 rounded-full blur-3xl"></div>
                </div>
                
                <div className="flex flex-col items-center space-y-6 z-10">
                  {/* Enhanced Loading Animation */}
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-2 w-8 h-8 border-2 border-blue-200 border-b-blue-500 rounded-full animate-spin animate-reverse"></div>
                  </div>
                  
                  {/* Brand and Status */}
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-gray-800 tracking-tight">Bluequee</div>
                    <div className="text-lg font-medium text-gray-600">Loading your workspace...</div>
                    <div className="text-sm text-gray-500">Preparing healthcare tools and patient data</div>
                  </div>
                  
                  {/* Progress Dots */}
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            );
          }

          if (!user) {
            return <Login />;
          }

          return <AuthenticatedApp />;
        }}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
