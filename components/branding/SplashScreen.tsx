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
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  // Global replay listener
  useEffect(() => {
    const handleReplay = () => {
      setIsVisible(true);
      setTimeout(() => handleDismiss(), 2500);
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
            scale: 1.05,
            filter: "blur(14px)",
            transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
          }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white text-zinc-900 select-none cursor-pointer overflow-hidden"
        >
          {/* 1. Generative Ambient Neural Aura (Warm golden-yellow AI pulse) */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{
              scale: [0.85, 1.2, 0.95, 1.15, 0.85],
              opacity: [0.25, 0.55, 0.35, 0.5, 0.25],
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[500px] h-[500px] sm:w-[680px] sm:h-[680px] rounded-full bg-gradient-to-tr from-amber-200/40 via-yellow-100/30 to-amber-300/20 blur-[120px] pointer-events-none"
          />

          {/* 2. Concentric AI Radar / Synapse Waves */}
          {[1, 2, 3].map((ringIdx) => (
            <motion.div
              key={ringIdx}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: [0.6, 1.6 + ringIdx * 0.3],
                opacity: [0.45, 0],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                delay: ringIdx * 0.7,
                ease: "easeOut",
              }}
              className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-amber-300/40 pointer-events-none"
            />
          ))}

          {/* 3. Subtle High-Tech Micro-Dot Grid */}
          <div className="absolute inset-0 bg-dot-pattern-light opacity-60 pointer-events-none" />

          {/* 4. AI Latent Space Floating Micro-Particles */}
          {[
            { top: "34%", left: "30%", delay: 0.1, size: "w-1.5 h-1.5" },
            { top: "28%", right: "32%", delay: 0.4, size: "w-2 h-2" },
            { bottom: "35%", left: "28%", delay: 0.7, size: "w-1 h-1" },
            { bottom: "32%", right: "29%", delay: 0.2, size: "w-1.5 h-1.5" },
          ].map((particle, i) => (
            <motion.div
              key={i}
              style={{ top: particle.top, left: particle.left, right: particle.right, bottom: particle.bottom }}
              animate={{
                y: [-6, 6, -6],
                x: [-4, 4, -4],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.8, 1.25, 0.8],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeInOut",
              }}
              className={`absolute rounded-full bg-amber-400 shadow-[0_0_8px_rgba(234,179,8,0.7)] pointer-events-none ${particle.size}`}
            />
          ))}

          {/* 5. Main Content Synthesis Container */}
          <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
            
            {/* Animated Geometric Logo Symbol with Organic Suspension */}
            <motion.div
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-24 h-24 sm:w-28 sm:h-28 mb-5 drop-shadow-[0_12px_28px_rgba(234,179,8,0.22)] drop-shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
            >
              <svg viewBox="0 0 40 40" fill="none" className="w-full h-full overflow-visible">
                {/* Block 1: Bottom-Left Base (Deep Obsidian) */}
                <motion.rect
                  x="6"
                  y="22"
                  width="12"
                  height="12"
                  rx="3"
                  fill="#09090b"
                  initial={{ scale: 0, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 240,
                    damping: 18,
                    delay: 0.12,
                  }}
                />

                {/* Block 3: Top-Left Base (Titanium Charcoal) */}
                <motion.rect
                  x="6"
                  y="6"
                  width="12"
                  height="12"
                  rx="3"
                  fill="#27272a"
                  initial={{ scale: 0, opacity: 0, rotate: 15 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 240,
                    damping: 18,
                    delay: 0.22,
                  }}
                />

                {/* Block 2: Bottom-Right (Radiant Golden Yellow Accent) */}
                <motion.rect
                  x="22"
                  y="22"
                  width="12"
                  height="12"
                  rx="3"
                  fill="#eab308"
                  initial={{ scale: 0, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 18,
                    delay: 0.32,
                  }}
                />

                {/* Dynamic Intelligence Vector Path (Draws itself with glowing liquid trace) */}
                <motion.path
                  d="M18 18L32 6M32 6H24M32 6V14"
                  stroke="#d97706"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 0.75,
                    delay: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />

                {/* Vector Highlight Glow Layer */}
                <motion.path
                  d="M18 18L32 6M32 6H24M32 6V14"
                  stroke="#facc15"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 0.75,
                    delay: 0.48,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />

                {/* Synaptic Shockwave Rings emitting from apex node */}
                <motion.circle
                  cx="32"
                  cy="6"
                  r="3.5"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="1.5"
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale: [1, 2.4], opacity: [0.8, 0] }}
                  transition={{
                    duration: 1.4,
                    delay: 0.95,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />

                {/* Apex Decision Node (Radiant Golden Nucleus) */}
                <motion.circle
                  cx="32"
                  cy="6"
                  r="3.8"
                  fill="#fef08a"
                  stroke="#ca8a04"
                  strokeWidth="1.5"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.7, 1], opacity: 1 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.88,
                    type: "spring",
                    stiffness: 300,
                    damping: 14,
                  }}
                />
              </svg>
            </motion.div>

            {/* Brand Typography: SELLORA with Fluid Generative Emergence */}
            <div className="flex items-center tracking-tight font-black">
              {["S", "E", "L", "L", "O", "R", "A"].map((letter, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, y: 14, filter: "blur(8px)", scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.48 + idx * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="font-mono text-3xl sm:text-4xl font-black uppercase tracking-widest text-zinc-900"
                >
                  {letter}
                </motion.span>
              ))}

              {/* Glowing Golden Brand Dot with Pulsing Halo */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.8, 1], opacity: 1 }}
                transition={{
                  duration: 0.45,
                  delay: 0.92,
                  type: "spring",
                  stiffness: 350,
                  damping: 15,
                }}
                className="relative w-2.5 h-2.5 ml-1.5 mb-2.5 inline-flex items-center justify-center"
              >
                <motion.span
                  animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 1.1 }}
                  className="absolute inset-0 rounded-full bg-amber-400"
                />
                <span className="relative w-full h-full rounded-full bg-amber-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
              </motion.div>
            </div>

            {/* Subtitle: RETAIL INTELLIGENCE */}
            <motion.div
              initial={{ opacity: 0, y: 6, letterSpacing: "0.14em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.28em" }}
              transition={{ duration: 0.65, delay: 0.98, ease: [0.22, 1, 0.36, 1] }}
              className="mt-1 uppercase text-[10px] sm:text-[11px] font-bold text-amber-600 font-mono tracking-[0.28em]"
            >
              Retail Intelligence
            </motion.div>

            {/* AI Generative Synthesis Bar & Live Status */}
            <div className="mt-8 w-48 sm:w-56 space-y-2">
              <div className="h-1.5 bg-zinc-100 rounded-full border border-zinc-200/80 p-[2px] shadow-inner overflow-hidden relative">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-sm relative overflow-hidden"
                >
                  {/* Moving AI Token Beam */}
                  <motion.div
                    animate={{ x: ["-100%", "240%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-12"
                  />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-zinc-400 px-0.5"
              >
                <span className="flex items-center gap-1.5 font-medium text-zinc-500">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  AI ENGINE ACTIVE
                </span>
                <span className="text-amber-600 font-bold tracking-wider">READY</span>
              </motion.div>
            </div>

            {/* Skip Prompt */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.45] }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="mt-6 text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors tracking-wide font-sans"
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

