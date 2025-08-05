import React, {useState} from 'react';
import {View, Text, Pressable, Alert} from 'react-native';
import {
  Settings,
  UserPlus,
  UserMinus,
  MessageCircle,
  Share,
  Shield,
} from 'lucide-react-native';
import FastImage from 'react-native-fast-image';
import {Avatar} from '../ui/avatar';
import {Badge} from '../ui/badge';
import {Button} from '../ui/button';
import {Card, CardContent} from '../ui/card';
import {getUserProfilePicture} from '../../utils/profileUtils';
import {useThemeStore} from '../../store/themeStore';
import {useWalletStore} from '../../store/wallet';
import {useProfileStore} from '../../store/profileStore';
import {UserProfile} from '../../types/profile';
import {cn} from '../../utils/cn';

interface ProfileHeaderProps {
  profile: UserProfile;
  onEditPress?: () => void;
  onSettingsPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

export function ProfileHeader({
  profile,
  onEditPress,
  onSettingsPress,
  onFollowersPress,
  onFollowingPress,
}: ProfileHeaderProps) {
  const {colors} = useThemeStore();
  const {publicKey} = useWalletStore();
  const {followUser, unfollowUser} = useProfileStore();
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = publicKey?.toString() === profile.userWallet;
  const canEdit = isOwnProfile;

  const handleFollow = async () => {
    if (followLoading) {
      return;
    }

    setFollowLoading(true);
    try {
      if (profile.isFollowing) {
        await unfollowUser(profile.userWallet);
      } else {
        await followUser(profile.userWallet);
      }
    } catch (error) {
      Alert.alert(
        'Action Failed',
        'Failed to update follow status. Please try again.',
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = () => {
    // TODO: Implement profile sharing
    Alert.alert('Share Profile', 'Profile sharing coming soon!');
  };

  const handleMessage = () => {
    // TODO: Implement direct messaging
    Alert.alert('Direct Message', 'Direct messaging coming soon!');
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <Card className="mx-4 mb-4">
      <CardContent className="p-0">
        {/* Banner Image */}
        <View className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
          {profile.bannerImage && (
            <FastImage
              source={{uri: profile.bannerImage}}
              className="w-full h-full"
              resizeMode={FastImage.resizeMode.cover}
            />
          )}

          {/* Action Buttons */}
          <View className="absolute top-3 right-3 flex-row space-x-2">
            {canEdit ? (
              <Pressable
                onPress={onSettingsPress}
                className="bg-black/50 rounded-full p-2">
                <Settings size={20} color="white" />
              </Pressable>
            ) : (
              <Pressable
                onPress={handleShare}
                className="bg-black/50 rounded-full p-2">
                <Share size={20} color="white" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Profile Content */}
        <View className="p-4">
          {/* Avatar and Basic Info */}
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-row items-start space-x-3 flex-1">
              {/* Avatar */}
              <View className="-mt-8">
                <Avatar
                  src={getUserProfilePicture(profile)}
                  fallback={
                    profile.displayName?.charAt(0) ||
                    profile.userWallet.slice(0, 2)
                  }
                  size="xl"
                  className="border-4 border-background"
                />
              </View>

              {/* Name and Bio */}
              <View className="flex-1 mt-2">
                <View className="flex-row items-center flex-wrap mb-1">
                  <Text className="text-foreground text-xl font-bold mr-2">
                    {profile.displayName || 'Anonymous User'}
                  </Text>

                  {/* Verification Badges */}
                  {profile.nftVerified && (
                    <Badge variant="success" className="mr-1">
                      <Text className="text-xs">NFT</Text>
                    </Badge>
                  )}
                  {profile.snsVerified && (
                    <Badge variant="default" className="mr-1">
                      <Text className="text-xs">{profile.snsDomain}</Text>
                    </Badge>
                  )}
                  {profile.isVerifiedCreator && (
                    <Badge variant="default">
                      <Shield size={12} color={colors.verified} />
                    </Badge>
                  )}
                  {profile.brandAddress && (
                    <Badge variant="secondary">
                      <Text className="text-xs">
                        {profile.brandName || 'Brand'}
                      </Text>
                    </Badge>
                  )}
                </View>

                <Text className="text-muted-foreground text-sm mb-2">
                  {formatWalletAddress(profile.userWallet)}
                </Text>

                {profile.bio && (
                  <Text className="text-foreground text-sm leading-5">
                    {profile.bio}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          {!canEdit && (
            <View className="flex-row space-x-3 mb-4">
              <Button
                onPress={handleFollow}
                disabled={followLoading}
                variant={profile.isFollowing ? 'outline' : 'default'}
                className="flex-1">
                <View className="flex-row items-center">
                  {profile.isFollowing ? (
                    <UserMinus size={16} color={colors.foreground} />
                  ) : (
                    <UserPlus size={16} color={colors.primaryForeground} />
                  )}
                  <Text
                    className={cn(
                      'ml-2 font-medium',
                      profile.isFollowing
                        ? 'text-foreground'
                        : 'text-primary-foreground',
                    )}>
                    {followLoading
                      ? 'Loading...'
                      : profile.isFollowing
                      ? 'Unfollow'
                      : 'Follow'}
                  </Text>
                </View>
              </Button>

              {profile.allowDirectMessages && (
                <Button onPress={handleMessage} variant="outline" size="icon">
                  <MessageCircle size={16} color={colors.foreground} />
                </Button>
              )}
            </View>
          )}

          {canEdit && (
            <Button onPress={onEditPress} variant="outline" className="mb-4">
              Edit Profile
            </Button>
          )}

          {/* Stats */}
          <View className="flex-row justify-around py-3 border-t border-border">
            <Pressable onPress={() => {}} className="items-center">
              <Text className="text-foreground text-lg font-bold">
                {profile.postCount}
              </Text>
              <Text className="text-muted-foreground text-sm">Posts</Text>
            </Pressable>

            <Pressable onPress={onFollowersPress} className="items-center">
              <Text className="text-foreground text-lg font-bold">
                {profile.followerCount}
              </Text>
              <Text className="text-muted-foreground text-sm">Followers</Text>
            </Pressable>

            <Pressable onPress={onFollowingPress} className="items-center">
              <Text className="text-foreground text-lg font-bold">
                {profile.followingCount}
              </Text>
              <Text className="text-muted-foreground text-sm">Following</Text>
            </Pressable>

            <Pressable className="items-center">
              <Text className="text-foreground text-lg font-bold">
                {profile.onChainReputation}
              </Text>
              <Text className="text-muted-foreground text-sm">Rep</Text>
            </Pressable>
          </View>

          {/* Tip Stats */}
          {(profile.tipsReceivedTotal > 0 || profile.tipsSentTotal > 0) && (
            <View className="flex-row justify-around py-3 border-t border-border">
              <View className="items-center">
                <Text className="text-yellow-600 dark:text-yellow-400 text-lg font-bold">
                  {profile.tipsReceivedTotal.toFixed(2)}
                </Text>
                <Text className="text-muted-foreground text-sm">
                  SOL Received
                </Text>
              </View>

              <View className="items-center">
                <Text className="text-yellow-600 dark:text-yellow-400 text-lg font-bold">
                  {profile.tipsSentTotal.toFixed(2)}
                </Text>
                <Text className="text-muted-foreground text-sm">SOL Sent</Text>
              </View>
            </View>
          )}
        </View>
      </CardContent>
    </Card>
  );
}
