import React, { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  footerTagLeft?: string;
  footerTagRight?: string;
}

export function AuthLayout({
  children,
  footerTagLeft = "SELLORA Terminal Auth",
  footerTagRight = "Secured with RLS",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50/60 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      {/* Spacer for vertical balance */}
      <div className="hidden sm:block sm:h-4" />

      {/* Main Centered Content Container */}
      <div className="w-full max-w-[460px] mx-auto">
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 sm:p-8">
          {children}
        </div>
      </div>

      {/* Bottom Minimal Footer */}
      <div className="w-full max-w-[460px] mx-auto text-[11px] text-zinc-400 font-mono flex items-center justify-between pt-4 pb-2 px-1">
        <span>{footerTagLeft}</span>
        <span>{footerTagRight}</span>
      </div>
    </div>
  );
}
