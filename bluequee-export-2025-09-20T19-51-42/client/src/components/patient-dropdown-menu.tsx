import React from 'react';
import { useLocation } from "wouter";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Edit,
  Stethoscope,
  Pill,
  FlaskRound,
  FileText,
  CalendarDays,
  Users,
  Monitor,
  Upload,
  Share,
  MessageSquare,
  Archive
} from 'lucide-react';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
}

interface PatientDropdownMenuProps {
  patient: Patient;
  children: React.ReactNode;
  onEditPatient?: () => void;
  onRecordVisit?: () => void;
  onAddPrescription?: () => void;
  onPrintRecord?: () => void;
  showHeader?: boolean;
  align?: "start" | "center" | "end";
}

export function PatientDropdownMenu({
  patient,
  children,
  onEditPatient,
  onRecordVisit,
  onAddPrescription,
  onPrintRecord,
  showHeader = true,
  align = "start"
}: PatientDropdownMenuProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-64">
        {showHeader && (
          <>
            <div className="px-3 py-2 border-b">
              <p className="text-sm font-medium">{patient.firstName} {patient.lastName}</p>
              <p className="text-xs text-gray-500">ID: HC{patient.id?.toString().padStart(6, "0")}</p>
            </div>
          </>
        )}
        <DropdownMenuItem onClick={() => navigate(`/appointments?patientId=${patient.id}`)} className="bg-blue-50 border-blue-200 text-blue-700 font-medium">
          <CalendarDays className="mr-2 h-4 w-4" />
          Schedule Appointment
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {
          if (onEditPatient) {
            onEditPatient();
          } else {
            // Navigate to patient profile with edit mode
            navigate(`/patients/${patient.id}?edit=true`);
          }
        }}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Patient Info
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddPrescription}>
          <Pill className="mr-2 h-4 w-4" />
          Add Prescription
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/lab-results?patientId=${patient.id}`)}>
          <FlaskRound className="mr-2 h-4 w-4" />
          Order Lab Tests
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/form-builder?patientId=${patient.id}`)}>
          <FileText className="mr-2 h-4 w-4" />
          Create Consultation Form
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`/referrals?patientId=${patient.id}`)}>
          <Users className="mr-2 h-4 w-4" />
          Create Referral
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/patients/${patient.id}?tab=vitals`)}>
          <Monitor className="mr-2 h-4 w-4" />
          Record Vital Signs
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/documents?patientId=${patient.id}`)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Documents
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {
          if (onPrintRecord) {
            onPrintRecord();
          } else {
            // Navigate to patient profile with print mode
            navigate(`/patients/${patient.id}?action=print`);
          }
        }}>
          <Share className="mr-2 h-4 w-4" />
          Print/Export Records
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          // Switch to communication tab in current patient view
          const commTab = document.querySelector('[data-state="inactive"][value="communication"]') as HTMLElement;
          if (commTab) commTab.click();
        }}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Send Message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600" 
          onClick={async () => {
            if (confirm(`Are you sure you want to archive ${formatPatientName(patient)}? This will hide the patient from active lists but preserve all medical records.`)) {
              try {
                const response = await fetch(`/api/patients/${patient.id}/archive`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify({ archived: true })
                });

                if (response.ok) {
                  toast({
                    title: 'Patient Archived',
                    description: `${patient.firstName} ${patient.lastName} has been archived successfully.`,
                  });
                  // Refresh the page to update the patient list
                  window.location.reload();
                } else {
                  throw new Error('Failed to archive patient');
                }
              } catch (error) {
                toast({
                  title: 'Archive Failed',
                  description: 'Unable to archive patient. Please try again.',
                  variant: 'destructive'
                });
              }
            }
          }}
        >
          <Archive className="mr-2 h-4 w-4" />
          Archive Patient
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}