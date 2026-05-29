
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogOut, Zap, Gamepad2, BrainCircuit, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface DashboardProps {
  user: { username: string; email: string; chatName: string };
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Splash Header Branding */}
      <div className="bg-primary/10 py-2 border-b border-white/5 text-center">
        <span className="text-[10px] text-accent font-headline tracking-[0.5em] uppercase animate-glow-pulse">
          Splash Transmission Active
        </span>
      </div>

      <header className="h-20 border-b border-white/5 bg-[#121212]/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center neon-glow">
            <Zap size={18} className="text-accent" />
          </div>
          <h1 className="font-headline text-2xl tracking-tighter text-white">Splash</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white leading-none">{user.username}</p>
              <p className="text-[10px] text-accent uppercase tracking-tighter font-headline">@{user.chatName}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent/20 border border-white/10 flex items-center justify-center font-headline text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout} className="text-white/40 hover:text-destructive transition-colors">
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-12 py-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-white tracking-tighter">
            Digital <span className="text-accent neon-text">Hub</span>
          </h2>
          <p className="text-white/50 max-w-lg mx-auto">
            Welcome back, {user.username}. Access your connected services and tools from the decentralized network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gaming Hub */}
          <Card className="bg-[#1a1a1a] border-white/5 group hover:border-accent/40 transition-all duration-500 overflow-hidden flex flex-col">
            <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center relative">
              <Gamepad2 size={48} className="text-accent group-hover:scale-110 transition-transform duration-500 opacity-80" />
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <CardHeader className="flex-1">
              <CardTitle className="text-white font-headline text-2xl">Gaming Hub</CardTitle>
              <CardDescription className="text-white/40">
                Access ConsolesProx for a premium cloud gaming experience. Optimized for low latency.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white font-headline uppercase tracking-widest text-xs h-12">
                <a href="https://consolesprox.netlify.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  Launch Console <ExternalLink size={14} />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* AI Services */}
          <Card className="bg-[#1a1a1a] border-white/5 group hover:border-accent/40 transition-all duration-500 overflow-hidden flex flex-col">
            <div className="h-32 bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center relative">
              <BrainCircuit size={48} className="text-accent group-hover:scale-110 transition-transform duration-500 opacity-80" />
              <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <CardHeader className="flex-1">
              <CardTitle className="text-white font-headline text-2xl">AI Services</CardTitle>
              <CardDescription className="text-white/40">
                Interact with Splash AI. Get answers, perform calculations, and explore intelligent automation.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild className="w-full bg-accent text-background hover:bg-accent/90 font-headline uppercase tracking-widest text-xs h-12">
                <Link href="/ai-services" className="flex items-center gap-2">
                  Initialize AI <Zap size={14} />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="p-8 text-center border-t border-white/5">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-headline">Splash &bull; Powered by VLF-Tec Architecture</p>
      </footer>
    </div>
  );
}
