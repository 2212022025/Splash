
"use client";

import React, { useState, useEffect } from 'react';
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
  Plus,
  Image as ImageIcon,
  User,
  Trash2,
  Edit3,
  Lock,
  Globe,
  BarChart3,
  X
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
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const filterUser = searchParams.get('user');

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

  const handleCreatePost = () => {
    if (!newPostText.trim() || !user) return;

    // Daily Limit Check (5 posts)
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

    // Ban only if post contains bad words
    const content = post.text.toLowerCase();
    const hasAbuse = ABUSE_WORDS.some(word => content.includes(word));

    if (hasAbuse) {
      const banUntil = Date.now() + (30 * 60 * 1000);
      set(ref(db, `users/${post.chatName}/bannedUntil`), banUntil);
      toast({ variant: "destructive", title: "Policy Enforcement", description: "Violation detected. User suspended." });
    } else {
      toast({ title: "Report Logged", description: "The grid is monitoring this node for activity." });
    }
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col pb-20">
      <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (view === 'analytics') setView('feed');
              else if (filterUser) router.push('/trading/social-splash');
              else router.push('/trading');
            }}
            className="text-white/60"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex flex-col">
            <h1 className="font-headline font-bold text-sm uppercase italic tracking-tighter">
              {view === 'analytics' ? 'My Analytics' : filterUser ? `@${filterUser}` : 'Social Splash'}
            </h1>
            <span className="text-[9px] text-purple-400 font-bold tracking-widest uppercase">VLF-Tec Node</span>
          </div>
        </div>

        <Button 
          variant="ghost" 
          onClick={() => setView(view === 'feed' ? 'analytics' : 'feed')}
          className={`flex items-center gap-2 rounded-full border border-white/5 px-4 ${view === 'analytics' ? 'bg-purple-500/20 text-purple-400' : 'text-white/40'}`}
        >
          <BarChart3 size={18} />
          <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline">Analytics</span>
        </Button>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-4 space-y-6">
        {/* Top Compose Box */}
        {view === 'feed' && !filterUser && (
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                <User size={20} className="text-white/20" />
              </div>
              <div className="flex-1 space-y-3">
                <Textarea 
                  placeholder="Broadcast to the network..."
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  className="bg-transparent border-none text-[15px] p-0 focus-visible:ring-0 resize-none min-h-[60px] placeholder:text-white/10"
                />
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                  <ImageIcon size={14} className="text-white/20" />
                  <Input 
                    placeholder="Image URL (Optional)"
                    value={newPostImageUrl}
                    onChange={(e) => setNewPostImageUrl(e.target.value)}
                    className="bg-transparent border-none h-6 py-0 focus-visible:ring-0 text-[11px] placeholder:text-white/10"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                    {posts.filter(p => p.chatName === user?.chatName && p.timestamp >= new Date().setHours(0,0,0,0)).length}/5 Daily Limit
                  </span>
                  <Button 
                    onClick={handleCreatePost}
                    disabled={!newPostText.trim() || isPosting}
                    className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-bold text-xs uppercase"
                  >
                    Broadcast
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {displayedPosts.length === 0 && (
          <div className="text-center py-20">
            <Share2 size={48} className="mx-auto text-white/5 mb-4" />
            <p className="text-white/20 font-bold uppercase tracking-widest text-xs">No activity detected.</p>
          </div>
        )}

        {displayedPosts.map((post) => (
          <div key={post.id} className={`bg-[#111111] border rounded-3xl p-5 space-y-4 transition-all ${post.isPrivate ? 'border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 'border-white/5'}`}>
            <div className="flex items-center justify-between">
              <button 
                onClick={() => {
                  incrementView(post.id);
                  router.push(`/trading/social-splash?user=${post.chatName}`);
                }}
                className="flex items-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-purple-500/50 transition-colors">
                  <User size={20} className="text-white/40 group-hover:text-purple-400" />
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold hover:underline">@{post.chatName}</span>
                    {post.isPrivate && <Lock size={10} className="text-amber-500" />}
                  </div>
                  <span className="text-[10px] text-white/20">{new Date(post.timestamp).toLocaleDateString()}</span>
                </div>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white/20 hover:text-white">
                    <MoreHorizontal size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#161616] border-white/10 text-white">
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
              <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap">{post.text}</p>
              {post.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/40">
                  <img src={post.imageUrl} alt="Attached" className="w-full h-auto object-cover max-h-[400px]" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-6 pt-2">
              <button 
                onClick={() => handleLike(post.id, post.likes)}
                className={`flex items-center gap-1.5 transition-colors ${post.likes?.[user?.chatName] ? 'text-red-500' : 'text-white/40 hover:text-red-400'}`}
              >
                <Heart size={18} fill={post.likes?.[user?.chatName] ? 'currentColor' : 'none'} />
                <span className="text-xs font-bold">{Object.keys(post.likes || {}).length}</span>
              </button>
              
              <button 
                onClick={() => setViewingCommentsFor(post)}
                className="flex items-center gap-1.5 text-white/40 hover:text-purple-400"
              >
                <MessageCircle size={18} />
                <span className="text-xs font-bold">{Object.keys(post.comments || {}).length}</span>
              </button>

              <div className="flex items-center gap-1.5 text-white/40 ml-auto">
                <Eye size={18} />
                <span className="text-xs font-bold">{post.views || 0}</span>
              </div>
            </div>

            {/* Smart Comments - Only show one */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              {post.comments && Object.entries(post.comments).length > 0 && (
                <div 
                  className="bg-white/5 p-3 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => setViewingCommentsFor(post)}
                >
                  {(() => {
                    const lastComment = Object.entries(post.comments).pop()![1];
                    return (
                      <div className="flex gap-2 items-start">
                        <span className="text-[11px] font-bold text-purple-400 shrink-0">@{lastComment.chatName}</span>
                        <p className="text-[11px] text-white/60 line-clamp-1">{lastComment.text}</p>
                      </div>
                    );
                  })()}
                  {Object.keys(post.comments).length > 1 && (
                    <p className="text-[9px] text-white/20 mt-2 font-bold uppercase tracking-widest">
                      + {Object.keys(post.comments).length - 1} more responses
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex gap-2 items-center">
                <Input 
                  placeholder="Respond to thread..." 
                  className="h-8 bg-white/5 border-none text-[11px] rounded-full px-4 focus-visible:ring-purple-500/50"
                  value={commentText[post.id] || ""}
                  onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-white/40 hover:text-purple-400"
                  onClick={() => handleAddComment(post.id)}
                >
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Full Conversation Dialog */}
      <Dialog open={!!viewingCommentsFor} onOpenChange={() => setViewingCommentsFor(null)}>
        <DialogContent className="bg-[#111111] border-white/10 text-white max-w-lg rounded-3xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 border-b border-white/5">
            <DialogTitle className="font-headline text-lg italic uppercase tracking-tighter">Neural Thread</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {viewingCommentsFor?.comments ? Object.entries(viewingCommentsFor.comments).map(([id, c]) => (
              <div key={id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                  <User size={14} className="text-white/20" />
                </div>
                <div className="bg-white/5 p-3 rounded-2xl flex-1 border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-purple-400">@{c.chatName}</span>
                    <span className="text-[9px] text-white/10">{new Date(c.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-white/80">{c.text}</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-white/20 text-xs py-10 uppercase tracking-widest">Quiet conversation...</p>
            )}
          </div>
          <div className="p-6 border-t border-white/5">
            <div className="flex gap-2">
              <Input 
                placeholder="Add to the conversation..."
                className="bg-white/5 border-none h-11 rounded-2xl focus-visible:ring-purple-500/50"
                value={commentText[viewingCommentsFor?.id || ""] || ""}
                onChange={(e) => setCommentText(prev => ({ ...prev, [viewingCommentsFor?.id || ""]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && viewingCommentsFor && handleAddComment(viewingCommentsFor.id)}
              />
              <Button 
                onClick={() => viewingCommentsFor && handleAddComment(viewingCommentsFor.id)}
                className="h-11 w-11 bg-white text-black rounded-2xl"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="bg-[#161616] border-white/10 text-white max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline uppercase italic">Update Thread</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea 
              className="bg-transparent border-white/10 text-[15px] min-h-[120px] rounded-2xl"
              value={editingPost?.text || ""}
              onChange={(e) => setEditingPost(prev => prev ? {...prev, text: e.target.value} : null)}
            />
            <Button onClick={handleEditPost} className="w-full bg-white text-black rounded-full font-bold uppercase">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="fixed bottom-0 left-0 w-full p-4 text-center bg-black/60 backdrop-blur-lg border-t border-white/5 z-40">
        <p className="text-[9px] text-white/10 uppercase tracking-[0.6em] font-headline italic">Neural Social Link &bull; SV-12 Pro Node Active</p>
      </footer>
    </div>
  );
}
