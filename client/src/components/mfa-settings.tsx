/**
 * MFA (Multi-Factor Authentication) Settings Component
 * Allows users to enable/disable MFA and manage backup codes
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  ShieldCheck, 
  ShieldOff, 
  Smartphone, 
  Key, 
  Copy, 
  Check, 
  AlertTriangle,
  RefreshCw,
  QrCode,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { QRCodeSVG } from 'qrcode.react';

interface MFAStatus {
  enabled: boolean;
  backupCodesRemaining: number;
  method: string;
}

interface MFASetupResponse {
  success: boolean;
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  message: string;
}

export function MFASettings() {
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [setupData, setSetupData] = useState<MFASetupResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [step, setStep] = useState<'qr' | 'verify' | 'backup'>('qr');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get MFA status
  const { data: mfaStatus, isLoading } = useQuery<MFAStatus>({
    queryKey: ['/api/mfa/status'],
    retry: false
  });

  // Setup MFA mutation
  const setupMutation = useMutation({
    mutationFn: () => apiRequest('/api/mfa/setup', 'POST'),
    onSuccess: async (response) => {
      const data = await response.json();
      setSetupData(data);
      setStep('qr');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to initiate MFA setup',
        variant: 'destructive'
      });
    }
  });

  // Verify setup mutation
  const verifySetupMutation = useMutation({
    mutationFn: (code: string) => apiRequest('/api/mfa/verify-setup', 'POST', { code }),
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.success) {
        setStep('backup');
        setBackupCodes(setupData?.backupCodes || []);
        queryClient.invalidateQueries({ queryKey: ['/api/mfa/status'] });
        toast({
          title: 'MFA Enabled',
          description: 'Two-factor authentication is now active on your account'
        });
      }
    },
    onError: () => {
      toast({
        title: 'Verification Failed',
        description: 'Invalid verification code. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Disable MFA mutation
  const disableMutation = useMutation({
    mutationFn: (code: string) => apiRequest('/api/mfa/disable', 'POST', { code }),
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.success) {
        setShowDisableDialog(false);
        setDisableCode('');
        queryClient.invalidateQueries({ queryKey: ['/api/mfa/status'] });
        toast({
          title: 'MFA Disabled',
          description: 'Two-factor authentication has been disabled'
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to disable MFA. Please check your code.',
        variant: 'destructive'
      });
    }
  });

  // Regenerate backup codes mutation
  const regenerateCodesMutation = useMutation({
    mutationFn: (code: string) => apiRequest('/api/mfa/regenerate-backup-codes', 'POST', { code }),
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.success) {
        setBackupCodes(data.backupCodes);
        queryClient.invalidateQueries({ queryKey: ['/api/mfa/status'] });
        toast({
          title: 'Backup Codes Regenerated',
          description: 'New backup codes have been generated'
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to regenerate backup codes',
        variant: 'destructive'
      });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const downloadBackupCodes = () => {
    const content = `ClinicConnect MFA Backup Codes
Generated: ${new Date().toLocaleString()}

Keep these codes in a safe place. Each code can only be used once.

${backupCodes.join('\n')}

IMPORTANT: If you lose access to your authenticator app, you can use one of these codes to log in.
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clinicconnect-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartSetup = () => {
    setShowSetupDialog(true);
    setupMutation.mutate();
  };

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      verifySetupMutation.mutate(verificationCode);
    }
  };

  const handleDisable = () => {
    if (disableCode.length >= 6) {
      disableMutation.mutate(disableCode);
    }
  };

  const handleCloseSetup = () => {
    setShowSetupDialog(false);
    setSetupData(null);
    setVerificationCode('');
    setStep('qr');
    setBackupCodes([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${mfaStatus?.enabled ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
              {mfaStatus?.enabled ? <ShieldCheck className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Two-Factor Authentication
                <Badge variant={mfaStatus?.enabled ? 'default' : 'secondary'}>
                  {mfaStatus?.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {mfaStatus?.enabled ? (
          <>
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>MFA is Active</AlertTitle>
              <AlertDescription>
                Your account is protected with two-factor authentication.
                You have {mfaStatus.backupCodesRemaining} backup codes remaining.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowBackupCodesDialog(true)}
                className="flex items-center gap-2"
              >
                <Key className="h-4 w-4" />
                View Backup Codes
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={() => setShowDisableDialog(true)}
                className="flex items-center gap-2"
              >
                <ShieldOff className="h-4 w-4" />
                Disable MFA
              </Button>
            </div>
          </>
        ) : (
          <>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>MFA Not Enabled</AlertTitle>
              <AlertDescription>
                Your account is not protected with two-factor authentication. 
                Enable MFA to secure your account against unauthorized access.
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                How it works
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code to add your account</li>
                <li>Enter the 6-digit code to verify setup</li>
                <li>Use the code from your app each time you log in</li>
              </ul>
            </div>

            <Button onClick={handleStartSetup} disabled={setupMutation.isPending}>
              {setupMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Enable Two-Factor Authentication
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={handleCloseSetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === 'qr' && 'Scan QR Code'}
              {step === 'verify' && 'Verify Setup'}
              {step === 'backup' && 'Save Backup Codes'}
            </DialogTitle>
            <DialogDescription>
              {step === 'qr' && 'Scan this QR code with your authenticator app'}
              {step === 'verify' && 'Enter the 6-digit code from your authenticator app'}
              {step === 'backup' && 'Save these codes in a secure location'}
            </DialogDescription>
          </DialogHeader>

          {step === 'qr' && setupData && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG 
                  value={setupData.qrCodeUrl} 
                  size={200}
                  level="M"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Can't scan? Enter this code manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm text-center font-mono">
                    {setupData.secret}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyToClipboard(setupData.secret)}
                  >
                    {copiedCode === setupData.secret ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button className="w-full" onClick={() => setStep('verify')}>
                Continue
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('qr')}>
                  Back
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleVerify}
                  disabled={verificationCode.length !== 6 || verifySetupMutation.isPending}
                >
                  {verifySetupMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Verify & Enable'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'backup' && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Save these codes now!</AlertTitle>
                <AlertDescription>
                  Each code can only be used once. Store them securely.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                {backupCodes.map((code, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-background rounded text-sm font-mono"
                  >
                    {code}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(code)}
                    >
                      {copiedCode === code ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadBackupCodes} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={handleCloseSetup} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your current MFA code to disable two-factor authentication.
              This will make your account less secure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Disabling MFA removes an important security layer from your account.
              </AlertDescription>
            </Alert>

            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Enter MFA code"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-xl tracking-[0.3em] font-mono"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDisable}
              disabled={disableCode.length < 6 || disableMutation.isPending}
            >
              {disableMutation.isPending ? 'Disabling...' : 'Disable MFA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup Codes</DialogTitle>
            <DialogDescription>
              Enter your current MFA code to view or regenerate backup codes.
            </DialogDescription>
          </DialogHeader>

          {backupCodes.length === 0 ? (
            <div className="space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter MFA code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-xl tracking-[0.3em] font-mono"
              />
              <Button 
                className="w-full"
                onClick={() => regenerateCodesMutation.mutate(verificationCode)}
                disabled={verificationCode.length !== 6 || regenerateCodesMutation.isPending}
              >
                {regenerateCodesMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Generate New Backup Codes
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  {backupCodes.length} backup codes available. Each can only be used once.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                {backupCodes.map((code, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-background rounded text-sm font-mono"
                  >
                    {code}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(code)}
                    >
                      {copiedCode === code ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <Button variant="outline" onClick={downloadBackupCodes} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Codes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default MFASettings;

