import React from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface FadeTransitionProps {
  children: React.ReactNode;
  visible: boolean;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fade transition animation component
 * Smooth fade in/out with configurable duration
 */
export default function FadeTransition({
  children,
  visible,
  duration = 350,
  style,
}: FadeTransitionProps) {
  const opacity = React.useRef(new Animated.Value(visible ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration,
      useNativeDriver: true,
    }).start();
  }, [visible, duration]);

  if (!visible && opacity._value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        {
          opacity,
          flex: 1,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

