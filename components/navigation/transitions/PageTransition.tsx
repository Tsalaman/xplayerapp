import React from 'react';
import { Animated, StyleProp, ViewStyle, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PageTransitionProps {
  children: React.ReactNode;
  visible: boolean;
  direction?: 'forward' | 'backward';
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Page transition with forward/backward slide animation
 * Optimized for tab navigation with smooth easeInOut
 */
export default function PageTransition({
  children,
  visible,
  direction = 'forward',
  duration = 350,
  style,
}: PageTransitionProps) {
  const translateX = React.useRef(new Animated.Value(visible ? 0 : (direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH))).current;
  const opacity = React.useRef(new Animated.Value(visible ? 1 : 0)).current;

  React.useEffect(() => {
    const initialX = direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    const finalX = 0;

    if (visible) {
      translateX.setValue(initialX);
      opacity.setValue(0);
    }

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? finalX : (direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH),
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, direction, duration]);

  if (!visible && opacity._value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateX }],
          flex: 1,
          width: '100%',
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

