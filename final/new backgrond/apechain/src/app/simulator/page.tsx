import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SimulatorPage() {
  return (
    <div className="h-screen w-full bg-[#0B1118] relative overflow-hidden">
      {/* Small floating back button to return to the main site */}
      <Link 
        href="/" 
        className="fixed top-4 left-4 z-[9999] bg-[#0d1117]/80 hover:bg-[#1a2230] text-white p-2 rounded-md border border-white/10 transition-all shadow-lg backdrop-blur-md flex items-center justify-center group"
        title="Back to Home"
      >
        <ArrowLeft size={18} className="opacity-70 group-hover:opacity-100 transition-opacity" />
      </Link>
      
      {/* We embed the React Vite App (Option Simulator) using an iframe full screen */}
      <iframe 
        src="/simulator-app/index.html" 
        className="w-full h-full border-none"
        title="Option Simulator"
      />
    </div>
  );
}
