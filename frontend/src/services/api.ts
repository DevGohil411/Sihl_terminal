const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  getCandles: async (tf: string, limit: number = 0) => {
    const res = await fetch(`${API_URL}/api/candles?tf=${tf}&limit=${limit}`);
    return res.json();
  },
  getImbalances: async (tf: string) => {
    const res = await fetch(`${API_URL}/api/imbalances?tf=${tf}`);
    return res.json();
  },
  getIndicators: async () => {
    const res = await fetch(`${API_URL}/api/indicators/list`);
    return res.json();
  },
  getReplay: async () => {
    // Added based on Verify instructions
    const res = await fetch(`${API_URL}/api/replay`);
    return res.json();
  },
  getOrderBlocks: async (tf: string) => {
    // Added based on Verify instructions
    const res = await fetch(`${API_URL}/api/indicators/orderblocks?tf=${tf}`);
    return res.json();
  }
};
