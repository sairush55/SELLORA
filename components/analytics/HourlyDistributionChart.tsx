"use client";

import React from "react";
import { HourlySalesStat } from "@/types/analytics";
import { formatINR } from "@/lib/utils";
import { Clock, Zap } from "lucide-react";

interface HourlyDistributionChartProps {
  data: HourlySalesStat[];
}

export function HourlyDistributionChart({ data }: HourlyDistributionChartProps) {
  const maxRevenue = Math.max(1, ...data.map((d) => d.revenue));
  const peakHour = [...data].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-2xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-charcoal-950">
              Sales by Hour (24h Velocity)
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              <Zap className="w-3 h-3 text-amber-600" />
              Peak: {peakHour?.label} ({formatINR(peakHour?.revenue || 0)})
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Turnover profile across operating hours to optimize staff scheduling
          </p>
        </div>
      </div>

      <div className="mt-4 w-full overflow-hidden">
        {/* Hourly Bars */}
        <div className="h-44 w-full flex items-end gap-1 sm:gap-1.5 pt-4 pb-2 min-w-0">
          {data.map((point) => {
            const heightPct = Math.max(4, Math.round((point.revenue / maxRevenue) * 100));
            const isPeak = point.hour === peakHour?.hour && point.revenue > 0;

            return (
              <div
                key={point.hour}
                className="flex-1 min-w-0 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              >
                {/* Tooltip */}
                <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-charcoal-950 text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  {point.label}: {formatINR(point.revenue)} ({point.bills} orders)
                </div>

                {/* The Bar */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[20px] mx-auto rounded-t-xs transition-all ${
                    isPeak
                      ? "bg-amber-500 hover:bg-amber-600 shadow-xs"
                      : point.revenue > 0
                      ? "bg-charcoal-800 hover:bg-emerald-600 opacity-90"
                      : "bg-zinc-100 opacity-50"
                  }`}
                />

                {/* Label (every 3 hours to avoid overcrowding) */}
                <div className="text-[8px] sm:text-[9px] text-zinc-400 group-hover:text-zinc-900 group-hover:font-semibold mt-1.5 truncate font-mono">
                  {point.hour % 3 === 0 ? point.label : "·"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-100 mt-1 font-mono">
          <span>Morning Shift (8 AM - 1 PM)</span>
          <span>Afternoon Shift (1 PM - 6 PM)</span>
          <span>Evening Rush (6 PM - 10 PM)</span>
        </div>
      </div>
    </div>
  );
}
