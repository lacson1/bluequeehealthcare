import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Calendar, 
  Bell, 
  FileText, 
  Phone, 
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  User
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  template: string;
  type: 'appointment' | 'lab_result' | 'treatment_plan' | 'general';
}

export function PatientCommunicationHub({ patientId }: { patientId?: number }) {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(patientId || null);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<string>('general');
  const [priority, setPriority] = useState<string>('normal');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch patients for selection
  const { data: patients } = useQuery({
    queryKey: ['/api/patients'],
    enabled: !patientId // Only fetch if patientId is not provided
  });

  // Fetch messages for selected patient
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages', selectedPatient],
    enabled: !!selectedPatient
  });

  // Fetch appointment reminders
  const { data: reminders } = useQuery({
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
    mutationFn: (messageId: number) => apiRequest('PATCH', `/api/messages/${messageId}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedPatient] });
    }
  });

  const notificationTemplates: NotificationTemplate[] = [
    {
      id: 'appointment_confirmation',
      name: 'Appointment Confirmation',
      subject: 'Appointment Confirmed',
      template: 'Dear {{patientName}}, your appointment on {{date}} at {{time}} with Dr. {{doctorName}} has been confirmed. Please arrive 15 minutes early.',
      type: 'appointment'
    },
    {
      id: 'appointment_reminder',
      name: 'Appointment Reminder',
      subject: 'Appointment Reminder',
      template: 'This is a reminder that you have an appointment tomorrow at {{time}} with Dr. {{doctorName}}. Please call if you need to reschedule.',
      type: 'appointment'
    },
    {
      id: 'lab_results_ready',
      name: 'Lab Results Available',
      subject: 'Your Lab Results Are Ready',
      template: 'Dear {{patientName}}, your lab results are now available. Please log into the patient portal or contact our office to discuss the results.',
      type: 'lab_result'
    },
    {
      id: 'treatment_plan_update',
      name: 'Treatment Plan Update',
      subject: 'Treatment Plan Update',
      template: 'Your treatment plan has been updated. Please review the changes in your patient portal and contact us if you have any questions.',
      type: 'treatment_plan'
    },
    {
      id: 'prescription_ready',
      name: 'Prescription Ready',
      subject: 'Prescription Ready for Pickup',
      template: 'Your prescription is ready for pickup at our pharmacy. Office hours: Monday-Friday 9AM-5PM.',
      type: 'general'
    }
  ];

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedPatient) return;

    const messageData = {
      patientId: selectedPatient,
      content: newMessage,
      messageType,
      priority,
      senderRole: 'staff' // This would come from user context
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleSendReminder = (appointmentId: number) => {
    sendReminderMutation.mutate({ appointmentId, patientId: selectedPatient });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = notificationTemplates.find(t => t.id === templateId);
    if (template) {
      setNewMessage(template.template);
      setMessageType(template.type);
      setSelectedTemplate(templateId);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'lab_result': return <FileText className="w-4 h-4" />;
      case 'treatment_plan': return <FileText className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
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
                      {patients?.map((patient: any) => (
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
                      ) : messages && messages.length > 0 ? (
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
                        <div className="text-center py-8 text-gray-500">No messages yet</div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Send New Message */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Send New Message</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="message-type">Message Type</Label>
                        <Select value={messageType} onValueChange={setMessageType}>
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
                        <Select value={priority} onValueChange={setPriority}>
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
                      <Label htmlFor="template-select">Use Template (Optional)</Label>
                      <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {notificationTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message-content">Message</Label>
                      <Textarea
                        id="message-content"
                        placeholder="Type your message here..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={6}
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
            </TabsContent>

            {/* Appointment Reminders Tab */}
            <TabsContent value="reminders" className="space-y-4">
              <h3 className="text-lg font-semibold">Appointment Reminders</h3>
              
              {selectedPatient ? (
                <div className="space-y-3">
                  {reminders && reminders.length > 0 ? (
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {notificationTemplates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant="outline">{template.type}</Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Subject: {template.subject}</p>
                        <p className="text-sm text-gray-600">{template.template}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTemplateSelect(template.id)}
                        className="w-full"
                      >
                        Use Template
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <h3 className="text-lg font-semibold">Notification Settings</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-medium mb-3">SMS Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Appointment Reminders</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Lab Results</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Prescription Ready</span>
                      <Badge variant="outline">Disabled</Badge>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-3">Email Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Treatment Plans</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Appointment Confirmations</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly Summaries</span>
                      <Badge variant="outline">Disabled</Badge>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-4">
                <h4 className="font-medium mb-3">Communication Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <Phone className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm font-medium">Phone Calls</p>
                    <p className="text-xs text-gray-500">Emergency only</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg bg-blue-50">
                    <MessageSquare className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm font-medium">SMS Messages</p>
                    <p className="text-xs text-gray-500">Primary method</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <Mail className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-gray-500">Secondary method</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}