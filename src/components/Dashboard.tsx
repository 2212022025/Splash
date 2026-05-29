
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Zap, Gamepad2, BrainCircuit, UserCircle, Mail, MessageSquare, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DashboardProps {
  user: { username: string; email: string; chatName: string };
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const handleHelpReport = () => {
    window.location.href = "mailto:uranetworksresponse@gmail.com";
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      <header className="h-20 border-b border-white/5 bg-[#121212]/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center neon-glow">
            <Zap size={18} className="text-accent" />
          </div>
          <h1 className="font-headline text-2xl tracking-tighter text-white font-extrabold uppercase italic">Splash</h1>
        </div>

        <Button variant="ghost" size="icon" onClick={onLogout} className="text-white/40 hover:text-destructive">
          <LogOut size={20} />
        </Button>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-4 py-12">
        <div className="grid grid-cols-1 gap-4">
          
          {/* Gaming Hub */}
          <a href="https://consolesprox.netlify.app/" target="_blank" rel="noopener noreferrer" className="block">
            <div className="bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl flex items-center gap-6 hover:bg-primary/10 hover:border-accent/40 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Gamepad2 size={28} className="text-blue-400" />
              </div>
              <span className="text-xl font-headline font-bold text-white uppercase tracking-tight">Gaming Hub</span>
            </div>
          </a>

          {/* AI Services */}
          <Link href="/ai-services" className="block">
            <div className="bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl flex items-center gap-6 hover:bg-accent/10 hover:border-accent/40 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
                <BrainCircuit size={28} className="text-cyan-400" />
              </div>
              <span className="text-xl font-headline font-bold text-white uppercase tracking-tight">AI Services</span>
            </div>
          </Link>

          {/* Account & Service */}
          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl flex items-center gap-6 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                  <UserCircle size={28} className="text-purple-400" />
                </div>
                <span className="text-xl font-headline font-bold text-white uppercase tracking-tight">Account & Service</span>
              </div>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-sm rounded-3xl">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl uppercase italic tracking-tighter">My Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <UserCircle size={18} className="text-accent" />
                    <div>
                      <p className="text-[10px] uppercase text-white/40 tracking-widest">Username</p>
                      <p className="font-bold">{user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare size={18} className="text-accent" />
                    <div>
                      <p className="text-[10px] uppercase text-white/40 tracking-widest">Chat Name</p>
                      <p className="font-bold">@{user.chatName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-accent" />
                    <div>
                      <p className="text-[10px] uppercase text-white/40 tracking-widest">Email</p>
                      <p className="font-bold">{user.email}</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleHelpReport}
                  className="w-full bg-accent text-background hover:bg-accent/90 font-headline uppercase tracking-widest text-xs h-12 flex items-center gap-2"
                >
                  <HelpCircle size={16} /> Help & Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </main>

      <footer className="p-8 text-center border-t border-white/5">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-headline">Splash &bull; Powered by VLF-Tec</p>
      </footer>
    </div>
  );
}
