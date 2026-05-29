
"use client";

import { useState, useEffect, useCallback } from 'react';
import { SplashSequence } from '@/components/SplashSequence';
import { AuthScreen } from '@/components/AuthScreen';
import { Dashboard } from '@/components/Dashboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ username: string; email: string; chatName: string } | null>(null);
  const [suspensionInfo, setSuspensionInfo] = useState<{ active: boolean; remaining: number }>({ active: false, remaining: 0 });
  const { toast } = useToast();

  const checkSuspension = useCallback((bannedUntil: number | null = null) => {
    if (bannedUntil) {
      const remainingMs = bannedUntil - Date.now();
      if (remainingMs > 0) {
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        setSuspensionInfo({ active: true, remaining: remainingMinutes });
        return true;
      }
    }
    setSuspensionInfo({ active: false, remaining: 0 });
    return false;
  }, []);

  useEffect(() => {
    // Restore session if it exists to allow navigation between sub-menus without logout
    const savedUser = sessionStorage.getItem('splash_session_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Session restore failed");
      }
    }

    const splashShown = sessionStorage.getItem('splash_shown');
    
    if (splashShown) {
      setLoading(false);
    } else {
      const timer = setTimeout(() => {
        setLoading(false);
        sessionStorage.setItem('splash_shown', 'true');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Sync remote ban for active user from their profile record
  useEffect(() => {
    if (user) {
      const banRef = ref(db, `users/${user.chatName}/bannedUntil`);
      const unsubscribe = onValue(banRef, (snapshot) => {
        if (snapshot.exists()) {
          const bannedUntil = snapshot.val();
          if (bannedUntil > Date.now()) {
            toast({
              variant: "destructive",
              title: "Policy Violation",
              description: "Your Account is Banned"
            });
            
            setTimeout(() => {
              sessionStorage.removeItem('splash_session_user');
              setUser(null);
              checkSuspension(bannedUntil);
            }, 3000);
          } else {
            setSuspensionInfo({ active: false, remaining: 0 });
          }
        } else {
          setSuspensionInfo({ active: false, remaining: 0 });
        }
      });
      return () => unsubscribe();
    }
  }, [user, checkSuspension, toast]);

  const handleLoginSuccess = (userData: { username: string; email: string; chatName: string }) => {
    sessionStorage.setItem('splash_session_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLoginAttemptWhileBanned = (bannedUntil: number) => {
    checkSuspension(bannedUntil);
  };

  if (loading) {
    return <SplashSequence />;
  }

  return (
    <>
      {!user ? (
        <AuthScreen 
          onLoginSuccess={handleLoginSuccess} 
          onBannedAttempt={handleLoginAttemptWhileBanned}
        />
      ) : (
        <Dashboard user={user} onLogout={() => {
          sessionStorage.removeItem('splash_session_user');
          setUser(null);
        }} />
      )}

      <Dialog 
        open={suspensionInfo.active} 
        onOpenChange={(open) => setSuspensionInfo(prev => ({ ...prev, active: open }))}
      >
        <DialogContent className="bg-black border-destructive/50 text-white max-w-sm rounded-[2rem] p-8 text-center border-none shadow-[0_0_50px_rgba(255,0,0,0.2)]">
          <button 
            onClick={() => setSuspensionInfo(prev => ({ ...prev, active: false }))}
            className="absolute right-6 top-6 text-white/20 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          <DialogHeader className="flex flex-col items-center">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4 animate-pulse border border-destructive/30">
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
            <Button 
              variant="outline" 
              className="w-full rounded-xl border-white/10 hover:bg-white/5 text-white/60 hover:text-white mt-2"
              onClick={() => setSuspensionInfo(prev => ({ ...prev, active: false }))}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
