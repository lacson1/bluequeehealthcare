import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/use-onboarding";
import OnboardingTour from "@/components/onboarding-tour";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import PatientProfile from "@/pages/patient-profile-clean";
import Visits from "@/pages/visits";
import LabResults from "@/pages/lab-results";
import Pharmacy from "@/pages/pharmacy";
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
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const { user } = useAuth();
  const {
    showTour,
    isNewUser,
    completeTour,
    startTour,
    skipTour
  } = useOnboarding(user?.id || 0, user?.role || '');

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <Sidebar onStartTour={startTour} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <TopBar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 transition-all duration-300 ease-in-out">
            <div className="animate-in fade-in-0 duration-300">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/patients" component={Patients} />
                <Route path="/patients/:id" component={PatientProfile} />
                <Route path="/patients/:patientId/record-visit" component={RecordVisitPage} />
                <Route path="/patients/:patientId/visits/:visitId/edit" component={EditVisit} />
                <Route path="/visits" component={Visits} />
                <Route path="/lab-results" component={LabResults} />
                <Route path="/pharmacy" component={Pharmacy} />
                <Route path="/referrals" component={Referrals} />
                <Route path="/form-builder" component={FormBuilder} />
                <Route path="/medical-tools" component={MedicalToolsPage} />
                <Route path="/clinical-performance" component={ClinicalPerformance} />
                <Route path="/profile" component={ProfilePage} />
                <Route path="/user-management" component={UserManagementEnhanced} />
                <Route path="/audit-logs" component={AuditLogs} />
                <Route path="/organization-management" component={OrganizationManagement} />
                <Route component={NotFound} />
              </Switch>
            </div>
          </div>
        </main>
      </div>

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
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="text-lg font-medium text-gray-700">Loading ClinicConnect...</div>
                  <div className="text-sm text-gray-500">Preparing your healthcare workspace</div>
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
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
