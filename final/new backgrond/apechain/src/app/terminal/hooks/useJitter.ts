'use client';

import { useState, useEffect, useCallback } from 'react';

export function useJitter(initialValue: number, range: number, decimals: number, interval = 2000) {
  const [value, setValue] = useState(initialValue);

  const tick = useCallback(() => {
    const jitter = (Math.random() - 0.5) * 2 * range;
    const next = Math.max(0, initialValue + jitter);
    setValue(Number(next.toFixed(decimals)));
  }, [initialValue, range, decimals]);

  useEffect(() => {
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [tick, interval]);

  return value;
}
