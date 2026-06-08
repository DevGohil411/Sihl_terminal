'use client';

import { useRef, useEffect, useMemo } from 'react';
import { scaleLinear } from 'd3-scale';
import { TOKENS, TYPOGRAPHY } from '../../constants';

interface FanPath {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  label?: string;
}

const WIDTH = 800;
const HEIGHT = 300;
const MARGIN = { top: 10, right: 20, bottom: 30, left: 45 };
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;

export function MonteCarloFan() {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  const paths = useMemo((): FanPath[] => {
    const months = 36;
    const bands = [
      { p: 95, opacity: 0.05 },
      { p: 75, opacity: 0.08 },
      { p: 50, opacity: 0.12 },
    ];

    const x = (i: number) => (i / (months - 1)) * INNER_W;

    const result: FanPath[] = [];

    bands.forEach((band) => {
      const upper: [number, number][] = [];
      const lower: [number, number][] = [];
      for (let i = 0; i < months; i++) {
        const t = i / months;
        const base = 100 * (1 + t * 1.2);
        const spread = 8 * Math.sqrt(t) * (band.p / 50);
        upper.push([x(i), INNER_H - ((base + spread - 100) / 80) * INNER_H]);
        lower.push([x(i), INNER_H - ((base - spread - 100) / 80) * INNER_H]);
      }
      const d = [...upper, ...lower.reverse()].map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';
      result.push({
        d,
        fill: TOKENS.alpha(TOKENS.chartPrimary, band.opacity),
        label: `${band.p}%`,
      });
    });

    const median: [number, number][] = [];
    for (let i = 0; i < months; i++) {
      const t = i / months;
      const base = 100 * (1 + t * 1.2);
      median.push([x(i), INNER_H - ((base - 100) / 80) * INNER_H]);
    }
    result.push({
      d: median.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' '),
      stroke: TOKENS.chartPrimary,
      strokeWidth: 2,
      label: 'Median',
    });

    return result;
  }, []);

  useEffect(() => {
    pathRefs.current.forEach((path, i) => {
      if (!path) return;
      const length = path.getTotalLength?.() ?? 1000;
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;

      let start: number | null = null;
      const duration = 1500 + i * 200;
      const animate = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        path.style.strokeDashoffset = `${length * (1 - ease)}`;
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    });
  }, [paths]);

  const yScale = scaleLinear().domain([100, 220]).range([INNER_H, 0]);
  const yTicks = yScale.ticks(5);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: 'auto', minHeight: 250 }}>
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* Grid */}
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={0} y1={yScale(t)} x2={INNER_W} y2={yScale(t)} stroke={TOKENS.b1} strokeWidth="0.5" strokeDasharray="2 2" />
            <text
              x={-8}
              y={yScale(t)}
              dy="0.32em"
              textAnchor="end"
              fontSize="9"
              fill={TOKENS.t2}
              fontFamily={TYPOGRAPHY.mono}
            >
              {t}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {[0, 12, 24, 35].map((i) => (
          <text
            key={i}
            x={(i / 35) * INNER_W}
            y={INNER_H + 16}
            textAnchor="middle"
            fontSize="9"
            fill={TOKENS.t2}
            fontFamily={TYPOGRAPHY.mono}
          >
            Mo {i}
          </text>
        ))}

        {/* Fan bands */}
        {paths.map((p, i) => (
          p.fill ? (
            <path key={i} d={p.d} fill={p.fill} />
          ) : (
            <path
              key={i}
              ref={(el) => { pathRefs.current[i] = el; }}
              d={p.d}
              fill="none"
              stroke={p.stroke}
              strokeWidth={p.strokeWidth}
              strokeLinecap="round"
            />
          )
        ))}
      </g>
    </svg>
  );
}
