
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, push, onValue, set, remove, query, limitToLast, runTransaction } from 'firebase/database';
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
  User
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface SocialPost {
  id: string;
  chatName: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
  likes?: Record<string, boolean>;
  views: number;
  comments?: Record<string, { chatName: string; text: string; timestamp: number }>;
}

export default function SocialSplashPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [user, setUser] = useState<any>(null);
  const [newPostText, setNewPostText] = useState("");
  const [newPostImageUrl, setNewPostImageUrl] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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

    const postsRef = query(ref(db, 'social_posts'), limitToLast(50));
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
    setIsPosting(true);

    const postRef = ref(db, 'social_posts');
    push(postRef, {
      chatName: user.chatName,
      text: newPostText,
      imageUrl: newPostImageUrl || null,
      timestamp: Date.now(),
      views: 0
    });

    setNewPostText("");
    setNewPostImageUrl("");
    setIsPosting(false);
    setIsDialogOpen(false);
    toast({ title: "Post published", description: "Your thread is live on the network." });
  };

  const handleLike = (postId: string, currentLikes?: Record<string, boolean>) => {
    if (!user) return;
    const isLiked = currentLikes && currentLikes[user.chatName];
    const likeRef = ref(db, `social_posts/${postId}/likes/${user.chatName}`);
    
    if (isLiked) {
      remove(likeRef);
    } else {
      set(likeRef, true);
    }
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

    const banUntil = Date.now() + (30 * 60 * 1000);
    set(ref(db, `users/${post.chatName}/bannedUntil`), banUntil);

    toast({ 
      variant: "destructive",
      title: "User Banned", 
      description: `${post.chatName} suspended for 30m following your report.` 
    });
  };

  const incrementView = (postId: string) => {
    const viewRef = ref(db, `social_posts/${postId}/views`);
    runTransaction(viewRef, (current) => {
      return (current || 0) + 1;
    });
  };

  const displayedPosts = filterUser 
    ? posts.filter(p => p.chatName === filterUser)
    : posts;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col pb-20">
      <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => filterUser ? router.push('/trading/social-splash') : router.push('/trading')}
            className="text-white/60"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex flex-col">
            <h1 className="font-headline font-bold text-sm uppercase italic tracking-tighter">
              {filterUser ? `@${filterUser}'s Threads` : 'Social Splash'}
            </h1>
            <span className="text-[9px] text-purple-400 font-bold tracking-widest uppercase">VLF-Tec Social Node</span>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="bg-white text-black rounded-full hover:bg-white/90">
              <Plus size={20} />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#161616] border-white/10 text-white max-w-lg rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-headline uppercase italic">New Thread</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea 
                placeholder="What's happening on the network?"
                className="bg-transparent border-none text-lg resize-none focus-visible:ring-0 min-h-[120px] placeholder:text-white/20"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
              />
              <div className="flex items-center gap-2 bg-white/5 p-3 rounded-2xl border border-white/5">
                <ImageIcon size={18} className="text-white/40" />
                <Input 
                  placeholder="Catbox Image URL (Optional)"
                  className="bg-transparent border-none h-auto py-0 focus-visible:ring-0 text-xs"
                  value={newPostImageUrl}
                  onChange={(e) => setNewPostImageUrl(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleCreatePost} 
                disabled={!newPostText.trim() || isPosting}
                className="w-full bg-white text-black rounded-full font-bold uppercase tracking-tight"
              >
                {isPosting ? 'Broadcasting...' : 'Post'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-4 space-y-4">
        {displayedPosts.length === 0 && (
          <div className="text-center py-20">
            <Share2 size={48} className="mx-auto text-white/5 mb-4" />
            <p className="text-white/20 font-bold uppercase tracking-widest text-xs">The network is quiet.</p>
          </div>
        )}

        {displayedPosts.map((post) => (
          <div key={post.id} className="bg-[#111111] border border-white/5 rounded-3xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
                  <span className="text-sm font-bold hover:underline">@{post.chatName}</span>
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
                  <DropdownMenuItem onClick={() => handleReport(post)} className="text-destructive">
                    <Flag className="mr-2 h-4 w-4" /> Report User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-3">
              <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap">{post.text}</p>
              {post.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-white/5">
                  <img src={post.imageUrl} alt="Post Attachment" className="w-full h-auto object-cover max-h-[400px]" />
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
              
              <div className="flex items-center gap-1.5 text-white/40">
                <MessageCircle size={18} />
                <span className="text-xs font-bold">{Object.keys(post.comments || {}).length}</span>
              </div>

              <div className="flex items-center gap-1.5 text-white/40 ml-auto">
                <Eye size={18} />
                <span className="text-xs font-bold">{post.views || 0}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-white/5">
              {post.comments && Object.entries(post.comments).slice(-3).map(([id, c]) => (
                <div key={id} className="flex gap-2">
                  <span className="text-[11px] font-bold text-purple-400">@{c.chatName}</span>
                  <p className="text-[11px] text-white/60">{c.text}</p>
                </div>
              ))}
              
              <div className="flex gap-2 items-center">
                <Input 
                  placeholder="Add a comment..." 
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

      <footer className="fixed bottom-0 left-0 w-full p-4 text-center bg-black/60 backdrop-blur-lg border-t border-white/5">
        <p className="text-[9px] text-white/10 uppercase tracking-[0.6em] font-headline">Neural Social Link &bull; SV-12 Pro</p>
      </footer>
    </div>
  );
}
