import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Heart, Shield, Activity, Stethoscope, Users, Eye, EyeOff, Zap, Star, CheckCircle, Brain, BarChart3 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(username, password);
    } catch (error) {
      setError('Invalid username or password');
    }
  };

  const handleDemoLogin = async (demoUsername: string, demoPassword: string) => {
    setError('');
    setUsername(demoUsername);
    setPassword(demoPassword);
    
    try {
      await login(demoUsername, demoPassword);
    } catch (error) {
      setError('Invalid demo credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/90 to-indigo-900/80 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Advanced Futuristic Background */}
      <div className="absolute inset-0">
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,_#3b82f6_0%,_transparent_50%)] animate-pulse"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_#06b6d4_0%,_transparent_50%)] animate-pulse [animation-delay:1s]"></div>
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_40%_40%,_#8b5cf6_0%,_transparent_50%)] animate-pulse [animation-delay:2s]"></div>
        </div>
        
        {/* Dynamic grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-[linear-gradient(rgba(59,130,246,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.5)_1px,transparent_1px)] bg-[size:60px_60px] animate-pulse"></div>
        </div>
        
        {/* Futuristic geometric elements */}
        <div className="absolute top-20 right-20 w-32 h-32 border border-cyan-400/30 rounded-lg animate-spin [animation-duration:20s]"></div>
        <div className="absolute top-40 left-20 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full animate-bounce [animation-duration:3s]"></div>
        <div className="absolute bottom-32 right-32 w-8 h-8 bg-gradient-to-r from-cyan-400/40 to-blue-400/40 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-20 w-24 h-1 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-pulse"></div>
        <div className="absolute top-1/2 right-10 w-1 h-20 bg-gradient-to-b from-cyan-400/30 to-transparent animate-pulse [animation-delay:1s]"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-cyan-300/60 rounded-full animate-pulse [animation-delay:2s]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-1 h-1 bg-blue-300/60 rounded-full animate-pulse [animation-delay:3s]"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side - Futuristic Branding */}
        <div className="hidden lg:block space-y-10">
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20">
                  <Stethoscope className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent drop-shadow-lg">
                  Bluequee
                </h1>
                <p className="text-cyan-200/90 font-medium tracking-wide">
                  Modern Healthcare Management
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
                Bluequee Healthcare
              </h2>
              <p className="text-cyan-100/80 leading-relaxed text-lg">
                Clinical Management - Comprehensive healthcare with intelligent analytics, real-time monitoring, and streamlined patient care workflows.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center bg-cyan-500/20 backdrop-blur-sm px-3 py-2 rounded-full border border-cyan-400/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-cyan-200">Smart Diagnostics</span>
                </span>
                <span className="flex items-center bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-full border border-blue-400/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse [animation-delay:0.5s]"></div>
                  <span className="text-blue-200">Data Analytics</span>
                </span>
                <span className="flex items-center bg-purple-500/20 backdrop-blur-sm px-3 py-2 rounded-full border border-purple-400/30">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse [animation-delay:1s]"></div>
                  <span className="text-purple-200">Patient Insights</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Feature Grid with Motion */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl border border-cyan-400/20 hover:border-cyan-400/40 hover:bg-slate-800/60 transition-all duration-500 hover:shadow-lg hover:shadow-cyan-500/10 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Brain className="w-6 h-6 text-white drop-shadow-lg animate-pulse" />
              </div>
              <h3 className="font-bold text-cyan-200 mb-2 group-hover:text-cyan-100 transition-colors">Smart Analytics</h3>
              <p className="text-sm text-cyan-300/80 group-hover:text-cyan-200/90 transition-colors">AI-powered diagnostic insights</p>
            </div>
            
            <div className="group bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl border border-blue-400/20 hover:border-blue-400/40 hover:bg-slate-800/60 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-white drop-shadow-lg group-hover:animate-bounce" />
              </div>
              <h3 className="font-bold text-blue-200 mb-2 group-hover:text-blue-100 transition-colors">Health Analytics</h3>
              <p className="text-sm text-blue-300/80 group-hover:text-blue-200/90 transition-colors">Advanced patient insights</p>
            </div>
            
            <div className="group bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl border border-purple-400/20 hover:border-purple-400/40 hover:bg-slate-800/60 transition-all duration-500 hover:shadow-lg hover:shadow-purple-500/10 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <Heart className="w-6 h-6 text-white drop-shadow-lg animate-pulse" />
              </div>
              <h3 className="font-bold text-purple-200 mb-2 group-hover:text-purple-100 transition-colors">Vital Monitoring</h3>
              <p className="text-sm text-purple-300/80 group-hover:text-purple-200/90 transition-colors">Real-time health tracking</p>
            </div>
            
            <div className="group bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl border border-green-400/20 hover:border-green-400/40 hover:bg-slate-800/60 transition-all duration-500 hover:shadow-lg hover:shadow-green-500/10 animate-fadeInUp" style={{animationDelay: '0.4s'}}>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-2 transition-transform duration-300">
                <Shield className="w-6 h-6 text-white drop-shadow-lg group-hover:animate-pulse" />
              </div>
              <h3 className="font-bold text-green-200 mb-2 group-hover:text-green-100 transition-colors">Secure Vault</h3>
              <p className="text-sm text-green-300/80 group-hover:text-green-200/90 transition-colors">HIPAA-compliant data protection</p>
            </div>
          </div>
        </div>
        
        {/* Right Side - Animated Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 animate-fadeInUp" style={{animationDelay: '0.5s'}}>
          <Card className="bg-slate-900/60 backdrop-blur-2xl border-0 shadow-2xl ring-1 ring-cyan-400/30 hover:ring-cyan-400/50 transition-all duration-500 group">
            <CardHeader className="space-y-6 pb-8">
              <div className="text-center space-y-4">
                <div className="relative mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20 group-hover:scale-105 transition-transform duration-500 group-hover:rotate-1">
                    <Stethoscope className="w-10 h-10 text-white drop-shadow-xl group-hover:animate-pulse" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse group-hover:animate-bounce"></div>
                  {/* Floating particles */}
                  <div className="absolute -top-4 -left-4 w-2 h-2 bg-cyan-400 rounded-full opacity-60 animate-ping" style={{animationDelay: '1s'}}></div>
                  <div className="absolute -bottom-2 -right-6 w-3 h-3 bg-blue-400 rounded-full opacity-40 animate-ping" style={{animationDelay: '2s'}}></div>
                </div>
                <div className="space-y-3">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                    Welcome Back
                  </CardTitle>
                  <CardDescription className="text-cyan-200/70 text-base">
                    Access your healthcare dashboard
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="username" className="text-sm font-medium text-cyan-200/90">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    disabled={isLoading}
                    className="h-14 bg-slate-800/50 border-cyan-400/30 focus:border-cyan-400 focus:ring-cyan-400/20 text-cyan-100 placeholder:text-cyan-300/50 backdrop-blur-sm"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-medium text-cyan-200/90">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                      className="h-14 bg-slate-800/50 border-cyan-400/30 focus:border-cyan-400 focus:ring-cyan-400/20 text-cyan-100 placeholder:text-cyan-300/50 backdrop-blur-sm pr-14"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-cyan-300/70 hover:text-cyan-200 transition-colors"
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
                  <Alert variant="destructive" className="border-red-400/30 bg-red-900/30 backdrop-blur-sm">
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-semibold shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500 backdrop-blur-sm border border-white/20" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <Stethoscope className="mr-3 h-5 w-5" />
                      <span>Access Dashboard</span>
                    </>
                  )}
                </Button>
              </form>
              
              {/* Demo Accounts */}
              <div className="p-5 bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-cyan-400/20">
                <p className="text-sm font-bold text-cyan-200 mb-4 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Demo Login
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => handleDemoLogin('superadmin', 'admin123')}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-red-600/80 to-orange-600/80 hover:from-red-500 hover:to-orange-500 text-white border border-red-400/30 h-12"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Login as Super Admin
                  </Button>
                  
                  <Button
                    onClick={() => handleDemoLogin('admin', 'admin123')}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-500 hover:to-cyan-500 text-white border border-blue-400/30 h-12"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Login as Admin
                  </Button>
                  
                  <Button
                    onClick={() => handleDemoLogin('Ade', 'doctor123')}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/30 h-12"
                  >
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Login as Doctor (Ade)
                  </Button>
                  
                  <Button
                    onClick={() => handleDemoLogin('syb', 'nurse123')}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-600/80 to-teal-600/80 hover:from-green-500 hover:to-teal-500 text-white border border-green-400/30 h-12"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Login as Nurse (Syb)
                  </Button>
                  
                  <Button
                    onClick={() => handleDemoLogin('receptionist1', 'receptionist123')}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500 hover:to-pink-500 text-white border border-purple-400/30 h-12"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Login as Receptionist
                  </Button>
                </div>
                
                <div className="mt-4 p-3 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-lg border border-indigo-400/20">
                  <p className="text-xs text-indigo-200 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-2" />
                    <span className="font-medium">Click any button above for instant demo access</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Mobile Branding */}
          <div className="lg:hidden mt-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Bluequee
              </h1>
            </div>
            <p className="text-sm text-gray-600">Advanced Healthcare Management Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}