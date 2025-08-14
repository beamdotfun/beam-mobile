import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image as RNImage,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  X,
  Image,
  AlertCircle,
  Link2,
  Save,
  Wallet,
  Settings,
  Camera,
  ImageIcon,
  Video,
  Trash2,
  Edit3,
} from 'lucide-react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  ImageLibraryOptions,
  CameraOptions,
} from 'react-native-image-picker';
import {PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import {usePostCreationStore} from '../../store/postCreation';
import {useThemeStore} from '../../store/themeStore';
import {useWalletStore} from '../../store/wallet';
import {useDraftsStore} from '../../store/draftsStore';
import {useAuthStore} from '../../store/auth';
import {useProfileStore} from '../../store/profileStore';
import {useWalletConnection} from '../../hooks/useWalletConnection';
import {Avatar} from '../../components/ui/avatar';
import {AnimatedButton} from '../../components/ui/AnimatedButton';
import {LoadingOverlay} from '../../components/ui/LoadingOverlay';
import {SlideUpModal, SlideUpModalOption} from '../../components/ui/SlideUpModal';
import {FeedStackScreenProps} from '../../types/navigation';
import {socialAPI} from '../../services/api/social';

type Props = FeedStackScreenProps<'CreatePost'>;

const MAX_MESSAGE_LENGTH = 420;
const MAX_MEDIA_COUNT = 4;

export default function CreatePostScreen({navigation, route}: Props) {
  const {colors} = useThemeStore();
  const {connect: connectWallet} = useWalletStore();
  const {user: _user} = useAuthStore(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const {currentProfile: _currentProfile} = useProfileStore(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const walletConnection = useWalletConnection();
  const {
    draft,
    uploadProgress,
    isPosting,
    error,
    updateMessage,
    addMediaAsset,
    updateMediaAsset,
    removeMediaAsset,
    submitPost,
    estimatePostingFee,
    clearDraft,
    validateDraft,
    uploadMedia, // eslint-disable-line @typescript-eslint/no-unused-vars
  } = usePostCreationStore();

  const [_keyboardHeight, setKeyboardHeight] = useState(0);
  const [quoteUrl, setQuoteUrl] = useState('');
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [_balanceLoading, setBalanceLoading] = useState(false);
  const [_balanceError, setBalanceError] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const quotedPost = route.params?.quotedPost;
  const loadDraft = route.params?.loadDraft;
  const draftId = route.params?.draftId;

  // Use the centralized wallet connection hook
  const {
    publicKey,
    isPrimaryWalletConnected,
    getWalletWarningType,
    isSIWSAuthenticated,
  } = walletConnection;

  // Debug logging for wallet connection issues (throttled to prevent spam)
  React.useEffect(() => {
    console.log('🔍 CreatePostScreen: Wallet connection debug', {
      hasPublicKey: !!publicKey,
      publicKeyString: publicKey?.toString(),
      isPrimaryWalletConnected,
      isSIWSAuthenticated,
      walletWarningType: getWalletWarningType(),
    });
  }, [publicKey, isPrimaryWalletConnected, isSIWSAuthenticated]); // Only log when these actually change

  // Auto-dismiss status messages after 10 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Clear draft when starting fresh (not loading a specific draft or quoting a post)
  useEffect(() => {
    if (!loadDraft && !quotedPost) {
      // This is a fresh create post - clear any existing draft
      usePostCreationStore.getState().clearDraft();
    }
  }, [loadDraft, quotedPost]); // Remove clearDraft from dependencies

  // Load draft if coming from drafts page
  useEffect(() => {
    if (loadDraft && draftId) {
      const {selectedDraft} = useDraftsStore.getState();
      if (selectedDraft && selectedDraft.id === draftId) {
        // Load draft content into the post creation store
        updateMessage(selectedDraft.message);

        // Load images if any
        if (selectedDraft.images && selectedDraft.images.length > 0) {
          const {addMediaAsset: addDraftMediaAsset} =
            usePostCreationStore.getState();
          selectedDraft.images.forEach((imageUrl, index) => {
            const mediaAsset = {
              id: `draft-image-${index}`,
              uri: imageUrl,
              type: 'image' as const,
            };
            addDraftMediaAsset(mediaAsset);
          });
        }

        // Load quoted post if any
        if (selectedDraft.quotedPost) {
          usePostCreationStore
            .getState()
            .setQuotedPostId(selectedDraft.quotedPost);
        }

        // Store the draft ID for updating
        setCurrentDraftId(draftId);
        // Clear the selected draft
        useDraftsStore.getState().selectDraft(null);
      }
    }
  }, [loadDraft, draftId, updateMessage]);

  // Set quoted post ID in draft when component mounts
  useEffect(() => {
    if (quotedPost?.id && !loadDraft) {
      usePostCreationStore.getState().setQuotedPostId(quotedPost.id);
    }
    return () => {
      // Clear quoted post ID when unmounting if no message was written
      if (!draft.message.trim() && !loadDraft) {
        usePostCreationStore.getState().setQuotedPostId(undefined);
      }
    };
  }, [quotedPost?.id, loadDraft, draft.message]);

  // Load fee estimate on mount
  useEffect(() => {
    usePostCreationStore.getState().estimatePostingFee();
  }, []); // Remove estimatePostingFee from dependencies, only run on mount

  // Check wallet balance when primary wallet is properly connected
  useEffect(() => {
    const checkWalletBalance = async () => {
      if (!isPrimaryWalletConnected) {
        setWalletBalance(null);
        setBalanceError(null);
        return;
      }

      setBalanceLoading(true);
      setBalanceError(null);

      try {
        const balanceData = await socialAPI.getWalletBalance(
          publicKey.toString(),
        );

        // Safely access balanceSOL with fallback
        if (balanceData && typeof balanceData.balanceSOL === 'number') {
          setWalletBalance(balanceData.balanceSOL);
        } else {
          console.warn('Invalid balance data received:', balanceData);
          setWalletBalance(0); // Default to 0 if invalid data
        }
      } catch (balanceError) {
        console.error('Failed to check wallet balance:', balanceError);
        setBalanceError('Failed to check wallet balance');
        setWalletBalance(null);
      } finally {
        setBalanceLoading(false);
      }
    };

    checkWalletBalance();
  }, [isPrimaryWalletConnected, publicKey]);

  // Keyboard handling
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', e => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    closeButton: {
      padding: 8,
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
      fontFamily: 'Inter-Bold',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    saveDraftButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.muted,
    },
    saveDraftButtonDisabled: {
      opacity: 0.5,
    },
    postButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
      opacity: 1,
    },
    postButtonDisabled: {
      opacity: 0.5,
    },
    postButtonText: {
      color: colors.primaryForeground,
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    errorCard: {
      backgroundColor: colors.destructive + '10',
      borderWidth: 1,
      borderColor: colors.destructive,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorText: {
      color: colors.destructive,
      fontSize: 14,
      flex: 1,
      marginLeft: 12,
      fontFamily: 'Inter-Regular',
    },
    warningCard: {
      backgroundColor: colors.warning + '15' || '#F59E0B15',
      borderWidth: 1,
      borderColor: colors.warning || '#F59E0B',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    warningText: {
      color: colors.warning || '#F59E0B',
      fontSize: 14,
      flex: 1,
      marginLeft: 12,
      fontFamily: 'Inter-Regular',
    },
    warningButton: {
      backgroundColor: colors.warning || '#F59E0B',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginLeft: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    warningButtonText: {
      color: colors.background,
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    inputSection: {
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    textInput: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.foreground,
      minHeight: 120,
      textAlignVertical: 'top',
      fontFamily: 'Inter-Regular',
    },
    characterSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    characterCount: {
      fontSize: 13,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
    },
    feeText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
    },
    mediaSection: {
      marginTop: 20,
      paddingHorizontal: 16,
    },
    mediaSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    mediaSectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    mediaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    mediaPreview: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: colors.muted,
      overflow: 'hidden',
      position: 'relative',
    },
    mediaImage: {
      width: '100%',
      height: '100%',
    },
    removeMediaButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 12,
      padding: 4,
    },
    addMediaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.muted,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      gap: 8,
    },
    addMediaButtonDisabled: {
      opacity: 0.5,
    },
    addMediaText: {
      color: colors.foreground,
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
    },
    quoteSection: {
      marginTop: 20,
      paddingHorizontal: 16,
    },
    quoteSectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 12,
    },
    quoteInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.muted,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    quoteIcon: {
      marginRight: 8,
    },
    quoteInput: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
      paddingVertical: 12,
    },
    quotePreview: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.muted,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    quotePreviewText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      fontStyle: 'italic',
    },
    quotedPostCard: {
      marginTop: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
    },
    quotedPostHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    quotedPostUserInfo: {
      marginLeft: 10,
      flex: 1,
    },
    quotedPostUsername: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    quotedPostHandle: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 1,
    },
    quotedPostMessage: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
    },
    quotedPostTime: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 6,
    },
    statusMessage: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 16,
      borderWidth: 1,
    },
    statusMessageSuccess: {
      borderColor: colors.success,
      backgroundColor: colors.success + '10', // 10% opacity
    },
    statusMessageError: {
      borderColor: colors.destructive,
      backgroundColor: colors.destructive + '10', // 10% opacity
    },
    statusMessageInfo: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10', // 10% opacity
    },
    statusMessageText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
      textAlign: 'center',
    },
    statusMessageTextSuccess: {
      color: colors.success,
    },
    statusMessageTextError: {
      color: colors.destructive,
    },
    statusMessageTextInfo: {
      color: colors.primary,
    },
    fadedIcon: {
      opacity: 0.5,
    },
    buttonTextSpacing: {
      marginLeft: 4,
    },
  });

  const handleBack = () => {
    if (draft.message.trim() || draft.mediaAssets.length > 0) {
      setShowDiscardModal(true);
    } else {
      navigation.goBack();
    }
  };

  const handleDiscard = () => {
    setShowDiscardModal(false);
    clearDraft();
    navigation.goBack();
  };

  const handleKeepWriting = () => {
    setShowDiscardModal(false);
  };

  const handleSaveDraft = async () => {
    // Show confirmation dialog
    Alert.alert('Save Draft', 'Do you want to save this post as a draft?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Save',
        onPress: async () => {
          try {
            setIsSavingDraft(true);
            const {createDraft, updateDraft} = useDraftsStore.getState();

            const draftData = {
              message: draft.message.trim(),
              images: draft.mediaAssets.map(asset => asset.uri),
              quotedPost: draft.quotedPostId,
            };

            let success = false;
            if (currentDraftId) {
              // Update existing draft
              success = await updateDraft(currentDraftId, draftData);
            } else {
              // Create new draft
              const savedDraft = await createDraft(draftData);
              success = !!savedDraft;
              if (savedDraft) {
                setCurrentDraftId(savedDraft.id);
              }
            }

            setIsSavingDraft(false);

            if (success) {
              setStatusMessage({
                type: 'success',
                message: 'Your draft has been saved successfully!',
              });
              // Navigate back after a short delay
              setTimeout(() => {
                navigation.goBack();
              }, 2000);
            } else {
              throw new Error('Failed to save draft');
            }
          } catch (draftError) {
            setIsSavingDraft(false);
            console.error('Failed to save draft:', draftError);
            setStatusMessage({
              type: 'error',
              message: 'Failed to save draft. Please try again.',
            });
          }
        },
      },
    ]);
  };

  const handlePost = async () => {
    // Basic validation (post button should be disabled if warnings are active)
    if (!validateDraft()) {
      setStatusMessage({
        type: 'error',
        message: 'Please add some content to your post.',
      });
      return;
    }

    setStatusMessage(null); // Clear any previous status messages

    try {
      Keyboard.dismiss();

      // If this is a draft, publish it
      if (currentDraftId) {
        const {publishDraft} = useDraftsStore.getState();
        const result = await publishDraft(currentDraftId);
        if (result) {
          clearDraft();
          setStatusMessage({
            type: 'success',
            message:
              'Your draft has been successfully published to the blockchain.',
          });
          // Navigate back after a short delay
          setTimeout(() => {
            navigation.goBack();
          }, 2000);
          return;
        } else {
          throw new Error('Failed to publish draft');
        }
      }

      // Otherwise, create a new post
      await submitPost();

      setStatusMessage({
        type: 'success',
        message:
          'Your post has been successfully created and added to the Solana blockchain.',
      });

      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error: any) {
      console.error('Post creation failed:', error);

      let errorMessage = 'Failed to create post. Please try again.';
      let messageType: 'error' | 'info' = 'error';

      if (
        error.message?.includes('rejected') ||
        error.message?.includes('cancelled') ||
        error.message?.includes('User rejected')
      ) {
        errorMessage = 'Post creation not completed';
        messageType = 'info';
      } else if (error.message?.includes('insufficient')) {
        errorMessage = 'Insufficient SOL balance to complete posting';
      } else if (error.message?.includes('Failed to publish draft')) {
        errorMessage =
          'Failed to publish draft. Please check your wallet connection and try again.';
      } else if (error.message) {
        // Show a user-friendly version of the error for specific cases
        if (currentDraftId) {
          errorMessage = `Failed to publish draft: ${error.message}`;
        } else {
          errorMessage = `Failed to create post: ${error.message}`;
        }
      }

      setStatusMessage({
        type: messageType,
        message: errorMessage,
      });
    }
  };

  const handleAddMedia = () => {
    setShowMediaModal(true);
  };

  const openCamera = async () => {
    setShowMediaModal(false);
    
    try {
      const permission =
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.CAMERA
          : PERMISSIONS.IOS.CAMERA;
      const result = await request(permission);

      if (result !== RESULTS.GRANTED) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to take photos.',
          [{text: 'OK'}],
        );
        return;
      }

      const options: CameraOptions = {
        mediaType: 'mixed',
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: 0.8,
        saveToPhotos: false,
      };

      launchCamera(options, handleImagePickerResponse);
    } catch (cameraError) {
      console.error('Error requesting camera permission:', cameraError);
    }
  };

  const openImageLibrary = async () => {
    setShowMediaModal(false);
    
    try {
      // For Android 13+ (API 33+), we need READ_MEDIA_IMAGES instead of READ_EXTERNAL_STORAGE
      const permission =
        Platform.OS === 'android'
          ? Platform.Version >= 33
            ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
            : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
          : PERMISSIONS.IOS.PHOTO_LIBRARY;

      const result = await request(permission);

      if (result !== RESULTS.GRANTED) {
        Alert.alert(
          'Photo Library Permission Required',
          'Please enable photo library access in your device settings to select photos.',
          [{text: 'OK'}],
        );
        return;
      }

      const options: ImageLibraryOptions = {
        mediaType: 'mixed',
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: 0.8,
        selectionLimit: MAX_MEDIA_COUNT - draft.mediaAssets.length,
      };

      launchImageLibrary(options, handleImagePickerResponse);
    } catch (libraryError) {
      console.error('Error requesting photo library permission:', libraryError);
    }
  };

  const handleImagePickerResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorCode) {
      console.log('Image picker cancelled or error:', response.errorMessage);
      return;
    }

    if (response.assets && response.assets.length > 0) {
      for (const asset of response.assets) {
        if (asset.uri) {
          const mediaType = asset.type?.startsWith('video') ? 'video' : 'image';
          
          // Add media asset to store for preview
          const mediaAsset = {
            id: `media-${Date.now()}-${Math.random()}`,
            uri: asset.uri,
            type: mediaType as 'image' | 'video',
            fileName: asset.fileName,
            fileSize: asset.fileSize,
            uploading: true,
            cloudUrl: null,
          };
          addMediaAsset(mediaAsset);
          
          try {
            // Upload the media to get CDN URL
            setStatusMessage({
              type: 'info',
              message: `Uploading ${mediaType}...`,
            });
            
            const result = await socialAPI.uploadMedia(asset, mediaType);
            
            // Update the media asset with the cloud URL (markup handled internally)
            updateMediaAsset(mediaAsset.id, {
              cloudUrl: result.url,
              uploading: false,
            });
            
            setStatusMessage({
              type: 'success',
              message: `${mediaType === 'video' ? 'Video' : 'Image'} uploaded successfully!`,
            });
            
            // Clear status message after 3 seconds
            setTimeout(() => setStatusMessage(null), 3000);
            
          } catch (error: any) {
            console.error('Media upload failed:', error);
            
            // Remove the failed media asset
            removeMediaAsset(mediaAsset.id);
            
            setStatusMessage({
              type: 'error',
              message: error.message || `Failed to upload ${mediaType}`,
            });
            
            // Clear error message after 5 seconds
            setTimeout(() => setStatusMessage(null), 5000);
          }
        }
      }
    }
  };

  const characterCountColor = () => {
    const remaining = MAX_MESSAGE_LENGTH - draft.characterCount;
    if (remaining < 20) {
      return colors.destructive;
    }
    if (remaining < 50) {
      return colors.warning || '#F59E0B';
    }
    return colors.mutedForeground;
  };

  // Helper to check if any warning boxes are active
  const hasActiveWarnings = () => {
    const warningType = getWalletWarningType();
    const hasWalletWarning =
      warningType === 'setup' || warningType === 'connect';
    const hasBalanceWarning =
      isPrimaryWalletConnected &&
      walletBalance !== null &&
      walletBalance < 0.0001;

    return hasWalletWarning || hasBalanceWarning;
  };

  const isPostDisabled =
    !validateDraft() ||
    isPosting ||
    uploadProgress.some(p => p.uploading) ||
    hasActiveWarnings();

  // Media selection modal options
  const mediaOptions: SlideUpModalOption[] = [
    {
      id: 'camera',
      title: 'Take Photo or Video',
      description: 'Capture a new moment with your camera',
      icon: <Camera size={24} color={colors.primary} />,
      onPress: openCamera,
    },
    {
      id: 'gallery',
      title: 'Choose from Gallery',
      description: 'Select photos or videos from your device',
      icon: <ImageIcon size={24} color={colors.primary} />,
      onPress: openImageLibrary,
    },
  ];

  // Discard confirmation modal options
  const discardOptions: SlideUpModalOption[] = [
    {
      id: 'keep-writing',
      title: 'Keep Writing',
      description: 'Continue working on your post',
      icon: <Edit3 size={24} color={colors.success} />,
      onPress: handleKeepWriting,
    },
    {
      id: 'discard',
      title: 'Discard',
      description: currentDraftId ? 'Delete changes and exit' : 'Delete post and exit',
      icon: <Trash2 size={24} color={colors.destructive} />,
      onPress: handleDiscard,
      destructive: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LoadingOverlay
        visible={isPosting}
        title={currentDraftId ? 'Publishing Draft' : 'Creating Post'}
        message={
          currentDraftId
            ? 'Publishing your draft to the blockchain...'
            : 'Creating your post on the Solana blockchain...'
        }
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleBack} style={styles.closeButton}>
            <X size={24} color={colors.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {currentDraftId ? 'Edit Draft' : 'Create Post'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            onPress={handleSaveDraft}
            style={[
              styles.saveDraftButton,
              (!draft.message.trim() || isPosting || isSavingDraft) &&
                styles.saveDraftButtonDisabled,
            ]}
            disabled={!draft.message.trim() || isPosting || isSavingDraft}>
            {isSavingDraft ? (
              <Save
                size={16}
                color={colors.mutedForeground}
                style={styles.fadedIcon}
              />
            ) : (
              <Save
                size={20}
                color={
                  !draft.message.trim() || isPosting
                    ? colors.mutedForeground + '50'
                    : colors.mutedForeground
                }
              />
            )}
          </Pressable>

          <AnimatedButton
            title={currentDraftId ? 'Publish' : 'Post'}
            loading={isPosting}
            loadingText={currentDraftId ? 'Publishing...' : 'Posting...'}
            onPress={handlePost}
            disabled={isPostDisabled}
            variant="primary"
            size="md"
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Status Message */}
          {statusMessage && (
            <View
              style={[
                styles.statusMessage,
                statusMessage.type === 'success' && styles.statusMessageSuccess,
                statusMessage.type === 'error' && styles.statusMessageError,
                statusMessage.type === 'info' && styles.statusMessageInfo,
              ]}>
              <Text
                style={[
                  styles.statusMessageText,
                  statusMessage.type === 'success' &&
                    styles.statusMessageTextSuccess,
                  statusMessage.type === 'error' &&
                    styles.statusMessageTextError,
                  statusMessage.type === 'info' && styles.statusMessageTextInfo,
                ]}>
                {statusMessage.message}
              </Text>
            </View>
          )}

          {/* Error Message from store */}
          {error && (
            <View style={styles.errorCard}>
              <AlertCircle size={20} color={colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Post Input */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.textInput}
              placeholder="What's happening?"
              placeholderTextColor={colors.mutedForeground}
              value={draft.message}
              onChangeText={updateMessage}
              multiline
              maxLength={MAX_MESSAGE_LENGTH}
              editable={!isPosting}
            />

            {/* Character Count & Fee */}
            <View style={styles.characterSection}>
              {draft.estimatedFee && (
                <Text style={styles.feeText}>
                  Fee: ~{draft.estimatedFee.toFixed(4)} SOL
                </Text>
              )}

              <Text
                style={[styles.characterCount, {color: characterCountColor()}]}>
                {MAX_MESSAGE_LENGTH - draft.characterCount} characters remaining
              </Text>
            </View>
          </View>

          {/* Wallet Setup Warning */}
          {getWalletWarningType() === 'setup' && (
            <View style={styles.warningCard}>
              <Wallet size={20} color={colors.warning || '#F59E0B'} />
              <Text style={styles.warningText}>
                You must set up a primary Solana wallet in order to post
              </Text>
              <Pressable
                style={styles.warningButton}
                onPress={() => navigation.navigate('WalletSettings')}>
                <Settings size={12} color={colors.background} />
                <Text
                  style={[styles.warningButtonText, styles.buttonTextSpacing]}>
                  Settings
                </Text>
              </Pressable>
            </View>
          )}

          {/* Wallet Connection Warning */}
          {getWalletWarningType() === 'connect' && (
            <View style={styles.warningCard}>
              <Wallet size={20} color={colors.warning || '#F59E0B'} />
              <Text style={styles.warningText}>
                Please connect your primary Solana wallet to post
              </Text>
              <Pressable
                style={styles.warningButton}
                onPress={() => connectWallet()}>
                <Wallet size={12} color={colors.background} />
                <Text
                  style={[styles.warningButtonText, styles.buttonTextSpacing]}>
                  Connect
                </Text>
              </Pressable>
            </View>
          )}

          {/* Insufficient Balance Warning */}
          {isPrimaryWalletConnected &&
            walletBalance !== null &&
            walletBalance < 0.0001 && (
              <Pressable
                style={styles.warningCard}
                onPress={() => navigation.navigate('BuySOL')}>
                <AlertCircle size={20} color={colors.warning || '#F59E0B'} />
                <Text style={styles.warningText}>
                  No SOL. Please purchase more.
                </Text>
                <View style={styles.warningButton}>
                  <Text style={styles.warningButtonText}>Buy SOL</Text>
                </View>
              </Pressable>
            )}

          {/* Media Section */}
          <View style={styles.mediaSection}>
            <View style={styles.mediaSectionHeader}>
              <Text style={styles.mediaSectionTitle}>
                Media{' '}
                {draft.mediaAssets.length > 0 &&
                  `(${draft.mediaAssets.length}/${MAX_MEDIA_COUNT})`}
              </Text>
            </View>

            {/* Media Grid */}
            {draft.mediaAssets.length > 0 && (
              <View style={styles.mediaGrid}>
                {draft.mediaAssets.map(asset => (
                  <View key={asset.id} style={styles.mediaPreview}>
                    <RNImage
                      source={{uri: asset.uri}}
                      style={styles.mediaImage}
                      resizeMode="cover"
                    />
                    <Pressable
                      style={styles.removeMediaButton}
                      onPress={() => removeMediaAsset(asset.id)}
                      disabled={isPosting}>
                      <X size={16} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Add Media Button */}
            <Pressable
              style={[
                styles.addMediaButton,
                (isPosting || draft.mediaAssets.length >= MAX_MEDIA_COUNT) &&
                  styles.addMediaButtonDisabled,
              ]}
              onPress={handleAddMedia}
              disabled={
                isPosting || draft.mediaAssets.length >= MAX_MEDIA_COUNT
              }>
              <Image size={20} color={colors.foreground} />
              <Text style={styles.addMediaText}>Add Photo or Video</Text>
            </Pressable>
          </View>

          {/* Quote Section */}
          {quotedPost && (
            <View style={styles.quoteSection}>
              <Text style={styles.quoteSectionTitle}>Quoting</Text>

              {/* Quoted Post Card */}
              <View style={styles.quotedPostCard}>
                <View style={styles.quotedPostHeader}>
                  <Avatar
                    src={quotedPost.user?.profilePicture || quotedPost.user?.avatar_url}
                    fallback={quotedPost.user?.name?.charAt(0) || quotedPost.user?.display_name?.charAt(0) || 'U'}
                    size="sm"
                    showRing={quotedPost.user?.isVerified || quotedPost.user?.is_verified}
                    ringColor={colors.success}
                  />
                  <View style={styles.quotedPostUserInfo}>
                    <Text style={styles.quotedPostUsername}>
                      {quotedPost.user?.name || quotedPost.user?.display_name || 'Unknown'}
                    </Text>
                    <Text style={styles.quotedPostHandle}>
                      @{(quotedPost.userWallet || quotedPost.user?.walletAddress || quotedPost.user?.wallet_address || 'unknown')?.slice(0, 8)}...
                    </Text>
                  </View>
                </View>
                <Text style={styles.quotedPostMessage} numberOfLines={3}>
                  {quotedPost.message || 'No content'}
                </Text>
                {/* Show media indicator for posts with media */}
                {(quotedPost.mediaUrls?.length > 0 || quotedPost.images?.length > 0 || quotedPost.video) && (
                  <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8, opacity: 0.7}}>
                    {quotedPost.video || quotedPost.mediaUrls?.some((url: string) => url.includes('.mp4')) ? (
                      <Video size={14} color={colors.mutedForeground} style={{marginRight: 4}} />
                    ) : (
                      <Image size={14} color={colors.mutedForeground} style={{marginRight: 4}} />
                    )}
                    <Text style={{fontSize: 12, color: colors.mutedForeground}}>
                      {quotedPost.video || quotedPost.mediaUrls?.some((url: string) => url.includes('.mp4')) ? 'Video attached' : 'Photo attached'}
                    </Text>
                  </View>
                )}
                {quotedPost.createdAt && (
                  <Text style={styles.quotedPostTime}>
                    {new Date(quotedPost.createdAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* URL Quote Section - only show if no quotedPost */}
          {!quotedPost && (
            <View style={styles.quoteSection}>
              <Text style={styles.quoteSectionTitle}>Quote Post</Text>

              <View style={styles.quoteInputContainer}>
                <Link2
                  size={20}
                  color={colors.mutedForeground}
                  style={styles.quoteIcon}
                />
                <TextInput
                  style={styles.quoteInput}
                  placeholder="Paste a Beam post URL to quote"
                  placeholderTextColor={colors.mutedForeground}
                  value={quoteUrl}
                  onChangeText={setQuoteUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isPosting}
                />
              </View>

              {/* Quote Preview - placeholder for when we parse the URL */}
              {quoteUrl.trim() && (
                <View style={styles.quotePreview}>
                  <Text style={styles.quotePreviewText}>
                    Quote preview will appear here
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Media Selection Modal */}
      <SlideUpModal
        visible={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        title="Add Media"
        subtitle="Choose how you want to add photos or videos to your post"
        options={mediaOptions}
      />

      {/* Discard Confirmation Modal */}
      <SlideUpModal
        visible={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        title={currentDraftId ? 'Discard Changes?' : 'Discard Post?'}
        subtitle={currentDraftId 
          ? 'You have unsaved changes to this draft. Are you sure you want to discard them?'
          : 'You have unsaved changes. Are you sure you want to discard this post?'
        }
        options={discardOptions}
        showCancel={false}
      />
    </SafeAreaView>
  );
}
