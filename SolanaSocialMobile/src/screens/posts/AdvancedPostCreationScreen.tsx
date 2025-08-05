import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {usePostCreationStore} from '../../store/postCreationStore';
import {useThemeStore} from '../../store/themeStore';
import {PostType, QuotedPostData} from '../../types/post-creation';
import {Button} from '../../components/ui/button';
import {Card, CardContent} from '../../components/ui/card';
import {MediaPicker} from '../../components/media/MediaPicker';
import {QuotedPostPreview} from '../../components/posts/QuotedPostPreview';
import {MarkdownEditor} from '../../components/ui/MarkdownEditor';
import {X, Eye, EyeOff, Calendar, Globe, Users} from 'lucide-react-native';

interface RouteParams {
  type?: PostType;
  quotedPost?: QuotedPostData;
  draftId?: string;
}

export function AdvancedPostCreationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {colors} = useThemeStore();
  const {type, quotedPost, draftId} = (route.params as RouteParams) || {};

  const {
    currentDraft,
    isCreating,
    error,
    createDraft,
    updateDraft,
    publishDraft,
    addMedia,
    addQuote,
    removeQuote,
    setCurrentDraft,
    clearError,
    drafts,
  } = usePostCreationStore();

  const [text, setText] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);

  useEffect(() => {
    if (draftId) {
      // Load existing draft
      const draft = drafts.find(d => d.id === draftId);
      if (draft) {
        setCurrentDraft(draft);
        setText(draft.content.text);
        setMarkdown(draft.content.markdown || '');
      }
    } else {
      // Create new draft
      const newDraft = createDraft(type || 'text');
      if (quotedPost) {
        addQuote(newDraft.id, quotedPost);
      }
    }

    // Cleanup on unmount
    return () => {
      setCurrentDraft(null);
    };
  }, [draftId, type, quotedPost]);

  useEffect(() => {
    if (currentDraft) {
      setText(currentDraft.content.text);
      setMarkdown(currentDraft.content.markdown || '');
    }
  }, [currentDraft]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error]);

  const handleTextChange = (newText: string) => {
    setText(newText);
    if (currentDraft) {
      updateDraft(currentDraft.id, {
        content: {...currentDraft.content, text: newText},
      });
    }
  };

  const handleMarkdownChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
    if (currentDraft) {
      updateDraft(currentDraft.id, {
        content: {...currentDraft.content, markdown: newMarkdown},
      });
    }
  };

  const handleMediaSelected = (
    mediaUri: string,
    mediaType: 'image' | 'video',
  ) => {
    if (currentDraft) {
      addMedia(currentDraft.id, {
        type: mediaType,
        uri: mediaUri,
        size: 0, // Will be calculated
      });
    }
  };

  const handlePublish = async () => {
    if (!currentDraft) {
      return;
    }

    if (
      !text.trim() &&
      !currentDraft.quotedPost &&
      currentDraft.media.length === 0
    ) {
      Alert.alert('Error', 'Please add some content to your post');
      return;
    }

    try {
      await publishDraft(currentDraft.id);
      Alert.alert('Success', 'Post published successfully!', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      // Error is handled in useEffect
    }
  };

  const handleRemoveQuote = () => {
    if (currentDraft) {
      removeQuote(currentDraft.id);
    }
  };

  const handleVisibilityChange = () => {
    if (currentDraft) {
      updateDraft(currentDraft.id, {
        visibility:
          currentDraft.visibility === 'public' ? 'followers' : 'public',
      });
    }
  };

  if (!currentDraft) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
        <View className="flex-1 justify-center items-center">
          <Text style={{color: colors.mutedForeground}}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <View className="flex-1">
          {/* Header */}
          <View
            className="border-b px-4 py-3"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}>
            <View className="flex-row justify-between items-center">
              <Pressable onPress={() => navigation.goBack()} className="p-2">
                <X size={24} color={colors.foreground} />
              </Pressable>
              <Text
                className="text-lg font-semibold"
                style={{color: colors.foreground}}>
                Create Post
              </Text>
              <Button
                onPress={handlePublish}
                disabled={
                  isCreating ||
                  (!text.trim() &&
                    !currentDraft.quotedPost &&
                    currentDraft.media.length === 0)
                }
                size="sm">
                <Text className="text-primary-foreground font-medium">
                  {isCreating ? 'Publishing...' : 'Publish'}
                </Text>
              </Button>
            </View>
          </View>

          <ScrollView className="flex-1 p-4">
            {/* Quoted Post Preview */}
            {currentDraft.quotedPost && (
              <View className="mb-4">
                <QuotedPostPreview
                  quotedPost={currentDraft.quotedPost}
                  onRemove={handleRemoveQuote}
                />
              </View>
            )}

            {/* Text Input */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <TextInput
                  multiline
                  numberOfLines={6}
                  value={text}
                  onChangeText={handleTextChange}
                  placeholder={
                    currentDraft.quotedPost
                      ? 'Add your thoughts...'
                      : "What's happening?"
                  }
                  placeholderTextColor={colors.mutedForeground}
                  style={{
                    textAlignVertical: 'top',
                    color: colors.foreground,
                    fontSize: 16,
                    minHeight: 120,
                  }}
                />
              </CardContent>
            </Card>

            {/* Markdown Editor Toggle */}
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className="text-sm font-medium"
                style={{color: colors.foreground}}>
                Advanced Formatting
              </Text>
              <Button
                variant="outline"
                size="sm"
                onPress={() => setShowMarkdownEditor(!showMarkdownEditor)}>
                {showMarkdownEditor ? (
                  <EyeOff size={16} color={colors.foreground} />
                ) : (
                  <Eye size={16} color={colors.foreground} />
                )}
                <Text
                  className="text-sm ml-2"
                  style={{color: colors.foreground}}>
                  {showMarkdownEditor ? 'Hide' : 'Show'} Markdown
                </Text>
              </Button>
            </View>

            {/* Markdown Editor */}
            {showMarkdownEditor && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <MarkdownEditor
                    value={markdown}
                    onChange={handleMarkdownChange}
                    placeholder="Use markdown for rich formatting..."
                  />
                </CardContent>
              </Card>
            )}

            {/* Media Picker */}
            <MediaPicker
              onMediaSelected={handleMediaSelected}
              maxMedia={4}
              existingMedia={currentDraft.media}
              onRemoveMedia={mediaId => {
                if (currentDraft) {
                  usePostCreationStore
                    .getState()
                    .removeMedia(currentDraft.id, mediaId);
                }
              }}
            />

            {/* Post Options */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <Text
                  className="font-medium mb-3"
                  style={{color: colors.foreground}}>
                  Post Options
                </Text>
                <View className="space-y-3">
                  {/* Visibility */}
                  <Pressable
                    onPress={handleVisibilityChange}
                    className="flex-row justify-between items-center py-2">
                    <View className="flex-row items-center">
                      {currentDraft.visibility === 'public' ? (
                        <Globe size={20} color={colors.primary} />
                      ) : (
                        <Users size={20} color={colors.primary} />
                      )}
                      <Text
                        className="text-sm ml-3"
                        style={{color: colors.foreground}}>
                        Visibility
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text
                        className="text-sm font-medium"
                        style={{color: colors.primary}}>
                        {currentDraft.visibility === 'public'
                          ? 'Public'
                          : 'Followers'}
                      </Text>
                    </View>
                  </Pressable>

                  {/* Schedule */}
                  <Pressable
                    onPress={() => {
                      // TODO: Implement scheduling
                      Alert.alert(
                        'Coming Soon',
                        'Post scheduling will be available soon!',
                      );
                    }}
                    className="flex-row justify-between items-center py-2">
                    <View className="flex-row items-center">
                      <Calendar size={20} color={colors.mutedForeground} />
                      <Text
                        className="text-sm ml-3"
                        style={{color: colors.foreground}}>
                        Schedule
                      </Text>
                    </View>
                    <Text
                      className="text-sm"
                      style={{color: colors.mutedForeground}}>
                      Not scheduled
                    </Text>
                  </Pressable>
                </View>
              </CardContent>
            </Card>

            {/* Character count */}
            <View className="mt-4 mb-8">
              <Text
                className="text-xs text-center"
                style={{color: colors.mutedForeground}}>
                {text.length} characters
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
