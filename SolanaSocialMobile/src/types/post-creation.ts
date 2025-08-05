export interface PostDraft {
  id: string;
  type: PostType;
  content: PostContent;
  media: PostMedia[];

  // Metadata
  tags: string[];
  mentions: string[];

  // Post quoting
  quotedPost?: QuotedPostData;

  // Settings
  visibility: 'public' | 'followers';

  // Scheduling
  scheduledAt?: string;

  // Draft info
  createdAt: string;
  updatedAt: string;
  autoSaveEnabled: boolean;
  version: number;
}

export type PostType = 'text' | 'photo' | 'video' | 'quote';

export interface PostContent {
  text: string;
  markdown?: string;
  quotedPost?: QuotedPostData;
}

export interface QuotedPostData {
  id: string;
  author: {
    wallet: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  mediaPreview?: string;
}

export interface PostMedia {
  id: string;
  type: 'image' | 'video';
  uri: string;
  thumbnailUri?: string;

  // Media info
  width?: number;
  height?: number;
  duration?: number; // seconds for video
  size: number; // bytes

  // Editing
  caption?: string;
  altText?: string;

  // Upload status
  uploadProgress?: number;
  uploadError?: string;
  cloudUrl?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  placeName?: string;
}

export interface PostTemplate {
  id: string;
  name: string;
  description: string;
  content: Partial<PostDraft>;
  isSystem: boolean;
  usageCount: number;
  createdAt: string;
}

export interface PostSchedule {
  id: string;
  draftId: string;
  scheduledAt: string;
  status: 'pending' | 'published' | 'failed' | 'cancelled';
  publishedAt?: string;
  errorMessage?: string;
}

export interface PostStats {
  draftsCount: number;
  scheduledCount: number;
  publishedToday: number;
  totalPublished: number;
  averageEngagement: number;
}
