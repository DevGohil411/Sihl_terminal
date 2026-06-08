'use client';
import { useEffect, useState } from 'react';

// The Replay Bar backend URL — update this if deployed elsewhere
const REPLAY_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://disposition-split-lesson-holmes.trycloudflare.com';

export default function BuildPage() {
  const [mounted, setMounted] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    // Expose the API URL on the parent window so the iframe can read it immediately
    // via window.parent.NEXT_PUBLIC_API_URL during its DOMContentLoaded
    (window as any).NEXT_PUBLIC_API_URL = REPLAY_API_URL;
    setMounted(true);
  }, []);

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    setIframeReady(true);
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        margin: 0,
        padding: 0,
        background: '#0d1117',
        overflow: 'hidden',
      }}
    >
      {/* Loading overlay shown until iframe is ready */}
      {!iframeReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            background: '#0d1117',
            color: '#787b86',
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              border: '3px solid #2e3347',
              borderTopColor: '#2962ff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span>Loading Chart Engine…</span>
        </div>
      )}

      <iframe
        key={Date.now()}
        src={`/replay-bar.html?v=${Date.now()}`}
        title="SIHL Replay Bar Chart Engine"
        onLoad={handleIframeLoad}
        style={{
          width: '100vw',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0,
          display: 'block',
          opacity: iframeReady ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
        allow="fullscreen"
      />
    </div>
  );
}
