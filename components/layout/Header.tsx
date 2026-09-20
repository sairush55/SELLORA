"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useShop } from "@/hooks/useShop";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SelloraLogo } from "@/components/branding/SelloraLogo";
import { stockIntelligenceService } from "@/services/stockIntelligenceService";
import {
  LayoutDashboard,
  ReceiptText,
  History,
  Boxes,
  PackageSearch,
  AlertTriangle,
  RotateCw,
  CalendarCheck,
  BarChart3,
  Settings,
  Plus,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Store,
  Menu,
  User,
  CheckCircle2,
} from "lucide-react";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

interface TopNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  matchPrefix?: boolean;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const { shop } = useShop();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const shopId = shop?.id || "shop-ravi-stores";
  const merchantName = shop?.ownerName || user?.name || "Merchant";
  const merchantEmail = shop?.email || user?.email || "merchant@sellora.in";

  // Notifications
  const notifications = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      message: string;
      time: string;
      type: "critical" | "warning" | "healthy";
    }> = [];

    try {
      const recs = stockIntelligenceService.getRecommendations(shopId);
      const criticals = recs.filter(
        (r) => r.stockStatus === "CRITICAL" || r.stockStatus === "OUT_OF_STOCK"
      );
      const warnings = recs.filter((r) => r.stockStatus === "LOW");

      if (criticals.length > 0) {
        list.push({
          id: `notif-crit-${criticals[0].productId}`,
          title: "Stock Alert: Critical Low",
          message: `${criticals[0].productName} (${criticals[0].currentStock} ${criticals[0].unit} remaining)`,
          time: "Live",
          type: "critical",
        });
      }

      if (warnings.length > 0) {
        list.push({
          id: `notif-warn-${warnings[0].productId}`,
          title: "Reorder Triggered",
          message: `${warnings[0].productName} reached reorder trigger point (${warnings[0].reorderPoint} ${warnings[0].unit})`,
          time: "Live",
          type: "warning",
        });
      }

      list.push({
        id: "notif-status-ok",
        title: "Stock Intelligence Active",
        message: `${recs.length} catalog items monitored across supplier lead times`,
        time: "Active",
        type: "healthy",
      });
    } catch {
      list.push({
        id: "notif-status-ok",
        title: "Sellora Terminal Ready",
        message: "Real-time retail intelligence is active",
        time: "Active",
        type: "healthy",
      });
    }

    return list;
  }, [shopId]);

  // Top Navigation items
  const navItems: TopNavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "New Sale",
      href: "/sales/pos",
      icon: ReceiptText,
      badge: "POS",
    },
    {
      label: "Sales History",
      href: "/sales/history",
      icon: History,
    },
    {
      label: "Inventory",
      href: "/inventory",
      icon: Boxes,
    },
    {
      label: "Products",
      href: "/inventory/products",
      icon: PackageSearch,
    },
    {
      label: "Stock Alerts",
      href: "/inventory/stock-alerts",
      icon: AlertTriangle,
    },
    {
      label: "Reorder List",
      href: "/inventory/reorders",
      icon: RotateCw,
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-zinc-200 shadow-2xs">
      {/* 1. Upper Bar: Brand Logo, Active Store, Quick Actions, User Profile */}
      <div className="h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-zinc-100">
        {/* Left: Mobile hamburger & Logo & Store Badge */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="p-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg md:hidden cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <SelloraLogo size="sm" />
          </Link>

          <div className="hidden sm:block h-5 w-[1px] bg-zinc-200" />

          {/* Active Store Name Badge */}
          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <span className="font-bold text-charcoal-950 text-xs sm:text-sm tracking-tight truncate max-w-[180px] lg:max-w-[260px]">
              {shop?.name || "Ravi Stores"}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 shrink-0 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Online
            </span>
          </div>
        </div>

        {/* Right: Quick Action, Notifications, User Menu */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Quick Install App Button (shown on tablet/desktop, mobile has floating banner & drawer) */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("sellora:trigger-install"));
              }
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition-all cursor-pointer shadow-2xs"
            title="Install Sellora as App"
          >
            <span className="text-xs">📲</span>
            <span className="font-medium">Install App</span>
          </button>

          {/* Quick "+ New Sale" Button (shown on tablet/desktop, mobile has bottom nav POS Bill) */}
          <Link href="/sales/pos" className="hidden sm:inline-flex">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-charcoal-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-105 shadow-2xs hover:shadow-accent active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Sale</span>
            </button>
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-200/90 bg-white shadow-dropdown z-50 animate-in fade-in slide-from-top-2 overflow-hidden">
                <div className="flex items-center justify-between p-3.5 border-b border-zinc-100 bg-zinc-50/60">
                  <span className="text-xs font-bold text-zinc-900 font-mono uppercase tracking-wider">
                    Notifications
                  </span>
                  <span className="text-[11px] text-amber-700 font-semibold cursor-pointer hover:underline">
                    Mark all read
                  </span>
                </div>
                <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3.5 hover:bg-zinc-50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        {n.type === "critical" && (
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        )}
                        {n.type === "warning" && (
                          <RotateCw className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        {n.type === "healthy" && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-zinc-900 truncate">
                              {n.title}
                            </p>
                            <span className="text-[10px] text-zinc-400 font-mono">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-snug">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-zinc-100 text-center bg-zinc-50/50">
                  <Link
                    href="/inventory/stock-alerts"
                    className="text-xs text-amber-800 hover:text-amber-900 font-semibold inline-block py-1"
                    onClick={() => setShowNotifications(false)}
                  >
                    View all stock alerts →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User / Merchant Menu Dropdown */}
          <div className="relative" ref={userRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer border border-transparent hover:border-zinc-200"
            >
              <div className="w-7 h-7 rounded-lg bg-charcoal-900 text-white font-bold text-xs flex items-center justify-center font-mono">
                {merchantName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-zinc-900 leading-none truncate max-w-[100px]">
                  {merchantName}
                </p>
                <p className="text-[10px] text-zinc-400 capitalize mt-0.5 leading-none">
                  {shop?.businessType || "Retail"}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white shadow-dropdown z-50 p-1.5 animate-in fade-in slide-from-top-2">
                <div className="p-2.5 border-b border-zinc-100">
                  <p className="text-xs font-bold text-zinc-900 truncate">{merchantName}</p>
                  <p className="text-[10px] text-zinc-500 font-mono truncate">{merchantEmail}</p>
                  <p className="text-[10px] text-amber-700 font-semibold mt-1 font-mono">
                    {shop?.name || "Ravi Stores"}
                  </p>
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("sellora:trigger-install"));
                      }
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-amber-900 hover:bg-amber-50 rounded-lg transition-colors font-semibold"
                  >
                    <span>📲</span>
                    <span>Install as App</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("sellora:replay-splash"));
                      }
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Replay Brand Intro</span>
                  </button>

                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-2 text-xs text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Shop Settings</span>
                  </Link>

                  <div className="my-1 border-t border-zinc-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Secondary Navigation Bar (Fixed 44px, Desktop/Tablet Only) */}
      <div className="hidden sm:flex items-center gap-1 px-4 lg:px-6 h-11 border-t border-zinc-100 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || (item.matchPrefix && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                isActive
                  ? "bg-charcoal-950 text-white font-semibold shadow-2xs"
                  : "text-zinc-600 hover:text-charcoal-950 hover:bg-zinc-100 font-medium"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-zinc-400"}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isActive
                      ? "bg-amber-400 text-charcoal-950"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
