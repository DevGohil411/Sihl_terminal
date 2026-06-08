'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Shield, TrendingDown, Activity, Zap, BrainCircuit, Gavel, Bookmark, XCircle } from 'lucide-react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { TOKENS, NAV_ITEMS, SCENE_LABELS, TYPOGRAPHY } from '../../constants';
import type { SceneId } from '../../types';

const ICONS: Record<SceneId, React.ReactNode> = {
  'executive-summary': <BarChart3 size={14} />,
  'performance': <TrendingUp size={14} />,
  'risk': <Shield size={14} />,
  'drawdowns': <TrendingDown size={14} />,
  'monte-carlo': <Activity size={14} />,
  'trade-diagnostics': <Zap size={14} />,
  'ai-insights': <BrainCircuit size={14} />,
  'final-verdict': <Gavel size={14} />,
};

export const Sidebar = memo(function Sidebar() {
  const { isSidebarOpen, currentScene, setScene, bookmarks, addBookmark, removeBookmark } = useTerminalStore();

  const handleNav = (id: SceneId) => {
    setScene(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleBookmark = (id: SceneId) => {
    if (bookmarks.includes(id)) removeBookmark(id);
    else addBookmark(id);
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.aside
          initial={{ x: -260 }}
          animate={{ x: 0 }}
          exit={{ x: -260 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="fixed left-0 top-12 bottom-0 w-[260px] z-[90] border-r overflow-y-auto"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderColor: 'rgba(255,255,255,0.10)',
          }}
        >
          {/* Section: Scenes */}
          <div className="px-3 py-6">
            <div
              className="text-[9px] font-semibold uppercase tracking-widest px-3 mb-3"
              style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}
            >
              Report Sections
            </div>
            <nav className="space-y-px">
              {NAV_ITEMS.map((item, i) => {
                const isActive = currentScene === item.id;
                const isBookmarked = bookmarks.includes(item.id);
                return (
                  <div key={item.id} className="group relative">
                    <button
                      onClick={() => handleNav(item.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors relative"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: isActive ? TOKENS.gold : TOKENS.t1,
                        borderLeft: isActive ? `2px solid ${TOKENS.gold}` : '2px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <span style={{ color: isActive ? TOKENS.gold : TOKENS.t2 }}>
                        {ICONS[item.id]}
                      </span>
                      <span className="flex-1 font-medium text-[13px]">{item.label}</span>
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: TOKENS.t3, fontFamily: TYPOGRAPHY.mono }}
                      >
                        {i + 1}
                      </span>
                    </button>
                    {/* Bookmark button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id); }}
                      className="absolute right-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                      style={{ color: isBookmarked ? TOKENS.gold : TOKENS.t3 }}
                      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                    >
                      <Bookmark size={11} fill={isBookmarked ? TOKENS.gold : 'none'} />
                    </button>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.10)' }} />

          {/* Section: Bookmarks */}
          <div className="px-3 py-5">
            <div
              className="text-[9px] font-semibold uppercase tracking-widest px-3 mb-2"
              style={{ color: TOKENS.t2 }}
            >
              Bookmarks
            </div>
            {bookmarks.length === 0 ? (
              <div className="px-3 py-2 text-[11px] leading-relaxed" style={{ color: TOKENS.t3 }}>
                No bookmarks yet. Hover a section to bookmark it.
              </div>
            ) : (
              <nav className="space-y-px">
                {bookmarks.map((id) => (
                  <button
                    key={id}
                    onClick={() => handleNav(id as SceneId)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors"
                    style={{ color: TOKENS.t1 }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <Bookmark size={11} style={{ color: TOKENS.gold }} fill={TOKENS.gold} />
                    <span className="flex-1 text-xs">{SCENE_LABELS[id as SceneId]}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeBookmark(id); }}
                      className="p-0.5 rounded opacity-40 hover:opacity-100 transition-opacity"
                      style={{ color: TOKENS.t3 }}
                    >
                      <XCircle size={12} />
                    </button>
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* Divider */}
          <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.10)' }} />

          {/* Section: Keyboard Shortcuts */}
          <div className="px-3 py-5">
            <div
              className="text-[9px] font-semibold uppercase tracking-widest px-3 mb-3"
              style={{ color: TOKENS.t2 }}
            >
              Shortcuts
            </div>
            <div className="space-y-1.5 px-3">
              {[
                { key: '1–8', label: 'Jump to scene' },
                { key: 'Cmd+K', label: 'Command palette' },
                { key: 'E', label: 'Export menu' },
                { key: 'S', label: 'Toggle sidebar' },
                { key: 'R', label: 'New analysis' },
                { key: 'Space', label: 'Play / pause' },
                { key: '?', label: 'Help' },
              ].map((s) => (
                <div key={s.key} className="flex items-center justify-between text-[11px]">
                  <span style={{ color: TOKENS.t2 }}>{s.label}</span>
                  <kbd
                    className="px-1.5 py-0.5 rounded text-[10px]"
                    style={{ background: 'rgba(255,255,255,0.06)', color: TOKENS.t2, fontFamily: TYPOGRAPHY.mono }}
                  >
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
});
