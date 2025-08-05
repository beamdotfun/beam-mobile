import React from 'react';
import { RefreshControl } from 'react-native';

interface NoHooksRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
  tintColor: string;
}

export function NoHooksRefreshControl({
  refreshing,
  onRefresh,
  tintColor,
}: NoHooksRefreshControlProps) {
  console.log('🔍 NoHooksRefreshControl: Rendering with NO HOOKS:', { refreshing, tintColor });

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => {
        console.log('🔍 NoHooksRefreshControl: onRefresh called - NO HOOKS');
        onRefresh();
      }}
      tintColor={tintColor}
      colors={[tintColor]}
    />
  );
}