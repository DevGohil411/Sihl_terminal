'use client';

import { create } from 'zustand';

export interface PlaybackState {
  isPlaying: boolean;
  currentTrade: number;
  speed: number; // 0.5, 1, 2, 4
  totalTrades: number;
  setPlaying: (v: boolean) => void;
  setCurrentTrade: (n: number) => void;
  setSpeed: (n: number) => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  isPlaying: false,
  currentTrade: 0,
  speed: 1,
  totalTrades: 842,
  setPlaying: (v) => set({ isPlaying: v }),
  setCurrentTrade: (n) => set({ currentTrade: n }),
  setSpeed: (n) => set({ speed: n }),
}));
