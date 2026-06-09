'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw, Zap,
  TrendingUp, ArrowLeft, BarChart3, Activity, Target, Layers, Clock
} from 'lucide-react';

const SPEEDS = [
  { label: '1x', ms: 600 },
  { label: '2x', ms: 300 },
  { label: '5x', ms: 120 },
  { label: '10x', ms: 50 },
];

function generateCandles(count = 150) {
  const candles: any[] = [];
  let price = 22450;
  const start = new Date('2024-10-01');
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const change = (Math.random() - 0.48) * 140;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 80;
    const low = Math.min(open, close) - Math.random() * 80;
    const volume = Math.floor(600000 + Math.random() * 1400000);
    candles.push({
      time: d.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume,
    });
    price = close;
  }
  return candles;
}

const ALL = generateCandles(150);

const ZONES = [
  { start: 8, end: 18, top: 22600, bottom: 22480, type: 'fvg', label: 'FVG', color: '#6EC5D6' },
  { start: 35, end: 48, top: 22850, bottom: 22720, type: 'ob', label: 'OB', color: '#E7C07B' },
  { start: 72, end: 85, top: 22200, bottom: 22120, type: 'liquidity', label: 'EQL', color: '#DDBA6C' },
  { start: 95, end: 110, top: 23000, bottom: 22920, type: 'fvg', label: 'FVG', color: '#6EC5D6' },
  { start: 125, end: 140, top: 23150, bottom: 23080, type: 'ob', label: 'OB', color: '#E7C07B' },
];

