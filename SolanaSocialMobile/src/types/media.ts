export interface MediaAsset {
  id: string;
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  size?: number;
  mimeType?: string;
  fileName?: string;
}

export interface PostDraft {
  message: string;
  mediaAssets: MediaAsset[];
  quotedPostId?: string;
  isValid: boolean;
  characterCount: number;
  estimatedFee?: number;
}

export interface MediaUploadProgress {
  assetId: string;
  progress: number;
  uploading: boolean;
  error?: string;
}

export interface PostCreationState {
  draft: PostDraft;
  uploadProgress: MediaUploadProgress[];
  isPosting: boolean;
  error: string | null;
}
