"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    onAddNew?: () => void;
    addNewLabel?: string;
}

export function Combobox({ 
    options,
    value,
    onChange,
    placeholder = "Pilih opsi...",
    searchPlaceholder = "Cari opsi...",
    emptyText = "Tidak ada opsi ditemukan.",
    onAddNew,
    addNewLabel = "Tambah baru"
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find(option => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedOption
            ? selectedOption.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
                <div>
                    <p className="py-2 text-center text-sm">{emptyText}</p>
                    {onAddNew && (
                         <Button variant="ghost" className="w-full" onClick={() => {
                            setOpen(false);
                            onAddNew();
                        }}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {addNewLabel}
                        </Button>
                    )}
                </div>
            </CommandEmpty>
            {onAddNew && (
                <CommandGroup>
                    <CommandItem
                        onSelect={() => {
                            setOpen(false);
                            onAddNew();
                        }}
                        className="cursor-pointer"
                    >
                        <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-primary">{addNewLabel}</span>
                    </CommandItem>
                    <CommandSeparator />
                </CommandGroup>
             )}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Search should be based on label
                  onSelect={(currentLabel) => {
                    const selectedValue = options.find(opt => opt.label.toLowerCase() === currentLabel.toLowerCase())?.value;
                    onChange(selectedValue === value ? "" : selectedValue || "")
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
