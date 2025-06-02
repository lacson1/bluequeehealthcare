import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EnhancedVisitRecordingV2 } from "@/components/enhanced-visit-recording-v2";

interface VisitRecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number;
}

export function VisitRecordingModal({ open, onOpenChange, patientId }: VisitRecordingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
        <div className="p-6">
          <EnhancedVisitRecordingV2 
            patientId={patientId}
            onSave={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VisitRecordingModal;