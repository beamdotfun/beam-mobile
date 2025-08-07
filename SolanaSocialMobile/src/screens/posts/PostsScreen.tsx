import React, {useState, useCallback, useRef, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Plus,
  GripVertical,
  X,
  Bot,
  Image,
  Video,
  Eye,
  Trash2,
  FileText,
  ArrowLeftRight,
  Edit3,
} from 'lucide-react-native';
import {Avatar} from '../../components/ui/avatar';
import {SegmentedControl} from '../../components/ui/SegmentedControl';
import {AppNavBar} from '../../components/navigation/AppNavBar';
import {useThemeStore} from '../../store/themeStore';
import {useAuthStore} from '../../store/auth';
import {useDraftsStore} from '../../store/draftsStore';
import {getAvatarFallback} from '../../lib/utils';
import {FeedSkeleton} from '../../components/loading/FeedSkeleton';
import {EnhancedErrorState} from '../../components/ui/EnhancedErrorState';
import {useEnhancedRefresh} from '../../hooks/useEnhancedRefresh';

interface PostsScreenProps {
  navigation: any;
}

interface ThreadPost {
  id: string;
  content: string;
  order: number;
  originalDraftId?: number; // For tracking original draft when editing
}

// ThreadPostCard component - moved outside to prevent re-creation on every render
const ThreadPostCard = React.memo(({
  item, 
  index, 
  user,
  colors,
  threadPosts,
  handleUpdateThreadPost,
  handleRemoveThreadPost,
  handleMediaAction
}: {
  item: ThreadPost;
  index: number;
  user: any;
  colors: any;
  threadPosts: ThreadPost[];
  handleUpdateThreadPost: (id: string, content: string) => void;
  handleRemoveThreadPost: (id: string) => void;
  handleMediaAction: (type: string, postId: string) => void;
}) => (
  <View style={[{
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  }]}>
    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
      <View style={{marginRight: 12}}>
        <GripVertical size={16} color={colors.mutedForeground} />
      </View>
      <Avatar
        src={user?.profilePicture}
        fallback={getAvatarFallback(user)}
        size="sm"
        showRing={user?.isVerified}
        ringColor={colors.success}
      />
      <View style={{flex: 1, alignItems: 'flex-end'}}>
        {threadPosts.length > 1 && (
          <Pressable
            style={{padding: 8}}
            onPress={() => handleRemoveThreadPost(item.id)}>
            <X size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
    </View>

    <View style={{flex: 1}}>
      <TextInput
        style={{
          fontSize: 16,
          fontFamily: 'Inter-Regular',
          minHeight: 80,
          textAlignVertical: 'top',
          color: colors.foreground
        }}
        placeholder="What's happening?"
        placeholderTextColor={colors.mutedForeground}
        multiline
        value={item.content}
        onChangeText={text => handleUpdateThreadPost(item.id, text)}
        maxLength={420}
      />
      <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4}}>
        <Text style={{fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter-Regular'}}>
          {item.content.length}/420
        </Text>
      </View>
    </View>

    <View style={{height: 1, backgroundColor: colors.border, marginVertical: 12}} />

    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
      <View style={{flexDirection: 'row', gap: 16}}>
        <Pressable
          style={{padding: 4}}
          onPress={() => handleMediaAction('AI', item.id)}>
          <Bot size={18} color={colors.mutedForeground} />
        </Pressable>
        <Pressable
          style={{padding: 4}}
          onPress={() => handleMediaAction('image', item.id)}>
          <Image size={18} color={colors.mutedForeground} />
        </Pressable>
        <Pressable
          style={{padding: 4}}
          onPress={() => handleMediaAction('video', item.id)}>
          <Video size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <Text style={{fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter-Regular'}}>
        post {index + 1}/{threadPosts.length}
      </Text>
    </View>
  </View>
));

export default function PostsScreen({navigation}: PostsScreenProps) {
  const {colors} = useThemeStore();
  const {user} = useAuthStore();
  const {drafts, threads, isLoading, error, loadDrafts, loadThreads, deleteDraft, selectDraft, createDraft, clearError} = useDraftsStore();
  const [selectedTab, setSelectedTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [threadTitle, setThreadTitle] = useState('');
  const [threadPosts, setThreadPosts] = useState<ThreadPost[]>([
    {id: '1', content: '', order: 0},
  ]);
  const [isSavingThreadDraft, setIsSavingThreadDraft] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const tabs = ['New Post', 'Threads', 'Drafts'];

  // Handle refresh for drafts tab
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadDrafts(), loadThreads()]);
    setRefreshing(false);
  }, [loadDrafts, loadThreads]);

  // Enhanced refresh with haptic feedback
  const { enhancedOnRefresh, tintColor: refreshTintColor, colors: refreshColors, handleRefreshStateChange } = useEnhancedRefresh({
    onRefresh: handleRefresh,
    tintColor: colors.primary
  });
  
  // Track refresh state changes for haptic feedback
  useEffect(() => {
    handleRefreshStateChange(refreshing || isLoading);
  }, [refreshing, isLoading, handleRefreshStateChange]);

  // Load drafts and threads when the Drafts tab is selected
  useEffect(() => {
    if (selectedTab === 2) {
      clearError(); // Clear any previous errors when switching to drafts tab
      loadDrafts();
      loadThreads();
    }
  }, [selectedTab, loadDrafts, loadThreads, clearError]);

  // Process drafts using new thread system
  const processedDrafts = useMemo(() => {
    console.log('📋 Processing drafts with new thread system:', {
      regularDrafts: drafts.filter(d => !d.isThread).length,
      threads: threads.length,
      totalThreadPosts: threads.reduce((sum, t) => sum + t.postCount, 0)
    });
    
    // Convert threads to display format
    const threadEntries = threads.map(thread => ({
      id: `thread-${thread.threadId}`,
      isThreadGroup: true,
      threadId: thread.threadId,
      threadTitle: thread.threadTitle,
      displayMessage: thread.threadTitle || (thread.posts[0]?.message || 'Empty thread'),
      threadPostCount: thread.postCount,
      threadChain: thread.posts,
      // Use first post's timestamps for sorting
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    }));
    
    // Get regular (non-thread) drafts
    const regularDrafts = drafts.filter(d => !d.isThread);
    
    // Combine and sort
    const allProcessedDrafts = [...threadEntries, ...regularDrafts];
    
    console.log('📋 Final processed drafts:', {
      threads: threadEntries.length,
      regularDrafts: regularDrafts.length,
      total: allProcessedDrafts.length
    });
    
    return allProcessedDrafts.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [drafts, threads]);

  const handleCreatePost = useCallback(() => {
    console.log('Navigate to create post');
    navigation.navigate('CreatePost');
  }, [navigation]);

  const handleAddThreadPost = useCallback(() => {
    const newPost: ThreadPost = {
      id: Date.now().toString(),
      content: '',
      order: threadPosts.length,
    };
    setThreadPosts([...threadPosts, newPost]);
  }, [threadPosts]);

  const handleUpdateThreadPost = useCallback((id: string, content: string) => {
    setThreadPosts(prev =>
      prev.map(post => (post.id === id ? {...post, content} : post))
    );
  }, []);

  const handleRemoveThreadPost = useCallback((id: string) => {
    if (threadPosts.length === 1) return; // Keep at least one post
    setThreadPosts(prev => prev.filter(post => post.id !== id));
  }, [threadPosts]);

  const handleSaveThreadDraft = useCallback(async () => {
    setIsSavingThreadDraft(true);
    
    try {
      // Filter posts with content
      const postsWithContent = threadPosts.filter(post => post.content.trim());
      
      if (postsWithContent.length === 0) {
        Alert.alert('Empty Thread', 'Please add some content to your thread before saving.');
        return;
      }
      
      console.log('📝 Saving thread using new server-side API with thread title support:', {
        title: threadTitle,
        postsCount: postsWithContent.length,
        isEditing: !!editingThreadId,
        editingThreadId
      });
      
      if (editingThreadId) {
        // Editing existing thread - delete old posts and create new ones
        console.log('📝 Updating existing thread:', editingThreadId);
        
        // Find the thread being edited
        const thread = threads.find(t => t.threadId === editingThreadId);
        if (thread) {
          // Delete all existing posts in the thread
          console.log('🗑️ Deleting existing thread posts...');
          for (const post of thread.posts) {
            await deleteDraft(post.id);
          }
        }
        
        // Create new thread with updated content
        const threadDraftsPayload = {
          threadDrafts: {
            title: threadTitle.trim() || undefined,
            posts: postsWithContent.map((post) => ({
              message: post.content.trim(),
              images: [],
            })),
          }
        };
        
        console.log('📝 Creating updated thread with payload:', threadDraftsPayload);
        const savedThread = await createDraft(threadDraftsPayload);
        
        if (!savedThread) {
          throw new Error('Failed to update thread draft');
        }
        
        console.log('✅ Thread updated successfully:', savedThread);
        
        // Clear editing state
        setEditingThreadId(null);
        
      } else {
        // Creating new thread
        console.log('📝 Creating new thread');
        
        const threadDraftsPayload = {
          threadDrafts: {
            title: threadTitle.trim() || undefined,
            posts: postsWithContent.map((post) => ({
              message: post.content.trim(),
              images: [],
            })),
          }
        };
        
        console.log('📝 Thread drafts payload with title support:', threadDraftsPayload);
        
        const {createDraft} = useDraftsStore.getState();
        const savedThread = await createDraft(threadDraftsPayload);
        
        if (!savedThread) {
          throw new Error('Failed to save thread draft');
        }
        
        console.log('✅ Thread saved successfully:', savedThread);
      }
      
      // Refresh drafts and threads list to show newly saved thread drafts
      await loadDrafts();
      await loadThreads();
      
      const isEditing = !!editingThreadId;
      Alert.alert(
        isEditing ? 'Thread Updated' : 'Thread Saved',
        `Your thread has been ${isEditing ? 'updated' : 'saved'} as ${postsWithContent.length} connected draft${postsWithContent.length > 1 ? 's' : ''}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset the thread builder after successful save
              setThreadTitle('');
              setThreadPosts([{id: '1', content: '', order: 0}]);
              setEditingThreadId(null);
            },
          },
        ],
      );
      
    } catch (error) {
      console.error('🚨 Failed to save thread draft:', error);
      Alert.alert(
        'Error',
        `Failed to save thread draft: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsSavingThreadDraft(false);
    }
  }, [threadTitle, threadPosts, loadDrafts]);

  const handleSendThread = useCallback(() => {
    // Filter posts with content
    const postsWithContent = threadPosts.filter(post => post.content.trim());
    
    if (postsWithContent.length === 0) {
      Alert.alert('Empty Thread', 'Please add some content to your thread before sending.');
      return;
    }
    
    // Navigate to thread send screen
    navigation.navigate('ThreadSend', {
      threadPosts: postsWithContent,
      threadTitle: threadTitle.trim() || undefined,
    });
  }, [threadTitle, threadPosts, navigation]);

  const handlePreviewDraft = useCallback((itemId: string | number) => {
    console.log('📝 Handling draft/thread edit:', { itemId, type: typeof itemId });
    
    // Check if this is a thread ID (string starting with "thread-")
    if (typeof itemId === 'string' && itemId.startsWith('thread-')) {
      const threadId = itemId.replace('thread-', '');
      const thread = threads.find(t => t.threadId === threadId);
      
      if (thread) {
        console.log('📝 Found thread for editing:', {
          threadId: thread.threadId,
          title: thread.threadTitle,
          postCount: thread.postCount
        });
        
        // Load thread into the thread builder for editing
        console.log('📝 Loading thread for editing:', {
          threadId: thread.threadId,
          posts: thread.posts.map(p => ({ id: p.id, message: p.message?.substring(0, 50) }))
        });
        
        // Load thread data into the thread builder
        loadThreadForEditing(thread);
        
        // Switch to threads tab (tab index 1)
        setSelectedTab(1);
      } else {
        Alert.alert('Error', 'Thread not found. Please refresh and try again.');
      }
    } else {
      // Handle regular draft editing
      const draftId = typeof itemId === 'string' ? parseInt(itemId) : itemId;
      const draft = drafts.find(d => d.id === draftId);
      
      if (draft) {
        console.log('📝 Found regular draft for editing:', { id: draft.id, isThread: draft.isThread });
        selectDraft(draft);
        navigation.navigate('CreatePost', {
          loadDraft: true,
          draftId: draftId,
        });
      } else {
        Alert.alert('Error', 'Draft not found. Please refresh and try again.');
      }
    }
  }, [drafts, threads, selectDraft, navigation]);

  const loadThreadForEditing = useCallback((thread: any) => {
    console.log('📝 Loading thread for editing:', thread);
    
    // Set the thread title
    setThreadTitle(thread.threadTitle || '');
    
    // Set editing thread ID
    setEditingThreadId(thread.threadId);
    
    // Convert thread posts to the thread builder format
    const threadPostsData = thread.posts
      .sort((a, b) => (a.threadIndex || 0) - (b.threadIndex || 0)) // Sort by thread index
      .map((post, index) => ({
        id: `edit-${post.id}`, // Prefix to distinguish from new posts
        content: post.message,
        order: index,
        originalDraftId: post.id, // Keep reference to original draft ID
      }));
    
    // Ensure we have at least one post
    if (threadPostsData.length === 0) {
      threadPostsData.push({
        id: '1',
        content: '',
        order: 0,
      });
    }
    
    setThreadPosts(threadPostsData);
    
    console.log('📝 Thread loaded for editing:', {
      title: thread.threadTitle,
      postsCount: threadPostsData.length,
      posts: threadPostsData.map(p => ({ id: p.id, content: p.content?.substring(0, 30) }))
    });
  }, []);

  const handleDeleteDraft = useCallback((itemId: string | number) => {
    console.log('🗑️ Handling draft/thread delete:', { itemId, type: typeof itemId });
    
    // Check if this is a thread ID
    if (typeof itemId === 'string' && itemId.startsWith('thread-')) {
      const threadId = itemId.replace('thread-', '');
      const thread = threads.find(t => t.threadId === threadId);
      
      if (thread) {
        Alert.alert(
          'Delete Thread',
          `Are you sure you want to delete this thread with ${thread.postCount} posts?`,
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Delete Thread',
              style: 'destructive',
              onPress: async () => {
                // TODO: Implement thread deletion
                // For now, delete individual posts
                let allSuccessful = true;
                for (const post of thread.posts) {
                  const success = await deleteDraft(post.id);
                  if (!success) {
                    allSuccessful = false;
                    break;
                  }
                }
                
                if (allSuccessful) {
                  // Refresh both lists
                  await loadDrafts();
                  await loadThreads();
                } else {
                  Alert.alert('Error', 'Failed to delete some thread posts');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Thread not found. Please refresh and try again.');
      }
    } else {
      // Handle regular draft deletion
      const draftId = typeof itemId === 'string' ? parseInt(itemId) : itemId;
      Alert.alert(
        'Delete Draft',
        'Are you sure you want to delete this draft?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const success = await deleteDraft(draftId);
              if (!success) {
                Alert.alert('Error', 'Failed to delete draft');
              }
            },
          },
        ]
      );
    }
  }, [deleteDraft, threads, loadDrafts, loadThreads]);

  const handleMediaAction = useCallback((action: string, postId: string) => {
    console.log(`${action} action for post:`, postId);
  }, []);

  const tabsElevation = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 4],
    extrapolate: 'clamp',
  });


  const DraftCard = ({item}: {item: any}) => (
    <View style={[styles.draftCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={styles.draftContent}>
        {/* First row: Just the title/message */}
        <Text style={[styles.draftTitle, {color: colors.foreground}]} numberOfLines={2}>
          {item.isThreadGroup ? item.displayMessage : item.message}
        </Text>
        
        {/* Second row: Pill (if thread) + Date */}
        <View style={styles.draftMeta}>
          <View style={styles.draftMetaLeft}>
            {item.isThreadGroup && (
              <View style={[styles.threadPill, {backgroundColor: colors.primary}]}>
                <Text style={[styles.threadPillText, {color: colors.primaryForeground}]}>
                  Thread ({item.threadPostCount})
                </Text>
              </View>
            )}
            <Text style={[styles.draftDate, {color: colors.mutedForeground}]}>
              {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.draftActions}>
        <Pressable
          style={styles.draftActionButton}
          onPress={() => handlePreviewDraft(item.id)}>
          <Edit3 size={18} color={colors.mutedForeground} />
        </Pressable>
        <Pressable
          style={styles.draftActionButton}
          onPress={() => handleDeleteDraft(item.id)}>
          <Trash2 size={18} color={colors.destructive} />
        </Pressable>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter-Regular',
      marginTop: 4,
    },
    tabsContainer: {
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    content: {
      flex: 1,
    },
    // New Post Tab
    composeContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    composeButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    composeButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 8,
    },
    // Threads Tab
    threadsContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    threadTitleContainer: {
      marginTop: 16,
      marginBottom: 16,
    },
    editingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.muted,
      borderRadius: 8,
    },
    editingText: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    cancelEditButton: {
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    cancelEditText: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
    },
    threadTitleInput: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: 'Inter-Regular',
    },
    threadsList: {
      flex: 1,
    },
    threadPostCard: {
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 16,
      padding: 16,
    },
    threadPostHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    dragHandle: {
      marginRight: 12,
      padding: 4,
    },
    threadPostActions: {
      flex: 1,
      alignItems: 'flex-end',
    },
    removeButton: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    threadPostContent: {
      marginLeft: 44, // Align with avatar
    },
    threadTextInput: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      minHeight: 60,
      textAlignVertical: 'top',
    },
    characterCounter: {
      alignItems: 'flex-end',
      marginTop: 8,
    },
    counterText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
    },
    threadPostDivider: {
      height: 1,
      marginVertical: 12,
      marginLeft: 44,
    },
    threadPostFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginLeft: 44,
    },
    mediaToolbar: {
      flexDirection: 'row',
      gap: 16,
    },
    mediaButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    postNumber: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
    },
    addPostButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.muted,
      marginBottom: 16,
    },
    addPostButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
      marginLeft: 8,
    },
    threadActionsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
      marginBottom: 16,
    },
    threadSaveButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.muted,
      alignItems: 'center',
    },
    threadSaveButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
      fontFamily: 'Inter-Medium',
    },
    threadSendButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    threadSendButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryForeground,
      fontFamily: 'Inter-SemiBold',
    },
    // Drafts Tab
    draftsList: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    draftCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    draftContent: {
      flex: 1,
    },
    draftTitle: {
      fontSize: 16,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
      marginBottom: 8,
    },
    threadPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      marginRight: 8,
    },
    threadPillText: {
      fontSize: 11,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    draftMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    draftMetaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    draftDate: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
    },
    draftActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    draftActionButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      fontFamily: 'Inter-Regular',
      marginTop: 16,
    },
    contentContainer: {
      paddingBottom: 100, // Space for bottom navigation
    },
  });

  const renderTabContent = () => {
    switch (selectedTab) {
      case 0: // New Post
        return (
          <View style={styles.composeContainer}>
            <Pressable style={styles.composeButton} onPress={handleCreatePost}>
              <Edit3 size={20} color={colors.primaryForeground} />
              <Text style={styles.composeButtonText}>Compose</Text>
            </Pressable>
          </View>
        );

      case 1: // Threads
        return (
          <View style={styles.threadsContainer}>
            <View style={styles.threadTitleContainer}>
              {editingThreadId && (
                <View style={styles.editingIndicator}>
                  <Text style={[styles.editingText, {color: colors.primary}]}>
                    ✏️ Editing Thread
                  </Text>
                  <Pressable 
                    style={styles.cancelEditButton}
                    onPress={() => {
                      setEditingThreadId(null);
                      setThreadTitle('');
                      setThreadPosts([{id: '1', content: '', order: 0}]);
                    }}>
                    <Text style={[styles.cancelEditText, {color: colors.mutedForeground}]}>
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              )}
              <TextInput
                style={[styles.threadTitleInput, {backgroundColor: colors.muted}]}
                placeholder="Thread title (optional)"
                placeholderTextColor={colors.mutedForeground}
                value={threadTitle}
                onChangeText={setThreadTitle}
              />
            </View>

            <FlatList
              data={threadPosts}
              renderItem={({item, index}) => (
                <ThreadPostCard 
                  item={item} 
                  index={index}
                  user={user}
                  colors={colors}
                  threadPosts={threadPosts}
                  handleUpdateThreadPost={handleUpdateThreadPost}
                  handleRemoveThreadPost={handleRemoveThreadPost}
                  handleMediaAction={handleMediaAction}
                />
              )}
              keyExtractor={item => item.id}
              style={styles.threadsList}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                <View>
                  <Pressable style={styles.addPostButton} onPress={handleAddThreadPost}>
                    <Plus size={16} color={colors.foreground} />
                    <Text style={styles.addPostButtonText}>Add Post</Text>
                  </Pressable>
                  
                  {/* Thread Action Buttons */}
                  <View style={styles.threadActionsContainer}>
                    <Pressable 
                      style={[styles.threadSaveButton, isSavingThreadDraft && {opacity: 0.6}]} 
                      onPress={handleSaveThreadDraft}
                      disabled={isSavingThreadDraft}>
                      <Text style={styles.threadSaveButtonText}>
                        {isSavingThreadDraft 
                          ? (editingThreadId ? 'Updating Thread...' : 'Saving Thread...') 
                          : (editingThreadId ? 'Update Thread' : 'Save Thread as Draft')
                        }
                      </Text>
                    </Pressable>
                    
                    <Pressable style={styles.threadSendButton} onPress={handleSendThread}>
                      <Text style={styles.threadSendButtonText}>Send All</Text>
                    </Pressable>
                  </View>
                </View>
              }
            />
          </View>
        );

      case 2: // Drafts
        // Only show error state if there's an actual network/auth error
        // Not when we successfully loaded but got 0 drafts
        if (error && !isLoading && !refreshing) {
          // Don't show error if we have successfully loaded data (even if empty)
          const hasLoadedSuccessfully = drafts !== undefined || threads !== undefined;
          if (!hasLoadedSuccessfully) {
            return (
              <EnhancedErrorState
                title="Can't load drafts"
                subtitle="Check your connection and try again"
                onRetry={handleRefresh}
                retryLabel="Try Again"
                retrying={refreshing || isLoading}
              />
            );
          }
        }

        return (
          <FlatList
            data={processedDrafts}
            renderItem={({item}) => <DraftCard item={item} />}
            keyExtractor={item => item.id.toString()}
            style={styles.draftsList}
            contentContainerStyle={styles.contentContainer}
            ItemSeparatorComponent={() => <View style={{height: 12}} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={enhancedOnRefresh}
                tintColor={colors.primary} // iOS spinner color
                colors={[colors.primary, colors.secondary]} // Android spinner colors  
                progressBackgroundColor={colors.card} // Android background
                progressViewOffset={0} // Normal positioning
                size="default"
                title="Pull to refresh" // iOS title
                titleColor={colors.mutedForeground} // iOS title color
              />
            }
            ListEmptyComponent={
              isLoading && processedDrafts.length === 0 ? (
                <FeedSkeleton itemCount={6} showImages={false} />
              ) : (
                <View style={styles.emptyState}>
                  <FileText size={32} color={colors.mutedForeground} />
                  <Text style={styles.emptyStateText}>
                    No drafts yet
                  </Text>
                </View>
              )
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppNavBar
        title="Posts"
        onProfilePress={() => navigation.navigate('FeedHome')}
        onNewPostPress={handleCreatePost}
      />

      {/* Tab Navigation */}
      <Animated.View 
        style={[
          styles.tabsContainer,
          {
            shadowOpacity: tabsElevation.interpolate({
              inputRange: [0, 4],
              outputRange: [0, 0.1],
            }),
            elevation: tabsElevation,
          }
        ]}>
        <SegmentedControl
          segments={tabs}
          selectedIndex={selectedTab}
          onSelectionChange={setSelectedTab}
        />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

    </SafeAreaView>
  );
}