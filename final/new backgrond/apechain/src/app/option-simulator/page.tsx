'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, TrendingUp, TrendingDown, Plus, X, PieChart,
  Activity, Target, Shield, Zap, BarChart3, ChevronRight, Gauge, Layers, Clock
} from 'lucide-react';

const UNDERLYING = { symbol: 'NIFTY', price: 24185.4, change: 124.6, changePct: 0.52 };
const EXPIRIES = ['09-Jun-2025', '16-Jun-2025', '23-Jun-2025', '30-Jun-2025'];
const STRIKES = [24000, 24050, 24100, 24150, 24200, 24250, 24300, 24350, 24400];

interface Leg {
  id: string; strike: number; type: 'CE' | 'PE'; expiry: string;
  action: 'BUY' | 'SELL'; premium: number; qty: number;
}

interface ChainRow {
  strike: number;
  call: { ltp: number; iv: number; oi: number; chng: number; delta: number; gamma: number; theta: number; vega: number };
  put: { ltp: number; iv: number; oi: number; chng: number; delta: number; gamma: number; theta: number; vega: number };
}

function generateChain(): ChainRow[] {
  return STRIKES.map((strike) => {
    const m = strike - UNDERLYING.price;
    const cIV = 14.2 + Math.abs(m) * 0.008 + Math.random() * 1.5;
    const pIV = 15.1 + Math.abs(m) * 0.009 + Math.random() * 1.5;
    const cLTP = Math.max(5, (UNDERLYING.price - strike) * 0.85 + Math.random() * 40 + cIV * 8);
    const pLTP = Math.max(5, (strike - UNDERLYING.price) * 0.85 + Math.random() * 40 + pIV * 8);
    return {
      strike,
      call: {
        ltp: +cLTP.toFixed(2), iv: +cIV.toFixed(2), oi: Math.floor(120000 + Math.random() * 800000),
        chng: +((Math.random() - 0.4) * 12).toFixed(2),
        delta: +(0.5 - m * 0.0008 + Math.random() * 0.05).toFixed(3),
        gamma: +(0.002 + Math.random() * 0.003).toFixed(4),
        theta: +(-4.5 - Math.random() * 3).toFixed(2),
        vega: +(12 + Math.random() * 6).toFixed(2),
      },
      put: {
        ltp: +pLTP.toFixed(2), iv: +pIV.toFixed(2), oi: Math.floor(100000 + Math.random() * 700000),
        chng: +((Math.random() - 0.5) * 10).toFixed(2),
        delta: +(-0.5 - m * 0.0008 + Math.random() * 0.05).toFixed(3),
        gamma: +(0.002 + Math.random() * 0.003).toFixed(4),
        theta: +(-3.8 - Math.random() * 3).toFixed(2),
        vega: +(11 + Math.random() * 6).toFixed(2),
      },
    };
  });
}

const CHAIN = generateChain();

const PRESETS = [
  { name: 'Long Straddle', legs: [{ strike: 24200, type: 'CE' as const, action: 'BUY' as const }, { strike: 24200, type: 'PE' as const, action: 'BUY' as const }] },
  { name: 'Bull Call Spread', legs: [{ strike: 24150, type: 'CE' as const, action: 'BUY' as const }, { strike: 24250, type: 'CE' as const, action: 'SELL' as const }] },
  { name: 'Iron Condor', legs: [{ strike: 24100, type: 'CE' as const, action: 'SELL' as const }, { strike: 24250, type: 'CE' as const, action: 'BUY' as const }, { strike: 24100, type: 'PE' as const, action: 'SELL' as const }, { strike: 23950, type: 'PE' as const, action: 'BUY' as const }] },
];

