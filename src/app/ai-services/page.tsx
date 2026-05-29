"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Send, ArrowLeft, Bot, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

interface Message {
  type: 'user' | 'ai';
  text: string;
}

const ABUSE_WORDS = ["fuck", "fck", "fuk", "phuck", "f*ck", "shit", "sh1t", "sh*t", "bitch", "btch", "b!tch", "asshole", "arsehole", "bastard", "basterd", "dick", "d*ck", "d1ck", "pussy", "cock", "slut", "whore", "wh0re", "chutiya", "chootiya", "bc", "bhenchod", "behenchod", "bhadve", "bcn", "mc", "madarchod", "maderchod", "mdarchod", "gaand", "gand", "gnd", "gaandfat", "lauda", "luda", "l0da", "lora", "lavda", "kamina", "kameena", "kmeena", "sala", "saala", "bsdk", "bhosdike", "bhosad", "bhosadpappu"];
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw07JHRk1SKbcFtEHK8288dsautr3ALOBvy6ujewDW7JFZWi7eIJ9SP5q8cSCVNTsu2/exec";

export default function AIServicesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const sessionUser = sessionStorage.getItem('splash_session_user');
    if (!sessionUser) {
      router.push('/');
      return;
    }

    try {
      const found = JSON.parse(sessionUser);
      // Listen for ban status
      const userBanRef = ref(db, `users/${found.chatName}/bannedUntil`);
      const unsubscribe = onValue(userBanRef, (snapshot) => {
        if (snapshot.exists()) {
          const bannedUntil = snapshot.val();
          if (bannedUntil > Date.now()) {
            toast({
              variant: "destructive",
              title: "Policy Violation",
              description: "Your Account is Banned"
            });
            
            setTimeout(() => {
              sessionStorage.setItem('pending_ban_info', bannedUntil.toString());
              sessionStorage.removeItem('splash_session_user');
              router.push('/');
            }, 3000);
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      router.push('/');
    }
  }, [router, toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const showAlert = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const logChat = async (userMsg: string, aiReply: string) => {
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: 'no-cors',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Anonymous",
          email: "Guest",
          userMsg: userMsg,
          aiReply: aiReply,
          time: new Date().toLocaleString()
        })
      });
    } catch (error) {
      console.error('Chat log failed:', error);
    }
  };

  const getReply = (msg: string) => {
    const text = msg.toLowerCase();
    const now = new Date();

    if (text.includes("hi") || text.includes("hello")) return "Hello 👋 How can I help you?";
    if (text.includes("good morning")) return "Good morning ☀️ Hope you have a great day!";
    if (text.includes("good night")) return "Good night 🌙 Sweet dreams!";
    if (text.includes("how are you")) return "I'm Splash AI 🤖 and I'm doing great!";
    if (text.includes("bye")) return "Goodbye 👋 See you again!";
    if (text.includes("date")) return "📅 Today is " + now.toLocaleDateString();
    if (text.includes("time")) return "⏰ Current time is " + now.toLocaleTimeString();
    if (text.includes("who created you")) return "I was created by Utkarsh and Yash 🧠💻";
    if (text.includes("event") || text.includes("spin")) return "The Splash Event section includes a spin wheel reward system with 33% win chance.";
    if (text.includes("help")) return "You can report issues in the Help & Report section or ask me anything related to the app.";
    if (text.includes("feature") || text.includes("splash app")) return "Splash App 2.0 includes: 🎡 Event Spin, 🤖 AI Chat, 🛠 Report System, 🐶 Warning, 📡 Transmission, 📺 Live News and more.";
    
    try {
      const result = eval(text.replace(/[^-()\d/*+.]/g, ''));
      if (!isNaN(result) && typeof result === 'number' && isFinite(result)) return `🧮 Result is: ${result}`;
    } catch (e) {}

    return "🤖 I'm Splash AI. I didn’t understand that, but I’m learning!";
  };

  const handleSendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const lower = trimmed.toLowerCase();
    if (ABUSE_WORDS.some(word => lower.includes(word))) {
      showAlert("Please talk respectfully. I’m here to help.");
      setMessages(prev => [
        ...prev, 
        { type: 'user', text: trimmed },
        { type: 'ai', text: "⚠️ Please talk respectfully. I’m here to solve your problem." }
      ]);
      setInput("");
      return;
    }

    setMessages(prev => [...prev, { type: 'user', text: trimmed }]);
    setInput("");
    setIsLoading(true);

    const reply = getReply(trimmed);
    
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'ai', text: reply }]);
      logChat(trimmed, reply);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Alert */}
      {alertMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-yellow-400 text-black px-6 py-3 rounded-full font-bold shadow-2xl animate-in slide-in-from-top-10 duration-300">
          System Alert 👋: {alertMsg}
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 px-6 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white/60 hover:text-white"
          onClick={() => router.back()}
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-accent" />
          <h1 className="font-headline font-bold text-lg tracking-tight">Splash AI</h1>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-3xl mx-auto w-full">
        <div className="text-center py-10 space-y-2">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Bot size={32} className="text-accent" />
          </div>
          <h2 className="text-2xl font-headline font-bold">Welcome to Splash AI</h2>
          <p className="text-white/40 text-sm">Ask me anything about the network or basic tasks.</p>
        </div>

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10 ${msg.type === 'user' ? 'bg-primary/40' : 'bg-white/5'}`}>
              {msg.type === 'user' ? <User size={16} /> : <Bot size={16} className="text-accent" />}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.type === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-[#161616] text-white/90 rounded-tl-none border border-white/5'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5 border border-white/10">
              <Bot size={16} className="text-accent" />
            </div>
            <div className="bg-[#161616] px-4 py-3 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="p-4 md:p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto relative group">
          <Textarea 
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="bg-[#161616] border-white/10 text-white placeholder:text-white/20 min-h-[60px] pr-14 focus:ring-accent transition-all rounded-xl"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="absolute right-3 bottom-3 bg-accent text-background hover:bg-accent/90 rounded-lg h-9 w-9"
          >
            <Send size={18} />
          </Button>
        </div>
      </footer>
    </div>
  );
}
