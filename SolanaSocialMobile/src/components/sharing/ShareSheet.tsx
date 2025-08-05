import React, {useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  Platform,
  Modal,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {Share as ShareIcon, Link, X, QrCode} from 'lucide-react-native';
import {Card, CardContent} from '../ui/card';
import {Button} from '../ui/button';
import {useThemeStore} from '../../store/themeStore';
import {deepLinkService} from '../../services/deepLinkService';

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  type: 'post' | 'profile' | 'brand' | 'auction';
  id: string;
  title?: string;
  message?: string;
  onQRShare?: () => void;
}

export function ShareSheet({
  visible,
  onClose,
  type,
  id,
  title,
  message,
  onQRShare,
}: ShareSheetProps) {
  const {colors} = useThemeStore();

  const getShareUrl = () => {
    switch (type) {
      case 'post':
        return deepLinkService.generatePostLink(id);
      case 'profile':
        return deepLinkService.generateProfileLink(id);
      case 'brand':
        return deepLinkService.generateBrandLink(id);
      case 'auction':
        return deepLinkService.generateAuctionLink(id);
      default:
        return '';
    }
  };

  const getShareTitle = () => {
    if (title) {
      return title;
    }

    switch (type) {
      case 'post':
        return 'Check out this post on Beam';
      case 'profile':
        return 'Check out this profile on Beam';
      case 'brand':
        return 'Check out this brand on Beam';
      case 'auction':
        return 'Check out this auction on Beam';
      default:
        return 'Check this out on Beam';
    }
  };

  const handleShare = async () => {
    try {
      const url = getShareUrl();
      const shareMessage = message || getShareTitle();

      const result = await Share.share({
        message:
          Platform.OS === 'ios' ? shareMessage : `${shareMessage} ${url}`,
        url: Platform.OS === 'ios' ? url : undefined,
        title: getShareTitle(),
      });

      if (result.action === Share.sharedAction) {
        // TODO: Track sharing analytics
        console.log('Content shared:', {
          type,
          id,
          method: result.activityType || 'unknown',
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to share:', error);
      // TODO: Show toast notification
    }
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    Clipboard.setString(url);

    // TODO: Show toast notification
    console.log('Link copied to clipboard');

    // TODO: Track copying analytics
    console.log('Link copied:', {
      type,
      id,
    });

    onClose();
  };

  const handleQRShare = () => {
    onQRShare?.();
    onClose();
  };

  const shareOptions = [
    {
      icon: ShareIcon,
      label: 'Share',
      onPress: handleShare,
      description: 'Share via other apps',
    },
    {
      icon: Link,
      label: 'Copy Link',
      onPress: handleCopyLink,
      description: 'Copy link to clipboard',
    },
    ...(onQRShare
      ? [
          {
            icon: QrCode,
            label: 'QR Code',
            onPress: handleQRShare,
            description: 'Share as QR code',
          },
        ]
      : []),
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <Card className="rounded-t-xl rounded-b-none">
          <CardContent className="p-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-foreground">
                Share {type}
              </Text>

              <TouchableOpacity onPress={onClose} className="p-1">
                <X size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Share URL Preview */}
            <View className="bg-muted rounded-lg p-3 mb-6">
              <Text className="text-muted-foreground text-sm mb-1">
                Share URL:
              </Text>
              <Text
                className="text-foreground text-sm font-mono"
                numberOfLines={2}
                ellipsizeMode="middle">
                {getShareUrl()}
              </Text>
            </View>

            {/* Share Options */}
            <View className="space-y-2">
              {shareOptions.map((option, index) => {
                const IconComponent = option.icon;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={option.onPress}
                    className="flex-row items-center p-3 rounded-lg bg-muted/30 active:bg-muted/50">
                    <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-3">
                      <IconComponent size={20} color={colors.primary} />
                    </View>

                    <View className="flex-1">
                      <Text className="text-foreground font-medium text-base">
                        {option.label}
                      </Text>
                      <Text className="text-muted-foreground text-sm">
                        {option.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cancel Button */}
            <Button variant="outline" onPress={onClose} className="mt-6">
              <Text className="text-foreground font-medium">Cancel</Text>
            </Button>
          </CardContent>
        </Card>
      </View>
    </Modal>
  );
}
