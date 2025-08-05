import React, {useEffect, useState} from 'react';
import {View, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import {Text, Card, Badge, Skeleton} from '../ui';
import {Layers, TrendingUp, Package} from 'lucide-react-native';
import FastImage from 'react-native-fast-image';
import {useBrandStore} from '../../store/brandStore';
import {Collection} from '../../types/brands';
import {formatSOL} from '../../utils/formatting';

interface BrandCollectionsProps {
  brandId: string;
}

export function BrandCollections({brandId}: BrandCollectionsProps) {
  const {brandProfiles, fetchBrandCollections, loading} = useBrandStore();
  const [refreshing, setRefreshing] = useState(false);

  const brand = brandProfiles[brandId];
  const collections = brand?.collections || [];

  useEffect(() => {
    fetchBrandCollections(brandId);
  }, [brandId, fetchBrandCollections]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBrandCollections(brandId);
    } catch (error) {
      console.error('Failed to refresh collections:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCollectionPress = (collection: Collection) => {
    // Navigate to collection detail page
    console.log('View collection:', collection);
  };

  const renderCollection = ({item: collection}: {item: Collection}) => (
    <TouchableOpacity
      onPress={() => handleCollectionPress(collection)}
      className="mb-4">
      <Card className="overflow-hidden">
        {/* Collection Cover */}
        <View className="relative">
          <FastImage
            source={{uri: collection.coverImage}}
            className="w-full h-40"
            resizeMode="cover"
          />

          {/* Item Count Badge */}
          <View className="absolute top-3 right-3">
            <Badge variant="secondary">{collection.itemCount} items</Badge>
          </View>
        </View>

        {/* Collection Info */}
        <View className="p-4">
          <Text className="text-lg font-semibold mb-2" numberOfLines={2}>
            {collection.name}
          </Text>

          <Text className="text-muted-foreground mb-3" numberOfLines={3}>
            {collection.description}
          </Text>

          {/* Stats */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              {collection.floorPrice && (
                <View className="flex-row items-center gap-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <View>
                    <Text className="text-sm text-muted-foreground">Floor</Text>
                    <Text className="text-sm font-medium">
                      {formatSOL(collection.floorPrice)} SOL
                    </Text>
                  </View>
                </View>
              )}

              {collection.totalVolume && (
                <View className="flex-row items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <View>
                    <Text className="text-sm text-muted-foreground">
                      Volume
                    </Text>
                    <Text className="text-sm font-medium">
                      {formatSOL(collection.totalVolume)} SOL
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View className="items-center">
              <Text className="text-2xl font-bold">{collection.itemCount}</Text>
              <Text className="text-xs text-muted-foreground">Items</Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading && collections.length === 0) {
    return <CollectionsSkeleton />;
  }

  if (collections.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-12">
        <Layers className="h-16 w-16 text-muted-foreground mb-4" />
        <Text className="text-xl font-semibold mb-2">No Collections Yet</Text>
        <Text className="text-center text-muted-foreground px-8">
          This brand hasn't created any collections yet.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4">
      <FlatList
        data={collections}
        renderItem={renderCollection}
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

function CollectionsSkeleton() {
  return (
    <View className="flex-1 p-4">
      {[1, 2, 3].map(i => (
        <View key={i} className="mb-4">
          <Card className="overflow-hidden">
            <Skeleton className="w-full h-40" />
            <View className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3 mb-3" />
              <View className="flex-row items-center justify-between">
                <View className="flex-row gap-4">
                  <Skeleton className="h-10 w-16" />
                  <Skeleton className="h-10 w-16" />
                </View>
                <Skeleton className="h-10 w-12" />
              </View>
            </View>
          </Card>
        </View>
      ))}
    </View>
  );
}
