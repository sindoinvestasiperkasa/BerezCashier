"use client"

import * as React from "react"
import { useCombobox, UseComboboxStateChange } from "downshift"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

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
    disabled?: boolean;
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = "Pilih opsi...",
    searchPlaceholder = "Cari opsi...",
    emptyText = "Tidak ada opsi ditemukan.",
    onAddNew,
    addNewLabel = "Tambah baru",
    disabled = false
}: ComboboxProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [inputItems, setInputItems] = React.useState(options);

    React.useEffect(() => {
        setInputItems(options);
    }, [options]);

    const {
        getToggleButtonProps,
        getMenuProps,
        getInputProps,
        highlightedIndex,
        getItemProps,
        selectedItem,
    } = useCombobox({
        items: inputItems,
        itemToString: (item) => (item ? item.label : ""),
        selectedItem: options.find(opt => opt.value === value) || null,
        onInputValueChange: ({ inputValue }) => {
            setInputItems(
                options.filter((item) =>
                    item.label.toLowerCase().includes((inputValue || "").toLowerCase())
                )
            );
        },
        onSelectedItemChange: (changes: UseComboboxStateChange<ComboboxOption>) => {
            onChange(changes.selectedItem?.value || "");
            setIsOpen(false);
        },
        onIsOpenChange: ({ isOpen }) => {
            setIsOpen(!!isOpen);
        },
    });

    const selectedOption = options.find(option => option.value === value);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    className="w-full justify-between"
                    {...getToggleButtonProps()}
                    disabled={disabled}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        {...getInputProps()}
                        className="h-9"
                    />
                     <CommandList>
                        <CommandEmpty>
                            <div className="py-2 text-center text-sm">{emptyText}</div>
                             {onAddNew && (
                                <CommandItem
                                    onSelect={() => {
                                        setIsOpen(false);
                                        onAddNew();
                                    }}
                                    className="cursor-pointer text-primary justify-center"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    {addNewLabel}
                                </CommandItem>
                            )}
                        </CommandEmpty>
                        <CommandGroup {...getMenuProps()}>
                            {inputItems.map((item, index) => (
                                <CommandItem
                                    key={item.value}
                                    {...getItemProps({ item, index })}
                                    data-highlighted={highlightedIndex === index}
                                    className="data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground cursor-pointer"
                                >
                                     <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedItem?.value === item.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {item.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}