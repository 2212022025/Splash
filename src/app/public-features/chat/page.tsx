
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, push, onValue, remove, set, query, limitToLast, get, child, update } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, MoreVertical, Trash2, Flag, ShieldCheck, Clock, User, ShieldAlert, Zap, X, Check, Copy, UserX, UserCheck, ExternalLink, Image as ImageIcon, Film, Music } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';

const ABUSE_WORDS = ["fuck", "fck", "fuk", "phuck", "f*ck", "shit", "sh1t", "sht", "sh*t", "bitch", "btch", "b!tch", "asshole", "arsehole", "bastard", "basterd", "dick", "d*ck", "d1ck", "pussy", "cock", "slut", "whore", "wh0re", "chutiya", "chootiya", "bc", "bhenchod", "behenchod", "bhadve", "bcn", "mc", "madarchod", "maderchod", "mdarchod", "gaand", "gand", "gnd", "gaandfat", "lauda", "luda", "l0da", "lora", "lavda", "kamina", "kameena", "kmeena", "sala", "saala", "bsdk", "bhosdike", "bhosad", "bhosadpappu"];

interface ChatMessage {
  id: string;
  chatName: string;
  username: string;
  text: string;
  timestamp: number;
  isModerator: boolean;
  isSecurity?: boolean;
}

interface UserRecord {
  chatName: string;
  username: string;
  bannedUntil?: number;
}

