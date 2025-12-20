import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Permission } from "@/types/role-permissions";

interface PermissionItemProps {
  permission: Permission;
  isSelected: boolean;
  onToggle: (permissionId: number) => void;
}

// Map permission names to icons and examples
const getPermissionDetails = (name: string) => {
  const details: Record<string, { icon: string; example: string; impact: string }> = {
    viewPatients: { icon: "👁️", example: "View patient profiles, medical history", impact: "Read-only access" },
    editPatients: { icon: "✏️", example: "Update patient information, demographics", impact: "Can modify data" },
    createPatients: { icon: "➕", example: "Register new patients in the system", impact: "Can create records" },
    createVisit: { icon: "📋", example: "Record new patient consultations", impact: "Can document visits" },
    viewVisits: { icon: "📖", example: "View consultation history and notes", impact: "Read-only access" },
    editVisits: { icon: "🔄", example: "Modify existing visit records", impact: "Can update records" },
    createLabOrder: { icon: "🧪", example: "Order blood tests, lab work", impact: "Can request tests" },
    viewLabResults: { icon: "📊", example: "View test results and reports", impact: "Read-only access" },
    editLabResults: { icon: "✏️", example: "Update lab results, add notes", impact: "Can modify results" },
    createPrescription: { icon: "💊", example: "Prescribe medications to patients", impact: "Can prescribe drugs" },
    viewPrescriptions: { icon: "📋", example: "View medication history", impact: "Read-only access" },
    manageMedications: { icon: "💉", example: "Add/edit medications in database", impact: "Can manage catalog" },
    viewMedications: { icon: "🔍", example: "Search and view medication list", impact: "Read-only access" },
    createConsultation: { icon: "📝", example: "Create consultation forms", impact: "Can create forms" },
    viewConsultation: { icon: "👀", example: "View consultation records", impact: "Read-only access" },
    createConsultationForm: { icon: "📄", example: "Design custom consultation forms", impact: "Can create templates" },
    manageUsers: { icon: "👥", example: "Add/edit staff members, assign roles", impact: "Full user management" },
    viewUsers: { icon: "👤", example: "View staff directory and profiles", impact: "Read-only access" },
    manageOrganizations: { icon: "🏢", example: "Configure organization settings", impact: "Can modify org settings" },
    viewOrganizations: { icon: "🏛️", example: "View organization information", impact: "Read-only access" },
    uploadFiles: { icon: "📤", example: "Upload documents, images, reports", impact: "Can add files" },
    viewFiles: { icon: "📁", example: "View and download uploaded files", impact: "Read-only access" },
    deleteFiles: { icon: "🗑️", example: "Remove files from the system", impact: "Can delete files" },
    viewDashboard: { icon: "📈", example: "Access main dashboard", impact: "Can view dashboard" },
    viewReports: { icon: "📊", example: "View analytics and reports", impact: "Read-only access" },
    viewAuditLogs: { icon: "📜", example: "View system activity logs", impact: "Can audit system" },
    viewAppointments: { icon: "📅", example: "View appointment schedule", impact: "Read-only access" },
    createAppointments: { icon: "➕", example: "Schedule new appointments", impact: "Can book appointments" },
    editAppointments: { icon: "✏️", example: "Modify appointment details", impact: "Can update appointments" },
    cancelAppointments: { icon: "❌", example: "Cancel scheduled appointments", impact: "Can cancel bookings" },
    createReferral: { icon: "↗️", example: "Refer patients to specialists", impact: "Can create referrals" },
    viewReferrals: { icon: "👁️", example: "View referral history", impact: "Read-only access" },
    manageReferrals: { icon: "🔄", example: "Update referral status", impact: "Can manage referrals" },
    viewBilling: { icon: "💰", example: "View invoices and billing", impact: "Read-only access" },
    createInvoice: { icon: "🧾", example: "Generate invoices for patients", impact: "Can create invoices" },
    processPayment: { icon: "💳", example: "Record payments and transactions", impact: "Can process payments" },
  };

  return details[name] || { icon: "🔑", example: "Access system feature", impact: "Standard access" };
};

export function PermissionItem({
  permission,
  isSelected,
  onToggle,
}: PermissionItemProps) {
  const checkboxId = `perm-${permission.id}`;
  const details = getPermissionDetails(permission.name);

  return (
    <div
      className={`
        group flex items-center gap-3 p-3 rounded-md border transition-all cursor-pointer
        ${isSelected
          ? "bg-primary/10 border-primary/40 shadow-sm"
          : "bg-background hover:bg-accent/50 border-border hover:border-primary/30"
        }
      `}
      role="listitem"
      onClick={() => onToggle(permission.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(permission.id);
        }
      }}
      tabIndex={0}
    >
      <Checkbox
        id={checkboxId}
        checked={isSelected}
        onCheckedChange={() => onToggle(permission.id)}
        className="h-5 w-5 flex-shrink-0 cursor-pointer"
        aria-label={`${isSelected ? "Remove" : "Add"} permission: ${permission.name}`}
        onClick={(e) => e.stopPropagation()}
      />
      <Label
        htmlFor={checkboxId}
        className="flex-1 cursor-pointer flex items-center gap-2 group-hover:text-primary transition-colors min-w-0"
      >
        <span className="text-base flex-shrink-0" aria-hidden="true">{details.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{permission.name}</span>
            {isSelected && (
              <CheckCircle2
                className="h-4 w-4 text-primary flex-shrink-0"
                aria-hidden="true"
              />
            )}
          </div>
          {permission.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {permission.description}
            </p>
          )}
        </div>
      </Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded flex-shrink-0">
              <Info className="h-3 w-3" />
              <span className="font-medium hidden sm:inline">{details.impact}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{details.example}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

