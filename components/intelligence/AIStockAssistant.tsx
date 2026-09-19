"use client";

import React, { useState } from "react";
import { AIStockAnswer, AISummaryQuery } from "@/types/stockIntelligence";
import { stockIntelligenceAIService } from "@/services/stockIntelligenceAIService";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  Send,
  HelpCircle,
  AlertTriangle,
  TrendingUp,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCw,
} from "lucide-react";

interface AIStockAssistantProps {
  shopId: string;
}

const PRESET_QUERIES: Array<{ type: AISummaryQuery; label: string; icon: React.ElementType }> = [
  { type: "what_to_order", label: "What should I order today?", icon: ShoppingBag },
  { type: "at_risk", label: "Which products are at risk?", icon: AlertTriangle },
  { type: "monthly_performance", label: "How did my shop perform this month?", icon: TrendingUp },
  { type: "slow_moving", label: "Which products are slow-moving?", icon: Clock },
];

export function AIStockAssistant({ shopId }: AIStockAssistantProps) {
  const [customQuery, setCustomQuery] = useState("");
  const [activeAnswer, setActiveAnswer] = useState<AIStockAnswer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRunQuery = async (type: AISummaryQuery, customText?: string) => {
    setIsLoading(true);
    try {
      const ans = await stockIntelligenceAIService.generateBusinessSummary(
        shopId,
        type,
        customText
      );
      setActiveAnswer(ans);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    handleRunQuery("custom" as any, customQuery.trim());
  };

  return (
    <div className="bg-gradient-to-br from-charcoal-900 via-charcoal-950 to-charcoal-900 text-white rounded-2xl p-4 sm:p-6 shadow-md border border-charcoal-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              SELLORA AI Stock Advisor
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Grounded on Live Database
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Natural-language explanations derived strictly from verified inventory calculations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Deterministic Verification Mode</span>
        </div>
      </div>

      {/* Preset Query Buttons */}
      <div className="flex flex-wrap items-center gap-2 my-4">
        <span className="text-xs font-semibold text-zinc-400 mr-1">Ask Advisor:</span>
        {PRESET_QUERIES.map((q) => {
          const Icon = q.icon;
          return (
            <button
              key={q.type}
              type="button"
              onClick={() => handleRunQuery(q.type)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-200 hover:text-white border border-white/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <Icon className="w-3.5 h-3.5 text-brand-400" />
              {q.label}
            </button>
          );
        })}
      </div>

      {/* Custom Question Input Form */}
      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <input
          type="text"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder="Ask a specific inventory question, e.g. 'Why is Atta prioritized?' or 'What is my procurement total?'"
          className="flex-1 h-9 px-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-brand-400 focus:bg-white/10 transition-colors"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isLoading || !customQuery.trim()}
          className="h-9 px-4 text-xs font-semibold gap-1.5 shadow-2xs"
        >
          {isLoading ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          Ask AI
        </Button>
      </form>

      {/* AI Response Display Box */}
      {activeAnswer && (
        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-xs leading-relaxed animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-white/10">
            <span className="font-semibold text-brand-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Q: {activeAnswer.query}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {new Date(activeAnswer.generatedAt).toLocaleTimeString("en-IN")}
            </span>
          </div>

          {/* Render Markdown-like bold formatting cleanly */}
          <div className="text-zinc-200 whitespace-pre-line leading-relaxed space-y-2">
            {activeAnswer.answer}
          </div>

          {/* Grounded Metrics Badge Strip */}
          {activeAnswer.groundedMetrics && (
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400">
              <span>
                Actionable Orders:{" "}
                <strong className="text-white">
                  {activeAnswer.groundedMetrics.actionableCount}
                </strong>
              </span>
              <span>•</span>
              <span>
                Est. Procurement:{" "}
                <strong className="text-emerald-400">
                  ₹{activeAnswer.groundedMetrics.totalProcurementCost.toLocaleString("en-IN")}
                </strong>
              </span>
              <span>•</span>
              <span>
                Critical SKUs:{" "}
                <strong className="text-amber-400">
                  {activeAnswer.groundedMetrics.criticalSkus.length}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