export default function ReplayPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleRef = useRef<any>(null);
  const volRef = useRef<any>(null);
  const ema20Ref = useRef<any>(null);
  const ema50Ref = useRef<any>(null);

  const [idx, setIdx] = useState(40);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [hover, setHover] = useState<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { color: 'transparent' }, textColor: '#94A3B8', fontSize: 11 },
      grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } },
      crosshair: { mode: 1, vertLine: { color: 'rgba(231,192,123,0.25)', width: 1, style: 2 }, horzLine: { color: 'rgba(231,192,123,0.25)', width: 1, style: 2 } },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: false, fixLeftEdge: true, fixRightEdge: true },
      handleScroll: false, handleScale: false,
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: '#7FD6A3', downColor: '#E26A6A',
      borderUpColor: '#7FD6A3', borderDownColor: '#E26A6A',
      wickUpColor: '#7FD6A3', wickDownColor: '#E26A6A',
    });

    const vol = chart.addSeries(HistogramSeries, {
      color: 'rgba(231,192,123,0.35)', priceFormat: { type: 'volume' }, priceScaleId: '',
    });
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    const ema20 = chart.addSeries(LineSeries, { color: '#6EC5D6', lineWidth: 1.5 });
    const ema50 = chart.addSeries(LineSeries, { color: '#DDBA6C', lineWidth: 1.5 });

    chartRef.current = chart;
    candleRef.current = candles;
    volRef.current = vol;
    ema20Ref.current = ema20;
    ema50Ref.current = ema50;

    chart.subscribeCrosshairMove((p: any) => {
      if (p.time) setHover(ALL.find((c) => c.time === p.time) || null);
    });

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, []);

  useEffect(() => {
    if (!candleRef.current) return;
    const slice = ALL.slice(0, idx + 1);
    candleRef.current.setData(slice);
    volRef.current.setData(slice.map((c: any) => ({ time: c.time, value: c.volume, color: c.close >= c.open ? 'rgba(127,214,163,0.35)' : 'rgba(226,106,106,0.35)' })));

    const ema = (data: any[], period: number) => {
      const k = 2 / (period + 1);
      let e = data[0]?.close || 0;
      return data.map((d: any) => { e = d.close * k + e * (1 - k); return { time: d.time, value: +e.toFixed(2) }; });
    };
    if (slice.length >= 20) ema20Ref.current.setData(ema(slice, 20));
    if (slice.length >= 50) ema50Ref.current.setData(ema(slice, 50));

    chartRef.current?.timeScale().fitContent();
  }, [idx]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setIdx((p) => { if (p >= ALL.length - 1) { setPlaying(false); return p; } return p + 1; });
    }, SPEEDS[speedIdx].ms);
    return () => clearInterval(t);
  }, [playing, speedIdx]);

  const cur = ALL[idx] || ALL[ALL.length - 1];
  const chg = cur.close - cur.open;
  const chgPct = (chg / cur.open) * 100;

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
              <TrendingUp size={14} style={{ color: '#E7C07B' }} />
              <span className="text-sm font-semibold" style={{ color: '#F5F7FA' }}>NIFTY 50</span>
              <span className="text-[10px] px-2 py-0.5 border rounded" style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#64748B' }}>Daily</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono" style={{ color: '#F5F7FA' }}>{cur.close.toLocaleString()}</span>
            <span className="text-[11px] font-semibold font-mono" style={{ color: chg >= 0 ? '#7FD6A3' : '#E26A6A' }}>
              {chg >= 0 ? '+' : ''}{chg.toFixed(2)} ({chgPct >= 0 ? '+' : ''}{chgPct.toFixed(2)}%)
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-3 lg:px-5 py-4 gap-4">
        {/* Chart */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex-1 border min-h-[400px] lg:min-h-[520px] relative" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
            <div ref={containerRef} className="absolute inset-0" />
            {/* Zone overlays */}
            {ZONES.map((z, i) => {
              const visible = idx >= z.start && idx <= z.end + 8;
              if (!visible) return null;
              return (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute left-0 right-0 pointer-events-none flex items-center justify-center" style={{ top: `${18 + (i % 3) * 22}%`, zIndex: 5 }}>
                  <div className="px-3 py-1 border text-[9px] font-semibold uppercase tracking-wider rounded" style={{ borderColor: `${z.color}40`, background: `${z.color}12`, color: z.color }}>
                    {z.label} {z.top.toFixed(0)}–{z.bottom.toFixed(0)}
                  </div>
                </motion.div>
              );
            })}
            {/* Hover tooltip */}
            {hover && (
              <div className="absolute top-3 right-3 px-3 py-2 border text-[11px] z-10 rounded-lg" style={{ background: 'rgba(10,10,15,0.95)', borderColor: 'rgba(255,255,255,0.08)', fontFamily: 'var(--font-jetbrains)', color: '#C7D2D9' }}>
                <div className="mb-1 font-semibold" style={{ color: '#F5F7FA' }}>{hover.time}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <span style={{ color: '#64748B' }}>O</span><span className="text-right">{hover.open.toFixed(2)}</span>
                  <span style={{ color: '#64748B' }}>H</span><span className="text-right">{hover.high.toFixed(2)}</span>
                  <span style={{ color: '#64748B' }}>L</span><span className="text-right">{hover.low.toFixed(2)}</span>
                  <span style={{ color: '#64748B' }}>C</span><span className="text-right font-semibold" style={{ color: hover.close >= hover.open ? '#7FD6A3' : '#E26A6A' }}>{hover.close.toFixed(2)}</span>
                  <span style={{ color: '#64748B' }}>Vol</span><span className="text-right">{(hover.volume / 1000).toFixed(0)}K</span>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="border px-4 py-2.5 flex items-center gap-3 flex-wrap" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '12px' }}>
            <button onClick={() => setPlaying((p) => !p)} className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors" style={{ background: playing ? 'rgba(226,106,106,0.12)' : 'rgba(127,214,163,0.12)', color: playing ? '#E26A6A' : '#7FD6A3' }}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button onClick={() => setIdx((p) => Math.max(0, p - 1))} className="p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#94A3B8' }}><SkipBack size={15} /></button>
            <button onClick={() => setIdx((p) => Math.min(ALL.length - 1, p + 1))} className="p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#94A3B8' }}><SkipForward size={15} /></button>
            <button onClick={() => { setPlaying(false); setIdx(30); }} className="p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#94A3B8' }}><RotateCcw size={15} /></button>
            <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="flex-1 min-w-[120px] flex items-center gap-2">
              <span className="text-[10px] font-mono" style={{ color: '#475569' }}>{idx + 1}</span>
              <input type="range" min={0} max={ALL.length - 1} value={idx} onChange={(e) => { setPlaying(false); setIdx(Number(e.target.value)); }}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #E7C07B 0%, #E7C07B ${(idx / (ALL.length - 1)) * 100}%, rgba(255,255,255,0.08) ${(idx / (ALL.length - 1)) * 100}%, rgba(255,255,255,0.08) 100%)` }} />
              <span className="text-[10px] font-mono" style={{ color: '#475569' }}>{ALL.length}</span>
            </div>
            <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="flex items-center gap-1">
              <Zap size={12} style={{ color: '#64748B' }} />
              {SPEEDS.map((s, i) => (
                <button key={s.label} onClick={() => setSpeedIdx(i)} className="text-[10px] font-semibold px-2 py-1 rounded transition-colors font-mono"
                  style={{ color: speedIdx === i ? '#E7C07B' : '#64748B', background: speedIdx === i ? 'rgba(231,192,123,0.08)' : 'transparent' }}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <aside className="w-full lg:w-64 flex flex-col gap-3 shrink-0">
          <div className="border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '14px' }}>
            <div className="text-[9px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>Price Action</div>
            <div className="grid grid-cols-2 gap-y-2.5 text-[12px] font-mono">
              {[{l:'Open',v:cur.open},{l:'High',v:cur.high},{l:'Low',v:cur.low},{l:'Close',v:cur.close},{l:'Change',v:`${chg>=0?'+':''}${chg.toFixed(2)}`,c:chg>=0?'#7FD6A3':'#E26A6A'},{l:'Volume',v:`${(cur.volume/1000).toFixed(0)}K`}].map((item) => (
                <div key={item.l}><div className="text-[10px] mb-0.5" style={{ color: '#475569' }}>{item.l}</div><div style={{ color: item.c || '#F5F7FA' }}>{item.v}</div></div>
              ))}
            </div>
          </div>

          <div className="border p-4 flex-1" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '14px' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#64748B' }}>Indicators</div>
              <Layers size={12} style={{ color: '#475569' }} />
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5"><span className="text-[11px]" style={{ color: '#C7D2D9' }}>RSI (14)</span><span className="text-[11px] font-semibold font-mono" style={{ color: '#F5F7FA' }}>56.8</span></div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}><div className="h-full rounded-full" style={{ width: '57%', background: '#6EC5D6' }} /></div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5"><span className="text-[11px]" style={{ color: '#C7D2D9' }}>MACD</span><span className="text-[11px] font-semibold font-mono" style={{ color: '#7FD6A3' }}>+8.4</span></div>
              <div className="flex gap-0.5 h-7 items-end">{[10,6,14,9,16,12,20,15,18,11,14,8].map((h,i)=><div key={i} className="flex-1 rounded-sm" style={{ height: `${h*4}%`, background: h>13?'#7FD6A3':'#E7C07B', opacity: 0.55 }} />)}</div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5"><span className="text-[11px]" style={{ color: '#C7D2D9' }}>ATR (14)</span><span className="text-[11px] font-semibold font-mono" style={{ color: '#F5F7FA' }}>138.2</span></div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}><div className="h-full rounded-full" style={{ width: '46%', background: '#DDBA6C' }} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5"><span className="text-[11px]" style={{ color: '#C7D2D9' }}>EMA 20 / 50</span></div>
              <div className="flex items-center gap-1.5"><BarChart3 size={12} style={{ color: '#475569' }} /><span className="text-[10px] font-mono" style={{ color: '#64748B' }}>Price {cur.close > 22450 ? 'above' : 'below'} both</span></div>
            </div>
          </div>

          <div className="border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '14px' }}>
            <div className="text-[9px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#64748B' }}>Overlays</div>
            <div className="space-y-2">
              {[{i:<Target size={12}/>,l:'Fair Value Gaps',c:'#6EC5D6',n:3},{i:<Layers size={12}/>,l:'Order Blocks',c:'#E7C07B',n:3},{i:<Activity size={12}/>,l:'Liquidity Pools',c:'#DDBA6C',n:2}].map((item)=> (
                <div key={item.l} className="flex items-center justify-between"><div className="flex items-center gap-2"><span style={{ color: item.c }}>{item.i}</span><span className="text-[11px]" style={{ color: '#C7D2D9' }}>{item.l}</span></div><span className="text-[10px] font-semibold px-2 py-0.5 rounded font-mono" style={{ background: `${item.c}12`, color: item.c }}>{item.n}</span></div>
              ))}
            </div>
          </div>

          <div className="border p-3" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: '14px' }}>
            <div className="flex items-center gap-2 mb-1.5"><Clock size={12} style={{ color: '#475569' }} /><span className="text-[10px]" style={{ color: '#64748B' }}>Session</span></div>
            <div className="text-[11px] font-mono" style={{ color: '#F5F7FA' }}>{ALL[0]?.time} → {cur.time}</div>
            <div className="text-[10px] mt-1 font-mono" style={{ color: '#475569' }}>{idx + 1} candles replayed</div>
          </div>
        </aside>
      </main>
    </div>
  );
}
