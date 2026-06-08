'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, BarChart3, Download, Share2, RotateCcw, Eye, Bookmark, ChevronRight } from 'lucide-react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { TOKENS, SCENE_ORDER, SCENE_LABELS, TYPOGRAPHY } from '../../constants';

interface CommandItem {
  id: string;
  label: string;
  category: 'Navigation' | 'Actions' | 'Export' | 'View';
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const { isCommandOpen, toggleCommand, setScene, setPhase, showBenchmark, toggleBenchmark, bookmarks, addBookmark, removeBookmark, currentScene } = useTerminalStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allCommands: CommandItem[] = useMemo(() => {
    const nav: CommandItem[] = SCENE_ORDER.map((id, i) => ({
      id: `scene-${id}`,
      label: SCENE_LABELS[id],
      category: 'Navigation',
      shortcut: `${i + 1}`,
      action: () => { setScene(id); toggleCommand(); },
    }));

    const bookmarkCmd: CommandItem = bookmarks.includes(currentScene)
      ? { id: 'unbookmark', label: 'Remove Bookmark', category: 'View', action: () => { removeBookmark(currentScene); toggleCommand(); } }
      : { id: 'bookmark', label: 'Bookmark Current Scene', category: 'View', action: () => { addBookmark(currentScene); toggleCommand(); } };

    const view: CommandItem[] = [
      bookmarkCmd,
      { id: 'toggle-bm', label: showBenchmark ? 'Hide Benchmark' : 'Show Benchmark', category: 'View', action: () => { toggleBenchmark(); toggleCommand(); } },
    ];

    const actions: CommandItem[] = [
      { id: 'share', label: 'Share Report', category: 'Actions', action: () => { toggleCommand(); } },
      { id: 'new', label: 'New Analysis', category: 'Actions', shortcut: 'R', action: () => { setPhase('upload'); toggleCommand(); } },
    ];

    const exportItems: CommandItem[] = [
      { id: 'export-csv', label: 'Export CSV Metrics', category: 'Export', action: () => { toggleCommand(); } },
      { id: 'export-pdf', label: 'Export PDF Report', category: 'Export', action: () => { toggleCommand(); } },
    ];

    return [...nav, ...view, ...actions, ...exportItems];
  }, [setScene, toggleCommand, setPhase, showBenchmark, toggleBenchmark, bookmarks, addBookmark, removeBookmark, currentScene]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allCommands;
    const q = search.toLowerCase();
    return allCommands.filter((c) => c.label.toLowerCase().includes(q));
  }, [allCommands, search]);

  const execute = useCallback((cmd: CommandItem) => {
    cmd.action();
    setSearch('');
    setSelected(0);
  }, []);

  useEffect(() => {
    if (isCommandOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelected(0);
      setSearch('');
    }
  }, [isCommandOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isCommandOpen) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelected((s) => Math.min(s + 1, filtered.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelected((s) => Math.max(s - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filtered[selected]) execute(filtered[selected]);
          break;
        case 'Escape':
          e.preventDefault();
          toggleCommand();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isCommandOpen, filtered, selected, execute, toggleCommand]);

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isCommandOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh]"
          style={{ background: TOKENS.alpha('#18212B', 0.25) }}
          onClick={(e) => { if (e.target === e.currentTarget) toggleCommand(); }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-xl rounded overflow-hidden border"
            style={{
              background: TOKENS.bg2,
              borderColor: TOKENS.b1,
              boxShadow: TOKENS.shadowModal,
            }}
          >
            {/* Search bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: TOKENS.b1 }}>
              <Search size={16} style={{ color: TOKENS.t2 }} />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelected(0); }}
                placeholder="Type a command..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.body }}
              />
              {search && (
                <button onClick={() => { setSearch(''); setSelected(0); }} style={{ color: TOKENS.t2 }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div
                    className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: TOKENS.t2 }}
                  >
                    {cat}
                  </div>
                  {items.map((cmd) => {
                    const globalIndex = filtered.indexOf(cmd);
                    const isSelected = globalIndex === selected;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => execute(cmd)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                        style={{
                          background: isSelected ? TOKENS.bg3 : 'transparent',
                          color: isSelected ? TOKENS.t0 : TOKENS.t1,
                        }}
                      >
                        <span className="w-4 flex justify-center">
                          {cat === 'Navigation' && <BarChart3 size={14} />}
                          {cat === 'View' && (cmd.id.startsWith('bookmark') ? <Bookmark size={14} /> : <Eye size={14} />)}
                          {cat === 'Actions' && (cmd.id === 'share' ? <Share2 size={14} /> : <RotateCcw size={14} />)}
                          {cat === 'Export' && <Download size={14} />}
                        </span>
                        <span className="flex-1 text-sm">{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: TOKENS.bg3, color: TOKENS.t2, fontFamily: TYPOGRAPHY.mono }}
                          >
                            {cmd.shortcut}
                          </kbd>
                        )}
                        <ChevronRight size={12} style={{ color: TOKENS.t3 }} />
                      </button>
                    );
                  })}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-sm" style={{ color: TOKENS.t2 }}>
                  No commands found
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-2.5 text-[10px] border-t"
              style={{ borderColor: TOKENS.b1, color: TOKENS.t3 }}
            >
              <span>↑↓ to navigate · Enter to select · Esc to close</span>
              <span style={{ fontFamily: TYPOGRAPHY.mono }}>Cmd+K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
