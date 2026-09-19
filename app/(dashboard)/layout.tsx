"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-zinc-50/60 text-zinc-900 antialiased">
        {/* Mobile slide-over drawer & fixed bottom navigation */}
        <MobileNav
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Top Universal Navigation Header (Menu is at the TOP) */}
        <Header onMobileMenuToggle={() => setIsMobileMenuOpen(true)} />

        {/* Full-Width Scrollable Content Canvas */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-28 md:pb-10 w-full min-w-0">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
