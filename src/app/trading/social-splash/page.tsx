
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
  Copy
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
}

export default function SocialSplashPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [user, setUser] = useState<any>(null);
  const [newPostText, setNewPostText] = useState("");
  const [newPostImageUrl, setNewPostImageUrl] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [viewingCommentsFor, setViewingCommentsFor] = useState<SocialPost | null>(null);
  const [view, setView] = useState<'feed' | 'analytics'>('feed');
  const [editingPost, setEditingPost] = useState<{id: string, text: string} | null>(null);
  const [isWhiteTheme, setIsWhiteTheme] = useState(false);
  const [reportedPosts, setReportedPosts] = useState<string[]>([]);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const filterUser = searchParams.get('user');

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('social_splash_theme');
    if (savedTheme === 'white') setIsWhiteTheme(true);
  }, []);

  // Save theme preference
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
    setUser(JSON.parse(sessionUser));

    const postsRef = query(ref(db, 'social_posts'), limitToLast(100));
    const unsubscribe = onValue(postsRef, (snapshot) => {
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

    return () => unsubscribe();
  }, [router]);

  // Calculate user stats for blue tick
  const userStats = useMemo(() => {
    const stats: Record<string, number> = {};
    posts.forEach(p => {
      stats[p.chatName] = (stats[p.chatName] || 0) + (p.views || 0);
    });
    return stats;
  }, [posts]);

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

    setIsPosting(true);
    const postRef = ref(db, 'social_posts');
    push(postRef, {
      chatName: user.chatName,
      text: newPostText,
      imageUrl: newPostImageUrl || null,
      timestamp: Date.now(),
      views: 0,
      isPrivate: false
    });

    setNewPostText("");
    setNewPostImageUrl("");
    setIsPosting(false);
    toast({ title: "Broadcast Successful", description: "Thread indexed on the Splash network." });
  };

  const handleEditPost = () => {
    if (!editingPost || !editingPost.text.trim()) return;
    update(ref(db, `social_posts/${editingPost.id}`), { text: editingPost.text });
    setEditingPost(null);
    toast({ title: "Thread Updated", description: "Information updated on the grid." });
  };

  const handleDeletePost = (postId: string) => {
    remove(ref(db, `social_posts/${postId}`));
    toast({ title: "Thread Deleted", description: "Information purged from the network." });
  };

  const togglePrivate = (postId: string, current: boolean) => {
    update(ref(db, `social_posts/${postId}`), { isPrivate: !current });
    toast({ 
      title: !current ? "Node Restricted" : "Node Public", 
      description: !current ? "Thread is now private." : "Thread is now visible to the network." 
    });
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
    const hasAbuse = ABUSE_WORDS.some(word => content.includes(word));

    if (hasAbuse) {
      const banUntil = Date.now() + (30 * 60 * 1000);
      set(ref(db, `users/${post.chatName}/bannedUntil`), banUntil);
    }
    
    toast({ title: "Report Successfully", description: "This post is now under review." });
  };

  const handleShare = (postId: string) => {
    const shareUrl = `${window.location.origin}/trading/social-splash/share/${postId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link Copied", description: "Share this thread with others." });
  };

  const incrementView = (postId: string) => {
    const viewRef = ref(db, `social_posts/${postId}/views`);
    runTransaction(viewRef, (current) => (current || 0) + 1);
  };

  const displayedPosts = (view === 'analytics')
    ? posts.filter(p => p.chatName === user?.chatName)
    : (filterUser 
        ? posts.filter(p => p.chatName === filterUser && (!p.isPrivate || p.chatName === user?.chatName))
        : posts.filter(p => !p.isPrivate || p.chatName === user?.chatName));

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
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (view === 'analytics') setView('feed');
              else if (filterUser) router.push('/trading/social-splash');
              else router.push('/trading');
            }}
            className={mutedText}
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex flex-col">
            <h1 className="font-headline font-bold text-sm uppercase italic tracking-tighter">
              {view === 'analytics' ? 'My Analytics' : filterUser ? `@${filterUser}` : 'Social Splash'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={cn("rounded-full", mutedText)}
          >
            {isWhiteTheme ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setView(view === 'feed' ? 'analytics' : 'feed')}
            className={cn("flex items-center gap-2 rounded-full border px-4", 
              isWhiteTheme ? "border-gray-200" : "border-white/5",
              view === 'analytics' ? 'bg-purple-500/20 text-purple-400' : mutedText
            )}
          >
            <BarChart3 size={18} />
            <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline">Analytics</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-4 space-y-6">
        {view === 'feed' && !filterUser && (
          <div className={cn("border rounded-3xl p-5 space-y-4 shadow-sm", cardBg)}>
            <div className="flex gap-4">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border shrink-0", 
                isWhiteTheme ? "bg-gray-100 border-gray-200" : "bg-white/5 border-white/5"
              )}>
                <User size={20} className={ghostText} />
              </div>
              <div className="flex-1 space-y-3">
                <Textarea 
                  placeholder="Add Your Threads"
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  className={cn(
                    "bg-transparent border-dotted border-2 text-[15px] p-3 focus-visible:ring-0 resize-none min-h-[80px] placeholder:text-gray-400 rounded-xl",
                    isWhiteTheme ? "border-black/20" : "border-white/10"
                  )}
                />
                <div className={cn("flex items-center gap-2 p-2 rounded-xl border", 
                  isWhiteTheme ? "bg-white border-gray-200" : "bg-white/5 border-white/5"
                )}>
                  <ImageIcon size={14} className={ghostText} />
                  <Input 
                    placeholder="Image URL (Optional)"
                    value={newPostImageUrl}
                    onChange={(e) => setNewPostImageUrl(e.target.value)}
                    className="bg-transparent border-none h-6 py-0 focus-visible:ring-0 text-[11px] placeholder:text-gray-400"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", ghostText)}>
                    {posts.filter(p => p.chatName === user?.chatName && p.timestamp >= new Date().setHours(0,0,0,0)).length}/5 Daily Limit
                  </span>
                  <Button 
                    onClick={handleCreatePost}
                    disabled={!newPostText.trim() || isPosting}
                    className={cn("rounded-full px-6 font-bold text-xs uppercase", 
                      isWhiteTheme ? "bg-black text-white hover:bg-black/90" : "bg-white text-black hover:bg-white/90"
                    )}
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {displayedPosts.length === 0 && (
          <div className="text-center py-20">
            <Share2 size={48} className={cn("mx-auto mb-4", ghostText)} />
            <p className={cn("font-bold uppercase tracking-widest text-xs", ghostText)}>No activity detected.</p>
          </div>
        )}

        {displayedPosts.map((post) => {
          const totalUserViews = userStats[post.chatName] || 0;
          const isVerified = totalUserViews >= 1000;
          const isReported = reportedPosts.includes(post.id);

          return (
            <div key={post.id} className={cn("border rounded-3xl p-5 space-y-4 transition-all shadow-sm", 
              cardBg,
              post.isPrivate && 'border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]'
            )}>
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => {
                    incrementView(post.id);
                    router.push(`/trading/social-splash?user=${post.chatName}`);
                  }}
                  className="flex items-center gap-2 group"
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border transition-colors", 
                    isWhiteTheme ? "bg-gray-100 border-gray-200 group-hover:border-purple-500/50" : "bg-white/5 border-white/5 group-hover:border-purple-500/50"
                  )}>
                    <User size={20} className={cn("transition-colors", 
                      isWhiteTheme ? "text-gray-400 group-hover:text-purple-600" : "text-white/40 group-hover:text-purple-400"
                    )} />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-sm font-bold hover:underline", textColor)}>@{post.chatName}</span>
                      {isVerified && <BadgeCheck size={14} className="text-blue-500 fill-blue-500/20" />}
                      {post.isPrivate && <Lock size={10} className="text-amber-500" />}
                    </div>
                    <span className={cn("text-[10px]", mutedText)}>{new Date(post.timestamp).toLocaleDateString()}</span>
                  </div>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={mutedText}>
                      <MoreHorizontal size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={cn("border", isWhiteTheme ? "bg-white border-gray-200" : "bg-[#161616] border-white/10 text-white")}>
                    <DropdownMenuItem disabled className="text-[10px] opacity-50 font-mono">ID: {post.id}</DropdownMenuItem>
                    {post.chatName === user?.chatName ? (
                      <>
                        <DropdownMenuItem onClick={() => setEditingPost({id: post.id, text: post.text})}>
                          <Edit3 className="mr-2 h-4 w-4" /> Edit Thread
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePrivate(post.id, post.isPrivate || false)}>
                          {post.isPrivate ? <Globe className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                          {post.isPrivate ? 'Make Public' : 'Make Private'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Thread
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem onClick={() => handleReport(post)} className="text-destructive">
                        <Flag className="mr-2 h-4 w-4" /> Report Violation
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                {isReported ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                    <Flag size={16} className="text-red-500" />
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest italic">This post is under review</p>
                  </div>
                ) : (
                  <>
                    <p className={cn("text-[15px] leading-relaxed whitespace-pre-wrap", isWhiteTheme ? "text-gray-800" : "text-white/90")}>{post.text}</p>
                    {post.imageUrl && (
                      <div className={cn("rounded-2xl overflow-hidden border", isWhiteTheme ? "border-gray-200 bg-gray-100" : "border-white/5 bg-black/40")}>
                        <img src={post.imageUrl} alt="Attached" className="w-full h-auto object-cover max-h-[400px]" />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-6 pt-2">
                <button 
                  onClick={() => handleLike(post.id, post.likes)}
                  className={cn("flex items-center gap-1.5 transition-colors", 
                    post.likes?.[user?.chatName] ? 'text-red-500' : cn(mutedText, "hover:text-red-400")
                  )}
                >
                  <Heart size={18} fill={post.likes?.[user?.chatName] ? 'currentColor' : 'none'} />
                  <span className="text-xs font-bold">{Object.keys(post.likes || {}).length}</span>
                </button>
                
                <button 
                  onClick={() => setViewingCommentsFor(post)}
                  className={cn("flex items-center gap-1.5 hover:text-purple-500 transition-colors", mutedText)}
                >
                  <MessageCircle size={18} />
                  <span className="text-xs font-bold">{Object.keys(post.comments || {}).length}</span>
                </button>

                <button 
                  onClick={() => handleShare(post.id)}
                  className={cn("flex items-center gap-1.5 hover:text-blue-400 transition-colors", mutedText)}
                >
                  <Share2 size={18} />
                </button>

                <div className={cn("flex items-center gap-1.5 ml-auto", mutedText)}>
                  <Eye size={18} />
                  <span className="text-xs font-bold">{post.views || 0}</span>
                </div>
              </div>

              {isVerified && post.chatName === user?.chatName && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <Banknote size={16} className="text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Earnings Started</span>
                    <span className="text-xs font-bold text-white/90">Est. Earning: {post.imageUrl ? '12.5 rs' : '8 rs'}</span>
                  </div>
                </div>
              )}

              <div className={cn("space-y-3 pt-2 border-t", isWhiteTheme ? "border-gray-200" : "border-white/5")}>
                {post.comments && Object.entries(post.comments).length > 0 && (
                  <div 
                    className={cn("p-3 rounded-2xl cursor-pointer transition-colors", 
                      isWhiteTheme ? "bg-white border border-gray-100 hover:bg-gray-100" : "bg-white/5 hover:bg-white/10"
                    )}
                    onClick={() => setViewingCommentsFor(post)}
                  >
                    {(() => {
                      const lastComment = Object.entries(post.comments).pop()![1];
                      return (
                        <div className="flex gap-2 items-start">
                          <span className="text-[11px] font-bold text-purple-600 shrink-0">@{lastComment.chatName}</span>
                          <p className={cn("text-[11px] line-clamp-1", isWhiteTheme ? "text-gray-600" : "text-white/60")}>{lastComment.text}</p>
                        </div>
                      );
                    })()}
                    {Object.keys(post.comments).length > 1 && (
                      <p className={cn("text-[9px] mt-2 font-bold uppercase tracking-widest", ghostText)}>
                        + {Object.keys(post.comments).length - 1} more responses
                      </p>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2 items-center">
                  <Input 
                    placeholder="Respond to thread..." 
                    className={cn("h-8 border-none text-[11px] rounded-full px-4 focus-visible:ring-purple-500/50 shadow-none", 
                      isWhiteTheme ? "bg-gray-100" : "bg-white/5"
                    )}
                    value={commentText[post.id] || ""}
                    onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                  />
                  <button 
                    className={cn("h-8 w-8 flex items-center justify-center transition-colors", mutedText, "hover:text-purple-500")}
                    onClick={() => handleAddComment(post.id)}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      <Dialog open={!!viewingCommentsFor} onOpenChange={() => setViewingCommentsFor(null)}>
        <DialogContent className={cn("max-w-lg rounded-3xl max-h-[80vh] flex flex-col p-0 overflow-hidden", 
          isWhiteTheme ? "bg-white text-black" : "bg-[#111111] border-white/10 text-white"
        )}>
          <DialogHeader className={cn("p-6 border-b", isWhiteTheme ? "border-gray-200" : "border-white/5")}>
            <DialogTitle className="font-headline text-lg italic uppercase tracking-tighter">Neural Thread</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
            {viewingCommentsFor?.comments ? Object.entries(viewingCommentsFor.comments).map(([id, c]) => (
              <div key={id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border shrink-0", 
                  isWhiteTheme ? "bg-gray-100 border-gray-200" : "bg-white/5 border-white/5"
                )}>
                  <User size={14} className={ghostText} />
                </div>
                <div className={cn("p-3 rounded-2xl flex-1 border", 
                  isWhiteTheme ? "bg-gray-50 border-gray-100" : "bg-white/5 border-white/5"
                )}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-purple-600">@{c.chatName}</span>
                    <span className={ghostText + " text-[9px]"}>{new Date(c.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className={cn("text-sm", isWhiteTheme ? "text-gray-800" : "text-white/80")}>{c.text}</p>
                </div>
              </div>
            )) : (
              <p className={cn("text-center py-10 uppercase tracking-widest text-xs", ghostText)}>Quiet conversation...</p>
            )}
          </div>
          <div className={cn("p-6 border-t", isWhiteTheme ? "border-gray-200" : "border-white/5")}>
            <div className="flex gap-2">
              <Input 
                placeholder="Add to the conversation..."
                className={cn("border-none h-11 rounded-2xl focus-visible:ring-purple-500/50 shadow-none", 
                  isWhiteTheme ? "bg-gray-100" : "bg-white/5"
                )}
                value={commentText[viewingCommentsFor?.id || ""] || ""}
                onChange={(e) => setCommentText(prev => ({ ...prev, [viewingCommentsFor?.id || ""]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && viewingCommentsFor && handleAddComment(viewingCommentsFor.id)}
              />
              <Button 
                onClick={() => viewingCommentsFor && handleAddComment(viewingCommentsFor.id)}
                className={cn("h-11 w-11 rounded-2xl", 
                  isWhiteTheme ? "bg-black text-white" : "bg-white text-black"
                )}
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className={cn("max-w-lg rounded-3xl", 
          isWhiteTheme ? "bg-white text-black" : "bg-[#161616] border-white/10 text-white"
        )}>
          <DialogHeader>
            <DialogTitle className="font-headline uppercase italic">Update Thread</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea 
              className={cn("bg-transparent border text-[15px] min-h-[120px] rounded-2xl", 
                isWhiteTheme ? "border-gray-200" : "border-white/10"
              )}
              value={editingPost?.text || ""}
              onChange={(e) => setEditingPost(prev => prev ? {...prev, text: e.target.value} : null)}
            />
            <Button 
              onClick={handleEditPost} 
              className={cn("w-full rounded-full font-bold uppercase", 
                isWhiteTheme ? "bg-black text-white" : "bg-white text-black"
              )}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <footer className={cn("fixed bottom-0 left-0 w-full p-4 text-center backdrop-blur-lg border-t z-40 transition-colors", 
        isWhiteTheme ? "bg-white/80 border-gray-200" : "bg-black/60 border-white/5"
      )}>
        <p className={cn("text-[9px] uppercase tracking-[0.6em] font-headline italic", ghostText)}>Neural Social Link &bull; SV-12 Pro Node Active</p>
      </footer>
    </div>
  );
}
