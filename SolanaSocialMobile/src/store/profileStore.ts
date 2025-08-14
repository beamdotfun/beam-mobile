import {create} from 'zustand';
import {
  UserProfile,
  UserActivity,
  ProfileEditData,
  SocialStats,
} from '../types/profile';
import {Post} from '../types/social';
import {socialAPI} from '../services/api/social';
import {useWalletStore} from './wallet';
import {useAuthStore} from './auth';

interface ProfileState {
  // Current profile data
  currentProfile: UserProfile | null;
  userPosts: Post[];
  userActivity: UserActivity[];
  socialStats: SocialStats | null;

  // UI state
  loading: boolean;
  postsLoading: boolean;
  activityLoading: boolean;
  error: string | null;
  
  // Load tracking to prevent duplicates
  lastLoadedWallet: string | null;
  lastLoadTime: number;
  loadInProgress: boolean;

  // Pagination
  postsPage: number;
  postsHasMore: boolean;
  activityPage: number;
  activityHasMore: boolean;

  // Actions
  loadProfile: (walletAddress?: string, profileVisitFrom?: string) => Promise<void>;
  loadUserPosts: (walletAddress: string, refresh?: boolean) => Promise<void>;
  loadUserActivity: (walletAddress: string, refresh?: boolean) => Promise<void>;
  followUser: (walletAddress: string) => Promise<void>;
  unfollowUser: (walletAddress: string) => Promise<void>;
  updateProfile: (data: ProfileEditData) => Promise<void>;
  uploadProfilePicture: (file: any) => Promise<string>;
  refreshProfile: () => Promise<void>;

  // Verification
  verifyNFT: (mintAddress: string) => Promise<void>;
  verifySNS: (domain: string) => Promise<void>;

