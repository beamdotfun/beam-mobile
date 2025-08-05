import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  RefreshControl,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Plus, TrendingUp, Users, Activity, Settings} from 'lucide-react-native';
import {useBrandManagementStore} from '../../store/brandManagement';
import {Brand} from '../../types/brand';
import {Button} from '../../components/ui/button';
import {Card, CardContent} from '../../components/ui/card';
import {Avatar} from '../../components/ui/avatar';
import {Badge} from '../../components/ui/badge';
import {Header} from '../../components/layout/Header';
import {Screen} from '../../components/layout/Screen';
import {useThemeStore} from '../../store/themeStore';
import {cn} from '../../utils/cn';

interface BrandManagementScreenProps {
  navigation: any;
}

export default function BrandManagementScreen({
  navigation,
}: BrandManagementScreenProps) {
  const {colors} = useThemeStore();
  const {
    userBrands,
    isLoading,
    error,
    fetchUserBrands,
    selectBrand,
    clearError,
  } = useBrandManagementStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserBrands();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserBrands();
    setRefreshing(false);
  };

  const handleCreateBrand = () => {
    navigation.navigate('CreateBrand');
  };

  const handleBrandPress = (brand: Brand) => {
    selectBrand(brand);
    navigation.navigate('BrandDetails', {brandId: brand.id});
  };

  const QuickStatsCard = ({brands}: {brands: Brand[]}) => {
    const totalFollowers = brands.reduce(
      (sum, brand) => sum + brand.followerCount,
      0,
    );
    const totalPosts = brands.reduce((sum, brand) => sum + brand.totalPosts, 0);
    const avgEngagement =
      brands.length > 0
        ? brands.reduce((sum, brand) => sum + brand.engagementRate, 0) /
          brands.length
        : 0;

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <Text className="text-lg font-semibold mb-3 text-foreground">
            Overview
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-brand">
                {totalFollowers}
              </Text>
              <Text className="text-xs text-muted-foreground">
                Total Followers
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-success">
                {totalPosts}
              </Text>
              <Text className="text-xs text-muted-foreground">Total Posts</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-auction">
                {avgEngagement.toFixed(1)}%
              </Text>
              <Text className="text-xs text-muted-foreground">
                Avg Engagement
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    );
  };

  const BrandCard = ({brand, onPress}: {brand: Brand; onPress: () => void}) => {
    return (
      <Pressable onPress={onPress}>
        <Card className="mb-3">
          <CardContent className="p-4">
            <View className="flex-row items-start space-x-3">
              {/* Brand Logo */}
              <Avatar
                src={brand.logoUrl}
                fallback={brand.brandName.charAt(0).toUpperCase()}
                size="lg"
              />

              {/* Brand Info */}
              <View className="flex-1">
                <View className="flex-row items-center space-x-2">
                  <Text className="text-lg font-semibold text-foreground">
                    {brand.brandName}
                  </Text>
                  {brand.isVerified && (
                    <Badge variant="brand">
                      <Text className="text-xs">Verified</Text>
                    </Badge>
                  )}
                </View>

                <Text className="text-sm text-muted-foreground">
                  @{brand.brandHandle}
                </Text>
                <Text
                  className="text-sm text-foreground mt-1"
                  numberOfLines={2}>
                  {brand.bio}
                </Text>

                {/* Brand Stats */}
                <View className="flex-row items-center space-x-4 mt-2">
                  <View className="flex-row items-center space-x-1">
                    <Users size={12} color={colors.mutedForeground} />
                    <Text className="text-xs text-muted-foreground">
                      {brand.followerCount}
                    </Text>
                  </View>
                  <View className="flex-row items-center space-x-1">
                    <Activity size={12} color={colors.mutedForeground} />
                    <Text className="text-xs text-muted-foreground">
                      {brand.engagementRate.toFixed(1)}%
                    </Text>
                  </View>
                  <View className="flex-row items-center space-x-1">
                    <TrendingUp size={12} color={colors.mutedForeground} />
                    <Text className="text-xs text-muted-foreground">
                      {brand.totalPosts} posts
                    </Text>
                  </View>
                </View>
              </View>

              {/* Status Indicator */}
              <View className="items-end">
                <View
                  className={cn(
                    'px-2 py-1 rounded-full',
                    brand.isActive ? 'bg-success/10' : 'bg-destructive/10',
                  )}>
                  <Text
                    className={cn(
                      'text-xs font-medium',
                      brand.isActive ? 'text-success' : 'text-destructive',
                    )}>
                    {brand.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>

                <Text className="text-xs text-muted-foreground mt-1 capitalize">
                  {brand.category}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </Pressable>
    );
  };

  if (isLoading && userBrands.length === 0) {
    return (
      <Screen>
        <Header title="My Brands" />
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">Loading your brands...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="My Brands"
        subtitle={`${userBrands.length} brand${
          userBrands.length !== 1 ? 's' : ''
        }`}
        rightComponent={
          <Button size="sm" onPress={handleCreateBrand}>
            <Plus size={16} color={colors.primaryForeground} />
          </Button>
        }
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {userBrands.length > 0 ? (
          <View className="p-4">
            {/* Quick Stats */}
            <QuickStatsCard brands={userBrands} />

            {/* Brands List */}
            <View>
              <Text className="text-lg font-semibold text-foreground mb-3">
                Your Brands
              </Text>
              {userBrands.map(brand => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  onPress={() => handleBrandPress(brand)}
                />
              ))}
            </View>
          </View>
        ) : (
          <View className="flex-1 justify-center items-center p-8">
            <View className="w-20 h-20 bg-muted rounded-full items-center justify-center mb-4">
              <TrendingUp size={32} color={colors.mutedForeground} />
            </View>
            <Text className="text-lg font-semibold text-foreground mb-2">
              Create Your First Brand
            </Text>
            <Text className="text-muted-foreground text-center mb-6">
              Build your brand presence and connect with your audience on the
              platform.
            </Text>
            <Button onPress={handleCreateBrand}>
              <Plus
                size={16}
                color={colors.primaryForeground}
                className="mr-2"
              />
              <Text className="text-primary-foreground">Create Brand</Text>
            </Button>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
