import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  MessageCircle, 
  Send, 
  AlertTriangle, 
  Shield, 
  Users, 
  Clock,
  Reply,
  Eye,
  EyeOff,
  Stethoscope,
  Heart,
  FileText,
  Bell,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Mail,
  Flag
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Comment, InsertComment } from "@shared/schema";

interface PatientChatProps {
  patientId: number;
  patientName: string;
}

interface CommentWithUser extends Comment {
  user: {
    username: string;
    role: string;
  };
  replies?: CommentWithUser[];
}

export default function PatientChat({ patientId, patientName }: PatientChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const [commentType, setCommentType] = useState<string>("general");
  const [priority, setPriority] = useState<string>("normal");
  const [isPrivate, setIsPrivate] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<CommentWithUser[]>({
    queryKey: ['/api/comments', patientId],
    enabled: !!patientId
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data: InsertComment) => {
      return await apiRequest('POST', '/api/comments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments', patientId] });
      setNewMessage("");
      setReplyingTo(null);
      setPriority("normal");
      toast({
        title: "💬 Message Sent",
        description: "Your message has been added to the patient discussion",
      });
    },
    onError: () => {
      toast({
        title: "❌ Message Failed",
        description: "Unable to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const commentData: InsertComment = {
      patientId,
      userId: user.id,
      message: newMessage.trim(),
      commentType,
      priority,
      isPrivate,
      replyToId: replyingTo,
      isRead: false
    };

    addCommentMutation.mutate(commentData);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor': return 'bg-blue-100 text-blue-800';
      case 'nurse': return 'bg-green-100 text-green-800';
      case 'pharmacist': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-gray-100 text-gray-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor': return <Stethoscope className="h-3 w-3" />;
      case 'nurse': return <Heart className="h-3 w-3" />;
      case 'pharmacist': return '💊';
      case 'admin': return <Shield className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getCommentTypeIcon = (type: string) => {
    switch (type) {
      case 'medical_note': return <FileText className="h-3 w-3" />;
      case 'care_instruction': return <Bell className="h-3 w-3" />;
      case 'family_update': return <Users className="h-3 w-3" />;
      default: return <MessageCircle className="h-3 w-3" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Group comments by threads (main comments and their replies)
  const threadedComments = comments.filter(comment => !comment.replyToId);

  return (
    <Card className="h-full flex flex-col">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <CardTitle className="flex items-center justify-between text-lg cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span>Team Discussion</span>
                <Badge variant="outline" className="text-xs">
                  {patientName}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Users className="h-4 w-4" />
                <span>{comments.length} messages</span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardTitle>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="flex-1 flex flex-col space-y-4 min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-3 max-h-96 pr-2">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 rounded w-1/4 mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : threadedComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">Start the Conversation</h3>
              <p className="text-slate-500">Begin collaborating with your team about this patient</p>
            </div>
          ) : (
            threadedComments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                {/* Main Comment */}
                <div className={`border rounded-lg p-3 ${getPriorityColor(comment.priority)}`}>
                  <div className="flex items-start space-x-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all">
                          <AvatarFallback className="text-xs">
                            {comment.user.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <div className="px-2 py-1.5 text-sm font-medium text-slate-900">
                          {comment.user.username}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex items-center">
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center">
                          <Reply className="mr-2 h-4 w-4" />
                          Reply to Comment
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center">
                          <Mail className="mr-2 h-4 w-4" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex items-center">
                          <UserCheck className="mr-2 h-4 w-4" />
                          View Activity
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center">
                          <Flag className="mr-2 h-4 w-4" />
                          Report Comment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{comment.user.username}</span>
                        <Badge className={`text-xs ${getRoleColor(comment.user.role)}`}>
                          {getRoleIcon(comment.user.role)}
                          <span className="ml-1">{comment.user.role}</span>
                        </Badge>
                        <div className="flex items-center space-x-1 text-xs text-slate-500">
                          {getCommentTypeIcon(comment.commentType)}
                          <span>{comment.commentType.replace('_', ' ')}</span>
                        </div>
                        {comment.isPrivate && (
                          <Badge variant="outline" className="text-xs">
                            <EyeOff className="h-2 w-2 mr-1" />
                            Private
                          </Badge>
                        )}
                        {comment.priority !== 'normal' && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-2 w-2 mr-1" />
                            {comment.priority}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-700 mb-2">{comment.message}</p>
                      
                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(comment.createdAt)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setReplyingTo(comment.id)}
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {comments
                  .filter(reply => reply.replyToId === comment.id)
                  .map((reply) => (
                    <div key={reply.id} className="ml-8 border-l-2 border-slate-200 pl-4">
                      <div className="border rounded-lg p-3 bg-slate-50">
                        <div className="flex items-start space-x-3">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {reply.user.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">{reply.user.username}</span>
                              <Badge className={`text-xs ${getRoleColor(reply.user.role)}`}>
                                {getRoleIcon(reply.user.role)}
                                <span className="ml-1">{reply.user.role}</span>
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-slate-700 mb-1">{reply.message}</p>
                            
                            <div className="flex items-center text-xs text-slate-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(reply.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Indicator */}
        {replyingTo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">
                Replying to {comments.find(c => c.id === replyingTo)?.user.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Message Options */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Select value={commentType} onValueChange={setCommentType}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">💬 General</SelectItem>
              <SelectItem value="medical_note">📋 Medical Note</SelectItem>
              <SelectItem value="care_instruction">🔔 Care Instruction</SelectItem>
              <SelectItem value="family_update">👨‍👩‍👧‍👦 Family Update</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">📝 Normal</SelectItem>
              <SelectItem value="urgent">⚠️ Urgent</SelectItem>
              <SelectItem value="critical">🚨 Critical</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={isPrivate ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPrivate(!isPrivate)}
            className="h-8 text-xs"
          >
            {isPrivate ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
            {isPrivate ? "Private" : "Public"}
          </Button>
        </div>

        {/* Message Input */}
        <div className="flex space-x-2">
          <Textarea
            placeholder={replyingTo ? "Write a reply..." : "Share updates about this patient..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 min-h-0 resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || addCommentMutation.isPending}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}