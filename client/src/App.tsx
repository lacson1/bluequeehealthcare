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
import UserManagement from "@/pages/user-management";
import AuditLogs from "@/pages/audit-logs";
import FormBuilder from "@/pages/form-builder";
import ClinicalPerformance from "@/pages/clinical-performance";
import OrganizationManagement from "@/pages/organization-management";
import { MedicalToolsPage } from "@/pages/medical-tools";
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
    <div className="flex h-screen bg-slate-50">
      <div className="hidden md:block">
        <Sidebar onStartTour={startTour} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 md:p-8">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/patients" component={Patients} />
              <Route path="/patients/:id" component={PatientProfile} />
              <Route path="/visits" component={Visits} />
              <Route path="/lab-results" component={LabResults} />
              <Route path="/pharmacy" component={Pharmacy} />
              <Route path="/referrals" component={Referrals} />
              <Route path="/form-builder" component={FormBuilder} />
              <Route path="/medical-tools" component={MedicalToolsPage} />
              <Route path="/clinical-performance" component={ClinicalPerformance} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/user-management" component={UserManagement} />
              <Route path="/audit-logs" component={AuditLogs} />
              <Route path="/organization-management" component={OrganizationManagement} />
              <Route component={NotFound} />
            </Switch>
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <AuthenticatedApp />;
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
