import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface DocumentActionButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "destructive";
}

export default function DocumentActionButton({
  onClick,
  icon: Icon,
  label,
  disabled = false,
  variant = "outline"
}: DocumentActionButtonProps) {
  return (
    <Button
      size="sm"
      variant={variant}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}