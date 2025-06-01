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
  const [communicationPrefs, setCommunicationPrefs] = useState({
    phone: 'emergency',
    sms: 'primary', 
    email: 'secondary'
  });
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

  // Update communication preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (prefsData: any) => apiRequest('PATCH', `/api/patients/${selectedPatient}/communication-preferences`, prefsData),
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Communication preferences have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive"
      });
    }
  });

  const notificationTemplates: NotificationTemplate[] = [
    {
      id: 'appointment_confirmation',
      name: 'Appointment Confirmation',
      subject: 'Appointment Confirmed - {{date}}',
      template: 'Dear {{patientName}}, your appointment on {{date}} at {{time}} with Dr. {{doctorName}} has been confirmed. Please arrive 15 minutes early. Location: {{hospitalName}}. If you need to reschedule, please call us at least 24 hours in advance.',
      type: 'appointment'
    },
    {
      id: 'appointment_reminder',
      name: 'Appointment Reminder',
      subject: 'Appointment Reminder - Tomorrow',
      template: 'Hello {{patientName}}, this is a reminder that you have an appointment tomorrow at {{time}} with Dr. {{doctorName}} at {{hospitalName}}. Please bring your ID and insurance card. Call us if you need to reschedule.',
      type: 'appointment'
    },
    {
      id: 'urgent_appointment',
      name: 'Urgent Appointment Available',
      subject: 'Urgent Appointment Slot Available',
      template: 'Dear {{patientName}}, we have an urgent appointment slot available on {{date}} at {{time}} with Dr. {{doctorName}}. Please confirm if you can attend by replying to this message or calling us immediately.',
      type: 'appointment'
    },
    {
      id: 'lab_results_ready',
      name: 'Lab Results Available',
      subject: 'Your Lab Results Are Ready',
      template: 'Dear {{patientName}}, your lab results from {{testDate}} are now available. Please log into the patient portal or contact our office to schedule a follow-up consultation with Dr. {{doctorName}} to discuss the results.',
      type: 'lab_result'
    },
    {
      id: 'lab_results_urgent',
      name: 'Urgent Lab Results - Action Required',
      subject: 'URGENT: Lab Results Require Immediate Attention',
      template: 'Dear {{patientName}}, your recent lab results require immediate medical attention. Please contact our office immediately or visit the emergency department. Dr. {{doctorName}} needs to see you as soon as possible.',
      type: 'lab_result'
    },
    {
      id: 'treatment_plan_update',
      name: 'Treatment Plan Update',
      subject: 'Treatment Plan Update',
      template: 'Hello {{patientName}}, Dr. {{doctorName}} has updated your treatment plan based on your recent progress. Please review the changes in your patient portal and follow the new instructions. Contact us if you have any questions.',
      type: 'treatment_plan'
    },
    {
      id: 'medication_reminder',
      name: 'Medication Adherence Reminder',
      subject: 'Medication Reminder',
      template: 'Dear {{patientName}}, this is a reminder to take your prescribed medications as directed by Dr. {{doctorName}}. Consistent medication adherence is important for your treatment success. Contact us if you experience any side effects.',
      type: 'treatment_plan'
    },
    {
      id: 'prescription_ready',
      name: 'Prescription Ready',
      subject: 'Prescription Ready for Pickup',
      template: 'Your prescription from Dr. {{doctorName}} is ready for pickup at {{pharmacyName}}. Please bring valid ID. Pharmacy hours: Monday-Friday 8AM-6PM, Saturday 9AM-2PM. Questions? Call the pharmacy directly.',
      type: 'general'
    },
    {
      id: 'test_prep_instructions',
      name: 'Medical Test Preparation',
      subject: 'Preparation Instructions for Your Upcoming Test',
      template: 'Dear {{patientName}}, you have a {{testType}} scheduled for {{date}} at {{time}}. Please follow these preparation instructions: {{instructions}}. Contact us if you have questions about the preparation.',
      type: 'general'
    },
    {
      id: 'follow_up_required',
      name: 'Follow-up Appointment Required',
      subject: 'Follow-up Appointment Needed',
      template: 'Hello {{patientName}}, Dr. {{doctorName}} recommends scheduling a follow-up appointment to monitor your progress. Please contact our office to schedule your next visit within {{timeframe}}.',
      type: 'appointment'
    },
    {
      id: 'discharge_instructions',
      name: 'Discharge Instructions',
      subject: 'Important Discharge Instructions',
      template: 'Dear {{patientName}}, thank you for choosing {{hospitalName}}. Please follow your discharge instructions carefully: {{instructions}}. Contact us immediately if you experience any concerning symptoms. Your follow-up appointment is scheduled for {{followUpDate}}.',
      type: 'treatment_plan'
    },
    {
      id: 'payment_reminder',
      name: 'Payment Reminder',
      subject: 'Payment Reminder - Account Balance',
      template: 'Dear {{patientName}}, this is a friendly reminder that you have an outstanding balance of {{amount}} for services received on {{serviceDate}}. Please contact our billing department to arrange payment or discuss payment options.',
      type: 'general'
    },
    {
      id: 'wellness_checkup',
      name: 'Annual Wellness Checkup',
      subject: 'Time for Your Annual Wellness Checkup',
      template: 'Hello {{patientName}}, it\'s time for your annual wellness checkup with Dr. {{doctorName}}. Regular checkups help maintain your health and catch potential issues early. Please call to schedule your appointment.',
      type: 'general'
    },
    {
      id: 'vaccination_reminder',
      name: 'Vaccination Reminder',
      subject: 'Vaccination Due - {{vaccineName}}',
      template: 'Dear {{patientName}}, according to our records, you are due for your {{vaccineName}} vaccination. Please schedule an appointment to receive your vaccination and stay protected.',
      type: 'general'
    },
    {
      id: 'referral_notification',
      name: 'Specialist Referral',
      subject: 'Referral to Specialist - {{specialistType}}',
      template: 'Dear {{patientName}}, Dr. {{doctorName}} has referred you to see a {{specialistType}} for further evaluation. The referral details have been sent to {{specialistName}}. Please contact their office to schedule an appointment.',
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

  const replaceTemplatePlaceholders = (template: string, patientData: any) => {
    if (!patientData) return template;
    
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return template
      .replace(/\{\{patientName\}\}/g, `${patientData.firstName || patientData.first_name} ${patientData.lastName || patientData.last_name}`)
      .replace(/\{\{firstName\}\}/g, patientData.firstName || patientData.first_name || 'Patient')
      .replace(/\{\{lastName\}\}/g, patientData.lastName || patientData.last_name || '')
      .replace(/\{\{date\}\}/g, currentDate)
      .replace(/\{\{time\}\}/g, currentTime)
      .replace(/\{\{testDate\}\}/g, currentDate)
      .replace(/\{\{serviceDate\}\}/g, currentDate)
      .replace(/\{\{followUpDate\}\}/g, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString())
      .replace(/\{\{doctorName\}\}/g, 'Dr. Smith') // This would come from current user context
      .replace(/\{\{hospitalName\}\}/g, 'Lagos Island Hospital')
      .replace(/\{\{pharmacyName\}\}/g, 'Hospital Pharmacy')
      .replace(/\{\{testType\}\}/g, 'Blood Test')
      .replace(/\{\{instructions\}\}/g, 'Follow the provided guidelines carefully')
      .replace(/\{\{timeframe\}\}/g, '2 weeks')
      .replace(/\{\{amount\}\}/g, '₦15,000')
      .replace(/\{\{vaccineName\}\}/g, 'COVID-19 Booster')
      .replace(/\{\{specialistType\}\}/g, 'Cardiologist')
      .replace(/\{\{specialistName\}\}/g, 'Dr. Johnson');
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = notificationTemplates.find(t => t.id === templateId);
    const selectedPatientData = patients?.find((p: any) => p.id === selectedPatient);
    
    if (template) {
      const populatedTemplate = replaceTemplatePlaceholders(template.template, selectedPatientData);
      setNewMessage(populatedTemplate);
      setMessageType(template.type);
      setSelectedTemplate(templateId);
    }
  };

  const handlePreferenceUpdate = (method: string, preference: string) => {
    const newPrefs = { ...communicationPrefs, [method]: preference };
    setCommunicationPrefs(newPrefs);
    
    if (selectedPatient) {
      updatePreferencesMutation.mutate(newPrefs);
    }
  };

  const getPreferenceLabel = (pref: string) => {
    switch (pref) {
      case 'primary': return 'Primary method';
      case 'secondary': return 'Secondary method';
      case 'emergency': return 'Emergency only';
      case 'disabled': return 'Disabled';
      default: return 'Not set';
    }
  };

  const getPreferenceColor = (pref: string) => {
    switch (pref) {
      case 'primary': return 'bg-blue-50 border-blue-200';
      case 'secondary': return 'bg-green-50 border-green-200';
      case 'emergency': return 'bg-yellow-50 border-yellow-200';
      case 'disabled': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
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
                <div className="space-y-4">
                  {/* Phone Preferences */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Phone Calls</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['primary', 'secondary', 'emergency', 'disabled'].map((pref) => (
                        <button
                          key={pref}
                          onClick={() => handlePreferenceUpdate('phone', pref)}
                          className={`p-2 text-xs rounded border transition-colors ${
                            communicationPrefs.phone === pref 
                              ? getPreferenceColor(pref) + ' border-2' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {getPreferenceLabel(pref)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SMS Preferences */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">SMS Messages</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['primary', 'secondary', 'emergency', 'disabled'].map((pref) => (
                        <button
                          key={pref}
                          onClick={() => handlePreferenceUpdate('sms', pref)}
                          className={`p-2 text-xs rounded border transition-colors ${
                            communicationPrefs.sms === pref 
                              ? getPreferenceColor(pref) + ' border-2' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {getPreferenceLabel(pref)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Email Preferences */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['primary', 'secondary', 'emergency', 'disabled'].map((pref) => (
                        <button
                          key={pref}
                          onClick={() => handlePreferenceUpdate('email', pref)}
                          className={`p-2 text-xs rounded border transition-colors ${
                            communicationPrefs.email === pref 
                              ? getPreferenceColor(pref) + ' border-2' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {getPreferenceLabel(pref)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedPatient && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <CheckCircle className="w-4 h-4" />
                        Preferences are automatically saved when changed
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}