import React from 'react';
import { Animated, StyleProp, ViewStyle, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SlideTransitionProps {
  children: React.ReactNode;
  visible: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Slide transition animation component
 * Smooth slide in/out with configurable direction and duration
 */
export default function SlideTransition({
  children,
  visible,
  direction = 'right',
  duration = 350,
  style,
}: SlideTransitionProps) {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(visible ? 1 : 0)).current;

  const getInitialTranslate = () => {
    switch (direction) {
      case 'left':
        return { x: SCREEN_WIDTH, y: 0 };
      case 'right':
        return { x: -SCREEN_WIDTH, y: 0 };
      case 'up':
        return { x: 0, y: SCREEN_HEIGHT };
      case 'down':
        return { x: 0, y: -SCREEN_HEIGHT };
      default:
        return { x: 0, y: 0 };
    }
  };

  const getFinalTranslate = () => {
    return { x: 0, y: 0 };
  };

  React.useEffect(() => {
    const initial = getInitialTranslate();
    const final = getFinalTranslate();

    if (visible) {
      // Slide in
      translateX.setValue(initial.x);
      translateY.setValue(initial.y);
      opacity.setValue(0);
    }

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? final.x : initial.x,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? final.y : initial.y,
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
          transform: [{ translateX }, { translateY }],
          flex: 1,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

