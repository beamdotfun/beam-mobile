import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  Linking,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Badge,
  Avatar,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Skeleton,
} from '../../components/ui';
import {
  Building,
  Users,
  Package,
  TrendingUp,
  Star,
  Share2,
  Globe,
  Twitter,
  MessageCircle,
  Edit,
  CheckCircle,
  BarChart3,
} from 'lucide-react-native';
import {useBrandStore} from '../../store/brandStore';
import {useAuthStore} from '../../store/auth';
import {useNavigation} from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import {formatSOL} from '../../utils/formatting';

// Sub-components
import {BrandHeader} from '../../components/brands/BrandHeader';
import {BrandProducts} from '../../components/brands/BrandProducts';
import {BrandCollections} from '../../components/brands/BrandCollections';
import {BrandActivity} from '../../components/brands/BrandActivity';
import {BrandAbout} from '../../components/brands/BrandAbout';

interface BrandProfileProps {
  route: {
    params: {
      brandId: string;
    };
  };
}

export function BrandProfile({route}: BrandProfileProps) {
  const {brandId} = route.params;
  const navigation = useNavigation();
  const {user} = useAuthStore();
  const {
    brandProfiles,
    isFollowing,
    fetchBrandProfile,
    followBrand,
    unfollowBrand,
    loading,
    error,
  } = useBrandStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  const brand = brandProfiles[brandId];
  const following = isFollowing(brandId);

  useEffect(() => {
    fetchBrandProfile(brandId);
  }, [brandId, fetchBrandProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBrandProfile(brandId);
    setRefreshing(false);
  };

  const handleFollow = async () => {
    try {
      if (following) {
        await unfollowBrand(brandId);
      } else {
        await followBrand(brandId);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    }
  };

  const handleShare = async () => {
    if (!brand) {
      return;
    }

    try {
      await Share.share({
        message: `Check out ${brand.displayName} on SolanaChat`,
        url: `https://solanachat.app/brand/${brand.handle}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (loading && !brand) {
    return <LoadingSkeleton />;
  }

  if (error && !brand) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-center text-muted-foreground mb-4">{error}</Text>
        <Button onPress={() => fetchBrandProfile(brandId)}>Try Again</Button>
      </View>
    );
  }

  if (!brand) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-center text-muted-foreground">
          Brand not found
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
      {/* Brand Header */}
      <BrandHeader
        brand={brand}
        isFollowing={following}
        onFollow={handleFollow}
        onShare={handleShare}
      />

      {/* Stats Bar */}
      <View className="flex-row justify-around py-4 border-b border-border">
        <StatItem
          label="Followers"
          value={brand.followerCount.toLocaleString()}
          icon={Users}
        />
        <StatItem
          label="Products"
          value={brand.auctionCount.toString()}
          icon={Package}
        />
        <StatItem
          label="Sales"
          value={`${formatSOL(brand.totalSales)} SOL`}
          icon={TrendingUp}
        />
        <StatItem label="Rating" value={brand.rating.toFixed(1)} icon={Star} />
      </View>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="products" className="flex-1">
            Products
          </TabsTrigger>
          <TabsTrigger value="collections" className="flex-1">
            Collections
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">
            Activity
          </TabsTrigger>
          <TabsTrigger value="about" className="flex-1">
            About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <BrandProducts brandId={brandId} />
        </TabsContent>

        <TabsContent value="collections">
          <BrandCollections brandId={brandId} />
        </TabsContent>

        <TabsContent value="activity">
          <BrandActivity brandId={brandId} />
        </TabsContent>

        <TabsContent value="about">
          <BrandAbout brand={brand} />
        </TabsContent>
      </Tabs>
    </ScrollView>
  );
}

// Helper Components
interface StatItemProps {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
}

function StatItem({label, value, icon: Icon}: StatItemProps) {
  return (
    <View className="items-center">
      <Icon className="h-5 w-5 text-muted-foreground mb-1" />
      <Text className="text-lg font-semibold">{value}</Text>
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View className="flex-1 bg-background">
      {/* Banner skeleton */}
      <Skeleton className="h-48 w-full" />

      <View className="p-4">
        {/* Profile info skeleton */}
        <View className="flex-row items-center mb-4 -mt-12">
          <Skeleton className="w-24 h-24 rounded-full border-4 border-background mr-4" />
          <View className="flex-1">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-20" />
          </View>
        </View>

        {/* Bio skeleton */}
        <Skeleton className="h-20 w-full mb-4" />

        {/* Action buttons skeleton */}
        <View className="flex-row gap-2 mb-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-12" />
        </View>

        {/* Stats skeleton */}
        <View className="flex-row justify-around py-4 border-b border-border mb-4">
          {[1, 2, 3, 4].map(i => (
            <View key={i} className="items-center">
              <Skeleton className="h-5 w-5 rounded mb-1" />
              <Skeleton className="h-6 w-12 mb-1" />
              <Skeleton className="h-3 w-16" />
            </View>
          ))}
        </View>

        {/* Tabs skeleton */}
        <View className="flex-row gap-2 mb-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-10 flex-1" />
          ))}
        </View>

        {/* Content skeleton */}
        <View className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </View>
      </View>
    </View>
  );
}