  // Helpers
  clearProfile: () => void;
  clearForNavigation: () => void;
  updateCurrentProfile: (updates: Partial<UserProfile>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  // Initial state
  currentProfile: null,
  userPosts: [],
  userActivity: [],
  socialStats: null,
  loading: false,
  postsLoading: false,
  activityLoading: false,
  error: null,
  lastLoadedWallet: null,
  lastLoadTime: 0,
  loadInProgress: false,
  postsPage: 1,
  postsHasMore: true,
  activityPage: 1,
  activityHasMore: true,

  // Load user profile - wallet-based only (userId endpoint not available)
  loadProfile: async (walletAddress?: string, profileVisitFrom?: string) => {
    console.log('🔍 ProfileStore.loadProfile: Starting with walletAddress:', walletAddress, 'profileVisitFrom:', profileVisitFrom);
    
    const currentState = get();
    const now = Date.now();
    
    // Prevent duplicate loads of the same profile within 500ms
    if (currentState.loadInProgress) {
      console.log('⚠️ ProfileStore.loadProfile: Load already in progress, skipping');
      return;
    }
    
    // Check if we just loaded this exact wallet recently
    if (walletAddress && 
        walletAddress === currentState.lastLoadedWallet && 
        (now - currentState.lastLoadTime) < 500) {
      console.log('⚠️ ProfileStore.loadProfile: Same wallet loaded recently, skipping duplicate');
      return;
    }
    
    // Check if we're switching to a different user profile
    const currentProfileWallet = currentState.currentProfile?.userWallet;
    const isSwitchingUsers = walletAddress && currentProfileWallet && currentProfileWallet !== walletAddress;
    
    console.log('🔍 ProfileStore.loadProfile: User switching check:', {
      currentProfileWallet,
      requestedWallet: walletAddress,
      isSwitchingUsers
    });
    
    // ALWAYS clear data immediately when switching users to prevent flash
    if (isSwitchingUsers) {
      console.log('🔍 ProfileStore.loadProfile: Switching users - clearing all profile data IMMEDIATELY');
      // Clear immediately to prevent showing old data
      set({
        currentProfile: null,
        userPosts: [],
        userActivity: [],
        socialStats: null,
        postsPage: 1,
        postsHasMore: true,
        activityPage: 1,
        activityHasMore: true,
        error: null,
        loading: true, // Set loading immediately
      });
    }
    
    // Only set loading if we haven't already set it during user switch
    if (!isSwitchingUsers) {
      set({loading: true, error: null, loadInProgress: true});
    } else {
      // Just mark load in progress since loading is already true
      set({loadInProgress: true});
    }

    try {
      // Check if this is the current user's own profile
      const {user} = useAuthStore.getState();
      const userWalletAddress = user?.primary_wallet_address || user?.primaryWalletAddress || user?.walletAddress;
      const isOwnProfile = !walletAddress || (walletAddress === userWalletAddress);
      
      console.log('🔍 ProfileStore.loadProfile: isOwnProfile check:', {
        walletAddress,
        userWalletAddress,
        isOwnProfile
      });

      console.log('🔍 ProfileStore.loadProfile: Making API calls...');
      console.log('🔍 ProfileStore.loadProfile: Using endpoint:', isOwnProfile ? 'getAuthenticatedUserProfile' : 'getUserProfile');
      
      // Safety check: Don't call getUserProfile without a wallet address
      if (!isOwnProfile && !walletAddress) {
        console.error('🚨 ProfileStore.loadProfile: Cannot load other user profile without wallet address');
        set({loading: false, error: 'No wallet address provided', loadInProgress: false});
        return;
      }
      
      // Load profile data (required)
      const profileResponse = await (isOwnProfile ? 
        socialAPI.getAuthenticatedUserProfile() : 
        socialAPI.getUserProfile(walletAddress!, profileVisitFrom) // Pass profileVisitFrom for tracking
      );
      
      // Create stats from profile response data (no need for separate API call)
      let stats: any = null;
      if (profileResponse) {
        stats = {
          posts: profileResponse.postCount || profileResponse.post_count || 0,
          followers: profileResponse.followerCount || 0,
          following: profileResponse.followingCount || 0,
          reputation: profileResponse.reputation || 0,
          tipsSent: profileResponse.tipsSentCount || 0,
          tipsReceived: profileResponse.tipsReceivedCount || 0,
          totalTipVolume: 0, // Not available in current API
        };
      }
      
      console.log('🔍 ProfileStore.loadProfile: API calls completed');
      console.log('  - profile:', profileResponse ? 'received' : 'null');
      console.log('  - stats:', stats ? 'received' : 'null');
      
      // DETAILED LOGGING: Log the actual API response structure
      console.log('🔍 ProfileStore.loadProfile: RAW profileResponse:', JSON.stringify(profileResponse, null, 2));
      console.log('🔍 ProfileStore.loadProfile: RAW stats:', JSON.stringify(stats, null, 2));

      // Transform the new API response to match our UserProfile interface
      let userProfile: UserProfile | null = null;
      
      if (profileResponse) {
        userProfile = {
          // Core identity - Map from actual API response
          userWallet: profileResponse.walletAddress || profileResponse.primaryWalletAddress || profileResponse.wallet_address,
          displayName: profileResponse.displayName,
          description: profileResponse.description || profileResponse.bio || '',
          profilePicture: profileResponse.profileImageUrl || profileResponse.profileImageURL || profileResponse.profilePicture || profileResponse.profile_image_url,
          bannerImage: undefined, // Not in new API
          location: profileResponse.location,
          website: profileResponse.website,
          timefun: profileResponse.timefun,
          joinedAt: profileResponse.dateJoined || profileResponse.joinedDate || profileResponse.date_joined || new Date().toISOString(),
          
          // Linked wallets and badges - Map from new API  
          linkedWallets: profileResponse.linkedWallets || [],
          badges: profileResponse.badges || profileResponse.badgesEnabled ? [] : [],
          
          // Verification status - Map from new API
          nftVerified: profileResponse.isProfileVerified || profileResponse.is_profile_verified || false,
          nftMint: undefined, // Not in new API
          snsVerified: profileResponse.isUsernameVerified || profileResponse.is_username_verified || false,
          snsDomain: profileResponse.username,
          isVerifiedCreator: profileResponse.isVerified || false,
          
          // Social metrics - Map from new API
          postCount: profileResponse.postCount || profileResponse.post_count || 0,
          followerCount: profileResponse.followerCount || 0,
          followingCount: profileResponse.followingCount || 0,
          onChainReputation: profileResponse.reputation || 0,
          reputation: profileResponse.reputation || 0,
          totalReputation: profileResponse.totalReputation || profileResponse.reputation || 0,
          gainThisEpoch: profileResponse.gainThisEpoch || profileResponse.scoreThisEpoch || 0,
          scoreThisEpoch: profileResponse.scoreThisEpoch || profileResponse.gainThisEpoch || 0,
          upvotesReceived: profileResponse.upvotesReceived || 0,
          downvotesReceived: profileResponse.downvotesReceived || 0,
          epochStreak: profileResponse.streak || profileResponse.postsThisEpoch || 0,
          
          // Tip statistics - Map from new API
          tipsSentCount: profileResponse.tipsSentCount || 0,
          tipsSentTotal: 0, // Not available in API
          tipsReceivedCount: profileResponse.tipsReceivedCount || 0,
          tipsReceivedTotal: 0, // Not available in API
          
          // Activity tracking
          lastActiveSlot: 0, // Not in new API
          isActive: true,
          
          // Privacy settings - Not in new API
          isPrivate: false,
          allowDirectMessages: true,
          showActivity: true,
          repFilter: undefined,
          mutedUsers: [],
          mutedWords: [],
          
          // Brand/Business - Map from new API
          brandAddress: profileResponse.isBrand ? profileResponse.walletAddress : undefined,
          brandName: profileResponse.brandName || (profileResponse.isBrand ? profileResponse.displayName : undefined),
          
          // Settings - Get from API response
          connectionMethod: profileResponse.connectionMethod,
          explorer: profileResponse.explorer,
          showBadgesOnProfile: profileResponse.badgesEnabled ?? true,
        };
      }

      set({
        currentProfile: userProfile,
        socialStats: stats,
        loading: false,
        loadInProgress: false,
        lastLoadedWallet: walletAddress || null,
        lastLoadTime: Date.now(),
      });
      
      console.log('🔍 ProfileStore.loadProfile: Profile loaded successfully');
    } catch (error) {
      console.error('🚨 ProfileStore.loadProfile: Failed to load profile:', error);
      console.error('🚨 ProfileStore.loadProfile: Error details:', {
        message: error.message,
        stack: error.stack,
        walletAddress,
      });
      set({
        loading: false,
        loadInProgress: false,
        error: 'Failed to load profile. Please try again.',
      });
    }
  },

  // Load user posts
  loadUserPosts: async (walletAddress: string | null, refresh = false) => {
    // Safety check: Don't proceed without a wallet address
    if (!walletAddress) {
      console.error('🚨 ProfileStore.loadUserPosts: No wallet address provided');
      set({postsLoading: false});
      return;
    }
    
    console.log('🔍 ProfileStore.loadUserPosts: Starting for walletAddress:', walletAddress, 'refresh:', refresh);
    
    // Check if we're switching to a different user - if so, clear posts and force refresh
    const currentProfileWallet = get().currentProfile?.userWallet;
    const isSwitchingUsers = currentProfileWallet && currentProfileWallet !== walletAddress;
    
    console.log('🔍 ProfileStore.loadUserPosts: User switching check:', {
      currentProfileWallet,
      requestedWallet: walletAddress,
      isSwitchingUsers,
      forceRefresh: isSwitchingUsers || refresh
    });
    
    if (isSwitchingUsers) {
      console.log('🔍 ProfileStore.loadUserPosts: Switching users - clearing posts and forcing refresh');
      set({
        userPosts: [],
        postsPage: 1,
        postsHasMore: true,
      });
      refresh = true; // Force refresh when switching users
    }
    
    const {postsLoading, postsHasMore} = get();
    if (postsLoading || (!refresh && !postsHasMore)) {
      console.log('🔍 ProfileStore.loadUserPosts: Skipping - postsLoading:', postsLoading, 'postsHasMore:', postsHasMore);
      return;
    }

    console.log('🔍 ProfileStore.loadUserPosts: Setting postsLoading to true');
    set({
      postsLoading: true,
      ...(refresh && {postsPage: 1, postsHasMore: true}),
    });

    try {
      console.log('🔍 ProfileStore.loadUserPosts: Making API call with params:', {
        walletAddress,
        limit: 20,
        page: refresh ? 0 : (get().postsPage - 1)
      });
      
      const response = await socialAPI.getUserPosts(
        walletAddress,
        20,
        refresh ? 0 : (get().postsPage - 1), // Use 0-based page number, not offset
      );

      console.log('🔍 ProfileStore.loadUserPosts: ===== FULL API RESPONSE STRUCTURE =====');
      console.log('🔍 ProfileStore.loadUserPosts: RAW API response:', JSON.stringify(response, null, 2));
      console.log('🔍 ProfileStore.loadUserPosts: Response top-level keys:', Object.keys(response || {}));
      
      if (response?.posts) {
        console.log('🔍 ProfileStore.loadUserPosts: Posts array length:', response.posts.length);
        response.posts.forEach((post, index) => {
          console.log(`🔍 ProfileStore.loadUserPosts: Post ${index} structure:`, {
            id: post.id,
            hasUser: !!post.user,
            userType: typeof post.user,
            userKeys: post.user ? Object.keys(post.user) : 'no user',
            hasUserInfo: !!post.userInfo,
            userInfoType: typeof post.userInfo,
            userInfoKeys: post.userInfo ? Object.keys(post.userInfo) : 'no userInfo'
          });
        });
      }
      console.log('🔍 ProfileStore.loadUserPosts: response exists:', !!response);
      console.log('🔍 ProfileStore.loadUserPosts: response type:', typeof response);
      console.log('🔍 ProfileStore.loadUserPosts: response keys:', response ? Object.keys(response) : 'no response');

      // The posts API returns data directly in the response, not wrapped in response.data
      let postsArray = [];
      let pagination = {};
      
      if (Array.isArray(response)) {
        // Posts returned directly as array
        console.log('🔍 ProfileStore.loadUserPosts: Posts returned as direct array');
        postsArray = response;
      } else if (response?.posts && Array.isArray(response.posts)) {
        // Posts returned in response.posts (this is the actual structure)
        console.log('🔍 ProfileStore.loadUserPosts: Posts returned in response.posts');
        postsArray = response.posts;
        pagination = response.pagination || {};
      } else if (response?.data?.posts && Array.isArray(response.data.posts)) {
        // Posts returned in response.data.posts 
        console.log('🔍 ProfileStore.loadUserPosts: Posts returned in response.data.posts');
        postsArray = response.data.posts;
        pagination = response.data.pagination || {};
      } else {
        console.error('🚨 ProfileStore.loadUserPosts: Unexpected response structure!');
        console.error('🚨 Full response:', JSON.stringify(response, null, 2));
        postsArray = [];
      }
      
      console.log('🔍 ProfileStore.loadUserPosts: Extracted postsArray length:', postsArray.length);
      console.log('🔍 ProfileStore.loadUserPosts: Extracted pagination:', pagination);
      
      // Handle empty posts case
      if (postsArray.length === 0) {
        console.log('🔍 ProfileStore.loadUserPosts: No posts found - setting empty array with no error');
        set({
          userPosts: refresh ? [] : get().userPosts, // Keep existing posts if not refreshing
          postsLoading: false,
          postsHasMore: false,
          error: null, // Clear any previous errors
        });
        return;
      }

      // Transform API posts to social posts format
      const transformedPosts = postsArray.map((apiPost, index) => {
        console.log(`🔍 ProfileStore.loadUserPosts: Transforming post ${index}:`, JSON.stringify(apiPost, null, 2));
        
        try {
          return {
        id: apiPost.postSignature || apiPost.signature || apiPost.transactionHash || `${apiPost.postUser || 'unknown'}-${apiPost.postSlot}`,
        userWallet: apiPost.postUser || apiPost.userWallet,
        transactionHash: apiPost.postSignature || apiPost.signature,
        signature: apiPost.postSignature || apiPost.signature,
        message: apiPost.postMessage || apiPost.message,
        mediaUrls: apiPost.images ? [apiPost.images] : (apiPost.video ? [apiPost.video] : []),
        voteScore: 0,
        upvoteCount: 0,
        downvoteCount: 0,
        replyCount: 0,
        tipCount: 0,
        totalTipAmount: 0,
        isPinned: apiPost.isPinned || false,
        createdAt: apiPost.processedAt || apiPost.createdAt,
        updatedAt: apiPost.updatedAt || apiPost.processedAt || apiPost.createdAt,
        epoch: apiPost.postEpoch || apiPost.epoch,
        slot: apiPost.postSlot || apiPost.slot,
        isHidden: apiPost.postIsHidden || apiPost.isHidden,
        isThread: apiPost.postIsThread || apiPost.isThread,
        quotedPost: apiPost.postQuotedPost || apiPost.quotedPost,
        quotedPostData: apiPost.quotedPostData, // New enriched quoted post data
        taggedUsers: apiPost.taggedUsers || [],
        user: {
          // Use direct fields from the new API response
          walletAddress: apiPost.postUser || apiPost.userWallet,
          wallet_address: apiPost.postUser || apiPost.userWallet, // For PostCard compatibility
          display_name: apiPost.displayName, // Backend-formatted display name
          username: apiPost.userSnsDomain || '',
          avatar_url: apiPost.userProfileImageUri || '',
          reputation_score: apiPost.userReputation || 0,
          // Legacy fields for compatibility
          name: apiPost.displayName || (apiPost.postUser ? `${apiPost.postUser.slice(0, 4)}...${apiPost.postUser.slice(-4)}` : 'Unknown'),
          profilePicture: apiPost.userProfileImageUri || '',
          isVerified: apiPost.userIsVerifiedNft || apiPost.userIsVerifiedSns || false,
          onChainReputation: apiPost.userReputation || 0,
          brandAddress: apiPost.userIsBrand ? apiPost.userBrandAddress : undefined,
          // Brand fields
          is_brand: apiPost.userIsBrand || false,
          brand_name: apiPost.brandName,
          brand_logo_url: apiPost.brandLogoUrl,
          brand_reputation: apiPost.brandReputation,
          brand_is_verified: apiPost.brandIsVerified,
        },
        userVote: null,
        userTipped: false,
      };
        } catch (error) {
          console.error(`🚨 ProfileStore.loadUserPosts: Error transforming post ${index}:`, error);
          console.error(`🚨 ProfileStore.loadUserPosts: Problematic post data:`, JSON.stringify(apiPost, null, 2));
          
          // Return a minimal post object to prevent complete failure
          return {
            id: `error-${index}-${Date.now()}`,
            userWallet: 'unknown',
            transactionHash: '',
            signature: '',
            message: '[Error loading post]',
            mediaUrls: [],
            voteScore: 0,
            upvoteCount: 0,
            downvoteCount: 0,
            replyCount: 0,
            tipCount: 0,
            totalTipAmount: 0,
            isPinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            epoch: 0,
            slot: 0,
            isHidden: false,
            isThread: false,
            quotedPost: undefined,
            taggedUsers: [],
            user: {
              walletAddress: 'unknown',
              wallet_address: 'unknown',
              display_name: 'Error',
              username: '',
              avatar_url: '',
              reputation_score: 0,
              name: 'Error Loading User',
              profilePicture: '',
              isVerified: false,
              onChainReputation: 0,
            },
            userVote: null,
            userTipped: false,
          };
        }
      });

      const newPosts = refresh
        ? transformedPosts
        : [...get().userPosts, ...transformedPosts];

      set({
        userPosts: newPosts,
        postsLoading: false,
        postsHasMore: (pagination as any).page < (pagination as any).total_pages,
        postsPage: refresh ? 2 : get().postsPage + 1,
      });
    } catch (error: any) {
      console.error('🚨 ProfileStore.loadUserPosts: Failed to load user posts:', error);
      console.error('🚨 ProfileStore.loadUserPosts: Error message:', error?.message);
      console.error('🚨 ProfileStore.loadUserPosts: Error details:', {
        walletAddress,
        refresh,
        postsPage: get().postsPage
      });
      
      // Enhanced error handling to prevent crashes
      let errorMessage = 'Unable to load posts. Please try again.';
      
      if (error?.message?.includes('timeout')) {
        errorMessage = 'Loading posts is taking too long. Please try again.';
      } else if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        console.log('🔍 ProfileStore.loadUserPosts: User has no posts yet (404) - setting empty array');
        set({
          userPosts: [],
          postsLoading: false,
          postsHasMore: false,
          error: null, // Clear error for empty posts case
        });
        return; // Early return for 404 case
      } else if (error?.message?.includes('OutOfMemoryError') || error?.message?.includes('memory')) {
        errorMessage = 'Not enough memory to load posts. Please close other apps and try again.';
        // Force garbage collection if possible
        if (global.gc) {
          console.log('🚨 ProfileStore: Forcing garbage collection due to memory error');
          global.gc();
        }
      }
      
      set({
        postsLoading: false,
        error: errorMessage,
      });
    }
  },

