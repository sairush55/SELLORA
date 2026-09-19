import React from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { ExecutivePreview } from "@/components/landing/ExecutivePreview";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <main className="min-h-screen w-full bg-white relative">
      <LandingNavbar />
      <HeroSection />
      <FeatureGrid />
      <ExecutivePreview />
      <LandingFooter />
    </main>
  );
}
