import React from "react";
import Link from "next/link";
import { SelloraLogo } from "../branding/SelloraLogo";

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200/80 bg-white py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          {/* Logo & Manifesto */}
          <div className="max-w-sm space-y-3">
            <SelloraLogo size="sm" />
            <p className="text-xs text-zinc-500 leading-relaxed font-normal">
              Autonomous retail intelligence designed for independent Indian retailers.
              Turn every sale into an automated stock reconciliation and replenishment decision.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                Continuous Sync Engine Active
              </span>
            </div>
          </div>

          {/* Nav Links Column Group */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-mono">
            {/* Column 1: System */}
            <div className="space-y-3">
              <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                System
              </span>
              <ul className="space-y-2 text-zinc-600">
                <li>
                  <a href="#workflow" className="hover:text-charcoal-950 transition-colors">
                    Workflow Loop
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-charcoal-950 transition-colors">
                    Capabilities
                  </a>
                </li>
                <li>
                  <a href="#intelligence" className="hover:text-charcoal-950 transition-colors">
                    Intelligence Radar
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Terminal */}
            <div className="space-y-3">
              <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                Terminal
              </span>
              <ul className="space-y-2 text-zinc-600">
                <li>
                  <Link href="/login" className="hover:text-charcoal-950 transition-colors">
                    Merchant Login
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-charcoal-950 transition-colors">
                    Register Shop
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-charcoal-950 transition-colors">
                    Demo Terminal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Stack */}
            <div className="space-y-3">
              <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                Platform
              </span>
              <ul className="space-y-2 text-zinc-500">
                <li>Next.js 15</li>
                <li>TypeScript</li>
                <li>Tailwind CSS</li>
                <li>Multi-Tenant RLS</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-zinc-400">
          <p>© {new Date().getFullYear()} SELLORA Technologies. Built for retail excellence.</p>
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Designed with Minimalist Modern Precision
          </p>
        </div>
      </div>
    </footer>
  );
}
