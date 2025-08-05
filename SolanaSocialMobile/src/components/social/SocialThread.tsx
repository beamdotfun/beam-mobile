import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {Plus, Users, Lock, Globe, X} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';
import {useSocialAdvancedStore} from '../../store/socialAdvancedStore';
import {SocialThread as ThreadType} from '../../types/social-advanced';
import {formatDistanceToNow} from 'date-fns';

interface SocialThreadProps {
  thread: ThreadType;
  onPress: () => void;
  onLeave?: () => void;
}

interface CreateThreadModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateThread: (
    title: string,
    description?: string,
    isPublic?: boolean,
  ) => void;
}

const CreateThreadModal: React.FC<CreateThreadModalProps> = ({
  visible,
  onClose,
  onCreateThread,
}) => {
  const {colors} = useThemeStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Thread title is required');
      return;
    }

    onCreateThread(title, description, isPublic);

    // Reset form
    setTitle('');
    setDescription('');
    setIsPublic(true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View className="flex-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
        <View className="flex-1 mt-20">
          <View
            className="flex-1 rounded-t-2xl p-4"
            style={{backgroundColor: colors.background}}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-xl font-bold"
                style={{color: colors.foreground}}>
                Create Thread
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View className="space-y-4">
              <View>
                <Text
                  className="text-sm font-medium mb-2"
                  style={{color: colors.foreground}}>
                  Title
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter thread title"
                  placeholderTextColor={colors.mutedForeground}
                  className="p-3 rounded-lg text-base"
                  style={{
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                  }}
                  maxLength={100}
                />
              </View>

                <Text
                  className="text-sm font-medium mb-2"
                  style={{color: colors.foreground}}>
                  Description (Optional)
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What's this thread about?"
                  placeholderTextColor={colors.mutedForeground}
                  className="p-3 rounded-lg text-base"
                  style={{
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                    minHeight: 80,
                  }}
                  multiline
                  maxLength={500}
                />
              </View>

                <Text
                  className="text-sm font-medium mb-2"
                  style={{color: colors.foreground}}>
                  Privacy
                </Text>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => setIsPublic(true)}
                    className={`flex-1 flex-row items-center justify-center p-3 rounded-lg ${
                      isPublic ? 'border-2' : ''
                    }`}
                    style={{
                      backgroundColor: colors.muted,
                      borderColor: isPublic ? colors.primary : 'transparent',
                    }}>
                    <Globe
                      size={20}
                      color={isPublic ? colors.primary : colors.mutedForeground}
                    />
                    <Text
                      className="ml-2"
                      style={{
                        color: isPublic ? colors.primary : colors.foreground,
                      }}>
                      Public
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsPublic(false)}
                    className={`flex-1 flex-row items-center justify-center p-3 rounded-lg ${
                      !isPublic ? 'border-2' : ''
                    }`}
                    style={{
                      backgroundColor: colors.muted,
                      borderColor: !isPublic ? colors.primary : 'transparent',
                    }}>
                    <Lock
                      size={20}
                      color={
                        !isPublic ? colors.primary : colors.mutedForeground
                      }
                    />
                    <Text
                      className="ml-2"
                      style={{
                        color: !isPublic ? colors.primary : colors.foreground,
                      }}>
                      Private
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View className="flex-row space-x-3 mt-8">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 p-3 rounded-lg"
                style={{backgroundColor: colors.muted}}>
                <Text
                  className="text-center font-medium"
                  style={{color: colors.foreground}}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreate}
                className="flex-1 p-3 rounded-lg"
                style={{backgroundColor: colors.primary}}>
                <Text
                  className="text-center font-medium"
                  style={{color: colors.primaryForeground}}>
                  Create Thread
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const SocialThreadCard: React.FC<SocialThreadProps> = ({
  thread,
  onPress,
  onLeave,
}) => {
  const {colors} = useThemeStore();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="mx-4 my-2 p-4 rounded-lg"
      style={{backgroundColor: colors.card}}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text
              className="text-lg font-semibold"
              style={{color: colors.foreground}}>
              {thread.title}
            </Text>
            {!thread.isPublic && (
              <Lock size={16} color={colors.mutedForeground} className="ml-2" />
            )}
          </View>

          {thread.description && (
            <Text
              className="text-sm mt-1"
              style={{color: colors.mutedForeground}}
              numberOfLines={2}>
              {thread.description}
            </Text>
          )}

          <View className="flex-row items-center mt-3 space-x-4">
            <View className="flex-row items-center">
              <Users size={14} color={colors.mutedForeground} />
              <Text
                className="text-xs ml-1"
                style={{color: colors.mutedForeground}}>
                {thread.participantCount} participants
              </Text>
            </View>

            <Text className="text-xs" style={{color: colors.mutedForeground}}>
              {thread.posts.length} posts
            </Text>

            <Text className="text-xs" style={{color: colors.mutedForeground}}>
              {formatDistanceToNow(new Date(thread.updatedAt), {
                addSuffix: true,
              })}
            </Text>
          </View>

          {thread.hashtags.length > 0 && (
            <View className="flex-row flex-wrap mt-2">
              {thread.hashtags.slice(0, 3).map(tag => (
                <View
                  key={tag}
                  className="px-2 py-1 rounded-full mr-2 mb-1"
                  style={{backgroundColor: colors.muted}}>
                  <Text className="text-xs" style={{color: colors.primary}}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {onLeave && (
          <TouchableOpacity
            onPress={e => {
              e.stopPropagation();
              onLeave();
            }}
            className="ml-3">
            <Text className="text-sm" style={{color: colors.destructive}}>
              Leave
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const SocialThreadsList: React.FC = () => {
  const {colors} = useThemeStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const {threads, createThread, leaveThread} = useSocialAdvancedStore();

  const handleCreateThread = async (
    title: string,
    description?: string,
    isPublic = true,
  ) => {
    try {
      await createThread(title, description);
      setShowCreateModal(false);
      Alert.alert('Success', 'Thread created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create thread');
    }
  };

  const handleLeaveThread = async (threadId: string) => {
    Alert.alert('Leave Thread', 'Are you sure you want to leave this thread?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveThread(threadId);
            Alert.alert('Success', 'You have left the thread');
          } catch (error) {
            Alert.alert('Error', 'Failed to leave thread');
          }
        },
      },
    ]);
  };

  return (
    <>
      <FlatList
        data={threads}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            className="mx-4 my-2 px-3 py-1.5 rounded-md flex-row items-center justify-center border shadow-sm"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e5e7eb',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}>
            <Plus size={14} color={colors.primary} />
            <Text
              className="ml-1 text-xs font-semibold uppercase tracking-wider"
              style={{color: colors.foreground}}>
              NEW THREAD
            </Text>
          </TouchableOpacity>
        }
        renderItem={({item}) => (
          <SocialThreadCard
            thread={item}
            onPress={() => {
              // Navigate to thread detail
              console.log('Navigate to thread:', item.id);
            }}
            onLeave={() => handleLeaveThread(item.id)}
          />
        )}
        ListEmptyComponent={
          <View className="p-8 items-center">
            <Text
              className="text-center"
              style={{color: colors.mutedForeground}}>
              No threads yet. Create one to start a focused discussion!
            </Text>
          </View>
        }
      />

      <CreateThreadModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateThread={handleCreateThread}
      />
    </>
  );
};
