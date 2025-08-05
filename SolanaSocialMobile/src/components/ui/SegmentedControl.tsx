import React, {useEffect, useRef} from 'react';
import {View, Text, Pressable, StyleSheet, Animated} from 'react-native';
import {useThemeStore} from '../../store/themeStore';

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onSelectionChange: (index: number) => void;
}

export function SegmentedControl({
  segments,
  selectedIndex,
  onSelectionChange,
}: SegmentedControlProps) {
  const {colors} = useThemeStore();
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = React.useState(0);

  useEffect(() => {
    Animated.spring(slideAnimation, {
      toValue: selectedIndex,
      useNativeDriver: true,
      friction: 8,
      tension: 100, // Higher tension for snappier response
    }).start();
  }, [selectedIndex, slideAnimation]);

  const segmentWidth = containerWidth / segments.length;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.muted,
      borderRadius: 20,
      padding: 2,
      height: 40,
      position: 'relative',
    },
    segment: {
      flex: 1,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: 16,
      zIndex: 1,
    },
    slider: {
      position: 'absolute',
      top: 2,
      bottom: 2,
      left: 2,
      width: segmentWidth - 4,
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    activeText: {
      color: colors.foreground,
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    inactiveText: {
      color: colors.mutedForeground,
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Inter-Medium',
    },
  });

  return (
    <View 
      style={styles.container}
      onLayout={(event) => {
        setContainerWidth(event.nativeEvent.layout.width);
      }}>
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.slider,
            {
              transform: [
                {
                  translateX: slideAnimation.interpolate({
                    inputRange: segments.map((_, i) => i),
                    outputRange: segments.map((_, i) => i * segmentWidth),
                  }),
                },
              ],
            },
          ]}
        />
      )}
      {segments.map((segment, index) => (
        <Pressable
          key={segment}
          style={styles.segment}
          onPress={() => onSelectionChange(index)}
          accessibilityRole="tab"
          accessibilityState={{selected: index === selectedIndex}}>
          <Text
            style={
              index === selectedIndex ? styles.activeText : styles.inactiveText
            }>
            {segment}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
