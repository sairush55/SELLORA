"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SelloraLogo } from "@/components/branding/SelloraLogo";
import { useShop } from "@/hooks/useShop";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  ReceiptText,
  History,
  CalendarCheck,
  Boxes,
  PackageSearch,
  AlertTriangle,
  RotateCw,
  BarChart3,
  Settings,
  Store,
  LogOut,
  ChevronRight,
  Layers,
  Tag,
  Truck,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeVariant?: "healthy" | "warning" | "critical" | "info";
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export function Sidebar({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { shop } = useShop();
  const { user, logout } = useAuth();
  const merchantName = shop?.ownerName || user?.name || "Merchant";
  const merchantEmail = shop?.email || user?.email || "merchant@sellora.in";

  const navSections: NavSection[] = [
    {
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Sales",
      items: [
        {
          label: "New Sale",
          href: "/sales/pos",
          icon: ReceiptText,
          badge: "Quick",
          badgeVariant: "info",
        },
        {
          label: "Sales History",
          href: "/sales/history",
          icon: History,
        },
        {
          label: "Daily Summary",
          href: "/sales/daily-summary",
          icon: CalendarCheck,
        },
      ],
    },
    {
      title: "Inventory",
      items: [
        {
          label: "Inventory",
          href: "/inventory",
          icon: Layers,
        },
        {
          label: "Products",
          href: "/inventory/products",
          icon: Boxes,
        },
        {
          label: "Categories",
          href: "/inventory/categories",
          icon: Tag,
        },
        {
          label: "Suppliers",
          href: "/inventory/suppliers",
          icon: Truck,
        },
        {
          label: "Stock Alerts",
          href: "/inventory/stock-alerts",
          icon: AlertTriangle,
        },
        {
          label: "Reorders",
          href: "/inventory/reorders",
          icon: RotateCw,
        },
      ],
    },
    {
      title: "Analytics",
      items: [
        {
          label: "Analytics",
          href: "/analytics",
          icon: BarChart3,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          label: "Settings",
          href: "/settings",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col border-r border-zinc-200/80 bg-white select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center px-5 border-b border-zinc-100">
        <Link href="/dashboard" className="flex items-center">
          <SelloraLogo size="sm" />
        </Link>
      </div>

      {/* Active Shop Selector Widget */}
      <div className="px-3 pt-3 pb-2">
        <div className="group flex items-center justify-between rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-2.5 transition-colors hover:bg-zinc-100/80 hover:border-zinc-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-charcoal-900 text-white font-mono text-xs font-bold shrink-0">
              <Store className="w-4 h-4 text-brand-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-900 truncate">
                {shop?.name || "Ravi Stores"}
              </p>
              <p className="text-[11px] text-zinc-600 font-medium truncate">
                Merchant: <span className="text-zinc-900 font-semibold">{merchantName}</span>
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="capitalize truncate">{shop?.businessType || "Retail"}</span>
                <span className="text-zinc-300">|</span>
                <span className="font-mono text-zinc-500">₹ INR</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              <h4 className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                {section.title}
              </h4>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150",
                    isActive
                      ? "bg-charcoal-900 text-white shadow-xs"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-brand-400" : "text-zinc-400 group-hover:text-zinc-600"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "ml-auto text-[10px] font-semibold px-1.5 py-0.2 rounded-full",
                        isActive
                          ? "bg-zinc-800 text-brand-300 border border-zinc-700"
                          : item.badgeVariant === "critical"
                          ? "bg-red-100 text-red-700 font-mono"
                          : item.badgeVariant === "warning"
                          ? "bg-amber-100 text-amber-700 font-mono"
                          : item.badgeVariant === "info"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-zinc-100 text-zinc-600"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Footer with Quick Logout */}
      <div className="p-3 border-t border-zinc-100">
        <div className="flex items-center justify-between rounded-lg p-2 hover:bg-zinc-50 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-full bg-zinc-200 text-zinc-700 font-semibold text-xs flex items-center justify-center font-mono shrink-0">
              {merchantName ? merchantName[0].toUpperCase() : "M"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-900 truncate">
                {merchantName}
              </p>
              <p className="text-[10px] text-zinc-400 truncate">
                {shop?.name || "Ravi Stores"}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign out"
            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
