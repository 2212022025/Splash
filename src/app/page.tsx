
"use client";

import { useState, useEffect } from 'react';
import { SplashSequence } from '@/components/SplashSequence';
import { AuthScreen } from '@/components/AuthScreen';
import { Dashboard } from '@/components/Dashboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldAlert } from 'lucide-react';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ username: string; email: string; chatName: string } | null>(null);
  const [suspensionInfo, setSuspensionInfo] = useState<{ active: boolean; remaining: number }>({ active: false, remaining: 0 });

  const checkSuspension = () => {
    const bannedUntil = localStorage.getItem('splash_banned_until');
    if (bannedUntil) {
      const remainingMs = parseInt(bannedUntil) - Date.now();
      if (remainingMs > 0) {
        setSuspensionInfo({ active: true, remaining: Math.ceil(remainingMs / 60000) });
        // Proactively clear session if user is banned
        if (sessionStorage.getItem('splash_session_user')) {
          sessionStorage.removeItem('splash_session_user');
          setUser(null);
        }
        return true;
      } else {
        // Automatically unbanned if time exceeded
        localStorage.removeItem('splash_banned_until');
      }
    }
    setSuspensionInfo({ active: false, remaining: 0 });
    return false;
  };

  useEffect(() => {
    // Check for active session
    const sessionUser = sessionStorage.getItem('splash_session_user');
    if (sessionUser) {
      try {
        setUser(JSON.parse(sessionUser));
      } catch (e) {
        console.error("Session parse failed");
      }
    }

    const splashShown = sessionStorage.getItem('splash_shown');
    
    if (splashShown) {
      setLoading(false);
      checkSuspension();
    } else {
      const timer = setTimeout(() => {
        setLoading(false);
        sessionStorage.setItem('splash_shown', 'true');
        checkSuspension();
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Frequent check for auto-unban and remaining time update
    const interval = setInterval(checkSuspension, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (userData: { username: string; email: string; chatName: string }) => {
    if (checkSuspension()) return;
    
    sessionStorage.setItem('splash_session_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('splash_session_user');
    setUser(null);
  };

  if (loading) {
    return <SplashSequence />;
  }

  return (
    <>
      {!user ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}

      <Dialog open={suspensionInfo.active} onOpenChange={() => {}}>
        <DialogContent className="bg-black border-destructive/50 text-white max-w-sm rounded-[2rem] p-8 text-center" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader className="flex flex-col items-center">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <ShieldAlert size={32} className="text-destructive" />
            </div>
            <DialogTitle className="font-headline text-2xl uppercase italic tracking-tighter text-destructive">Account Suspended</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-white/80 leading-relaxed font-bold">
              There Are paranormal Activity in Your Account it has been Temporarily Suspended
            </p>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] uppercase text-white/30 tracking-[0.2em] font-bold mb-1">Status</p>
              <p className="font-bold text-lg text-destructive">Suspension end in {suspensionInfo.remaining} mints</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
