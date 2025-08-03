import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile, useKeyboardPositioning } from '@/hooks/use-mobile';

interface Option {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string | string[];
  onSelect: (value: string | string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  alwaysVisibleOption?: Option;
  isMulti?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onSelect,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  alwaysVisibleOption,
  isMulti = false
}) => {
  const [open, setOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | undefined>();
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
  const isMobile = useIsMobile();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isMulti && Array.isArray(value)) {
      setSelectedOptions(options.filter(opt => value.includes(opt.value)));
    } else {
      const option = options.find(opt => opt.value === value);
      setSelectedOption(option);
    }
  }, [value, options, isMulti]);

  // Use keyboard positioning hook for mobile dropdown
  useKeyboardPositioning(open && isMobile, triggerRef, 150);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            // Mobile-specific improvements
            isMobile && "h-12 text-base px-4 py-3 min-h-[48px]",
            className
          )}
          disabled={disabled}
        >
          {isMulti && Array.isArray(value) ? (
            <div className="flex flex-wrap gap-1 items-center">
              {selectedOptions.length > 0
                ? selectedOptions.map(opt => (
                    <span key={opt.value} className="bg-muted rounded px-2 py-0.5 text-xs">
                      {opt.label}
                    </span>
                  ))
                : <span className="text-muted-foreground">{placeholder}</span>
              }
            </div>
          ) : (
            <div className="flex flex-col items-start">
              <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              {selectedOption?.subtitle && (
                <span className="text-xs text-muted-foreground">{selectedOption.subtitle}</span>
              )}
            </div>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-full p-0", 
          // Mobile-specific improvements
          isMobile && "w-[95vw] max-w-[450px] max-h-[70vh] rounded-lg"
        )} 
        style={!isMobile ? { width: 'var(--radix-popover-trigger-width)' } : undefined}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  className={cn(
                    // Mobile-specific improvements
                    isMobile && "py-3 px-3 text-base min-h-[44px] rounded-md"
                  )}
                  onSelect={() => {
                    if (isMulti) {
                      let newSelected: string[] = Array.isArray(value) ? [...value] : [];
                      if (newSelected.includes(option.value)) {
                        newSelected = newSelected.filter(v => v !== option.value);
                      } else {
                        newSelected.push(option.value);
                      }
                      onSelect(newSelected);
                    } else {
                      onSelect(option.value);
                      setOpen(false);
                    }
                  }}
                >
                  {isMulti ? (
                    <input
                      type="checkbox"
                      checked={Array.isArray(value) && value.includes(option.value)}
                      readOnly
                      className="mr-2"
                    />
                  ) : (
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  )}
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.subtitle && (
                      <span className="text-xs text-muted-foreground">{option.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {alwaysVisibleOption && (
              <CommandGroup>
                <CommandItem
                  key={alwaysVisibleOption.value}
                  value={alwaysVisibleOption.label}
                  className={cn(
                    // Mobile-specific improvements
                    isMobile && "py-3 px-3 text-base min-h-[44px]"
                  )}
                  onSelect={() => {
                    if (isMulti) {
                      let newSelected: string[] = Array.isArray(value) ? [...value] : [];
                      if (newSelected.includes(alwaysVisibleOption.value)) {
                        newSelected = newSelected.filter(v => v !== alwaysVisibleOption.value);
                      } else {
                        newSelected.push(alwaysVisibleOption.value);
                      }
                      onSelect(newSelected);
                    } else {
                      onSelect(alwaysVisibleOption.value);
                      setOpen(false);
                    }
                  }}
                >
                  {isMulti ? (
                    <input
                      type="checkbox"
                      checked={Array.isArray(value) && value.includes(alwaysVisibleOption.value)}
                      readOnly
                      className="mr-2"
                    />
                  ) : (
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === alwaysVisibleOption.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  )}
                  <div className="flex flex-col">
                    <span>{alwaysVisibleOption.label}</span>
                    {alwaysVisibleOption.subtitle && (
                      <span className="text-xs text-muted-foreground">{alwaysVisibleOption.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
