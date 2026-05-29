
"use client";

import { useState, useEffect } from 'react';
import { SplashSequence } from '@/components/SplashSequence';
import { AuthScreen } from '@/components/AuthScreen';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ username: string; email: string; chatName: string } | null>(null);

  useEffect(() => {
    // Session persistence removed as per request: "already logout not automatically log in"
    // We only track if the splash has been shown in this browser session
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

  const handleLoginSuccess = (userData: { username: string; email: string; chatName: string }) => {
    // Store temporarily in memory for the current session
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('splash_shown');
  };

  if (loading) {
    return <SplashSequence />;
  }

  if (!user) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
