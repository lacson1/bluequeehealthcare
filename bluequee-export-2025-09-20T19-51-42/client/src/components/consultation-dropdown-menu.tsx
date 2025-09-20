import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Download,
  Share2,
  FileText,
  Printer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { printConsultation } from "@/services/print-utils";

interface ConsultationDropdownMenuProps {
  consultation: any;
  patient?: any;
  onView?: (consultation: any) => void;
  onEdit?: (consultation: any) => void;
  onCopy?: (consultation: any) => void;
  onDelete?: (consultation: any) => void;
  onExport?: (consultation: any) => void;
  onShare?: (consultation: any) => void;
  onPrint?: (consultation: any, patient?: any) => void;
}

export function ConsultationDropdownMenu({
  consultation,
  patient,
  onView,
  onEdit,
  onCopy,
  onDelete,
  onExport,
  onShare,
  onPrint
}: ConsultationDropdownMenuProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleView = () => {
    if (onView) {
      onView(consultation);
    } else {
      toast({
        title: "View Consultation",
        description: `Viewing consultation record #${consultation.id}`,
      });
    }
    setIsOpen(false);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(consultation);
    } else {
      toast({
        title: "Edit Consultation",
        description: `Opening edit mode for consultation #${consultation.id}`,
      });
    }
    setIsOpen(false);
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(consultation);
    } else {
      // Copy consultation details to clipboard
      const consultationText = `
Consultation Record #${consultation.id}
Form: ${consultation.formName || 'General Consultation'}
Created by: ${consultation.conductedByFullName || consultation.conductedByUsername || 'Healthcare Staff'}
Role: ${consultation.roleDisplayName || consultation.conductedByRole || 'Staff'}
Date: ${new Date(consultation.createdAt).toLocaleDateString()}
Time: ${new Date(consultation.createdAt).toLocaleTimeString()}
Type: ${consultation.formDescription || 'General consultation'}
      `.trim();

      navigator.clipboard.writeText(consultationText).then(() => {
        toast({
          title: "Copied to Clipboard",
          description: "Consultation details copied successfully",
        });
      }).catch(() => {
        toast({
          title: "Copy Failed",
          description: "Unable to copy consultation details",
          variant: "destructive",
        });
      });
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(consultation);
    } else {
      toast({
        title: "Delete Consultation",
        description: `Are you sure you want to delete consultation #${consultation.id}?`,
        variant: "destructive",
      });
    }
    setIsOpen(false);
  };

  const handleExport = () => {
    if (onExport) {
      onExport(consultation);
    } else {
      toast({
        title: "Export Consultation",
        description: `Exporting consultation record #${consultation.id}`,
      });
    }
    setIsOpen(false);
  };

  const handleShare = () => {
    if (onShare) {
      onShare(consultation);
    } else {
      toast({
        title: "Share Consultation",
        description: `Generating shareable link for consultation #${consultation.id}`,
      });
    }
    setIsOpen(false);
  };

  const handlePrint = async () => {
    try {
      if (onPrint) {
        onPrint(consultation, patient);
      } else if (patient) {
        await printConsultation(consultation, patient);
        toast({
          title: "Printing Consultation",
          description: `Opening print dialog for consultation #${consultation.id}`,
        });
      } else {
        toast({
          title: "Print Error",
          description: "Patient information not available for printing",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Print Failed",
        description: "Unable to print consultation record",
        variant: "destructive",
      });
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 hover:bg-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open consultation menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleView} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          Edit Record
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          Copy Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExport} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Export Record
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
          <Share2 className="mr-2 h-4 w-4" />
          Share Record
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint} className="cursor-pointer">
          <Printer className="mr-2 h-4 w-4" />
          Print Record
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleDelete} 
          className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Record
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}