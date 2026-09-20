import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number; // percentage, e.g. +14.2 or -3.5
  changeLabel?: string;
  icon?: ReactNode;
  variant?: "default" | "brand" | "warning" | "critical";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  changeLabel = "vs yesterday",
  icon,
  variant = "default",
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-3.5 sm:p-5 shadow-card transition-all duration-200 hover:border-zinc-300 hover:shadow-subtle flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-zinc-50 text-zinc-600 border border-zinc-100 shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2 sm:mt-3 flex items-baseline justify-between gap-2">
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-charcoal-900 font-mono truncate">
          {value}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xs flex-wrap">
        {change !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] shrink-0",
              isPositive && "bg-emerald-50 text-emerald-700 font-mono",
              isNegative && "bg-red-50 text-red-700 font-mono",
              isNeutral && "bg-zinc-100 text-zinc-600 font-mono"
            )}
          >
            {isPositive && <TrendingUp className="w-3 h-3 text-emerald-600" />}
            {isNegative && <TrendingDown className="w-3 h-3 text-red-600" />}
            {isNeutral && <Minus className="w-3 h-3 text-zinc-500" />}
            {change > 0 ? `+${change}%` : `${change}%`}
          </span>
        )}

        <span className="text-zinc-400 font-normal text-[11px] sm:text-xs line-clamp-1">
          {subtitle || changeLabel}
        </span>
      </div>
    </div>
  );
}
