"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  Boxes,
  TrendingUp,
  AlertTriangle,
  RefreshCcw,
  ArrowRight,
  CheckCircle2,
  Zap,
  Play,
  Pause,
  Store,
  Clock,
  Send,
  Barcode,
  Layers,
} from "lucide-react";

interface StepData {
  step: string;
  title: string;
  subtitle: string;
  desc: string;
  icon: React.ElementType;
  stat: string;
  outputLabel: string;
  metric: string;
  simulation: {
    badge: string;
    headline: string;
    detail: string;
    tags: string[];
    actionLabel: string;
    icon: React.ElementType;
  };
}

const steps: StepData[] = [
  {
    step: "01",
    title: "BILL",
    subtitle: "POS Ring-Up",
    desc: "Instant counter checkout via barcode, shortcuts, or touch.",
    icon: Receipt,
    stat: "<2.4s per bill",
    outputLabel: "LATENCY",
    metric: "0.08s ring-up",
    simulation: {
      badge: "LIVE POS STREAM",
      headline: "Barcode scanned: Fortune Sunlite Oil 1L",
      detail: "GST #29AABCS1429 • Unit price ₹145.00 auto-calculated with batch MRP check. Cashier ring-up latency 0.08s.",
      tags: ["Barcode EAN-13", "UPI Auto-QR", "Thermal Receipt Ready"],
      actionLabel: "View POS Terminal Demo",
      icon: Barcode,
    },
  },
  {
    step: "02",
    title: "INVENTORY",
    subtitle: "Instant Sync",
    desc: "Every item rung up automatically reconciles live store counts.",
    icon: Boxes,
    stat: "0 manual tallies",
    outputLabel: "ACCURACY",
    metric: "100% real-time",
    simulation: {
      badge: "AUTO-RECONCILIATION",
      headline: "Stock auto-decremented: 48 → 47 units",
      detail: "Front-counter register deducted bottle in 12ms. Multi-shelf reserve balance updated without manual counting.",
      tags: ["FIFO Ledger", "Zero Discrepancy", "Batch #BN-204"],
      actionLabel: "Check Inventory Ledger",
      icon: Layers,
    },
  },
  {
    step: "03",
    title: "ANALYZE",
    subtitle: "Velocity Run-Rate",
    desc: "Tracks turn rates, margins, and peak purchasing time windows.",
    icon: TrendingUp,
    stat: "Live run-rate",
    outputLabel: "TURNOVER",
    metric: "14.2 units / day",
    simulation: {
      badge: "ALGORITHMIC VELOCITY",
      headline: "Sales velocity: 14.2 units/day (Peak: 5-8 PM)",
      detail: "Run-rate calculated across last 14 days of store sales. Projected shelf runout in 3.3 days at current consumption rate.",
      tags: ["Runout In 3.3 Days", "Margin: 18.5%", "High Velocity SKU"],
      actionLabel: "Inspect Analytics Curve",
      icon: TrendingUp,
    },
  },
  {
    step: "04",
    title: "ALERT",
    subtitle: "Stockout Radar",
    desc: "Flags low stock before shelves run dry and isolates dead capital.",
    icon: AlertTriangle,
    stat: "Early warning",
    outputLabel: "THRESHOLD",
    metric: "Alert at 12 units",
    simulation: {
      badge: "PROACTIVE WARNING",
      headline: "Low stock threshold breached: 11 units remaining",
      detail: "Safety buffer alert triggered 48 hours prior to empty shelf. Dead capital flagged on adjacent slow-moving brands.",
      tags: ["Lead Time: 2 Days", "Buffer Risk: Elevated", "Supplier: ABC Wholesalers"],
      actionLabel: "Review Stock Radar",
      icon: AlertTriangle,
    },
  },
  {
    step: "05",
    title: "REORDER",
    subtitle: "Smart Ordering",
    desc: "Generates optimal reorder quantities matched to lead days.",
    icon: RefreshCcw,
    stat: "PO in 1-click",
    outputLabel: "PURCHASE ORDER",
    metric: "30 units suggested",
    simulation: {
      badge: "1-CLICK REPLENISHMENT",
      headline: "Draft PO generated: 30 units (₹3,450.00)",
      detail: "Optimal batch size calculated to cover 12 days of sales + safety cushion. Ready to dispatch via 1-click WhatsApp or PDF.",
      tags: ["Optimal Batch 30 Units", "WhatsApp Dispatch", "Vendor Terms: Net 15"],
      actionLabel: "Draft Reorder PO",
      icon: Send,
    },
  },
];

