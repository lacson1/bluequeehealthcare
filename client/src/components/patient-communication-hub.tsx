import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Bell,
  FileText,
  Calendar,
  Heart,
  Users,
  Smartphone
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Message {
  id: number;
  patientId: number;
  fromUser: boolean;
  content: string;
  messageType: 'text' | 'appointment' | 'reminder' | 'result' | 'emergency';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface Communication {
  id: number;
  patientId: number;
  type: 'sms' | 'email' | 'call' | 'in-app';
  subject?: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  scheduledFor?: string;
  sentAt?: string;
  response?: string;
}

interface PatientCommunicationHubProps {
  patientId: number;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
}

export default function PatientCommunicationHub({ 
  patientId, 
  patientName, 
  patientPhone, 
  patientEmail 
}: PatientCommunicationHubProps) {
  const [activeTab, setActiveTab] = useState('messages');
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'appointment' | 'reminder' | 'result'>('text');
  const [newCommunication, setNewCommunication] = useState({
    type: 'sms' as 'sms' | 'email' | 'call',
    subject: '',
    content: '',
    scheduledFor: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/patients", patientId, "messages"],
    enabled: !!patientId,
  });

  const { data: communications = [], isLoading: communicationsLoading } = useQuery<Communication[]>({
    queryKey: ["/api/patients", patientId, "communications"],
    enabled: !!patientId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/patients/${patientId}/messages`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId, "messages"] });
      setNewMessage('');
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const sendCommunicationMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/patients/${patientId}/communications`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId, "communications"] });
      setNewCommunication({
        type: 'sms',
        subject: '',
        content: '',
        scheduledFor: ''
      });
      toast({
        title: "Success",
        description: "Communication scheduled successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule communication",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    sendMessageMutation.mutate({
      content: newMessage,
      messageType,
      priority: messageType === 'result' ? 'high' : 'medium'
    });
  };

  const handleSendCommunication = () => {
    if (!newCommunication.content.trim()) return;

    sendCommunicationMutation.mutate(newCommunication);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'reminder': return <Bell className="w-4 h-4" />;
      case 'result': return <FileText className="w-4 h-4" />;
      case 'emergency': return <AlertCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const quickMessages = [
    "Your test results are ready for pickup",
    "Please remember your appointment tomorrow at {time}",
    "Your prescription is ready for collection",
    "Please take your medication as prescribed",
    "We need to reschedule your appointment",
    "Please arrive 15 minutes early for your appointment"
  ];

  const communicationTemplates = {
    appointment_reminder: {
      subject: "Appointment Reminder - {clinic_name}",
      content: "Dear {patient_name},\n\nThis is a reminder that you have an appointment with Dr. {doctor_name} on {date} at {time}.\n\nPlease arrive 15 minutes early and bring your insurance card and any current medications.\n\nIf you need to reschedule, please call us at {clinic_phone}.\n\nThank you,\n{clinic_name}"
    },
    test_results: {
      subject: "Test Results Available - {clinic_name}",
      content: "Dear {patient_name},\n\nYour recent test results are now available. Please contact our office to schedule a follow-up appointment to discuss your results.\n\nYou can reach us at {clinic_phone} during business hours.\n\nBest regards,\n{clinic_name}"
    },
    prescription_ready: {
      subject: "Prescription Ready for Pickup",
      content: "Dear {patient_name},\n\nYour prescription is ready for pickup at our pharmacy. Please bring a valid ID when collecting your medication.\n\nPharmacy hours: Monday-Friday 8AM-6PM, Saturday 9AM-2PM\n\nThank you,\n{clinic_name}"
    }
  };

  const recentMessages = messages.slice(0, 5);
  const unreadCount = messages.filter(m => !m.fromUser && m.status !== 'read').length;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Communication Hub - {patientName}
          {unreadCount > 0 && (
            <Badge className="bg-red-100 text-red-800">{unreadCount} unread</Badge>
          )}
        </CardTitle>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          {patientPhone && (
            <div className="flex items-center gap-1">
              <Smartphone className="w-4 h-4" />
              <span>{patientPhone}</span>
            </div>
          )}
          {patientEmail && (
            <div className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              <span>{patientEmail}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            {/* Message History */}
            <div className="max-h-80 overflow-y-auto space-y-2 bg-gray-50 p-4 rounded-lg">
              {messagesLoading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.fromUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.fromUser
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getMessageIcon(message.messageType)}
                          <span className="text-xs font-medium">
                            {message.messageType?.toUpperCase() || 'MESSAGE'}
                          </span>
                          <Badge className={getStatusColor(message.status)} variant="outline">
                            {message.status}
                          </Badge>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <div className="text-xs mt-1 opacity-75">
                          {new Date(message.sentAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Message Buttons */}
            <div className="space-y-2">
              <Label>Quick Messages:</Label>
              <div className="grid grid-cols-1 gap-2">
                {quickMessages.slice(0, 3).map((msg, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto py-2"
                    onClick={() => setNewMessage(msg)}
                  >
                    {msg}
                  </Button>
                ))}
              </div>
            </div>

            {/* Send Message */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="messageType">Type:</Label>
                <Select
                  value={messageType}
                  onValueChange={(value: any) => setMessageType(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="appointment">Appointment</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="result">Result</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  rows={3}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications" className="space-y-4">
            {/* Communication History */}
            <div className="space-y-2">
              <h3 className="font-medium">Recent Communications</h3>
              {communicationsLoading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : communications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Phone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No communications sent yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {communications.map((comm) => (
                    <div key={comm.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {comm.type === 'sms' && <Smartphone className="w-4 h-4" />}
                          {comm.type === 'email' && <Mail className="w-4 h-4" />}
                          {comm.type === 'call' && <Phone className="w-4 h-4" />}
                          <span className="font-medium">{comm.type.toUpperCase()}</span>
                        </div>
                        <Badge className={getStatusColor(comm.status)}>
                          {comm.status}
                        </Badge>
                      </div>
                      {comm.subject && (
                        <div className="text-sm font-medium mb-1">{comm.subject}</div>
                      )}
                      <div className="text-sm text-gray-600 mb-2">
                        {comm.content.substring(0, 100)}...
                      </div>
                      <div className="text-xs text-gray-500">
                        {comm.sentAt 
                          ? `Sent: ${new Date(comm.sentAt).toLocaleString()}`
                          : `Scheduled: ${comm.scheduledFor ? new Date(comm.scheduledFor).toLocaleString() : 'Now'}`
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Send Communication */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Send Communication</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commType">Type</Label>
                  <Select
                    value={newCommunication.type}
                    onValueChange={(value: any) => setNewCommunication(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="call">Call Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scheduledFor">Schedule For (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={newCommunication.scheduledFor}
                    onChange={(e) => setNewCommunication(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  />
                </div>
              </div>

              {newCommunication.type === 'email' && (
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    placeholder="Enter email subject"
                    value={newCommunication.subject}
                    onChange={(e) => setNewCommunication(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="content">Message</Label>
                <Textarea
                  placeholder="Enter your message..."
                  value={newCommunication.content}
                  onChange={(e) => setNewCommunication(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSendCommunication}
                disabled={!newCommunication.content.trim() || sendCommunicationMutation.isPending}
                className="w-full"
              >
                {sendCommunicationMutation.isPending 
                  ? "Sending..." 
                  : newCommunication.scheduledFor 
                    ? "Schedule Communication" 
                    : "Send Now"
                }
              </Button>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-medium">Communication Templates</h3>
              
              {Object.entries(communicationTemplates).map(([key, template]) => (
                <Card key={key} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.subject}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setNewCommunication(prev => ({
                          ...prev,
                          subject: template.subject,
                          content: template.content,
                          type: 'email'
                        }))}
                      >
                        Use Template
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {template.content.substring(0, 150)}...
                    </p>
                  </CardContent>
                </Card>
              ))}

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Template Variables</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><code>{'{patient_name}'}</code> - Patient's full name</p>
                  <p><code>{'{clinic_name}'}</code> - Your clinic name</p>
                  <p><code>{'{doctor_name}'}</code> - Doctor's name</p>
                  <p><code>{'{date}'}</code> - Appointment date</p>
                  <p><code>{'{time}'}</code> - Appointment time</p>
                  <p><code>{'{clinic_phone}'}</code> - Clinic phone number</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}