import { useState, useEffect } from "react";
import axios from "axios";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, TestTube, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LabTest {
  name: string;
  category: string;
  referenceRange: string;
}

interface LabTestAutocompleteProps {
  value: LabTest | null;
  onSelect: (test: LabTest) => void;
  onAutoFill: (test: LabTest) => void;
  placeholder?: string;
  className?: string;
}

export default function LabTestAutocomplete({
  value,
  onSelect,
  onAutoFill,
  placeholder = "Search lab tests...",
  className,
}: LabTestAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [labTests, setLabTests] = useState<LabTest[]>([]);

  // Fetch lab test suggestions with authentication
  const fetchLabTests = async (q: string) => {
    try {
      const token = localStorage.getItem('clinic_token');
      const res = await axios.get(`/api/suggestions/lab-tests?q=${q}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setLabTests(res.data);
    } catch (error) {
      console.error("Failed to fetch lab test suggestions:", error);
      setLabTests([]);
    }
  };

  useEffect(() => {
    if (searchQuery.length >= 2) {
      fetchLabTests(searchQuery);
    } else {
      setLabTests([]);
    }
  }, [searchQuery]);

  const handleSelect = (test: LabTest) => {
    onSelect(test);
    onAutoFill(test); // Trigger auto-fill for reference range
    setOpen(false);
    setSearchQuery("");
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
              "w-full justify-between focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200",
              "border-slate-300 hover:border-slate-400",
              className
            )}
          >
            <div className="flex items-center gap-2 flex-1 text-left overflow-hidden">
              <TestTube className="h-4 w-4 text-slate-500 flex-shrink-0" />
              {value ? (
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="truncate">{value.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {value.category}
                  </Badge>
                </div>
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
              placeholder="Type to search lab tests..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-0 focus:ring-0"
            />
            <CommandEmpty>
              {searchQuery.length < 2 ? "Type at least 2 characters to search..." : "No lab tests found."}
            </CommandEmpty>
            {labTests.length > 0 && (
              <CommandGroup>
                {labTests.map((test) => (
                  <CommandItem
                    key={test.name}
                    value={test.name}
                    onSelect={() => handleSelect(test)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-blue-50"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <TestTube className="h-4 w-4 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {test.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {test.category}
                          </Badge>
                          <span className="text-xs text-slate-500 truncate">
                            {test.referenceRange}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value?.name === test.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Auto-Fill Preview */}
      {value && value.referenceRange && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3 mt-2
                      animate-in slide-in-from-top-2 duration-300 ease-out">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
            <span className="font-medium text-blue-800 text-sm">Reference Range Auto-Filled</span>
            <div className="ml-auto">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-ping"></div>
            </div>
          </div>
          <div className="text-sm text-blue-700">
            Normal range for <span className="font-semibold">{value.name}</span> has been automatically populated.
          </div>
          <div className="mt-2">
            <Badge variant="outline" className="text-blue-700 border-blue-300 bg-white/50">
              Range: {value.referenceRange}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}