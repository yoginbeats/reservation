"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    X,
    Check,
    Sparkles
} from "lucide-react";

interface ModernDatePickerProps {
    value?: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    minDate?: string; // YYYY-MM-DD
    maxDate?: string; // YYYY-MM-DD
    minYear?: number; // Defaults to 1850
    maxYear?: number; // Defaults to currentYear + 10
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    id?: string;
    showShortcuts?: boolean;
    align?: "left" | "right";
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatToYYYYMMDD(year: number, month: number, day: number): string {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
}

function parseYYYYMMDD(str?: string): { year: number; month: number; day: number } | null {
    if (!str || !str.match(/^\d{4}-\d{2}-\d{2}$/)) return null;
    const [y, m, d] = str.split("-").map(Number);
    return { year: y, month: m - 1, day: d };
}

export function ModernDatePicker({
    value = "",
    onChange,
    minDate,
    maxDate,
    minYear = 1850,
    maxYear,
    placeholder = "Select departure date",
    disabled = false,
    className = "",
    id,
    showShortcuts = true,
    align = "left",
}: ModernDatePickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const yearListRef = useRef<HTMLDivElement>(null);
    const activeYearRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    // Initial calendar view year and month
    const parsedValue = parseYYYYMMDD(value);
    const today = new Date();
    const todayStr = formatToYYYYMMDD(today.getFullYear(), today.getMonth(), today.getDate());

    const [viewYear, setViewYear] = useState<number>(parsedValue ? parsedValue.year : today.getFullYear());
    const [viewMonth, setViewMonth] = useState<number>(parsedValue ? parsedValue.month : today.getMonth());
    const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

    // Auto-scroll year picker container to current viewYear when opened
    useEffect(() => {
        if (isYearPickerOpen && yearListRef.current && activeYearRef.current) {
            const container = yearListRef.current;
            const target = activeYearRef.current;
            container.scrollTop = target.offsetTop - container.clientHeight / 2 + target.clientHeight / 2;
        }
    }, [isYearPickerOpen]);

    // Sync view when external value changes
    useEffect(() => {
        if (parsedValue) {
            setViewYear(parsedValue.year);
            setViewMonth(parsedValue.month);
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsYearPickerOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
                setIsYearPickerOpen(false);
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((prev) => prev - 1);
        } else {
            setViewMonth((prev) => prev - 1);
        }
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((prev) => prev + 1);
        } else {
            setViewMonth((prev) => prev + 1);
        }
    };

    const handleDateSelect = (day: number) => {
        const dateStr = formatToYYYYMMDD(viewYear, viewMonth, day);
        if (isDateDisabled(dateStr)) return;
        onChange(dateStr);
        setIsOpen(false);
    };

    const handleClear = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        onChange("");
        setIsOpen(false);
    };

    const handleSelectToday = () => {
        if (isDateDisabled(todayStr)) return;
        onChange(todayStr);
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
        setIsOpen(false);
    };

    const handleSelectTomorrow = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomStr = formatToYYYYMMDD(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        if (isDateDisabled(tomStr)) return;
        onChange(tomStr);
        setViewYear(tomorrow.getFullYear());
        setViewMonth(tomorrow.getMonth());
        setIsOpen(false);
    };

    const isDateDisabled = (dateStr: string) => {
        if (minDate && dateStr < minDate) return true;
        if (maxDate && dateStr > maxDate) return true;
        return false;
    };

    // Calculate calendar grid days
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Friendly formatted display text (e.g., "Tue, Oct 20, 2026")
    const formattedDisplayText = React.useMemo(() => {
        if (!parsedValue) return "";
        const d = new Date(parsedValue.year, parsedValue.month, parsedValue.day);
        return d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }, [parsedValue]);

    // Generate year range starting at 1850 up to maxYear (default currentYear + 10)
    const currentYear = today.getFullYear();
    const effectiveMinYear = minYear ?? 1850;
    const effectiveMaxYear = maxYear ?? currentYear + 10;
    const years = Array.from(
        { length: effectiveMaxYear - effectiveMinYear + 1 },
        (_, i) => effectiveMinYear + i
    );

