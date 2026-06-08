'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, ChevronRight } from 'lucide-react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { TOKENS, TYPOGRAPHY } from '../../constants';

export function UploadPhase() {
  const { setPhase, setFilename } = useTerminalStore();
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFilename(file.name);
      setPhase('exec');
    }
  }, [setFilename, setPhase]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFilename(file.name);
      setPhase('exec');
    }
  }, [setFilename, setPhase]);

  const simulateUpload = useCallback(() => {
    setFilename('nifty_momentum_v3.py');
    setPhase('exec');
  }, [setFilename, setPhase]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen px-4"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="text-center mb-14"
      >
        <h1
          className="text-[42px] leading-tight font-semibold mb-4"
          style={{ color: TOKENS.t0, fontFamily: TYPOGRAPHY.display }}
        >
          QuantLab
        </h1>
        <p className="text-sm" style={{ color: TOKENS.t2, fontFamily: TYPOGRAPHY.body }}>
          Upload a strategy file to generate an institutional-grade tear sheet
        </p>
      </motion.div>

      {/* Drop zone */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
        className="w-full max-w-lg border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-200"
        style={{
          borderColor: dragOver ? TOKENS.chartPrimary : TOKENS.b1,
          background: dragOver ? TOKENS.bg3 : TOKENS.bg1,
          borderRadius: '4px',
        }}
      >
        <Upload size={32} className="mx-auto mb-4" style={{ color: TOKENS.chartPrimary }} />
        <p
          className="text-sm font-medium mb-1"
          style={{ color: TOKENS.t1, fontFamily: TYPOGRAPHY.body }}
        >
          Drop your strategy file here
        </p>
        <p className="text-[11px]" style={{ color: TOKENS.t3, fontFamily: TYPOGRAPHY.body }}>
          or click to browse · .py, .csv, .json supported
        </p>
        <input
          id="file-input"
          type="file"
          accept=".py,.csv,.json"
          className="hidden"
          onChange={handleFileInput}
        />
      </motion.div>

      {/* Quick start */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-10"
      >
        <button
          onClick={simulateUpload}
          className="flex items-center gap-2 text-[11px] px-5 py-2.5 border transition-colors"
          style={{
            borderColor: TOKENS.b1,
            color: TOKENS.t2,
            borderRadius: '4px',
            fontFamily: TYPOGRAPHY.body,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = TOKENS.bg3; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <FileText size={12} />
          Or run with sample strategy
          <ChevronRight size={12} />
        </button>
      </motion.div>

      {/* Supported features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-14 flex flex-wrap justify-center gap-3"
      >
        {['Equity Curve', 'Risk Metrics', 'Monte Carlo', 'Trade Diagnostics', 'AI Insights'].map((f) => (
          <span
            key={f}
            className="text-[10px] px-3 py-1.5 border"
            style={{ borderColor: TOKENS.b1, color: TOKENS.t2, borderRadius: '3px', fontFamily: TYPOGRAPHY.body }}
          >
            {f}
          </span>
        ))}
      </motion.div>
    </motion.div>
  );
}
