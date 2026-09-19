"use client";

import React from "react";
import Link from "next/link";
import { SelloraLogo } from "@/components/branding/SelloraLogo";
import { StepWizard } from "@/components/onboarding/StepWizard";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-50/70 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-zinc-200/80">
          <Link href="/">
            <SelloraLogo size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500 font-mono hidden sm:inline-block">
              Store Configuration Engine
            </span>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
            >
              Skip to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Wizard Main Area */}
        <div className="flex-1 max-w-4xl mx-auto w-full py-10">
          <div className="text-center max-w-lg mx-auto mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-950 tracking-tight">
              Let&apos;s configure your store
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-zinc-500">
              Complete these 4 rapid steps to calibrate your point-of-sale terminal and stock radar.
            </p>
          </div>

          <StepWizard />
        </div>

        {/* Footer */}
        <div className="max-w-4xl mx-auto w-full pt-6 border-t border-zinc-200/80 text-center text-[11px] text-zinc-400 font-mono">
          SELLORA Phase 1 • All settings can be adjusted later in Shop Settings
        </div>
      </div>
    </ProtectedRoute>
  );
}