  // Load user activity
  loadUserActivity: async (walletAddress: string, refresh = false) => {
    const {activityLoading, activityHasMore} = get();
    if (activityLoading || (!refresh && !activityHasMore)) {
      return;
    }

    set({
      activityLoading: true,
      ...(refresh && {activityPage: 1, activityHasMore: true}),
    });

    try {
      const response = await socialAPI.getUserActivity(walletAddress, {
        page: refresh ? 1 : get().activityPage,
        limit: 20,
      });

      const newActivity = refresh
        ? response.activities
        : [...get().userActivity, ...response.activities];

      set({
        userActivity: newActivity,
        activityLoading: false,
        activityHasMore: response.hasMore,
        activityPage: refresh ? 2 : get().activityPage + 1,
      });
    } catch (error) {
      console.error('Failed to load user activity:', error);
      set({
        activityLoading: false,
        error: 'Failed to load activity.',
      });
    }
  },

  // Follow user
  followUser: async (walletAddress: string) => {
    try {
      await socialAPI.followUser(walletAddress);

      // Update profile optimistically
      set(state => ({
        currentProfile: state.currentProfile
          ? {
              ...state.currentProfile,
              isFollowing: true,
              followerCount: state.currentProfile.followerCount + 1,
            }
          : null,
      }));
    } catch (error) {
      console.error('Failed to follow user:', error);
      throw error;
    }
  },

