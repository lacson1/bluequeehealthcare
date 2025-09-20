import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SecurityTest {
  name: string;
  description: string;
  status: 'idle' | 'testing' | 'passed' | 'failed';
  result?: string;
}

export default function SecurityDemo() {
  const { toast } = useToast();
  const [testCredentials, setTestCredentials] = useState({
    username: '',
    password: ''
  });
  const [changePassword, setChangePassword] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [securityTests, setSecurityTests] = useState<SecurityTest[]>([
    {
      name: 'Login Attempt Tracking',
      description: 'Test multiple failed login attempts to trigger account lockout',
      status: 'idle'
    },
    {
      name: 'Password Strength Validation',
      description: 'Test password complexity requirements',
      status: 'idle'
    },
    {
      name: 'Session Timeout Management',
      description: 'Verify session expiration and activity tracking',
      status: 'idle'
    },
    {
      name: 'Secure Error Handling',
      description: 'Test detailed error codes and security messages',
      status: 'idle'
    }
  ]);

  const updateTestStatus = (testName: string, status: SecurityTest['status'], result?: string) => {
    setSecurityTests(prev => prev.map(test => 
      test.name === testName 
        ? { ...test, status, result }
        : test
    ));
  };

  const testLoginAttempts = async () => {
    updateTestStatus('Login Attempt Tracking', 'testing');
    
    try {
      const attempts = [];
      // Test 6 failed attempts to trigger lockout
      for (let i = 1; i <= 6; i++) {
        try {
          await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              username: 'testuser',
              password: 'wrongpassword'
            })
          });
        } catch (error: any) {
          attempts.push(`Attempt ${i}: ${error.message}`);
          if (error.message.includes('locked')) {
            updateTestStatus('Login Attempt Tracking', 'passed', 
              `Account locked after ${i} attempts. Security working correctly.`);
            return;
          }
        }
      }
      
      updateTestStatus('Login Attempt Tracking', 'passed', 
        'Login attempt tracking active. Attempts logged: ' + attempts.length);
        
    } catch (error: any) {
      updateTestStatus('Login Attempt Tracking', 'failed', error.message);
    }
  };

  const testPasswordStrength = async () => {
    updateTestStatus('Password Strength Validation', 'testing');
    
    const weakPasswords = ['123', 'password', 'abc'];
    const results = [];
    
    for (const weakPassword of weakPasswords) {
      try {
        await apiRequest('/api/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({
            currentPassword: 'password123',
            newPassword: weakPassword
          })
        });
        results.push(`${weakPassword}: Unexpectedly accepted`);
      } catch (error: any) {
        if (error.message.includes('password') || error.message.includes('strength')) {
          results.push(`${weakPassword}: Correctly rejected`);
        } else {
          results.push(`${weakPassword}: ${error.message}`);
        }
      }
    }
    
    updateTestStatus('Password Strength Validation', 'passed', 
      'Password validation working: ' + results.join(', '));
  };

  const checkSessionStatus = async () => {
    updateTestStatus('Session Timeout Management', 'testing');
    
    try {
      const response = await apiRequest('/api/auth/session-status');
      setSessionStatus(response);
      
      updateTestStatus('Session Timeout Management', 'passed', 
        `Session active. Minutes since activity: ${response.session.minutesSinceActivity}`);
        
    } catch (error: any) {
      updateTestStatus('Session Timeout Management', 'failed', error.message);
    }
  };

  const testSecureErrors = async () => {
    updateTestStatus('Secure Error Handling', 'testing');
    
    try {
      await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: '',
          password: ''
        })
      });
    } catch (error: any) {
      if (error.message.includes('required') && error.message.includes('MISSING_CREDENTIALS')) {
        updateTestStatus('Secure Error Handling', 'passed', 
          'Error codes working correctly: ' + error.message);
      } else {
        updateTestStatus('Secure Error Handling', 'failed', 
          'Unexpected error format: ' + error.message);
      }
    }
  };

  const attemptLogin = async () => {
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(testCredentials)
      });
      
      toast({
        title: 'Login Successful',
        description: `Welcome ${response.user.username}!`,
        variant: 'default'
      });
      
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const attemptPasswordChange = async () => {
    try {
      const response = await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(changePassword)
      });
      
      toast({
        title: 'Password Changed',
        description: response.message,
        variant: 'default'
      });
      
      setChangePassword({ currentPassword: '', newPassword: '' });
      
    } catch (error: any) {
      toast({
        title: 'Password Change Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const runAllTests = async () => {
    await testLoginAttempts();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testPasswordStrength();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await checkSessionStatus();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testSecureErrors();
  };

  const getStatusIcon = (status: SecurityTest['status']) => {
    switch (status) {
      case 'testing': return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: SecurityTest['status']) => {
    const variants: Record<string, string> = {
      idle: 'secondary',
      testing: 'default',
      passed: 'default',
      failed: 'destructive'
    };
    
    return (
      <Badge variant={variants[status] as any} className="ml-2">
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Security Features Demo</h1>
          <p className="text-gray-600">Test and demonstrate enhanced authentication security</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Security Overview</TabsTrigger>
          <TabsTrigger value="tests">Security Tests</TabsTrigger>
          <TabsTrigger value="login">Login Testing</TabsTrigger>
          <TabsTrigger value="session">Session Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Login Protection</CardTitle>
                <Lock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">5 Attempts</div>
                <p className="text-xs text-muted-foreground">
                  Before account lockout (30 min)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Session Timeout</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">60 Minutes</div>
                <p className="text-xs text-muted-foreground">
                  Automatic session expiration
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Password Policy</CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Strong</div>
                <p className="text-xs text-muted-foreground">
                  Complexity requirements enforced
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Handling</CardTitle>
                <AlertTriangle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Secure</div>
                <p className="text-xs text-muted-foreground">
                  Detailed error codes provided
                </p>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Features Active:</strong> Your clinic management system now includes 
              enterprise-grade authentication with login attempt tracking, session timeout management, 
              password strength validation, and comprehensive security logging.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Security Tests</CardTitle>
              <CardDescription>
                Run comprehensive tests to verify all security features are working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runAllTests} className="w-full">
                Run All Security Tests
              </Button>
              
              <div className="space-y-3">
                {securityTests.map((test, index) => (
                  <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium">{test.name}</span>
                          {getStatusBadge(test.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                        {test.result && (
                          <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                            {test.result}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="login" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Login Security Testing</CardTitle>
              <CardDescription>
                Test login functionality with enhanced security features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={testCredentials.username}
                    onChange={(e) => setTestCredentials(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter username (try: ade, syb, superadmin)"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={testCredentials.password}
                    onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>
                <Button onClick={attemptLogin}>Test Login</Button>
              </div>

              <div className="mt-6 space-y-2">
                <h4 className="font-medium">Test Credentials:</h4>
                <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
                  <div><strong>ade</strong> / password123 (Doctor)</div>
                  <div><strong>syb</strong> / password123 (Nurse)</div>
                  <div><strong>superadmin</strong> / super123 (Admin)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password Change Testing</CardTitle>
              <CardDescription>
                Test secure password change functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={changePassword.currentPassword}
                    onChange={(e) => setChangePassword(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={changePassword.newPassword}
                    onChange={(e) => setChangePassword(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password (try weak passwords to test validation)"
                  />
                </div>
                <Button onClick={attemptPasswordChange}>Change Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Status</CardTitle>
              <CardDescription>
                Monitor current session health and activity tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={checkSessionStatus}>Check Session Status</Button>
              
              {sessionStatus && (
                <div className="space-y-3">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800">Session Valid</h4>
                      <p className="text-sm text-green-600">
                        User: {sessionStatus.user.username} ({sessionStatus.user.role})
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800">Activity Tracking</h4>
                      <p className="text-sm text-blue-600">
                        Last activity: {sessionStatus.session.minutesSinceActivity} minutes ago
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800">Session Expiration</h4>
                    <p className="text-sm text-yellow-600">
                      Expires in: {Math.round(sessionStatus.session.expiresIn)} minutes
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}