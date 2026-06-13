"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { PRE_BUILT_STRATEGIES, searchStrategies, type StrategyDetail } from "../data";
import StrategyCard from "../components/StrategyCard";
import StrategyDetailPanel from "../components/StrategyDetail";

export default function OptionsStrategiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyDetail | null>(null);

  const filteredStrategies = searchQuery ? searchStrategies(searchQuery) : PRE_BUILT_STRATEGIES;

  return (
    <>
      <section className="relative px-6 pt-12 pb-8 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0, 212, 255, 0.06), transparent 60%)" }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Pre-Built <span className="text-[#00D4FF]">Option Strategies</span>
            </h1>
            <p className="text-[#8A95A8] text-base max-w-2xl mx-auto">
              Expert-curated option strategies. Backtested. Ready to deploy. Learn, customize, and trade with confidence.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xl mx-auto mb-10">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6680]" />
              <input
                type="text"
                placeholder="Search strategies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-[#5A6680] focus:outline-none focus:border-[#00D4FF]/30 focus:ring-1 focus:ring-[#00D4FF]/20 transition-all"
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStrategies.map((strategy, i) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                index={i}
                onClick={() => setSelectedStrategy(strategy)}
              />
            ))}
          </div>

          {filteredStrategies.length === 0 && (
            <div className="text-center py-12 text-[#5A6680]">
              No strategies found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {selectedStrategy && (
          <StrategyDetailPanel
            strategy={selectedStrategy}
            onClose={() => setSelectedStrategy(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
