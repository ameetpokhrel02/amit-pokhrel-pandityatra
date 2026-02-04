import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ArrowLeftRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface DualDate {
    day: string;
    month: string;
    year: string;
    type: 'AD' | 'BS';
}

interface DualDatePickerProps {
    date?: DualDate;
    onDateChange: (date: DualDate) => void;
    className?: string;
}

const NEPALI_MONTHS = [
    "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
    "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

// Generate BS Years (e.g., 1980 - 2090)
const BS_YEARS = Array.from({ length: 111 }, (_, i) => (1980 + i).toString());
// Generate Days (1-32)
const DAYS = Array.from({ length: 32 }, (_, i) => (i + 1).toString());

export function DualDatePicker({ date, onDateChange, className }: DualDatePickerProps) {
    const [mode, setMode] = useState<'AD' | 'BS'>('AD');
    const [adDate, setAdDate] = useState<Date | undefined>(undefined);

    // Controlled internal state for BS
    const [bsYear, setBsYear] = useState<string>("");
    const [bsMonth, setBsMonth] = useState<string>("");
    const [bsDay, setBsDay] = useState<string>("");

    // Sync from props if provided (initial load)
    useEffect(() => {
        if (date) {
            setMode(date.type);
            if (date.type === 'AD') {
                if (date.year && date.month && date.day) {
                    // Note: Month is 1-indexed in our data, but Date constructor expects 0-indexed for month
                    const d = new Date(parseInt(date.year), parseInt(date.month) - 1, parseInt(date.day));
                    setAdDate(d);
                }
            } else {
                setBsYear(date.year);
                setBsMonth(date.month);
                setBsDay(date.day);
            }
        }
    }, []);

    // Handle AD Date Selection
    const handleAdSelect = (d: Date | undefined) => {
        setAdDate(d);
        if (d) {
            onDateChange({
                type: 'AD',
                year: d.getFullYear().toString(),
                month: (d.getMonth() + 1).toString(),
                day: d.getDate().toString()
            });
        }
    };

    // Handle BS Selection
    const handleBsChange = (field: 'year' | 'month' | 'day', value: string) => {
        let newYear = bsYear;
        let newMonth = bsMonth;
        let newDay = bsDay;

        if (field === 'year') { setBsYear(value); newYear = value; }
        if (field === 'month') { setBsMonth(value); newMonth = value; }
        if (field === 'day') { setBsDay(value); newDay = value; }

        if (newYear && newMonth && newDay) {
            onDateChange({
                type: 'BS',
                year: newYear,
                month: newMonth, // Pass the index or name? Currently passing index implicitly if using Select value as index, but better to pass index for logic.
                // Let's assume for consistency we pass numeric strings for simple parsing elsewhere, OR we map the month name back to a number.
                // For simplicity in this dropdown, we'll store the numeric index (1-12) as value.
                day: newDay
            });
        }
    };

    const toggleMode = (val: string) => {
        const m = val as 'AD' | 'BS';
        setMode(m);
        // We do NOT auto-convert here to strictly follow "User inputs what they know". 
    }

    return (
        <div className={cn("space-y-4", className)}>
            <Tabs value={mode} onValueChange={toggleMode} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-2">
                    <TabsTrigger value="AD">AD (English)</TabsTrigger>
                    <TabsTrigger value="BS">BS (Nepali)</TabsTrigger>
                </TabsList>

                {mode === 'AD' ? (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !adDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {adDate ? format(adDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={adDate}
                                onSelect={handleAdSelect}
                                initialFocus
                                captionLayout="dropdown"
                                fromYear={1900}
                                toYear={2030}
                            />
                        </PopoverContent>
                    </Popover>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {/* Day */}
                        <Select value={bsDay} onValueChange={(v) => handleBsChange('day', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        {/* Month */}
                        <Select value={bsMonth} onValueChange={(v) => handleBsChange('month', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {NEPALI_MONTHS.map((m, i) => (
                                    <SelectItem key={m} value={(i + 1).toString()}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Year */}
                        <Select value={bsYear} onValueChange={(v) => handleBsChange('year', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {BS_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </Tabs>
        </div>
    )
}
