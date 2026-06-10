"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Plus,
  Trash2,
  TreePine,
  BarChart3,
  FileText,
  Wrench,
  Search,
  Check,
} from "lucide-react";
import {
  StrategyLeg,
  StrategyState,
  PRE_BUILT_STRATEGIES,
  SAVED_STRATEGIES,
  UNDERLYINGS,
  HOURS,
  MINUTES,
  DAYS,
  LOTS_OPTIONS,
  DAYS_OPTIONS,

  generateMockLegsForStrategy,
  calculateSummary,
} from "../data";
import PayoffChart from "./PayoffChart";

// ─── Reusable Select ───
function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select",
  searchable = false,
}: {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = searchable
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="relative">
      {label && <label className="block text-xs font-medium text-[#8A95A8] mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-sm text-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/20 focus:border-[#00D4FF] transition-all"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-1 w-full bg-white/[0.03] border border-white/[0.06] rounded-md shadow-elevated max-h-60 overflow-auto"
            >
              {searchable && (
                <div className="p-2 border-b border-white/[0.04] sticky top-0 bg-white/[0.03]">
                  <div className="relative">
                    <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-7 pr-2 py-1.5 text-sm border border-white/[0.06] rounded focus:outline-none focus:border-[#00D4FF]"
                    />
                  </div>
                </div>
              )}
              {filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-white/[0.02] transition-colors flex items-center justify-between ${
                    value === opt ? "bg-[#00D4FF]/10 text-[#00B4A6] font-medium" : "text-gray-700"
                  }`}
                >
                  {opt}
                  {value === opt && <Check size={14} />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Multi Select Days ───
function DaysMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (val: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (day: string) => {
    if (value.includes(day)) onChange(value.filter((d) => d !== day));
    else onChange([...value, day]);
  };

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-[#8A95A8] mb-1.5">Enter On Days</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-sm text-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/20 focus:border-[#00D4FF] transition-all"
      >
        <span className={value.length ? "text-gray-900" : "text-gray-400"}>
          {value.length ? value.join(", ") : "Select days..."}
        </span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-1 w-full bg-white/[0.03] border border-white/[0.06] rounded-md shadow-elevated"
            >
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggle(day)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-white/[0.02] transition-colors flex items-center justify-between ${
                    value.includes(day) ? "bg-[#00D4FF]/10 text-[#00B4A6] font-medium" : "text-gray-700"
                  }`}
                >
                  {day}
                  {value.includes(day) && <Check size={14} />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Input Field ───
function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label?: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-[#8A95A8] mb-1.5">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-sm text-white placeholder-gray-400 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/20 focus:border-[#00D4FF] transition-all"
      />
    </div>
  );
}

export default function StrategyBuilderClient() {
  const [strategy, setStrategy] = useState<StrategyState>({
    name: "",
    underlying: "",
    capital: 100000,
    type: "",
    legs: [],
    entryHour: "09",
    entryMinute: "15",
    entryDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    profitMtmType: "None",
    profitMtmValue: 0,
    stoplossMtmType: "None",
    stoplossMtmValue: 0,
    trailingStoplossType: "None",
    trailingActivateAt: 0,
    trailingLockProfitAt: 0,
    trailingIncreaseBy: 0,
    trailingIncreaseTslBy: 0,
    exitHour: "15",
    exitMinute: "10",
    exitOnExpiry: "Yes",
    exitAfterDays: 0,
  });

  const [builder, setBuilder] = useState({
    segment: "CE" as "CE" | "PE" | "FUTURES",
    action: "BUY" as "BUY" | "SELL",
    strike: "ATM Futures",
    value: "OTM 8",
    expiry: "Current Month",
    lots: "1",
  });

  const updateStrategy = <K extends keyof StrategyState>(key: K, value: StrategyState[K]) => {
    setStrategy((prev) => ({ ...prev, [key]: value }));
  };

  const addLeg = () => {
    const newLeg: StrategyLeg = {
      id: crypto.randomUUID(),
      segment: builder.segment,
      action: builder.action,
      strike: builder.strike,
      value: builder.value,
      expiry: builder.expiry,
      lots: parseInt(builder.lots),
      target: 0,
      stoploss: 0,
      trail: 0,
    };
    setStrategy((prev) => ({ ...prev, legs: [...prev.legs, newLeg] }));
  };

  const updateLeg = (id: string, partial: Partial<StrategyLeg>) => {
    setStrategy((prev) => ({
      ...prev,
      legs: prev.legs.map((l) => (l.id === id ? { ...l, ...partial } : l)),
    }));
  };

  const removeLeg = (id: string) => {
    setStrategy((prev) => ({ ...prev, legs: prev.legs.filter((l) => l.id !== id) }));
  };

  const selectPreBuilt = (name: string) => {
    const legs = generateMockLegsForStrategy(name);
    setStrategy((prev) => ({ ...prev, name, legs }));
  };

  const selectSaved = (name: string) => {
    setStrategy((prev) => ({ ...prev, name, legs: generateMockLegsForStrategy("Custom") }));
  };

  const reset = () => {
    setStrategy({
      name: "",
      underlying: "",
      capital: 100000,
      type: "",
      legs: [],
      entryHour: "09",
      entryMinute: "15",
      entryDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      profitMtmType: "None",
      profitMtmValue: 0,
      stoplossMtmType: "None",
      stoplossMtmValue: 0,
      trailingStoplossType: "None",
      trailingActivateAt: 0,
      trailingLockProfitAt: 0,
      trailingIncreaseBy: 0,
      trailingIncreaseTslBy: 0,
      exitHour: "15",
      exitMinute: "10",
      exitOnExpiry: "Yes",
      exitAfterDays: 0,
    });
  };

  const summary = useMemo(() => calculateSummary(strategy.legs, strategy.capital), [strategy.legs, strategy.capital]);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white font-sans">
      {/* Top Navigation */}
      <nav className="h-16 border-b border-white/[0.06] flex items-center justify-between px-6 sticky top-0 z-30"
        style={{ background: "rgba(11, 17, 32, 0.95)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <TreePine size={22} className="text-[#00D4FF]" />
            <span className="text-[#00D4FF]">Algofy</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Our Strategies", href: "/strategies", icon: BarChart3 },
              { label: "No Code Strategies", href: "/strategy-builder", icon: Wrench, active: true },
              { label: "Reports", href: "/terminal", icon: FileText },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20"
                    : "text-[#8A95A8] hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={14} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C853] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C853]" />
          </span>
          <span className="text-[11px] font-medium text-[#5A6680]">Live Engine</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto p-6">
        <h1 className="text-2xl font-bold text-center text-white mb-8">No Code Strategies</h1>

        {/* Top 3 Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Pre Build Strategies</label>
            <SelectField
              value={strategy.name && PRE_BUILT_STRATEGIES.includes(strategy.name) ? strategy.name : ""}
              onChange={selectPreBuilt}
              options={PRE_BUILT_STRATEGIES}
              placeholder="Select Template"
            />
          </div>
          <div className="flex flex-col justify-end">
            <label className="block text-sm font-semibold text-white mb-2">Create</label>
            <button
              onClick={reset}
              className="w-full py-2.5 px-4 border border-[#00D4FF] text-[#00D4FF] rounded-md text-sm font-semibold hover:bg-[#00D4FF]/10 transition-colors"
            >
              Create Own Strategy
            </button>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Custom</label>
            <SelectField
              value={strategy.name && SAVED_STRATEGIES.includes(strategy.name) ? strategy.name : ""}
              onChange={selectSaved}
              options={SAVED_STRATEGIES}
              placeholder="My Strategies"
            />
          </div>
        </div>

        <div className="h-px bg-gray-300 mb-8" />

        {/* Strategy Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <InputField
            label="Strategy Name"
            value={strategy.name}
            onChange={(v) => updateStrategy("name", v)}
            placeholder="Enter strategy name"
          />
          <SelectField
            label="Underlying"
            value={strategy.underlying}
            onChange={(v) => updateStrategy("underlying", v)}
            options={UNDERLYINGS}
            placeholder="Select Underlying"
            searchable
          />
          <InputField
            label="Capital"
            value={strategy.capital}
            onChange={(v) => updateStrategy("capital", Number(v) || 0)}
            type="number"
          />
          <SelectField
            label="Type"
            value={strategy.type}
            onChange={(v) => updateStrategy("type", v as "Intraday" | "Positional")}
            options={["Intraday", "Positional"]}
            placeholder="Select Type"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 space-y-6">
            {/* Position Builder */}
            <div className="bg-white/[0.03] rounded-lg border border-white/[0.06] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
              <h3 className="text-base font-semibold text-white mb-4">Positions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 items-end mb-4">
                <SelectField
                  label="Segment"
                  value={builder.segment}
                  onChange={(v) => setBuilder((b) => ({ ...b, segment: v as any }))}
                  options={["CE", "PE", "FUTURES"]}
                />
                <SelectField
                  label="Buy/Sell"
                  value={builder.action}
                  onChange={(v) => setBuilder((b) => ({ ...b, action: v as any }))}
                  options={["BUY", "SELL"]}
                />
                <SelectField
                  label="Strike Selection"
                  value={builder.strike}
                  onChange={(v) => setBuilder((b) => ({ ...b, strike: v }))}
                  options={["ATM", "ITM", "OTM", "ATM Futures"]}
                />
                <SelectField
                  label="Value"
                  value={builder.value}
                  onChange={(v) => setBuilder((b) => ({ ...b, value: v }))}
                  options={["ITM 1", "ITM 2", "ATM", "OTM 1", "OTM 2", "OTM 5", "OTM 8", "OTM 10"]}
                />
                <SelectField
                  label="Expiry"
                  value={builder.expiry}
                  onChange={(v) => setBuilder((b) => ({ ...b, expiry: v }))}
                  options={["Current Week", "Next Week", "Current Month", "Next Month"]}
                />
                <SelectField
                  label="Lots"
                  value={builder.lots}
                  onChange={(v) => setBuilder((b) => ({ ...b, lots: v }))}
                  options={LOTS_OPTIONS}
                />
                <button
                  onClick={addLeg}
                  className="h-[38px] flex items-center justify-center gap-1.5 bg-[#00D4FF] hover:bg-[#00B4A6] text-white rounded-md text-sm font-medium transition-colors px-4"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>

              {/* Legs Table */}
              {strategy.legs.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2 px-2 text-[11px] font-medium text-[#5A6680] uppercase">Action</th>
                        <th className="py-2 px-2 text-[11px] font-medium text-[#5A6680] uppercase">Strike</th>
                        <th className="py-2 px-2 text-[11px] font-medium text-[#5A6680] uppercase">Value</th>
                        <th className="py-2 px-2 text-[11px] font-medium text-[#5A6680] uppercase">Expiry</th>
                        <th className="py-2 px-2 text-[11px] font-medium text-[#5A6680] uppercase">Segment</th>
                        <th className="py-2 px-2 text-[11px] font-medium text-[#5A6680] uppercase">Lots</th>
                        <th className="py-2 px-2 text-[11px] font-medium text-[#5A6680] uppercase">TGT</th>
                        <th className="py-2 px-2 text-[11px] font-medium text-[#5A6680] uppercase">SL</th>
                        <th className="py-2 px-2 text-[11px] font-medium text-[#5A6680] uppercase">TRL</th>
                        <th className="py-2 px-2 text-[11px] font-medium text-[#5A6680] uppercase"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {strategy.legs.map((leg) => (
                        <tr key={leg.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="py-2 px-2">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${
                                leg.action === "BUY"
                                  ? "bg-emerald-100 text-[#00B4A6] border border-emerald-200"
                                  : "bg-red-100 text-red-700 border border-red-200"
                              }`}
                            >
                              {leg.action === "BUY" ? "B" : "S"}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={leg.strike}
                              onChange={(e) => updateLeg(leg.id, { strike: e.target.value })}
                              className="text-sm border border-white/[0.06] rounded px-2 py-1 bg-white/[0.03] focus:outline-none focus:border-[#00D4FF]"
                            >
                              {["ATM", "ITM", "OTM", "ATM Futures"].map((o) => (
                                <option key={o}>{o}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={leg.value}
                              onChange={(e) => updateLeg(leg.id, { value: e.target.value })}
                              className="text-sm border border-white/[0.06] rounded px-2 py-1 bg-white/[0.03] focus:outline-none focus:border-[#00D4FF]"
                            >
                              {["ITM 1", "ITM 2", "ATM", "OTM 1", "OTM 2", "OTM 5", "OTM 8", "OTM 10"].map((o) => (
                                <option key={o}>{o}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={leg.expiry}
                              onChange={(e) => updateLeg(leg.id, { expiry: e.target.value })}
                              className="text-sm border border-white/[0.06] rounded px-2 py-1 bg-white/[0.03] focus:outline-none focus:border-[#00D4FF]"
                            >
                              {["Current Week", "Next Week", "Current Month", "Next Month"].map((o) => (
                                <option key={o}>{o}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={leg.segment}
                              onChange={(e) => updateLeg(leg.id, { segment: e.target.value as any })}
                              className="text-sm border border-white/[0.06] rounded px-2 py-1 bg-white/[0.03] focus:outline-none focus:border-[#00D4FF]"
                            >
                              {["CE", "PE", "FUTURES"].map((o) => (
                                <option key={o}>{o}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={leg.lots}
                              onChange={(e) => updateLeg(leg.id, { lots: parseInt(e.target.value) })}
                              className="text-sm border border-white/[0.06] rounded px-2 py-1 bg-white/[0.03] focus:outline-none focus:border-[#00D4FF]"
                            >
                              {LOTS_OPTIONS.map((o) => (
                                <option key={o}>{o}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={leg.target}
                              onChange={(e) => updateLeg(leg.id, { target: Number(e.target.value) })}
                              className="w-14 text-sm border border-white/[0.06] rounded px-2 py-1 bg-white/[0.03] focus:outline-none focus:border-[#00D4FF]"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={leg.stoploss}
                              onChange={(e) => updateLeg(leg.id, { stoploss: Number(e.target.value) })}
                              className="w-14 text-sm border border-white/[0.06] rounded px-2 py-1 bg-white/[0.03] focus:outline-none focus:border-[#00D4FF]"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={leg.trail}
                              onChange={(e) => updateLeg(leg.id, { trail: Number(e.target.value) })}
                              className="w-14 text-sm border border-white/[0.06] rounded px-2 py-1 bg-white/[0.03] focus:outline-none focus:border-[#00D4FF]"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <button
                              onClick={() => removeLeg(leg.id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {strategy.legs.length === 0 && (
                <div className="py-8 text-center text-sm text-[#5A6680] border border-dashed border-white/[0.06] rounded-md">
                  No legs added yet. Configure and click Add to build your strategy.
                </div>
              )}
            </div>

            {/* Entry Settings */}
            <div className="bg-white/[0.03] rounded-lg border border-white/[0.06] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
              <h3 className="text-base font-semibold text-white mb-4">Entry Setting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-[#8A95A8] mb-1.5">Entry Time (hh:mm)</label>
                  <div className="flex gap-2">
                    <SelectField
                      value={strategy.entryHour}
                      onChange={(v) => updateStrategy("entryHour", v)}
                      options={HOURS}
                    />
                    <SelectField
                      value={strategy.entryMinute}
                      onChange={(v) => updateStrategy("entryMinute", v)}
                      options={MINUTES}
                    />
                  </div>
                </div>
                <DaysMultiSelect
                  value={strategy.entryDays}
                  onChange={(v) => updateStrategy("entryDays", v)}
                />
              </div>
            </div>

            {/* Exit Settings */}
            <div className="bg-white/[0.03] rounded-lg border border-white/[0.06] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
              <h3 className="text-base font-semibold text-white mb-4">Exit Setting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[#8A95A8] mb-1.5">Profit MTM</label>
                  <div className="flex gap-2">
                    <SelectField
                      value={strategy.profitMtmType}
                      onChange={(v) => updateStrategy("profitMtmType", v as any)}
                      options={["None", "Amount", "% Capital"]}
                    />
                    {strategy.profitMtmType !== "None" && (
                      <input
                        type="number"
                        value={strategy.profitMtmValue}
                        onChange={(e) => updateStrategy("profitMtmValue", Number(e.target.value))}
                        className="w-24 bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/20 focus:border-[#00D4FF]"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8A95A8] mb-1.5">Stoploss MTM</label>
                  <div className="flex gap-2">
                    <SelectField
                      value={strategy.stoplossMtmType}
                      onChange={(v) => updateStrategy("stoplossMtmType", v as any)}
                      options={["None", "Amount", "% Capital"]}
                    />
                    {strategy.stoplossMtmType !== "None" && (
                      <input
                        type="number"
                        value={strategy.stoplossMtmValue}
                        onChange={(e) => updateStrategy("stoplossMtmValue", Number(e.target.value))}
                        className="w-24 bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/20 focus:border-[#00D4FF]"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <SelectField
                  label="Trailing Stoploss"
                  value={strategy.trailingStoplossType}
                  onChange={(v) => updateStrategy("trailingStoplossType", v as any)}
                  options={["None", "Amount", "Percentage"]}
                />
                <InputField
                  label="Activate At"
                  value={strategy.trailingActivateAt}
                  onChange={(v) => updateStrategy("trailingActivateAt", Number(v))}
                  type="number"
                />
                <InputField
                  label="Lock Profit At"
                  value={strategy.trailingLockProfitAt}
                  onChange={(v) => updateStrategy("trailingLockProfitAt", Number(v))}
                  type="number"
                />
                <InputField
                  label="When Profit increase by"
                  value={strategy.trailingIncreaseBy}
                  onChange={(v) => updateStrategy("trailingIncreaseBy", Number(v))}
                  type="number"
                />
                <InputField
                  label="Increase TSL by"
                  value={strategy.trailingIncreaseTslBy}
                  onChange={(v) => updateStrategy("trailingIncreaseTslBy", Number(v))}
                  type="number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-medium text-[#8A95A8] mb-1.5">Exit Time (hh:mm)</label>
                  <div className="flex gap-2">
                    <SelectField
                      value={strategy.exitHour}
                      onChange={(v) => updateStrategy("exitHour", v)}
                      options={HOURS}
                    />
                    <SelectField
                      value={strategy.exitMinute}
                      onChange={(v) => updateStrategy("exitMinute", v)}
                      options={MINUTES}
                    />
                  </div>
                </div>
                <SelectField
                  label="Exit On Expiry"
                  value={strategy.exitOnExpiry}
                  onChange={(v) => updateStrategy("exitOnExpiry", v as any)}
                  options={["Yes", "No"]}
                />
                <SelectField
                  label="Exit after Entry + x days"
                  value={strategy.exitAfterDays.toString()}
                  onChange={(v) => updateStrategy("exitAfterDays", Number(v))}
                  options={DAYS_OPTIONS}
                />
              </div>
            </div>

            {/* Payoff Chart */}
            <PayoffChart legs={strategy.legs} />
          </div>

          {/* Right Sidebar - Strategy Summary */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="sticky top-20 space-y-4">
              <div className="bg-white/[0.03] rounded-lg border border-white/[0.06] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 size={14} className="text-emerald-600" />
                  Strategy Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Capital</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{strategy.capital.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Total Lots</span>
                    <span className="text-sm font-semibold text-gray-900">{summary.totalLots}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Number of Legs</span>
                    <span className="text-sm font-semibold text-gray-900">{summary.numLegs}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Max Profit</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      ₹{summary.maxProfit.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Max Loss</span>
                    <span className="text-sm font-semibold text-red-600">
                      ₹{summary.maxLoss.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Risk : Reward</span>
                    <span className="text-sm font-semibold text-gray-900">{summary.riskReward}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-gray-500">Breakeven Points</span>
                    <span className="text-sm font-semibold text-gray-900">{summary.breakevenPoints}</span>
                  </div>
                </div>
              </div>

              <button className="w-full py-3 bg-[#00D4FF] hover:bg-[#00B4A6] text-white rounded-md text-sm font-semibold transition-colors shadow-elevated">
                Save Strategy
              </button>
              <button className="w-full py-3 bg-white/[0.03] border border-white/[0.08] text-[#8A95A8] hover:bg-white/[0.02] rounded-md text-sm font-semibold transition-colors">
                Backtest Strategy
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
