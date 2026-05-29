
"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, get, child } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, MessageSquare, PlusCircle, LogIn, AlertCircle } from 'lucide-react';
import { set, ref as rtdbRef } from 'firebase/database';

interface AuthScreenProps {
  onLoginSuccess: (user: { username: string; email: string; chatName: string }) => void;
}

export function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
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
      toast({ variant: "destructive", title: "Error", description: "All fields are required" });
      return;
    }

    setIsLoading(true);
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users`));
      
      if (snapshot.exists()) {
        const users = snapshot.val();
        const foundUser = Object.values(users).find(
          (u: any) => u.username === username && u.email === email
        ) as any;

        if (foundUser) {
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

    const lastCreation = localStorage.getItem('splash_last_creation');
    if (lastCreation) {
      const hoursSince = (Date.now() - parseInt(lastCreation)) / (1000 * 60 * 60);
      if (hoursSince < 2) {
        toast({ 
          variant: "destructive", 
          title: "Account Limit", 
          description: `Please wait ${Math.ceil(2 - hoursSince)} hour(s) before creating another account.` 
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const userRef = rtdbRef(db, `users/${chatName}`);
      const checkSnapshot = await get(userRef);
      
      if (checkSnapshot.exists()) {
        toast({ variant: "destructive", title: "Error", description: "Chat Name already taken." });
      } else {
        const newUser = { username, email, chatName, createdAt: Date.now() };
        await set(userRef, newUser);
        
        localStorage.setItem('splash_last_creation', Date.now().toString());
        localStorage.setItem('splash_last_username', username);
        localStorage.setItem('splash_last_email', email);
        
        toast({ title: "Account Created", description: "Your account is ready for use." });
        onLoginSuccess(newUser);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not create account." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
      <Card className="w-full max-w-md bg-[#1a1a1a] border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-accent neon-glow"></div>
        <CardHeader className="text-center pt-10">
          <CardTitle className="font-headline text-4xl text-white tracking-tighter">
            {isLogin ? 'Login to Splash' : 'Join Splash'}
          </CardTitle>
          <CardDescription className="font-body text-white/50">
            {isLogin ? 'Enter credentials' : 'Create identity'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs uppercase tracking-widest text-accent font-semibold flex items-center gap-2">
                <User size={14} className="text-accent" /> Username
              </Label>
              <Input 
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="bg-[#121212] border-white/10 text-white placeholder:text-white/20 focus:ring-accent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-widest text-accent font-semibold flex items-center gap-2">
                <Mail size={14} className="text-accent" /> Email
              </Label>
              <Input 
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="bg-[#121212] border-white/10 text-white placeholder:text-white/20 focus:ring-accent"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="chatName" className="text-xs uppercase tracking-widest text-accent font-semibold flex items-center gap-2">
                  <MessageSquare size={14} className="text-accent" /> Chat Name
                </Label>
                <Input 
                  id="chatName"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  placeholder="Chat Name"
                  className="bg-[#121212] border-white/10 text-white placeholder:text-white/20 focus:ring-accent"
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-lg font-headline tracking-widest uppercase text-sm mt-4 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Signup')}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pb-8">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-accent/80 hover:text-accent font-medium transition-colors flex items-center gap-2"
          >
            {isLogin ? (
              <><PlusCircle size={16} /> New Account</>
            ) : (
              <><LogIn size={16} /> Have account?</>
            )}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
