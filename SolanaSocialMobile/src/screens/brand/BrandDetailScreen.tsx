import React from 'react';
import {Text} from 'react-native';
import {Screen} from '../../components/layout/Screen';
import {BrandStackScreenProps} from '../../types/navigation';

type Props = BrandStackScreenProps<'BrandDetail'>;

export default function BrandDetailScreen({route}: Props) {
  const {brandId} = route.params;

  return (
    <Screen>
      <Text className="text-foreground text-center mt-8">
        Brand Detail Screen
      </Text>
      <Text className="text-muted-foreground text-center mt-4">
        Brand ID: {brandId}
      </Text>
      <Text className="text-muted-foreground text-center mt-4">
        Coming Soon
      </Text>
    </Screen>
  );
}
