import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalCondition {
  name: string;
  category: string;
  chronic: boolean;
}

interface MedicalConditionAutocompleteProps {
  value: string;
  onSelect: (condition: string) => void;
  placeholder?: string;
  className?: string;
}

export default function MedicalConditionAutocomplete({
  value,
  onSelect,
  placeholder = "Search medical conditions...",
  className,
}: MedicalConditionAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch medical condition suggestions
  const { data: conditions = [] } = useQuery<MedicalCondition[]>({
    queryKey: ["/api/suggestions/medical-conditions", searchQuery],
    enabled: searchQuery.length >= 2,
  });

  const handleSelect = (condition: MedicalCondition) => {
    onSelect(condition.name);
    setOpen(false);
    setSearchQuery("");
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      "Cardiovascular": "bg-red-100 text-red-800 border-red-300",
      "Endocrine": "bg-purple-100 text-purple-800 border-purple-300",
      "Respiratory": "bg-blue-100 text-blue-800 border-blue-300",
      "Neurological": "bg-indigo-100 text-indigo-800 border-indigo-300",
      "Gastrointestinal": "bg-green-100 text-green-800 border-green-300",
      "Mental Health": "bg-pink-100 text-pink-800 border-pink-300",
      "Musculoskeletal": "bg-orange-100 text-orange-800 border-orange-300",
      "Renal": "bg-teal-100 text-teal-800 border-teal-300",
      "Hematological": "bg-rose-100 text-rose-800 border-rose-300",
      "Infectious": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "Immunological": "bg-violet-100 text-violet-800 border-violet-300",
      "Ophthalmological": "bg-cyan-100 text-cyan-800 border-cyan-300",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200",
              "border-slate-300 hover:border-slate-400",
              className
            )}
          >
            <div className="flex items-center gap-2 flex-1 text-left overflow-hidden">
              <Heart className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              {value ? (
                <span className="truncate">{value}</span>
              ) : (
                <span className="text-slate-500">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type to search medical conditions..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-0 focus:ring-0"
            />
            <CommandEmpty>
              {searchQuery.length < 2 ? "Type at least 2 characters to search..." : "No medical conditions found."}
            </CommandEmpty>
            {conditions.length > 0 && (
              <CommandGroup>
                {conditions.map((condition) => (
                  <CommandItem
                    key={condition.name}
                    value={condition.name}
                    onSelect={() => handleSelect(condition)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-emerald-50"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Heart className="h-4 w-4 text-emerald-500" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {condition.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getCategoryColor(condition.category))}
                          >
                            {condition.category}
                          </Badge>
                          {condition.chronic && (
                            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                              Chronic
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === condition.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}