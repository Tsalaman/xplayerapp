import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { theme } from '../../constants/theme';

interface PullToRefreshProps extends Omit<RefreshControlProps, 'colors' | 'tintColor'> {
  refreshing: boolean;
  onRefresh: () => void;
}

export default function PullToRefresh({
  refreshing,
  onRefresh,
  ...props
}: PullToRefreshProps) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.colors.primary}
      colors={[theme.colors.primary]}
      {...props}
    />
  );
}

