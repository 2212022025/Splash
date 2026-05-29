
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Zap, Gamepad2, BrainCircuit, UserCircle, Globe } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, MessageSquare, HelpCircle } from 'lucide-react';

interface DashboardProps {
  user: { username: string; email: string; chatName: string };
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const handleHelpReport = () => {
    window.location.href = "mailto:uranetworksresponse@gmail.com";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-white/10 neon-glow">
            <Zap size={22} className="text-accent" />
          </div>
          <h1 className="font-headline text-3xl tracking-tighter text-white font-extrabold uppercase italic">Splash</h1>
        </div>

        <Button variant="ghost" size="icon" onClick={onLogout} className="text-white/40 hover:text-destructive">
          <LogOut size={20} />
        </Button>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-4 py-12">
        {/* Gaming Hub */}
        <Link href="/gaming-hub" className="block animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-[#161616] border border-white/5 p-8 rounded-3xl flex items-center gap-8 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all group active:scale-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Gamepad2 size={32} className="text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-headline font-bold text-white uppercase tracking-tight">Gaming Hub</span>
              <span className="text-white/30 text-xs font-bold uppercase tracking-widest">External Node 01</span>
            </div>
          </div>
        </Link>

        {/* AI Services */}
        <Link href="/ai-services" className="block animate-in slide-in-from-bottom-4 duration-400">
          <div className="bg-[#161616] border border-white/5 p-8 rounded-3xl flex items-center gap-8 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all group active:scale-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <BrainCircuit size={32} className="text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-headline font-bold text-white uppercase tracking-tight">AI Services</span>
              <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Neural Link 02</span>
            </div>
          </div>
        </Link>

        {/* Public Feature */}
        <Link href="/public-features" className="block animate-in slide-in-from-bottom-6 duration-500">
          <div className="bg-[#161616] border border-white/5 p-8 rounded-3xl flex items-center gap-8 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all group active:scale-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Globe size={32} className="text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-headline font-bold text-white uppercase tracking-tight">Public Feature</span>
              <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Sub Menu 03</span>
            </div>
          </div>
        </Link>

        {/* Account & Service */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="cursor-pointer bg-[#161616] border border-white/5 p-8 rounded-3xl flex items-center gap-8 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all group active:scale-95 duration-200 animate-in slide-in-from-bottom-8 duration-600">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                <UserCircle size={32} className="text-purple-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-headline font-bold text-white uppercase tracking-tight">Account & Service</span>
                <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Profile Control</span>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="bg-[#161616] border-white/5 text-white max-w-sm rounded-[2rem] p-8">
            <DialogHeader>
              <DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter text-center mb-6">My Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <UserCircle size={20} className="text-accent" />
                  <div>
                    <p className="text-[10px] uppercase text-white/30 tracking-[0.2em] font-bold">Username</p>
                    <p className="font-bold text-lg">{user.username.replace('#225', '')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <MessageSquare size={20} className="text-accent" />
                  <div>
                    <p className="text-[10px] uppercase text-white/30 tracking-[0.2em] font-bold">Chat Name</p>
                    <p className="font-bold text-lg">@{user.chatName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <Mail size={20} className="text-accent" />
                  <div>
                    <p className="text-[10px] uppercase text-white/30 tracking-[0.2em] font-bold">Email</p>
                    <p className="font-bold text-sm truncate max-w-[200px]">{user.email}</p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleHelpReport}
                className="w-full bg-accent text-background hover:bg-accent/90 font-headline uppercase tracking-widest text-xs h-14 rounded-2xl flex items-center justify-center gap-2 group"
              >
                <HelpCircle size={18} className="group-hover:rotate-12 transition-transform" /> Help & Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <footer className="p-8 text-center mt-auto">
        <p className="text-[10px] text-white/10 uppercase tracking-[0.6em] font-headline">SV-12 Pro Active &bull; VLF-Tec System</p>
      </footer>
    </div>
  );
}
