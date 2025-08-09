import React, {useState, useEffect, useRef} from 'react';
import {View, Text, Pressable, Modal, StyleSheet, Dimensions, ScrollView, SafeAreaView, Clipboard, Linking} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import {formatDistanceToNow} from 'date-fns';
import {
  Quote,
  ChevronRight,
  MoreHorizontal,
  Zap,
  Flashlight,
  Pin,
  Bookmark,
  BookmarkCheck,
  MessageCircle,
  Repeat2,
  Play,
  Link2,
  X,
  ChevronLeft,
  Share,
  ExternalLink,
} from 'lucide-react-native';
import {Avatar} from '../ui/avatar';
import {SimpleCommentsSection} from './SimpleCommentsSection';
import {useThemeStore} from '../../store/themeStore';
import {useSocialAdvancedStore} from '../../store/socialAdvancedStore';
import {useReceiptsStore} from '../../store/receiptsStore';
import {useAuthStore} from '../../store/auth';
import {AnimatedScore} from '../ui/AnimatedScore';
import {Post} from '../../types/social';
import {TipUserButton} from './TipUserButton';
import {Toast} from '../ui/Toast';
import {getUserProfilePicture} from '../../utils/profileUtils';
import {socialAPI} from '../../services/api/social';

const {width: screenWidth} = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onUserPress?: (userId: number | undefined | null, walletAddress: string, postSignature?: string) => void; // Added postSignature for tracking
  onHashtagPress?: (hashtag: string) => void;
  onQuotePress?: (post: Post) => void;
  onThreadPress?: (post: Post) => void;
  onQuotedPostPress?: (quotedPost: any) => void;
  showFullComments?: boolean;
  hideExpandButton?: boolean; // Hide the chevron right expand button
  showThreadPill?: boolean; // Show blue "thread" pill above message
  feedContext?: 'trending' | 'controversial' | 'default'; // Context for showing different pills
}

