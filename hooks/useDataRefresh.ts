"use client";

import { useState, useEffect, useCallback } from "react";

export type RefreshEventType =
  | "sale"
  | "restock"
  | "adjustment"
  | "daily_summary"
  | "product_updated"
  | "all";

/**
 * Hook to reactively subscribe to Sellora state changes across components and storage tabs.
 */
export function useDataRefresh(onRefresh?: () => void) {
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCustomRefresh = () => {
      triggerRefresh();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith("sellora_")) {
        triggerRefresh();
      }
    };

    window.addEventListener("sellora:data-refresh", handleCustomRefresh);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("sellora:data-refresh", handleCustomRefresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, [triggerRefresh]);

  return { refreshTick, triggerRefresh };
}

/**
 * Dispatch an application-wide notification event when transactions or stock levels mutate.
 */
export function notifyDataRefresh(type: RefreshEventType = "all", detail?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent("sellora:data-refresh", {
          detail: { type, timestamp: Date.now(), ...(detail || {}) },
        })
      );
    } catch {
      // Safe fallback in non-browser environments
    }
  }
}
