import React from "react";
import {
  ReceiptText,
  Boxes,
  Zap,
  TrendingUp,
  BrainCircuit,
  Bot,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export function FeatureGrid() {
  const stats = [
    {
      value: "100%",
      label: "Real-Time Stock Sync",
      detail: "Zero manual deductions or end-of-day spreadsheets",
    },
    {
      value: "<2.4s",
      label: "Counter Checkout Speed",
      detail: "Barcode scanning & quick hotkeys for rush queues",
    },
    {
      value: "1-Click",
      label: "AI Purchase Orders",
      detail: "Matched to historical velocity & supplier lead times",
    },
    {
      value: "₹ Native",
      label: "Full INR & GST Compliance",
      detail: "Calibrated for Indian grocery, supermarket & FMCG",
    },
  ];

  const features = [
    {
      title: "Smart Billing",
      category: "Point of Sale",
      description:
        "Engineered for sub-second counter speed. Barcode scanning, instant search, and split tender modes across Cash, UPI, and Card.",
      icon: ReceiptText,
      badge: "Instant Ring-Up",
      metric: "<2.4s per bill",
    },
    {
      title: "Automatic Inventory",
      category: "Reconciliation",
      description:
        "Every receipt line item immediately deducts from central shelf and backroom stock. Complete movement history recorded atomically.",
      icon: Boxes,
      badge: "Atomic Ledger",
      metric: "100% live sync",
    },
    {
      title: "Busy Merchant Mode",
      category: "High Velocity",
      description:
        "Streamlined touch-and-hotkey layout for peak rush hours. Handles customer queues without lags or multi-click navigation hurdles.",
      icon: Zap,
      badge: "Peak Performance",
      metric: "Single-key actions",
    },
    {
      title: "Sales Analytics",
      category: "Revenue & Margins",
      description:
        "Understand exactly what brings in gross revenue versus actual profit. Granular margin tracking, category breakdowns, and ticket sizes.",
      icon: TrendingUp,
      badge: "Real-time Metrics",
      metric: "Gross vs Net profit",
    },
    {
      title: "Stock Intelligence",
      category: "Health & Risk",
      description:
        "Identifies deadstock tying up liquid capital, anticipates stockouts before products vanish, and calculates turnover speed per SKU.",
      icon: BrainCircuit,
      badge: "Health Radar",
      metric: "Stockout forecasting",
    },
    {
      title: "AI-Assisted Ordering",
      category: "Procurement",
      description:
        "Generates reorder recommendations based on historical sales velocity and supplier lead times. Auto-formats purchase orders in one tap.",
      icon: Bot,
      badge: "Algorithmic Reorder",
      metric: "PO in 1-click",
    },
  ];

  return (
    <div className="w-full">
      {/* 1. Inverted Contrast Stats Section (Minimalist Modern Inversion Technique) */}
      <section className="relative w-full py-20 bg-charcoal-950 text-white overflow-hidden">
        {/* Subtle dot pattern & ambient glow */}
        <div className="absolute inset-0 bg-dot-pattern-dark pointer-events-none opacity-80" />
        <div className="absolute top-0 right-0 w-96 h-96 glow-accent blur-[140px] opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 glow-accent blur-[120px] opacity-30 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-brand-400/25 bg-brand-500/10 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-brand-300 font-semibold">
                By The Numbers
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-white font-normal tracking-tight">
              Calibrated for the tempo of Indian retail.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((item, idx) => (
              <div
                key={item.label}
                className="relative p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-brand-500/30 hover:bg-white/[0.06] transition-all group"
              >
                <div className="font-display text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-400 tracking-tight font-normal">
                  {item.value}
                </div>
                <div className="mt-3 font-mono text-sm font-semibold text-white tracking-wide">
                  {item.label}
                </div>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed font-normal">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Core Capabilities Section */}
      <section id="features" className="relative w-full py-20 sm:py-28 bg-[#FAFAFA] border-t border-zinc-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div>
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/5 mb-3">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-brand-800 font-semibold">
                  Modular Architecture
                </span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl text-charcoal-950 font-normal tracking-tight">
                Engineered for small retail precision.
              </h2>
            </div>
            <p className="mt-4 md:mt-0 text-sm text-zinc-600 max-w-md leading-relaxed">
              Not a generic bloated ERP. Six tight systems calibrated for high-velocity store owners.
            </p>
          </div>

          {/* Feature Grid with Gradient Icon Backgrounds and Hover Lift */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group relative flex flex-col justify-between p-7 rounded-2xl border border-zinc-200/90 bg-white hover:border-brand-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      {/* Gradient Icon Container */}
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-charcoal-950 shadow-accent group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-[11px] text-zinc-400 font-medium bg-zinc-100/80 px-2.5 py-0.5 rounded-md">
                        {f.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-charcoal-950 group-hover:text-brand-700 transition-colors">
                      {f.title}
                    </h3>

                    <p className="mt-2.5 text-xs text-zinc-600 leading-relaxed font-normal">
                      {f.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-brand-700 font-semibold">
                      {f.badge}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      {f.metric}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
