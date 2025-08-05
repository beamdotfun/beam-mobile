import { Post } from '../types/social';

// Legacy ThreadGroup interface for backward compatibility
// TODO: Remove when ThreadDetailsScreen is updated to work with backend thread data
export interface ThreadGroup {
  id: string;
  firstPost: Post;
  lastPost?: Post;
  posts: Post[];
  totalPosts: number;
  lastUpdated?: string;
  isThread?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Legacy thread summary interface for ThreadCard compatibility
interface ThreadSummary {
  participants: any[];
  totalPosts: number;
}

// Legacy function for backward compatibility
// TODO: Remove when ThreadDetailsScreen is updated
export function getThreadSummary(thread: ThreadGroup): ThreadSummary {
  // Extract unique participants from thread posts
  const participants = thread.posts.reduce((unique: any[], post) => {
    const userWallet = post.user?.walletAddress || post.userWallet || '';
    if (userWallet && !unique.find(p => p.walletAddress === userWallet)) {
      unique.push({
        walletAddress: userWallet,
        displayName: post.user?.name || post.user?.displayName || post.username || 'Anonymous'
      });
    }
    return unique;
  }, []);

  return {
    participants,
    totalPosts: thread.totalPosts
  };
}

// Legacy function for backward compatibility  
// TODO: Remove when no longer needed
export function isThreadGroup(item: any): item is ThreadGroup {
  return item && typeof item === 'object' && 'firstPost' in item && 'posts' in item;
}