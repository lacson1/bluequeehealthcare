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
                  ClinicConnect
                </h1>
                <p className="text-cyan-200/90 font-medium tracking-wide">
                  Modern Healthcare Management
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
                Advanced Healthcare Platform
              </h2>
              <p className="text-cyan-100/80 leading-relaxed text-lg">
                Comprehensive healthcare management with intelligent analytics, real-time monitoring, and streamlined patient care workflows.
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
          
          {/* Futuristic Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl border border-cyan-400/20 hover:border-cyan-400/40 hover:bg-slate-800/60 transition-all duration-500">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-6 h-6 text-white drop-shadow-lg" />
              </div>
              <h3 className="font-bold text-cyan-200 mb-2">Neural Engine</h3>
              <p className="text-sm text-cyan-300/80">Quantum-enhanced diagnostic intelligence</p>
            </div>
            
            <div className="group bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl border border-blue-400/20 hover:border-blue-400/40 hover:bg-slate-800/60 transition-all duration-500">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-white drop-shadow-lg" />
              </div>
              <h3 className="font-bold text-blue-200 mb-2">Predictive Matrix</h3>
              <p className="text-sm text-blue-300/80">Advanced healthcare forecasting</p>
            </div>
            
            <div className="group bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl border border-purple-400/20 hover:border-purple-400/40 hover:bg-slate-800/60 transition-all duration-500">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-6 h-6 text-white drop-shadow-lg" />
              </div>
              <h3 className="font-bold text-purple-200 mb-2">Vital Stream</h3>
              <p className="text-sm text-purple-300/80">Real-time biometric monitoring</p>
            </div>
            
            <div className="group bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl border border-green-400/20 hover:border-green-400/40 hover:bg-slate-800/60 transition-all duration-500">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-white drop-shadow-lg" />
              </div>
              <h3 className="font-bold text-green-200 mb-2">Quantum Shield</h3>
              <p className="text-sm text-green-300/80">Military-grade data protection</p>
            </div>
          </div>
        </div>
        
        {/* Right Side - Futuristic Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="bg-slate-900/60 backdrop-blur-2xl border-0 shadow-2xl ring-1 ring-cyan-400/30">
            <CardHeader className="space-y-6 pb-8">
              <div className="text-center space-y-4">
                <div className="relative mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20">
                    <Stethoscope className="w-10 h-10 text-white drop-shadow-xl" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
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
                  <Users className="w-4 h-4 mr-2" />
                  Demo Accounts
                </p>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center bg-slate-700/40 p-3 rounded-lg backdrop-blur-sm">
                    <span className="text-cyan-300 font-medium">Administrator</span>
                    <span className="text-cyan-100 font-mono">admin / admin123</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-700/40 p-3 rounded-lg backdrop-blur-sm">
                    <span className="text-blue-300 font-medium">Doctor</span>
                    <span className="text-blue-100 font-mono">ade / doctor123</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-700/40 p-3 rounded-lg backdrop-blur-sm">
                    <span className="text-purple-300 font-medium">Nurse</span>
                    <span className="text-purple-100 font-mono">syb / nurse123</span>
                  </div>
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
                ClinicConnect
              </h1>
            </div>
            <p className="text-sm text-gray-600">Advanced Healthcare Management Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}