import React, {useState} from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  Image as ImageIcon,
  Video,
  X,
  Upload,
} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';
import {PostMedia} from '../../types/post-creation';
import {Button} from '../ui/button';
import {Card, CardContent} from '../ui/card';

interface MediaPickerProps {
  onMediaSelected: (uri: string, type: 'image' | 'video') => void;
  maxMedia?: number;
  existingMedia?: PostMedia[];
  onRemoveMedia?: (mediaId: string) => void;
}

export function MediaPicker({
  onMediaSelected,
  maxMedia = 4,
  existingMedia = [],
  onRemoveMedia,
}: MediaPickerProps) {
  const {colors} = useThemeStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectMedia = () => {
    if (existingMedia.length >= maxMedia) {
      Alert.alert(
        'Limit Reached',
        `You can only add up to ${maxMedia} media items.`,
      );
      return;
    }

    // In a real implementation, this would use react-native-image-picker
    // For now, we'll show a placeholder alert
    Alert.alert('Select Media', 'Choose from:', [
      {
        text: 'Photo Library',
        onPress: () => {
          // Simulate media selection
          const mockUri = `https://picsum.photos/200/200?random=${Date.now()}`;
          onMediaSelected(mockUri, 'image');
        },
      },
      {
        text: 'Camera',
        onPress: () => {
          // Simulate camera capture
          const mockUri = `https://picsum.photos/200/200?random=${Date.now()}`;
          onMediaSelected(mockUri, 'image');
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const MediaThumbnail = ({media}: {media: PostMedia}) => (
    <View className="relative mr-2 mb-2">
      <Image
        source={{uri: media.uri}}
        className="w-20 h-20 rounded-lg"
        style={{backgroundColor: colors.border}}
      />
      {media.type === 'video' && (
        <View
          className="absolute bottom-1 left-1 px-1 rounded"
          style={{backgroundColor: 'rgba(0,0,0,0.7)'}}>
          <Text className="text-xs text-white">Video</Text>
        </View>
      )}
      {onRemoveMedia && (
        <Pressable
          onPress={() => onRemoveMedia(media.id)}
          className="absolute -top-2 -right-2 p-1 rounded-full"
          style={{backgroundColor: colors.destructive}}>
          <X size={14} color="white" />
        </Pressable>
      )}
      {media.uploadProgress !== undefined && media.uploadProgress < 100 && (
        <View
          className="absolute inset-0 rounded-lg justify-center items-center"
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          {media.uploadProgress === 0 ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-xs text-white">
              {Math.round(media.uploadProgress)}%
            </Text>
          )}
        </View>
      )}
      {media.uploadError && (
        <View
          className="absolute inset-0 rounded-lg justify-center items-center"
          style={{backgroundColor: 'rgba(239, 68, 68, 0.8)'}}>
          <Text className="text-xs text-white">Failed</Text>
        </View>
      )}
    </View>
  );

  return (
    <Card>
      <CardContent className="p-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-medium" style={{color: colors.foreground}}>
            Media
          </Text>
          <Text className="text-sm" style={{color: colors.mutedForeground}}>
            {existingMedia.length}/{maxMedia}
          </Text>
        </View>

        {/* Existing Media */}
        {existingMedia.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3">
            {existingMedia.map(media => (
              <MediaThumbnail key={media.id} media={media} />
            ))}
          </ScrollView>
        )}

        {/* Media Actions */}
        <View className="flex-row space-x-2">
          <Button
            variant="outline"
            size="sm"
            onPress={handleSelectMedia}
            disabled={existingMedia.length >= maxMedia || isLoading}
            className="flex-1">
            <ImageIcon size={16} color={colors.foreground} />
            <Text className="text-sm ml-2" style={{color: colors.foreground}}>
              Add Media
            </Text>
          </Button>
        </View>

        {/* Help Text */}
        <Text className="text-xs mt-2" style={{color: colors.mutedForeground}}>
          Add up to {maxMedia} photos or videos
        </Text>
      </CardContent>
    </Card>
  );
}
