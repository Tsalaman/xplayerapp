import { Animated, Easing } from 'react-native';

/**
 * Animation utilities for smooth transitions
 */

/**
 * Fade-up animation for cards and content
 */
export const createFadeUpAnimation = (
  animatedValue: Animated.Value,
  delay: number = 0
) => {
  return Animated.parallel([
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 400,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Fade-in animation
 */
export const createFadeInAnimation = (
  animatedValue: Animated.Value,
  duration: number = 300
) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  });
};

/**
 * Scale animation for buttons and interactive elements
 */
export const createScaleAnimation = (
  animatedValue: Animated.Value,
  toValue: number = 0.95,
  duration: number = 150
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  });
};

/**
 * Spring animation for natural movement
 */
export const createSpringAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  friction: number = 7,
  tension: number = 40
) => {
  return Animated.spring(animatedValue, {
    toValue,
    friction,
    tension,
    useNativeDriver: true,
  });
};

/**
 * Stagger animation for lists
 */
export const createStaggerAnimation = (
  animations: Animated.CompositeAnimation[],
  staggerDelay: number = 100
) => {
  return Animated.stagger(staggerDelay, animations);
};

