"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Hard-reset page: clears ALL sellora_* localStorage keys and redirects to /login.
 * Visit http://localhost:3005/reset to wipe all local data.
 */
export default function ResetPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Collect every sellora_* key in localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sellora_")) {
        keysToRemove.push(key);
      }
    }

    // Remove them all
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // Small delay so the user sees the message, then redirect
    setTimeout(() => {
      router.replace("/login");
    }, 1800);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center space-y-4 max-w-xs px-6">
        {/* Spinner */}
        <div className="mx-auto w-12 h-12 rounded-full border-4 border-zinc-200 border-t-brand-500 animate-spin" />
        <h1 className="text-lg font-bold text-zinc-900">Resetting all data…</h1>
        <p className="text-sm text-zinc-500">
          Clearing all shop data, products, sales, inventory and sessions.
          Redirecting to login in a moment.
        </p>
      </div>
    </div>
  );
}
