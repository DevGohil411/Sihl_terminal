"use client";

import { useMemo, useEffect, useRef, useState, ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate, MotionValue } from "framer-motion";
import "./OrbitImages.css";

// --- Helper Functions to Generate SVG Paths ---
function generateEllipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
}

function generateCirclePath(cx: number, cy: number, r: number): string {
  return generateEllipsePath(cx, cy, r, r);
}

function generateSquarePath(cx: number, cy: number, size: number): string {
  const h = size / 2;
  return `M ${cx - h} ${cy - h} L ${cx + h} ${cy - h} L ${cx + h} ${cy + h} L ${cx - h} ${cy + h} Z`;
}

function generateRectanglePath(cx: number, cy: number, w: number, h: number): string {
  const hw = w / 2;
  const hh = h / 2;
  return `M ${cx - hw} ${cy - hh} L ${cx + hw} ${cy - hh} L ${cx + hw} ${cy + hh} L ${cx - hw} ${cy + hh} Z`;
}

function generateTrianglePath(cx: number, cy: number, size: number): string {
  const height = (size * Math.sqrt(3)) / 2;
  const hs = size / 2;
  return `M ${cx} ${cy - height / 1.5} L ${cx + hs} ${cy + height / 3} L ${cx - hs} ${cy + height / 3} Z`;
}

function generateStarPath(cx: number, cy: number, outerR: number, innerR: number, points: number): string {
  const step = Math.PI / points;
  let path = "";
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return path + " Z";
}

function generateHeartPath(cx: number, cy: number, size: number): string {
  const s = size / 30;
  return `M ${cx} ${cy + 12 * s} C ${cx - 20 * s} ${cy - 5 * s}, ${cx - 12 * s} ${cy - 18 * s}, ${cx} ${cy - 8 * s} C ${cx + 12 * s} ${cy - 18 * s}, ${cx + 20 * s} ${cy - 5 * s}, ${cx} ${cy + 12 * s}`;
}

function generateInfinityPath(cx: number, cy: number, w: number, h: number): string {
  const hw = w / 2;
  const hh = h / 2;
  return `M ${cx} ${cy} C ${cx + hw * 0.5} ${cy - hh}, ${cx + hw} ${cy - hh}, ${cx + hw} ${cy} C ${cx + hw} ${cy + hh}, ${cx + hw * 0.5} ${cy + hh}, ${cx} ${cy} C ${cx - hw * 0.5} ${cy + hh}, ${cx - hw} ${cy + hh}, ${cx - hw} ${cy} C ${cx - hw} ${cy - hh}, ${cx - hw * 0.5} ${cy - hh}, ${cx} ${cy}`;
}

