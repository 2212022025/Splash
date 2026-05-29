
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, push, onValue, remove, set, query, limitToLast } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, MoreVertical, Trash2, Flag, ShieldCheck, UserX, Clock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatMessage {
  id: string;
  chatName: string;
  username: string;
  text: string;
  timestamp: number;
  isModerator: boolean;
}

const BAN_WORDS = ["hacking", "cheating", "cracking"];
const ABUSE_WORDS = ["fuck", "bitch", "chutiya", "mc", "bc", "gandu", "madarchod", "fake"];

export default function PublicChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSessionUser = async () => {
      const sessionUser = sessionStorage.getItem('splash_session_user');
      if (!sessionUser) {
        router.push('/');
        return;
      }

      try {
        const found = JSON.parse(sessionUser);
        setUser(found);
        const blockRef = ref(db, `blocked/${found.chatName}`);
        onValue(blockRef, (s) => setIsBlocked(s.exists()));
      } catch (e) {
        router.push('/');
      }
    };

    fetchSessionUser();

    const messagesRef = query(ref(db, 'public_chat'), limitToLast(100));
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value
        }));
        setMessages(msgList.sort((a, b) => a.timestamp - b.timestamp));
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSuspension = (isAbusive: boolean) => {
    if (!user) return;
    const banDuration = 30 * 60 * 1000; // 30 mins
    const bannedUntil = Date.now() + banDuration;
    
    // Save ban directly to user record in Firebase RTDB
    set(ref(db, `users/${user.chatName}/bannedUntil`), bannedUntil);
    
    localStorage.setItem('splash_banned_until', bannedUntil.toString());

    if (isAbusive) {
      toast({ variant: "destructive", title: "Policy Violation", description: "Your Account is Banned" });
      setTimeout(() => {
        sessionStorage.removeItem('splash_session_user');
        window.location.href = "/";
      }, 3000);
    } else {
      sessionStorage.removeItem('splash_session_user');
      window.location.href = "/";
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !user || isBlocked) return;

    const lowerText = text.toLowerCase();
    
    if (BAN_WORDS.some(word => lowerText.includes(word))) {
      handleSuspension(false);
      return;
    }

    if (ABUSE_WORDS.some(word => lowerText.includes(word))) {
      handleSuspension(true);
      return;
    }

    const isModerator = user.username.includes('#225');
    const messagesRef = ref(db, 'public_chat');
    
    push(messagesRef, {
      chatName: user.chatName,
      username: user.username,
      text: text,
      timestamp: Date.now(),
      isModerator: isModerator
    });

    setInput("");
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleDeleteMessage = (msgId: string) => {
    remove(ref(db, `public_chat/${msgId}`));
  };

  const handleReportMessage = (msg: ChatMessage) => {
    push(ref(db, 'reports'), {
      messageId: msg.id,
      reportedBy: user.chatName,
      content: msg.text,
      sender: msg.chatName,
      timestamp: Date.now()
    });
    
    toast({ title: "Reported", description: "Message sent for review." });
  };

  const handleBlockUser = (chatName: string) => {
    set(ref(db, `blocked/${chatName}`), true);
    toast({ title: "User Blocked", description: `${chatName} can no longer chat.` });
  };

  if (!user) return null;

  const currentUserIsModerator = user.username.includes('#225');

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden">
      <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center px-4 gap-4 shrink-0 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="text-white/60 hover:text-white"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex flex-col">
          <h1 className="font-headline font-bold text-sm tracking-tight uppercase italic">Public Chat</h1>
          <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Server: EBMS-09</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.map((msg, idx) => {
          const showDateLine = idx === 0 || formatDate(messages[idx-1].timestamp) !== formatDate(msg.timestamp);
          const isOwn = msg.chatName === user.chatName;

          return (
            <React.Fragment key={msg.id}>
              {showDateLine && (
                <div className="flex justify-center my-4">
                  <span className="text-[9px] bg-white/5 px-3 py-1 rounded-full text-white/30 uppercase tracking-widest font-bold">
                    {formatDate(msg.timestamp)}
                  </span>
                </div>
              )}
              
              <div 
                className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isOwn ? 'ml-auto items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {!isOwn && (
                    <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center border border-white/5">
                      <User size={10} className="text-white/40" />
                    </div>
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.isModerator ? 'text-blue-400' : 'text-white/40'}`}>
                    {msg.chatName.replace('#225', '')}
                  </span>
                  {msg.isModerator && <ShieldCheck size={12} className="text-blue-400 fill-blue-400/20" />}
                  {isOwn && (
                    <div className="w-5 h-5 rounded-lg bg-primary/30 flex items-center justify-center border border-white/5">
                      <User size={10} className="text-white/60" />
                    </div>
                  )}
                </div>

                <div className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl relative shadow-lg ${
                    msg.isModerator 
                      ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50' 
                      : isOwn 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white/5 border border-white/10 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <Clock size={8} className="text-white/20" />
                      <span className="text-[8px] text-white/30 font-medium">{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <MoreVertical size={12} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isOwn ? "end" : "start"} className="bg-[#161616] border-white/10 text-white">
                      {(isOwn || currentUserIsModerator) && (
                        <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      )}
                      {!isOwn && (
                        <DropdownMenuItem onClick={() => handleReportMessage(msg)}>
                          <Flag className="mr-2 h-4 w-4" /> Report
                        </DropdownMenuItem>
                      )}
                      {currentUserIsModerator && !isOwn && (
                        <DropdownMenuItem onClick={() => handleBlockUser(msg.chatName)}>
                          <UserX className="mr-2 h-4 w-4" /> Block User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={scrollRef} className="h-2" />
      </main>

      <footer className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-xl shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2 max-w-3xl mx-auto">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isBlocked ? "Blocked from transmission" : "Communicate..."}
            disabled={isBlocked}
            className="bg-white/5 border-white/10 h-11 rounded-xl focus:ring-accent placeholder:text-white/20"
          />
          <Button type="submit" disabled={!input.trim() || isBlocked} className="bg-accent text-black hover:bg-accent/90 rounded-xl h-11 w-11 px-0 shrink-0">
            <Send size={16} />
          </Button>
        </form>
      </footer>
    </div>
  );
}
