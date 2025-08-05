import React from 'react';
import {View, StyleSheet} from 'react-native';
import {SkeletonCard, SkeletonAvatar, SkeletonText, Skeleton} from '../ui/Skeleton';
import {useThemeStore} from '../../store/themeStore';

interface FeedSkeletonProps {
  itemCount?: number;
  showImages?: boolean;
}

export function FeedSkeleton({
  itemCount = 5,
  showImages = true,
}: FeedSkeletonProps) {
  const {colors} = useThemeStore();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    item: {
      marginHorizontal: 16,
      marginVertical: 8,
    },
  });

  return (
    <View style={styles.container}>
      {Array.from({length: itemCount}).map((_, index) => (
        <SkeletonCard
          key={index}
          showAvatar
          showImage={showImages && Math.random() > 0.4} // Randomly show images like real feed
          imageHeight={150 + Math.random() * 100} // Vary image heights
          style={styles.item}
        />
      ))}
    </View>
  );
}

export function ProfileSkeleton() {
  const {colors} = useThemeStore();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatar: {
      marginBottom: 16,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    statItem: {
      alignItems: 'center',
      gap: 8,
    },
    postsContainer: {
      flex: 1,
    },
    postItem: {
      marginBottom: 16,
    },
  });

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <SkeletonAvatar size={80} style={styles.avatar} />
        <SkeletonText lines={2} spacing={8} style={{alignItems: 'center'}} />
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        {Array.from({length: 4}).map((_, index) => (
          <View key={index} style={styles.statItem}>
            <Skeleton width={40} height={20} />
            <Skeleton width={60} height={14} />
          </View>
        ))}
      </View>

      {/* Posts */}
      <View style={styles.postsContainer}>
        {Array.from({length: 3}).map((_, index) => (
          <SkeletonCard
            key={index}
            showAvatar={false}
            showImage={index === 1}
            style={styles.postItem}
          />
        ))}
      </View>
    </View>
  );
}