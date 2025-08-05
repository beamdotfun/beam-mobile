import React from 'react';
import {Text} from 'react-native';
import {Screen} from '../../components/layout/Screen';
import {ProfileStackScreenProps} from '../../types/navigation';

type Props = ProfileStackScreenProps<'Admin'>;

export default function AdminScreen({}: Props) {
  return (
    <Screen>
      <Text className="text-foreground text-center mt-8">
        Admin Panel Screen - Coming Soon
      </Text>
    </Screen>
  );
}
