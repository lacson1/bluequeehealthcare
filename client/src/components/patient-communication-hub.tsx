import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Bell, Calendar, Settings, Send, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  id: number;
  patientId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  messageType: 'general' | 'appointment' | 'lab_result' | 'treatment_plan';
  isRead: boolean;
  priority: 'low' | 'normal' | 'high';
  createdAt: string;
}

interface AppointmentReminder {
  id: number;
  patientId: number;
  appointmentDate: string;
  doctorName: string;
  type: string;
  status: 'pending' | 'sent' | 'confirmed' | 'cancelled';
  reminderSent: boolean;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export function PatientCommunicationHub({ patientId }: { patientId?: number }) {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(patientId || null);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'general' | 'appointment' | 'lab_result' | 'treatment_plan'>('general');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [communicationPrefs, setCommunicationPrefs] = useState({
    email: 'enabled',
    sms: 'enabled',
    phone: 'disabled'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch patients for selection
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
    enabled: !patientId
  });

  // Fetch messages for selected patient
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages', selectedPatient],
    enabled: !!selectedPatient
  });

  // Fetch appointment reminders
  const { data: reminders = [] } = useQuery({
    queryKey: ['/api/appointment-reminders', selectedPatient],
    enabled: !!selectedPatient
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: any) => apiRequest('POST', '/api/messages', messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedPatient] });
      setNewMessage('');
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Send appointment reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: (reminderData: any) => apiRequest('POST', '/api/appointment-reminders', reminderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointment-reminders', selectedPatient] });
      toast({
        title: "Reminder Sent",
        description: "Appointment reminder has been sent to the patient.",
      });
    }
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: number) => apiRequest('PATCH', `/api/messages/${messageId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedPatient] });
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedPatient) return;

    const messageData = {
      patientId: selectedPatient,
      content: newMessage,
      messageType,
      priority,
      senderRole: 'staff'
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleSendReminder = (appointmentId: number) => {
    sendReminderMutation.mutate({ appointmentId, patientId: selectedPatient });
  };

  const handlePreferenceUpdate = (method: string, preference: string) => {
    const newPrefs = { ...communicationPrefs, [method]: preference };
    setCommunicationPrefs(newPrefs);
    
    toast({
      title: "Preferences Updated",
      description: `${method.toUpperCase()} notifications ${preference}`,
    });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'lab_result': return <Bell className="w-4 h-4" />;
      case 'treatment_plan': return <Settings className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card className="healthcare-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Patient Communication Hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="messages" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-4">
              {!patientId && (
                <div className="space-y-2">
                  <Label htmlFor="patient-select">Select Patient</Label>
                  <Select value={selectedPatient?.toString() || ''} onValueChange={(value) => setSelectedPatient(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(patients) && patients.map((patient: Patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedPatient && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Message History */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Message History</h3>
                    <ScrollArea className="h-96 border rounded-lg p-4">
                      {messagesLoading ? (
                        <div className="text-center py-8">Loading messages...</div>
                      ) : Array.isArray(messages) && messages.length > 0 ? (
                        <div className="space-y-3">
                          {messages.map((message: Message) => (
                            <div
                              key={message.id}
                              className={`p-3 rounded-lg border-l-4 ${
                                message.isRead ? 'bg-gray-50 border-l-gray-300' : 'bg-blue-50 border-l-blue-500'
                              }`}
                              onClick={() => !message.isRead && markAsReadMutation.mutate(message.id)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {getMessageIcon(message.messageType)}
                                  <span className="font-medium text-sm">{message.senderName}</span>
                                  <Badge variant="outline" className="text-xs">{message.senderRole}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-xs ${getPriorityColor(message.priority)}`}>
                                    {message.priority}
                                  </Badge>
                                  {!message.isRead && <Bell className="w-3 h-3 text-blue-500" />}
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{message.content}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">No messages found</div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Send New Message */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Send New Message</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="message-type">Message Type</Label>
                        <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="appointment">Appointment</SelectItem>
                            <SelectItem value="lab_result">Lab Result</SelectItem>
                            <SelectItem value="treatment_plan">Treatment Plan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message-content">Message Content</Label>
                      <p className="text-sm text-muted-foreground">
                        Messages are personalized based on patient appointment and visit data.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message-content">Message</Label>
                      <Textarea
                        id="message-content"
                        placeholder="Type your message here..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      className="w-full"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </div>
              )}

              {!selectedPatient && (
                <div className="text-center py-8 text-gray-500">Select a patient to view and send messages</div>
              )}
            </TabsContent>

            {/* Reminders Tab */}
            <TabsContent value="reminders" className="space-y-4">
              <h3 className="text-lg font-semibold">Appointment Reminders</h3>
              
              {selectedPatient ? (
                <div className="space-y-3">
                  {Array.isArray(reminders) && reminders.length > 0 ? (
                    reminders.map((reminder: AppointmentReminder) => (
                      <Card key={reminder.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">
                                {new Date(reminder.appointmentDate).toLocaleDateString()} - Dr. {reminder.doctorName}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{reminder.type}</p>
                            <Badge variant={reminder.status === 'sent' ? 'default' : 'outline'}>
                              {reminder.status}
                            </Badge>
                          </div>
                          <Button
                            onClick={() => handleSendReminder(reminder.id)}
                            disabled={reminder.reminderSent || sendReminderMutation.isPending}
                            size="sm"
                          >
                            {reminder.reminderSent ? 'Sent' : 'Send Reminder'}
                          </Button>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">No upcoming appointments</div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Select a patient to view reminders</div>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <h3 className="text-lg font-semibold">Message Templates</h3>
              
              <div className="text-center py-8 text-gray-500">
                <p>Message templates are now dynamically generated based on real patient appointments and visit data.</p>
                <p className="mt-2 text-sm">Use the Messages tab to send personalized communications to patients.</p>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <h3 className="text-lg font-semibold">Notification Settings</h3>
              
              <div className="space-y-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Communication Preferences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(communicationPrefs).map(([method, preference]) => (
                      <div key={method} className="space-y-2">
                        <Label className="text-sm font-medium capitalize">{method}</Label>
                        <Select 
                          value={preference} 
                          onValueChange={(value) => handlePreferenceUpdate(method, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">Enabled</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                            <SelectItem value="urgent-only">Urgent Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-3">Auto-Reminder Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Appointment reminders (24h before)</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Lab result notifications</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Prescription refill reminders</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}