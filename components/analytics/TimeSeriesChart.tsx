"use client";

import React, { useState } from "react";
import { TimeSeriesPoint, TimeGranularity } from "@/types/analytics";
import { formatINR } from "@/lib/utils";
import { BarChart3, LineChart, TrendingUp, Layers } from "lucide-react";

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  granularity: TimeGranularity;
  title?: string;
  subtitle?: string;
}

type ChartMetric = "revenue" | "units" | "bills" | "avgBill";

export function TimeSeriesChart({
  data,
  granularity,
  title = "Sales Velocity Over Time",
  subtitle = "Granular progression of store performance metrics",
}: TimeSeriesChartProps) {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>("revenue");
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200/80 p-6 text-center text-xs text-zinc-400">
        No sales records found for this period.
      </div>
    );
  }

  // Calculate maximum for scaling
  const values = data.map((d) => d[activeMetric]);
  const maxValue = Math.max(1, ...values);

  const formatMetricValue = (val: number): string => {
    switch (activeMetric) {
      case "revenue":
      case "avgBill":
        return formatINR(val);
      case "units":
        return `${val.toLocaleString("en-IN")} units`;
      case "bills":
        return `${val.toLocaleString("en-IN")} bills`;
    }
  };

  const getMetricColor = (metric: ChartMetric) => {
    switch (metric) {
      case "revenue":
        return "bg-charcoal-900 hover:bg-amber-500";
      case "units":
        return "bg-amber-500 hover:bg-amber-600";
      case "bills":
        return "bg-blue-600 hover:bg-blue-700";
      case "avgBill":
        return "bg-amber-600 hover:bg-amber-700";
    }
  };

  const isDense = data.length > 14;

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-2xs flex flex-col justify-between overflow-hidden">
      {/* Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-charcoal-950">{title}</h3>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold">
              {granularity}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Metric Switcher Pills */}
        <div className="flex items-center rounded-lg border border-zinc-200 p-0.5 bg-zinc-50 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveMetric("revenue")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeMetric === "revenue"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Revenue
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric("units")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeMetric === "units"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Units
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric("bills")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeMetric === "bills"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Bills
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric("avgBill")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeMetric === "avgBill"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Avg Bill
          </button>
        </div>
      </div>

      {/* Floating Value Banner */}
      <div className="flex items-center justify-between py-2 text-xs text-zinc-500 my-2 px-1">
        <div>
          {hoveredPoint ? (
            <span className="font-semibold text-charcoal-950">
              {hoveredPoint.label}:{" "}
              <span className="font-mono text-emerald-700 font-bold">
                {formatMetricValue(hoveredPoint[activeMetric])}
              </span>{" "}
              <span className="text-zinc-400 font-normal">
                ({hoveredPoint.bills} bills, {hoveredPoint.units} units)
              </span>
            </span>
          ) : (
            <span>Hover over any bar to inspect specific interval values</span>
          )}
        </div>
        <div className="font-mono text-[11px] text-zinc-400">
          Max interval: {formatMetricValue(maxValue)}
        </div>
      </div>

      {/* Chart Canvas with Proper Bounds & Sizing */}
      <div className="relative pt-4 pb-2 w-full overflow-hidden">
        <div className="h-56 w-full flex items-end gap-1 sm:gap-1.5 min-w-0">
          {data.map((point, idx) => {
            const val = point[activeMetric];
            const heightPct = Math.max(4, Math.round((val / maxValue) * 100));
            // In dense mode, only show label periodically or on first/last
            const showLabel = !isDense || idx % 3 === 0 || idx === data.length - 1;

            return (
              <div
                key={point.key}
                className="flex-1 min-w-0 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-charcoal-950 text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  {point.label}: {formatMetricValue(val)}
                </div>

                {/* The Bar with Constrained Max Width */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[24px] rounded-t-xs transition-all mx-auto ${getMetricColor(
                    activeMetric
                  )} ${val === 0 ? "opacity-20" : "opacity-90 group-hover:opacity-100"}`}
                />

                {/* X-Axis Label */}
                <div className="text-[8px] sm:text-[9px] text-zinc-400 group-hover:text-zinc-900 group-hover:font-semibold mt-2 truncate w-full text-center h-4 flex items-center justify-center font-mono">
                  {showLabel ? point.label : "·"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
