'use client';

import { useEffect, useCallback } from 'react';
import { useTerminalStore } from '../stores/useTerminalStore';
import { usePlaybackStore } from '../stores/usePlaybackStore';
import { SCENE_MAP } from '../constants';

export function useKeyboard() {
  const { phase, setPhase, setScene, toggleCommand, toggleExport, toggleSidebar } = useTerminalStore();
  const { isPlaying, setPlaying } = usePlaybackStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Cmd/Ctrl+K -> command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommand();
        return;
      }

      // Scene navigation only in report
      if (phase === 'report') {
        const sceneId = SCENE_MAP[e.key];
        if (sceneId) {
          e.preventDefault();
          setScene(sceneId);
          return;
        }

        switch (e.key.toLowerCase()) {
          case 'e':
            e.preventDefault();
            toggleExport();
            break;
          case 's':
            e.preventDefault();
            toggleSidebar();
            break;
          case 'r':
            e.preventDefault();
            setPhase('upload');
            break;
          case '?':
          case '/':
            e.preventDefault();
            toggleCommand();
            break;
          case ' ':
            e.preventDefault();
            setPlaying(!isPlaying);
            break;
          case 'escape':
            toggleCommand(); // close if open
            break;
        }
      }
    },
    [phase, setPhase, setScene, toggleCommand, toggleExport, toggleSidebar, isPlaying, setPlaying]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
