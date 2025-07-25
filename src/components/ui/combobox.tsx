"use client"

import * as React from "react"
import { useCombobox, UseComboboxStateChange } from "downshift"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

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
            if (changes.selectedItem) {
                onChange(changes.selectedItem.value);
            }
            setIsOpen(false);
        },
        onIsOpenChange: ({ isOpen }) => {
            if (!isOpen) {
                setInputItems(options);
            }
            setIsOpen(!!isOpen);
        },
    });

    const selectedOption = options.find(option => option.value === value);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <div>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isOpen}
                        className="w-full justify-between"
                        {...getToggleButtonProps()}
                        disabled={disabled}
                    >
                        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
            </div>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <div className="flex items-center border-b px-3">
                    <Input
                        placeholder={searchPlaceholder}
                        {...getInputProps()}
                        className="h-11 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none shadow-none focus-visible:ring-0"
                    />
                </div>
                <ScrollArea className="max-h-60">
                    <ul {...getMenuProps()} className="py-1">
                        {inputItems.length > 0 ? (
                            inputItems.map((item, index) => (
                                <li
                                    key={`${item.value}-${index}`}
                                    className={cn(
                                        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                                        highlightedIndex === index && "bg-accent text-accent-foreground",
                                    )}
                                    {...getItemProps({ item, index })}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedItem?.value === item.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {item.label}
                                </li>
                            ))
                        ) : (
                            <li className="py-2 text-center text-sm">{emptyText}</li>
                        )}
                        {onAddNew && (
                             <li
                                className="relative flex cursor-pointer select-none items-center justify-center rounded-sm px-2 py-1.5 text-sm font-semibold text-primary outline-none hover:bg-accent"
                                onClick={() => {
                                    setIsOpen(false);
                                    onAddNew();
                                }}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {addNewLabel}
                            </li>
                        )}
                    </ul>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
