import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Mail, MailOpen, Reply, Clock, AlertCircle, User, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: number;
  subject: string;
  message: string;
  messageType: string;
  priority: string;
  status: string;
  sentAt: string;
  readAt?: string;
  repliedAt?: string;
  recipientType: string;
  recipientRole: string;
  routingReason: string;
  patientName: string;
  patientPhone: string;
  patientId: number;
}

export default function StaffMessages() {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("unread");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch staff messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/staff/messages'],
    staleTime: 30000,
    refetchInterval: 60000 // Auto-refresh every minute
  });

  // Mark message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await fetch(`/api/staff/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Failed to mark message as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff/messages'] });
    }
  });

  // Send reply to patient
  const replyMutation = useMutation({
    mutationFn: async ({ messageId, reply }: { messageId: number; reply: string }) => {
      const response = await fetch(`/api/staff/messages/${messageId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reply })
      });
      if (!response.ok) throw new Error('Failed to send reply');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff/messages'] });
      setReplyText("");
      setShowReplyDialog(false);
      toast({
        title: "Reply sent",
        description: "Your reply has been sent to the patient",
      });
    }
  });

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    if (message.status === 'sent') {
      markAsReadMutation.mutate(message.id);
    }
  };

  const handleReply = () => {
    if (selectedMessage && replyText.trim()) {
      replyMutation.mutate({
        messageId: selectedMessage.id,
        reply: replyText.trim()
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'medical': return <AlertCircle className="w-4 h-4" />;
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'lab_result': return <MessageSquare className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const filterMessages = (status: string) => {
    switch (status) {
      case 'unread':
        return messages.filter((msg: Message) => msg.status === 'sent');
      case 'read':
        return messages.filter((msg: Message) => msg.status === 'read');
      case 'replied':
        return messages.filter((msg: Message) => msg.status === 'replied');
      case 'all':
      default:
        return messages;
    }
  };

  const unreadCount = messages.filter((msg: Message) => msg.status === 'sent').length;
  const urgentCount = messages.filter((msg: Message) => msg.priority === 'urgent' && msg.status === 'sent').length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Patient Messages</h1>
            <p className="text-slate-600 mt-1">
              View and respond to patient communications
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {urgentCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {urgentCount} Urgent
              </Badge>
            )}
            <Badge variant="secondary">
              {unreadCount} Unread
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Message List */}
        <div className="w-1/2 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="unread">
                  Unread ({filterMessages('unread').length})
                </TabsTrigger>
                <TabsTrigger value="read">
                  Read ({filterMessages('read').length})
                </TabsTrigger>
                <TabsTrigger value="replied">
                  Replied ({filterMessages('replied').length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  All ({messages.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">Loading messages...</div>
              ) : filterMessages(activeTab).length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No messages in this category
                </div>
              ) : (
                filterMessages(activeTab).map((message: Message) => (
                  <Card
                    key={message.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedMessage?.id === message.id ? 'ring-2 ring-blue-500' : ''
                    } ${message.status === 'sent' ? 'bg-blue-50' : ''}`}
                    onClick={() => handleViewMessage(message)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {message.status === 'sent' ? (
                              <Mail className="w-4 h-4 text-blue-600" />
                            ) : (
                              <MailOpen className="w-4 h-4 text-slate-600" />
                            )}
                            <span className="font-medium text-slate-900">
                              {message.patientName}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={getPriorityColor(message.priority)}
                            >
                              {message.priority}
                            </Badge>
                          </div>
                          
                          <h3 className="font-medium text-slate-900 mb-1 line-clamp-1">
                            {message.subject}
                          </h3>
                          
                          <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                            {message.message}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center space-x-2">
                              {getMessageTypeIcon(message.messageType)}
                              <span className="capitalize">{message.messageType}</span>
                            </div>
                            <span>{format(new Date(message.sentAt), 'MMM d, h:mm a')}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Message Detail */}
        <div className="w-1/2 flex flex-col">
          {selectedMessage ? (
            <>
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center space-x-3 mt-2 text-sm text-slate-600">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{selectedMessage.patientName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{format(new Date(selectedMessage.sentAt), 'PPP p')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge 
                      variant="outline" 
                      className={getPriorityColor(selectedMessage.priority)}
                    >
                      {selectedMessage.priority} priority
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {selectedMessage.messageType}
                    </Badge>
                  </div>
                </div>

                {selectedMessage.routingReason && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Routing:</strong> {selectedMessage.routingReason}
                    </p>
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <p className="text-slate-800 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>

                {selectedMessage.repliedAt && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 font-medium mb-2">
                      Replied on {format(new Date(selectedMessage.repliedAt), 'PPP p')}
                    </p>
                  </div>
                )}
              </ScrollArea>

              <div className="p-6 border-t border-slate-200">
                <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full"
                      disabled={selectedMessage.status === 'replied'}
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      {selectedMessage.status === 'replied' ? 'Already Replied' : 'Reply to Patient'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Reply to {selectedMessage.patientName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm text-slate-600 mb-2">Original message:</p>
                        <p className="text-slate-800">{selectedMessage.subject}</p>
                      </div>
                      <div>
                        <Label htmlFor="reply">Your Reply</Label>
                        <Textarea
                          id="reply"
                          placeholder="Type your reply to the patient..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={6}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleReply}
                          disabled={!replyText.trim() || replyMutation.isPending}
                        >
                          {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>Select a message to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}