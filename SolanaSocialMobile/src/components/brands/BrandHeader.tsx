import React from 'react';
import {View, TouchableOpacity, Linking} from 'react-native';
import {Text, Button, Badge, Avatar} from '../ui';
import {
  CheckCircle,
  Globe,
  Twitter,
  MessageCircle,
  Share2,
  Edit,
  BarChart3,
} from 'lucide-react-native';
import FastImage from 'react-native-fast-image';
import {BrandProfile} from '../../types/brands';
import LinearGradient from 'react-native-linear-gradient';

interface BrandHeaderProps {
  brand: BrandProfile;
  isFollowing: boolean;
  onFollow: () => void;
  onShare: () => void;
}

export function BrandHeader({
  brand,
  isFollowing,
  onFollow,
  onShare,
}: BrandHeaderProps) {
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View>
      {/* Banner */}
      <View className="h-48 relative">
        {brand.banner ? (
          <FastImage
            source={{uri: brand.banner}}
            className="absolute inset-0"
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={[brand.colors?.primary || '#3B82F6', brand.colors?.secondary || '#64748B']}
            className="absolute inset-0"
          />
        )}

        {/* Action Buttons */}
        <View className="absolute top-4 right-4 flex-row gap-2">
          <TouchableOpacity
            onPress={onShare}
            className="bg-background/80 rounded-full p-2">
            <Share2 className="h-5 w-5" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Info */}
      <View className="px-4 -mt-12">
        {/* Logo */}
        <View className="mb-4">
          <Avatar
            source={{uri: brand.logo}}
            size="xl"
            className="border-4 border-background"
          />
        </View>

        {/* Name and Verification */}
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-2xl font-bold">{brand.displayName}</Text>
          {brand.isVerified && <CheckCircle className="h-6 w-6 text-primary" />}
        </View>

        {/* Handle and Category */}
        <View className="flex-row items-center gap-3 mb-3">
          <Text className="text-muted-foreground">@{brand.handle}</Text>
          <Badge variant="secondary">{brand.category}</Badge>
        </View>

        {/* Bio */}
        <Text className="mb-4">{brand.bio}</Text>

        {/* Links */}
        <View className="flex-row gap-3 mb-4">
          {brand.website && (
            <TouchableOpacity onPress={() => openLink(brand.website!)}>
              <Globe className="h-5 w-5 text-muted-foreground" />
            </TouchableOpacity>
          )}
          {brand.socialLinks.twitter && (
            <TouchableOpacity
              onPress={() =>
                openLink(`https://twitter.com/${brand.socialLinks.twitter}`)
              }>
              <Twitter className="h-5 w-5 text-muted-foreground" />
            </TouchableOpacity>
          )}
          {brand.socialLinks.discord && (
            <TouchableOpacity
              onPress={() => openLink(brand.socialLinks.discord!)}>
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
            </TouchableOpacity>
          )}
        </View>

        {/* Follow Button */}
        <Button
          onPress={onFollow}
          variant={isFollowing ? 'outline' : 'default'}
          className="w-full">
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      </View>
    </View>
  );
}