    return (
        <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
            {/* Custom Trigger Input */}
            <button
                type="button"
                id={id}
                disabled={disabled}
                onClick={() => {
                    if (!disabled) setIsOpen(!isOpen);
                }}
                className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-bold transition-all outline-none ${
                    disabled
                        ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed dark:bg-zinc-900 dark:border-zinc-800"
                        : isOpen
                        ? "border-red-500 bg-white ring-2 ring-red-500/20 text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                        : "border-zinc-200 bg-zinc-50/60 hover:bg-white hover:border-zinc-300 text-zinc-800 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200"
                }`}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-2.5 truncate">
                    <CalendarIcon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                            value ? "text-red-600" : "text-zinc-400"
                        }`}
                    />
                    <span className={value ? "text-zinc-900 dark:text-zinc-100 font-extrabold" : "text-zinc-400 font-medium"}>
                        {formattedDisplayText || placeholder}
                    </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {value && !disabled && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleClear}
                            className="rounded-full p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 transition-colors"
                            title="Clear date"
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <ChevronDown
                        className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-red-600" : ""
                        }`}
                    />
                </div>
            </button>

            {/* Modern Dropdown Popover Calendar */}
            {isOpen && (
                <div
                    className={`absolute ${
                        align === "right" ? "right-0" : "left-0"
                    } top-full mt-2 w-[310px] sm:w-[325px] z-50 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/98 dark:bg-zinc-950/98 backdrop-blur-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150`}
                >
                    {/* Header Controls: Month, Year, Arrows */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                        <div className="flex items-center gap-1">
                            {/* Month Selector Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMonthPickerOpen(!isMonthPickerOpen);
                                        setIsYearPickerOpen(false);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-black text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    title="Choose month"
                                >
                                    <span>{MONTH_NAMES[viewMonth]}</span>
                                    <ChevronDown
                                        className={`h-3 w-3 text-zinc-400 transition-transform ${
                                            isMonthPickerOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {isMonthPickerOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-44 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1.5 z-60 grid grid-cols-3 gap-1 text-xs">
                                        {MONTH_NAMES.map((m, idx) => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => {
                                                    setViewMonth(idx);
                                                    setIsMonthPickerOpen(false);
                                                }}
                                                className={`py-1.5 px-1 rounded-lg font-bold text-center text-[11px] truncate transition-colors ${
                                                    idx === viewMonth
                                                        ? "bg-red-600 text-white shadow-xs"
                                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                                }`}
                                            >
                                                {m.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Year Selector Dropdown (Starts at 1850) */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsYearPickerOpen(!isYearPickerOpen);
                                        setIsMonthPickerOpen(false);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-black text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    title="Choose year (starts at 1850)"
                                >
                                    <span>{viewYear}</span>
                                    <ChevronDown
                                        className={`h-3 w-3 text-zinc-400 transition-transform ${
                                            isYearPickerOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {isYearPickerOpen && (
                                    <div
                                        ref={yearListRef}
                                        className="absolute top-full left-0 mt-1 max-h-56 w-44 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1.5 z-60 grid grid-cols-2 gap-1 text-xs"
                                    >
                                        {years.map((y) => {
                                            const isSelectedYear = y === viewYear;
                                            return (
                                                <button
                                                    key={y}
                                                    ref={isSelectedYear ? activeYearRef : null}
                                                    type="button"
                                                    onClick={() => {
                                                        setViewYear(y);
                                                        setIsYearPickerOpen(false);
                                                    }}
                                                    className={`py-1.5 px-2 rounded-lg font-bold text-center transition-colors ${
                                                        isSelectedYear
                                                            ? "bg-red-600 text-white shadow-xs"
                                                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                                    }`}
                                                >
                                                    {y}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Navigation Arrows */}
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-600 transition-colors"
                                aria-label="Previous month"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-600 transition-colors"
                                aria-label="Next month"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Quick Preset Shortcuts */}
                    {showShortcuts && (
                        <div className="flex items-center gap-1.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 overflow-x-auto">
                            <button
                                type="button"
                                onClick={handleSelectToday}
                                className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-900 dark:hover:bg-red-950/40 text-zinc-600 dark:text-zinc-300 transition-colors shrink-0"
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={handleSelectTomorrow}
                                className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-900 dark:hover:bg-red-950/40 text-zinc-600 dark:text-zinc-300 transition-colors shrink-0"
                            >
                                Tomorrow
                            </button>
                            {minDate && (
                                <span className="text-[10px] text-zinc-400 font-medium ml-auto">
                                    Upcoming departures
                                </span>
                            )}
                        </div>
                    )}

                    {/* Days of Week Header */}
                    <div className="grid grid-cols-7 gap-1 pt-3 text-center">
                        {WEEKDAYS.map((wd) => (
                            <span
                                key={wd}
                                className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 py-1"
                            >
                                {wd}
                            </span>
                        ))}
                    </div>

                    {/* Calendar Month Days Grid */}
                    <div className="grid grid-cols-7 gap-1 pt-1">
                        {/* Days from previous month */}
                        {Array.from({ length: firstDayIndex }).map((_, i) => {
                            const prevMonthDay = daysInPrevMonth - firstDayIndex + i + 1;
                            return (
                                <div
                                    key={`prev-${i}`}
                                    className="h-8 w-8 flex items-center justify-center text-xs font-semibold text-zinc-300 dark:text-zinc-700 select-none"
                                >
                                    {prevMonthDay}
                                </div>
                            );
                        })}

                        {/* Current month days */}
                        {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = formatToYYYYMMDD(viewYear, viewMonth, day);
                            const isSelected = value === dateStr;
                            const isToday = todayStr === dateStr;
                            const disabledDate = isDateDisabled(dateStr);

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    disabled={disabledDate}
                                    onClick={() => handleDateSelect(day)}
                                    className={`relative h-8 w-8 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                                        disabledDate
                                            ? "opacity-25 cursor-not-allowed text-zinc-400"
                                            : isSelected
                                            ? "bg-gradient-to-tr from-red-600 to-red-500 text-white font-black shadow-md shadow-red-600/30 scale-105"
                                            : isToday
                                            ? "border border-red-500 text-red-600 font-black hover:bg-red-50 dark:hover:bg-red-950/40"
                                            : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                                    }`}
                                >
                                    <span>{day}</span>
                                    {isToday && !isSelected && (
                                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-red-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer Actions: Clear & Close */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="font-bold text-zinc-500 hover:text-red-600 transition-colors py-1 px-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={handleSelectToday}
                            className="font-black text-red-600 hover:text-red-700 transition-colors py-1 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60"
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
