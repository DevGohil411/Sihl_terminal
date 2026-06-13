"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Wrench } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Login logic remains unchanged / placeholder
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans"
      style={{ background: "#070A0F" }}>
      
      {/* ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#2DD4BF]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#3B82F6]/10 blur-[120px]" />
      </div>

      {/* dot grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-6"
      >
        {/* card */}
        <div
          className="rounded-2xl border border-white/[0.07] p-8 md:p-10"
          style={{
            background: "rgba(16, 22, 32, 0.72)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
          }}
        >
          {/* logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="Algofy"
                className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]"
              />
            </Link>
          </div>

          <h1 className="text-2xl font-semibold text-white text-center mb-2 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-[#94A3B8] text-center mb-8">
            Sign in to access your strategies and analytics
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* email */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-[#2DD4BF]/50 focus:ring-1 focus:ring-[#2DD4BF]/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* password */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-[#2DD4BF]/50 focus:ring-1 focus:ring-[#2DD4BF]/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-[#94A3B8] cursor-pointer">
                <input type="checkbox" className="rounded border-white/[0.12] bg-white/[0.03] text-[#2DD4BF] focus:ring-[#2DD4BF]/20" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-[#2DD4BF] hover:text-[#5EEAD4] transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="group relative w-full py-2.5 rounded-lg text-sm font-semibold text-[#0B0C10] overflow-hidden transition-all duration-300 hover:shadow-[0_0_28px_rgba(45,212,191,0.35)]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#2DD4BF] to-[#3B82F6] opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                Sign In <ArrowRight size={15} />
              </span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link
                href="/strategy-builder"
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium border border-[#2DD4BF]/30 text-[#2DD4BF] bg-[#2DD4BF]/5 hover:bg-[#2DD4BF]/10 hover:border-[#2DD4BF]/50 transition-all duration-300"
              >
                <Wrench size={15} className="transition-transform duration-300 group-hover:rotate-12" />
                Strategy Builder
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight size={14} />
                </motion.span>
              </Link>

              <p className="text-sm text-[#94A3B8] sm:ml-auto">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-[#2DD4BF] hover:text-[#5EEAD4] font-medium transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
