'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { TOKENS, TYPOGRAPHY } from '../../constants';
import { EXEC_STEPS } from '../../data';

export function ExecPhase() {
  const { setPhase } = useTerminalStore();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < EXEC_STEPS.length - 1) {
      const delay = currentStep === 0 ? 600 : 400 + Math.random() * 300;
      const timer = setTimeout(() => setCurrentStep((s) => s + 1), delay);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setPhase('report'), 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep, setPhase]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen px-4"
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h2
            className="text-xl font-semibold mb-1"
            style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.display }}
          >
            Analyzing Strategy
          </h2>
          <p className="text-sm" style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}>
            Running full diagnostic pipeline...
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full mb-10 overflow-hidden" style={{ background: TOKENS.bg3 }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: TOKENS.chartPrimary }}
            animate={{ width: `${((currentStep + 1) / EXEC_STEPS.length) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-1">
          {EXEC_STEPS.map((step, i) => {
            const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 px-5 py-3.5 rounded transition-colors"
                style={{
                  background: state === 'active' ? TOKENS.bg2 : 'transparent',
                  borderLeft: state === 'active' ? `2px solid ${TOKENS.chartPrimary}` : '2px solid transparent',
                }}
              >
                <span className="mt-0.5">
                  {state === 'done' && <CheckCircle2 size={16} style={{ color: TOKENS.positive }} />}
                  {state === 'active' && <Loader2 size={16} className="animate-spin" style={{ color: TOKENS.chartPrimary }} />}
                  {state === 'pending' && <div className="w-4 h-4 rounded-full border" style={{ borderColor: TOKENS.t3 }} />}
                </span>
                <div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: state === 'active' ? TOKENS.t0 : TOKENS.t1, fontFamily: TYPOGRAPHY.body }}
                  >
                    {step.label}
                  </div>
                  <div className="text-[11px]" style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}>
                    {step.sub}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
