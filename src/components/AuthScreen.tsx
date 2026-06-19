
"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, get, child, set, update, ref as rtdbRef } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, MessageSquare, PlusCircle, LogIn, Zap } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: { username: string; email: string; chatName: string }) => void;
  onBannedAttempt: (bannedUntil: number) => void;
}

export function AuthScreen({ onLoginSuccess, onBannedAttempt }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [chatName, setChatName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedUsername = localStorage.getItem('splash_last_username');
    const savedEmail = localStorage.getItem('splash_last_email');
    if (savedUsername) setUsername(savedUsername);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email) {
      toast({ variant: "destructive", title: "Invalid Credentials", description: "Username or Email is incorrect." });
      return;
    }

    setIsLoading(true);
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users`));
      
      if (snapshot.exists()) {
        const users = snapshot.val();
        const foundUser = Object.values(users).find(
          (u: any) => u.username.toLowerCase() === username.toLowerCase() && u.email.toLowerCase() === email.toLowerCase()
        ) as any;

        if (foundUser) {
          if (foundUser.status === 2) {
            toast({ 
              variant: "destructive", 
              title: "Account Suspended", 
              description: "There Are Paranormal Activity In Your Account it has been Permanently Suspended" 
            });
            setIsLoading(false);
            return;
          }

          if (foundUser.bannedUntil && foundUser.bannedUntil > Date.now()) {
            toast({ 
              variant: "destructive", 
              title: "Account Banned", 
              description: "Your account is currently suspended from the network." 
            });
            onBannedAttempt(foundUser.bannedUntil);
            setIsLoading(false);
            return;
          }

          // Save last login details
          await update(rtdbRef(db, `users/${foundUser.chatName}`), {
            lastLoginAt: Date.now(),
            lastLoginDate: new Date().toLocaleString()
          });

          localStorage.setItem('splash_last_username', username);
          localStorage.setItem('splash_last_email', email);
          onLoginSuccess(foundUser);
        } else {
          toast({ variant: "destructive", title: "Invalid Credentials", description: "Username or Email is incorrect." });
        }
      } else {
        toast({ variant: "destructive", title: "Invalid Credentials", description: "No users found in database." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "System Error", description: "Database communication failure." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email || !chatName) {
      toast({ variant: "destructive", title: "Error", description: "All fields are required" });
      return;
    }
    if (chatName.includes('@')) {
      toast({ variant: "destructive", title: "Invalid Chat Name", description: "Chat name cannot contain '@' symbol." });
      return;
    }

    setIsLoading(true);
    try {
      const userRef = rtdbRef(db, `users/${chatName}`);
      const checkSnapshot = await get(userRef);
      
      if (checkSnapshot.exists()) {
        toast({ variant: "destructive", title: "Error", description: "Chat Name already taken. User identity collision detected." });
      } else {
        const newUser = { 
          username, 
          email, 
          chatName, 
          status: 0,
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
          lastLoginDate: new Date().toLocaleString()
        };
        await set(userRef, newUser);
        
        localStorage.setItem('splash_last_username', username);
        localStorage.setItem('splash_last_email', email);
        
        onLoginSuccess(newUser);
        toast({ title: "Account Created", description: "Your identity has been indexed on the network." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not create account." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10">
        <img 
          src="https://files.catbox.moe/d9bnza.jpg" 
          alt="Brand Background" 
          className="w-full h-full object-cover grayscale"
        />
      </div>

      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full z-[1]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/5 blur-[150px] rounded-full z-[1]"></div>

      <div className="mb-8 flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-700 relative z-10">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-white/10 neon-glow">
          <Zap size={32} className="text-accent" />
        </div>
        <h1 className="font-headline text-5xl font-extrabold tracking-tighter italic uppercase text-white">Splash</h1>
      </div>

      <Card className="w-full max-w-md bg-[#161616]/80 backdrop-blur-xl border-white/5 shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-10 duration-500 z-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
        <CardHeader className="text-center pt-8 pb-4">
          <CardTitle className="font-headline text-2xl text-white uppercase tracking-tight">
            {isLogin ? 'Login' : 'Create an Account'}
          </CardTitle>
          <CardDescription className="font-body text-white/40">
            {isLogin ? 'Access your identity' : 'Request Access to Create an Account'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[10px] uppercase tracking-[0.2em] text-accent/70 font-bold flex items-center gap-2">
                <User size={12} /> Username
              </Label>
              <Input 
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="bg-[#121212] border-white/10 text-white placeholder:text-white/10 h-11 focus:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] text-accent/70 font-bold flex items-center gap-2">
                <Mail size={12} /> Email Address
              </Label>
              <Input 
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@network.com"
                className="bg-[#121212] border-white/10 text-white placeholder:text-white/10 h-11 focus:ring-accent"
              />
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="chatName" className="text-[10px] uppercase tracking-[0.2em] text-accent/70 font-bold flex items-center gap-2">
                  <MessageSquare size={12} /> Unique Chat Name
                </Label>
                <Input 
                  id="chatName"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  placeholder="chatname"
                  className="bg-[#121212] border-white/10 text-white placeholder:text-white/10 h-11 focus:ring-accent"
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-headline tracking-widest uppercase text-xs mt-4 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Create an Account')}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pb-8 pt-2">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] text-white/30 hover:text-accent uppercase tracking-widest font-bold transition-colors flex items-center gap-2"
          >
            {isLogin ? (
              <><PlusCircle size={14} /> Create an Account</>
            ) : (
              <><LogIn size={14} /> Existing Account</>
            )}
          </button>
        </CardFooter>
      </Card>
      
      <p className="mt-8 text-[9px] text-white/20 uppercase tracking-[0.4em] relative z-10">SV-12 Pro Active &bull; VLF-TEC</p>
    </div>
  );
}
