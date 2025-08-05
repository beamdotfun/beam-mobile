import React from 'react';
import {View, ScrollView} from 'react-native';
import {Text, Card, Badge} from '../ui';
import {NFTAttribute} from '../../types/auctions';

interface NFTDetailsProps {
  nft: {
    mintAddress: string;
    name: string;
    description: string;
    image: string;
    attributes: NFTAttribute[];
    collection?: string;
  };
}

export function NFTDetails({nft}: NFTDetailsProps) {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Description */}
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-3">Description</Text>
        <Text className="text-base leading-6">{nft.description}</Text>
      </Card>

      {/* Collection */}
      {nft.collection && (
        <Card className="p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">Collection</Text>
          <Text className="text-base">{nft.collection}</Text>
        </Card>
      )}

      {/* Attributes */}
      {nft.attributes.length > 0 && (
        <Card className="p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">Attributes</Text>
          <View className="flex-row flex-wrap gap-2">
            {nft.attributes.map((attr, index) => (
              <View
                key={index}
                className="bg-muted p-3 rounded-lg min-w-0 flex-1"
                style={{flexBasis: '45%'}}>
                <Text className="text-xs text-muted-foreground uppercase mb-1">
                  {attr.trait_type}
                </Text>
                <Text className="font-medium" numberOfLines={1}>
                  {attr.value}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Blockchain Info */}
      <Card className="p-4 mb-4">
        <Text className="text-lg font-semibold mb-3">Blockchain Details</Text>
        <View className="space-y-3">
          <View>
            <Text className="text-sm text-muted-foreground">Mint Address</Text>
            <Text className="font-mono text-sm" numberOfLines={1}>
              {nft.mintAddress}
            </Text>
          </View>
          <View>
            <Text className="text-sm text-muted-foreground">Blockchain</Text>
            <Badge variant="outline" className="self-start">
              Solana
            </Badge>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}
