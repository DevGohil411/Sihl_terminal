'use client';

import Link from 'next/link';
import { PanelLeft, Command, Download, RotateCcw, User } from 'lucide-react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { TOKENS, TYPOGRAPHY } from '../../constants';

export function Topbar() {
  const { filename, isSidebarOpen, toggleSidebar, toggleCommand, toggleExport, setPhase } = useTerminalStore();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] h-12 flex items-center px-5 border-b"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderColor: 'rgba(255,255,255,0.10)',
      }}
    >
      {/* Left group */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded transition-colors"
          style={{ color: isSidebarOpen ? TOKENS.gold : TOKENS.t2 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          title="Toggle sidebar [S]"
        >
          <PanelLeft size={16} />
        </button>

        <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.10)' }} />

        <span
          className="text-sm font-semibold tracking-tight"
          style={{ fontFamily: TYPOGRAPHY.display, color: TOKENS.t0 }}
        >
          SIHL
        </span>
        <span className="text-xs" style={{ color: TOKENS.t2 }}>
          / {filename || 'Untitled Strategy'}
        </span>
      </div>

      {/* Center - Status pills */}
      <div className="hidden md:flex flex-1 justify-center gap-2">
        {[
          { label: 'Model', value: 'Q-3.2', color: TOKENS.gold },
          { label: 'Latency', value: '32ms', color: TOKENS.t2 },
          { label: 'Coverage', value: '95%', color: TOKENS.chartSecondary },
        ].map((s) => (
          <span
            key={s.label}
            className="text-[10px] px-2.5 py-0.5 rounded border"
            style={{ borderColor: 'rgba(255,255,255,0.10)', color: TOKENS.t2 }}
          >
            {s.label}: <span style={{ color: s.color, fontFamily: TYPOGRAPHY.mono }}>{s.value}</span>
          </span>
        ))}
      </div>

      {/* Right group */}
      <div className="flex items-center gap-1.5 ml-auto">
        <button
          onClick={() => toggleCommand()}
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded border transition-colors"
          style={{ borderColor: 'rgba(255,255,255,0.10)', color: TOKENS.t2 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          title="Command palette [Cmd+K]"
        >
          <Command size={12} />
          <span className="hidden sm:inline">Cmd K</span>
        </button>

        <button
          onClick={() => toggleExport()}
          className="p-1.5 rounded transition-colors"
          style={{ color: TOKENS.t2 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          title="Export [E]"
        >
          <Download size={16} />
        </button>

        <button
          onClick={() => setPhase('upload')}
          className="p-1.5 rounded transition-colors"
          style={{ color: TOKENS.t2 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          title="New analysis [R]"
        >
          <RotateCcw size={16} />
        </button>

        <div className="h-4 w-px mx-1" style={{ background: 'rgba(255,255,255,0.10)' }} />

        <Link
          href="/login"
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded border transition-colors"
          style={{ borderColor: 'rgba(255,255,255,0.10)', color: TOKENS.t2 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <User size={12} />
          <span className="hidden sm:inline">Login</span>
        </Link>
      </div>
    </header>
  );
}
