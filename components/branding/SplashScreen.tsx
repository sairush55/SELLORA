"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export function SplashScreen({ forceShow = false, onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Check if already shown in this session
    const hasSeenSplash = sessionStorage.getItem("sellora_splash_seen");
    if (forceShow || !hasSeenSplash) {
      setIsVisible(true);

      const timer = setTimeout(() => {
        handleDismiss();
      }, 2400);

      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  // Global replay listener
  useEffect(() => {
    const handleReplay = () => {
      setIsVisible(true);
      setTimeout(() => handleDismiss(), 2400);
    };

    window.addEventListener("sellora:replay-splash", handleReplay);
    return () => window.removeEventListener("sellora:replay-splash", handleReplay);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("sellora_splash_seen", "true");
    }
    if (onComplete) onComplete();
  };

  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="sellora-splash"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            filter: "blur(10px)",
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
          }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-br from-[#060910] via-[#09101c] to-[#04070c] text-white select-none cursor-pointer overflow-hidden"
        >
          {/* Ambient yellow backlight aura */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.8, 1.25, 1], opacity: [0.2, 0.45, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[440px] h-[440px] sm:w-[600px] sm:h-[600px] rounded-full bg-amber-500/20 blur-[130px] pointer-events-none"
          />

          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-dot-pattern-dark opacity-30 pointer-events-none" />

          {/* Main Content Box */}
          <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
            {/* 1. Animated Geometric Logo Symbol */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-24 h-24 sm:w-28 sm:h-28 mb-5 drop-shadow-[0_0_35px_rgba(234,179,8,0.4)]"
            >
              <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
                {/* Block 1: Bottom-Left Base (Charcoal) */}
                <motion.rect
                  x="6"
                  y="22"
                  width="12"
                  height="12"
                  rx="2.5"
                  fill="#27272a"
                  initial={{ scale: 0, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 0.95, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Block 2: Bottom-Right (Vibrant Yellow accent) */}
                <motion.rect
                  x="22"
                  y="22"
                  width="12"
                  height="12"
                  rx="2.5"
                  fill="#eab308"
                  initial={{ scale: 0, opacity: 0, x: 15 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Block 3: Top-Left (Deep Charcoal) */}
                <motion.rect
                  x="6"
                  y="6"
                  width="12"
                  height="12"
                  rx="2.5"
                  fill="#3f3f46"
                  initial={{ scale: 0, opacity: 0, y: -15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Dynamic Intelligence Vector Path (Draws itself smoothly) */}
                <motion.path
                  d="M18 18L32 6M32 6H24M32 6V14"
                  stroke="#facc15"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.75, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                />

                {/* Apex Decision Node (Pulsing Yellow Circle) */}
                <motion.circle
                  cx="32"
                  cy="6"
                  r="3.5"
                  fill="#fef08a"
                  stroke="#09101c"
                  strokeWidth="1.5"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.6, 1], opacity: 1 }}
                  transition={{ duration: 0.45, delay: 1.0, ease: "easeOut" }}
                />
              </svg>
            </motion.div>

            {/* 2. Brand Name Typography: SELLORA with glowing yellow dot */}
            <div className="flex items-center tracking-tight font-black">
              {["S", "E", "L", "L", "O", "R", "A"].map((letter, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.45,
                    delay: 0.6 + idx * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="font-mono text-3xl sm:text-4xl font-extrabold uppercase tracking-widest text-zinc-100"
                >
                  {letter}
                </motion.span>
              ))}

              {/* Glowing Yellow Brand Dot */}
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.8, 1], opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.15, ease: "easeOut" }}
                className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_14px_rgba(234,179,8,0.9)] ml-1.5 mb-2 inline-block"
              />
            </div>

            {/* 3. Subtitle: RETAIL INTELLIGENCE */}
            <motion.div
              initial={{ opacity: 0, y: 8, letterSpacing: "0.15em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.28em" }}
              transition={{ duration: 0.6, delay: 1.25, ease: "easeOut" }}
              className="mt-1 uppercase text-[10px] sm:text-xs font-semibold text-amber-400/90 font-mono"
            >
              Retail Intelligence
            </motion.div>

            {/* 4. Progress Loading Bar & Terminal Status */}
            <div className="mt-8 w-44 sm:w-52 space-y-2">
              <div className="h-1 bg-zinc-800/90 rounded-full overflow-hidden p-[1px]">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.6)]"
                />
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.7] }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex items-center justify-between text-[9px] font-mono text-zinc-500"
              >
                <span>TERMINAL ACTIVE</span>
                <span className="text-amber-400 font-bold">READY</span>
              </motion.div>
            </div>

            {/* 5. Skip Prompt */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              transition={{ delay: 1.4 }}
              className="mt-6 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors tracking-wide"
            >
              Tap anywhere to enter →
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Global helper to replay splash animation anytime
export function replaySelloraSplash() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sellora:replay-splash"));
  }
}
