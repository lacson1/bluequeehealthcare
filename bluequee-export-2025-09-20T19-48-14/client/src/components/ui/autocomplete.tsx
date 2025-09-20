import React, { useState, useRef, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, X, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
  category?: string;
  metadata?: Record<string, any>;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value?: string | string[];
  onValueChange: (value: string | string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  multiple?: boolean;
  disabled?: boolean;
  loading?: boolean;
  allowCustom?: boolean;
  onCustomCreate?: (value: string) => void;
  className?: string;
  variant?: 'default' | 'database' | 'manual';
  maxHeight?: string;
  groupBy?: boolean;
}

export function Autocomplete({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search options...",
  emptyMessage = "No options found.",
  multiple = false,
  disabled = false,
  loading = false,
  allowCustom = false,
  onCustomCreate,
  className,
  variant = 'default',
  maxHeight = "300px",
  groupBy = false,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedValues = multiple 
    ? (Array.isArray(value) ? value : value ? [value] : [])
    : [];

  const selectedValue = multiple ? undefined : (Array.isArray(value) ? value[0] : value);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
    option.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const groupedOptions = groupBy ? 
    filteredOptions.reduce((groups, option) => {
      const category = option.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(option);
      return groups;
    }, {} as Record<string, AutocompleteOption[]>) :
    { 'All': filteredOptions };

  const handleSelect = (selectedOption: AutocompleteOption) => {
    if (multiple) {
      const newValues = selectedValues.includes(selectedOption.value)
        ? selectedValues.filter(v => v !== selectedOption.value)
        : [...selectedValues, selectedOption.value];
      onValueChange(newValues);
    } else {
      onValueChange(selectedOption.value);
      setOpen(false);
    }
  };

  const handleRemove = (valueToRemove: string) => {
    if (multiple) {
      onValueChange(selectedValues.filter(v => v !== valueToRemove));
    }
  };

  const handleCustomCreate = () => {
    if (allowCustom && onCustomCreate && searchValue.trim()) {
      onCustomCreate(searchValue.trim());
      setSearchValue("");
      setOpen(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'database':
        return "border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20";
      case 'manual':
        return "border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20";
      default:
        return "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900";
    }
  };

  const getVariantIndicator = () => {
    switch (variant) {
      case 'database':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case 'manual':
        return <div className="w-2 h-2 bg-orange-500 rounded-full" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between text-left font-normal",
              getVariantStyles(),
              !selectedValue && !selectedValues.length && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getVariantIndicator()}
              {multiple ? (
                selectedValues.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedValues.slice(0, 2).map(val => {
                      const option = options.find(opt => opt.value === val);
                      return (
                        <Badge 
                          key={val} 
                          variant="secondary" 
                          className="text-xs max-w-24 truncate"
                        >
                          {option?.label || val}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemove(val);
                            }}
                            className="ml-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-sm"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                    {selectedValues.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{selectedValues.length - 2} more
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span>{placeholder}</span>
                )
              ) : (
                <span className="truncate">
                  {selectedValue ? 
                    options.find(opt => opt.value === selectedValue)?.label || selectedValue :
                    placeholder
                  }
                </span>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                ref={inputRef}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandList style={{ maxHeight }}>
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading options...
                </div>
              ) : (
                <>
                  {Object.keys(groupedOptions).length === 0 ? (
                    <CommandEmpty>
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-2">{emptyMessage}</p>
                        {allowCustom && searchValue.trim() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCustomCreate}
                            className="text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add "{searchValue.trim()}"
                          </Button>
                        )}
                      </div>
                    </CommandEmpty>
                  ) : (
                    <>
                      {Object.entries(groupedOptions).map(([category, categoryOptions]) => (
                        <CommandGroup key={category} heading={groupBy ? category : undefined}>
                          {categoryOptions.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={() => handleSelect(option)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      (multiple ? selectedValues.includes(option.value) : selectedValue === option.value)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{option.label}</div>
                                    {option.description && (
                                      <div className="text-xs text-muted-foreground truncate">
                                        {option.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {variant === 'database' && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                                )}
                                {variant === 'manual' && (
                                  <div className="w-2 h-2 bg-orange-500 rounded-full ml-2" />
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))}
                      {allowCustom && searchValue.trim() && 
                       !filteredOptions.some(opt => opt.label.toLowerCase() === searchValue.toLowerCase()) && (
                        <CommandGroup>
                          <CommandItem onSelect={handleCustomCreate} className="cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Add "{searchValue.trim()}"</span>
                          </CommandItem>
                        </CommandGroup>
                      )}
                    </>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}