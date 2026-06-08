'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import { line as d3Line, area as d3Area, curveMonotoneX } from 'd3-shape';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { TOKENS, TYPOGRAPHY } from '../../constants';
import { EQUITY_DATA, EQUITY_DRAWDOWNS, EQUITY_TRADES } from '../../data/equity';
import type { EquityPoint } from '../../data/equity';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  point: EquityPoint | null;
}

const MARGIN = { top: 20, right: 40, bottom: 40, left: 50 };
const WIDTH = 800;
const HEIGHT = 320;
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;

export function EquityCurve() {
  const { showBenchmark, toggleBenchmark } = useTerminalStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, point: null });
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [hoveredDD, setHoveredDD] = useState<number | null>(null);
  const [showTrades, setShowTrades] = useState(true);
  const pathRefs = useRef<{ strategy?: SVGPathElement; benchmark?: SVGPathElement }>({});

  const data = EQUITY_DATA;

  const domain = useMemo(() => {
    const start = zoomDomain?.[0] ?? 0;
    const end = zoomDomain?.[1] ?? data.length - 1;
    return data.slice(Math.max(0, start), Math.min(data.length, end + 1));
  }, [data, zoomDomain]);

  const xScale = useMemo(() =>
    scaleLinear()
      .domain([0, domain.length - 1])
      .range([0, INNER_W]),
    [domain]
  );

  const yScale = useMemo(() => {
    const allValues = domain.flatMap((d) => [d.strategy, showBenchmark ? d.benchmark : d.strategy]);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const pad = (max - min) * 0.08;
    return scaleLinear().domain([min - pad, max + pad]).range([INNER_H, 0]);
  }, [domain, showBenchmark]);

  const strategyLine = useMemo(() =>
    d3Line<{ index: number; value: number }>()
      .x((d) => xScale(d.index))
      .y((d) => yScale(d.value))
      .curve(curveMonotoneX),
    [xScale, yScale]
  );

  const benchmarkLine = useMemo(() =>
    d3Line<{ index: number; value: number }>()
      .x((d) => xScale(d.index))
      .y((d) => yScale(d.value))
      .curve(curveMonotoneX),
    [xScale, yScale]
  );

  const strategyArea = useMemo(() =>
    d3Area<{ index: number; value: number }>()
      .x((d) => xScale(d.index))
      .y0(INNER_H)
      .y1((d) => yScale(d.value))
      .curve(curveMonotoneX),
    [xScale, yScale]
  );

  const strategyPoints = useMemo(() => domain.map((d, i) => ({ index: i, value: d.strategy })), [domain]);
  const benchmarkPoints = useMemo(() => domain.map((d, i) => ({ index: i, value: d.benchmark })), [domain]);

  // Path draw animation
  useEffect(() => {
    const strategyPath = pathRefs.current.strategy;
    const benchmarkPath = pathRefs.current.benchmark;
    if (!strategyPath) return;

    const length = strategyPath.getTotalLength();
    strategyPath.style.strokeDasharray = `${length}`;
    strategyPath.style.strokeDashoffset = `${length}`;

    let start: number | null = null;
    const duration = 1800;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      strategyPath.style.strokeDashoffset = `${length * (1 - ease)}`;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    if (benchmarkPath && showBenchmark) {
      const bmLength = benchmarkPath.getTotalLength();
      benchmarkPath.style.strokeDasharray = `${bmLength}`;
      benchmarkPath.style.strokeDashoffset = `${bmLength}`;
      let bmStart: number | null = null;
      const bmAnimate = (timestamp: number) => {
        if (!bmStart) bmStart = timestamp;
        const progress = Math.min((timestamp - bmStart) / (duration * 1.2), 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        benchmarkPath.style.strokeDashoffset = `${bmLength * (1 - ease)}`;
        if (progress < 1) requestAnimationFrame(bmAnimate);
      };
      requestAnimationFrame(bmAnimate);
    }
  }, [domain, showBenchmark]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left - MARGIN.left;

    const rawIdx = (mx / INNER_W) * (domain.length - 1);
    const idx = Math.max(0, Math.min(domain.length - 1, Math.round(rawIdx)));
    const point = domain[idx];

    if (point) {
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        point,
      });
    }
  }, [domain]);

  const handleMouseLeave = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }));
  }, []);

  const zoomIn = () => {
    if (!zoomDomain) {
      const mid = Math.floor(data.length / 2);
      setZoomDomain([Math.max(0, mid - 10), Math.min(data.length - 1, mid + 10)]);
    } else {
      const [s, e] = zoomDomain;
      const range = e - s;
      const quarter = Math.floor(range * 0.25);
      setZoomDomain([s + quarter, e - quarter]);
    }
  };

  const zoomOut = () => {
    if (!zoomDomain) return;
    const [s, e] = zoomDomain;
    const range = e - s;
    const quarter = Math.floor(range * 0.5);
    const ns = Math.max(0, s - quarter);
    const ne = Math.min(data.length - 1, e + quarter);
    if (ne - ns >= data.length - 1) {
      setZoomDomain(null);
    } else {
      setZoomDomain([ns, ne]);
    }
  };

  const resetZoom = () => setZoomDomain(null);

  const yTicks = yScale.ticks(5);
  const xLabelStep = Math.max(1, Math.floor(domain.length / 6));
  const xLabels = domain.filter((_, i) => i % xLabelStep === 0 || i === domain.length - 1);

  return (
    <div className="relative">
      {/* Controls */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={toggleBenchmark}
          className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 border transition-colors"
          style={{
            borderColor: showBenchmark ? TOKENS.chartSecondary : TOKENS.b1,
            color: showBenchmark ? TOKENS.chartSecondary : TOKENS.t2,
            borderRadius: '3px',
            fontFamily: TYPOGRAPHY.body,
          }}
        >
          {showBenchmark ? <Eye size={11} /> : <EyeOff size={11} />}
          Benchmark
        </button>
        <button
          onClick={() => setShowTrades((v) => !v)}
          className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 border transition-colors"
          style={{
            borderColor: showTrades ? TOKENS.chartPrimary : TOKENS.b1,
            color: showTrades ? TOKENS.chartPrimary : TOKENS.t2,
            borderRadius: '3px',
            fontFamily: TYPOGRAPHY.body,
          }}
        >
          {showTrades ? <Eye size={11} /> : <EyeOff size={11} />}
          Trades
        </button>
        <div className="flex-1" />
        <button
          onClick={zoomIn}
          className="p-1.5 rounded transition-colors"
          style={{ color: TOKENS.t2 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = TOKENS.bg3; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={zoomOut}
          className="p-1.5 rounded transition-colors"
          style={{ color: TOKENS.t2 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = TOKENS.bg3; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={resetZoom}
          className="p-1.5 rounded transition-colors"
          style={{ color: TOKENS.t2 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = TOKENS.bg3; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* SVG Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ height: 'auto', minHeight: 280 }}
      >
        <defs>
          <linearGradient id="strategyArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TOKENS.chartPrimary} stopOpacity="0.10" />
            <stop offset="100%" stopColor={TOKENS.chartPrimary} stopOpacity="0" />
          </linearGradient>
        </defs>

        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Grid lines */}
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={0} y1={yScale(t)} x2={INNER_W} y2={yScale(t)}
                stroke={TOKENS.b1} strokeWidth="0.5" strokeDasharray="2 2"
              />
              <text
                x={-10}
                y={yScale(t)}
                dy="0.32em"
                textAnchor="end"
                fontSize="9"
                fill={TOKENS.t2}
                fontFamily={TYPOGRAPHY.mono}
              >
                {t.toFixed(0)}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {xLabels.map((d, i) => {
            const idx = domain.indexOf(d);
            return (
              <text
                key={i}
                x={xScale(idx)}
                y={INNER_H + 18}
                textAnchor="middle"
                fontSize="9"
                fill={TOKENS.t2}
                fontFamily={TYPOGRAPHY.mono}
              >
                {d.date}
              </text>
            );
          })}

          {/* Drawdown overlays */}
          {EQUITY_DRAWDOWNS.map((dd, i) => {
            const startIdx = domain.findIndex((d) => d.index === dd.startIdx);
            const endIdx = domain.findIndex((d) => d.index === dd.endIdx);
            if (startIdx === -1 || endIdx === -1) return null;
            const isHovered = hoveredDD === i;
            return (
              <rect
                key={i}
                x={xScale(startIdx)}
                y={0}
                width={xScale(endIdx) - xScale(startIdx)}
                height={INNER_H}
                fill={TOKENS.negative}
                opacity={isHovered ? 0.06 : 0.03}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={() => setHoveredDD(i)}
                onMouseLeave={() => setHoveredDD(null)}
              />
            );
          })}

          {/* Strategy area */}
          <path
            d={strategyArea(strategyPoints) ?? ''}
            fill="url(#strategyArea)"
          />

          {/* Benchmark line */}
          {showBenchmark && (
            <path
              ref={(el) => { if (el) pathRefs.current.benchmark = el; }}
              d={benchmarkLine(benchmarkPoints) ?? ''}
              fill="none"
              stroke={TOKENS.chartSecondary}
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          )}

          {/* Strategy line */}
          <path
            ref={(el) => { if (el) pathRefs.current.strategy = el; }}
            d={strategyLine(strategyPoints) ?? ''}
            fill="none"
            stroke={TOKENS.chartPrimary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Trade markers */}
          {showTrades && EQUITY_TRADES.map((trade, i) => {
            const idx = domain.findIndex((d) => d.index === trade.index);
            if (idx === -1) return null;
            const x = xScale(idx);
            const y = yScale(domain[idx].strategy);
            return (
              <g key={i}>
                <circle
                  cx={x} cy={y} r={4}
                  fill={trade.direction === 'LONG' ? TOKENS.positive : TOKENS.negative}
                  stroke={TOKENS.bg2}
                  strokeWidth="1.5"
                  style={{ cursor: 'pointer' }}
                />
                <circle
                  cx={x} cy={y} r={7}
                  fill="none"
                  stroke={trade.direction === 'LONG' ? TOKENS.positive : TOKENS.negative}
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              </g>
            );
          })}

          {/* Hover crosshair */}
          {tooltip.visible && tooltip.point && (
            <>
              <line
                x1={xScale(domain.findIndex((d) => d.date === tooltip.point!.date))}
                y1={0}
                x2={xScale(domain.findIndex((d) => d.date === tooltip.point!.date))}
                y2={INNER_H}
                stroke={TOKENS.b3}
                strokeWidth="0.5"
                strokeDasharray="3 2"
              />
              <circle
                cx={xScale(domain.findIndex((d) => d.date === tooltip.point!.date))}
                cy={yScale(tooltip.point.strategy)}
                r={4}
                fill={TOKENS.chartPrimary}
                stroke={TOKENS.bg2}
                strokeWidth="2"
              />
            </>
          )}

          {/* Interaction layer */}
          <rect
            x={0} y={0} width={INNER_W} height={INNER_H}
            fill="transparent"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: 'crosshair' }}
          />
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip.visible && tooltip.point && (
        <div
          className="absolute pointer-events-none px-4 py-3 border text-[11px] z-10"
          style={{
            left: Math.min(Math.max(tooltip.x + 12, 0), WIDTH - 160),
            top: Math.max(tooltip.y - 60, 0),
            background: TOKENS.bg2,
            borderColor: TOKENS.b1,
            borderRadius: '4px',
            boxShadow: TOKENS.shadowElevated,
            color: TOKENS.t1,
            fontFamily: TYPOGRAPHY.body,
          }}
        >
          <div className="font-semibold mb-1.5" style={{ color: TOKENS.t0 }}>{tooltip.point.date}</div>
          <div className="flex items-center gap-3" style={{ fontFamily: TYPOGRAPHY.mono }}>
            <span>Strategy: <b style={{ color: TOKENS.chartPrimary }}>{tooltip.point.strategy.toFixed(1)}</b></span>
            {showBenchmark && (
              <span>BM: <b style={{ color: TOKENS.chartSecondary }}>{tooltip.point.benchmark.toFixed(1)}</b></span>
            )}
          </div>
          {tooltip.point.return !== null && (
            <div className="mt-1" style={{ fontFamily: TYPOGRAPHY.mono }}>
              Return: <b style={{ color: tooltip.point.return >= 0 ? TOKENS.positive : TOKENS.negative }}>
                {tooltip.point.return > 0 ? '+' : ''}{tooltip.point.return.toFixed(1)}%
              </b>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
