'use client';
import { useEffect } from 'react';
import { api } from '../services/api';

export default function Home() {
  useEffect(() => {
    (window as any).NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    (window as any).api = api;
  }, []);

  return (
    <iframe 
      src="/index.html" 
      style={{
        width: '100vw', 
        height: '100vh', 
        border: 'none', 
        margin: 0, 
        padding: 0, 
        display: 'block'
      }}
    />
  );
}
