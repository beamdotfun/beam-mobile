import React from 'react';
import {Text} from 'react-native';
import {Screen} from '../../components/layout/Screen';
import {Header} from '../../components/layout/Header';
import {BrandStackScreenProps} from '../../types/navigation';

type Props = BrandStackScreenProps<'BrandHome'>;

export default function BrandHomeScreen({navigation}: Props) {
  return (
    <Screen>
      <Header
        title="Brands"
        rightComponent={
          <Text className="text-primary font-medium">Create</Text>
        }
        onRightPress={() => navigation.navigate('CreateBrand')}
      />
      <Text className="text-foreground text-center mt-8">
        Brand Home Screen - Coming Soon
      </Text>
    </Screen>
  );
}
