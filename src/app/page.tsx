
"use client";

import { useState, useEffect } from 'react';
import { SplashSequence } from '@/components/SplashSequence';
import { AuthScreen } from '@/components/AuthScreen';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ username: string; email: string; chatName: string } | null>(null);

  useEffect(() => {
    // Splash screen lasts 2 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <SplashSequence />;
  }

  if (!user) {
    return <AuthScreen onLoginSuccess={setUser} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
