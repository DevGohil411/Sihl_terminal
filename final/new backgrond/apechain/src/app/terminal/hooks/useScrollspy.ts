'use client';

import { useEffect } from 'react';
import { useTerminalStore } from '../stores/useTerminalStore';
import { SCENE_ORDER } from '../constants';

export function useScrollspy() {
  const { currentScene, setScene } = useTerminalStore();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const offsets = SCENE_ORDER.map((id) => {
        const el = document.getElementById(id);
        return el ? { id, top: el.offsetTop } : { id, top: Infinity };
      });

      // Find current scene based on scroll position
      for (let i = offsets.length - 1; i >= 0; i--) {
        if (scrollY >= offsets[i].top - 200) {
          if (offsets[i].id !== currentScene) {
            setScene(offsets[i].id as typeof currentScene);
          }
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentScene, setScene]);
}
