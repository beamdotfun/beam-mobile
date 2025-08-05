import {useNavigation as useRNNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigation';

export function useNavigation() {
  return useRNNavigation<NativeStackNavigationProp<RootStackParamList>>();
}

export function useTypedNavigation<T extends Record<string, any>>() {
  return useRNNavigation<NativeStackNavigationProp<T>>();
}
