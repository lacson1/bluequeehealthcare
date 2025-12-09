import { Switch, Route } from "wouter";
import { useState, useEffect, lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TopBarConfigProvider } from "@/hooks/use-topbar-config";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Search } from "lucide-react";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

// Core components loaded immediately
import OnboardingTour from "@/components/onboarding-tour";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";
import TouchQuickActions from "@/components/touch-quick-actions";
import OfflineStatusBar from "@/components/offline-status-bar";
import { GlobalSearch } from "@/components/global-search";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";
import { useGlobalShortcuts } from "@/hooks/use-keyboard-shortcuts";


// Lazy load pages for better code splitting
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Patients = lazy(() => import("@/pages/patients"));
const PatientProfile = lazy(() => import("@/pages/patient-profile"));
const Visits = lazy(() => import("@/pages/visits"));
const EnhancedPharmacy = lazy(() => import("@/pages/pharmacy-enhanced"));
const InventoryPage = lazy(() => import("@/pages/inventory"));
const Referrals = lazy(() => import("@/pages/referrals"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const UserManagementSimple = lazy(() => import("@/pages/user-management-simple"));
const AIClinicalInsights = lazy(() => import("@/pages/ai-clinical-insights"));
const AuditLogs = lazy(() => import("@/pages/audit-logs"));
const FormBuilder = lazy(() => import("@/pages/form-builder"));
const ClinicalPerformance = lazy(() => import("@/pages/clinical-performance"));
const OrganizationManagement = lazy(() => import("@/pages/organization-management"));
const MedicalToolsPage = lazy(() => import("@/pages/medical-tools").then(m => ({ default: m.MedicalToolsPage })));
const PatientPortal = lazy(() => import("@/pages/patient-portal"));
const RecordVisitPage = lazy(() => import("@/pages/record-visit"));
const NewLabOrderPage = lazy(() => import("@/pages/new-lab-order"));
const EditVisit = lazy(() => import("@/pages/edit-visit"));
const VisitDetail = lazy(() => import("@/pages/visit-detail"));
const AppointmentsPage = lazy(() => import("@/pages/appointments"));
const LaboratoryUnified = lazy(() => import("@/pages/laboratory-unified"));
const DocumentsPage = lazy(() => import("@/pages/documents"));
const RevenueAnalytics = lazy(() => import("@/pages/revenue-analytics"));
const TelemedicinePage = lazy(() => import("@/pages/telemedicine"));
const PhysiotherapyPage = lazy(() => import("@/pages/physiotherapy"));
const ExerciseLeafletsPage = lazy(() => import("@/pages/exercise-leaflets"));
const MedicalCertificatesPage = lazy(() => import("@/pages/medical-certificates"));
const ReferralLettersPage = lazy(() => import("@/pages/referral-letters"));
const EnhancedPrescriptionForm = lazy(() => import("@/pages/enhanced-prescription"));
const ClinicalProtocols = lazy(() => import("@/components/clinical-protocols"));
const ConsultationDashboard = lazy(() => import("@/pages/consultation-dashboard"));
const PatientAccessCards = lazy(() => import("@/pages/patient-access-cards"));
const Settings = lazy(() => import("@/pages/settings"));
const PerformancePage = lazy(() => import("@/pages/performance-page").then(m => ({ default: m.PerformancePage })));
const Profile = lazy(() => import("@/pages/profile"));
const SuperAdminAnalytics = lazy(() => import("@/pages/superadmin-analytics"));
const SuperAdminControlPanel = lazy(() => import("@/pages/super-admin-control-panel"));
const SuperAdminControl = lazy(() => import("@/pages/super-admin-control"));
const ProceduralReports = lazy(() => import("@/pages/procedural-reports"));
const ConsentManagement = lazy(() => import("@/pages/consent-management"));
const StaffMessages = lazy(() => import("@/pages/staff-messages"));
const BillingPage = lazy(() => import("@/pages/billing"));
const CompliancePage = lazy(() => import("@/pages/compliance"));
// Login is imported directly (not lazy) since it's needed immediately for unauthenticated users
import Login from "@/pages/login";
const NotFound = lazy(() => import("@/pages/not-found"));
const ConsultationRecordDetails = lazy(() => import("@/pages/consultation-record-details"));
const HelpAndSupport = lazy(() => import("@/pages/help-support"));
const RoleManagement = lazy(() => import("@/pages/role-management"));
const StaffAccessControl = lazy(() => import("@/pages/staff-access-control"));
const OrganizationSelector = lazy(() => import("@/pages/organization-selector"));
const OrganizationStaff = lazy(() => import("@/pages/organization-staff"));
const AiConsultationsListPage = lazy(() => import("@/pages/ai-consultations-list"));
const AiConsultationPage = lazy(() => import("@/pages/ai-consultation"));
const PatientCommunicationPage = lazy(() => import("@/pages/patient-communication"));
const AdminDashboardEnhanced = lazy(() => import("@/pages/admin-dashboard-enhanced"));
const AuditLogsEnhanced = lazy(() => import("@/pages/audit-logs-enhanced"));
const VaccinationManagement = lazy(() => import("@/pages/vaccination-management"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-full w-full min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);

function AuthenticatedApp() {
  const { user } = useAuth();

  // Enable global keyboard shortcuts
  useGlobalShortcuts();
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
    <div className="flex h-screen bg-background overflow-hidden">
      <OfflineStatusBar />
      <KeyboardShortcutsModal />
      <Sidebar onStartTour={startTour} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 flex flex-col overflow-hidden bg-background relative">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-accent rounded-full blur-3xl"></div>
            <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
          </div>
          {/* Enhanced Container with Healthcare-Focused Design */}
          <div className="flex-1 overflow-y-auto scrollbar-thin relative z-10">
            <div className="w-full">
              {/* Page Content with Smooth Transitions */}
              <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out relative">
                <Suspense fallback={<PageLoader />}>
                  <Switch>
                    <Route path="/" component={Dashboard} />
                    <Route path="/select-organization" component={OrganizationSelector} />
                    <Route path="/dashboard" component={Dashboard} />
                    <Route path="/admin-dashboard" component={AdminDashboardEnhanced} />
                    <Route path="/clinical-activity" component={ConsultationDashboard} />
                    <Route path="/patients" component={Patients} />
                    <Route path="/patients/:id" component={PatientProfile} />
                    <Route path="/patients/:patientId/record-visit" component={RecordVisitPage} />
                    <Route path="/patients/:patientId/lab-orders/new" component={NewLabOrderPage} />
                    <Route path="/patients/:patientId/visits/:visitId/edit" component={EditVisit} />
                    <Route path="/patients/:patientId/visits/:visitId" component={VisitDetail} />
                    <Route path="/consultation-records/:id" component={ConsultationRecordDetails} />
                    <Route path="/visits" component={Visits} />
                    <Route path="/laboratory" component={LaboratoryUnified} />
                    <Route path="/lab-results" component={LaboratoryUnified} />
                    <Route path="/lab-orders" component={LaboratoryUnified} />
                    <Route path="/laboratory-enhanced" component={LaboratoryUnified} />
                    <Route path="/pharmacy" component={EnhancedPharmacy} />
                    <Route path="/inventory" component={InventoryPage} />
                    <Route path="/referrals" component={Referrals} />
                    <Route path="/appointments" component={AppointmentsPage} />
                    <Route path="/patient-communication" component={PatientCommunicationPage} />
                    <Route path="/ai-consultations" component={AiConsultationsListPage} />
                    <Route path="/ai-consultations/:id" component={AiConsultationPage} />
                    <Route path="/consultation-dashboard" component={ConsultationDashboard} />
                    <Route path="/documents" component={DocumentsPage} />
                    <Route path="/billing" component={BillingPage} />
                    <Route path="/analytics" component={RevenueAnalytics} />
                    <Route path="/telemedicine" component={TelemedicinePage} />
                    <Route path="/physiotherapy" component={PhysiotherapyPage} />
                    <Route path="/exercise-leaflets" component={ExerciseLeafletsPage} />
                    <Route path="/medical-certificates" component={MedicalCertificatesPage} />
                    <Route path="/referral-letters" component={ReferralLettersPage} />
                    <Route path="/prescriptions" component={EnhancedPrescriptionForm} />
                    <Route path="/enhanced-prescription" component={EnhancedPrescriptionForm} />
                    <Route path="/laboratory-enhanced" component={LaboratoryUnified} />

                    <Route path="/protocols" component={ClinicalProtocols} />
                    <Route path="/form-builder" component={FormBuilder} />
                    <Route path="/medical-tools" component={MedicalToolsPage} />
                    <Route path="/clinical-performance" component={ClinicalPerformance} />
                    <Route path="/profile" component={ProfilePage} />
                    <Route path="/my-profile" component={Profile} />
                    <Route path="/settings" component={Settings} />
                    <Route path="/help" component={HelpAndSupport} />
                    <Route path="/user-management" component={UserManagementSimple} />
                    <Route path="/ai-clinical-insights" component={AIClinicalInsights} />
                    <Route path="/audit-logs" component={AuditLogs} />
                    <Route path="/audit-logs-enhanced" component={AuditLogsEnhanced} />
                    <Route path="/performance" component={PerformancePage} />
                    <Route path="/organization-management" component={OrganizationManagement} />
                    <Route path="/organization-staff" component={OrganizationStaff} />
                    <Route path="/patient-access-cards" component={PatientAccessCards} />
                    <Route path="/procedural-reports" component={ProceduralReports} />
                    <Route path="/consent-management" component={ConsentManagement} />
                    <Route path="/staff-messages" component={StaffMessages} />
                    <Route path="/global-analytics" component={SuperAdminAnalytics} />
                    <Route path="/superadmin/analytics" component={SuperAdminAnalytics} />
                    <Route path="/super-admin-control-panel" component={SuperAdminControlPanel} />
                    <Route path="/super-admin-control" component={SuperAdminControl} />
                    <Route path="/role-management" component={RoleManagement} />
                    <Route path="/staff-access-control" component={StaffAccessControl} />
                    <Route path="/vaccination-management" component={VaccinationManagement} />
                    <Route path="/vaccinations" component={VaccinationManagement} />
                    <Route path="/compliance" component={CompliancePage} />
                    <Route component={NotFound} />
                  </Switch>
                </Suspense>
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
        aria-label="Open global search"
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
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/patient-portal" component={PatientPortal} />
        <Route path="/login" component={Login} />
        <Route>
          {() => {
            // Show loading state while checking authentication
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

            // Redirect to login if not authenticated
            if (!user) {
              return <Login />;
            }

            // Show authenticated app
            return <AuthenticatedApp />;
          }}
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TopBarConfigProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </TopBarConfigProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