function aggGreeks(legs: Leg[]) {
  return legs.reduce((acc, leg) => {
    const row = CHAIN.find((r) => r.strike === leg.strike);
    if (!row) return acc;
    const g = leg.type === 'CE' ? row.call : row.put;
    const mult = leg.action === 'BUY' ? leg.qty : -leg.qty;
    acc.delta += g.delta * mult;
    acc.gamma += g.gamma * mult;
    acc.theta += g.theta * mult;
    acc.vega += g.vega * mult;
    acc.premium += g.ltp * mult;
    return acc;
  }, { delta: 0, gamma: 0, theta: 0, vega: 0, premium: 0 });
}

export default function OptionSimulatorPage() {
  const [expiry, setExpiry] = useState(EXPIRIES[0]);
  const [legs, setLegs] = useState<Leg[]>([]);
  const [tab, setTab] = useState<'chain' | 'strategy' | 'greeks'>('chain');

  const addLeg = (strike: number, type: 'CE' | 'PE', action: 'BUY' | 'SELL') => {
    const row = CHAIN.find((r) => r.strike === strike);
    if (!row) return;
    const premium = type === 'CE' ? row.call.ltp : row.put.ltp;
    setLegs((p) => [...p, { id: `${Date.now()}-${Math.random()}`, strike, type, expiry, action, premium, qty: 1 }]);
  };

  const removeLeg = (id: string) => setLegs((p) => p.filter((l) => l.id !== id));

  const loadPreset = (s: typeof PRESETS[0]) => {
    const nl = s.legs.map((l) => {
      const row = CHAIN.find((r) => r.strike === l.strike)!;
      return { id: `${Date.now()}-${Math.random()}`, strike: l.strike, type: l.type, expiry, action: l.action, premium: l.type === 'CE' ? row.call.ltp : row.put.ltp, qty: 1 };
    });
    setLegs(nl); setTab('strategy');
  };

  const greeks = useMemo(() => aggGreeks(legs), [legs]);

  const pnl = legs.reduce((sum, leg) => {
    const row = CHAIN.find((r) => r.strike === leg.strike);
    if (!row) return sum;
    const cur = leg.type === 'CE' ? row.call.ltp : row.put.ltp;
    return sum + (cur - leg.premium) * (leg.action === 'BUY' ? 1 : -1) * leg.qty * 50;
  }, 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0F' }}>
      {/* Header */}
      <header className="border-b px-5 lg:px-8" style={{ background: 'rgba(11,17,24,0.92)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1 text-[11px] font-medium transition-colors hover:text-white" style={{ color: '#94A3B8' }}>
              <ArrowLeft size={13} /> Home
            </Link>
            <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex items-center gap-2">
              <PieChart size={15} style={{ color: '#6EC5D6' }} />
              <span className="text-sm font-semibold" style={{ color: '#F5F7FA' }}>Option Simulator</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold font-mono" style={{ color: '#F5F7FA' }}>{UNDERLYING.symbol}</span>
            <span className="text-[11px] font-mono" style={{ color: '#F5F7FA' }}>{UNDERLYING.price.toLocaleString()}</span>
            <span className="text-[11px] font-semibold font-mono flex items-center gap-1" style={{ color: UNDERLYING.change >= 0 ? '#7FD6A3' : '#E26A6A' }}>
              {UNDERLYING.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {UNDERLYING.change >= 0 ? '+' : ''}{UNDERLYING.change} ({UNDERLYING.changePct}%)
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 lg:px-5 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left */}
        <div className="lg:col-span-8 flex flex-col gap-3 min-w-0">
          {/* Expiry */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {EXPIRIES.map((e) => (
              <button key={e} onClick={() => setExpiry(e)} className="text-[10px] font-semibold px-3 py-1.5 border rounded transition-colors whitespace-nowrap"
                style={{ borderColor: expiry === e ? '#6EC5D6' : 'rgba(255,255,255,0.06)', color: expiry === e ? '#6EC5D6' : '#64748B', background: expiry === e ? 'rgba(110,197,214,0.06)' : 'transparent' }}>{e}</button>
            ))}
          </div>
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {[{id:'chain' as const,l:'Option Chain',i:<BarChart3 size={13}/>},{id:'strategy' as const,l:`Strategy Builder ${legs.length?`(${legs.length})`:''}`,i:<Layers size={13}/>},{id:'greeks' as const,l:'Greeks',i:<Activity size={13}/>}].map((t)=> (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-1.5 text-[11px] font-semibold px-4 py-2.5 border-b-2 transition-colors"
                style={{ borderColor: tab===t.id?'#6EC5D6':'transparent', color: tab===t.id?'#F5F7FA':'#64748B' }}>{t.i}{t.l}</button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'chain' && (
              <motion.div key="chain" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                className="border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] font-mono">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        {['Call LTP','IV','OI','Chng','Strike','Chng','OI','IV','Put LTP'].map((h)=> (
                          <th key={h} className="px-2 py-2 text-center font-semibold" style={{ color: '#64748B', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {CHAIN.map((row, i) => {
                        const atm = Math.abs(row.strike - UNDERLYING.price) < 100;
                        return (
                          <tr key={row.strike} className="transition-colors" style={{ background: atm ? 'rgba(231,192,123,0.03)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = atm ? 'rgba(231,192,123,0.03)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'; }}>
                            <td className="px-2 py-2 text-center"><button onClick={() => addLeg(row.strike,'CE','BUY')} className="text-[10px] px-2 py-0.5 rounded transition-colors" style={{ color: '#7FD6A3', background: 'rgba(127,214,163,0.06)' }}>+{row.call.ltp}</button></td>
                            <td className="px-2 py-2 text-center" style={{ color: '#94A3B8' }}>{row.call.iv}</td>
                            <td className="px-2 py-2 text-center" style={{ color: '#94A3B8' }}>{(row.call.oi / 1000).toFixed(0)}K</td>
                            <td className="px-2 py-2 text-center" style={{ color: row.call.chng >= 0 ? '#7FD6A3' : '#E26A6A' }}>{row.call.chng >= 0 ? '+' : ''}{row.call.chng.toFixed(2)}</td>
                            <td className="px-2 py-2 text-center font-semibold" style={{ color: atm ? '#E7C07B' : '#F5F7FA', background: atm ? 'rgba(231,192,123,0.06)' : 'transparent' }}>{row.strike}</td>
                            <td className="px-2 py-2 text-center" style={{ color: row.put.chng >= 0 ? '#7FD6A3' : '#E26A6A' }}>{row.put.chng >= 0 ? '+' : ''}{row.put.chng.toFixed(2)}</td>
                            <td className="px-2 py-2 text-center" style={{ color: '#94A3B8' }}>{(row.put.oi / 1000).toFixed(0)}K</td>
                            <td className="px-2 py-2 text-center" style={{ color: '#94A3B8' }}>{row.put.iv}</td>
                            <td className="px-2 py-2 text-center"><button onClick={() => addLeg(row.strike,'PE','BUY')} className="text-[10px] px-2 py-0.5 rounded transition-colors" style={{ color: '#7FD6A3', background: 'rgba(127,214,163,0.06)' }}>+{row.put.ltp}</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {tab === 'strategy' && (
              <motion.div key="strategy" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((s) => (
                    <button key={s.name} onClick={() => loadPreset(s)} className="text-[10px] font-semibold px-3 py-1.5 border rounded transition-colors"
                      style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#6EC5D6'; (e.currentTarget as HTMLElement).style.color = '#F5F7FA'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#94A3B8'; }}>{s.name}</button>
                  ))}
                </div>
                <div className="border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                  {legs.length === 0 ? (
                    <div className="p-10 text-center text-[13px]" style={{ color: '#475569' }}>Select legs from the Option Chain or load a preset strategy</div>
                  ) : (
                    <table className="w-full text-[11px] font-mono">
                      <thead><tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        {['Action','Type','Strike','Expiry','Premium','Qty',''].map((h)=> (
                          <th key={h} className="px-4 py-2 text-left font-semibold" style={{ color: '#64748B', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {legs.map((leg) => (
                          <tr key={leg.id} className="border-b last:border-b-0 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.03)' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                            <td className="px-4 py-2"><span className="text-[9px] font-semibold px-2 py-0.5 rounded" style={{ background: leg.action === 'BUY' ? 'rgba(127,214,163,0.08)' : 'rgba(226,106,106,0.08)', color: leg.action === 'BUY' ? '#7FD6A3' : '#E26A6A' }}>{leg.action}</span></td>
                            <td className="px-4 py-2" style={{ color: '#F5F7FA' }}>{leg.type}</td>
                            <td className="px-4 py-2" style={{ color: '#F5F7FA' }}>{leg.strike}</td>
                            <td className="px-4 py-2" style={{ color: '#94A3B8' }}>{leg.expiry}</td>
                            <td className="px-4 py-2" style={{ color: '#F5F7FA' }}>{leg.premium.toFixed(2)}</td>
                            <td className="px-4 py-2" style={{ color: '#F5F7FA' }}>{leg.qty}</td>
                            <td className="px-4 py-2 text-right"><button onClick={() => removeLeg(leg.id)} className="p-1 rounded transition-colors hover:text-red-400" style={{ color: '#475569' }}><X size={13} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                {legs.length > 0 && (
                  <div className="border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                    <div className="text-[9px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>Estimated Payoff at Expiry</div>
                    <div className="flex items-end gap-1 h-28">
                      {CHAIN.map((row) => {
                        const payoff = legs.reduce((sum, leg) => {
                          const intrinsic = leg.type === 'CE' ? Math.max(0, row.strike - leg.strike) : Math.max(0, leg.strike - row.strike);
                          return sum + (intrinsic - leg.premium) * (leg.action === 'BUY' ? 1 : -1) * leg.qty;
                        }, 0);
                        const norm = Math.max(0, Math.min(1, (payoff + 200) / 400));
                        return (
                          <div key={row.strike} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full rounded-sm min-h-[2px]" style={{ height: `${norm * 100}%`, background: payoff >= 0 ? '#7FD6A3' : '#E26A6A', opacity: 0.7 }} />
                            <span className="text-[8px]" style={{ color: '#475569' }}>{row.strike.toString().slice(-3)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'greeks' && (
              <motion.div key="greeks" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[{l:'Delta',v:greeks.delta.toFixed(3),i:<Target size={14}/>,d:'Directional exposure'},{l:'Gamma',v:greeks.gamma.toFixed(4),i:<Zap size={14}/>,d:'Convexity'},{l:'Theta',v:greeks.theta.toFixed(2),i:<Clock size={14}/>,d:'Time decay / day'},{l:'Vega',v:greeks.vega.toFixed(2),i:<Gauge size={14}/>,d:'Vol sensitivity'}].map((g, i) => (
                  <motion.div key={g.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                    <div className="flex items-center gap-2 mb-2" style={{ color: '#64748B' }}>{g.i}<span className="text-[9px] font-semibold uppercase tracking-wider">{g.l}</span></div>
                    <div className="text-xl font-semibold mb-1 font-mono" style={{ color: '#F5F7FA' }}>{g.v}</div>
                    <div className="text-[10px]" style={{ color: '#475569' }}>{g.d}</div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '14px' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#64748B' }}>Position PnL</span>
              <Activity size={13} style={{ color: '#475569' }} />
            </div>
            <div className="text-[28px] font-semibold leading-none mb-1 font-mono" style={{ color: pnl >= 0 ? '#7FD6A3' : '#E26A6A' }}>{pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString()}</div>
            <div className="text-[11px]" style={{ color: '#64748B' }}>Unrealized across {legs.length} leg{legs.length !== 1 ? 's' : ''}</div>
          </div>

          <div className="border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '14px' }}>
            <div className="text-[9px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>Greeks Summary</div>
            <div className="space-y-3">
              {[{l:'Delta',v:greeks.delta,max:2,c:'#E7C07B'},{l:'Gamma',v:greeks.gamma,max:0.05,c:'#6EC5D6'},{l:'Theta',v:Math.abs(greeks.theta),max:50,c:'#DDBA6C'},{l:'Vega',v:greeks.vega,max:100,c:'#7FD6A3'}].map((g) => {
                const pct = Math.min(100, Math.max(0, (Math.abs(g.v) / g.max) * 100));
                return (
                  <div key={g.l}>
                    <div className="flex items-center justify-between mb-1"><span className="text-[11px]" style={{ color: '#C7D2D9' }}>{g.l}</span><span className="text-[11px] font-semibold font-mono" style={{ color: '#F5F7FA' }}>{g.v.toFixed(g.l==='Gamma'?4:2)}</span></div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}><div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: g.c }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '14px' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#64748B' }}>IV Skew</span>
              <BarChart3 size={13} style={{ color: '#475569' }} />
            </div>
            <div className="flex items-end gap-1 h-20">
              {CHAIN.map((row) => (
                <div key={row.strike} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="flex gap-0.5 w-full justify-center">
                    <div className="w-1.5 rounded-sm" style={{ height: `${(row.call.iv / 25) * 100}%`, background: '#7FD6A3', opacity: 0.7 }} />
                    <div className="w-1.5 rounded-sm" style={{ height: `${(row.put.iv / 25) * 100}%`, background: '#E26A6A', opacity: 0.7 }} />
                  </div>
                  <span className="text-[7px]" style={{ color: '#475569' }}>{row.strike.toString().slice(-3)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm" style={{ background: '#7FD6A3' }} /><span className="text-[9px]" style={{ color: '#64748B' }}>Call IV</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm" style={{ background: '#E26A6A' }} /><span className="text-[9px]" style={{ color: '#64748B' }}>Put IV</span></div>
            </div>
          </div>

          <div className="border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '14px' }}>
            <div className="text-[9px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>Risk Metrics</div>
            <div className="space-y-2.5">
              {[{l:'Max Profit',v:'₹24,500',i:<TrendingUp size={12}/>,c:'#7FD6A3'},{l:'Max Loss',v:'₹12,200',i:<TrendingDown size={12}/>,c:'#E26A6A'},{l:'Breakeven',v:'24,180 / 24,420',i:<Target size={12}/>,c:'#C7D2D9'},{l:'POP',v:'62.4%',i:<Shield size={12}/>,c:'#E7C07B'}].map((r) => (
                <div key={r.l} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><span style={{ color: r.c }}>{r.i}</span><span className="text-[11px]" style={{ color: '#C7D2D9' }}>{r.l}</span></div>
                  <span className="text-[11px] font-semibold font-mono" style={{ color: r.c }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '14px' }}>
            <div className="text-[9px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#64748B' }}>Open Positions</div>
            {legs.length === 0 ? (
              <div className="text-[11px] py-2 text-center" style={{ color: '#475569' }}>No open positions</div>
            ) : (
              <div className="space-y-2">
                {legs.map((leg) => {
                  const row = CHAIN.find((r) => r.strike === leg.strike)!;
                  const cur = leg.type === 'CE' ? row.call.ltp : row.put.ltp;
                  const lp = (cur - leg.premium) * (leg.action === 'BUY' ? 1 : -1) * leg.qty * 50;
                  return (
                    <div key={leg.id} className="flex items-center justify-between py-1.5 border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                      <div><div className="text-[11px] font-semibold font-mono" style={{ color: '#F5F7FA' }}>{leg.action} {leg.strike} {leg.type}</div><div className="text-[9px]" style={{ color: '#475569' }}>{leg.expiry} @ {leg.premium.toFixed(2)}</div></div>
                      <div className="text-[11px] font-semibold font-mono" style={{ color: lp >= 0 ? '#7FD6A3' : '#E26A6A' }}>{lp >= 0 ? '+' : ''}₹{lp.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
