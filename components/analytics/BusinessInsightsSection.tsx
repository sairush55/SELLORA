"use client";

import React from "react";
import { BusinessInsight } from "@/types/analytics";
import { TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";

interface BusinessInsightsSectionProps {
  insights: BusinessInsight[];
}

export function BusinessInsightsSection({
  insights,
}: BusinessInsightsSectionProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  // Take the primary insight to keep the interface lightweight and readable
  const primaryInsight = insights[0];

  const getIcon = (severity: BusinessInsight["severity"]) => {
    if (severity === "warning") {
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
    if (severity === "positive") {
      return <TrendingUp className="w-4 h-4 text-amber-600" />;
    }
    return <Lightbulb className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500 text-charcoal-950 flex items-center justify-center shrink-0 shadow-2xs">
          {getIcon(primaryInsight.severity)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-900">
              {primaryInsight.title || "Smart Business Observation"}
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-900">
              Active Store Insight
            </span>
          </div>
          <p className="text-xs text-zinc-600 mt-0.5 leading-snug">
            {primaryInsight.message}
          </p>
        </div>
      </div>

      {primaryInsight.metric && (
        <span className="self-start sm:self-auto text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-900 shadow-2xs shrink-0">
          {primaryInsight.metric}
        </span>
      )}
    </div>
  );
}
