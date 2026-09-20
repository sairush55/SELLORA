import React from "react";

interface SelloraLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  iconOnly?: boolean;
  variant?: "dark" | "light" | "auto";
}

export function SelloraLogo({
  className = "",
  showTagline = true,
  size = "md",
  iconOnly = false,
  variant = "auto",
}: SelloraLogoProps) {
  const iconSizeMap = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
  };

  const textSizeMap = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const taglineSizeMap = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
    xl: "text-xs",
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Abstract Concept Symbol: Sales (ascending vector) + Inventory (structured prism) + Intelligence (decision node) */}
      <div className={`relative flex-shrink-0 ${iconSizeMap[size]}`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Base: Inventory foundation blocks */}
          <rect
            x="6"
            y="22"
            width="12"
            height="12"
            rx="2.5"
            className="fill-charcoal-800 dark:fill-zinc-800 opacity-95"
          />
          <rect
            x="22"
            y="22"
            width="12"
            height="12"
            rx="2.5"
            className="fill-brand-500"
          />
          <rect
            x="6"
            y="6"
            width="12"
            height="12"
            rx="2.5"
            className="fill-charcoal-900 dark:fill-zinc-700"
          />
          {/* Intelligence Vector: dynamic connecting bridge rising across dimensions */}
          <path
            d="M18 18L32 6M32 6H24M32 6V14"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-500"
          />
          {/* Apex decision node */}
          <circle
            cx="32"
            cy="6"
            r="3.5"
            className="fill-brand-400 stroke-background"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <div className="flex items-center tracking-tight font-black">
            <span
              className={`font-mono tracking-wider font-extrabold uppercase ${textSizeMap[size]} text-charcoal-950 dark:text-zinc-50`}
            >
              SELLORA
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 ml-1 mb-2 inline-block"></span>
          </div>
          {showTagline && (
            <span
              className={`uppercase tracking-[0.16em] font-semibold text-charcoal-500 dark:text-zinc-400 ${taglineSizeMap[size]} -mt-1`}
            >
              Retail Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  );
}