export function WorkflowVisual() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-cycle through the 5 steps
  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3800);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying]);

  const currentStep = steps[activeStep];
  const CurrentSimIcon = currentStep.simulation.icon;

  return (
    <div className="w-full">
      {/* Interactive Controls & Loop Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAutoPlaying((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium border border-zinc-200 bg-white text-zinc-700 hover:border-amber-400 hover:text-amber-700 transition-all shadow-2xs cursor-pointer"
            title={isAutoPlaying ? "Pause auto-cycle" : "Play auto-cycle"}
          >
            {isAutoPlaying ? (
              <>
                <Pause className="w-3 h-3 text-amber-600" />
                <span>Pause Auto-Loop</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-amber-600 fill-amber-600" />
                <span>Resume Auto-Loop</span>
              </>
            )}
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500">
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 ${
                  isAutoPlaying ? "animate-ping" : ""
                }`}
              />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            Active Stage: <strong className="text-zinc-900 font-semibold">{currentStep.title}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs font-mono text-zinc-400">
          <span>Click any step to inspect</span>
          <span className="hidden sm:inline">• Stage {activeStep + 1} of 5</span>
        </div>
      </div>

      {/* Process Connecting Pipeline Track (Desktop) */}
      <div className="relative mb-3 hidden lg:block px-6">
        <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden relative">
          {/* Animated Connecting Pulse Line */}
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{
              width: `${((activeStep + 1) / steps.length) * 100}%`,
            }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* 5 Step Nodes on Pipeline */}
        <div className="absolute top-1/2 -translate-y-1/2 left-6 right-6 flex justify-between pointer-events-none">
          {steps.map((s, idx) => (
            <div
              key={s.step}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                idx <= activeStep
                  ? "bg-amber-500 border-white shadow-sm ring-2 ring-amber-400/40"
                  : "bg-zinc-200 border-white"
              }`}
            />
          ))}
        </div>
      </div>

      {/* The 5 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 relative">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          const isActive = idx === activeStep;

          return (
            <motion.div
              key={item.title}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setActiveStep(idx);
                setIsAutoPlaying(false);
              }}
              className={`relative flex flex-col justify-between p-4.5 sm:p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 select-none ${
                isActive
                  ? "bg-white border-amber-400/90 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/20"
                  : "bg-white/95 border-zinc-200/90 shadow-2xs hover:border-amber-300 hover:shadow-md"
              }`}
            >
              {/* Active Step Ambient Glow Accent */}
              {isActive && (
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-amber-400/15 via-transparent to-transparent blur-xs pointer-events-none" />
              )}

              {/* Step Progress Fill on Active Card */}
              {isActive && isAutoPlaying && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-100 rounded-t-2xl overflow-hidden">
                  <motion.div
                    key={`progress-${idx}`}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3.8, ease: "linear" }}
                    className="h-full bg-amber-400"
                  />
                </div>
              )}

              {/* Card Header & Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3.5">
                  <span
                    className={`font-mono text-xs font-black transition-colors ${
                      isActive ? "text-amber-700" : "text-zinc-400"
                    }`}
                  >
                    {item.step}
                  </span>

                  {/* Icon Container with Interactive Styling */}
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-charcoal-950 shadow-sm scale-105"
                        : "bg-zinc-50 border border-zinc-200/80 text-zinc-700 group-hover:bg-amber-50 group-hover:text-amber-800"
                    }`}
                  >
                    <Icon
                      className={`w-4.5 h-4.5 transition-transform duration-300 ${
                        isActive && item.title === "REORDER" ? "animate-spin-slow" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Titles */}
                <div className="mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-mono font-black text-xs tracking-wider uppercase block ${
                        isActive ? "text-amber-900" : "text-charcoal-950"
                      }`}
                    >
                      {item.title}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-zinc-800 mt-0.5">{item.subtitle}</p>
                </div>

                <p className="text-[11px] sm:text-xs text-zinc-500 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              {/* Output Metric Chip */}
              <div className="relative z-10 mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[10px]">
                <span className="font-mono text-zinc-400 uppercase tracking-wider text-[9px]">
                  Output
                </span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded-md border transition-all ${
                    isActive
                      ? "text-amber-900 bg-amber-50 border-amber-300/80 shadow-2xs"
                      : "text-zinc-700 bg-zinc-50 border-zinc-200/70"
                  }`}
                >
                  {item.stat}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Live Simulation Pane (Expands when step selected) */}
      <div className="mt-5 sm:mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="p-5 sm:p-6 rounded-2xl bg-white border border-amber-200/90 shadow-md shadow-amber-500/5 relative overflow-hidden"
          >
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-64 h-32 bg-amber-100/40 blur-2xl pointer-events-none rounded-full" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
              {/* Left Details */}
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[10px] font-bold uppercase tracking-wider">
                    <CurrentSimIcon className="w-3 h-3 text-amber-600" />
                    <span>{currentStep.simulation.badge}</span>
                  </div>

                  <span className="text-xs text-zinc-400 font-mono">
                    Step {currentStep.step} of 05 • {currentStep.title}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                  <span>{currentStep.simulation.headline}</span>
                </h3>

                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
                  {currentStep.simulation.detail}
                </p>

                {/* Feature Tags */}
                <div className="pt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {currentStep.simulation.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200/80 text-zinc-700 text-[10px] sm:text-xs font-medium"
                    >
                      <CheckCircle2 className="w-3 h-3 text-amber-600" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Summary Card & Quick Switchers */}
              <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100 shrink-0">
                <div className="text-left md:text-right">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 block">
                    {currentStep.outputLabel}
                  </span>
                  <span className="font-mono text-base sm:text-lg font-black text-amber-700 block mt-0.5">
                    {currentStep.metric}
                  </span>
                </div>

                {/* Next / Previous Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStep((prev) => (prev - 1 + steps.length) % steps.length);
                      setIsAutoPlaying(false);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-medium cursor-pointer transition-colors"
                  >
                    ← Prev
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveStep((prev) => (prev + 1) % steps.length);
                      setIsAutoPlaying(false);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-400 hover:bg-amber-500 text-charcoal-950 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

