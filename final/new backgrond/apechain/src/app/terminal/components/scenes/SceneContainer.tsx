'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { TOKENS, TYPOGRAPHY } from '../../constants';
import type { SceneId } from '../../types';

interface SceneContainerProps {
  id: SceneId;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function SceneContainer({ id, title, subtitle, children, className = '' }: SceneContainerProps) {
  const ref = useRef<HTMLElement>(null);
  const { setScene } = useTerminalStore();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setScene(id);
        }
      },
      { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [id, setScene]);

  return (
    <motion.section
      ref={ref}
      id={id}
      className={`min-h-[70vh] py-20 ${className}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Section header */}
      <div className="mb-10">
        <div
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: TOKENS.gold, fontFamily: TYPOGRAPHY.body }}
        >
          {id.replace(/-/g, ' ')}
        </div>
        <h2
          className="text-[28px] leading-tight"
          style={{ fontFamily: TYPOGRAPHY.display, color: TOKENS.t0, fontWeight: 600 }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: TOKENS.t1, fontFamily: TYPOGRAPHY.body }}>
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </motion.section>
  );
}
