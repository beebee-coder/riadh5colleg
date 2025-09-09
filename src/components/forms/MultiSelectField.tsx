
"use client";

import * as React from "react";
import { Command as CommandPrimitive, CommandGroup, CommandItem } from "cmdk";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label"; // Import Label
import { cn } from "@/lib/utils";

type Option = Record<"value" | "label", string>;

interface MultiSelectFieldProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelectField({
  label,
  options,
  selected,
  onChange,
  placeholder = "Sélectionner des options...",
  className,
  disabled,
  ...props
}: MultiSelectFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = React.useCallback((value: string) => {
    onChange(selected.filter((s) => s !== value));
  }, [onChange, selected]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && selected.length > 0) {
          const newSelected = [...selected];
          newSelected.pop();
          onChange(newSelected);
        }
      }
      if (e.key === "Escape") {
        input.blur();
      }
    }
  }, [onChange, selected]);

  const selectables = options.filter(option => !selected.includes(option.value));

  return (
    <div className="flex flex-col gap-1.5 w-full"> 
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <CommandPrimitive onKeyDown={handleKeyDown} className={cn("overflow-visible bg-transparent", className)} {...props}>
        <div
            className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        >
            <div className="flex gap-1 flex-wrap">
            {selected.map((value) => {
                const option = options.find(o => o.value === value);
                return (
                <Badge key={value} variant="secondary">
                    {option?.label}
                    <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                        handleUnselect(value);
                        }
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onClick={() => handleUnselect(value)}
                    >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                </Badge>
                )
            })}
            <CommandPrimitive.Input
                ref={inputRef}
                value={inputValue}
                onValueChange={setInputValue}
                onBlur={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                disabled={disabled}
                className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
            />
            </div>
        </div>
        <div className="relative mt-2">
            {open && selectables.length > 0 ? (
            <div className="absolute w-full z-50 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                <CommandGroup className="h-full max-h-60 overflow-auto">
                {selectables.map((option) => {
                    return (
                    <CommandItem
                        key={option.value}
                        onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        }}
                        onSelect={() => {
                        setInputValue("")
                        onChange([...selected, option.value]);
                        }}
                        className={"cursor-pointer"}
                    >
                        {option.label}
                    </CommandItem>
                    );
                })}
                </CommandGroup>
            </div>
            ) : null}
        </div>
        </CommandPrimitive>
    </div>
  )
}
