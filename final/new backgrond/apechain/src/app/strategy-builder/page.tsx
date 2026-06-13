import type { Metadata } from "next";
import { Suspense } from "react";
import StrategyBuilderClient from "./components/StrategyBuilderClient";

function BuilderSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export const metadata: Metadata = {
  title: "Strategy Builder — SIHL Terminal",
  description: "Build, visualize and backtest options trading strategies with professional payoff analytics.",
};

export default function StrategyBuilderPage() {
  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <StrategyBuilderClient />
    </Suspense>
  );
}
// Deploy trigger: Wed Jun 10 13:45:22 IST 2026
