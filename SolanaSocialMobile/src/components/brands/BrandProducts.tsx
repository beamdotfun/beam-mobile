import React, {useEffect, useState} from 'react';
import {View, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import {Text, Card, Badge, Skeleton} from '../ui';
import {Package, ExternalLink, Tag, Clock} from 'lucide-react-native';
import FastImage from 'react-native-fast-image';
import {useBrandStore} from '../../store/brandStore';
import {Product} from '../../types/brands';
import {formatSOL} from '../../utils/formatting';

interface BrandProductsProps {
  brandId: string;
}

export function BrandProducts({brandId}: BrandProductsProps) {
  const {brandProfiles, fetchBrandProducts, loading} = useBrandStore();
  const [refreshing, setRefreshing] = useState(false);

  const brand = brandProfiles[brandId];
  const products = brand?.featuredProducts || [];

  useEffect(() => {
    fetchBrandProducts(brandId);
  }, [brandId, fetchBrandProducts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBrandProducts(brandId);
    } catch (error) {
      console.error('Failed to refresh products:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleProductPress = (product: Product) => {
    // Navigate to product detail or auction page
    console.log('View product:', product);
  };

  const renderProduct = ({item: product}: {item: Product}) => (
    <TouchableOpacity
      onPress={() => handleProductPress(product)}
      className="mb-4">
      <Card className="overflow-hidden">
        {/* Product Image */}
        <View className="relative">
          <FastImage
            source={{uri: product.images[0]}}
            className="w-full h-48"
            resizeMode="cover"
          />

          {/* Status Badge */}
          <View className="absolute top-3 right-3">
            <Badge
              variant={
                product.status === 'available' ? 'default' :
                product.status === 'auction' ? 'destructive' : 'secondary'
              }
              }>
              {product.status === 'available' ? 'Available' :
                : product.status === 'auction'
                ? 'Live Auction'
                : 'Sold'}
            </Badge>
          </View>
        </View>

        {/* Product Info */}
        <View className="p-4">
          <Text className="text-lg font-semibold mb-2" numberOfLines={2}>
            {product.name}
          </Text>

          <Text className="text-muted-foreground mb-3" numberOfLines={3}>
            {product.description}
          </Text>

          {/* Price and Action */}
          <View className="flex-row items-center justify-between">
            <View>
              {product.price && (
                <Text className="text-xl font-bold">
                  {formatSOL(product.price)} SOL
                </Text>
              )}
              {product.status === 'auction' && (
                <Text className="text-sm text-muted-foreground">
                  Current bid
                </Text>
              )}
            </View>

            <View className="flex-row items-center gap-1">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <Text className="text-sm text-muted-foreground">
                {product.status === 'auction' ? 'View Auction' : 'View Details'}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading && products.length === 0) {
    return <ProductsSkeleton />;
  }

  if (products.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-12">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <Text className="text-xl font-semibold mb-2">No Products Yet</Text>
        <Text className="text-center text-muted-foreground px-8">
          This brand hasn't listed any products or auctions yet.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4">
      <FlatList
        data={products}
        renderItem={renderProduct}
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

function ProductsSkeleton() {
  return (
    <View className="flex-1 p-4">
      {[1, 2, 3].map(i => (
        <View key={i} className="mb-4">
          <Card className="overflow-hidden">
            <Skeleton className="w-full h-48" />
            <View className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3 mb-3" />
              <View className="flex-row items-center justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-20" />
              </View>
            </View>
          </Card>
        </View>
      ))}
    </View>
  );
}
