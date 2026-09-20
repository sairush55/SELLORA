"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ReceiptText,
  Boxes,
  AlertTriangle,
  CalendarCheck,
  X,
  Store,
  History,
  RotateCw,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { SelloraLogo } from "../branding/SelloraLogo";
import { useShop } from "@/hooks/useShop";
import { useAuth } from "@/hooks/useAuth";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
}

interface MobileNavSection {
  title: string;
  items: MobileNavItem[];
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { shop } = useShop();
  const { user, logout } = useAuth();

  const bottomLinks: MobileNavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "POS Bill", href: "/sales/pos", icon: ReceiptText },
    { label: "Inventory", href: "/inventory", icon: Boxes },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Reorders", href: "/inventory/reorders", icon: RotateCw },
  ];

  const drawerSections: MobileNavSection[] = [
    {
      title: "Sales",
      items: [
        { label: "POS Billing", href: "/sales/pos", icon: ReceiptText },
        { label: "Sales History", href: "/sales/history", icon: History },
        { label: "Daily Summary", href: "/sales/daily-summary", icon: CalendarCheck },
      ],
    },
    {
      title: "Inventory",
      items: [
        { label: "Live Inventory", href: "/inventory", icon: Boxes },
        { label: "Products Catalog", href: "/inventory/products", icon: Boxes },
        { label: "Categories", href: "/inventory/categories", icon: Boxes },
        { label: "Suppliers", href: "/inventory/suppliers", icon: Boxes },
        { label: "Stock Alerts", href: "/inventory/stock-alerts", icon: AlertTriangle },
        { label: "Reorders Queue", href: "/inventory/reorders", icon: RotateCw },
      ],
    },
    {
      title: "Analytics & Intelligence",
      items: [
        { label: "Executive Analytics", href: "/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "Preferences",
      items: [
        { label: "Shop Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* 1. Fixed Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-zinc-200/90 backdrop-blur-md px-2 py-1 flex items-center justify-around shadow-lg">
        {bottomLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors relative min-w-[56px]",
                isActive ? "text-brand-600 font-semibold" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive ? "text-brand-600" : "text-zinc-500")} />
                {link.badge && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">
                    {link.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 2. Slide-out Drawer Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <SelloraLogo size="sm" />
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shop summary */}
            <div className="p-3 bg-zinc-50 border-b border-zinc-100">
              <p className="text-xs font-semibold text-zinc-900">{shop?.name || "Ravi Stores"}</p>
              <p className="text-[11px] text-zinc-500 capitalize">{shop?.businessType} • ₹ INR</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <Link
                href="/dashboard"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold",
                  pathname === "/dashboard"
                    ? "bg-charcoal-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard Overview
              </Link>

              {drawerSections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <h5 className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 px-3">
                    {section.title}
                  </h5>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium",
                          isActive
                            ? "bg-charcoal-900 text-white"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-zinc-400" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-100 space-y-2">
              {/* Install Sellora App Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("sellora:trigger-install"));
                  }
                }}
                className="w-full flex items-center justify-between py-2 px-3 text-xs font-semibold text-brand-900 bg-brand-50 hover:bg-brand-100/80 border border-brand-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">📲</span>
                  <span>Install as App</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand-600 text-white">
                  PWA
                </span>
              </button>

              {/* Replay Logo Animation Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("sellora:replay-splash"));
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
                <span>Replay Brand Intro</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
