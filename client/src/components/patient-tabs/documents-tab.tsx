import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Eye } from "lucide-react";
import { Patient } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface Document {
  id: number;
  name: string;
  type?: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
}

interface DocumentsTabProps {
  patient: Patient;
}

export function DocumentsTab({ patient }: DocumentsTabProps) {
  // Note: This would need an API endpoint for patient documents
  // For now, showing empty state
  return (
    <EmptyState
      icon={FileText}
      title="No Documents"
      description="Document management feature coming soon. Documents will be displayed here."
    />
  );
}

