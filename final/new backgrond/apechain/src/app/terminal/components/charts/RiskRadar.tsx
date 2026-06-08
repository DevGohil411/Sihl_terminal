'use client';

import { useMemo } from 'react';
import { TOKENS, TYPOGRAPHY } from '../../constants';

interface RadarProps {
  data: { label: string; value: number }[]; // 0-100
  size?: number;
}

export function RiskRadar({ data, size = 220 }: RadarProps) {
  const center = size / 2;
  const radius = size * 0.38;
  const levels = 4;

  const angleFor = (i: number) => (Math.PI * 2 * i) / data.length - Math.PI / 2;

  const gridPolygons = useMemo(() => {
    return Array.from({ length: levels }, (_, level) => {
      const r = (radius * (level + 1)) / levels;
      return data.map((_, i) => {
        const a = angleFor(i);
        return [center + r * Math.cos(a), center + r * Math.sin(a)];
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, radius, center]);

  const dataPolygon = useMemo(() => {
    return data.map((d, i) => {
      const a = angleFor(i);
      const r = (radius * d.value) / 100;
      return [center + r * Math.cos(a), center + r * Math.sin(a)];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, radius, center]);

  const polyString = (pts: number[][]) => pts.map((p) => p.join(',')).join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {gridPolygons.map((poly, i) => (
          <polygon
            key={i}
            points={polyString(poly)}
            fill="none"
            stroke={TOKENS.b1}
            strokeWidth="0.5"
          />
        ))}

        {/* Axes */}
        {data.map((_, i) => {
          const a = angleFor(i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(a)}
              y2={center + radius * Math.sin(a)}
              stroke={TOKENS.b1}
              strokeWidth="0.5"
            />
          );
        })}

        {/* Data area */}
        <polygon
          points={polyString(dataPolygon)}
          fill={TOKENS.alpha(TOKENS.chartPrimary, 0.10)}
          stroke={TOKENS.chartPrimary}
          strokeWidth="1.5"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const a = angleFor(i);
          const r = (radius * d.value) / 100;
          const x = center + r * Math.cos(a);
          const y = center + r * Math.sin(a);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={3} fill={TOKENS.chartPrimary} stroke={TOKENS.bg2} strokeWidth="1.5" />
            </g>
          );
        })}

        {/* Labels */}
        {data.map((d, i) => {
          const a = angleFor(i);
          const labelR = radius + 18;
          const x = center + labelR * Math.cos(a);
          const y = center + labelR * Math.sin(a);
          const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
          return (
            <text
              key={`label-${i}`}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="9"
              fill={TOKENS.t2}
              fontFamily={TYPOGRAPHY.body}
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
