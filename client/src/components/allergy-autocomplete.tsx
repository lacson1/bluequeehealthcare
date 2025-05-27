import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Allergy {
  name: string;
  category: string;
  severity: string;
}

interface AllergyAutocompleteProps {
  value: string;
  onSelect: (allergy: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AllergyAutocomplete({
  value,
  onSelect,
  placeholder = "Search allergies...",
  className,
}: AllergyAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch allergy suggestions
  const { data: allergies = [] } = useQuery<Allergy[]>({
    queryKey: ["/api/suggestions/allergies", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await fetch(`/api/suggestions/allergies?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Failed to fetch allergy suggestions");
      return response.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const handleSelect = (allergy: Allergy) => {
    onSelect(allergy.name);
    setOpen(false);
    setSearchQuery("");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High": return "bg-red-100 text-red-800 border-red-300";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Low": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
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
              "w-full justify-between focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200",
              "border-slate-300 hover:border-slate-400",
              className
            )}
          >
            <div className="flex items-center gap-2 flex-1 text-left overflow-hidden">
              <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
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
              placeholder="Type to search allergies..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-0 focus:ring-0"
            />
            <CommandEmpty>
              {searchQuery.length < 2 ? "Type at least 2 characters to search..." : "No allergies found."}
            </CommandEmpty>
            {allergies.length > 0 && (
              <CommandGroup>
                {allergies.map((allergy) => (
                  <CommandItem
                    key={allergy.name}
                    value={allergy.name}
                    onSelect={() => handleSelect(allergy)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-orange-50"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {allergy.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {allergy.category}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getSeverityColor(allergy.severity))}
                          >
                            {allergy.severity} Risk
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === allergy.name ? "opacity-100" : "opacity-0"
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