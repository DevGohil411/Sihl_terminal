"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { generatePayoffData } from "../data";
import type { StrategyLeg } from "../data";

export default function PayoffChart({ legs }: { legs: StrategyLeg[] }) {
  const data = generatePayoffData(legs);
  const currentPrice = 22500;

  const maxProfit = Math.max(...data.map((d) => d.payoff));
  const maxLoss = Math.min(...data.map((d) => d.payoff));
  const breakevens = data
    .filter((d) => Math.abs(d.payoff) < 500)
    .map((d) => d.spot);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Payoff Chart</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-gray-600">Profit Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-500" />
            <span className="text-gray-600">Loss Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-400" />
            <span className="text-gray-600">Breakeven</span>
          </div>
        </div>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="spot"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickFormatter={(v: number) => v.toLocaleString("en-IN")}
              stroke="#d1d5db"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`}
              stroke="#d1d5db"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Payoff"]}
              labelFormatter={(label: any) => `Spot: ${Number(label).toLocaleString("en-IN")}`}
            />
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
            <ReferenceLine
              x={currentPrice}
              stroke="#4b5563"
              strokeDasharray="4 4"
              label={{
                value: "Current",
                position: "top",
                fill: "#4b5563",
                fontSize: 10,
              }}
            />
            {breakevens.slice(0, 3).map((be, i) => (
              <ReferenceLine
                key={i}
                x={be}
                stroke="#9ca3af"
                strokeDasharray="2 2"
                label={{
                  value: `BE`,
                  position: "bottom",
                  fill: "#9ca3af",
                  fontSize: 9,
                }}
              />
            ))}
            <Area
              type="monotone"
              dataKey="payoff"
              stroke="#059669"
              strokeWidth={2}
              fill="url(#profitGrad)"
              fillOpacity={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Max Profit</div>
          <div className="text-sm font-semibold text-emerald-600 mt-0.5">
            ₹{maxProfit.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Max Loss</div>
          <div className="text-sm font-semibold text-red-600 mt-0.5">
            ₹{maxLoss.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Breakevens</div>
          <div className="text-sm font-semibold text-gray-700 mt-0.5">
            {breakevens.length > 0
              ? breakevens.slice(0, 2).map((b) => b.toLocaleString("en-IN")).join(", ")
              : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