  // Unfollow user
  unfollowUser: async (walletAddress: string) => {
    try {
      await socialAPI.unfollowUser(walletAddress);

      // Update profile optimistically
      set(state => ({
        currentProfile: state.currentProfile
          ? {
              ...state.currentProfile,
              isFollowing: false,
              followerCount: Math.max(
                0,
                state.currentProfile.followerCount - 1,
              ),
            }
          : null,
      }));
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      throw error;
    }
  },

  // Update profile - updated to handle new API response
  updateProfile: async (data: ProfileEditData) => {
    try {
      const response = await socialAPI.updateProfile(data);

      // Handle the new API response structure
      const updatedData = response.userData || response;
      
      set(state => ({
        currentProfile: state.currentProfile
          ? {
              ...state.currentProfile,
              // Update fields from the API response
              displayName: updatedData.displayName,
              description: updatedData.description || updatedData.bio,
              profilePicture: updatedData.profilePicture,
              bannerImage: updatedData.bannerImage,
              location: updatedData.location,
              website: updatedData.website,
              timefun: updatedData.timefun,
              linkedWallets: updatedData.linkedWallets,
              badges: updatedData.badges,
              // Privacy and filtering
              isPrivate: updatedData.isPrivate ?? state.currentProfile.isPrivate,
              repFilter: updatedData.repFilter,
              mutedUsers: updatedData.mutedUsers,
              mutedWords: updatedData.mutedWords,
              // Legacy fields
              allowDirectMessages: data.allowDirectMessages ?? state.currentProfile.allowDirectMessages,
              showActivity: data.showActivity ?? state.currentProfile.showActivity,
              // Solana settings
              explorer: data.explorer ?? updatedData.explorer ?? state.currentProfile.explorer,
              connectionMethod: data.connectionMethod ?? updatedData.connectionMethod ?? state.currentProfile.connectionMethod,
            }
          : null,
      }));
      
      // Also update auth store user data with Solana settings
      const authStore = useAuthStore.getState();
      if (authStore.user && (data.explorer || data.connectionMethod)) {
        // Update the user object directly in the auth store state
        useAuthStore.setState(state => ({
          user: state.user ? {
            ...state.user,
            explorer: data.explorer ?? state.user.explorer,
            connectionMethod: data.connectionMethod ?? state.user.connectionMethod,
          } : null
        }));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  // Upload profile picture
  uploadProfilePicture: async (file: any) => {
    try {
      console.log('🖼️ ProfileStore: Starting upload with file:', {
        uri: file.uri,
        type: file.type,
        fileName: file.fileName,
      });
      
      const result = await socialAPI.uploadProfilePicture(file);
      
      console.log('🖼️ ProfileStore: Upload result:', result);
      
      // Update the current profile with the new profile picture URL
      if (result && result.profilePicture) {
        set(state => ({
          currentProfile: state.currentProfile
            ? {
                ...state.currentProfile,
                profilePicture: result.profilePicture,
              }
            : null,
        }));
        
        // Also update auth store user data
        const {updateUser} = useAuthStore.getState();
        if (updateUser) {
          updateUser({profilePicture: result.profilePicture});
        }
        
        console.log('🖼️ ProfileStore: Profile picture updated successfully');
        return result.profilePicture;
      } else {
        console.error('🖼️ ProfileStore: No profilePicture in result:', result);
        throw new Error('Upload succeeded but no image URL returned');
      }
    } catch (error: any) {
      console.error('🖼️ ProfileStore: Upload failed:', error);
      console.error('🖼️ ProfileStore: Error details:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  // Refresh current profile
  refreshProfile: async () => {
    const {currentProfile} = get();
    if (currentProfile) {
      await get().loadProfile(currentProfile.userWallet);
    }
  },

  // Verify NFT ownership
  verifyNFT: async (mintAddress: string) => {
    try {
      const verificationResult = await socialAPI.verifyNFT(mintAddress);

      if (verificationResult.success) {
        // Reload profile to get updated verification status
        const currentProfile = get().currentProfile;
        if (currentProfile) {
          await get().loadProfile(currentProfile.userWallet);
        }
      }
    } catch (error) {
      console.error('NFT verification failed:', error);
      throw error;
    }
  },

  // Verify SNS domain
  verifySNS: async (domain: string) => {
    try {
      const verificationResult = await socialAPI.verifySNS(domain);

      if (verificationResult.success) {
        // Reload profile to get updated verification status
        const currentProfile = get().currentProfile;
        if (currentProfile) {
          await get().loadProfile(currentProfile.userWallet);
        }
      }
    } catch (error) {
      console.error('SNS verification failed:', error);
      throw error;
    }
  },

  // Helpers
  clearProfile: () => {
    set({
      currentProfile: null,
      userPosts: [],
      userActivity: [],
      socialStats: null,
      postsPage: 1,
      postsHasMore: true,
      activityPage: 1,
      activityHasMore: true,
      error: null,
    });
  },

  // Clear profile for navigation - sets loading state immediately
  clearForNavigation: () => {
    console.log('🧹 ProfileStore.clearForNavigation: Clearing profile for navigation');
    set({
      currentProfile: null,
      userPosts: [],
      userActivity: [],
      socialStats: null,
      postsPage: 1,
      postsHasMore: true,
      activityPage: 1,
      activityHasMore: true,
      error: null,
      loading: true, // Show loading immediately to prevent flash
      loadInProgress: false, // Reset load progress to allow new loads
      lastLoadedWallet: null, // Clear last loaded to force reload
      lastLoadTime: 0,
    });
  },

  // Update current profile with partial data
  updateCurrentProfile: (updates: Partial<UserProfile>) => {
    set(state => ({
      currentProfile: state.currentProfile
        ? { ...state.currentProfile, ...updates }
        : null,
    }));
  },

  setLoading: (loading: boolean) => set({loading}),
  setError: (error: string | null) => set({error}),
}));
