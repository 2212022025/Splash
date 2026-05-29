
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, push, onValue, remove, set, serverTimestamp, query, limitToLast } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, MoreVertical, Trash2, Flag, ShieldCheck, UserX } from 'lucide-react';
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

export default function PublicChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('splash_current_user');
    if (!savedUser) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    // Check if user is blocked
    const blockRef = ref(db, `blocked/${parsedUser.chatName}`);
    onValue(blockRef, (snapshot) => {
      setIsBlocked(snapshot.exists());
    });

    const messagesRef = query(ref(db, 'public_chat'), limitToLast(50));
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || isBlocked) return;

    const isModerator = user.username.includes('#225');
    const messagesRef = ref(db, 'public_chat');
    
    push(messagesRef, {
      chatName: user.chatName,
      username: user.username,
      text: input,
      timestamp: Date.now(),
      isModerator: isModerator
    });

    setInput("");
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
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white">
      <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center px-4 gap-4 shrink-0">
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

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col max-w-[85%] ${msg.chatName === user.chatName ? 'ml-auto items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.isModerator ? 'text-blue-400' : 'text-white/40'}`}>
                {msg.chatName}
              </span>
              {msg.isModerator && <ShieldCheck size={12} className="text-blue-400 fill-blue-400/20" />}
            </div>

            <div className="flex items-center gap-2 group">
              <div className={`px-4 py-3 rounded-2xl relative ${
                msg.isModerator 
                  ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50' 
                  : msg.chatName === user.chatName 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white/5 border border-white/10 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#161616] border-white/10 text-white">
                  {(msg.chatName === user.chatName || currentUserIsModerator) && (
                    <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  )}
                  {msg.chatName !== user.chatName && (
                    <DropdownMenuItem onClick={() => handleReportMessage(msg)}>
                      <Flag className="mr-2 h-4 w-4" /> Report
                    </DropdownMenuItem>
                  )}
                  {currentUserIsModerator && msg.chatName !== user.chatName && (
                    <DropdownMenuItem onClick={() => handleBlockUser(msg.chatName)}>
                      <UserX className="mr-2 h-4 w-4" /> Block User
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </main>

      <footer className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-xl">
        <form onSubmit={handleSendMessage} className="flex gap-2 max-w-3xl mx-auto">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isBlocked ? "Your account is blocked" : "Communicate via EBMS-09..."}
            disabled={isBlocked}
            className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-accent"
          />
          <Button type="submit" disabled={!input.trim() || isBlocked} className="bg-accent text-black hover:bg-accent/90 rounded-xl h-12 w-12 px-0 shrink-0">
            <Send size={18} />
          </Button>
        </form>
      </footer>
    </div>
  );
}
