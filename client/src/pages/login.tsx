import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Heart, Shield, Activity, Stethoscope, Users, Eye, EyeOff, CheckCircle, Building2, ChevronRight, ArrowLeft, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

// Import futuristic gradient background
import backgroundImage from '@assets/particle-lines-futuristic-gradient-background_1760322867271.jpg';

interface Organization {
  id: number;
  name: string;
  type: string;
  themeColor?: string;
  logoUrl?: string;
}

interface UserOrganization {
  organizationId: number;
  isDefault: boolean;
  organization: Organization | null;
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'login' | 'select-org'>('login');
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [isCompletingLogin, setIsCompletingLogin] = useState(false);
  const [isDemoLoginExpanded, setIsDemoLoginExpanded] = useState(false);
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid username or password');
      }

      const data = await response.json();
      const responseData = data.data || data;

      // Check if organization selection is required
      if (responseData.requiresOrgSelection && responseData.organizations) {
        setOrganizations(responseData.organizations);
        setStep('select-org');
        // Pre-select default organization if available
        const defaultOrg = responseData.organizations.find((org: UserOrganization) => org.isDefault);
        if (defaultOrg) {
          setSelectedOrgId(defaultOrg.organizationId);
        } else if (responseData.organizations.length > 0) {
          setSelectedOrgId(responseData.organizations[0].organizationId);
        }
      } else {
        // Single organization or no organizations - proceed with normal login
        await login(username, password);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid username or password';

      // Handle network/fetch errors with a helpful message
      if (errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('Network request failed')) {
        setError('Cannot connect to server. Please make sure the backend server is running. Start it with: npm run dev');
        toast({
          title: "Cannot Connect to Server",
          description: "The backend server is not running. Please start it with: npm run dev",
          variant: "destructive",
          duration: 10000,
        });
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleCompleteLogin = async () => {
    if (!selectedOrgId) {
      setError('Please select an organization');
      return;
    }

    setIsCompletingLogin(true);
    setError('');

    try {
      const response = await fetch('/api/auth/complete-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ organizationId: selectedOrgId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to complete login');
      }

      const data = await response.json();
      const responseData = data.data || data;

      // Update user context
      if (responseData.user) {
        // Refresh the page to reload user context
        window.location.href = '/dashboard';
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to complete login');
      setIsCompletingLogin(false);
    }
  };

  const handleDemoLogin = async (demoUsername: string, demoPassword: string) => {
    setError('');
    setUsername(demoUsername);
    setPassword(demoPassword);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username: demoUsername, password: demoPassword }),
      });

      if (!response.ok) {
        throw new Error('Invalid demo credentials');
      }

      const data = await response.json();
      const responseData = data.data || data;

      // Check if organization selection is required
      if (responseData.requiresOrgSelection && responseData.organizations) {
        setOrganizations(responseData.organizations);
        setStep('select-org');
        const defaultOrg = responseData.organizations.find((org: UserOrganization) => org.isDefault);
        if (defaultOrg) {
          setSelectedOrgId(defaultOrg.organizationId);
        } else if (responseData.organizations.length > 0) {
          setSelectedOrgId(responseData.organizations[0].organizationId);
        }
      } else {
        await login(demoUsername, demoPassword);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid demo credentials';

      // Handle network/fetch errors with a helpful message
      if (errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('Network request failed')) {
        setError('Cannot connect to server. Please make sure the backend server is running. Start it with: npm run dev');
        toast({
          title: "Cannot Connect to Server",
          description: "The backend server is not running. Please start it with: npm run dev",
          variant: "destructive",
          duration: 10000,
        });
      } else {
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Futuristic Gradient Background */}
      <div
        className="absolute inset-0 bg-cover bg-center animate-[float_20s_ease-in-out_infinite]"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: '120%'
        }}
      />

      {/* Gradient Blend Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-white/30" />

      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">

        {/* Left Side - Professional Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-800">
                  Bluequee
                </h1>
                <p className="text-slate-700 font-medium">
                  Healthcare Management System
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-800">
                Professional Clinical Management
              </h2>
              <p className="text-slate-700 leading-relaxed text-lg">
                Comprehensive healthcare platform with intelligent analytics, real-time monitoring, and streamlined patient care workflows.
              </p>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="healthcare-card p-6 group hover:shadow-lg transition-all bg-white/70 backdrop-blur-md">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Smart Analytics</h3>
              <p className="text-sm text-muted-foreground">Intelligent diagnostic insights</p>
            </div>

            <div className="healthcare-card p-6 group hover:shadow-lg transition-all bg-white/70 backdrop-blur-md">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Heart className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Vital Monitoring</h3>
              <p className="text-sm text-muted-foreground">Real-time health tracking</p>
            </div>

            <div className="healthcare-card p-6 group hover:shadow-lg transition-all bg-white/70 backdrop-blur-md">
              <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-info/20 transition-colors">
                <Users className="w-6 h-6 text-info" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Patient Care</h3>
              <p className="text-sm text-muted-foreground">Comprehensive patient management</p>
            </div>

            <div className="healthcare-card p-6 group hover:shadow-lg transition-all bg-white/70 backdrop-blur-md">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-success/20 transition-colors">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Secure Vault</h3>
              <p className="text-sm text-muted-foreground">HIPAA-compliant protection</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form or Organization Selection */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="healthcare-card shadow-2xl bg-transparent backdrop-blur-2xl border-white/20">
            {step === 'login' ? (
              <>
                <CardHeader className="space-y-4 pb-6">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                      <Stethoscope className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2">
                      <CardTitle className="text-3xl font-bold text-foreground">
                        Sign In
                      </CardTitle>
                      <CardDescription className="text-base">
                        Enter your credentials to continue
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          disabled={isLoading}
                          className="h-11 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center justify-end">
                      <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <Stethoscope className="mr-2 h-4 w-4" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Signup Link */}
                  <div className="relative">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                      NEW USER?
                    </span>
                  </div>

                  <Link href="/signup">
                    <Button variant="outline" className="w-full h-11" disabled={isLoading}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create New Account
                    </Button>
                  </Link>

                  {/* OAuth Login - Currently Disabled */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                        OR CONTINUE WITH
                      </span>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                      <p className="text-sm text-muted-foreground text-center">
                        OAuth login (Google, GitHub, etc.) is not yet available. Please use username/password login above.
                      </p>
                    </div>
                  </div>

                  {/* Demo Accounts - Collapsible */}
                  <div className="bg-muted/10 rounded-lg border border-border/10">
                    <button
                      type="button"
                      onClick={() => setIsDemoLoginExpanded(!isDemoLoginExpanded)}
                      className="w-full p-2 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors rounded-lg"
                    >
                      <div className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1.5 text-muted-foreground/50" />
                        <span>Quick Demo Login</span>
                      </div>
                      {isDemoLoginExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                    {isDemoLoginExpanded && (
                      <div className="px-2 pb-2 space-y-1">
                        <Button
                          onClick={() => handleDemoLogin('superadmin', 'super123')}
                          disabled={isLoading}
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        >
                          <Shield className="w-3 h-3 mr-2 text-muted-foreground/50" />
                          Super Admin
                        </Button>

                        <Button
                          onClick={() => handleDemoLogin('admin', 'admin123')}
                          disabled={isLoading}
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        >
                          <Users className="w-3 h-3 mr-2 text-muted-foreground/50" />
                          Admin
                        </Button>

                        <Button
                          onClick={() => handleDemoLogin('ade', 'doctor123')}
                          disabled={isLoading}
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        >
                          <Stethoscope className="w-3 h-3 mr-2 text-muted-foreground/50" />
                          Doctor (Ade)
                        </Button>

                        <Button
                          onClick={() => handleDemoLogin('syb', 'nurse123')}
                          disabled={isLoading}
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        >
                          <Heart className="w-3 h-3 mr-2 text-muted-foreground/50" />
                          Nurse (Syb)
                        </Button>

                        <Button
                          onClick={() => handleDemoLogin('receptionist', 'receptionist123')}
                          disabled={isLoading}
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        >
                          <Activity className="w-3 h-3 mr-2 text-muted-foreground/50" />
                          Receptionist
                        </Button>

                        <Button
                          onClick={() => handleDemoLogin('akin', 'pharmacist123')}
                          disabled={isLoading}
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        >
                          <Activity className="w-3 h-3 mr-2 text-muted-foreground/50" />
                          Pharmacist (Akin)
                        </Button>

                        <Button
                          onClick={() => handleDemoLogin('seye', 'physio123')}
                          disabled={isLoading}
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        >
                          <Activity className="w-3 h-3 mr-2 text-muted-foreground/50" />
                          Physiotherapist (Seye)
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="space-y-4 pb-6">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2">
                      <CardTitle className="text-3xl font-bold text-foreground">
                        Select Organization
                      </CardTitle>
                      <CardDescription className="text-base">
                        Choose which organization you want to access today
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    {organizations.map((userOrg) => {
                      if (!userOrg.organization) return null;
                      const isSelected = selectedOrgId === userOrg.organizationId;
                      return (
                        <Card
                          key={userOrg.organizationId}
                          className={`cursor-pointer transition-all hover:border-primary ${isSelected ? 'border-primary border-2 bg-primary/5' : ''
                            }`}
                          onClick={() => setSelectedOrgId(userOrg.organizationId)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div
                                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: `${userOrg.organization.themeColor || '#3B82F6'}20` }}
                                >
                                  <Building2
                                    className="w-6 h-6"
                                    style={{ color: userOrg.organization.themeColor || '#3B82F6' }}
                                  />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg flex items-center gap-2">
                                    {userOrg.organization.name}
                                    {userOrg.isDefault && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        Default
                                      </span>
                                    )}
                                  </h3>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {userOrg.organization.type}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle className="w-6 h-6 text-primary" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep('login');
                        setError('');
                        setOrganizations([]);
                        setSelectedOrgId(null);
                      }}
                      className="flex-1"
                      disabled={isCompletingLogin}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleCompleteLogin}
                      disabled={!selectedOrgId || isCompletingLogin}
                      className="flex-1"
                    >
                      {isCompletingLogin ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Continue
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>

          {/* Mobile Branding */}
          <div className="lg:hidden mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold gradient-text">
                Bluequee
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">Healthcare Management System</p>
          </div>
        </div>
      </div>
    </div>
  );
}
