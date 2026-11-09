import React from "react";
import { Bus, Crown, Sparkles, Bath, Armchair } from "lucide-react";

export interface BusBadgeProps {
    busType?: string | null;
    busNumber?: string | null;
    seatCapacity?: number | null;
    fare?: number | null;
    showFare?: boolean;
    showFeatures?: boolean;
    size?: "xs" | "sm" | "md" | "lg";
    className?: string;
}

export function normalizeBusType(input?: string | null): "REGULAR_AIRCON" | "SUPER_DELUXE" | "FIRST_CLASS" {
    if (!input) return "REGULAR_AIRCON";
    const str = input.toUpperCase().replace(/[-_]/g, " ").trim();
    if (str.includes("FIRST")) return "FIRST_CLASS";
    if (str.includes("SUPER") || str.includes("DELUXE")) return "SUPER_DELUXE";
    return "REGULAR_AIRCON";
}

export function BusClassificationBadge({
    busType,
    busNumber,
    seatCapacity,
    fare,
    showFare = false,
    showFeatures = false,
    size = "sm",
    className = "",
}: BusBadgeProps) {
    const norm = normalizeBusType(busType);

    const config = {
        REGULAR_AIRCON: {
            title: "Regular Aircon",
            shortLabel: "Regular A/C",
            capacity: seatCapacity || 49,
            defaultFare: 850,
            hasCR: false,
            badgeBg: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800",
            icon: <Bus className="h-3 w-3 shrink-0" />,
            accentText: "text-blue-700 dark:text-blue-300",
            featureTag: "49 Seats • 2x2",
        },
        SUPER_DELUXE: {
            title: "Super Deluxe",
            shortLabel: "Deluxe w/ CR",
            capacity: seatCapacity || 43,
            defaultFare: 950,
            hasCR: true,
            badgeBg: "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700",
            icon: <Sparkles className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />,
            accentText: "text-amber-700 dark:text-amber-400",
            featureTag: "43 Seats • With CR",
        },
        FIRST_CLASS: {
            title: "First Class Premier",
            shortLabel: "First Class",
            capacity: seatCapacity || 41,
            defaultFare: 1100,
            hasCR: true,
            badgeBg: "bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-700",
            icon: <Crown className="h-3 w-3 shrink-0 text-purple-600 dark:text-purple-400" />,
            accentText: "text-purple-700 dark:text-purple-400",
            featureTag: "41 Sleeper • With CR",
        },
    }[norm];

    const displayFare = fare || config.defaultFare;

    const sizeClasses = {
        xs: "text-[9px] px-1.5 py-0.5 gap-1",
        sm: "text-[10px] px-2 py-0.5 gap-1.5",
        md: "text-xs px-2.5 py-1 gap-1.5",
        lg: "text-sm px-3.5 py-1.5 gap-2",
    }[size];

    return (
        <span
            className={`inline-flex items-center font-black uppercase tracking-wider rounded-md border shadow-xs select-none ${config.badgeBg} ${sizeClasses} ${className}`}
        >
            {config.icon}
            <span>{config.title}</span>
            {showFeatures && (
                <span className="opacity-80 font-mono text-[9px] lowercase">
                    ({config.featureTag})
                </span>
            )}
            {showFare && (
                <span className={`font-mono font-black ml-1 ${config.accentText}`}>
                    ₱{displayFare.toLocaleString()}
                </span>
            )}
        </span>
    );
}

