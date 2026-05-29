
"use client";

import React from 'react';

export function SplashSequence() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212]">
      <div className="text-center animate-splash">
        <div className="relative inline-block">
          <h1 className="font-headline text-5xl md:text-7xl tracking-tighter text-white mb-2 font-extrabold">
            VLF-Tec
          </h1>
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-accent rounded-full animate-glow-pulse neon-glow"></div>
        </div>
        <p className="mt-6 font-body text-xs tracking-widest text-accent uppercase opacity-80 neon-text">
          Digital Evolution
        </p>
      </div>
    </div>
  );
}
