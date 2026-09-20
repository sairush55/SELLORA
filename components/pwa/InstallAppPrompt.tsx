"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle } from "lucide-react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running as installed standalone app
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Check if mobile device
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < 768;
      const isMobileAgent =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileWidth || isMobileAgent);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Check iOS Safari
    const ua = navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIosDevice);

    // Check previous dismiss state in session
    const wasDismissed = sessionStorage.getItem("sellora_pwa_dismissed") === "true";
    setDismissed(wasDismissed);

    // Listen for beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    // Custom trigger from header or mobile nav
    const handleTriggerPrompt = () => {
      setDismissed(false);
      if (deferredPrompt) {
        handleInstallClick();
      } else if (isIosDevice) {
        setShowIOSModal(true);
      } else {
        // Fallback info modal
        setShowIOSModal(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("sellora:trigger-install", handleTriggerPrompt);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("sellora:trigger-install", handleTriggerPrompt);
    };
  }, [deferredPrompt]);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setInstalledSuccess(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowIOSModal(true);
    }
  }, [deferredPrompt, isIOS]);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("sellora_pwa_dismissed", "true");
    }
  };

  // If already running standalone, or not mobile, or dismissed without manual trigger: do not show banner
  const shouldShowBanner =
    !isStandalone && isMobile && !dismissed && (Boolean(deferredPrompt) || isIOS);

  return (
    <>
      {/* 1. Installed Success Notification Toast */}
      {installedSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-charcoal-950 text-white px-4 py-2.5 rounded-xl border border-amber-500/40 shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-from-top-4">
          <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>SELLORA installed successfully! Open from your Home Screen.</span>
        </div>
      )}

      {/* 2. Floating Mobile Install Banner */}
      {shouldShowBanner && (
        <div className="fixed bottom-14 md:bottom-4 left-3 right-3 z-40 sm:left-auto sm:right-4 sm:w-96 bg-charcoal-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-amber-500/30 shadow-2xl animate-in fade-in slide-from-bottom-5">
          <div className="flex items-center justify-between gap-3">
            {/* App Icon + Text */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-charcoal-800 to-zinc-900 border border-amber-500/40 flex items-center justify-center shrink-0 p-1 shadow-inner">
                {/* SVG Icon thumbnail */}
                <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
                  <rect x="6" y="22" width="12" height="12" rx="2.5" fill="#27272a" />
                  <rect x="22" y="22" width="12" height="12" rx="2.5" fill="#eab308" />
                  <rect x="6" y="6" width="12" height="12" rx="2.5" fill="#3f3f46" />
                  <path
                    d="M18 18L32 6M32 6H24M32 6V14"
                    stroke="#facc15"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="32" cy="6" r="3.5" fill="#fef08a" />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs tracking-tight text-zinc-100 truncate">
                    Install SELLORA as App
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    Free
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                  Instant POS access & offline mode
                </p>
              </div>
            </div>

            {/* Actions: Install CTA & Dismiss */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold text-charcoal-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-105 active:scale-95 shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Install</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. iOS / Mobile "Add to Home Screen" Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-zinc-200 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-charcoal-950 flex items-center justify-center text-amber-400 p-1.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Install SELLORA App</h3>
                  <p className="text-[11px] text-zinc-500">Fast 1-tap launch from Home Screen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-600">
              <div className="flex items-start gap-3 p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="w-6 h-6 rounded-lg bg-zinc-200 text-zinc-800 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 flex items-center gap-1">
                    Tap the Share Button <Share className="w-3.5 h-3.5 text-blue-600 inline" />
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Located in your browser toolbar (bottom on iPhone Safari, top-right on Chrome/iPad).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="w-6 h-6 rounded-lg bg-zinc-200 text-zinc-800 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 flex items-center gap-1">
                    Select &ldquo;Add to Home Screen&rdquo; <PlusSquare className="w-3.5 h-3.5 text-zinc-800 inline" />
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Scroll down the options list and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="w-6 h-6 rounded-lg bg-zinc-200 text-zinc-800 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">Launch SELLORA Terminal</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Tap <strong>Add</strong>. Open the app icon directly from your phone screen anytime!
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-charcoal-900 text-white font-semibold text-xs hover:bg-black transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Global helper function so any button can trigger the install flow
export function triggerInstallApp() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sellora:trigger-install"));
  }
}