function generateWavePath(cx: number, cy: number, w: number, amplitude: number, waves: number): string {
  const pts = [];
  const segs = waves * 20;
  const hw = w / 2;
  for (let i = 0; i <= segs; i++) {
    const x = cx - hw + (w * i) / segs;
    const y = cy + Math.sin((i / segs) * waves * 2 * Math.PI) * amplitude;
    pts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  for (let i = segs; i >= 0; i--) {
    const x = cx - hw + (w * i) / segs;
    const y = cy - Math.sin((i / segs) * waves * 2 * Math.PI) * amplitude;
    pts.push(`L ${x} ${y}`);
  }
  return pts.join(" ") + " Z";
}

// --- Dynamic Quant Dashboard Rendering ---
function renderQuantPanel(type: string): ReactNode {
  switch (type) {
    case "equity":
      return (
        <div className="quant-panel">
          <div className="quant-header">
            <span className="quant-title">ACTIVE PORTFOLIO ALPHA</span>
            <div className="quant-status">
              <div className="quant-pulse" />
              <span>LIVE</span>
            </div>
          </div>
          <div className="quant-content">
            <div className="flex justify-between text-[10px] text-white/50 mb-2">
              <span>CAGR: <strong className="text-ape-blue">+48.2%</strong></span>
              <span>Sharpe: <strong className="text-white">3.84</strong></span>
            </div>
            <svg viewBox="0 0 100 35" className="w-full h-16 overflow-visible">
              <defs>
                <linearGradient id="equityGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00A7FA" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#00A7FA" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 30 Q 15 28 30 20 T 60 12 T 90 2 L 100 0 L 100 35 L 0 35 Z"
                fill="url(#equityGlow)"
              />
              <path
                d="M 0 30 Q 15 28 30 20 T 60 12 T 90 2 L 100 0"
                fill="none"
                stroke="#00A7FA"
                strokeWidth="1.5"
                filter="drop-shadow(0 0 4px #00A7FA)"
              />
            </svg>
          </div>
          <div className="quant-footer">
            <span>MAX DRAWDOWN: -2.1%</span>
            <span>MODEL: ALPHA-V4</span>
          </div>
        </div>
      );

    case "montecarlo":
      return (
        <div className="quant-panel">
          <div className="quant-header">
            <span className="quant-title">MONTE CARLO PROBABILITY</span>
            <div className="quant-status">
              <div className="quant-pulse pink" />
              <span>SIMULATING</span>
            </div>
          </div>
          <div className="quant-content">
            <svg viewBox="0 0 100 40" className="w-full h-16 overflow-visible opacity-80">
              <path d="M 0 20 Q 20 18 40 10 T 80 5 T 100 0" fill="none" stroke="#FD23E9" strokeWidth="1" />
              <path d="M 0 20 Q 20 20 40 15 T 80 18 T 100 12" fill="none" stroke="rgba(253,35,233,0.4)" strokeWidth="0.8" />
              <path d="M 0 20 Q 20 22 40 25 T 80 30 T 100 38" fill="none" stroke="rgba(253,35,233,0.4)" strokeWidth="0.8" />
              <path d="M 0 20 Q 20 15 40 8 T 80 2 T 100 2" fill="none" stroke="rgba(0,167,250,0.5)" strokeWidth="0.8" />
              <path d="M 0 20 Q 20 25 40 28 T 80 25 T 100 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            </svg>
          </div>
          <div className="quant-footer">
            <span>99% VaR: -2.95%</span>
            <span>PATHWAYS: 10,000</span>
          </div>
        </div>
      );

    case "alpha":
      return (
        <div className="quant-panel">
          <div className="quant-header">
            <span className="quant-title">STRATEGY GENETIC MATRIX</span>
            <div className="quant-status">
              <span>GEN: 82</span>
            </div>
          </div>
          <div className="quant-content">
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] my-1">
              {["W_1", "W_2", "W_3", "A_IDX", "B_VAR", "VOL_X"].map((item, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded p-1">
                  <div className="text-white/40 text-[8px]">{item}</div>
                  <div className="font-bold text-ape-blue">{(0.45 + idx * 0.12).toFixed(3)}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="quant-footer">
            <span>FITNESS SCORE: 98.4%</span>
            <span>MUTATION: 0.02</span>
          </div>
        </div>
      );

    case "heatmap":
      return (
        <div className="quant-panel">
          <div className="quant-header">
            <span className="quant-title">ASSET CORRELATION</span>
            <div className="quant-status">
              <span>SENSITIVITY</span>
            </div>
          </div>
          <div className="quant-content flex items-center justify-center">
            <div className="grid grid-cols-4 gap-1 w-full my-1">
              {[
                1.0, 0.85, -0.42, 0.12,
                0.85, 1.0, -0.38, 0.08,
                -0.42, -0.38, 1.0, 0.65,
                0.12, 0.08, 0.65, 1.0
              ].map((val, idx) => (
                <div 
                  key={idx} 
                  className="aspect-square flex items-center justify-center rounded text-[8px] font-bold"
                  style={{
                    backgroundColor: val > 0.8 ? "rgba(0, 167, 250, 0.4)" : val > 0.4 ? "rgba(0, 167, 250, 0.2)" : val < -0.3 ? "rgba(253, 35, 233, 0.3)" : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.05)"
                  }}
                >
                  {val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                </div>
              ))}
            </div>
          </div>
          <div className="quant-footer">
            <span>BTC / ETH / SOL / SPY</span>
            <span>PERIOD: 90D</span>
          </div>
        </div>
      );

    case "execution":
      return (
        <div className="quant-panel">
          <div className="quant-header">
            <span className="quant-title">DMA PIPELINE FEED</span>
            <div className="quant-status">
              <div className="quant-pulse" />
              <span>DMA ACTIVE</span>
            </div>
          </div>
          <div className="quant-content text-[8px] flex flex-col justify-center space-y-1">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-[#00A7FA]">BUY LIMIT BTC @ $68,410</span>
              <span className="text-white font-bold">12.5 BTC</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-[#FD23E9]">SELL STOP ETH @ $3,520</span>
              <span className="text-white font-bold">85.0 ETH</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-[#00A7FA]">BUY FILL SOL @ $142.15</span>
              <span className="text-white font-bold">420 SOL</span>
            </div>
          </div>
          <div className="quant-footer">
            <span>LATENCY: 8.42ms</span>
            <span>SERVER: NY4-LD4</span>
          </div>
        </div>
      );

    case "benchmark":
      return (
        <div className="quant-panel">
          <div className="quant-header">
            <span className="quant-title">OUTPERFORMANCE DIAGNOSTICS</span>
            <div className="quant-status">
              <span>VS BENCHMARK</span>
            </div>
          </div>
          <div className="quant-content">
            <div className="flex items-end justify-between h-14 px-2 my-1">
              <div className="flex flex-col items-center">
                <span className="text-[7px] text-white/50 mb-1">S&P 500</span>
                <div className="w-8 bg-white/10 border border-white/20 h-6 rounded-t" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7px] text-white/50 mb-1">STRAT-X</span>
                <div className="w-8 bg-[#00A7FA]/40 border border-[#00A7FA] h-12 rounded-t shadow-[0_0_10px_rgba(0,167,250,0.3)] animate-pulse" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7px] text-[#FD23E9] mb-1">DELTA</span>
                <div className="w-8 bg-[#FD23E9]/40 border border-[#FD23E9] h-10 rounded-t shadow-[0_0_10px_rgba(253,35,233,0.3)]" />
              </div>
            </div>
          </div>
          <div className="quant-footer">
            <span>STRATEGY ALPHA: +28.42%</span>
            <span>SHARPE DIFFERENTIAL: +2.1</span>
          </div>
        </div>
      );

    default:
      return (
        <div className="quant-panel">
          <div className="quant-header">
            <span className="quant-title">SYSTEM COMPONENT</span>
          </div>
          <div className="quant-content flex items-center justify-center text-white/60">
            <span>No Visual Signal</span>
          </div>
          <div className="quant-footer">
            <span>ERR_SIG_NULL</span>
          </div>
        </div>
      );
  }
}

// --- Subcomponent: OrbitItem ---
interface OrbitItemProps {
  item: ReactNode;
  index: number;
  totalItems: number;
  path: string;
  itemSize: number;
  rotation: number;
  progress: MotionValue<number>;
  fill: boolean;
}

function OrbitItem({ item, index, totalItems, path, itemSize, rotation, progress, fill }: OrbitItemProps) {
  const itemOffset = fill ? (index / totalItems) * 100 : 0;

  const offsetDistance = useTransform(progress, (p) => {
    const offset = (((p + itemOffset) % 100) + 100) % 100;
    return `${offset}%`;
  });

  // Calculate 3D Depth (z), Scale, Blur, and Opacity based on progress along the path
  const zDepth = useTransform(progress, (p) => {
    const offset = (((p + itemOffset) % 100) + 100) % 100;
    const rad = (offset / 100) * 2 * Math.PI;
    // Map cosine wave to create front (Z > 0) and back (Z < 0) positions
    return Math.cos(rad) * 250; // -250px to +250px depth
  });

  const itemScale = useTransform(progress, (p) => {
    const offset = (((p + itemOffset) % 100) + 100) % 100;
    const rad = (offset / 100) * 2 * Math.PI;
    // Map cosine: scale 0.75 (at back) to 1.25 (at front)
    return 0.75 + (Math.cos(rad) + 1) * 0.25; 
  });

  const itemBlur = useTransform(progress, (p) => {
    const offset = (((p + itemOffset) % 100) + 100) % 100;
    const rad = (offset / 100) * 2 * Math.PI;
    const depth = Math.cos(rad);
    // Dynamic blur: faint panels in background blur, foreground remains sharp,
    // and extremely close foreground panels blur slightly to simulate camera lens crop depth.
    if (depth < -0.6) return "blur(2.5px)";
    if (depth > 0.85) return "blur(1.2px)";
    return "blur(0px)";
  });

  const opacity = useTransform(progress, (p) => {
    const offset = (((p + itemOffset) % 100) + 100) % 100;
    const rad = (offset / 100) * 2 * Math.PI;
    const depth = Math.cos(rad);
    // Background panels fade out to blend with grid, foreground is solid
    return 0.4 + (depth + 1) * 0.3; // 0.4 to 1.0
  });

  return (
    <motion.div
      className="orbit-item"
      style={{
        width: itemSize,
        height: itemSize * 0.75, // Standard card aspect ratio
        offsetPath: `path("${path}")`,
        offsetRotate: "0deg",
        offsetAnchor: "center center",
        offsetDistance,
        z: zDepth,
        scale: itemScale,
        filter: itemBlur,
        opacity,
      }}
    >
      {/* Reverse path rotation + 3D panel tilting to look gorgeous */}
      <div 
        className="w-full h-full"
        style={{ 
          transform: `rotate(${-rotation}deg) rotateX(15deg) rotateY(-10deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {item}
      </div>
    </motion.div>
  );
}

// --- Core Component: OrbitImages ---
interface OrbitImagesProps {
  images?: string[];
  altPrefix?: string;
  shape?: "ellipse" | "circle" | "square" | "rectangle" | "triangle" | "star" | "heart" | "infinity" | "wave" | "custom";
  customPath?: string;
  baseWidth?: number;
  radiusX?: number;
  radiusY?: number;
  radius?: number;
  starPoints?: number;
  starInnerRatio?: number;
  rotation?: number;
  duration?: number;
  itemSize?: number;
  direction?: "normal" | "reverse";
  fill?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
  showPath?: boolean;
  pathColor?: string;
  pathWidth?: number;
  easing?: (t: number) => number;
  paused?: boolean;
  centerContent?: ReactNode;
  responsive?: boolean;
}

export default function OrbitImages({
  images = [],
  altPrefix = "Orbiting image",
  shape = "ellipse",
  customPath,
  baseWidth = 1400,
  radiusX = 700,
  radiusY = 170,
  radius = 300,
  starPoints = 5,
  starInnerRatio = 0.5,
  rotation = -8,
  duration = 40,
  itemSize = 64,
  direction = "normal",
  fill = true,
  width = "100%",
  height = "auto",
  className = "",
  showPath = false,
  pathColor = "rgba(0, 167, 250, 0.1)",
  pathWidth = 2,
  paused = false,
  centerContent,
  responsive = false,
}: OrbitImagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const designCenterX = baseWidth / 2;
  const designCenterY = baseWidth / 2;

  // Parallax interaction for the camera drift effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 30; // Max 30px offset
      const y = (e.clientY / innerHeight - 0.5) * 30;
      setMouseOffset({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const path = useMemo(() => {
    switch (shape) {
      case "circle":
        return generateCirclePath(designCenterX, designCenterY, radius);
      case "ellipse":
        return generateEllipsePath(designCenterX, designCenterY, radiusX, radiusY);
      case "square":
        return generateSquarePath(designCenterX, designCenterY, radius * 2);
      case "rectangle":
        return generateRectanglePath(designCenterX, designCenterY, radiusX * 2, radiusY * 2);
      case "triangle":
        return generateTrianglePath(designCenterX, designCenterY, radius * 2);
      case "star":
        return generateStarPath(designCenterX, designCenterY, radius, radius * starInnerRatio, starPoints);
      case "heart":
        return generateHeartPath(designCenterX, designCenterY, radius * 2);
      case "infinity":
        return generateInfinityPath(designCenterX, designCenterY, radiusX * 2, radiusY * 2);
      case "wave":
        return generateWavePath(designCenterX, designCenterY, radiusX * 2, radiusY, 3);
      case "custom":
        return customPath || generateCirclePath(designCenterX, designCenterY, radius);
      default:
        return generateEllipsePath(designCenterX, designCenterY, radiusX, radiusY);
    }
  }, [shape, customPath, designCenterX, designCenterY, radiusX, radiusY, radius, starPoints, starInnerRatio]);

  useEffect(() => {
    if (!responsive || !containerRef.current) return;
    const updateScale = () => {
      if (!containerRef.current) return;
      setScale(containerRef.current.clientWidth / baseWidth);
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [responsive, baseWidth]);

  const progress = useMotionValue(0);

  useEffect(() => {
    if (paused) return;
    const controls = animate(progress, direction === "reverse" ? -100 : 100, {
      duration,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
    });
    return () => controls.stop();
  }, [progress, duration, direction, paused]);

  const containerWidth = responsive ? "100%" : (typeof width === "number" ? `${width}px` : width);
  const containerHeight = responsive ? "auto" : (typeof height === "number" ? `${height}px` : height);

  // Map elements: check if strings are quant components, otherwise render normal images
  const items = useMemo(() => {
    return images.map((src, index) => {
      if (src.startsWith("quant://")) {
        const type = src.replace("quant://", "");
        return renderQuantPanel(type);
      }
      return (
        <img
          key={src}
          src={src}
          alt={`${altPrefix} ${index + 1}`}
          draggable={false}
          className="orbit-image"
        />
      );
    });
  }, [images, altPrefix]);

  return (
    <div
      ref={containerRef}
      className={`orbit-container ${className}`}
      style={{
        width: containerWidth,
        height: containerHeight,
        aspectRatio: responsive ? "1 / 1" : undefined,
      }}
      aria-hidden="true"
    >
      <div
        className={responsive ? "orbit-scaling-container orbit-scaling-container--responsive" : "orbit-scaling-container"}
        style={{
          width: responsive ? baseWidth : "100%",
          height: responsive ? baseWidth : "100%",
          transform: responsive 
            ? `translate(calc(-50% + ${mouseOffset.x}px), calc(-50% + ${mouseOffset.y}px)) scale(${scale}) rotateX(${-mouseOffset.y * 0.15}deg) rotateY(${mouseOffset.x * 0.15}deg)` 
            : `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
          transformOrigin: "center center",
          transition: "transform 0.1s ease-out",
        }}
      >
        <div
          className="orbit-rotation-wrapper"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {showPath && (
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${baseWidth} ${baseWidth}`}
              className="orbit-path-svg"
            >
              <path d={path} fill="none" stroke={pathColor} strokeWidth={pathWidth / scale} />
            </svg>
          )}

          {items.map((item, index) => (
            <OrbitItem
              key={index}
              item={item}
              index={index}
              totalItems={items.length}
              path={path}
              itemSize={itemSize}
              rotation={rotation}
              progress={progress}
              fill={fill}
            />
          ))}
        </div>
      </div>

      {centerContent && (
        <div className="orbit-center-content">
          {centerContent}
        </div>
      )}
    </div>
  );
}
