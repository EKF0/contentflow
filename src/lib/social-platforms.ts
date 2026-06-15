export type SocialPlatform = 'twitter' | 'linkedin' | 'instagram';

export type ScheduledPostStatus = 'scheduled' | 'posted' | 'failed' | 'cancelled';

export interface ScheduledPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  scheduledAt: string;
  status: ScheduledPostStatus;
  recordId?: number;
  recordTitle?: string;
  createdAt: string;
  imageUrl?: string;
  charLimit: number;
}

export const PLATFORM_CONFIG: Record<SocialPlatform, { name: string; icon: string; color: string; charLimit: number }> = {
  twitter: { name: 'Twitter/X', icon: 'twitter', color: '#1d9bf0', charLimit: 280 },
  linkedin: { name: 'LinkedIn', icon: 'linkedin', color: '#0a66c2', charLimit: 3000 },
  instagram: { name: 'Instagram', icon: 'instagram', color: '#e4405f', charLimit: 2200 },
};

let scheduledPosts: ScheduledPost[] = [
  {
    id: 'sp-1',
    platform: 'twitter',
    content: 'Check out our latest blog post on content planning at scale. We cover 12 key strategies that helped us 3x our output. #ContentMarketing #Productivity',
    scheduledAt: '2026-06-16T10:00:00',
    status: 'scheduled',
    recordId: 9,
    recordTitle: 'SEO Guide: Content Planning at Scale',
    createdAt: '2026-06-14T14:00:00',
    charLimit: 280,
  },
  {
    id: 'sp-2',
    platform: 'linkedin',
    content: "We just published a deep dive on how asynchronous collaboration is transforming distributed teams. Here are 3 lessons we've learned building ContentFlow:\n\n1. Write first, talk later\n2. Over-communicate context\n3. Trust the process\n\nFull article in the comments.",
    scheduledAt: '2026-06-17T08:30:00',
    status: 'scheduled',
    recordId: 7,
    recordTitle: 'LinkedIn Thought Leadership Post',
    createdAt: '2026-06-14T15:00:00',
    charLimit: 3000,
  },
  {
    id: 'sp-3',
    platform: 'twitter',
    content: "10 Productivity Tips from our team:\n\n1. Block your calendar\n2. Batch similar tasks\n3. Use templates\n4. Automate repeats\n5. Review weekly\n\nFull thread below!",
    scheduledAt: '2026-06-10T09:00:00',
    status: 'posted',
    recordId: 11,
    recordTitle: 'Twitter Thread: 10 Productivity Tips',
    createdAt: '2026-06-08T10:00:00',
    charLimit: 280,
  },
  {
    id: 'sp-4',
    platform: 'instagram',
    content: 'Behind the scenes of our feature highlight reel. Short, snappy, and full of product love.',
    scheduledAt: '2026-06-16T12:00:00',
    status: 'scheduled',
    recordId: 4,
    recordTitle: 'Instagram Reel: Feature Highlights',
    createdAt: '2026-06-14T16:00:00',
    charLimit: 2200,
  },
];

export function getScheduledPosts(): ScheduledPost[] {
  console.log('[SocialPlatform] getScheduledPosts called');
  return [...scheduledPosts];
}

export function schedulePost(post: Omit<ScheduledPost, 'id' | 'status' | 'createdAt'>): ScheduledPost {
  const newPost: ScheduledPost = {
    ...post,
    id: `sp-${Date.now()}`,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };
  scheduledPosts = [...scheduledPosts, newPost];
  console.log('[SocialPlatform] schedulePost:', newPost);
  return newPost;
}

export function cancelPost(postId: string): boolean {
  const idx = scheduledPosts.findIndex(p => p.id === postId);
  if (idx === -1) return false;
  scheduledPosts[idx] = { ...scheduledPosts[idx], status: 'cancelled' };
  console.log('[SocialPlatform] cancelPost:', postId);
  return true;
}

export function deletePost(postId: string): boolean {
  const before = scheduledPosts.length;
  scheduledPosts = scheduledPosts.filter(p => p.id !== postId);
  console.log('[SocialPlatform] deletePost:', postId);
  return scheduledPosts.length < before;
}
