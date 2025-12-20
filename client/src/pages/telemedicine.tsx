import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Video,
  Phone,
  MessageSquare,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  VideoOff,
  Mic,
  MicOff,
  Share,
  FileText,
  Mail,
  Send,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import { formatDateTime } from '@/lib/date-utils';

interface TeleconsultationSession {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  appointmentId?: number;
  scheduledTime: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  type: 'video' | 'audio' | 'chat';
  sessionUrl?: string;
  notes?: string;
  duration?: number;
}

interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  type: string;
}

export default function TelemedicinePage() {
  const [selectedSession, setSelectedSession] = useState<TeleconsultationSession | null>(null);
  const [newSessionDialog, setNewSessionDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  // Form state for new session
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [sessionType, setSessionType] = useState('video');
  const [scheduledTime, setScheduledTime] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sync session notes when selected session changes
  useEffect(() => {
    if (selectedSession?.notes) {
      setSessionNotes(selectedSession.notes);
    } else {
      setSessionNotes('');
    }
  }, [selectedSession]);

  const { data: sessions = [], isLoading } = useQuery<TeleconsultationSession[]>({
    queryKey: ['/api/telemedicine/sessions'],
    enabled: true
  });

  const { data: stats } = useQuery<{
    totalSessions: number;
    avgDuration: number;
    completionRate: number;
  }>({
    queryKey: ['/api/telemedicine/stats'],
    enabled: true
  });

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ['/api/patients'],
    enabled: true
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    enabled: true
  });

  const createSessionMutation = useMutation({
    mutationFn: (sessionData: any) => apiRequest('/api/telemedicine/sessions', 'POST', sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telemedicine/sessions'] });
      setNewSessionDialog(false);
      setSelectedPatientId('');
      setSelectedAppointmentId('');
      setSessionType('video');
      setScheduledTime('');
      toast({
        title: t('telemedicine.sessionScheduled'),
        description: t('telemedicine.sessionScheduledSuccess'),
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to schedule session';
      const errorDetails = error?.response?.data?.details;
      
      toast({
        title: t('telemedicine.failedToSchedule'),
        description: errorDetails 
          ? `${errorMessage}: ${Array.isArray(errorDetails) ? errorDetails.map((d: any) => d.message || d.path).join(', ') : errorDetails}`
          : errorMessage,
        variant: "destructive"
      });
    }
  });

  // Handle appointment selection - auto-populate fields
  const handleAppointmentSelect = (appointmentId: string) => {
    // Handle "none" as empty selection - clear all fields
    if (appointmentId === 'none') {
      setSelectedAppointmentId('');
      setSelectedPatientId('');
      setScheduledTime('');
      return;
    }
    
    setSelectedAppointmentId(appointmentId);
    
    if (appointmentId) {
      const appointment = appointments.find((apt: Appointment) => apt.id === parseInt(appointmentId));
      if (appointment) {
        setSelectedPatientId(appointment.patientId.toString());
        
        // Combine appointment date and time into datetime-local format
        try {
          const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
          if (isNaN(appointmentDateTime.getTime())) {
            console.error('Invalid appointment date/time:', appointment.appointmentDate, appointment.appointmentTime);
            toast({
              title: "Invalid Appointment",
              description: "Appointment has invalid date/time. Please select a different appointment.",
              variant: "destructive"
            });
            return;
          }
          const formattedDateTime = appointmentDateTime.toISOString().slice(0, 16);
          setScheduledTime(formattedDateTime);
        } catch (error) {
          console.error('Error formatting appointment date:', error);
          toast({
            title: "Error",
            description: "Failed to process appointment date/time.",
            variant: "destructive"
          });
        }
      } else {
        console.warn('Appointment not found:', appointmentId, 'Available appointments:', appointments);
        toast({
          title: "Appointment Not Found",
          description: "Selected appointment could not be found. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleScheduleSession = () => {
    // If appointment is selected, we can use it directly
    if (selectedAppointmentId && selectedAppointmentId !== 'none' && selectedAppointmentId !== '') {
      const appointmentIdNum = parseInt(selectedAppointmentId);
      if (isNaN(appointmentIdNum)) {
        toast({
          title: "Invalid Appointment",
          description: "Please select a valid appointment.",
          variant: "destructive"
        });
        return;
      }
      
      const sessionData = {
        appointmentId: appointmentIdNum,
        type: sessionType,
        status: 'scheduled'
      };
      
      console.log('Scheduling session with appointment:', sessionData);
      createSessionMutation.mutate(sessionData);
      return;
    }

    // Otherwise, require patient and time
    if (!selectedPatientId) {
      toast({
        title: t('telemedicine.missingInformation'),
        description: t('telemedicine.pleaseSelectPatient'),
        variant: "destructive"
      });
      return;
    }

    if (!scheduledTime) {
      toast({
        title: t('telemedicine.missingInformation'),
        description: t('telemedicine.pleaseSelectTime'),
        variant: "destructive"
      });
      return;
    }

    // Ensure patientId is a valid number
    const patientIdNum = parseInt(selectedPatientId);
    if (isNaN(patientIdNum)) {
      toast({
        title: t('telemedicine.invalidPatient'),
        description: t('telemedicine.pleaseSelectValidPatient'),
        variant: "destructive"
      });
      return;
    }

    // datetime-local format is YYYY-MM-DDTHH:mm, convert to ISO string for backend
    // The backend expects either ISO string or Date object
    const sessionData = {
      patientId: patientIdNum,
      type: sessionType,
      scheduledTime: scheduledTime, // Backend will convert this to Date
      status: 'scheduled'
    };

    console.log('Scheduling session manually:', sessionData);
    createSessionMutation.mutate(sessionData);
  };

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/telemedicine/sessions/${id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telemedicine/sessions'] });
      toast({
        title: t('telemedicine.sessionUpdated'),
        description: t('telemedicine.sessionUpdatedSuccess'),
      });
    }
  });

  const saveNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) => 
      apiRequest(`/api/telemedicine/sessions/${id}`, 'PATCH', { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telemedicine/sessions'] });
      toast({
        title: t('telemedicine.notesSaved'),
        description: t('telemedicine.notesSavedSuccess'),
      });
    }
  });

  const sendNotificationMutation = useMutation({
    mutationFn: ({ id, type }: { id: number; type: 'email' | 'sms' | 'whatsapp' }) => 
      apiRequest(`/api/telemedicine/sessions/${id}/send-notification`, 'POST', { type }),
    onSuccess: (data: any) => {
      const typeLabels: Record<string, string> = {
        email: 'Email',
        sms: 'SMS',
        whatsapp: 'WhatsApp'
      };
      
      // Show different message if it was logged only (no Twilio config)
      if (data.messageId === 'logged-only') {
        toast({
          title: t('telemedicine.notificationSent'),
          description: `${typeLabels[data.type] || data.type} notification logged (Twilio not configured). Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to send actual messages.`,
          variant: "default"
        });
      } else {
        toast({
          title: t('telemedicine.notificationSent'),
          description: `${typeLabels[data.type] || data.type} ${t('telemedicine.notificationSentSuccess')}`,
        });
      }
    },
    onError: (error: any) => {
      const errorData = error?.response?.data;
      let errorMessage = errorData?.message || errorData?.error || 'Failed to send notification';
      
      // Add troubleshooting info if available
      if (errorData?.troubleshooting) {
        const troubleshooting = Object.values(errorData.troubleshooting).join(' ');
        errorMessage += ` ${troubleshooting}`;
      }
      
      // Show phone number if available for debugging
      if (errorData?.phoneNumber) {
        console.log('Phone number used:', errorData.phoneNumber);
      }
      
      toast({
        title: t('telemedicine.failedToSendNotification'),
        description: errorMessage,
        variant: "destructive",
        duration: 5000, // Show longer for error messages
      });
    }
  });

  const handleSaveNotes = () => {
    if (!selectedSession) return;
    
    if (!sessionNotes.trim()) {
      toast({
        title: t('telemedicine.noNotesToSave'),
        description: t('telemedicine.pleaseEnterNotes'),
        variant: "destructive"
      });
      return;
    }

    saveNotesMutation.mutate({ 
      id: selectedSession.id, 
      notes: sessionNotes 
    });
  };

  const handleShareSession = async () => {
    if (!selectedSession?.sessionUrl) {
      toast({
        title: t('telemedicine.shareFailed') || 'Share Failed',
        description: t('telemedicine.noSessionUrl') || 'Session URL not available',
        variant: "destructive"
      });
      return;
    }

    try {
      // Try native share API first (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: t('telemedicine.shareTitle') || 'Telemedicine Session',
          text: t('telemedicine.shareText') || `Join my telemedicine session with ${selectedSession.patientName}`,
          url: selectedSession.sessionUrl
        });
        toast({
          title: t('telemedicine.shared') || 'Shared',
          description: t('telemedicine.sessionLinkShared') || 'Session link shared successfully',
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(selectedSession.sessionUrl);
        toast({
          title: t('telemedicine.linkCopied') || 'Link Copied',
          description: t('telemedicine.sessionLinkCopied') || 'Session link copied to clipboard',
        });
      }
    } catch (error: any) {
      // User cancelled share or clipboard failed
      if (error.name !== 'AbortError') {
        // Try clipboard as fallback if share failed
        try {
          await navigator.clipboard.writeText(selectedSession.sessionUrl);
          toast({
            title: t('telemedicine.linkCopied') || 'Link Copied',
            description: t('telemedicine.sessionLinkCopied') || 'Session link copied to clipboard',
          });
        } catch (clipboardError) {
          toast({
            title: t('telemedicine.shareFailed') || 'Share Failed',
            description: t('telemedicine.unableToShare') || 'Unable to share session link',
            variant: "destructive"
          });
        }
      }
    }
  };



  const getStatusBadge = (status: string) => {
    const variants = {
      scheduled: 'default',
      active: 'destructive',
      completed: 'secondary',
      cancelled: 'outline'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const startSession = (session: TeleconsultationSession) => {
    setSelectedSession(session);
    // Generate Jitsi Meet URL (free, no API key needed)
    // For production, consider Daily.co, Zoom, or Twilio Video
    const jitsiUrl = `https://meet.jit.si/telemedicine-${session.id}-${Date.now()}`;
    updateSessionMutation.mutate({
      id: session.id,
      data: { status: 'active', sessionUrl: jitsiUrl }
    });
  };

  const endSession = (session: TeleconsultationSession) => {
    // Calculate actual duration from session start time
    const startTime = session.status === 'active' 
      ? new Date() // If currently active, use now as start (approximation)
      : new Date(session.createdAt || session.scheduledTime); // Otherwise use creation/scheduled time
    
    const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 60000); // Duration in minutes
    
    updateSessionMutation.mutate({
      id: session.id,
      data: { 
        status: 'completed', 
        notes: sessionNotes,
        duration: duration > 0 ? duration : undefined,
        completedAt: new Date().toISOString()
      }
    });
    setSelectedSession(null);
    setSessionNotes('');
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-full min-w-0 h-full px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{t('telemedicine.title')}</h1>
          </header>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600">{t('telemedicine.loadingSessions')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 h-full px-4 sm:px-6 md:px-8 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('telemedicine.title')}</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">{t('telemedicine.subtitle')}</p>
          </div>
        <Dialog 
          open={newSessionDialog} 
          onOpenChange={(open) => {
            setNewSessionDialog(open);
            if (!open) {
              // Reset form when dialog closes
              setSelectedPatientId('');
              setSelectedAppointmentId('');
              setSessionType('video');
              setScheduledTime('');
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              {t('telemedicine.scheduleSession')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('telemedicine.scheduleNewSession')}</DialogTitle>
              <DialogDescription>
                {t('telemedicine.createNewSession')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('telemedicine.appointmentOptional')}</label>
                <Select 
                  value={selectedAppointmentId || undefined} 
                  onValueChange={handleAppointmentSelect}
                >
                  <SelectTrigger data-testid="select-appointment">
                    <SelectValue placeholder={t('telemedicine.selectAppointment')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('telemedicine.noneScheduleManually')}</SelectItem>
                    {Array.isArray(appointments) && appointments.length > 0 ? (
                      appointments
                        .filter((apt: Appointment) => apt.status === 'scheduled' || apt.status === 'confirmed')
                        .map((appointment: Appointment) => (
                          <SelectItem key={appointment.id} value={appointment.id.toString()}>
                            {appointment.patientName} - {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value="no-appointments" disabled>
                        {t('telemedicine.noAppointments')}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {t('telemedicine.appointmentAutoFill')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">{t('telemedicine.patient')}</label>
                <Select 
                  value={selectedPatientId || undefined} 
                  onValueChange={setSelectedPatientId}
                  disabled={!!selectedAppointmentId}
                >
                  <SelectTrigger data-testid="select-patient">
                    <SelectValue placeholder={selectedAppointmentId ? t('telemedicine.autoFilledFromAppointment') : t('telemedicine.selectPatient')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(patients) && patients.length > 0 ? (
                      patients.map((patient: any) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-patients" disabled>
                        {t('ui.noData')}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedAppointmentId && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('telemedicine.patientAutoFilled')}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">{t('telemedicine.sessionType')}</label>
                <Select value={sessionType} onValueChange={setSessionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">{t('telemedicine.videoCall')}</SelectItem>
                    <SelectItem value="audio">{t('telemedicine.audioCall')}</SelectItem>
                    <SelectItem value="chat">{t('telemedicine.textChat')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{t('telemedicine.scheduledTime')}</label>
                <Input 
                  type="datetime-local" 
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  data-testid="input-scheduled-time"
                  disabled={!!selectedAppointmentId}
                />
                {selectedAppointmentId && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('telemedicine.timeAutoFilled')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setNewSessionDialog(false)} variant="outline">
                  {t('ui.cancel')}
                </Button>
                <Button 
                  onClick={handleScheduleSession}
                  disabled={createSessionMutation.isPending}
                  data-testid="button-schedule-session"
                  className="flex-1"
                >
                  {createSessionMutation.isPending ? t('ui.loading') : t('telemedicine.scheduleSession')}
                </Button>
              </div>
              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 p-2 bg-gray-50 rounded">
                  <p>Debug: Appointment={selectedAppointmentId || 'none'}, Patient={selectedPatientId || 'none'}, Time={scheduledTime || 'none'}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        </header>

        {/* Active Session */}
        {selectedSession && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-600" />
              {t('telemedicine.activeSession')} - {selectedSession.patientName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Interface */}
              <div className="space-y-4">
                {/* Session Link Display */}
                {selectedSession.sessionUrl && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        {t('telemedicine.sessionLink') || 'Session Link'}
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (selectedSession.sessionUrl) {
                            await navigator.clipboard.writeText(selectedSession.sessionUrl);
                            toast({
                              title: t('telemedicine.linkCopied') || 'Link Copied',
                              description: t('telemedicine.sessionLinkCopied') || 'Session link copied to clipboard',
                            });
                          }
                        }}
                        className="h-7 px-2"
                        aria-label="Copy session link"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        <span className="text-xs">{t('ui.copy') || 'Copy'}</span>
                      </Button>
                    </div>
                    <a
                      href={selectedSession.sessionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 break-all block font-mono bg-white p-2 rounded border border-blue-200 hover:underline"
                    >
                      {selectedSession.sessionUrl}
                    </a>
                  </div>
                )}
                
                {selectedSession.sessionUrl ? (
                  <div className="bg-gray-900 rounded-lg aspect-video overflow-hidden">
                    <iframe
                      src={selectedSession.sessionUrl}
                      allow="camera; microphone; fullscreen; speaker; display-capture"
                      className="w-full h-full border-0"
                      title="Video Call"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center text-white">
                    <div className="text-center p-4">
                      <Video className="h-12 w-12 mx-auto mb-2" />
                      <p>{t('telemedicine.videoCallInProgress')}</p>
                      <p className="text-sm text-gray-300 mt-2">{t('ui.loading')}...</p>
                    </div>
                  </div>
                )}
                
                {/* Controls */}
                <div className="flex justify-center gap-4">
                  <Button
                    variant={isVideoEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  >
                    {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={isAudioEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  >
                    {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleShareSession}
                    title={t('telemedicine.shareSession') || 'Share session link'}
                  >
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => endSession(selectedSession)}
                  >
                    {t('telemedicine.endCall')}
                  </Button>
                </div>
              </div>

              {/* Session Notes */}
              <div className="space-y-4">
                <h3 className="font-semibold">{t('telemedicine.sessionNotes')}</h3>
                <Textarea
                  placeholder={t('telemedicine.enterNotes')}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  rows={8}
                />
                <Button 
                  className="w-full"
                  onClick={handleSaveNotes}
                  disabled={saveNotesMutation.isPending}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {saveNotesMutation.isPending ? t('telemedicine.saving') : t('telemedicine.saveNotes')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

        {/* Sessions List */}
        <section aria-label={t('telemedicine.scheduledSessions')}>
          <Card>
            <CardHeader>
              <CardTitle>{t('telemedicine.scheduledSessions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(Array.isArray(sessions) ? sessions : []).map((session: any) => (
                  <div 
                    key={session.id} 
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    role="article"
                    aria-label={`Session with ${session.patientName} on ${formatDateTime(session.scheduledTime)}`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {session.type === 'video' ? <Video className="h-6 w-6 text-blue-600" /> :
                     session.type === 'audio' ? <Phone className="h-6 w-6 text-blue-600" /> :
                     <MessageSquare className="h-6 w-6 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">{session.patientName}</h4>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(session.scheduledTime)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {getStatusBadge(session.status)}
                      <Badge variant="outline">{session.type === 'video' ? t('telemedicine.videoCall') : session.type === 'audio' ? t('telemedicine.audioCall') : t('telemedicine.textChat')}</Badge>
                    </div>
                    {session.sessionUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <a
                          href={session.sessionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 truncate max-w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{session.sessionUrl}</span>
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 flex-shrink-0"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (session.sessionUrl) {
                              await navigator.clipboard.writeText(session.sessionUrl);
                              toast({
                                title: t('telemedicine.linkCopied') || 'Link Copied',
                                description: t('telemedicine.sessionLinkCopied') || 'Session link copied to clipboard',
                              });
                            }
                          }}
                          aria-label="Copy session link"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center justify-end">
                  {session.status === 'scheduled' && (
                    <>
                      <Button 
                        onClick={() => startSession(session)}
                        className="flex items-center gap-2"
                        size="sm"
                        aria-label={`Start session with ${session.patientName}`}
                      >
                        <Video className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('telemedicine.startSession')}</span>
                        <span className="sm:hidden">{t('telemedicine.start') || 'Start'}</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={sendNotificationMutation.isPending}
                            className="flex items-center gap-2"
                            aria-label="Send notification to patient"
                          >
                            <Send className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('telemedicine.notifyPatient')}</span>
                            <span className="sm:hidden">{t('telemedicine.notify') || 'Notify'}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => sendNotificationMutation.mutate({ id: session.id, type: 'whatsapp' })}
                            disabled={sendNotificationMutation.isPending}
                            aria-label="Send WhatsApp notification"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {t('telemedicine.sendWhatsApp')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => sendNotificationMutation.mutate({ id: session.id, type: 'email' })}
                            disabled={sendNotificationMutation.isPending}
                            aria-label="Send email notification"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            {t('telemedicine.sendEmail')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => sendNotificationMutation.mutate({ id: session.id, type: 'sms' })}
                            disabled={sendNotificationMutation.isPending}
                            aria-label="Send SMS notification"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            {t('telemedicine.sendSMS')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                  {session.status === 'active' && (
                    <Button 
                      variant="outline"
                      onClick={() => setSelectedSession(session)}
                      size="sm"
                      aria-label={`Join active session with ${session.patientName}`}
                    >
                      {t('telemedicine.joinSession')}
                    </Button>
                  )}
                  {session.status === 'completed' && (
                    <>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSession(session)}
                        aria-label={`View completed session with ${session.patientName}`}
                      >
                        {t('telemedicine.viewSession')}
                      </Button>
                      <div className="flex items-center gap-2 text-green-600" aria-label="Session completed">
                        <CheckCircle className="h-4 w-4" aria-hidden="true" />
                        <span className="text-sm">
                          {session.duration ? `${session.duration} min` : t('telemedicine.completed')}
                        </span>
                      </div>
                    </>
                  )}
                    </div>
                  </div>
                ))}
                {(!sessions || sessions.length === 0) && (
                  <div className="text-center py-12 text-gray-500">
                    <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>{t('telemedicine.noSessions') || 'No scheduled sessions'}</p>
                  </div>
                )}
              </div>
          </CardContent>
        </Card>
        </section>

        {/* Session Statistics */}
        <section aria-label="Session Statistics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('telemedicine.totalSessions')}</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.totalSessions || 0}</p>
              </div>
              <Video className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">{t('telemedicine.thisMonth')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('telemedicine.avgDuration')}</p>
                <p className="text-2xl font-bold text-green-600">{stats?.avgDuration || 0} min</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">{t('telemedicine.perSession')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('telemedicine.completionRate')}</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.completionRate || 0}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">{t('telemedicine.sessionsCompleted')}</p>
          </CardContent>
        </Card>
        </section>
      </div>
    </div>
  );
}