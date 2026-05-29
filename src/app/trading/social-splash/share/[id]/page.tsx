
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, BadgeCheck, Share2, Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialPost {
  id: string;
  chatName: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
  views: number;
  targetViews?: number;
  growthDuration?: number;
}

export default function PostSharePage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalUserViews, setTotalUserViews] = useState(0);

  const getDisplayedViews = (p: SocialPost) => {
    if (!p.targetViews || !p.timestamp) return p.views || 0;
    const elapsed = Date.now() - p.timestamp;
    const duration = p.growthDuration || 86400000;
    if (elapsed >= duration) return p.targetViews + (p.views || 0);
    const progress = elapsed / duration;
    return Math.floor(p.targetViews * progress) + (p.views || 0);
  };

  useEffect(() => {
    if (!params.id) return;

    const postRef = ref(db, `social_posts/${params.id}`);
    const unsubscribe = onValue(postRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPost({ id: params.id as string, ...data });
        
        const allPostsRef = ref(db, 'social_posts');
        onValue(allPostsRef, (allSnapshot) => {
          const allData = allSnapshot.val();
          if (allData) {
            const views = Object.values(allData)
              .filter((p: any) => p.chatName === data.chatName)
              .reduce((acc: number, curr: any) => acc + getDisplayedViews(curr as SocialPost), 0);
            setTotalUserViews(views);
          }
        }, { onlyOnce: true });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [params.id]);

  if (loading) return null;

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Share2 size={48} className="text-white/20" />
        <h1 className="text-2xl font-headline font-bold text-white">Thread Not Found</h1>
        <Button onClick={() => router.push('/trading/social-splash')} variant="outline" className="rounded-full">Back Feed</Button>
      </div>
    );
  }

  const isVerified = totalUserViews >= 1000;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 px-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/trading/social-splash')} className="text-white/60">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-headline font-bold text-sm uppercase italic tracking-tighter">Shared Thread</h1>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-6 pt-12">
        <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
              <User size={24} className="text-white/40" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold">@{post.chatName}</span>
                {isVerified && <BadgeCheck size={16} className="text-blue-500 fill-blue-500/20" />}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase font-bold tracking-widest">
                <Clock size={10} />
                {new Date(post.timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-lg leading-relaxed whitespace-pre-wrap text-white/90">{post.text}</p>
            {post.imageUrl && (
              <div className="rounded-3xl overflow-hidden border border-white/5 bg-black/40">
                <img src={post.imageUrl} alt="Thread Visual" className="w-full h-auto object-cover" />
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-white/20" />
              <span className="text-xs font-bold text-white/40">{getDisplayedViews(post)} Views</span>
            </div>
            <Button 
              onClick={() => router.push('/trading/social-splash')}
              className="bg-white text-black hover:bg-white/90 rounded-2xl font-bold uppercase text-[10px] tracking-widest h-10 px-6"
            >
              Join Discussion
            </Button>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center mt-auto border-t border-white/5">
        <p className="text-[9px] uppercase tracking-[0.6em] font-headline italic text-white/20">Neural Social Link &bull; SV-12 Pro Node Active</p>
      </footer>
    </div>
  );
}
