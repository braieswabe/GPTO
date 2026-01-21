import { generateAGCCContent } from '@gpto/servos-agcc';

/**
 * Social Servo
 */

export interface SocialPost {
  id: string;
  platform: 'twitter' | 'linkedin' | 'facebook';
  content: string;
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'published';
  engagement?: {
    likes: number;
    shares: number;
    comments: number;
  };
}

/**
 * Generate social media post
 */
export async function generateSocialPost(
  topic: string,
  platform: SocialPost['platform'],
  tone?: string
): Promise<SocialPost> {
  const contentType = platform === 'twitter' ? 'social_post' : 'social_post';
  
  const result = await generateAGCCContent({
    contentType,
    topic,
    tone: tone || 'conversational',
  });

  return {
    id: `post-${Date.now()}`,
    platform,
    content: result.content,
    status: 'draft',
  };
}

/**
 * Schedule social post
 */
export function schedulePost(post: SocialPost, scheduledFor: Date): SocialPost {
  return {
    ...post,
    scheduledFor,
    status: 'scheduled',
  };
}
