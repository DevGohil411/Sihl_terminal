'use client';

import { useRef, useEffect } from 'react';
import { TOKENS, TYPOGRAPHY } from '../../constants';

interface RiskGaugeProps {
  value: number; // 0-100
  label: string;
  sublabel?: string;
  size?: number;
}

export function RiskGauge({ value, label, sublabel, size = 140 }: RiskGaugeProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const radius = (size - 20) / 2;
  const center = size / 2;
  const startAngle = -Math.PI * 0.75;
  const endAngle = Math.PI * 0.75;
  const totalAngle = endAngle - startAngle;

  const arcPath = (r: number, sa: number, ea: number) => {
    const x1 = center + r * Math.cos(sa);
    const y1 = center + r * Math.sin(sa);
    const x2 = center + r * Math.cos(ea);
    const y2 = center + r * Math.sin(ea);
    const large = ea - sa > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const trackPath = arcPath(radius, startAngle, endAngle);
  const valueAngle = startAngle + (value / 100) * totalAngle;
  const valuePath = arcPath(radius, startAngle, valueAngle);

  const color = value < 30 ? TOKENS.positive : value < 70 ? TOKENS.warning : TOKENS.negative;

  useEffect(() => {
    if (!pathRef.current) return;
    const length = pathRef.current.getTotalLength();
    pathRef.current.style.strokeDasharray = `${length}`;
    pathRef.current.style.strokeDashoffset = `${length}`;

    let start: number | null = null;
    const duration = 1200;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      pathRef.current!.style.strokeDashoffset = `${length * (1 - ease)}`;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, size]);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        <path d={trackPath} fill="none" stroke={TOKENS.bg3} strokeWidth="8" strokeLinecap="round" />
        <path
          ref={pathRef}
          d={valuePath}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <line
          x1={center}
          y1={center}
          x2={center + (radius - 4) * Math.cos(valueAngle)}
          y2={center + (radius - 4) * Math.sin(valueAngle)}
          stroke={TOKENS.t0}
          strokeWidth="1.5"
        />
        <circle cx={center} cy={center} r={3} fill={TOKENS.t0} />
      </svg>
      <div className="text-center -mt-1">
        <div
          className="text-2xl font-semibold"
          style={{ color, fontFamily: TYPOGRAPHY.mono }}
        >
          {value.toFixed(0)}
        </div>
        <div className="text-[11px] font-medium mt-1" style={{ color: TOKENS.t1, fontFamily: TYPOGRAPHY.body }}>
          {label}
        </div>
        {sublabel && (
          <div className="text-[10px] mt-0.5" style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
