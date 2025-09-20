import React, { useState } from 'react';
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
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TeleconsultationSession {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  scheduledTime: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  type: 'video' | 'audio' | 'chat';
  sessionUrl?: string;
  notes?: string;
  duration?: number;
}

export default function TelemedicinePage() {
  const [selectedSession, setSelectedSession] = useState<TeleconsultationSession | null>(null);
  const [newSessionDialog, setNewSessionDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  // Form state for new session
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [sessionType, setSessionType] = useState('video');
  const [scheduledTime, setScheduledTime] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['/api/telemedicine/sessions'],
    enabled: true
  });

  const { data: patients } = useQuery({
    queryKey: ['/api/patients'],
    enabled: true
  });

  const createSessionMutation = useMutation({
    mutationFn: (sessionData: any) => apiRequest('POST', '/api/telemedicine/sessions', sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telemedicine/sessions'] });
      setNewSessionDialog(false);
      setSelectedPatientId('');
      setSessionType('video');
      setScheduledTime('');
      toast({
        title: "Session Scheduled",
        description: "Telemedicine session has been scheduled successfully.",
      });
    }
  });

  const handleScheduleSession = () => {
    if (!selectedPatientId || !scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please select a patient and scheduled time.",
        variant: "destructive"
      });
      return;
    }

    const sessionData = {
      patientId: parseInt(selectedPatientId),
      type: sessionType,
      scheduledTime: scheduledTime,
      status: 'scheduled'
    };

    createSessionMutation.mutate(sessionData);
  };

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PATCH', `/api/telemedicine/sessions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telemedicine/sessions'] });
      toast({
        title: "Session Updated",
        description: "Session has been updated successfully.",
      });
    }
  });

  const saveNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) => 
      apiRequest('PATCH', `/api/telemedicine/sessions/${id}`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telemedicine/sessions'] });
      toast({
        title: "Notes Saved",
        description: "Session notes have been saved successfully.",
      });
    }
  });

  const handleSaveNotes = () => {
    if (!selectedSession) return;
    
    if (!sessionNotes.trim()) {
      toast({
        title: "No Notes to Save",
        description: "Please enter some notes before saving.",
        variant: "destructive"
      });
      return;
    }

    saveNotesMutation.mutate({ 
      id: selectedSession.id, 
      notes: sessionNotes 
    });
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
    updateSessionMutation.mutate({
      id: session.id,
      data: { status: 'active', sessionUrl: `https://meet.clinic.com/room-${session.id}` }
    });
  };

  const endSession = (session: TeleconsultationSession) => {
    updateSessionMutation.mutate({
      id: session.id,
      data: { 
        status: 'completed', 
        notes: sessionNotes,
        duration: Math.floor(Math.random() * 45) + 15 // Mock duration
      }
    });
    setSelectedSession(null);
    setSessionNotes('');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Telemedicine</h1>
        <div className="text-center py-8">Loading telemedicine sessions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Telemedicine Platform</h1>
          <p className="text-gray-600">Conduct remote consultations with patients</p>
        </div>
        <Dialog open={newSessionDialog} onOpenChange={setNewSessionDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Schedule Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Telemedicine Session</DialogTitle>
              <DialogDescription>
                Create a new remote consultation session with a patient
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Patient</label>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients && patients.map((patient: any) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Session Type</label>
                <Select value={sessionType} onValueChange={setSessionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="audio">Audio Call</SelectItem>
                    <SelectItem value="chat">Text Chat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Scheduled Time</label>
                <Input 
                  type="datetime-local" 
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setNewSessionDialog(false)} variant="outline">
                  Cancel
                </Button>
                <Button 
                  onClick={handleScheduleSession}
                  disabled={createSessionMutation.isPending}
                >
                  {createSessionMutation.isPending ? 'Scheduling...' : 'Schedule Session'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Session */}
      {selectedSession && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-600" />
              Active Session - {selectedSession.patientName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Interface */}
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center text-white">
                  <div className="text-center">
                    <Video className="h-12 w-12 mx-auto mb-2" />
                    <p>Video Call in Progress</p>
                    <p className="text-sm text-gray-300">Session URL: {selectedSession.sessionUrl}</p>
                  </div>
                </div>
                
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
                  <Button variant="outline" size="sm">
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => endSession(selectedSession)}
                  >
                    End Call
                  </Button>
                </div>
              </div>

              {/* Session Notes */}
              <div className="space-y-4">
                <h3 className="font-semibold">Session Notes</h3>
                <Textarea
                  placeholder="Enter consultation notes..."
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
                  {saveNotesMutation.isPending ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions && sessions.map((session: any) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    {session.type === 'video' ? <Video className="h-6 w-6 text-blue-600" /> :
                     session.type === 'audio' ? <Phone className="h-6 w-6 text-blue-600" /> :
                     <MessageSquare className="h-6 w-6 text-blue-600" />}
                  </div>
                  <div>
                    <h4 className="font-semibold">{session.patientName}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(session.scheduledTime).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(session.status)}
                      <Badge variant="outline">{session.type}</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {session.status === 'scheduled' && (
                    <Button 
                      onClick={() => startSession(session)}
                      className="flex items-center gap-2"
                    >
                      <Video className="h-4 w-4" />
                      Start Session
                    </Button>
                  )}
                  {session.status === 'active' && (
                    <Button 
                      variant="outline"
                      onClick={() => setSelectedSession(session)}
                    >
                      Join Session
                    </Button>
                  )}
                  {session.status === 'completed' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">
                        {session.duration ? `${session.duration} min` : 'Completed'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-blue-600">24</p>
              </div>
              <Video className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-green-600">28 min</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Per session</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-600">--</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Sessions completed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}