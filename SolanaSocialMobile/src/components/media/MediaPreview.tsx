import React from 'react';
import {View, Pressable, Text} from 'react-native';
import {X, RotateCcw} from 'lucide-react-native';
import FastImage from 'react-native-fast-image';
import {MediaAsset, MediaUploadProgress} from '../../types/media';
import {useThemeStore} from '../../store/themeStore';
import {cn} from '../../utils/cn';

interface MediaPreviewProps {
  asset: MediaAsset;
  uploadProgress?: MediaUploadProgress;
  onRemove: (assetId: string) => void;
  onRetry?: (assetId: string) => void;
  disabled?: boolean;
}

export function MediaPreview({
  asset,
  uploadProgress,
  onRemove,
  onRetry,
  disabled = false,
}: MediaPreviewProps) {
  const {colors} = useThemeStore();

  const isUploading = uploadProgress?.uploading || false;
  const hasError = uploadProgress?.error != null;
  const progress = uploadProgress?.progress || 0;

  return (
    <View className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
      {/* Image */}
      <FastImage
        source={{uri: asset.uri}}
        className="w-full h-full"
        resizeMode={FastImage.resizeMode.cover}
      />

      {/* Upload Progress Overlay */}
      {isUploading && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <View className="bg-white rounded-full w-8 h-8 items-center justify-center">
            <Text className="text-xs font-bold text-black">
              {Math.round(progress)}%
            </Text>
          </View>
        </View>
      )}

      {/* Error Overlay */}
      {hasError && (
        <View className="absolute inset-0 bg-destructive/80 items-center justify-center">
          <Pressable
            onPress={() => onRetry?.(asset.id)}
            className="bg-white rounded-full p-1">
            <RotateCcw size={12} color={colors.destructive} />
          </Pressable>
        </View>
      )}

      {/* Remove Button */}
      {!disabled && !isUploading && (
        <Pressable
          onPress={() => onRemove(asset.id)}
          className="absolute -top-1 -right-1 bg-destructive rounded-full w-6 h-6 items-center justify-center">
          <X size={12} color="white" />
        </Pressable>
      )}

      {/* File Size */}
      {asset.size && (
        <View className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
          <Text className="text-white text-xs text-center">
            {(asset.size / 1024 / 1024).toFixed(1)}MB
          </Text>
        </View>
      )}
    </View>
  );
}
