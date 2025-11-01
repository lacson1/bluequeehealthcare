import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, Calendar, User } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AiConsultation } from "@shared/schema";

export default function AiConsultationsListPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");

  const { data: consultations = [], isLoading } = useQuery<AiConsultation[]>({
    queryKey: ['/api/ai-consultations']
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients']
  });

  const createConsultationMutation = useMutation({
    mutationFn: async (data: { patientId: number; chiefComplaint: string }) => {
      const response = await apiRequest('/api/ai-consultations', 'POST', data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: "AI consultation started"
      });
      setDialogOpen(false);
      setSelectedPatientId("");
      setChiefComplaint("");
      queryClient.invalidateQueries({ queryKey: ['/api/ai-consultations'] });
      navigate(`/ai-consultations/${data.id}`);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to start consultation";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleCreate = () => {
    if (selectedPatientId && chiefComplaint) {
      createConsultationMutation.mutate({
        patientId: parseInt(selectedPatientId),
        chiefComplaint
      });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI-Powered Consultations
          </h1>
          <p className="text-muted-foreground mt-1">
            Simulate patient conversations and generate clinical notes automatically
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-consultation">
              <Sparkles className="h-4 w-4 mr-2" />
              New Consultation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start AI Consultation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="patient">Patient</Label>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger id="patient" data-testid="select-patient">
                    <SelectValue placeholder={patients.length === 0 ? "No patients available" : "Select patient"} />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.length === 0 ? (
                      <div className="p-4 text-sm text-center text-muted-foreground">
                        No patients found. Please create a patient first.
                      </div>
                    ) : (
                      patients.map((patient: any) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {patients.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    You need to create at least one patient before starting an AI consultation.
                    <a href="/patients" className="ml-1 underline font-medium">
                      Go to Patient Registry
                    </a>
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="complaint">Chief Complaint</Label>
                <Input
                  id="complaint"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g., Persistent headache for 3 days"
                  data-testid="input-chief-complaint"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!selectedPatientId || !chiefComplaint || createConsultationMutation.isPending || patients.length === 0}
                className="w-full"
                data-testid="button-create"
              >
                {createConsultationMutation.isPending ? "Starting..." : "Start Consultation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading consultations...</div>
      ) : consultations.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No consultations yet</h2>
          <p className="text-muted-foreground mb-6">
            Start your first AI-powered consultation to simulate doctor-patient interactions
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Start First Consultation
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {consultations.map((consultation) => (
            <Card
              key={consultation.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/ai-consultations/${consultation.id}`)}
              data-testid={`consultation-card-${consultation.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{consultation.chiefComplaint || "Consultation"}</h3>
                    <Badge variant={consultation.status === 'completed' ? 'default' : 'secondary'}>
                      {consultation.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(consultation.createdAt!).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {Array.isArray(consultation.transcript) ? consultation.transcript.length : 0} messages
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
