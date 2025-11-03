import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle, StyleProp } from 'react-native';

type SlideDirection = 'up' | 'down' | 'left' | 'right';

interface SlideInProps {
  children: React.ReactNode;
  direction?: SlideDirection;
  duration?: number;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export default function SlideIn({
  children,
  direction = 'up',
  duration = 300,
  delay = 0,
  distance = 50,
  style,
}: SlideInProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [duration, delay]);

  const getTranslateValue = () => {
    const inputRange = [0, 1];
    const outputRange = direction === 'up' || direction === 'left' 
      ? [distance, 0] 
      : [-distance, 0];
    
    if (direction === 'left' || direction === 'right') {
      return {
        translateX: slideAnim.interpolate({
          inputRange,
          outputRange: direction === 'left' ? [-distance, 0] : [distance, 0],
        }),
      };
    } else {
      return {
        translateY: slideAnim.interpolate({
          inputRange,
          outputRange: direction === 'up' ? [distance, 0] : [-distance, 0],
        }),
      };
    }
  };

  return (
    <Animated.View
      style={[
        {
          opacity: slideAnim,
          ...getTranslateValue(),
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

