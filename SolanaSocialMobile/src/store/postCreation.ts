import {create} from 'zustand';
import {
  MediaAsset,
  PostDraft,
  MediaUploadProgress,
  PostCreationState,
} from '@/types/media';
import {socialAPI} from '../services/api/social';
import {mediaService} from '../services/media/mediaService';
import {useWalletStore} from './wallet';

const MAX_MESSAGE_LENGTH = 280;
const MAX_MEDIA_COUNT = 4;

interface PostCreationStore extends PostCreationState {
  // Draft management
  updateMessage: (message: string) => void;
  addMediaAsset: (asset: MediaAsset) => void;
  removeMediaAsset: (assetId: string) => void;
  reorderMediaAssets: (fromIndex: number, toIndex: number) => void;
  clearDraft: () => void;
  setQuotedPostId: (postId: string | undefined) => void;

  // Media upload
  uploadMedia: (asset: MediaAsset) => Promise<string>;
  updateUploadProgress: (assetId: string, progress: number) => void;
  setUploadError: (assetId: string, error: string) => void;

  // Post submission
  submitPost: () => Promise<void>;
  estimatePostingFee: () => Promise<number>;

  // Validation
  validateDraft: () => boolean;

  // UI state
  setPosting: (posting: boolean) => void;
  setError: (error: string | null) => void;
}

const createInitialDraft = (): PostDraft => ({
  message: '',
  mediaAssets: [],
  isValid: false,
  characterCount: 0,
  estimatedFee: undefined,
});

