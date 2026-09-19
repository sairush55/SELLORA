"use client";

import React, { useState } from "react";
import { DateFilterPreset, DateRange } from "@/types/analytics";
import { Button } from "@/components/ui/Button";
import { Calendar, ArrowRight, Check } from "lucide-react";

interface DateFilterProps {
  currentRange: DateRange;
  onRangeChange: (preset: DateFilterPreset, customStart?: string, customEnd?: string) => void;
  isLoading?: boolean;
}

const PRIMARY_PRESETS: Array<{ value: DateFilterPreset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_year", label: "This Year" },
  { value: "custom", label: "Custom..." },
];

export function DateFilter({ currentRange, onRangeChange, isLoading }: DateFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<DateFilterPreset>(currentRange.preset);
  const [customStart, setCustomStart] = useState<string>(currentRange.startDate);
  const [customEnd, setCustomEnd] = useState<string>(currentRange.endDate);

  const handlePresetSelect = (preset: DateFilterPreset) => {
    setSelectedPreset(preset);
    if (preset !== "custom") {
      onRangeChange(preset);
    }
  };

  const handleApplyCustom = () => {
    onRangeChange("custom", customStart, customEnd);
  };

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-3 sm:p-3.5 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Presets Segmented Control */}
        <div className="flex flex-wrap items-center gap-1 bg-zinc-100/80 p-1 rounded-xl border border-zinc-200/60">
          {PRIMARY_PRESETS.map((p) => {
            const isActive = selectedPreset === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePresetSelect(p.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Custom Range Inputs & Period Label */}
        <div className="flex flex-wrap items-center gap-2.5">
          {selectedPreset === "custom" && (
            <div className="flex items-center gap-1.5 text-xs bg-zinc-50 p-1 rounded-lg border border-zinc-200">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-7 px-2 rounded border border-zinc-200 text-xs bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <ArrowRight className="w-3 h-3 text-zinc-400" />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-7 px-2 rounded border border-zinc-200 text-xs bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleApplyCustom}
                disabled={isLoading}
                className="h-7 px-2.5 text-xs"
              >
                Apply
              </Button>
            </div>
          )}

          {/* Active Date Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200/80">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>
              {currentRange.startDate} → {currentRange.endDate}
            </span>
            {currentRange.comparisonLabel && (
              <span className="text-[11px] font-sans text-zinc-400 border-l border-zinc-200 pl-2">
                vs {currentRange.comparisonLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
