"use client";

import React from "react";
import { Receipt, Boxes, LineChart, AlertTriangle, RefreshCcw, ArrowRight } from "lucide-react";

export function WorkflowVisual() {
  const steps = [
    {
      step: "01",
      title: "BILL",
      subtitle: "POS Ring-Up",
      desc: "Instant counter checkout via barcode, shortcuts, or touch.",
      icon: Receipt,
      stat: "<2.4s per bill",
      highlight: false,
    },
    {
      step: "02",
      title: "INVENTORY",
      subtitle: "Instant Sync",
      desc: "Every item rung up automatically reconciles live store counts.",
      icon: Boxes,
      stat: "0 manual tallies",
      highlight: false,
    },
    {
      step: "03",
      title: "ANALYZE",
      subtitle: "Velocity Run-Rate",
      desc: "Tracks turn rates, margins, and peak purchasing time windows.",
      icon: LineChart,
      stat: "Live run-rate",
      highlight: false,
    },
    {
      step: "04",
      title: "ALERT",
      subtitle: "Stockout Radar",
      desc: "Flags low stock before shelves run dry and isolates dead capital.",
      icon: AlertTriangle,
      stat: "Early warning",
      highlight: false,
    },
    {
      step: "05",
      title: "REORDER",
      subtitle: "Smart Ordering",
      desc: "Generates optimal reorder quantities matched to lead days.",
      icon: RefreshCcw,
      stat: "PO in 1-click",
      highlight: true,
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 relative">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`relative flex flex-col justify-between p-4.5 rounded-2xl border transition-all duration-200 group ${
                item.highlight
                  ? "bg-gradient-to-b from-white to-emerald-50/40 border-emerald-300/80 shadow-md shadow-emerald-500/5"
                  : "bg-white border-zinc-200/90 shadow-subtle hover:border-zinc-300 hover:shadow-md"
              }`}
            >
              {/* Connector arrow for desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white border border-zinc-200/80 shadow-2xs items-center justify-center text-zinc-400 group-hover:text-emerald-600 transition-colors">
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}

              {/* Step Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[11px] font-bold text-zinc-400 group-hover:text-emerald-600 transition-colors">
                    {item.step}
                  </span>
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
                      item.highlight
                        ? "bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xs"
                        : "bg-zinc-50 border border-zinc-200/60 text-zinc-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="mb-2">
                  <span className="font-mono font-bold text-xs tracking-wider text-charcoal-950 uppercase block">
                    {item.title}
                  </span>
                  <p className="text-xs font-semibold text-zinc-700 mt-0.5">{item.subtitle}</p>
                </div>

                <p className="text-[11px] text-zinc-500 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              {/* Output metric tag */}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[10px]">
                <span className="font-mono text-zinc-400 uppercase tracking-wider">Output</span>
                <span
                  className={`font-mono font-semibold px-2 py-0.5 rounded-md border ${
                    item.highlight
                      ? "text-emerald-800 bg-emerald-100/70 border-emerald-300"
                      : "text-zinc-700 bg-zinc-50 border-zinc-200/70"
                  }`}
                >
                  {item.stat}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
