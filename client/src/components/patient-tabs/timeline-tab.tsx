import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Stethoscope, TestTube, Pill } from "lucide-react";
import { Patient } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { PatientTimeline } from "@/components/patient-timeline";

interface TimelineTabProps {
  patient: Patient;
}

export function TimelineTab({ patient }: TimelineTabProps) {
  return (
    <div className="w-full">
      <PatientTimeline patientId={patient.id} />
    </div>
  );
}

