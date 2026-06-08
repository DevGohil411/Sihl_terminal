'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SceneId } from '../types';

export interface TerminalState {
  phase: 'upload' | 'exec' | 'report';
  currentScene: SceneId;
  isSidebarOpen: boolean;
  isCommandOpen: boolean;
  isExportOpen: boolean;
  showBenchmark: boolean;
  reducedMotion: boolean;
  bookmarks: string[];
  filename: string;
  setPhase: (phase: 'upload' | 'exec' | 'report') => void;
  setScene: (scene: SceneId) => void;
  toggleSidebar: () => void;
  toggleCommand: () => void;
  toggleExport: () => void;
  toggleBenchmark: () => void;
  setReducedMotion: (v: boolean) => void;
  addBookmark: (id: string) => void;
  removeBookmark: (id: string) => void;
  setFilename: (name: string) => void;
}

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set) => ({
      phase: 'upload',
      currentScene: 'executive-summary',
      isSidebarOpen: true,
      isCommandOpen: false,
      isExportOpen: false,
      showBenchmark: true,
      reducedMotion: false,
      bookmarks: [],
      filename: '',

      setPhase: (phase) => set({ phase }),
      setScene: (scene) => set({ currentScene: scene }),
      toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
      toggleCommand: () => set((s) => ({ isCommandOpen: !s.isCommandOpen })),
      toggleExport: () => set((s) => ({ isExportOpen: !s.isExportOpen })),
      toggleBenchmark: () => set((s) => ({ showBenchmark: !s.showBenchmark })),
      setReducedMotion: (v) => set({ reducedMotion: v }),
      addBookmark: (id) => set((s) => ({ bookmarks: s.bookmarks.includes(id) ? s.bookmarks : [...s.bookmarks, id] })),
      removeBookmark: (id) => set((s) => ({ bookmarks: s.bookmarks.filter((b) => b !== id) })),
      setFilename: (name) => set({ filename: name }),
    }),
    {
      name: 'terminal-store',
      partialize: (s) => ({
        isSidebarOpen: s.isSidebarOpen,
        reducedMotion: s.reducedMotion,
        bookmarks: s.bookmarks,
      }),
    }
  )
);
