"use client";

import React from "react";
import Link from "next/link";
import { WorkflowVisual } from "./WorkflowVisual";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Boxes,
  TrendingUp,
  AlertTriangle,
  Receipt,
  CheckCircle2,
} from "lucide-react";

export function HeroSection() {
  const { loginDemo } = useAuth();

  return (
    <section className="relative w-full pt-28 sm:pt-36 pb-20 sm:pb-24 bg-gradient-to-b from-[#FAFAFA] via-white to-zinc-50/60 overflow-hidden">
      {/* Background radial glow & architectural dot grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[42rem] h-[26rem] glow-accent blur-[140px] opacity-70" />
        <div className="absolute inset-0 bg-dot-pattern-light opacity-60" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Asymmetric Hero Grid: 1.1fr / 0.9fr */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-14 items-center">
          {/* Left Column: Hero Typography & Actions */}
          <div className="flex flex-col items-start text-left">
            {/* Minimalist Modern Section Label Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/5 backdrop-blur-xs mb-6 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-emerald-800 font-semibold">
                Autonomous Retail Intelligence
              </span>
            </div>

            {/* Display Headline with Calistoga */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.65rem] font-normal text-charcoal-950 tracking-tight leading-[1.08]">
              Turn every sale into a{" "}
              <span className="relative inline-block mt-1 sm:mt-0">
                <span className="gradient-text">smarter stock decision.</span>
                <span className="gradient-underline" />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-zinc-600 font-normal leading-relaxed max-w-xl">
              SELLORA connects high-velocity POS billing, automated inventory reconciliation,
              and stock intelligence to give small merchants crystal-clear control over what sells,
              what runs out, and what to reorder.
            </p>

            {/* CTA Action Row */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
              <Link href="/signup">
                <button
                  type="button"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-110 shadow-accent hover:shadow-accent-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Start Managing Your Shop</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>

              <button
                type="button"
                onClick={() => loginDemo()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-zinc-800 bg-white border border-zinc-300/90 hover:bg-zinc-50 hover:border-zinc-400 shadow-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Experience Demo Store</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 pt-6 border-t border-zinc-200/80 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-zinc-500 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Built for Indian Retailers
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-600" /> Native ₹ INR & GST
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-zinc-400" /> 0 Manual Stock Counts
              </span>
            </div>
          </div>

          {/* Right Column: Animated Generative Hero Graphic */}
          <div className="relative w-full h-[430px] sm:h-[460px] flex items-center justify-center">
            {/* Rotating Decorative Outer Ring (60s linear infinite) */}
            <div className="absolute w-[360px] sm:w-[410px] h-[360px] sm:h-[410px] rounded-full border border-dashed border-zinc-300/70 animate-spin-slow pointer-events-none" />

            {/* Inner Accent Ring */}
            <div className="absolute w-[280px] sm:w-[320px] h-[280px] sm:h-[320px] rounded-full border border-emerald-500/15 pointer-events-none" />

            {/* Ambient Radial Glow */}
            <div className="absolute w-64 h-64 glow-accent blur-[80px] rounded-full pointer-events-none" />

            {/* Central Elevated Terminal Card */}
            <div className="relative z-10 w-[310px] sm:w-[340px] rounded-2xl bg-white border border-zinc-200/90 shadow-2xl p-5 space-y-4">
              {/* Terminal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-charcoal-950 text-emerald-400 flex items-center justify-center">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-mono font-bold text-xs text-charcoal-950 block">
                      POS #INV-8492
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Counter 01 • 14:32 IST</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                  PAID UPI
                </span>
              </div>

              {/* Rung Up Items Preview */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-dashed border-zinc-100">
                  <span className="text-zinc-800 font-medium truncate max-w-[170px]">
                    Tata Tea Gold 500g
                  </span>
                  <span className="font-mono font-semibold text-zinc-900">₹320.00</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-dashed border-zinc-100">
                  <span className="text-zinc-800 font-medium truncate max-w-[170px]">
                    Fortune Sunlite Oil 1L
                  </span>
                  <span className="font-mono font-semibold text-zinc-900">₹145.00</span>
                </div>
              </div>

              {/* Live Sync Confirmation */}
              <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[10px] text-zinc-600 font-medium">
                    Inventory Auto-Reconciled
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold text-emerald-700">0.08s</span>
              </div>
            </div>

            {/* Floating Live Card 1 (Top Right): Reorder Alert */}
            <div className="absolute -top-3 right-0 sm:right-2 z-20 w-56 p-3.5 rounded-xl bg-white border border-amber-200/90 shadow-xl animate-float-slow">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Reorder Radar
                </span>
              </div>
              <p className="text-xs font-bold text-zinc-900 truncate">Aashirvaad Atta 10kg</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Stock: 4 bags • Suggested: <span className="font-bold text-emerald-700">+25</span>
              </p>
            </div>

            {/* Floating Live Card 2 (Bottom Left): Capital Recovery */}
            <div className="absolute -bottom-4 left-0 sm:left-2 z-20 w-60 p-3.5 rounded-xl bg-charcoal-950 border border-zinc-800 text-white shadow-xl animate-float-reverse">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> STOCK VELOCITY
                </span>
                <span className="font-mono text-[9px] text-zinc-400">30d analysis</span>
              </div>
              <p className="text-xs font-bold text-white">₹19,570 Idle Capital Recovered</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Automated bundle promo generated</p>
            </div>
          </div>
        </div>

        {/* Workflow Section Below Hero */}
        <div id="workflow" className="mt-20 sm:mt-24 pt-12 border-t border-zinc-200/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-800">
                  Continuous Feedback Engine
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-charcoal-950 font-normal tracking-tight">
                The 5-Step Retail Intelligence Loop
              </h2>
            </div>
            <p className="mt-2 sm:mt-0 text-xs sm:text-sm text-zinc-500 max-w-sm">
              Every ring-up automatically cascades into replenishment forecasting.
            </p>
          </div>

          <WorkflowVisual />
        </div>
      </div>
    </section>
  );
}
