import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, User, Send, FileText, Sparkles, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import type { AiConsultation, ClinicalNote } from "@shared/schema";

export default function AiConsultationPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const { data: consultation, isLoading } = useQuery<AiConsultation>({
    queryKey: [`/api/ai-consultations/${id}`],
    enabled: !!id
  });

  const { data: clinicalNotes } = useQuery<ClinicalNote>({
    queryKey: [`/api/ai-consultations/${id}/clinical-notes`],
    enabled: !!id && showNotes
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (msg: string) => {
      const response = await apiRequest(`/api/ai-consultations/${id}/messages`, 'POST', { 
        message: msg, 
        role: "user" 
      });
      return await response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/ai-consultations/${id}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  });

  const generateNotesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/ai-consultations/${id}/generate-notes`, 'POST');
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Clinical notes generated successfully"
      });
      setShowNotes(true);
      queryClient.invalidateQueries({ queryKey: [`/api/ai-consultations/${id}/clinical-notes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ai-consultations/${id}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate clinical notes",
        variant: "destructive"
      });
    }
  });

  const handleSend = () => {
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-muted-foreground">Loading consultation...</div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-muted-foreground">Consultation not found</div>
      </div>
    );
  }

  const transcript = Array.isArray(consultation.transcript) ? consultation.transcript : [];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ai-consultations")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">AI Consultation</h1>
            <p className="text-sm text-muted-foreground">
              {consultation.chiefComplaint || "No chief complaint"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={consultation.status === 'completed' ? 'default' : 'secondary'}>
            {consultation.status}
          </Badge>
          {consultation.status !== 'completed' && (
            <Button
              onClick={() => generateNotesMutation.mutate()}
              disabled={generateNotesMutation.isPending || transcript.length < 2}
              data-testid="button-generate-notes"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Clinical Notes
            </Button>
          )}
          {consultation.status === 'completed' && (
            <Button
              variant="outline"
              onClick={() => setShowNotes(!showNotes)}
              data-testid="button-view-notes"
            >
              <FileText className="h-4 w-4 mr-2" />
              {showNotes ? "Hide Notes" : "View Notes"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
        {/* Chat Area */}
        <div className={`flex flex-col border-r ${showNotes ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-3xl mx-auto">
              {transcript.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start the conversation by asking the AI patient a question</p>
                </div>
              ) : (
                transcript.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                    <Card className={`p-3 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </Card>
                    {msg.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              {sendMessageMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                  </div>
                  <Card className="p-3">
                    <p className="text-sm text-muted-foreground">Thinking...</p>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          {consultation.status !== 'completed' && (
            <div className="border-t p-4">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask a question or make an observation..."
                  className="flex-1 min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  size="icon"
                  className="h-[60px] w-[60px]"
                  data-testid="button-send"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Clinical Notes Panel */}
        {showNotes && clinicalNotes && (
          <div className="lg:col-span-1 flex flex-col border-l bg-card">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">{t('notes.clinicalNotes')}</h2>
              <p className="text-sm text-muted-foreground">{t('notes.soapFormat')}</p>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {clinicalNotes.chiefComplaint && (
                  <>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{t('notes.chiefComplaint')}</h3>
                      <p className="text-sm text-muted-foreground">{clinicalNotes.chiefComplaint}</p>
                    </div>
                    <Separator />
                  </>
                )}
                {clinicalNotes.subjective && (
                  <>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{t('notes.subjective')}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {clinicalNotes.subjective}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}
                {clinicalNotes.objective && (
                  <>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{t('notes.objective')}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {clinicalNotes.objective}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}
                {clinicalNotes.assessment && (
                  <>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{t('notes.assessment')}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {clinicalNotes.assessment}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}
                {clinicalNotes.plan && (
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{t('notes.plan')}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {clinicalNotes.plan}
                    </p>
                  </div>
                )}
                {clinicalNotes.medications && clinicalNotes.medications.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Medications</h3>
                      <div className="space-y-2">
                        {clinicalNotes.medications.map((med, index) => (
                          <Card key={index} className="p-2">
                            <p className="font-medium text-sm">{med.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {med.dosage} - {med.frequency} for {med.duration}
                            </p>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
