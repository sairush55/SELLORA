"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SelloraLogo } from "@/components/branding/SelloraLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Mail, Lock, User, ArrowRight, Store } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { signup, loginDemo } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    const result = await signup(email, password, name);
    setIsSubmitting(false);

    if (result.success) {
      // After signup, take user straight to shop setup & onboarding!
      router.push("/onboarding");
    } else {
      setError(result.error || "Failed to create account.");
    }
  };

  return (
    <AuthLayout footerTagLeft="SELLORA Registration" footerTagRight="Zero credit card required">
      <div className="w-full">
        <div className="flex flex-col items-center mb-6 text-center">
          <Link href="/" className="inline-flex flex-col items-center mb-4 focus:outline-hidden hover:opacity-90 transition-opacity">
            <SelloraLogo size="md" showTagline={true} />
          </Link>
          <h1 className="text-2xl font-extrabold text-charcoal-950 tracking-tight">
            Create your account
          </h1>
          <p className="text-xs text-zinc-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Step 1 of joining the SELLORA retail network
          </p>
        </div>

          {/* Quick Demo Access */}
          <div className="mb-6 p-3 rounded-xl border border-brand-200 bg-brand-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-semibold text-zinc-800">
                Want to test immediately?
              </span>
            </div>
            <button
              onClick={() => loginDemo()}
              className="text-xs font-bold text-brand-700 hover:text-brand-800 hover:underline"
            >
              Skip to Demo →
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Proprietor / Owner Name"
              type="text"
              placeholder="e.g. Rahul Verma"
              prefixIcon={<User className="w-4 h-4" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. rahul@kiranamart.in"
              prefixIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Create Password"
              type="password"
              placeholder="Minimum 6 characters"
              prefixIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              By creating an account, you agree to the SELLORA Terms of Service and Privacy Policy.
            </p>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full font-semibold mt-2"
              isLoading={isSubmitting}
            >
              Continue to Shop Setup
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <p className="text-center text-xs text-zinc-500 mt-6">
            Already have a store account?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-700 hover:text-brand-800 underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
      </div>
    </AuthLayout>
  );
}
