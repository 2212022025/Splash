
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HardDrive } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StoragePage() {
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
          <HardDrive size={18} className="text-amber-400" />
          <h1 className="font-headline font-bold text-sm tracking-tight text-white uppercase italic">Private Storage</h1>
        </div>
      </header>
      
      <main className="flex-1 w-full bg-[#121212] relative">
        <iframe 
          src="https://ura-pvt-stg.netlify.app/" 
          className="absolute inset-0 w-full h-full border-none"
          title="Storage Hub"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </main>
    </div>
  );
}
