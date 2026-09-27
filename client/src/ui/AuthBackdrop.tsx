import React from 'react';

export const AuthBackdrop: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#05080f] flex flex-col items-center justify-center p-6 relative overflow-hidden text-slate-100">
    <div className="et-grid-bg absolute inset-0 opacity-60 pointer-events-none" />
    <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-gradient-to-b from-cyan-500/15 via-indigo-600/12 to-transparent blur-3xl pointer-events-none" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[420px] h-[320px] bg-rose-500/8 blur-3xl pointer-events-none" />
    <div className="relative z-10 w-full flex flex-col items-center">{children}</div>
  </div>
);
