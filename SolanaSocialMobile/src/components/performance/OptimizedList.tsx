import React, {useCallback, useMemo, useRef, memo} from 'react';
import {
  FlatList,
  FlatListProps,
  ViewToken,
  Platform,
  ListRenderItem,
} from 'react-native';
import {usePerformanceStore} from '../../store/performance';
import {performanceMonitor} from '../../services/performance';

interface OptimizedListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[] | null | undefined;
  renderItem: ListRenderItem<T>;
  itemHeight?: number;
  onVisibleItemsChanged?: (visible: T[], viewableItems: ViewToken[]) => void;
  enableOptimizations?: boolean;
  measurePerformance?: boolean;
  listName?: string;
}

function OptimizedListComponent<T>({
  data,
  renderItem,
  itemHeight,
  onVisibleItemsChanged,
  enableOptimizations = true,
  measurePerformance = false,
  listName = 'OptimizedList',
  ...props
}: OptimizedListProps<T>) {
  const {config} = usePerformanceStore();
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 250,
  }).current;

  const listRef = useRef<FlatList>(null);
  const renderTimers = useRef<Map<string, number>>(new Map());

  // Memoized key extractor
  const keyExtractor = useCallback(
    (item: T, index: number) => {
      return props.keyExtractor?.(item, index) || String(index);
    },
    [props.keyExtractor],
  );

  // Optimized render item with performance tracking
  const optimizedRenderItem = useCallback<ListRenderItem<T>>(
    info => {
      const key = keyExtractor(info.item, info.index);

      if (measurePerformance) {
        const renderFn = () => {
          const element = renderItem(info);
          return element;
        };

        performanceMonitor.measureComponent(
          `${listName}-Item-${info.index}`,
          renderFn,
        );
        return renderFn();
      }

      return renderItem(info);
    },
    [renderItem, keyExtractor, measurePerformance, listName],
  );

  // Optimized viewability callbacks
  const onViewableItemsChanged = useCallback(
    (info: {viewableItems: ViewToken[]; changed: ViewToken[]}) => {
      if (onVisibleItemsChanged) {
        const visibleItems = info.viewableItems
          .filter(token => token.isViewable)
          .map(token => token.item as T);
        onVisibleItemsChanged(visibleItems, info.viewableItems);
      }

      // Clean up render timers for items no longer visible
      if (enableOptimizations) {
        info.changed.forEach(token => {
          if (!token.isViewable && token.key) {
            renderTimers.current.delete(token.key);
          }
        });
      }
    },
    [onVisibleItemsChanged, enableOptimizations],
  );

  // Calculate optimal list configuration
  const listConfig = useMemo(() => {
    if (!enableOptimizations || !data) {
      return {};
    }

    const baseConfig = config.lists;
    const itemCount = data.length;

    // Adjust configuration based on list size
    let adjustedConfig = {...baseConfig};

    if (itemCount > 1000) {
      adjustedConfig.initialNumToRender = Math.min(
        baseConfig.initialNumToRender,
        5,
      );
      adjustedConfig.maxToRenderPerBatch = Math.min(
        baseConfig.maxToRenderPerBatch,
        3,
      );
      adjustedConfig.windowSize = Math.min(baseConfig.windowSize, 5);
    } else if (itemCount > 500) {
      adjustedConfig.initialNumToRender = Math.min(
        baseConfig.initialNumToRender,
        10,
      );
      adjustedConfig.maxToRenderPerBatch = Math.min(
        baseConfig.maxToRenderPerBatch,
        5,
      );
    }

    return adjustedConfig;
  }, [config.lists, data?.length, enableOptimizations]);

  // Get item layout optimization
  const getItemLayout = useMemo(() => {
    if (itemHeight && enableOptimizations) {
      return (_data: ArrayLike<T> | null | undefined, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      });
    }
    return undefined;
  }, [itemHeight, enableOptimizations]);

  // List optimization props
  const optimizationProps = enableOptimizations
    ? {
        removeClippedSubviews:
          Platform.OS === 'android' && listConfig.removeClippedSubviews,
        initialNumToRender: listConfig.initialNumToRender,
        maxToRenderPerBatch: listConfig.maxToRenderPerBatch,
        windowSize: listConfig.windowSize,
        updateCellsBatchingPeriod: listConfig.updateCellsBatchingPeriod,
        getItemLayout,
        viewabilityConfig,
        onViewableItemsChanged,

        // Additional optimizations
        maintainVisibleContentPosition: undefined,
        disableVirtualization: false,
        progressViewOffset: 50,

        // Scroll optimizations
        scrollEventThrottle: 16,
        directionalLockEnabled: true,

        // Memory optimizations
        legacyImplementation: false,
      }
    : {};

  return (
    <FlatList
      ref={listRef}
      data={data}
      renderItem={optimizedRenderItem}
      keyExtractor={keyExtractor}
      {...optimizationProps}
      {...props}
    />
  );
}

export const OptimizedList = memo(
  OptimizedListComponent,
) as typeof OptimizedListComponent;
