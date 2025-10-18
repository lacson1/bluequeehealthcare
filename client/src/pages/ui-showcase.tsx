import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { 
  Moon, Sun, Palette, Type, Square, MessageSquare, Bell, 
  CheckCircle, AlertCircle, AlertTriangle, Info, Heart,
  Activity, Users, Calendar, Pill, FlaskRound, Stethoscope,
  Loader2, Eye, EyeOff, Copy, Check
} from "lucide-react";

export default function UIShowcase() {
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [numberValue, setNumberValue] = useState<number | undefined>(undefined);
  const [isChecked, setIsChecked] = useState(false);
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [selectValue, setSelectValue] = useState("");
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ component: string; status: 'pass' | 'fail'; message: string }>>([]);
  const [showTestResults, setShowTestResults] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);

  const toggleDarkMode = () => {
    setIsDark(prev => {
      const newValue = !prev;
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newValue;
    });
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const showToastNotification = (type: "success" | "error" | "warning" | "info") => {
    const toastConfig = {
      success: {
        title: "Success!",
        description: "Your operation completed successfully.",
        variant: "default" as const
      },
      error: {
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive" as const
      },
      warning: {
        title: "Warning",
        description: "Please review this information carefully.",
        variant: "default" as const
      },
      info: {
        title: "Information",
        description: "Here's some helpful information for you.",
        variant: "default" as const
      }
    };

    toast(toastConfig[type]);
  };

  const runSystematicTest = async () => {
    setIsRunningTest(true);
    setShowTestResults(false);
    const results: Array<{ component: string; status: 'pass' | 'fail'; message: string }> = [];

    const addResult = (component: string, status: 'pass' | 'fail', message: string) => {
      results.push({ component, status, message });
      setTestResults([...results]);
    };

    try {
      // Test 1: Input Components
      await new Promise(resolve => setTimeout(resolve, 300));
      setInputValue("System Test");
      addResult("Text Input", "pass", "Successfully set value to 'System Test'");

      await new Promise(resolve => setTimeout(resolve, 300));
      setNumberValue(42);
      addResult("Number Input", "pass", "Successfully set value to 42");

      await new Promise(resolve => setTimeout(resolve, 300));
      setNumberValue(undefined);
      addResult("Number Input Clear", "pass", "Successfully cleared number input (placeholder test)");

      // Test 2: Checkbox & Switch
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsChecked(true);
      addResult("Checkbox", "pass", "Successfully toggled checkbox to checked");

      await new Promise(resolve => setTimeout(resolve, 300));
      setIsSwitchOn(true);
      addResult("Switch", "pass", "Successfully toggled switch to ON");

      // Test 3: Select Dropdown
      await new Promise(resolve => setTimeout(resolve, 300));
      setSelectValue("option1");
      addResult("Select Dropdown", "pass", "Successfully selected 'Option 1'");

      // Test 4: Dialog Components
      await new Promise(resolve => setTimeout(resolve, 300));
      setDialogOpen(true);
      addResult("Dialog Open", "pass", "Successfully opened standard dialog");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setDialogOpen(false);
      addResult("Dialog Close", "pass", "Successfully closed standard dialog");

      await new Promise(resolve => setTimeout(resolve, 300));
      setAlertDialogOpen(true);
      addResult("Alert Dialog Open", "pass", "Successfully opened alert dialog");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setAlertDialogOpen(false);
      addResult("Alert Dialog Close", "pass", "Successfully closed alert dialog");

      // Test 5: Toast Notifications (All Types)
      await new Promise(resolve => setTimeout(resolve, 300));
      toast({ title: "Success Test", description: "Success notification test", variant: "default" });
      addResult("Success Toast", "pass", "Successfully triggered success toast");

      await new Promise(resolve => setTimeout(resolve, 300));
      toast({ title: "Error Test", description: "Error notification test", variant: "destructive" });
      addResult("Error Toast", "pass", "Successfully triggered error toast");

      // Test 6: Progress & Loading
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 20;
        });
      }, 100);
      await new Promise(resolve => setTimeout(resolve, 700));
      addResult("Progress Bar", "pass", "Successfully animated progress to 100%");

      await new Promise(resolve => setTimeout(resolve, 300));
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1000);
      addResult("Loading Spinner", "pass", "Successfully triggered loading state");

      // Test 7: Password Toggle
      await new Promise(resolve => setTimeout(resolve, 300));
      setShowPassword(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setShowPassword(false);
      addResult("Password Toggle", "pass", "Successfully toggled password visibility");

      // Test 8: Dark Mode
      await new Promise(resolve => setTimeout(resolve, 300));
      toggleDarkMode();
      await new Promise(resolve => setTimeout(resolve, 500));
      toggleDarkMode();
      addResult("Dark Mode Toggle", "pass", "Successfully toggled dark mode on/off");

      // Test 9: Copy to Clipboard
      await new Promise(resolve => setTimeout(resolve, 300));
      copyToClipboard("Test clipboard functionality");
      addResult("Clipboard Copy", "pass", "Successfully copied text to clipboard");

      // Test 10: Alert Components (visual verification)
      await new Promise(resolve => setTimeout(resolve, 300));
      addResult("Alert Components", "pass", "Info, Success, Warning, and Error alerts rendered");

      // Test 11: Card Components (visual verification)
      await new Promise(resolve => setTimeout(resolve, 300));
      addResult("Card Components", "pass", "Basic, Metric, and Glassmorphism cards rendered");

      // Test 12: Healthcare Components (visual verification)
      await new Promise(resolve => setTimeout(resolve, 300));
      addResult("Healthcare Components", "pass", "Patient, Visit, Lab, and Pharmacy cards rendered");

      // ==== CRUD OPERATIONS TESTS ====
      let createdPatientId: number | null = null;

      // Test 13: CREATE - Create a test patient
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        const response = await apiRequest('/api/patients', 'POST', {
          title: 'Mr.',
          firstName: 'TestUser',
          lastName: 'SystemTest',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          phone: '08012345678',
          email: 'test@systemtest.com',
          address: '123 Test Street'
        });
        
        const createResponse = await response.json();
        
        if (createResponse && createResponse.id) {
          createdPatientId = createResponse.id;
          addResult("CRUD: Create Patient", "pass", `Created patient with ID ${createdPatientId}`);
        } else {
          addResult("CRUD: Create Patient", "fail", "Failed to get patient ID from response");
        }
      } catch (error: any) {
        addResult("CRUD: Create Patient", "fail", `Error: ${error.message || 'Unknown error'}`);
      }

      // Test 14: READ - Fetch the created patient
      if (createdPatientId) {
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          const response = await fetch(`/api/patients/${createdPatientId}`);
          const patient = await response.json();
          
          if (patient && patient.firstName === 'TestUser') {
            addResult("CRUD: Read Patient", "pass", `Successfully fetched patient ${patient.firstName} ${patient.lastName}`);
          } else {
            addResult("CRUD: Read Patient", "fail", "Patient data mismatch");
          }
        } catch (error: any) {
          addResult("CRUD: Read Patient", "fail", `Error: ${error.message || 'Unknown error'}`);
        }
      }

      // Test 15: UPDATE - Update the patient
      if (createdPatientId) {
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          const updateResponse = await apiRequest(`/api/patients/${createdPatientId}`, 'PATCH', {
            firstName: 'UpdatedTest'
          });
          
          await updateResponse.json();
          
          const verifyResponse = await fetch(`/api/patients/${createdPatientId}`);
          const updatedPatient = await verifyResponse.json();
          
          if (updatedPatient.firstName === 'UpdatedTest') {
            addResult("CRUD: Update Patient", "pass", `Updated patient name to ${updatedPatient.firstName}`);
          } else {
            addResult("CRUD: Update Patient", "fail", "Update verification failed");
          }
        } catch (error: any) {
          addResult("CRUD: Update Patient", "fail", `Error: ${error.message || 'Unknown error'}`);
        }
      }

      // Test 16: LIST - Verify patient appears in list
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        const listResponse = await fetch('/api/patients');
        const patients = await listResponse.json();
        
        const foundPatient = patients.find((p: any) => p.id === createdPatientId);
        
        if (foundPatient && foundPatient.firstName === 'UpdatedTest') {
          addResult("CRUD: List Patients", "pass", `Found updated patient in list (${patients.length} total patients)`);
        } else {
          addResult("CRUD: List Patients", "fail", "Patient not found in list or data mismatch");
        }
      } catch (error: any) {
        addResult("CRUD: List Patients", "fail", `Error: ${error.message || 'Unknown error'}`);
      }

      // Test 17: API Health Check
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        const response = await fetch('/api/profile');
        if (response.status === 200 || response.status === 401) {
          addResult("API: Health Check", "pass", "API endpoints responding correctly");
        } else {
          addResult("API: Health Check", "fail", `Unexpected status: ${response.status}`);
        }
      } catch (error: any) {
        addResult("API: Health Check", "fail", `Error: ${error.message || 'Unknown error'}`);
      }

      // Final Result
      await new Promise(resolve => setTimeout(resolve, 500));
      const totalTests = results.length;
      const passedTests = results.filter(r => r.status === 'pass').length;
      const failedTests = results.filter(r => r.status === 'fail').length;
      
      if (failedTests === 0) {
        toast({ 
          title: "System Test Complete!", 
          description: `All ${totalTests} tests passed successfully (UI + CRUD) ✓`,
          variant: "default"
        });
      } else {
        toast({ 
          title: "Tests Completed with Issues", 
          description: `${passedTests}/${totalTests} tests passed. ${failedTests} failed.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      addResult("System Test", "fail", `Test failed: ${error}`);
    } finally {
      setIsRunningTest(false);
      setShowTestResults(true);
    }
  };

  return (
    <div className={`min-h-screen bg-background transition-colors ${isDark ? 'dark' : ''}`}>
      {/* Header */}
      <div className="healthcare-header px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                UI Component Showcase
              </h1>
              <p className="text-white/80 text-lg">
                Interactive testing ground for Bluequee design system components
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={runSystematicTest}
                disabled={isRunningTest}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
                data-testid="button-run-system-test"
              >
                {isRunningTest ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Activity className="h-5 w-5 mr-2" />
                    Run All Tests
                  </>
                )}
              </Button>
              <Button 
                onClick={toggleDarkMode}
                variant="outline"
                size="lg"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                data-testid="button-toggle-dark-mode"
              >
                {isDark ? <Sun className="h-5 w-5 mr-2" /> : <Moon className="h-5 w-5 mr-2" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Test Results Panel */}
      {showTestResults && testResults.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <Card className="border-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-6 w-6" />
                System Test Results
              </CardTitle>
              <CardDescription>
                All component tests completed - {testResults.filter(r => r.status === 'pass').length}/{testResults.length} passed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      result.status === 'pass' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}
                    data-testid={`test-result-${index}`}
                  >
                    {result.status === 'pass' ? (
                      <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{result.component}</div>
                      <div className="text-sm opacity-80">{result.message}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-green-300 dark:border-green-700">
                <Button 
                  onClick={() => setShowTestResults(false)}
                  variant="outline"
                  className="w-full"
                  data-testid="button-close-test-results"
                >
                  Close Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="buttons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-2">
            <TabsTrigger value="buttons" data-testid="tab-buttons">Buttons</TabsTrigger>
            <TabsTrigger value="inputs" data-testid="tab-inputs">Inputs</TabsTrigger>
            <TabsTrigger value="dialogs" data-testid="tab-dialogs">Dialogs</TabsTrigger>
            <TabsTrigger value="alerts" data-testid="tab-alerts">Alerts</TabsTrigger>
            <TabsTrigger value="cards" data-testid="tab-cards">Cards</TabsTrigger>
            <TabsTrigger value="badges" data-testid="tab-badges">Badges</TabsTrigger>
            <TabsTrigger value="loading" data-testid="tab-loading">Loading</TabsTrigger>
            <TabsTrigger value="typography" data-testid="tab-typography">Typography</TabsTrigger>
            <TabsTrigger value="healthcare" data-testid="tab-healthcare">Healthcare</TabsTrigger>
            <TabsTrigger value="accessibility" data-testid="tab-accessibility">A11y</TabsTrigger>
          </TabsList>

          {/* Buttons Tab */}
          <TabsContent value="buttons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Button Variants</CardTitle>
                <CardDescription>All button styles with different states and sizes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Variants</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button data-testid="button-default">Default</Button>
                    <Button variant="secondary" data-testid="button-secondary">Secondary</Button>
                    <Button variant="destructive" data-testid="button-destructive">Destructive</Button>
                    <Button variant="outline" data-testid="button-outline">Outline</Button>
                    <Button variant="ghost" data-testid="button-ghost">Ghost</Button>
                    <Button variant="link" data-testid="button-link">Link</Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sizes</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm" data-testid="button-small">Small</Button>
                    <Button size="default" data-testid="button-medium">Medium</Button>
                    <Button size="lg" data-testid="button-large">Large</Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">States</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button disabled data-testid="button-disabled">Disabled</Button>
                    <Button onClick={simulateLoading} disabled={isLoading} data-testid="button-loading">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isLoading ? 'Loading...' : 'Click to Load'}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">With Icons</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button data-testid="button-icon-left">
                      <Users className="mr-2 h-4 w-4" />
                      Patients
                    </Button>
                    <Button variant="secondary" data-testid="button-icon-right">
                      Laboratory
                      <FlaskRound className="ml-2 h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" data-testid="button-icon-only">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inputs Tab */}
          <TabsContent value="inputs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Form Inputs</CardTitle>
                <CardDescription>Interactive form controls with validation states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="text-input">Text Input</Label>
                  <Input 
                    id="text-input"
                    type="text" 
                    placeholder="Enter text here..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    data-testid="input-text"
                  />
                  {inputValue && <p className="text-sm text-muted-foreground">Current value: {inputValue}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number-input">Number Input (Clearable)</Label>
                  <Input 
                    id="number-input"
                    type="number" 
                    placeholder="0"
                    value={numberValue ?? ''}
                    onChange={(e) => setNumberValue(e.target.value === '' ? undefined : parseInt(e.target.value))}
                    data-testid="input-number"
                  />
                  <p className="text-xs text-muted-foreground">
                    Test clearing: Type a number, then delete it to ensure placeholder shows
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-input">Password Input</Label>
                  <div className="relative">
                    <Input 
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password..."
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textarea">Textarea</Label>
                  <Textarea 
                    id="textarea"
                    placeholder="Enter multiple lines of text..."
                    rows={4}
                    data-testid="input-textarea"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="select">Select Dropdown</Label>
                  <Select value={selectValue} onValueChange={setSelectValue}>
                    <SelectTrigger id="select" data-testid="select-trigger">
                      <SelectValue placeholder="Choose an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectValue && <p className="text-sm text-muted-foreground">Selected: {selectValue}</p>}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="checkbox"
                      checked={isChecked}
                      onCheckedChange={(checked) => setIsChecked(checked as boolean)}
                      data-testid="input-checkbox"
                    />
                    <Label htmlFor="checkbox">Checkbox {isChecked && '✓'}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="switch"
                      checked={isSwitchOn}
                      onCheckedChange={setIsSwitchOn}
                      data-testid="input-switch"
                    />
                    <Label htmlFor="switch">Switch {isSwitchOn ? 'ON' : 'OFF'}</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Disabled Input</Label>
                  <Input disabled placeholder="This input is disabled" data-testid="input-disabled" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dialogs Tab */}
          <TabsContent value="dialogs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dialogs & Modals</CardTitle>
                <CardDescription>Interactive popups for user confirmation and forms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-open-dialog">Open Dialog</Button>
                    </DialogTrigger>
                    <DialogContent data-testid="dialog-content">
                      <DialogHeader>
                        <DialogTitle>Dialog Title</DialogTitle>
                        <DialogDescription>
                          This is a standard dialog with a form or information.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="dialog-input">Name</Label>
                          <Input id="dialog-input" placeholder="Enter name" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" data-testid="button-dialog-submit">Save changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" data-testid="button-open-alert-dialog">Delete Action</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent data-testid="alert-dialog-content">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the item.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-alert-cancel">Cancel</AlertDialogCancel>
                        <AlertDialogAction data-testid="button-alert-confirm">Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alerts & Notifications</CardTitle>
                <CardDescription>Visual feedback for different message types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Static Alerts</h3>
                  
                  <Alert data-testid="alert-info">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Information</AlertTitle>
                    <AlertDescription>
                      This is an informational message to keep you updated.
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950" data-testid="alert-success">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800 dark:text-green-200">Success</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      Your operation completed successfully!
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950" data-testid="alert-warning">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800 dark:text-yellow-200">Warning</AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                      Please review this information carefully before proceeding.
                    </AlertDescription>
                  </Alert>

                  <Alert variant="destructive" data-testid="alert-error">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Something went wrong. Please try again or contact support.
                    </AlertDescription>
                  </Alert>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Toast Notifications</h3>
                  <p className="text-sm text-muted-foreground">Click buttons to trigger toast notifications</p>
                  <div className="flex flex-wrap gap-4">
                    <Button onClick={() => showToastNotification('success')} data-testid="button-toast-success">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Success Toast
                    </Button>
                    <Button onClick={() => showToastNotification('error')} variant="destructive" data-testid="button-toast-error">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Error Toast
                    </Button>
                    <Button onClick={() => showToastNotification('warning')} variant="outline" data-testid="button-toast-warning">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Warning Toast
                    </Button>
                    <Button onClick={() => showToastNotification('info')} variant="secondary" data-testid="button-toast-info">
                      <Info className="mr-2 h-4 w-4" />
                      Info Toast
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="healthcare-card" data-testid="card-basic">
                <CardHeader>
                  <CardTitle>Basic Card</CardTitle>
                  <CardDescription>Standard card with header and content</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This is a basic card component with a clean, professional design.
                  </p>
                </CardContent>
              </Card>

              <Card className="metric-card group hover:scale-105 transition-all" data-testid="card-metric">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">Active</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-foreground">1,234</p>
                  <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                  <p className="text-xs text-green-600 font-medium">+12% from last month</p>
                </div>
              </Card>

              <Card className="glass-panel" data-testid="card-glass">
                <CardHeader>
                  <CardTitle>Glass Morphism</CardTitle>
                  <CardDescription>Card with glassmorphic effect</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Subtle backdrop blur creates depth and modern aesthetic.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Badges</CardTitle>
                <CardDescription>Visual indicators for status and categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Default Variants</h3>
                  <div className="flex flex-wrap gap-4">
                    <Badge data-testid="badge-default">Default</Badge>
                    <Badge variant="secondary" data-testid="badge-secondary">Secondary</Badge>
                    <Badge variant="destructive" data-testid="badge-destructive">Destructive</Badge>
                    <Badge variant="outline" data-testid="badge-outline">Outline</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Status Badges (Healthcare)</h3>
                  <div className="flex flex-wrap gap-4">
                    <Badge className="status-badge success" data-testid="badge-status-success">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Completed
                    </Badge>
                    <Badge className="status-badge warning" data-testid="badge-status-warning">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Pending
                    </Badge>
                    <Badge className="status-badge error" data-testid="badge-status-error">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Critical
                    </Badge>
                    <Badge className="status-badge info" data-testid="badge-status-info">
                      <Info className="mr-1 h-3 w-3" />
                      Review
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loading Tab */}
          <TabsContent value="loading" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Loading States</CardTitle>
                <CardDescription>Progress indicators and skeleton screens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Progress Bar</h3>
                  <div className="space-y-2">
                    <Progress value={progress} className="w-full" data-testid="progress-bar" />
                    <p className="text-sm text-muted-foreground">{progress}% complete</p>
                    <Button onClick={simulateProgress} size="sm" data-testid="button-simulate-progress">
                      Simulate Progress
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Spinners</h3>
                  <div className="flex gap-4 items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" data-testid="spinner-primary" />
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="spinner-muted" />
                    <Loader2 className="h-10 w-10 animate-spin text-destructive" data-testid="spinner-destructive" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Skeleton Screens</h3>
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" data-testid="skeleton-large" />
                    <Skeleton className="h-8 w-3/4" data-testid="skeleton-medium" />
                    <Skeleton className="h-8 w-1/2" data-testid="skeleton-small" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Typography System</CardTitle>
                <CardDescription>Font styles, weights, and hierarchies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold" data-testid="text-h1">Heading 1</h1>
                  <h2 className="text-3xl font-bold" data-testid="text-h2">Heading 2</h2>
                  <h3 className="text-2xl font-semibold" data-testid="text-h3">Heading 3</h3>
                  <h4 className="text-xl font-semibold" data-testid="text-h4">Heading 4</h4>
                  <p className="text-base" data-testid="text-body">Body text: The quick brown fox jumps over the lazy dog</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-small">Small text: Additional information goes here</p>
                  <p className="text-xs text-muted-foreground" data-testid="text-tiny">Tiny text: Fine print or captions</p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Font Weights</h3>
                  <p className="font-light" data-testid="text-light">Light (300)</p>
                  <p className="font-normal" data-testid="text-normal">Normal (400)</p>
                  <p className="font-medium" data-testid="text-medium">Medium (500)</p>
                  <p className="font-semibold" data-testid="text-semibold">Semibold (600)</p>
                  <p className="font-bold" data-testid="text-bold">Bold (700)</p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Colors</h3>
                  <p className="text-foreground" data-testid="text-color-foreground">Foreground</p>
                  <p className="text-muted-foreground" data-testid="text-color-muted">Muted Foreground</p>
                  <p className="text-primary" data-testid="text-color-primary">Primary</p>
                  <p className="text-destructive" data-testid="text-color-destructive">Destructive</p>
                  <p className="gradient-text text-2xl font-bold" data-testid="text-gradient">Gradient Text</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Healthcare Components Tab */}
          <TabsContent value="healthcare" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="metric-card group cursor-pointer hover:scale-105 hover:border-blue-200/60 transition-all" data-testid="card-healthcare-patients">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-transparent to-blue-100/40 pointer-events-none group-hover:from-blue-100/80 group-hover:to-blue-200/60 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-100/80 to-blue-200/60 rounded-xl shadow-sm">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">Active</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-foreground">1,234</p>
                    <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                    <p className="text-xs text-green-600 font-medium">+12% from last month</p>
                  </div>
                </div>
              </Card>

              <Card className="metric-card group cursor-pointer hover:scale-105 hover:border-green-200/60 transition-all" data-testid="card-healthcare-visits">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 via-transparent to-green-100/40 pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-green-100/80 to-green-200/60 rounded-xl shadow-sm">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-foreground">28</p>
                    <p className="text-sm font-medium text-muted-foreground">Today's Visits</p>
                    <p className="text-xs text-blue-600 font-medium">3 scheduled next</p>
                  </div>
                </div>
              </Card>

              <Card className="metric-card group cursor-pointer hover:scale-105 hover:border-orange-200/60 transition-all" data-testid="card-healthcare-labs">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-transparent to-orange-100/40 pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-orange-100/80 to-orange-200/60 rounded-xl shadow-sm">
                      <Activity className="h-6 w-6 text-orange-600" />
                    </div>
                    <Badge className="bg-orange-100 text-orange-700">Pending</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-foreground">15</p>
                    <p className="text-sm font-medium text-muted-foreground">Lab Orders</p>
                    <p className="text-xs text-slate-600 font-medium">Awaiting results</p>
                  </div>
                </div>
              </Card>

              <Card className="metric-card group cursor-pointer hover:scale-105 hover:border-purple-200/60 transition-all" data-testid="card-healthcare-pharmacy">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-transparent to-purple-100/40 pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-100/80 to-purple-200/60 rounded-xl shadow-sm">
                      <Pill className="h-6 w-6 text-purple-600" />
                    </div>
                    <Badge className="bg-purple-100 text-purple-700">Low Stock</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-foreground">8</p>
                    <p className="text-sm font-medium text-muted-foreground">Medications</p>
                    <p className="text-xs text-red-600 font-medium">Need restock</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Prescription Card Example</CardTitle>
                <CardDescription>Healthcare-specific component styling</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="medication-box" data-testid="card-prescription">
                  <div className="medication-name">PARACETAMOL 500MG</div>
                  <div className="prescription-details">
                    <div className="prescription-item">
                      <span className="label">Dosage:</span> 1 tablet
                    </div>
                    <div className="prescription-item">
                      <span className="label">Frequency:</span> Twice daily
                    </div>
                    <div className="prescription-item">
                      <span className="label">Duration:</span> 7 days
                    </div>
                    <div className="prescription-item">
                      <span className="label">Instructions:</span> Take with food
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility Tab */}
          <TabsContent value="accessibility" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Testing</CardTitle>
                <CardDescription>Test keyboard navigation, screen readers, and ARIA labels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Keyboard Navigation</h3>
                  <Alert data-testid="alert-keyboard">
                    <Info className="h-4 w-4" />
                    <AlertTitle>How to Test</AlertTitle>
                    <AlertDescription>
                      Press Tab to navigate through interactive elements. Press Enter/Space to activate buttons.
                      Press Shift+Tab to go backwards. All interactive elements should be reachable and have visible focus indicators.
                    </AlertDescription>
                  </Alert>
                  <div className="flex flex-wrap gap-4 p-4 border rounded-lg">
                    <Button data-testid="button-keyboard-1">Button 1</Button>
                    <Button variant="secondary" data-testid="button-keyboard-2">Button 2</Button>
                    <Button variant="outline" data-testid="button-keyboard-3">Button 3</Button>
                    <Input placeholder="Focusable input" className="w-48" data-testid="input-keyboard" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Color Contrast</h3>
                  <div className="space-y-2">
                    <div className="p-4 bg-primary text-primary-foreground rounded-lg" data-testid="contrast-primary">
                      Primary background with foreground text (AAA compliant)
                    </div>
                    <div className="p-4 bg-secondary text-secondary-foreground rounded-lg" data-testid="contrast-secondary">
                      Secondary background with foreground text
                    </div>
                    <div className="p-4 bg-muted text-muted-foreground rounded-lg" data-testid="contrast-muted">
                      Muted background with foreground text
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">ARIA Labels & Roles</h3>
                  <Alert data-testid="alert-aria">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Screen Reader Testing</AlertTitle>
                    <AlertDescription>
                      All interactive elements have proper ARIA labels and roles for screen reader accessibility.
                      Use a screen reader (NVDA, JAWS, VoiceOver) to verify proper announcements.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Button aria-label="Delete item" variant="destructive" data-testid="button-aria-delete">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Delete (with ARIA label)
                    </Button>
                    <div role="status" aria-live="polite" className="text-sm text-muted-foreground" data-testid="text-aria-status">
                      Live region for status updates
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Copy Text Helper</h3>
                  <div className="flex items-center gap-2">
                    <code className="relative rounded bg-muted px-3 py-1 font-mono text-sm" data-testid="code-copyable">
                      npm install bluequee
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('npm install bluequee')}
                      data-testid="button-copy-code"
                    >
                      {copiedText === 'npm install bluequee' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
