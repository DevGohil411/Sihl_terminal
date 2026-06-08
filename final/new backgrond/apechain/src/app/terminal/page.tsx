'use client';

import { AnimatePresence } from 'framer-motion';
import { useTerminalStore } from './stores/useTerminalStore';
import { useKeyboard } from './hooks/useKeyboard';


import {
  Topbar,
  Sidebar,
  CommandPalette,
} from './components/ui';

import {
  UploadPhase,
  ExecPhase,
  ExecutiveSummary,
  Performance,
  Risk,
  Drawdowns,
  MonteCarlo,
  TradeDiagnostics,
  AIInsights,
  FinalVerdict,
} from './components/scenes';

export default function TerminalPage() {
  const { phase, isSidebarOpen } = useTerminalStore();

  useKeyboard();

  return (
    <div className="min-h-screen relative">
      {/* Background image — visible globally */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(/bg_green_soft.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />
      <Topbar />
      <Sidebar />
      <CommandPalette />

      <main
        className="pt-12 transition-all duration-300 ease-out"
        style={{
          marginLeft: isSidebarOpen ? '260px' : '0',
        }}
      >
        <AnimatePresence mode="wait">
          {phase === 'upload' && (
            <UploadPhase key="upload" />
          )}
          {phase === 'exec' && (
            <ExecPhase key="exec" />
          )}
          {phase === 'report' && (
            <div key="report" className="px-8 lg:px-12 pb-24">
              <ExecutiveSummary />
              <Performance />
              <Risk />
              <Drawdowns />
              <MonteCarlo />
              <TradeDiagnostics />
              <AIInsights />
              <FinalVerdict />
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
