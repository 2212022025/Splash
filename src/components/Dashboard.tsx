
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, LayoutDashboard, MessageCircle, Settings, Users, Bell, Search, Zap } from 'lucide-react';

interface DashboardProps {
  user: { username: string; email: string; chatName: string };
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Header */}
      <header className="h-20 border-b border-white/5 bg-[#121212]/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center neon-glow">
            <Zap size={18} className="text-accent" />
          </div>
          <h1 className="font-headline text-2xl tracking-tighter text-white">Splash</h1>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <a href="#" className="text-accent border-b-2 border-accent py-2 px-1">Overview</a>
          <a href="#" className="hover:text-white transition-colors py-2 px-1">Network</a>
          <a href="#" className="hover:text-white transition-colors py-2 px-1">Security</a>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-white/40 hover:text-white transition-colors">
            <Search size={20} />
          </button>
          <button className="text-white/40 hover:text-white transition-colors relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full neon-glow"></span>
          </button>
          <div className="h-8 w-px bg-white/10 mx-2"></div>
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

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column - Stats */}
        <div className="md:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Active Sessions', value: '4', icon: LayoutDashboard },
              { label: 'Messages Received', value: '1,284', icon: MessageCircle },
              { label: 'Network Nodes', value: '18', icon: Users },
            ].map((stat, i) => (
              <Card key={i} className="bg-[#1a1a1a] border-white/5 group hover:border-accent/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon size={20} className="text-accent group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-headline">Live</span>
                  </div>
                  <h3 className="text-white/50 text-xs uppercase tracking-widest font-semibold">{stat.label}</h3>
                  <p className="text-2xl font-headline text-white mt-1">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-[#1a1a1a] border-white/5 min-h-[400px]">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-10">
                <h2 className="font-headline text-xl text-white">Recent Activity</h2>
                <Button variant="outline" size="sm" className="border-white/10 text-white/50 hover:text-white">View Full Logs</Button>
              </div>
              
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <LayoutDashboard size={20} className="text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Encrypted data handshake successful</p>
                      <p className="text-xs text-white/40 mt-1">Node identifier: #FX-92{i}10-S</p>
                    </div>
                    <span className="text-[10px] text-white/30 font-headline uppercase mt-1">{i * 2} min ago</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="md:col-span-4 space-y-6">
          <Card className="bg-primary/10 border-accent/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <Zap size={48} className="text-accent opacity-5 group-hover:opacity-10 transition-opacity" />
            </div>
            <CardContent className="p-6">
              <h2 className="font-headline text-lg text-white mb-2">Welcome Back, {user.username}</h2>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">Your secure communication tunnel is ready. We've detected no anomalies in your last session.</p>
              <Button className="bg-accent text-background hover:bg-accent/90 w-full font-headline tracking-widest uppercase text-xs h-10">
                Quick Action
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-white/5">
            <CardContent className="p-6">
              <h2 className="font-headline text-sm text-white/80 uppercase tracking-widest mb-6">User Profile</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Chat Name</span>
                  <span className="text-xs text-accent font-headline">@{user.chatName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Account Level</span>
                  <span className="text-xs text-white/80">Premium Access</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Registered</span>
                  <span className="text-xs text-white/80">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <div className="h-px bg-white/5 my-6"></div>
              <Button variant="ghost" className="w-full text-white/40 hover:text-white justify-start px-0 gap-3 text-sm">
                <Settings size={18} /> Account Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Footer Branding */}
      <footer className="p-8 text-center border-t border-white/5 mt-auto">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-headline">Splash &bull; Powered by VLF-Tec Architecture</p>
      </footer>
    </div>
  );
}
