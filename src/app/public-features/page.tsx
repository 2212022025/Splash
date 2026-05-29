
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HardDrive, MessageSquareShare, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PublicFeaturesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col text-white">
      <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 px-6 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white/60 hover:text-white"
          onClick={() => router.back()}
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-2">
          <Globe size={20} className="text-emerald-400" />
          <h1 className="font-headline font-bold text-lg tracking-tight uppercase italic">Public Features</h1>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-4 py-12">
        <Link href="/public-features/storage" className="block animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-[#161616] border border-white/5 p-8 rounded-3xl flex items-center gap-8 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all group active:scale-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
              <HardDrive size={32} className="text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-headline font-bold text-white uppercase tracking-tight">Storage</span>
              <span className="text-white/30 text-xs font-bold uppercase tracking-widest">URA-PVT-STG Link</span>
            </div>
          </div>
        </Link>

        <Link href="/public-features/chat" className="block animate-in slide-in-from-bottom-4 duration-400">
          <div className="bg-[#161616] border border-white/5 p-8 rounded-3xl flex items-center gap-8 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all group active:scale-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <MessageSquareShare size={32} className="text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-headline font-bold text-white uppercase tracking-tight">Public Chat</span>
              <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Server: EBMS-09</span>
            </div>
          </div>
        </Link>
      </main>
    </div>
  );
}
