import React from 'react';
import {View, ScrollView, TouchableOpacity, Linking} from 'react-native';
import {Text, Card, Badge, Avatar} from '../ui';
import {
  MapPin,
  Calendar,
  Users,
  Building,
  Globe,
  Twitter,
  MessageCircle,
  Award,
  Star,
  Target,
} from 'lucide-react-native';
import {BrandProfile, BRAND_CATEGORIES} from '../../types/brands';

interface BrandAboutProps {
  brand: BrandProfile;
}

export function BrandAbout({brand}: BrandAboutProps) {
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
      {/* Brand Description */}
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-3">About</Text>
        <Text className="text-base leading-6">
          {brand.description || brand.bio}
        </Text>
      </Card>

      {/* Brand Story */}
      {brand.story && (
        <Card className="p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">Our Story</Text>
          <Text className="text-base leading-6">{brand.story}</Text>
        </Card>
      )}

      {/* Basic Info */}
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-3">Information</Text>

        <View className="space-y-3">
          {/* Category */}
          <View className="flex-row items-center gap-3">
            <View className="w-8 items-center">
              <Target className="h-5 w-5 text-muted-foreground" />
            </View>
            <View>
              <Text className="text-sm text-muted-foreground">Category</Text>
              <Badge variant="secondary">
                {BRAND_CATEGORIES[brand.category]?.label || brand.category}
              </Badge>
            </View>
          </View>

          {/* Business Type */}
          <View className="flex-row items-center gap-3">
            <View className="w-8 items-center">
              <Building className="h-5 w-5 text-muted-foreground" />
            </View>
            <View>
              <Text className="text-sm text-muted-foreground">Type</Text>
              <Text className="font-medium capitalize">
                {brand.businessType}
              </Text>
            </View>
          </View>

          {/* Established */}
          {brand.established && (
            <View className="flex-row items-center gap-3">
              <View className="w-8 items-center">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </View>
              <View>
                <Text className="text-sm text-muted-foreground">
                  Established
                </Text>
                <Text className="font-medium">{brand.established}</Text>
              </View>
            </View>
          )}

          {/* Location */}
          {brand.location && (
            <View className="flex-row items-center gap-3">
              <View className="w-8 items-center">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </View>
              <View>
                <Text className="text-sm text-muted-foreground">Location</Text>
                <Text className="font-medium">{brand.location}</Text>
              </View>
            </View>
          )}

          {/* Member Since */}
          <View className="flex-row items-center gap-3">
            <View className="w-8 items-center">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </View>
            <View>
              <Text className="text-sm text-muted-foreground">
                Member Since
              </Text>
              <Text className="font-medium">{formatDate(brand.createdAt)}</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Links */}
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-3">Links</Text>

        <View className="space-y-3">
          {/* Website */}
          {brand.website && (
            <TouchableOpacity
              onPress={() => openLink(brand.website!)}
              className="flex-row items-center gap-3 p-2 rounded-lg bg-muted/50">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <View>
                <Text className="font-medium">Website</Text>
                <Text className="text-sm text-muted-foreground">
                  {brand.website.replace('https://', '').replace('http://', '')}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Twitter */}
          {brand.socialLinks.twitter && (
            <TouchableOpacity
              onPress={() =>
                openLink(`https://twitter.com/${brand.socialLinks.twitter}`)
              }
              className="flex-row items-center gap-3 p-2 rounded-lg bg-muted/50">
              <Twitter className="h-5 w-5 text-muted-foreground" />
              <View>
                <Text className="font-medium">Twitter</Text>
                <Text className="text-sm text-muted-foreground">
                  @{brand.socialLinks.twitter}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Discord */}
          {brand.socialLinks.discord && (
            <TouchableOpacity
              onPress={() => openLink(brand.socialLinks.discord!)}
              className="flex-row items-center gap-3 p-2 rounded-lg bg-muted/50">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <View>
                <Text className="font-medium">Discord</Text>
                <Text className="text-sm text-muted-foreground">
                  Join our community
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* Team */}
      {brand.team && brand.team.length > 0 && (
        <Card className="p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">Team</Text>

          <View className="space-y-3">
            {brand.team.map((member, index) => (
              <View key={index} className="flex-row items-center gap-3">
                <Avatar
                  source={member.avatar ? {uri: member.avatar} : undefined}
                  size="md"
                />
                <View className="flex-1">
                  <Text className="font-medium">{member.name}</Text>
                  <Text className="text-sm text-muted-foreground">
                    {member.role}
                  </Text>
                  {member.bio && (
                    <Text className="text-sm text-muted-foreground mt-1">
                      {member.bio}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Achievements & Badges */}
      {brand.badges && brand.badges.length > 0 && (
        <Card className="p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">Achievements</Text>

          <View className="flex-row flex-wrap gap-2">
            {brand.badges.map(badge => (
              <Badge
                key={badge.id}
                variant="outline"
                className="flex-row items-center gap-1">
                <Award className="h-3 w-3" />
                {badge.name}
              </Badge>
            ))}
          </View>
        </Card>
      )}

      {/* Milestones */}
      {brand.milestones && brand.milestones.length > 0 && (
        <Card className="p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">Milestones</Text>

          <View className="space-y-3">
            {brand.milestones.map(milestone => (
              <View
                key={milestone.id}
                className="border-l-2 border-primary pl-4">
                <Text className="font-medium">{milestone.title}</Text>
                <Text className="text-sm text-muted-foreground mb-1">
                  {milestone.description}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {formatDate(milestone.achievedAt)}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Tags */}
      {brand.tags && brand.tags.length > 0 && (
        <Card className="p-4 mb-6">
          <Text className="text-lg font-semibold mb-3">Tags</Text>

          <View className="flex-row flex-wrap gap-2">
            {brand.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </View>
        </Card>
      )}
    </ScrollView>
  );
}