export default function PublicChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [transmissionMode, setTransmissionMode] = useState<'all' | 'selective'>('all');
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [singleCode, setSingleCode] = useState("");
  const [isMultiCode, setIsMultiCode] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [investigationState, setInvestigationState] = useState<{ active: boolean; status: string }>({ active: false, status: "" });
  
  const [incomingWin, setIncomingWin] = useState<{ code: string } | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sessionUser = sessionStorage.getItem('splash_session_user');
    if (!sessionUser) {
      router.push('/');
      return;
    }

    try {
      const found = JSON.parse(sessionUser);
      setUser(found);
      
      const userBanRef = ref(db, `users/${found.chatName}/bannedUntil`);
      const unsubscribeBan = onValue(userBanRef, (snapshot) => {
        if (snapshot.exists()) {
          const bannedUntil = snapshot.val();
          const isActive = bannedUntil > Date.now();
          setIsBlocked(isActive);

          if (isActive) {
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
        } else {
          setIsBlocked(false);
        }
      });

      const transmissionRef = ref(db, `transmissions/${found.chatName}`);
      const unsubscribeTrans = onValue(transmissionRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setIncomingWin({ code: data.code });

          // Sensory Feedback
          if (typeof window !== 'undefined') {
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            try {
              const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
              if (AudioContextClass) {
                const audioCtx = new AudioContextClass();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.3);
              }
            } catch (e) {}
          }
        }
      });

      return () => {
        unsubscribeBan();
        unsubscribeTrans();
      };
    } catch (e) {
      router.push('/');
    }
  }, [router, toast]);

  useEffect(() => {
    const messagesRef = query(ref(db, 'public_chat'), limitToLast(100));
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
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

    return () => unsubscribeMessages();
  }, []);

  const fetchUsersForTransmission = async () => {
    const usersSnap = await get(ref(db, 'users'));
    if (usersSnap.exists()) {
      const data = usersSnap.val();
      const list = Object.values(data) as UserRecord[];
      setAllUsers(list);
    }
    setIsTransmitting(true);
  };

  const postSecurityBanMessage = (chatName: string) => {
    push(ref(db, 'public_chat'), {
      chatName: 'Security System',
      username: 'Security System',
      text: `System has Detected Abnormal Activity with account @${chatName} It has been Temporarily Suspended`,
      timestamp: Date.now(),
      isSecurity: true,
      isModerator: false
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !user || isBlocked) return;

    if (text.startsWith('//225')) {
      setInput("");
      setInvestigationState({ active: true, status: "System is Currently Investigation This Chat Server" });
      
      setTimeout(() => {
        setInvestigationState(prev => ({ ...prev, status: "Security Scanning successfully" }));
        setTimeout(() => {
          setInvestigationState({ active: false, status: "" });
        }, 3000);
      }, 15000);
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

  const handleTransmissionSend = async () => {
    if (transmissionMode === 'all') {
      if (!singleCode.trim()) return;
      const usersSnap = await get(ref(db, 'users'));
      if (usersSnap.exists()) {
        const users = usersSnap.val();
        Object.keys(users).forEach(chatName => {
          set(ref(db, `transmissions/${chatName}`), {
            code: singleCode,
            timestamp: Date.now()
          });
        });
      }
    } else if (transmissionMode === 'selective') {
      selectedUsers.forEach(chatName => {
        const code = isMultiCode ? (codes[chatName] || "") : singleCode;
        if (code.trim()) {
          set(ref(db, `transmissions/${chatName}`), {
            code: code,
            timestamp: Date.now()
          });
        }
      });
    }

    toast({ title: "Broadcast Sent", description: "Rewards distributed across the network." });
    setIsTransmitting(false);
    setSingleCode("");
    setCodes({});
    setSelectedUsers([]);
  };

  const handleBlockUser = (chatName: string) => {
    const banUntil = Date.now() + (30 * 60 * 1000); // 30 mins
    update(ref(db, `users/${chatName}`), { bannedUntil: banUntil });
    postSecurityBanMessage(chatName);
    toast({ title: "User Suspended", description: `User @${chatName} is now blocked.` });
  };

  const handleUnblockUser = (chatName: string) => {
    update(ref(db, `users/${chatName}`), { bannedUntil: null });
    toast({ title: "User Restored", description: `User @${chatName} is now unblocked.` });
  };

  const handleReport = (msg: ChatMessage) => {
    if (!user) return;
    push(ref(db, 'reports'), { 
      type: 'public_chat',
      messageId: msg.id, 
      sender: msg.chatName, 
      content: msg.text, 
      timestamp: Date.now() 
    });
    
    const content = msg.text.toLowerCase();
    if (ABUSE_WORDS.some(word => content.includes(word))) {
      const banUntil = Date.now() + (30 * 60 * 1000); // 30 mins
      update(ref(db, `users/${msg.chatName}`), { bannedUntil: banUntil });
      postSecurityBanMessage(msg.chatName);
    }
    
    toast({ title: "Report Successfully", description: "This message is now under review." });
  };

  const closeWinDialog = () => {
    if (user) {
      remove(ref(db, `transmissions/${user.chatName}`));
    }
    setIncomingWin(null);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code Copied", description: "Stored in memory for redemption." });
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderMessageContent = (msg: ChatMessage) => {
    const msgText = msg.text;

    if (msg.isSecurity) {
      const parts = msgText.split(/(@\w+)/);
      return (
        <p className="text-xs font-bold leading-relaxed">
          {parts.map((part, i) => (
            part.startsWith('@') ? (
              <span key={i} className="text-yellow-400 font-black">{part}</span>
            ) : (
              <span key={i} className="text-red-500">{part}</span>
            )
          ))}
        </p>
      );
    }

    if (msgText.startsWith('//000')) {
      const urlMatch = msgText.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const url = urlMatch[0];
        const lowerUrl = url.toLowerCase();
        
        // Media Check
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/.test(lowerUrl);
        const isVideo = /\.(mp4|webm|ogg)$/.test(lowerUrl);
        const isAudio = /\.(mp3|wav|ogg)$/.test(lowerUrl);

        if (isImage) {
          return (
            <div className="space-y-2">
              <div 
                className="cursor-pointer group relative overflow-hidden rounded-xl border border-white/10 shadow-lg"
                onClick={() => setFullScreenImage(url)}
              >
                <img src={url} alt="Media broadcast" className="w-full h-auto transition-transform group-hover:scale-105 duration-500" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <ImageIcon size={24} className="text-white drop-shadow-lg" />
                </div>
              </div>
              <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest italic flex items-center gap-1">
                <ImageIcon size={10} className="text-accent" /> Visual Broadcast
              </p>
            </div>
          );
        }

        if (isVideo) {
          return (
            <div className="space-y-2">
              <video src={url} controls className="rounded-xl max-w-full border border-white/10 shadow-lg" />
              <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest italic flex items-center gap-1">
                <Film size={10} className="text-blue-400" /> Video Protocol
              </p>
            </div>
          );
        }

        if (isAudio) {
          return (
            <div className="space-y-2 py-2">
              <audio src={url} controls className="w-full h-8" />
              <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest italic flex items-center gap-1">
                <Music size={10} className="text-emerald-400" /> Audio Transmission
              </p>
            </div>
          );
        }

        // Generic Link
        return (
          <div className="space-y-3">
            <p className="text-sm italic opacity-60">This Message Contains an External Link</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-[10px] uppercase font-bold tracking-widest h-9 rounded-xl flex items-center gap-2"
              asChild
            >
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={12} /> Visit Site
              </a>
            </Button>
          </div>
        );
      }
    }
    return <p className="text-sm leading-relaxed break-words">{msgText}</p>;
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
        <div className="flex flex-col flex-1">
          <h1 className="font-headline font-bold text-sm tracking-tight uppercase italic">Public Chat</h1>
          <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Server: EBMS-09</span>
        </div>
        {currentUserIsModerator && (
          <Button 
            onClick={fetchUsersForTransmission}
            variant="ghost" 
            size="icon" 
            className="text-accent hover:bg-accent/10"
          >
            <Zap size={20} />
          </Button>
        )}
      </header>

      {investigationState.active && (
        <div className="fixed top-16 left-0 w-full z-40 animate-in slide-in-from-top duration-500">
          <div className={cn(
            "mx-4 my-2 p-4 rounded-2xl flex items-center justify-center gap-3 border shadow-2xl transition-colors duration-500",
            investigationState.status.includes("Investigation") 
              ? "bg-red-600 border-red-500 text-white" 
              : "bg-emerald-600 border-emerald-500 text-white"
          )}>
            {investigationState.status.includes("Investigation") ? (
              <ShieldAlert className="animate-pulse" />
            ) : (
              <Check className="text-white" />
            )}
            <span className="font-headline font-bold text-xs uppercase tracking-widest text-center italic">
              {investigationState.status}
            </span>
          </div>
        </div>
      )}

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
                className={cn(
                  "flex flex-col",
                  msg.isSecurity ? "w-full items-center my-4" : isOwn ? "ml-auto items-end max-w-[85%] sm:max-w-[70%]" : "items-start max-w-[85%] sm:max-w-[70%]"
                )}
              >
                {!msg.isSecurity && (
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
                )}

                {msg.isSecurity ? (
                  <div className="bg-red-500/10 border border-red-500/30 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-[0_0_30px_rgba(239,68,68,0.1)] max-w-[90%] md:max-w-md animate-in fade-in zoom-in duration-300">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30">
                      <ShieldAlert size={20} className="text-red-500 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em] mb-0.5">Security System</span>
                      {renderMessageContent(msg)}
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl relative shadow-lg ${
                      msg.isModerator 
                        ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50' 
                        : isOwn 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-white/5 border border-white/10 rounded-tl-none'
                    }`}>
                      {renderMessageContent(msg)}
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
                          <DropdownMenuItem onClick={() => remove(ref(db, `public_chat/${msg.id}`))} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        )}
                        {currentUserIsModerator && !isOwn && (
                          <>
                            <DropdownMenuItem onClick={() => handleBlockUser(msg.chatName)} className="text-destructive focus:text-destructive">
                              <UserX className="mr-2 h-4 w-4" /> Block User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUnblockUser(msg.chatName)} className="text-emerald-400 focus:text-emerald-400">
                              <UserCheck className="mr-2 h-4 w-4" /> Unblock User
                            </DropdownMenuItem>
                          </>
                        )}
                        {!isOwn && (
                          <DropdownMenuItem onClick={() => handleReport(msg)}>
                            <Flag className="mr-2 h-4 w-4" /> Report
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
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
            placeholder={isBlocked ? "Communication disabled" : "Communicate..."}
            disabled={isBlocked}
            className="bg-white/5 border-white/10 h-11 rounded-xl focus:ring-accent placeholder:text-white/20"
          />
          <Button type="submit" disabled={!input.trim() || isBlocked} className="bg-accent text-black hover:bg-accent/90 rounded-xl h-11 w-11 px-0 shrink-0">
            <Send size={16} />
          </Button>
        </form>
      </footer>

      {/* Moderator Broadcast Dialog */}
      <Dialog open={isTransmitting} onOpenChange={setIsTransmitting}>
        <DialogContent className="bg-[#111111] border-white/10 text-white max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-headline italic uppercase tracking-tighter flex items-center gap-2">
              <Zap size={18} className="text-accent" /> Neural Broadcast
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
              <Button 
                variant={transmissionMode === 'all' ? 'default' : 'ghost'} 
                onClick={() => setTransmissionMode('all')}
                className="flex-1 text-[10px] uppercase font-bold tracking-widest h-9 rounded-lg"
              >
                Send to All
              </Button>
              <Button 
                variant={transmissionMode === 'selective' ? 'default' : 'ghost'} 
                onClick={() => setTransmissionMode('selective')}
                className="flex-1 text-[10px] uppercase font-bold tracking-widest h-9 rounded-lg"
              >
                Selective
              </Button>
            </div>

            {transmissionMode === 'all' && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase text-white/40 tracking-widest font-bold">Encrypted Code</Label>
                <Input 
                  value={singleCode}
                  onChange={(e) => setSingleCode(e.target.value)}
                  placeholder="Enter Code..."
                  className="bg-white/5 border-white/5 h-12"
                />
              </div>
            )}

            {transmissionMode === 'selective' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase text-white/40 tracking-widest font-bold">Target Users</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="multi-code" 
                      checked={isMultiCode} 
                      onCheckedChange={(checked) => setIsMultiCode(!!checked)}
                      className="border-accent data-[state=checked]:bg-accent"
                    />
                    <label htmlFor="multi-code" className="text-[10px] uppercase font-bold cursor-pointer">Unique Codes</label>
                  </div>
                </div>

                <ScrollArea className="h-48 rounded-xl border border-white/5 p-4 bg-black/20">
                  <div className="space-y-3">
                    {allUsers.map((u) => (
                      <div key={u.chatName} className="flex items-center gap-3 group">
                        <Checkbox 
                          id={`user-${u.chatName}`}
                          checked={selectedUsers.includes(u.chatName)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedUsers([...selectedUsers, u.chatName]);
                            else setSelectedUsers(selectedUsers.filter(id => id !== u.chatName));
                          }}
                          className="border-white/20 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <label htmlFor={`user-${u.chatName}`} className="text-xs font-bold uppercase tracking-tight cursor-pointer">
                            @{u.chatName}
                          </label>
                          <div className="flex items-center gap-2">
                            {u.bannedUntil && u.bannedUntil > Date.now() ? (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-400" onClick={() => handleUnblockUser(u.chatName)}>
                                <UserCheck size={14} />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleBlockUser(u.chatName)}>
                                <UserX size={14} />
                              </Button>
                            )}
                            {isMultiCode && selectedUsers.includes(u.chatName) && (
                              <Input 
                                value={codes[u.chatName] || ""}
                                onChange={(e) => setCodes({ ...codes, [u.chatName]: e.target.value })}
                                placeholder="Code"
                                className="h-7 w-24 text-[10px] bg-white/5 border-white/10 py-0"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {!isMultiCode && (
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-white/40 tracking-widest font-bold">Universal Code</Label>
                    <Input 
                      value={singleCode}
                      onChange={(e) => setSingleCode(e.target.value)}
                      placeholder="Enter Code..."
                      className="bg-white/5 border-white/5 h-12"
                    />
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleTransmissionSend}
              className="w-full bg-accent text-black font-headline font-bold uppercase tracking-[0.2em] h-14 rounded-2xl hover:bg-accent/90"
            >
              Initiate Broadcast
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Win Pop-up */}
      <Dialog open={!!incomingWin} onOpenChange={(open) => !open && closeWinDialog()}>
        <DialogContent className="bg-black border-accent/50 text-white max-w-sm rounded-[2rem] p-8 text-center border-none shadow-[0_0_80px_rgba(0,255,255,0.2)] animate-in zoom-in-95 duration-500">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-[2rem]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/20 blur-[60px] rounded-full"></div>
          </div>

          <DialogHeader className="flex flex-col items-center relative z-10">
            <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mb-6 animate-pulse border border-accent/40">
              <Zap size={40} className="text-accent fill-accent/20" />
            </div>
            <DialogTitle className="font-headline text-2xl uppercase italic tracking-tighter text-accent animate-bounce">Congratulations!</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4 relative z-10">
            <p className="text-sm text-white/80 leading-relaxed font-bold uppercase tracking-tight">
              You Are Lucky
            </p>
            
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
              <p className="text-[10px] uppercase text-white/30 tracking-[0.3em] font-bold mb-3">Redemption Key</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 font-mono font-black text-2xl tracking-[0.1em] text-white">
                  {incomingWin?.code}
                </div>
                <Button 
                  onClick={() => copyCode(incomingWin?.code || "")}
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 bg-accent/10 text-accent hover:bg-accent/20"
                >
                  <Copy size={18} />
                </Button>
              </div>
            </div>

            <Button 
              onClick={() => {
                if (incomingWin?.code) {
                  copyCode(incomingWin.code);
                }
                closeWinDialog();
              }}
              className="w-full bg-white text-black font-headline font-bold uppercase tracking-widest h-14 rounded-2xl hover:bg-white/90"
            >
              Claim Reward
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Screen Image Viewer */}
      {fullScreenImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setFullScreenImage(null)}
            className="absolute top-6 right-6 text-white/60 hover:text-white bg-white/10 rounded-full h-12 w-12"
          >
            <X size={32} />
          </Button>
          <img 
            src={fullScreenImage} 
            alt="Full Screen Broadcast" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-500" 
          />
        </div>
      )}
    </div>
  );
}
