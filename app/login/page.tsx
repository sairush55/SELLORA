"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SelloraLogo } from "@/components/branding/SelloraLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const { login, loginDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      router.push(redirectPath);
    } else {
      setError(result.error || "Failed to authenticate.");
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-6 text-center">
        <Link href="/" className="inline-flex flex-col items-center mb-4 focus:outline-hidden hover:opacity-90 transition-opacity">
          <SelloraLogo size="md" showTagline={true} />
        </Link>
        <h1 className="text-2xl font-extrabold text-charcoal-950 tracking-tight">
          Welcome back
        </h1>
        <p className="text-xs text-zinc-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
          Sign in to your SELLORA retail intelligence terminal
        </p>
      </div>

      {/* Dedicated Demo Account Access */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-700 tracking-tight flex items-center gap-1.5 font-mono uppercase">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Dedicated Demo Account
          </span>
          <span className="text-[10px] font-mono text-zinc-400">1-Click</span>
        </div>
        <button
          type="button"
          onClick={() => loginDemo("shop-ravi-stores")}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50/80 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all text-left group cursor-pointer shadow-2xs"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-900 group-hover:text-emerald-700">
                Ravi Stores
              </span>
              <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-200">
                Live Demo
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 truncate mt-0.5">
              Ravi Kumar • Pre-populated inventory, POS sales & analytics
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-600 shrink-0 ml-2 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-mono">
          <span className="bg-white px-2 text-zinc-400">Or sign in with password</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Store Email"
          type="email"
          placeholder="e.g. ravi@ravistores.in"
          prefixIcon={<Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          prefixIcon={<Lock className="w-4 h-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
            />
            Remember terminal
          </label>
          <a href="#" className="font-semibold text-brand-700 hover:text-brand-800">
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full font-semibold mt-2"
          isLoading={isSubmitting}
        >
          Sign In to Terminal
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </form>

      <p className="text-center text-xs text-zinc-500 mt-6">
        New store owner?{" "}
        <Link
          href="/signup"
          className="font-semibold text-brand-700 hover:text-brand-800 underline underline-offset-2"
        >
          Register your shop
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout footerTagLeft="SELLORA Terminal Auth" footerTagRight="Secured with RLS">
      <Suspense
        fallback={
          <div className="py-12 text-center text-xs text-zinc-400 font-mono">
            Loading terminal login...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
