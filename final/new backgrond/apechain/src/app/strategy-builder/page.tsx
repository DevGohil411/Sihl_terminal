import type { Metadata } from "next";
import StrategyBuilderClient from "./components/StrategyBuilderClient";

export const metadata: Metadata = {
  title: "Strategy Builder — SIHL Terminal",
  description: "Build, visualize and backtest options trading strategies with professional payoff analytics.",
};

export default function StrategyBuilderPage() {
  return <StrategyBuilderClient />;
}
