import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface FadeUpProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fade-up animation component
 * Smooth fade-up with configurable duration and distance
 * Duration: 0.35s (easeInOut)
 */
export default function FadeUp({
  children,
  duration = 350,
  delay = 0,
  distance = 20,
  style,
}: FadeUpProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [duration, delay, distance]);

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