export const usePostCreationStore = create<PostCreationStore>((set, get) => ({
  // Initial state
  draft: createInitialDraft(),
  uploadProgress: [],
  isPosting: false,
  error: null,

  // Update message with validation
  updateMessage: (message: string) => {
    const characterCount = message.length;
    const isValid = characterCount > 0 && characterCount <= MAX_MESSAGE_LENGTH;

    set(state => ({
      draft: {
        ...state.draft,
        message,
        characterCount,
        isValid:
          isValid &&
          (state.draft.mediaAssets.length > 0 || message.trim().length > 0),
      },
    }));
  },

  // Add media asset
  addMediaAsset: (asset: MediaAsset) => {
    set(state => {
      if (state.draft.mediaAssets.length >= MAX_MEDIA_COUNT) {
        return {
          ...state,
          error: `Maximum ${MAX_MEDIA_COUNT} media files allowed`,
        };
      }

      const newMediaAssets = [...state.draft.mediaAssets, asset];
      return {
        draft: {
          ...state.draft,
          mediaAssets: newMediaAssets,
          isValid: get().validateDraft(),
        },
        error: null,
      };
    });
  },

  // Remove media asset
  removeMediaAsset: (assetId: string) => {
    set(state => ({
      draft: {
        ...state.draft,
        mediaAssets: state.draft.mediaAssets.filter(
          asset => asset.id !== assetId,
        ),
      },
      uploadProgress: state.uploadProgress.filter(
        progress => progress.assetId !== assetId,
      ),
    }));
  },

  // Reorder media assets
  reorderMediaAssets: (fromIndex: number, toIndex: number) => {
    set(state => {
      const newMediaAssets = [...state.draft.mediaAssets];
      const [removed] = newMediaAssets.splice(fromIndex, 1);
      newMediaAssets.splice(toIndex, 0, removed);

      return {
        draft: {
          ...state.draft,
          mediaAssets: newMediaAssets,
        },
      };
    });
  },

  // Clear draft
  clearDraft: () => {
    set({
      draft: createInitialDraft(),
      uploadProgress: [],
      error: null,
    });
  },

  // Set quoted post ID
  setQuotedPostId: (postId: string | undefined) => {
    set(state => ({
      draft: {
        ...state.draft,
        quotedPostId: postId,
      },
    }));
  },

  // Upload media to storage
  uploadMedia: async (asset: MediaAsset) => {
    try {
      // Initialize upload progress
      set(state => ({
        uploadProgress: [
          ...state.uploadProgress.filter(p => p.assetId !== asset.id),
          {assetId: asset.id, progress: 0, uploading: true},
        ],
      }));

      // Upload with progress tracking
      const uploadedUrl = await mediaService.uploadMedia(asset, progress => {
        get().updateUploadProgress(asset.id, progress);
      });

      // Mark upload complete
      set(state => ({
        uploadProgress: state.uploadProgress.filter(
          p => p.assetId !== asset.id,
        ),
      }));

      return uploadedUrl;
    } catch (error) {
      console.error('Media upload failed:', error);
      get().setUploadError(asset.id, 'Upload failed. Please try again.');
      throw error;
    }
  },

  // Update upload progress
  updateUploadProgress: (assetId: string, progress: number) => {
    set(state => ({
      uploadProgress: state.uploadProgress.map(p =>
        p.assetId === assetId ? {...p, progress} : p,
      ),
    }));
  },

  // Set upload error
  setUploadError: (assetId: string, error: string) => {
    set(state => ({
      uploadProgress: state.uploadProgress.map(p =>
        p.assetId === assetId ? {...p, uploading: false, error} : p,
      ),
    }));
  },

  // Submit post to blockchain using the new blockchain transaction service
  submitPost: async () => {
    const {draft} = get();

    if (!get().validateDraft()) {
      throw new Error('Invalid post content');
    }

    // Check if wallet is connected
    const walletStore = useWalletStore.getState();
    if (!walletStore.connected || !walletStore.publicKey) {
      throw new Error('Wallet not connected');
    }

    set({isPosting: true, error: null});

    try {
      console.log('🚀 Starting blockchain post creation...');
      
      // Upload media assets first if any
      const mediaUrls: string[] = [];
      for (const asset of draft.mediaAssets) {
        const uploadedUrl = await get().uploadMedia(asset);
        mediaUrls.push(uploadedUrl);
      }

      // Create post using blockchain transaction service
      const blockchainService = walletStore.blockchainService;
      console.log('🔄 Creating blockchain transaction...');
      const result = await blockchainService.createPost({
        userWallet: walletStore.publicKey.toString(),
        message: draft.message.trim(),
        // TODO: Add media URLs to blockchain transaction when supported
        // mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        // quotedPostId: draft.quotedPostId,
      });

      console.log('✅ Beam post creation successful!');
      console.log(`📝 Transaction signature: ${result.signature}`);
      
      // Note: Backend API caching and blockchain submission are both handled 
      // by the blockchainService.createPost() call above via submitSignedTransaction()
      // No additional API calls needed in Beam mode

      // Clear draft on successful post
      get().clearDraft();
      
    } catch (error) {
      console.error('❌ Create post transaction failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create post. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Wallet not connected')) {
          errorMessage = 'Please connect your wallet to create a post.';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient SOL balance for transaction fees.';
        } else if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Transaction timed out. Please try again.';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('already exists')) {
          errorMessage = 'User profile already exists.';
        }
      }
      
      set({error: errorMessage});
      throw error;
    } finally {
      set({isPosting: false});
    }
  },

  // Estimate posting fee using blockchain transaction service
  estimatePostingFee: async () => {
    try {
      const walletStore = useWalletStore.getState();
      
      // If wallet not connected, provide default estimate
      if (!walletStore.connected || !walletStore.publicKey) {
        const defaultFee = 0.001;
        set(state => ({
          draft: {
            ...state.draft,
            estimatedFee: defaultFee,
          },
        }));
        return defaultFee;
      }

      // Get real fee estimate from blockchain service
      const blockchainService = walletStore.blockchainService;
      const fee = await blockchainService.estimatePostFee({
        userWallet: walletStore.publicKey.toString(),
        message: get().draft.message || 'Sample message',
      });

      // Convert lamports to SOL if needed
      const feeInSol = fee > 1 ? fee / 1_000_000_000 : fee;

      set(state => ({
        draft: {
          ...state.draft,
          estimatedFee: feeInSol,
        },
      }));

      return feeInSol;
    } catch (error) {
      console.error('Fee estimation failed:', error);
      const defaultFee = 0.001;
      
      set(state => ({
        draft: {
          ...state.draft,
          estimatedFee: defaultFee,
        },
      }));
      
      return defaultFee;
    }
  },

  // Validate draft
  validateDraft: () => {
    const {draft} = get();
    return (
      draft.characterCount >= 0 &&
      draft.characterCount <= MAX_MESSAGE_LENGTH &&
      (draft.message.trim().length > 0 || draft.mediaAssets.length > 0)
    );
  },

  // UI state setters
  setPosting: (posting: boolean) => set({isPosting: posting}),
  setError: (error: string | null) => set({error}),
}));