export function PostCard({
  post,
  onPress,
  onUserPress,
  onHashtagPress,
  onQuotePress,
  onThreadPress,
  onQuotedPostPress,
  showFullComments = false,
  hideExpandButton = false,
  showThreadPill = false,
  feedContext = 'default',
}: PostCardProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const navigation = useNavigation();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [commentCount, setCommentCount] = useState(post.replyCount || 0);
  const [toastMessage, setToastMessage] = useState('');
  
  // Video player states
  const [isVideoPlaying, setIsVideoPlaying] = useState(false); // Don't autoplay to save memory
  const [isVideoMuted, setIsVideoMuted] = useState(true); // Muted by default for autoplay
  const [showVideoControls, setShowVideoControls] = useState(false);
  const videoRef = useRef<any>(null);
  
  // Cleanup video on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        // Stop and cleanup video
        setIsVideoPlaying(false);
        videoRef.current = null;
      }
    };
  }, []);
  const [toastType, setToastType] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('info');
  const [showToast, setShowToast] = useState(false);
  const [resolvedMentions, setResolvedMentions] = useState<Map<string, any>>(new Map());
  
  const {sharePost, comments} = useSocialAdvancedStore();
  const {addReceipt, removeReceipt, isPostReceipted, checkReceiptStatus} = useReceiptsStore();

  // Resolve mentions when the post loads for better performance
  useEffect(() => {
    let isCancelled = false;
    
    const resolveMentionsInPost = async () => {
      if (!post.message) return;
      
      // Extract mentions from post content
      const mentionMatches = post.message.match(/@[\w.]+/g);
      if (!mentionMatches || mentionMatches.length === 0) return;
      
      try {
        const uniqueMentions = [...new Set(mentionMatches.map(m => m.slice(1)))]; // Remove @ symbol
        const resolution = await socialAPI.resolveMentions(uniqueMentions);
        
        if (!isCancelled) {
          const mentionMap = new Map();
          resolution.resolvedMentions.forEach(resolved => {
            mentionMap.set(resolved.originalMention, resolved);
          });
          
          setResolvedMentions(mentionMap);
          console.log('🔗 PostCard: Pre-resolved mentions for post:', post.id, 'count:', mentionMap.size);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('❌ PostCard: Error pre-resolving mentions:', error);
        }
      }
    };

    resolveMentionsInPost();
    
    return () => {
      isCancelled = true;
    };
  }, [post.message, post.id]);
  
  // Get post signature for receipts with validation
  const getValidPostSignature = () => {
    const transactionHash = post.transaction_hash || post.transactionHash;
    const signature = post.signature;
    const id = post.id?.toString();
    
    // Validate that we have a proper blockchain signature (should be ~88 characters, base58)
    const isValidSignature = (sig: string) => {
      return sig && typeof sig === 'string' && sig.length > 50 && !sig.match(/^[0-9]+$/);
    };

    if (isValidSignature(transactionHash)) {
      return transactionHash;
    }
    
    if (isValidSignature(signature)) {
      return signature;
    }
    return null; // Don't use ID as signature - it's not a blockchain signature
  };

  const postSignature = getValidPostSignature();
  const [isBookmarked, setIsBookmarked] = useState(postSignature ? isPostReceipted(postSignature) : false);

  // Update bookmark state when receipt status changes in the store
  useEffect(() => {
    if (postSignature) {
      const currentStatus = isPostReceipted(postSignature);
      setIsBookmarked(currentStatus);
    }
  }, [postSignature, isPostReceipted]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Safe date formatting with fallback for invalid dates
  const getFormattedTime = () => {
    // Use processedAt as the primary date field (when the post was processed by backend)
    const dateString = post.processedAt || post.created_at || post.createdAt;
    if (!dateString) {
      return 'Unknown time';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string in PostCard:', dateString);
      return 'Invalid date';
    }
    
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.warn('Error formatting date in PostCard:', error);
      return 'Unknown time';
    }
  };
  
  const formattedTime = getFormattedTime();

  // Get wallet address from user object - use primary field first, fallback to post-level fields only if needed
  const userWallet = post.user?.wallet_address || post.user?.walletAddress || post.userWallet || post.userPubkey || '';
  
  // Brand vs User display logic per FEED_INTEGRATION_GUIDE.md
  // Use direct API fields from processed_posts structure
  const isBrandUser = post.userIsBrand || post.user?.is_brand || false;
  
  // Debug logging for user data mismatch - only log if there's something suspicious
  if (!post.user || !userWallet) {
    console.log('🔍 PostCard USER DATA DEBUG - MISSING DATA:', {
      postId: post.id,
      hasUser: !!post.user,
      userWallet,
      'post.user?.wallet_address': post.user?.wallet_address,
      'post.user?.walletAddress': post.user?.walletAddress,
      'post.userWallet': post.userWallet,
      'post.userPubkey': post.userPubkey,
      displayNameFields: {
        'post.user?.display_name': post.user?.display_name,
        'post.user?.name': post.user?.name,
        'post.user?.brand_name': post.user?.brand_name,
        'post.user?.username': post.user?.username,
        'post.username': post.username,
      },
      isBrandUser,
    });
  }
  
  // Get display name - use displayName from processed_posts structure
  const displayName = post.displayName || 
    post.user?.display_name || post.user?.name || 
    post.user?.username || post.username || 
    (userWallet ? `${userWallet.slice(0, 5)}...${userWallet.slice(-5)}` : 'Unknown');
  
  // Get avatar URL - use userProfileImageUri from processed_posts structure
  const avatarUrl = post.userProfileImageUri || 
    (post.user ? getUserProfilePicture(post.user) : getUserProfilePicture(post));
  
  // Debug logging for profile pictures
  if (!avatarUrl) {
    console.log('🖼️ PostCard: No avatar URL found for post:', {
      postId: post.id,
      hasUser: !!post.user,
      userFields: post.user ? Object.keys(post.user).filter(k => k.toLowerCase().includes('profile') || k.toLowerCase().includes('avatar') || k.toLowerCase().includes('image')) : [],
      postFields: Object.keys(post).filter(k => k.toLowerCase().includes('profile') || k.toLowerCase().includes('avatar') || k.toLowerCase().includes('image')),
      userProfileImageUri: post.userProfileImageUri,
      brandLogoUrl: post.brandLogoUrl
    });
  }
  
  // Get reputation score with brand prioritization
  let reputationScore = isBrandUser && post.brandReputation !== undefined
    ? post.brandReputation 
    : (post.userReputation || post.user?.reputation_score || post.reputation || 0);
  
  // Get verification status with brand prioritization
  const isVerified = isBrandUser 
    ? post.brandIsVerified
    : (post.userIsVerifiedNft || post.userIsVerifiedSns || post.user?.is_verified);
  
  // Debug logging removed - too verbose
  
  
  // Get blockchain data with fallbacks
  const epochNumber = post.epoch || 0;
  const slotNumber = post.slot || 0;

  // Get media arrays
  const images = post.images || post.media_urls || post.mediaUrls || [];
  const hasVideo = !!post.video;
  const hasQuotedPost = !!post.quotedPostData || !!post.quoted_post || !!post.quotedPost;
  
  // DEBUG: Log new backend fields to verify they're being received
  React.useEffect(() => {
    if (post.quotedPostData || post.threadData || post.isThreadRoot) {
      console.log('🔍 PostCard - NEW BACKEND FIELDS DETECTED:', {
        postId: post.id,
        hasQuotedPostData: !!post.quotedPostData,
        hasThreadData: !!post.threadData,
        isThreadRoot: post.isThreadRoot,
        threadPostCount: post.threadPostCount,
        quotedPostDataKeys: post.quotedPostData ? Object.keys(post.quotedPostData) : null,
        threadDataKeys: post.threadData ? Object.keys(post.threadData) : null
      });
    }
  }, [post.quotedPostData, post.threadData, post.isThreadRoot]);
  
  // Debug logging removed - too verbose

  // Simple username display - backend handles @social.sol suffixes automatically
  const getUsernameDisplay = () => {
    // Use displayName from V2 API which already includes proper formatting
    if (displayName && displayName !== 'Unknown') {
      return displayName;
    }
    
    // Fallback to wallet address format if no display name
    if (userWallet) {
      return `${userWallet.slice(0, 5)}...${userWallet.slice(-5)}`;
    }
    
    return 'Unknown';
  };

  const usernameDisplay = getUsernameDisplay();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      marginHorizontal: 20,
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.02,
      shadowRadius: 1,
      elevation: 1,
    },
    cardContent: {
      paddingTop: 12,
      paddingHorizontal: 16,
      paddingBottom: 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    userSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    userNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    userNameRightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    userName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      lineHeight: 18,
    },
    metaText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      lineHeight: 15,
      marginTop: -8,
      marginBottom: 4,
    },
    verifiedText: {
      color: colors.success,
      fontSize: 16,
      fontWeight: '600',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    moreButton: {
      padding: 8,
    },
    energyChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.success,
      gap: 4,
    },
    energyText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.success,
      fontFamily: 'Inter-SemiBold',
    },
    trendingChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#3B82F6', // Blue
      gap: 4,
    },
    trendingText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#3B82F6', // Blue
      fontFamily: 'Inter-SemiBold',
    },
    controversialChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#DC2626', // Red
      gap: 4,
    },
    controversialText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#DC2626', // Red
      fontFamily: 'Inter-SemiBold',
    },
    threadIndicator: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      alignSelf: 'flex-start',
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    threadIndicatorText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
    threadIndicatorSubtext: {
      fontSize: 10,
      color: '#FFFFFF',
      fontFamily: 'Inter-Regular',
      opacity: 0.8,
      marginLeft: 4,
    },
    content: {
      marginBottom: 12,
    },
    postText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.foreground,
      marginBottom: 12,
      fontFamily: 'Inter-Regular',
    },
    mentionText: {
      color: colors.primary,
    },
    hashtagText: {
      color: colors.primary,
    },
    mediaContainer: {
      marginBottom: 12,
    },
    singleImage: {
      width: '100%',
      height: 300,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: colors.muted, // Add background to see if container renders
    },
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    gridImage: {
      width: (screenWidth - 40 - 24 - 8) / 2, // Account for margins and gap
      height: 150,
      borderRadius: 8,
    },
    videoContainer: {
      width: '100%',
      height: 200,
      borderRadius: 8,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      overflow: 'hidden',
      position: 'relative',
    },
    video: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    videoOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    playButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pauseIcon: {
      flexDirection: 'row',
      width: 20,
      height: 24,
      justifyContent: 'space-between',
    },
    pauseBar: {
      width: 6,
      height: 24,
      backgroundColor: '#FFFFFF',
      borderRadius: 2,
    },
    muteButton: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    muteIcon: {
      fontSize: 16,
    },
    twoImageContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    twoImageWrapper: {
      flex: 1,
    },
    twoImage: {
      width: '100%',
      height: 200,
      borderRadius: 8,
    },
    carouselContainer: {
      position: 'relative',
      marginBottom: 8,
    },
    carouselScroll: {
      borderRadius: 8,
    },
    carouselImage: {
      width: screenWidth - 40 - 32, // Account for card margins and padding
      height: 250,
      borderRadius: 8,
    },
    carouselIndicators: {
      position: 'absolute',
      bottom: 12,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    carouselDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    imageCounter: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    imageCounterText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    fullScreenModal: {
      flex: 1,
      backgroundColor: '#000000',
    },
    fullScreenHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      zIndex: 1,
    },
    fullScreenCloseButton: {
      padding: 8,
    },
    fullScreenCounter: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    fullScreenScroll: {
      flex: 1,
    },
    fullScreenImage: {
      width: screenWidth,
      height: '100%',
    },
    fullScreenIndicators: {
      position: 'absolute',
      bottom: 50,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    fullScreenDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    quotedPost: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      backgroundColor: colors.muted,
    },
    quotedPostHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    quotedPostUserInfo: {
      flex: 1,
      marginLeft: 8,
    },
    quotedPostUsername: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    quotedPostText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    quotedPostMediaContainer: {
      marginTop: 8,
      borderRadius: 8,
      overflow: 'hidden',
    },
    quotedPostSingleImage: {
      width: '100%',
      height: 120,
      borderRadius: 8,
    },
    quotedPostImageScroll: {
      flexDirection: 'row',
    },
    quotedPostMultipleImage: {
      width: 100,
      height: 100,
      marginRight: 8,
      borderRadius: 6,
    },
    quotedPostVideoIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      padding: 8,
      backgroundColor: colors.muted,
      borderRadius: 6,
    },
    quotedPostVideoText: {
      marginLeft: 6,
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    leftActions: {
      flex: 1,
    },
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      gap: 4,
    },
    disabledActionButton: {
      opacity: 0.5,
    },
    actionButtonWithCount: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    actionCount: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Medium',
    },
    modal: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 16,
      paddingBottom: 32,
      paddingTop: 16,
    },
    modalHandle: {
      width: 48,
      height: 4,
      backgroundColor: colors.mutedForeground,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 16,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalOptionText: {
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
    },
    pinnedRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pinnedText: {
      color: '#DC2626',
      marginLeft: 4,
    },
    blockchainInfo: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      opacity: 0.7,
    },
    brandBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      marginLeft: 2,
      marginTop: -10,
    },
    brandBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      fontFamily: 'Inter-Bold',
      letterSpacing: 0.5,
    },
  });

  // Update comment count when comments change
  useEffect(() => {
    const postId = post.transaction_hash || post.signature || post.id;
    const postComments = comments[postId] || [];
    const count = postComments.filter(c => !c.parentCommentId).length;
    setCommentCount(count);
  }, [comments, post.transaction_hash, post.signature, post.id]);

  // Check receipt status on mount and update bookmark state
  useEffect(() => {
    if (postSignature) {
      checkReceiptStatus(postSignature).then((isReceipted) => {
        setIsBookmarked(isReceipted);
      });
    }
  }, [postSignature, checkReceiptStatus]);

  const showToastMessage = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleShare = async (
    platform: 'internal' | 'twitter' | 'discord' | 'telegram',
  ) => {
    try {
      await sharePost({
        postId: (post.transaction_hash || post.signature || post.id)?.toString(),
        platform,
        comment: `Check out this post by ${displayName}`,
      });

      setShowShareModal(false);
      showToastMessage(`Post shared to ${platform}`, 'success');
    } catch (error) {
      showToastMessage('Failed to share post', 'error');
    }
  };

  const handleBookmark = async () => {
    if (!postSignature) {
      console.log('🚨 PostCard: No valid blockchain signature available for bookmark');
      console.log('🚨 PostCard: This post cannot be bookmarked because it lacks a valid transaction signature');
      showToastMessage('Cannot bookmark this post - no valid blockchain signature', 'error');
      return;
    }

    console.log('📝 PostCard: Attempting to bookmark post with signature:', postSignature);

    // Optimistic update
    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState);
    
    // Show success message immediately for better UX
    showToastMessage(
      newBookmarkState ? 'Added to receipts' : 'Removed from receipts',
      'success'
    );

    try {
      let success = false;
      if (newBookmarkState) {
        console.log('📝 PostCard: Adding receipt...');
        success = await addReceipt(postSignature);
        console.log('📝 PostCard: Add receipt result:', success);
      } else {
        console.log('📝 PostCard: Removing receipt...');
        success = await removeReceipt(postSignature);
        console.log('📝 PostCard: Remove receipt result:', success);
      }

      if (!success) {
        console.log('❌ PostCard: Receipt operation failed');
        // Revert optimistic update on failure
        setIsBookmarked(!newBookmarkState);
        showToastMessage(
          newBookmarkState ? 'Failed to add receipt' : 'Failed to remove receipt',
          'error'
        );
      } else {
        console.log('✅ PostCard: Receipt operation successful');
      }
    } catch (error) {
      console.log('🚨 PostCard: Receipt operation error:', error);
      // Revert optimistic update on error
      setIsBookmarked(!newBookmarkState);
      showToastMessage('Error updating receipt', 'error');
    }
  };

  const handleSharePost = async () => {
    try {
      const postUrl = `https://beam.fun/post/${postSignature || post.id}`;
      await Clipboard.setString(postUrl);
      setShowMoreModal(false);
      showToastMessage('Post link copied to clipboard', 'success');
    } catch (error) {
      showToastMessage('Failed to copy link', 'error');
    }
  };

  const handleExploreTransaction = async () => {
    try {
      if (!postSignature) {
        showToastMessage('No transaction signature available', 'error');
        return;
      }
      
      // Get user's preferred explorer or default to solscan
      const userExplorer = user?.explorer || 'solscan';
      
      // Generate the appropriate explorer URL based on user preference
      let explorerUrl: string;
      switch (userExplorer) {
        case 'solana-fm':
        case 'solanafm':
          explorerUrl = `https://solana.fm/tx/${postSignature}`;
          break;
        case 'solana.com':
        case 'solanacom':
          explorerUrl = `https://explorer.solana.com/tx/${postSignature}`;
          break;
        case 'solscan':
        default:
          explorerUrl = `https://solscan.io/tx/${postSignature}`;
          break;
      }
      
      console.log('🔍 PostCard: Opening explorer with user preference:', {
        userExplorer,
        explorerUrl
      });
      
      const canOpen = await Linking.canOpenURL(explorerUrl);
      
      if (canOpen) {
        await Linking.openURL(explorerUrl);
        setShowMoreModal(false);
      } else {
        showToastMessage('Cannot open explorer link', 'error');
      }
    } catch (error) {
      showToastMessage('Failed to open explorer', 'error');
    }
  };

  const handleMoreOptions = () => {
    setShowMoreModal(true);
  };

  const renderPostContent = (content: string) => {
    if (!content || typeof content !== 'string') {
      return <Text style={styles.postText}>No content</Text>;
    }
    
    const parts = content.split(/(@[\w.]+|#\w+)/g);

    return (
      <Text style={styles.postText}>
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            const mentionText = part.slice(1); // Remove @ symbol
            
            return (
              <Text
                key={`mention-${index}-${part}`}
                style={styles.mentionText}
                onPress={() => {
                  console.log('🔍 PostCard.mention: Clicked on mention:', mentionText);
                  
                  // Use pre-resolved mention data for instant navigation
                  const resolvedMention = resolvedMentions.get(mentionText);
                  
                  if (resolvedMention?.walletAddress) {
                    console.log('🔗 PostCard.mention: Using pre-resolved mention to wallet:', resolvedMention.walletAddress);
                    // Navigate to the user's profile with engagement tracking
                    const postSignature = post.signature || post.transactionHash || post.id?.toString();
                    onUserPress?.(undefined, resolvedMention.walletAddress, postSignature);
                  } else {
                    console.log('⚠️ PostCard.mention: No pre-resolved data for mention:', mentionText);
                    // Could show a toast or navigate to search as fallback
                    // For now, just log - we could implement search navigation here
                  }
                }}>
                {part}
              </Text>
            );
          } else if (part.startsWith('#')) {
            const hashtag = part.slice(1);
            return (
              <Text
                key={`hashtag-${index}-${part}`}
                style={styles.hashtagText}
                onPress={() => onHashtagPress?.(hashtag)}>
                {part}
              </Text>
            );
          }
          return <Text key={`text-${index}-${part.slice(0, 10)}`}>{part}</Text>;
        })}
      </Text>
    );
  };

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const renderMedia = () => {
    
    if (hasVideo && post.video) {
      // Test with a known working video URL to debug issues
      const TEST_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      const useTestVideo = false; // Set to true to test with known working video
      const videoUrl = useTestVideo ? TEST_VIDEO_URL : post.video;
      
      console.log('🎥 Rendering video component with URL:', videoUrl);
      console.log('🎥 Video URL protocol:', videoUrl.startsWith('https://') ? 'HTTPS' : videoUrl.startsWith('http://') ? 'HTTP' : 'Other');
      console.log('🎥 Using test video:', useTestVideo);
      
      return (
        <Pressable 
          style={styles.videoContainer}
          onPress={() => {
            console.log('🎥 Video container pressed. Current state:', {
              isPlaying: isVideoPlaying,
              isMuted: isVideoMuted,
              videoUrl: post.video
            });
            // Toggle play/pause on tap
            setIsVideoPlaying(!isVideoPlaying);
            // Show controls briefly when tapped
            setShowVideoControls(true);
            setTimeout(() => setShowVideoControls(false), 3000);
          }}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            paused={!isVideoPlaying}
            muted={isVideoMuted}
            repeat={true} // Loop the video
            resizeMode="cover"
            removeClippedSubviews={true} // Important for memory management
            poster={images[0]} // Use first image as poster if available
            onError={(error) => {
              console.error('🎥 Video playback error:', {
                error,
                videoUrl: post.video,
                errorDetails: JSON.stringify(error),
              });
              showToastMessage('Video failed to load', 'error');
            }}
            onLoad={(data) => {
              console.log('🎥 Video loaded successfully:', {
                duration: data.duration,
                naturalSize: data.naturalSize,
                videoUrl: post.video,
              });
            }}
            onBuffer={(buffer) => {
              console.log('🎥 Video buffering:', buffer.isBuffering);
            }}
            onLoadStart={() => {
              console.log('🎥 Video load started:', post.video);
            }}
            ignoreSilentSwitch="ignore" // Continue playing when phone is on silent
            playInBackground={false}
            playWhenInactive={false}
            controls={false} // We'll use custom controls
          />
          
          {/* Show play/pause overlay when paused or controls visible */}
          {(!isVideoPlaying || showVideoControls) && (
            <View style={styles.videoOverlay}>
              <View style={styles.playButton}>
                {isVideoPlaying ? (
                  <View style={styles.pauseIcon}>
                    <View style={styles.pauseBar} />
                    <View style={styles.pauseBar} />
                  </View>
                ) : (
                  <Play size={30} color="#FFFFFF" fill="#FFFFFF" />
                )}
              </View>
            </View>
          )}
          
          {/* Mute/Unmute button in corner */}
          <Pressable 
            style={styles.muteButton}
            onPress={(e) => {
              e.stopPropagation();
              setIsVideoMuted(!isVideoMuted);
            }}>
            <Text style={styles.muteIcon}>
              {isVideoMuted ? '🔇' : '🔊'}
            </Text>
          </Pressable>
        </Pressable>
      );
    }

    if (images.length === 1) {
      return (
        <Pressable onPress={() => handleImagePress(0)}>
          <FastImage
            source={{
              uri: images[0],
              priority: FastImage.priority.normal,
            }}
            style={styles.singleImage}
            resizeMode={FastImage.resizeMode.cover}
            onError={() => console.log('FastImage load error for:', images[0])}
            onLoad={() => console.log('FastImage loaded successfully')}
          />
        </Pressable>
      );
    }

    if (images.length === 2) {
      return (
        <View style={styles.twoImageContainer}>
          {images.map((url, index) => (
            <Pressable key={index} onPress={() => handleImagePress(index)} style={styles.twoImageWrapper}>
              <FastImage
                source={{
                  uri: url,
                  priority: FastImage.priority.normal,
                }}
                style={styles.twoImage}
                resizeMode={FastImage.resizeMode.cover}
                onError={() => console.log(`FastImage ${index} load error for:`, url)}
              />
            </Pressable>
          ))}
        </View>
      );
    }

    if (images.length > 2) {
      return (
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (screenWidth - 40 - 32));
              setCarouselIndex(index);
            }}
            style={styles.carouselScroll}>
            {images.map((url, index) => (
              <Pressable key={index} onPress={() => handleImagePress(index)}>
                <FastImage
                  source={{
                    uri: url,
                    priority: FastImage.priority.normal,
                  }}
                  style={styles.carouselImage}
                  resizeMode={FastImage.resizeMode.cover}
                  onError={() => console.log(`FastImage ${index} load error for:`, url)}
                />
              </Pressable>
            ))}
          </ScrollView>
          
          {/* Carousel indicators */}
          <View style={styles.carouselIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.carouselDot,
                  {
                    backgroundColor: index === carouselIndex ? colors.primary : colors.muted,
                  }
                ]}
              />
            ))}
          </View>
          
          {/* Image counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {carouselIndex + 1} / {images.length}
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  const renderQuotedPost = () => {
    if (!hasQuotedPost) return null;

    // NEW: Use quotedPostData from backend - contains full processed_posts structure
    if (post.quotedPostData) {
      const quotedPost = post.quotedPostData;
      
      // Extract data directly from processed_posts structure with brand support
      const quotedUserWallet = quotedPost.postUser || '';
      const quotedShouldUseBrandInfo = quotedPost.userIsBrand && quotedPost.brandName;
      
      const quotedDisplayName = (quotedShouldUseBrandInfo ? quotedPost.brandName : null) ||
        quotedPost.displayName || 
        quotedPost.userSnsDomain || 
        (quotedUserWallet ? `${quotedUserWallet.slice(0, 5)}...${quotedUserWallet.slice(-5)}` : 'Unknown');
      
      const quotedProfilePicture = quotedShouldUseBrandInfo && quotedPost.brandLogoUrl ? 
        quotedPost.brandLogoUrl : quotedPost.userProfileImageUri;
      
      const quotedIsVerified = quotedShouldUseBrandInfo ? 
        quotedPost.brandIsVerified : 
        (quotedPost.userIsVerifiedNft || quotedPost.userIsVerifiedSns);
      
      const quotedMessage = quotedPost.postMessage;
      const quotedImages = quotedPost.postImages || [];
      const quotedHasVideo = !!quotedPost.postVideo;

      console.log('🔍 PostCard.renderQuotedPost: Rendering quoted post data:', {
        quotedDisplayName,
        quotedMessage: quotedMessage?.substring(0, 50) + '...',
        quotedUserWallet: quotedUserWallet?.substring(0, 20) + '...',
        quotedProfilePicture: !!quotedProfilePicture,
        quotedIsVerified,
        quotedImagesCount: quotedImages.length,
        quotedHasVideo
      });

      return (
        <Pressable 
          style={styles.quotedPost} 
          onPress={() => {
            // Navigate to the quoted post details using the dedicated handler
            if (quotedPost.postSignature && onQuotedPostPress) {
              console.log('🔍 PostCard: Navigating to quoted post:', quotedPost.postSignature);
              onQuotedPostPress(quotedPost);
            }
          }}
        >
          <View style={styles.quotedPostHeader}>
            <Avatar
              src={quotedProfilePicture}
              fallback={quotedDisplayName.charAt(0)}
              size="sm"
              showRing={quotedIsVerified}
              ringColor={colors.success}
            />
            <View style={styles.quotedPostUserInfo}>
              <Text style={styles.quotedPostUsername}>
                {quotedDisplayName}
                {quotedIsVerified && ' ✓'}
              </Text>
            </View>
          </View>
          <Text style={styles.quotedPostText} numberOfLines={3}>
            {quotedMessage}
          </Text>
          
          {/* Display quoted post images */}
          {quotedImages.length > 0 && (
            <View style={styles.quotedPostMediaContainer}>
              {quotedImages.length === 1 ? (
                <FastImage
                  source={{uri: quotedImages[0]}}
                  style={styles.quotedPostSingleImage}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.quotedPostImageScroll}
                >
                  {quotedImages.map((image, index) => (
                    <FastImage
                      key={index}
                      source={{uri: image}}
                      style={styles.quotedPostMultipleImage}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          )}
          
          {/* Display quoted post video indicator */}
          {quotedHasVideo && !quotedImages.length && (
            <View style={styles.quotedPostVideoIndicator}>
              <Play size={16} color={colors.mutedForeground} />
              <Text style={styles.quotedPostVideoText}>Video</Text>
            </View>
          )}
        </Pressable>
      );
    }

    // LEGACY: Check if we have the full quoted post object (old field)
    if (post.quote_post) {
      const quotedPost = post.quote_post;
      const quotedUserWallet = quotedPost.user?.wallet_address || '';
      const quotedDisplayName = quotedPost.user?.display_name || quotedPost.user?.username || 
        (quotedUserWallet ? `${quotedUserWallet.slice(0, 5)}...${quotedUserWallet.slice(-5)}` : 'Unknown');

      return (
        <Pressable style={styles.quotedPost} onPress={() => onPress?.()}>
          <View style={styles.quotedPostHeader}>
            <Avatar
              src={quotedPost.user?.avatar_url}
              fallback={quotedDisplayName.charAt(0)}
              size="sm"
            />
            <View style={styles.quotedPostUserInfo}>
              <Text style={styles.quotedPostUsername}>
                {quotedDisplayName}
                {quotedPost.user?.is_verified && ' ✓'}
              </Text>
            </View>
          </View>
          <Text style={styles.quotedPostText} numberOfLines={3}>
            {quotedPost.message}
          </Text>
        </Pressable>
      );
    }

    // Fallback: just show that this post quotes another post (should rarely happen now)
    const quotedPostSignature = post.quoted_post || post.quotedPost;
    return (
      <View style={styles.quotedPost}>
        <View style={styles.quotedPostHeader}>
          <Quote size={16} color={colors.mutedForeground} />
          <View style={styles.quotedPostUserInfo}>
            <Text style={styles.quotedPostUsername}>
              Loading quoted post...
            </Text>
          </View>
        </View>
        <Text style={styles.quotedPostText} numberOfLines={2}>
          {quotedPostSignature?.slice(0, 32)}...
        </Text>
      </View>
    );
  };

  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardContent}>

          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => {
                const userId = post.user?.id ?? post.user_id; // Use nullish coalescing to handle 0
                console.log('🔍 PostCard.userPress: Calling onUserPress with userId and userWallet:', {userId, userWallet});
                console.log('🔍 PostCard.userPress: Post user fields:', {
                  'post.user?.id': post.user?.id,
                  'post.user_id': post.user_id,
                  'post.user?.wallet_address': post.user?.wallet_address,
                  'post.user?.walletAddress': post.user?.walletAddress,
                  'post.userPubkey': post.userPubkey,
                  'post.userWallet': post.userWallet,
                  'Final userWallet': userWallet,
                  'Final userId': userId
                });
                console.log('🔍 PostCard.userPress: Full post.user object:', JSON.stringify(post.user, null, 2));
                
                // ENGAGEMENT TRACKING: Include postSignature for profile visit tracking
                console.log('📊 PostCard: Tracking profile visit from post:', postSignature || post.id);
                
                // Call onUserPress if we have a wallet address (userId is optional for protocol-only users)
                if (userWallet && userWallet.trim() !== '') {
                  // Pass the post signature for engagement tracking
                  onUserPress?.(userId, userWallet, postSignature || post.id?.toString()); // Added postSignature param
                } else {
                  console.log('🚨 PostCard.userPress: No valid wallet address - not calling onUserPress', {userId, userWallet});
                }
              }}
              style={styles.userSection}>
              <Avatar
                src={avatarUrl}
                fallback={displayName.charAt(0)}
                size="md"
                showRing={isVerified}
                ringColor={isBrandUser && post.brandIsVerified ? '#10b981' : colors.success}
                shape={isBrandUser ? 'square' : 'circle'}
              />

              <View style={styles.userInfo}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userName}>
                    {usernameDisplay}
                    {(post.user?.is_verified || post.is_username_verified || post.is_profile_verified) && (
                      <Text style={styles.verifiedText}> ✓</Text>
                    )}
                  </Text>

                  <View style={styles.userNameRightSection}>
                    {/* Trending Chip - show message emoji with quote count */}
                    {feedContext === 'trending' && (
                      <View style={styles.trendingChip}>
                        <Text style={{fontSize: 12}}>💬</Text>
                        <Text style={styles.trendingText}>
                          {post.quoteCount || 0}
                        </Text>
                      </View>
                    )}

                    {/* Controversial Chip - show chili emoji with votes this epoch */}
                    {feedContext === 'controversial' && (
                      <View style={styles.controversialChip}>
                        <Text style={{fontSize: 12}}>🌶️</Text>
                        <Text style={styles.controversialText}>
                          0
                        </Text>
                      </View>
                    )}

                    {/* Energy Chip - show for all reputation scores including 0, but hide in trending/controversial feeds */}
                    {reputationScore !== undefined && feedContext === 'default' && (
                      <View style={[
                        styles.energyChip,
                        {
                          borderColor: reputationScore >= 0 ? colors.success : '#F59E0B'
                        }
                      ]}>
                        {reputationScore >= 0 ? (
                          <Zap size={12} color={colors.success} />
                        ) : (
                          <Flashlight size={12} color="#F59E0B" />
                        )}
                        <AnimatedScore
                          value={reputationScore}
                          style={[
                            styles.energyText,
                            {
                              color: reputationScore >= 0 ? colors.success : '#F59E0B'
                            }
                          ]}
                        />
                      </View>
                    )}

                    <Pressable
                      onPress={handleMoreOptions}
                      style={styles.moreButton}>
                      <MoreHorizontal
                        size={20}
                        color={colors.mutedForeground}
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.pinnedRow}>
                  <Text style={styles.metaText}>{formattedTime}</Text>
                  {isBrandUser && (
                    <>
                      <Text style={styles.metaText}> • </Text>
                      <View style={[
                        styles.brandBadge, 
                        {
                          backgroundColor: post.brandIsVerified ? '#10b981' : '#6b7280',
                          borderColor: post.brandIsVerified ? '#10b981' : '#6b7280',
                        }
                      ]}>
                        <Text style={[styles.brandBadgeText, {
                          color: '#ffffff'
                        }]}>
                          {post.brandIsVerified ? 'VERIFIED' : 'BRAND'}
                        </Text>
                      </View>
                    </>
                  )}
                  {(post.is_pinned || post.isPinned) && (
                    <>
                      <Text style={styles.metaText}> • </Text>
                      <Pin size={12} color="#DC2626" />
                      <Text style={[styles.metaText, styles.pinnedText]}>
                        Pinned
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </Pressable>
          </View>

          {/* Content */}
          <Pressable onPress={() => {
            console.log('📊 PostCard: Tracking post expansion for:', postSignature || post.id);
            onPress?.(); // This will trigger navigation with postExpansion tracking
          }}>
            <View style={styles.content}>
              {/* Thread Indicator - Enhanced per FEED_INTEGRATION_GUIDE.md */}
              {(post.threadData || post.isThreadRoot || showThreadPill) && (
                <Pressable 
                  style={styles.threadIndicator}
                  onPress={() => onThreadPress?.(post)}
                >
                  <MessageCircle size={14} color="#FFFFFF" />
                  <Text style={[styles.threadIndicatorText, {marginLeft: 6}]}>
                    🧵 Thread
                  </Text>
                </Pressable>
              )}
              
              {renderPostContent(post.message)}

              {/* Quoted Post */}
              {renderQuotedPost()}

              {/* Media */}
              {(images.length > 0 || hasVideo) && (
                <View style={styles.mediaContainer}>
                  {renderMedia()}
                </View>
              )}
            </View>
          </Pressable>

          {/* Actions */}
          <View style={styles.actions}>
            {/* Left cluster - Blockchain info */}
            <View style={styles.leftActions}>
              <Text style={styles.blockchainInfo}>
                Signed & Validated
              </Text>
              <Text style={styles.blockchainInfo}>
                Epoch {epochNumber} | Slot {slotNumber > 0 ? slotNumber.toLocaleString() : '0'}
              </Text>
            </View>

            {/* Right cluster */}
            <View style={styles.rightActions}>
              {/* Quote */}
              <Pressable
                onPress={() => onQuotePress?.(post)}
                style={styles.actionButton}>
                <View style={styles.actionButtonWithCount}>
                  <MessageCircle size={20} color={colors.mutedForeground} />
                  {(post.quote_count || post.quoteCount || 0) > 0 && (
                    <Text style={styles.actionCount}>{post.quote_count || post.quoteCount}</Text>
                  )}
                </View>
              </Pressable>

              {/* Bookmark */}
              <Pressable
                onPress={postSignature ? handleBookmark : undefined}
                style={[styles.actionButton, !postSignature && styles.disabledActionButton]}>
                <View style={styles.actionButtonWithCount}>
                  {isBookmarked ? (
                    <BookmarkCheck size={20} color={colors.primary} />
                  ) : (
                    <Bookmark 
                      size={20} 
                      color={postSignature ? colors.mutedForeground : colors.muted} 
                    />
                  )}
                  {(post.receipts_count || post.receiptsCount || 0) > 0 && (
                    <Text style={styles.actionCount}>{post.receipts_count || post.receiptsCount}</Text>
                  )}
                </View>
              </Pressable>

              {/* Open Post Details */}
              {!hideExpandButton && (
                <Pressable
                  onPress={() => {
                    console.log('📊 PostCard: Tracking post expansion via chevron for:', postSignature || post.id);
                    onPress?.(); // This will trigger navigation with postExpansion tracking
                  }}
                  style={styles.actionButton}>
                  <ChevronRight size={20} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Modals */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}>
        <Pressable
          style={styles.modal}
          onPress={() => setShowShareModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Share Post</Text>
            
            <Pressable
              style={styles.modalOption}
              onPress={() => handleShare('twitter')}>
              <Text style={styles.modalOptionText}>Share on Twitter</Text>
              <ChevronRight size={20} color={colors.mutedForeground} />
            </Pressable>

            <Pressable
              style={styles.modalOption}
              onPress={() => handleShare('discord')}>
              <Text style={styles.modalOptionText}>Share on Discord</Text>
              <ChevronRight size={20} color={colors.mutedForeground} />
            </Pressable>

            <Pressable
              style={styles.modalOption}
              onPress={() => handleShare('telegram')}>
              <Text style={styles.modalOptionText}>Share on Telegram</Text>
              <ChevronRight size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showCommentsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentsModal(false)}>
        <SimpleCommentsSection
          postId={(post.transaction_hash || post.signature || post.id)?.toString()}
          postAuthor={userWallet}
          onClose={() => setShowCommentsModal(false)}
          onCommentAdded={() => setCommentCount(commentCount + 1)}
        />
      </Modal>

      <Modal
        visible={showMoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoreModal(false)}>
        <Pressable
          style={styles.modal}
          onPress={() => setShowMoreModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>More Options</Text>
            
            <Pressable
              style={styles.modalOption}
              onPress={handleSharePost}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Share size={20} color={colors.mutedForeground} style={{marginRight: 12}} />
                <Text style={styles.modalOptionText}>Share Post</Text>
              </View>
              <ChevronRight size={20} color={colors.mutedForeground} />
            </Pressable>

            <Pressable
              style={[styles.modalOption, !postSignature && {opacity: 0.5}]}
              onPress={postSignature ? handleExploreTransaction : undefined}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <ExternalLink size={20} color={colors.mutedForeground} style={{marginRight: 12}} />
                <Text style={styles.modalOptionText}>Explore Transaction</Text>
              </View>
              <ChevronRight size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Full Screen Image Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowImageModal(false)}>
        <SafeAreaView style={styles.fullScreenModal}>
          <View style={styles.fullScreenHeader}>
            <Pressable
              style={styles.fullScreenCloseButton}
              onPress={() => setShowImageModal(false)}>
              <X size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.fullScreenCounter}>
              {selectedImageIndex + 1} of {images.length}
            </Text>
          </View>
          
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{x: selectedImageIndex * screenWidth, y: 0}}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setSelectedImageIndex(index);
            }}
            style={styles.fullScreenScroll}>
            {images.map((url, index) => (
              <FastImage
                key={index}
                source={{
                  uri: url,
                  priority: FastImage.priority.high,
                }}
                style={styles.fullScreenImage}
                resizeMode={FastImage.resizeMode.contain}
              />
            ))}
          </ScrollView>
          
          {images.length > 1 && (
            <View style={styles.fullScreenIndicators}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.fullScreenDot,
                    {
                      backgroundColor: index === selectedImageIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                    }
                  ]}
                />
              ))}
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Tip Modal replaced with screen navigation via TipUserButton */}

      {/* Toast Messages */}
      <Toast
        message={toastMessage}
        type={toastType}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
    </>
  );
}