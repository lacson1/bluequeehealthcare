import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageCircle, Send, Bot, User, AlertTriangle, CheckCircle, Lightbulb, Code, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'explanation' | 'solution' | 'code' | 'warning';
  errorContext?: {
    errorId?: string;
    type?: string;
    severity?: string;
    component?: string;
  };
}

interface ErrorChatbotProps {
  errorId?: string;
  errorType?: string;
  errorMessage?: string;
  errorSeverity?: string;
  component?: string;
}

export function ErrorChatbot({ 
  errorId, 
  errorType, 
  errorMessage, 
  errorSeverity, 
  component 
}: ErrorChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize with welcome message if we have error context
      if (errorId || errorType || errorMessage) {
        const welcomeMessage: ChatMessage = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `Hello! I'm your AI error analysis assistant. I can see you're experiencing a ${errorType || 'system'} error${errorSeverity ? ` with ${errorSeverity} severity` : ''}${component ? ` in the ${component} component` : ''}. 

I can help you:
• Understand what caused this error
• Provide step-by-step solutions
• Suggest preventive measures
• Explain technical details

What would you like to know about this error?`,
          timestamp: new Date(),
          type: 'explanation',
          errorContext: { errorId, type: errorType, severity: errorSeverity, component }
        };
        setMessages([welcomeMessage]);
      } else {
        const generalWelcome: ChatMessage = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `Hello! I'm your AI error analysis assistant. I can help you understand and resolve system errors, explain error patterns, and provide solutions.

How can I assist you today?`,
          timestamp: new Date(),
          type: 'explanation'
        };
        setMessages([generalWelcome]);
      }
    }
  }, [isOpen, errorId, errorType, errorMessage, errorSeverity, component]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/error-chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          errorContext: {
            errorId,
            type: errorType,
            message: errorMessage,
            severity: errorSeverity,
            component
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          type: data.messageType || 'explanation'
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'I apologize, but I encountered an issue processing your request. Please try again or contact support if the problem persists.',
          timestamp: new Date(),
          type: 'warning'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered a connection issue. Please check your internet connection and try again.',
        timestamp: new Date(),
        type: 'warning'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'solution':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'code':
        return <Code className="h-4 w-4 text-blue-500" />;
      case 'explanation':
      default:
        return <Lightbulb className="h-4 w-4 text-purple-500" />;
    }
  };

  const getMessageBadge = (type?: string) => {
    switch (type) {
      case 'solution':
        return <Badge variant="outline" className="text-green-600 border-green-200">Solution</Badge>;
      case 'warning':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Warning</Badge>;
      case 'code':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Code</Badge>;
      case 'explanation':
        return <Badge variant="outline" className="text-purple-600 border-purple-200">Explanation</Badge>;
      default:
        return null;
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 shadow-lg"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[500px] shadow-xl">
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Error Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
          {(errorType || errorSeverity) && (
            <div className="flex gap-2">
              {errorType && (
                <Badge variant="secondary" className="text-xs">
                  {errorType}
                </Badge>
              )}
              {errorSeverity && (
                <Badge 
                  variant={errorSeverity === 'HIGH' ? 'destructive' : errorSeverity === 'MEDIUM' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {errorSeverity}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                  )}
                  
                  <div className={`max-w-[280px] ${message.role === 'user' ? 'order-2' : ''}`}>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.role === 'assistant' && message.type && (
                        <div className="flex items-center gap-2 mb-2">
                          {getMessageIcon(message.type)}
                          {getMessageBadge(message.type)}
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 px-1">
                      {format(message.timestamp, 'HH:mm')}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 order-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-600">Analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about this error..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}