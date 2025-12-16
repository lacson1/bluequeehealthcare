/**
 * Emergency Access Dialog ("Break the Glass")
 * Allows healthcare providers to request emergency access to patient records
 * with full audit logging and compliance documentation
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  FileWarning, 
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface EmergencyAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number;
  patientName: string;
  onAccessGranted?: (accessToken: string) => void;
}

interface EmergencyReason {
  value: string;
  label: string;
  description: string;
}

export function EmergencyAccessDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  onAccessGranted
}: EmergencyAccessDialogProps) {
  const [step, setStep] = useState<'warning' | 'form' | 'success'>('warning');
  const [reason, setReason] = useState<string>('');
  const [justification, setJustification] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [accessInfo, setAccessInfo] = useState<{ expiresAt: string; id: string } | null>(null);
  
  const { toast } = useToast();

  // Fetch emergency access reasons
  const { data: reasons = [] } = useQuery<EmergencyReason[]>({
    queryKey: ['/api/emergency-access/reasons'],
    enabled: open
  });

  // Request emergency access mutation
  const requestAccessMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/emergency-access/request', 'POST', {
        patientId,
        reason,
        justification
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setAccessInfo({
          expiresAt: data.grant.expiresAt,
          id: data.grant.id
        });
        setStep('success');
        
        if (onAccessGranted) {
          onAccessGranted(data.grant.accessToken);
        }
        
        toast({
          title: 'Emergency Access Granted',
          description: 'You now have temporary access to this patient\'s records.'
        });
      } else {
        toast({
          title: 'Access Denied',
          description: data.error || 'Unable to grant emergency access',
          variant: 'destructive'
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to process emergency access request',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = () => {
    if (!reason || !justification || justification.length < 20) {
      toast({
        title: 'Incomplete Form',
        description: 'Please select a reason and provide detailed justification (minimum 20 characters)',
        variant: 'destructive'
      });
      return;
    }

    requestAccessMutation.mutate();
  };

  const handleClose = () => {
    setStep('warning');
    setReason('');
    setJustification('');
    setAcknowledged(false);
    setAccessInfo(null);
    onOpenChange(false);
  };

  const formatExpiryTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {step === 'warning' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
                <DialogTitle>Emergency Access Request</DialogTitle>
              </div>
              <DialogDescription>
                You are requesting emergency access to protected health information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-900">
                <FileWarning className="h-4 w-4" />
                <AlertTitle>Important Notice</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>This action will be <strong>permanently logged</strong></li>
                    <li>Your access will be <strong>reviewed by compliance</strong></li>
                    <li>Unauthorized access may result in <strong>disciplinary action</strong></li>
                    <li>You must provide a <strong>valid medical justification</strong></li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Patient: {patientName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Access will expire in 60 minutes</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox 
                  id="acknowledge" 
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                />
                <label 
                  htmlFor="acknowledge" 
                  className="text-sm leading-tight cursor-pointer"
                >
                  I understand this access will be audited and I have a legitimate 
                  medical need to access this patient's records outside normal authorization.
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => setStep('form')}
                disabled={!acknowledged}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Lock className="h-4 w-4 mr-2" />
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Emergency Access Justification
              </DialogTitle>
              <DialogDescription>
                Provide details about why emergency access is needed for {patientName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Reason for Emergency Access *</Label>
                <RadioGroup value={reason} onValueChange={setReason}>
                  {reasons.map((r) => (
                    <div key={r.value} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={r.value} id={r.value} className="mt-1" />
                      <div className="flex-1">
                        <label htmlFor={r.value} className="font-medium cursor-pointer block">
                          {r.label}
                        </label>
                        <span className="text-sm text-muted-foreground">
                          {r.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification" className="text-sm font-medium">
                  Detailed Justification *
                </Label>
                <Textarea
                  id="justification"
                  placeholder="Explain the specific clinical circumstances requiring emergency access. Include relevant patient symptoms, urgency level, and why normal access channels cannot be used..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {justification.length}/20 characters minimum • Be specific and detailed
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep('warning')}>
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!reason || justification.length < 20 || requestAccessMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {requestAccessMutation.isPending ? (
                  <>Processing...</>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Request Emergency Access
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                <DialogTitle>Emergency Access Granted</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Access Approved</AlertTitle>
                <AlertDescription>
                  You now have temporary access to {patientName}'s medical records.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Access ID</span>
                  <Badge variant="outline" className="font-mono">
                    {accessInfo?.id.slice(0, 8)}...
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expires At</span>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {accessInfo?.expiresAt && formatExpiryTime(accessInfo.expiresAt)}
                  </Badge>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>• This access will be reviewed by the compliance team</p>
                <p>• All actions are being logged for audit purposes</p>
                <p>• Access will automatically expire after 60 minutes</p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Continue to Patient Record
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EmergencyAccessDialog;

