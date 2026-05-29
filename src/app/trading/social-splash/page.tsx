
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { ref, push, onValue, set, remove, query, limitToLast, runTransaction, update } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Share2, 
  Eye, 
  Flag, 
  Send,
  Image as ImageIcon,
  User,
  Trash2,
  Edit3,
  Lock,
  Globe,
  BarChart3,
  Sun,
  Moon,
  BadgeCheck,
  Banknote,
  Copy,
  Wallet,
  Landmark,
  ShieldCheck,
  Star
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

const ABUSE_WORDS = ["fuck", "bitch", "chutiya", "mc", "bc", "gandu", "madarchod", "fake"];
const MONETIZATION_THRESHOLD = 1000;
const TAX_RATE = 0.33;

interface SocialPost {
  id: string;
  chatName: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
  likes?: Record<string, boolean>;
  views: number;
  comments?: Record<string, { chatName: string; text: string; timestamp: number }>;
  isPrivate?: boolean;
  // Algorithmic Growth Fields
  targetViews?: number;
  targetLikesCount?: number;
  growthDuration?: number; // in ms
}

export default function SocialSplashPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [user, setUser] = useState<any>(null);
  const [newPostText, setNewPostText] = useState("");
  const [newPostImageUrl, setNewPostImageUrl] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [viewingCommentsFor, setViewingCommentsFor] = useState<SocialPost | null>(null);
  const [view, setView] = useState<'feed' | 'analytics' | 'highlights'>('feed');
  const [editingPost, setEditingPost] = useState<{id: string, text: string} | null>(null);
  const [isWhiteTheme, setIsWhiteTheme] = useState(false);
  const [reportedPosts, setReportedPosts] = useState<string[]>([]);
  
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const filterUser = searchParams.get('user');

  useEffect(() => {
    const savedTheme = localStorage.getItem('social_splash_theme');
    if (savedTheme === 'white') setIsWhiteTheme(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isWhiteTheme;
    setIsWhiteTheme(nextTheme);
    localStorage.setItem('social_splash_theme', nextTheme ? 'white' : 'dark');
  };

  useEffect(() => {
    const sessionUser = sessionStorage.getItem('splash_session_user');
    if (!sessionUser) {
      router.push('/');
      return;
    }
    const foundUser = JSON.parse(sessionUser);
    setUser(foundUser);

    const postsRef = query(ref(db, 'social_posts'), limitToLast(100));
    const unsubscribePosts = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value
        }));
        setPosts(list.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setPosts([]);
      }
    });

    const withdrawalsRef = ref(db, `social_withdrawals/${foundUser.chatName}`);
    const unsubscribeWithdrawals = onValue(withdrawalsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const total = Object.values(data).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
        setTotalWithdrawn(total);
      } else {
        setTotalWithdrawn(0);
      }
    });

    return () => {
      unsubscribePosts();
      unsubscribeWithdrawals();
    };
  }, [router]);

  const getDisplayedViews = (post: SocialPost) => {
    if (!post.targetViews || !post.timestamp) return post.views || 0;
    const elapsed = Date.now() - post.timestamp;
    const duration = post.growthDuration || 86400000;
    if (elapsed >= duration) return post.targetViews + (post.views || 0);
    const progress = elapsed / duration;
    return Math.floor(post.targetViews * progress) + (post.views || 0);
  };

  const getDisplayedLikes = (post: SocialPost) => {
    const realLikes = Object.keys(post.likes || {}).length;
    if (!post.targetLikesCount || !post.timestamp) return realLikes;
    const elapsed = Date.now() - post.timestamp;
    const duration = post.growthDuration || 86400000;
    if (elapsed >= duration) return post.targetLikesCount + realLikes;
    const progress = elapsed / duration;
    return Math.floor(post.targetLikesCount * progress) + realLikes;
  };

  const userStats = useMemo(() => {
    const stats: Record<string, { views: number; potentialEarnings: number }> = {};
    posts.forEach(p => {
      if (!stats[p.chatName]) stats[p.chatName] = { views: 0, potentialEarnings: 0 };
      const currentViews = getDisplayedViews(p);
      stats[p.chatName].views += currentViews;
      const earnings = p.imageUrl ? 12.5 : 8;
      stats[p.chatName].potentialEarnings += earnings;
    });
    return stats;
  }, [posts]);

  const currentUserStats = user ? (userStats[user.chatName] || { views: 0, potentialEarnings: 0 }) : { views: 0, potentialEarnings: 0 };
  const isCurrentUserVerified = currentUserStats.views >= MONETIZATION_THRESHOLD;
  const currentBalance = isCurrentUserVerified ? (currentUserStats.potentialEarnings - totalWithdrawn) : 0;

  const handleCreatePost = () => {
    if (!newPostText.trim() || !user) return;

    const today = new Date().setHours(0,0,0,0);
    const todayCount = posts.filter(p => p.chatName === user.chatName && p.timestamp >= today).length;
    
    if (todayCount >= 5) {
      toast({ 
        variant: "destructive",
        title: "Daily Limit Reached", 
        description: "Network security protocols allow only 5 broadcasts per solar cycle." 
      });
      return;
    }

    // Determine algorithmic "destiny"
    const rand = Math.random();
    let targetViews = 0;
    if (rand < 0.20) targetViews = Math.floor(Math.random() * (40 - 25 + 1) + 25);
    else if (rand < 0.45) targetViews = Math.floor(Math.random() * (70 - 50 + 1) + 50);
    else if (rand < 0.65) targetViews = Math.floor(Math.random() * (150 - 100 + 1) + 100);
    else if (rand < 0.80) targetViews = Math.floor(Math.random() * (500 - 200 + 1) + 200);
    else if (rand < 0.90) targetViews = Math.floor(Math.random() * (1500 - 500 + 1) + 500);
    else targetViews = Math.floor(Math.random() * 20) + 5;

    const targetLikes = Math.floor((targetViews / 100) * (Math.random() * (25 - 2 + 1) + 2));
    const growthDuration = Math.floor(Math.random() * (24 - 1 + 1) + 1) * 3600000;

    setIsPosting(true);
    const postRef = ref(db, 'social_posts');
    push(postRef, {
      chatName: user.chatName,
      text: newPostText,
      imageUrl: newPostImageUrl || null,
      timestamp: Date.now(),
      views: 0,
      isPrivate: false,
      targetViews,
      targetLikesCount: targetLikes,
      growthDuration
    });

    setNewPostText("");
    setNewPostImageUrl("");
    setIsPosting(false);
    toast({ title: "Broadcast Successful", description: "Thread indexed on the Splash network." });
  };

  const handleWithdrawal = () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > currentBalance) return;

    setIsWithdrawing(true);
    const withdrawalRef = ref(db, `social_withdrawals/${user.chatName}`);
    const tax = amount * TAX_RATE;
    const finalAmount = amount - tax;

    push(withdrawalRef, {
      amount: amount,
      taxApplied: tax,
      finalReceived: finalAmount,
      timestamp: Date.now(),
      status: 'processed'
    }).then(() => {
      toast({ 
        title: "Withdrawal Successful", 
        description: `Requested ${amount}rs. Received ${finalAmount.toFixed(2)}rs after 33% Network Tax.` 
      });
      setWithdrawalAmount("");
      setIsWithdrawing(false);
      setIsWalletOpen(false);
    });
  };

  const handleEditPost = () => {
    if (!editingPost || !editingPost.text.trim()) return;
    update(ref(db, `social_posts/${editingPost.id}`), { text: editingPost.text });
    setEditingPost(null);
  };

  const handleDeletePost = (postId: string) => {
    remove(ref(db, `social_posts/${postId}`));
  };

  const togglePrivate = (postId: string, current: boolean) => {
    update(ref(db, `social_posts/${postId}`), { isPrivate: !current });
  };

  const handleLike = (postId: string, currentLikes?: Record<string, boolean>) => {
    if (!user) return;
    const isLiked = currentLikes && currentLikes[user.chatName];
    const likeRef = ref(db, `social_posts/${postId}/likes/${user.chatName}`);
    if (isLiked) remove(likeRef); else set(likeRef, true);
  };

  const handleAddComment = (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text || !user) return;
    const commentRef = ref(db, `social_posts/${postId}/comments`);
    push(commentRef, {
      chatName: user.chatName,
      text: text,
      timestamp: Date.now()
    });
    setCommentText(prev => ({ ...prev, [postId]: "" }));
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    remove(ref(db, `social_posts/${postId}/comments/${commentId}`));
    toast({ title: "Comment Purged" });
  };

  const handleReport = (post: SocialPost) => {
    if (!user) return;
    push(ref(db, 'reports'), {
      type: 'social_post',
      postId: post.id,
      content: post.text,
      sender: post.chatName,
      reportedBy: user.chatName,
      timestamp: Date.now()
    });
    setReportedPosts(prev => [...prev, post.id]);
    const content = post.text.toLowerCase();
    if (ABUSE_WORDS.some(word => content.includes(word))) {
      const banUntil = Date.now() + (30 * 60 * 1000);
      set(ref(db, `users/${post.chatName}/bannedUntil`), banUntil);
    }
    toast({ title: "Report Successfully", description: "This post is now under review." });
  };

  const handleShare = (postId: string) => {
    const shareUrl = `${window.location.origin}/trading/social-splash/share/${postId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link Copied" });
  };

  const incrementView = (postId: string) => {
    const viewRef = ref(db, `social_posts/${postId}/views`);
    runTransaction(viewRef, (current) => (current || 0) + 1);
  };

  const displayedPosts = useMemo(() => {
    if (view === 'analytics') return posts.filter(p => p.chatName === user?.chatName);
    if (view === 'highlights') return posts.filter(p => p.likes?.[user?.chatName] || (p.comments && Object.values(p.comments).some(c => c.chatName === user?.chatName)));
    
    if (filterUser) return posts.filter(p => p.chatName === filterUser && (!p.isPrivate || p.chatName === user?.chatName));
    return posts.filter(p => !p.isPrivate || p.chatName === user?.chatName);
  }, [posts, view, filterUser, user]);

  const pageBg = isWhiteTheme ? 'bg-white' : 'bg-[#0a0a0a]';
  const textColor = isWhiteTheme ? 'text-black' : 'text-white';
  const cardBg = isWhiteTheme ? 'bg-gray-50 border-gray-200' : 'bg-[#111111] border-white/5';
  const headerBg = isWhiteTheme ? 'bg-white/80 border-gray-200' : 'bg-black/40 border-white/5';
  const mutedText = isWhiteTheme ? 'text-gray-500' : 'text-white/40';
  const ghostText = isWhiteTheme ? 'text-gray-400' : 'text-white/20';

  return (
    <div className={cn("min-h-screen flex flex-col pb-20 transition-colors duration-300", pageBg, textColor)}>
      <header className={cn("h-16 border-b backdrop-blur-xl sticky top-0 z-50 px-4 flex items-center justify-between", headerBg)}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => {
            if (view !== 'feed') setView('feed');
            else if (filterUser) router.push('/trading/social-splash');
            else router.push('/trading');
          }} className={mutedText}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="font-headline font-bold text-sm uppercase italic tracking-tighter">
            {view === 'analytics' ? 'Analytics' : view === 'highlights' ? 'Highlights' : filterUser ? `@${filterUser}` : 'Social Splash'}
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" onClick={() => setView('highlights')} className={cn("rounded-full", view === 'highlights' ? "text-amber-400" : mutedText)}>
            <Star size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsWalletOpen(true)} className={cn("rounded-full", isCurrentUserVerified ? "text-emerald-400" : mutedText)}>
            <Banknote size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className={cn("rounded-full", mutedText)}>
            {isWhiteTheme ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setView(view === 'feed' ? 'analytics' : 'feed')} className={cn("rounded-full", view === 'analytics' ? 'text-purple-400' : mutedText)}>
            <BarChart3 size={18} />
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-4 space-y-6">
        {view === 'feed' && !filterUser && (
          <div className={cn("border border-dashed rounded-3xl p-5 space-y-4 shadow-sm", cardBg, isWhiteTheme ? "border-black/20" : "border-white/10")}>
            <div className="flex gap-4">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border shrink-0", isWhiteTheme ? "bg-gray-100 border-gray-200" : "bg-white/5 border-white/5")}>
                <User size={20} className={ghostText} />
              </div>
              <div className="flex-1 space-y-3">
                <Textarea 
                  placeholder="Add Your Threads"
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  className={cn("bg-transparent border-none text-[15px] p-0 focus-visible:ring-0 resize-none min-h-[80px] placeholder:text-gray-400", textColor)}
                />
                <div className={cn("flex items-center gap-2 p-2 rounded-xl border", isWhiteTheme ? "bg-white border-gray-200" : "bg-white/5 border-white/5")}>
                  <ImageIcon size={14} className={ghostText} />
                  <Input placeholder="Catbox Image URL" value={newPostImageUrl} onChange={(e) => setNewPostImageUrl(e.target.value)} className="bg-transparent border-none h-6 py-0 focus-visible:ring-0 text-[11px] placeholder:text-gray-400" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", ghostText)}>
                    {posts.filter(p => p.chatName === user?.chatName && p.timestamp >= new Date().setHours(0,0,0,0)).length}/5 Daily Limit
                  </span>
                  <Button onClick={handleCreatePost} disabled={!newPostText.trim() || isPosting} className={cn("rounded-full px-6 font-bold text-xs uppercase", isWhiteTheme ? "bg-black text-white" : "bg-white text-black")}>
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {displayedPosts.map((post) => {
          const authorStats = userStats[post.chatName] || { views: 0, potentialEarnings: 0 };
          const isVerified = authorStats.views >= MONETIZATION_THRESHOLD;
          const isReported = reportedPosts.includes(post.id);
          const currentViews = getDisplayedViews(post);
          const currentLikes = getDisplayedLikes(post);

          return (
            <div key={post.id} className={cn("border rounded-3xl p-5 space-y-4 shadow-sm", cardBg, post.isPrivate && 'border-amber-500/20')}>
              <div className="flex items-center justify-between">
                <button onClick={() => { incrementView(post.id); router.push(`/trading/social-splash?user=${post.chatName}`); }} className="flex items-center gap-2 group">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border transition-colors", isWhiteTheme ? "bg-gray-100 border-gray-200" : "bg-white/5 border-white/5")}>
                    <User size={20} className={cn(isWhiteTheme ? "text-gray-400" : "text-white/40")} />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-sm font-bold", textColor)}>@{post.chatName}</span>
                      {isVerified && <BadgeCheck size={14} className="text-blue-500 fill-blue-500/20" />}
                    </div>
                    <span className={cn("text-[10px]", mutedText)}>{new Date(post.timestamp).toLocaleDateString()}</span>
                  </div>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={mutedText}><MoreHorizontal size={18} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={cn(isWhiteTheme ? "bg-white border-gray-200" : "bg-[#161616] border-white/10 text-white")}>
                    <DropdownMenuItem disabled className="text-[10px] opacity-50">ID: {post.id}</DropdownMenuItem>
                    {post.chatName === user?.chatName ? (
                      <>
                        <DropdownMenuItem onClick={() => setEditingPost({id: post.id, text: post.text})}><Edit3 className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePrivate(post.id, post.isPrivate || false)}>{post.isPrivate ? 'Public' : 'Private'}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem onClick={() => handleReport(post)} className="text-destructive"><Flag className="mr-2 h-4 w-4" /> Report</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {isReported ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                  <Flag size={16} className="text-red-500" />
                  <p className="text-xs font-bold text-red-500 uppercase italic">This post is under review</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className={cn("text-[15px] leading-relaxed", isWhiteTheme ? "text-gray-800" : "text-white/90")}>{post.text}</p>
                  {post.imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/40">
                      <img src={post.imageUrl} alt="Visual" className="w-full h-auto object-cover max-h-[400px]" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-6 pt-2">
                <button onClick={() => handleLike(post.id, post.likes)} className={cn("flex items-center gap-1.5", post.likes?.[user?.chatName] ? 'text-red-500' : mutedText)}>
                  <Heart size={18} fill={post.likes?.[user?.chatName] ? 'currentColor' : 'none'} />
                  <span className="text-xs font-bold">{currentLikes}</span>
                </button>
                <button onClick={() => setViewingCommentsFor(post)} className={cn("flex items-center gap-1.5", mutedText)}>
                  <MessageCircle size={18} />
                  <span className="text-xs font-bold">{Object.keys(post.comments || {}).length}</span>
                </button>
                <button onClick={() => handleShare(post.id)} className={cn(mutedText)}><Share2 size={18} /></button>
                <div className={cn("flex items-center gap-1.5 ml-auto", mutedText)}>
                  <Eye size={18} />
                  <span className="text-xs font-bold">{currentViews}</span>
                </div>
              </div>

              {isVerified && post.chatName === user?.chatName && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <Banknote size={16} className="text-emerald-500" />
                  <span className="text-[10px] text-emerald-500 font-bold uppercase">Earning Started: {post.imageUrl ? '12.5rs' : '8rs'}</span>
                </div>
              )}

              {post.comments && Object.entries(post.comments).length > 0 && (
                <div className={cn("p-3 rounded-2xl border cursor-pointer", isWhiteTheme ? "bg-white border-gray-100" : "bg-white/5 border-white/5")} onClick={() => setViewingCommentsFor(post)}>
                  {(() => {
                    const [id, lastComment] = Object.entries(post.comments).pop()!;
                    return (
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2">
                          <span className="text-[11px] font-bold text-purple-600">@{lastComment.chatName}</span>
                          <p className={cn("text-[11px] line-clamp-1", isWhiteTheme ? "text-gray-600" : "text-white/60")}>{lastComment.text}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* Dialogs */}
      <Dialog open={isWalletOpen} onOpenChange={setIsWalletOpen}>
        <DialogContent className={cn("max-w-sm rounded-3xl", isWhiteTheme ? "bg-white text-black" : "bg-[#161616] border-white/10 text-white")}>
          <DialogHeader className="flex flex-col items-center gap-2">
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center border", isCurrentUserVerified ? "text-emerald-500" : "text-white/30")}>
              <Wallet size={32} />
            </div>
            <DialogTitle className="font-headline uppercase italic">Splash Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {!isCurrentUserVerified ? (
              <div className="bg-amber-500/10 p-5 rounded-2xl text-center space-y-2">
                <span className="text-3xl font-black">{Math.max(0, MONETIZATION_THRESHOLD - currentUserStats.views)}</span>
                <p className="text-[11px] font-bold uppercase opacity-60">Views Left to Monetization</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 p-6 rounded-2xl text-center">
                  <p className="text-[10px] uppercase text-emerald-500 mb-1">Available Balance</p>
                  <span className="text-4xl font-black">{currentBalance.toFixed(2)} rs</span>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Amount" type="number" value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} className={cn("rounded-xl h-11 border-none", isWhiteTheme ? "bg-gray-100" : "bg-white/5")} />
                  <Button onClick={handleWithdrawal} disabled={isWithdrawing} className="h-11 bg-emerald-500 text-black font-bold uppercase px-6 rounded-xl">Withdraw</Button>
                </div>
                <p className="text-[9px] text-center opacity-40 uppercase">33% Network Tax Applied</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingCommentsFor} onOpenChange={() => setViewingCommentsFor(null)}>
        <DialogContent className={cn("max-w-lg rounded-3xl max-h-[80vh] flex flex-col p-0", isWhiteTheme ? "bg-white text-black" : "bg-[#111111] border-white/10 text-white")}>
          <DialogHeader className="p-6 border-b border-white/5"><DialogTitle className="font-headline italic">Neural Thread</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {viewingCommentsFor?.comments && Object.entries(viewingCommentsFor.comments).map(([id, c]) => (
              <div key={id} className="flex gap-3 items-start group">
                <div className={cn("p-3 rounded-2xl flex-1 border", isWhiteTheme ? "bg-gray-50 border-gray-100" : "bg-white/5 border-white/5")}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-purple-600">@{c.chatName}</span>
                    {(c.chatName === user?.chatName || viewingCommentsFor.chatName === user?.chatName) && (
                      <button onClick={() => handleDeleteComment(viewingCommentsFor.id, id)} className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm opacity-80">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-white/5 flex gap-2">
            <Input 
              placeholder="Respond..." 
              className={cn("h-11 rounded-2xl border-none", isWhiteTheme ? "bg-gray-100" : "bg-white/5")}
              value={commentText[viewingCommentsFor?.id || ""] || ""}
              onChange={(e) => setCommentText(prev => ({ ...prev, [viewingCommentsFor?.id || ""]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && viewingCommentsFor && handleAddComment(viewingCommentsFor.id)}
            />
            <Button onClick={() => viewingCommentsFor && handleAddComment(viewingCommentsFor.id)} className="h-11 w-11 rounded-2xl"><Send size={18} /></Button>
          </div>
        </DialogContent>
      </Dialog>

      <footer className={cn("fixed bottom-0 left-0 w-full p-4 text-center backdrop-blur-lg border-t z-40", isWhiteTheme ? "bg-white/80 border-gray-200" : "bg-black/60 border-white/5")}>
        <p className={cn("text-[9px] uppercase tracking-[0.6em] font-headline italic opacity-20")}>Neural Social Link &bull; SV-12 Pro Node Active</p>
      </footer>
    </div>
  );
}

