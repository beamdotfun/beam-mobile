import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {ArrowLeft, Plus} from 'lucide-react-native';
import {useThemeStore} from '../../store/themeStore';

interface ConsistentHeaderProps {
  title: string;
  showBackButton?: boolean;
  onCreatePost?: () => void;
  onBack?: () => void; // Custom back navigation
}

export function ConsistentHeader({
  title,
  showBackButton = true,
  onCreatePost,
  onBack,
}: ConsistentHeaderProps) {
  const navigation = useNavigation();
  const {colors} = useThemeStore();

  const handleBack = () => {
    if (onBack) {
      // Use custom back navigation if provided
      onBack();
    } else {
      // Default: navigate back to Feed
      navigation.reset({
        index: 0,
        routes: [{name: 'Feed', params: {screen: 'FeedHome'}}],
      });
    }
  };

  const handleCreatePost = () => {
    if (onCreatePost) {
      onCreatePost();
    } else {
      navigation.navigate('CreatePost' as any);
    }
  };

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerSide: {
      flex: 1,
      flexDirection: 'row',
    },
    headerCenter: {
      flex: 2,
      alignItems: 'center',
    },
    headerSideRight: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
    },
    createPostButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.foreground,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    createPostButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    placeholder: {
      width: 44,
      height: 44,
    },
  });

  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {showBackButton ? (
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel="Go back to feed">
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <View style={styles.headerSideRight}>
        <Pressable
          style={({pressed}) => [
            styles.createPostButton,
            pressed && {backgroundColor: colors.muted, borderColor: colors.primary}
          ]}
          onPress={handleCreatePost}
          accessibilityLabel="Create new post">
          <Plus size={14} color={colors.primary} />
          <Text style={styles.createPostButtonText}>NEW POST</Text>
        </Pressable>
      </View>
    </View>
  );
}