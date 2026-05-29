
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GamingHubPage() {
  const router = useRouter();

  return (
    <div className="h-screen w-full flex flex-col bg-black overflow-hidden">
      <header className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center px-4 gap-4 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="text-white/60 hover:text-white"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-2">
          <Gamepad2 size={18} className="text-blue-400" />
          <h1 className="font-headline font-bold text-sm tracking-tight text-white uppercase">Gaming Hub</h1>
        </div>
      </header>
      
      <main className="flex-1 w-full bg-[#121212] relative">
        <iframe 
          src="https://consolesprox.netlify.app/" 
          className="absolute inset-0 w-full h-full border-none"
          title="Gaming Hub"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </main>
    </div>
  );
}
