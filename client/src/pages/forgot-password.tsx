import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';

export default function ForgotPassword() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: usernameOrEmail.includes('@') ? undefined : usernameOrEmail,
          email: usernameOrEmail.includes('@') ? usernameOrEmail : undefined
        }),
      });

      const data = await response.json();
      const responseData = data.data || data;

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to send reset email');
      }

      setIsSuccess(true);
      toast({
        title: t('auth.forgotPasswordSuccess') || 'Email Sent',
        description: t('auth.forgotPasswordSuccessMessage') || 'If an account exists, a password reset link has been sent to your email.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      setError(errorMessage);
      toast({
        title: t('auth.forgotPasswordError') || 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{t('auth.checkEmail') || 'Check Your Email'}</CardTitle>
            <CardDescription>
              {t('auth.resetEmailSent') || 'We\'ve sent a password reset link to your email address.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                {t('auth.resetEmailInstructions') || 'Please check your email and click the link to reset your password. The link will expire in 1 hour.'}
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setLocation('/login')} variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('auth.backToLogin') || 'Back to Login'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            onClick={() => setLocation('/login')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('auth.backToLogin') || 'Back to Login'}
          </Button>
          <div className="space-y-2">
            <CardTitle className="text-2xl">{t('auth.forgotPassword') || 'Forgot Password'}</CardTitle>
            <CardDescription>
              {t('auth.forgotPasswordDescription') || 'Enter your username or email address and we\'ll send you a link to reset your password.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail">
                {t('auth.usernameOrEmail') || 'Username or Email'}
              </Label>
              <Input
                id="usernameOrEmail"
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder={t('auth.enterUsernameOrEmail') || 'Enter your username or email'}
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading || !usernameOrEmail.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.sending') || 'Sending...'}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {t('auth.sendResetLink') || 'Send Reset Link'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

