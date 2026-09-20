"use client";

import React from "react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import {
  TrendingUp,
  Receipt,
  Boxes,
  Store,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function ExecutivePreview() {
  const { loginDemo } = useAuth();

  return (
    <section id="intelligence" className="relative w-full py-20 sm:py-28 bg-white border-t border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/5 mb-3">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-brand-800 font-semibold">
              Live Terminal Interface
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-charcoal-950 font-normal tracking-tight">
            Maximum clarity under merchant pressure.
          </h2>
          <p className="mt-3 text-sm text-zinc-500 max-w-xl mx-auto">
            High density, restrained typography, and immediate actionable decisions for busy shop counters.
          </p>
        </div>

        {/* Mock Executive Dashboard Frame with Subtle Gradient Border */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white shadow-2xl overflow-hidden mb-24">
          {/* Mock Browser/App Header Bar */}
          <div className="h-11 bg-zinc-100/90 border-b border-zinc-200/80 px-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
              <span className="ml-3 font-mono text-[11px] text-zinc-500 font-medium">
                sellora.app/dashboard • Ravi Stores
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="font-mono text-[10px] text-brand-800 font-bold tracking-wider uppercase">
                Continuous Sync Engine
              </span>
            </div>
          </div>

          {/* Mini Dashboard Content Preview */}
          <div className="p-6 md:p-8 space-y-6 bg-zinc-50/60">
            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4.5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
                <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Today&apos;s Sales
                </span>
                <p className="text-xl font-bold font-mono text-charcoal-950 mt-1">
                  {formatINR(48920)}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md mt-2">
                  <TrendingUp className="w-3 h-3" /> +14.2% vs yesterday
                </span>
              </div>

              <div className="p-4.5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
                <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Bills Created
                </span>
                <p className="text-xl font-bold font-mono text-charcoal-950 mt-1">
                  142 bills
                </p>
                <span className="text-[10px] text-zinc-500 mt-2 block font-mono">
                  Avg Ticket: {formatINR(344)}
                </span>
              </div>

              <div className="p-4.5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
                <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Items Sold
                </span>
                <p className="text-xl font-bold font-mono text-charcoal-950 mt-1">
                  388 units
                </p>
                <span className="text-[10px] text-zinc-500 mt-2 block font-mono">
                  Across 6 categories
                </span>
              </div>

              <div className="p-4.5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
                <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Inventory Value
                </span>
                <p className="text-xl font-bold font-mono text-charcoal-950 mt-1">
                  {formatINR(845200)}
                </p>
                <span className="text-[10px] text-zinc-500 mt-2 block font-mono">
                  420 active SKUs
                </span>
              </div>
            </div>

            {/* Split row: Reorders & Intelligence */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Recommended Orders Preview */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">
                      Recommended Orders (Stock Intelligence)
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Computed from sales run-rate and supplier lead times
                    </p>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    2 Urgent
                  </span>
                </div>

                <div className="divide-y divide-zinc-100 text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900">
                        Aashirvaad Atta 10kg
                      </p>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        Stock: 4 bags • Safety: 15
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200/60">
                        Reorder: +25 bags
                      </span>
                    </div>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900">Tata Salt 1kg</p>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        Stock: 6 pkts • Safety: 24
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200/60">
                        Reorder: +50 pkts
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Insight Callout */}
              <div className="p-5 rounded-2xl bg-charcoal-950 text-white flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-brand-400 font-semibold mb-2">
                    <Lightbulb className="w-3.5 h-3.5" />
                    AUTONOMOUS INSIGHT
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">
                    Working Capital Optimization
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                    ₹19,570 is currently locked in 4 slow-moving gourmet SKUs with zero
                    sales over 30 days. Automated promotional bundling recommended.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-zinc-400">Action: Bundle Promo</span>
                  <button
                    type="button"
                    onClick={() => loginDemo()}
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
                  >
                    Open in Demo <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Footer Bar */}
          <div className="p-4 px-6 bg-white border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-600 font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Full terminal is interactive with demo store data right now.</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => loginDemo()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-charcoal-950 hover:bg-charcoal-800 transition-all cursor-pointer shadow-xs"
              >
                <span>Launch Interactive Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Signature Final CTA Section (Minimalist Modern Inverted Block) */}
        <div className="relative rounded-3xl bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-950 text-white p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl">
          {/* Subtle dot pattern & ambient glow */}
          <div className="absolute inset-0 bg-dot-pattern-dark pointer-events-none opacity-60" />
          <div className="absolute top-0 right-0 w-80 h-80 glow-accent blur-[120px] opacity-40 pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-brand-400/25 bg-brand-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-brand-300 font-semibold">
                Start Today
              </span>
            </div>

            <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight leading-[1.12]">
              Ready to turn your sales into smarter stock decisions?
            </h3>

            <p className="text-sm sm:text-base text-zinc-300 max-w-lg mx-auto font-normal leading-relaxed">
              Register your shop in under 60 seconds with an empty, isolated database — or test our live demo terminal.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link href="/signup" className="w-full sm:w-auto">
                <button
                  type="button"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-extrabold text-charcoal-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-105 hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Register Your Shop</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>

              <button
                type="button"
                onClick={() => loginDemo()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition-all cursor-pointer"
              >
                <Store className="w-4 h-4 text-brand-400" />
                <span>Try Demo Store</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
