"use client";

import React from "react";
import Link from "next/link";
import { SelloraLogo } from "../branding/SelloraLogo";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Terminal } from "lucide-react";

export function LandingNavbar() {
  const { loginDemo } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2">
            <SelloraLogo size="sm" />
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-6 font-mono text-xs uppercase tracking-wider text-zinc-500 font-medium">
            <a href="#workflow" className="hover:text-charcoal-950 transition-colors">
              Workflow Loop
            </a>
            <a href="#features" className="hover:text-charcoal-950 transition-colors">
              Capabilities
            </a>
            <a href="#intelligence" className="hover:text-charcoal-950 transition-colors">
              Intelligence Radar
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Instant Demo Pill */}
          <button
            type="button"
            onClick={() => loginDemo()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200/90 bg-zinc-50/80 hover:bg-brand-50/60 hover:border-brand-300 text-xs font-mono text-zinc-700 hover:text-brand-800 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span className="font-semibold">Instant Demo</span>
          </button>

          {/* Sign In */}
          <Link
            href="/login"
            className="text-xs font-semibold text-zinc-700 hover:text-charcoal-950 px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors hidden xs:inline-block"
          >
            Sign In
          </Link>

          {/* Primary CTA */}
          <Link href="/signup">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-blue-600 hover:brightness-110 shadow-accent hover:shadow-accent-lg active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
