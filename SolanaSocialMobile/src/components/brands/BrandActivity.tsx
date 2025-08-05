import React, {useEffect, useState} from 'react';
import {View, FlatList, RefreshControl} from 'react-native';
import {Text, Card, Avatar, Badge, Skeleton} from '../ui';
import {
  Activity,
  Heart,
  MessageCircle,
  Share2,
  Package,
  Gavel,
  TrendingUp,
  Users,
  Award,
} from 'lucide-react-native';
import {useBrandStore} from '../../store/brandStore';
import {formatSOL} from '../../utils/formatting';

interface BrandActivityProps {
  brandId: string;
}

interface ActivityItem {
  id: string;
  type:
    | 'post'
    | 'product_launch'
    | 'auction_start'
    | 'auction_end'
    | 'milestone'
    | 'follow';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    amount?: number;
    userCount?: number;
    productName?: string;
    auctionId?: string;
  };
}

export function BrandActivity({brandId}: BrandActivityProps) {
  const {brandProfiles} = useBrandStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const brand = brandProfiles[brandId];

  useEffect(() => {
    fetchBrandActivity();
  }, [brandId]);

  const fetchBrandActivity = async () => {
    setLoading(true);
    try {
      // Mock activity data - replace with actual API call
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'milestone',
          title: 'Reached 1,000 followers!',
          description:
            'Thank you to all our supporters for helping us reach this milestone.',
          timestamp: '2024-01-15T10:30:00Z',
          metadata: {userCount: 1000},
        },
        {
          id: '2',
          type: 'product_launch',
          title: 'New Collection Released',
          description:
            "Just launched our 'Digital Dreams' collection featuring 25 unique NFTs.",
          timestamp: '2024-01-14T15:20:00Z',
          metadata: {productName: 'Digital Dreams Collection'},
        },
        {
          id: '3',
          type: 'auction_end',
          title: 'Auction Concluded',
          description: 'Genesis NFT #001 sold for a record-breaking price!',
          timestamp: '2024-01-13T20:45:00Z',
          metadata: {amount: 15.5, auctionId: 'auction_001'},
        },
        {
          id: '4',
          type: 'post',
          title: 'Behind the Scenes',
          description:
            'Check out our latest blog post about the creative process behind our artwork.',
          timestamp: '2024-01-12T12:00:00Z',
        },
        {
          id: '5',
          type: 'auction_start',
          title: 'New Auction Live',
          description:
            "Exclusive artwork 'Solana Sunset' is now live for bidding!",
          timestamp: '2024-01-11T09:00:00Z',
          metadata: {productName: 'Solana Sunset'},
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to fetch brand activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBrandActivity();
    setRefreshing(false);
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'post':
        return MessageCircle;
      case 'product_launch':
        return Package;
      case 'auction_start':
      case 'auction_end':
        return Gavel;
      case 'milestone':
        return Award;
      case 'follow':
        return Users;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'post':
        return 'text-blue-500';
      case 'product_launch':
        return 'text-green-500';
      case 'auction_start':
        return 'text-orange-500';
      case 'auction_end':
        return 'text-purple-500';
      case 'milestone':
        return 'text-yellow-500';
      case 'follow':
        return 'text-pink-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),

    if (diffInHours < 1) {return 'Just now';}
    if (diffInHours < 24) {return `${diffInHours}h ago`;}

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {return `${diffInDays}d ago`;}

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const renderActivity = ({item: activity}: {item: ActivityItem}) => {
    const Icon = getActivityIcon(activity.type);
    const iconColor = getActivityColor(activity.type);

    return (
      <Card className="p-4 mb-3">
        <View className="flex-row items-start gap-3">
          {/* Activity Icon */}
          <View className={'bg-muted rounded-full p-2'}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </View>

          {/* Activity Content */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-semibold" numberOfLines={1}>
                {activity.title}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {formatRelativeTime(activity.timestamp)}
              </Text>
            </View>

            <Text className="text-muted-foreground mb-2" numberOfLines={3}>
              {activity.description}
            </Text>

            {/* Activity Metadata */}
            {activity.metadata && (
              <View className="flex-row items-center gap-3">
                {activity.metadata.amount && (
                  <Badge variant="outline">
                    {formatSOL(activity.metadata.amount)} SOL
                  </Badge>
                )}
                {activity.metadata.userCount && (
                  <Badge variant="outline">
                    {activity.metadata.userCount.toLocaleString()} followers
                  </Badge>
                )}
                {activity.metadata.productName && (
                  <Badge variant="secondary">
                    {activity.metadata.productName}
                  </Badge>
                )}
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

  if (loading) {
    return <ActivitySkeleton />;
  }

  if (activities.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-12">
        <Activity className="h-16 w-16 text-muted-foreground mb-4" />
        <Text className="text-xl font-semibold mb-2">No Activity Yet</Text>
        <Text className="text-center text-muted-foreground px-8">
          This brand hasn't shared any recent updates or activities.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4">
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 20}}
      />
    </View>
  );
}

function ActivitySkeleton() {
  return (
    <View className="flex-1 p-4">
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} className="mb-3">
          <Card className="p-4">
            <View className="flex-row items-start gap-3">
              <Skeleton className="w-9 h-9 rounded-full" />
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-12" />
                </View>
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <View className="flex-row gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </View>
              </View>
            </View>
          </Card>
        </View>
      ))}
    </View>
  );
}
