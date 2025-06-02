import { Checkbox } from "@/components/ui/checkbox";
import { LucideIcon } from "lucide-react";

interface TimelineFilterItemProps {
  id: string;
  checked: boolean;
  onCheckedChange: () => void;
  icon: LucideIcon;
  iconColor: string;
  label: string;
}

export default function TimelineFilterItem({
  id,
  checked,
  onCheckedChange,
  icon: Icon,
  iconColor,
  label
}: TimelineFilterItemProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox 
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <label htmlFor={id} className="text-sm">{label}</label>
    </div>
  );
}