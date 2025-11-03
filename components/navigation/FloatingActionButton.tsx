import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import haptic from '../../utils/haptic';

interface FloatingActionButtonProps {
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Enhanced Floating Action Button with pulsating animation
 * Large size (w-16 h-16), mint glow shadow, pulsates every 3s
 */
export default function FloatingActionButton({
  onPress,
  icon = 'add',
  size = 64,
  style,
}: FloatingActionButtonProps) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(1)).current;

  // Pulsating animation every 3 seconds
  useEffect(() => {
    const pulsate = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Initial pulse
    const timeout = setTimeout(pulsate, 1000);

    // Repeat every 3 seconds
    const interval = setInterval(pulsate, 3000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Shadow glow animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shadowAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: false, // Shadow doesn't work with native driver
        }),
        Animated.timing(shadowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const handlePress = () => {
    haptic.light();
    if (onPress) {
      onPress();
    } else {
      router.push('/post/create');
    }
  };

  const shadowOpacity = shadowAnim.interpolate({
    inputRange: [1, 1.2],
    outputRange: [0.6, 0.9],
  });

  const shadowRadius = shadowAnim.interpolate({
    inputRange: [1, 1.2],
    outputRange: [20, 30],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      {/* Mint glow shadow */}
      <Animated.View
        style={[
          styles.shadow,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            shadowOpacity: shadowOpacity,
            shadowRadius: shadowRadius,
          },
        ]}
      />

      {/* Button */}
      <Animated.View
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.navy, theme.colors.mint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderRadius: size / 2 }]}
        >
          <Ionicons
            name={icon}
            size={28}
            color={theme.colors.surface}
          />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: theme.spacing.xl + 16, // Above bottom tab bar
    right: theme.spacing.lg,
    zIndex: 1000,
  },
  shadow: {
    position: 'absolute',
    backgroundColor: theme.colors.mint,
    shadowColor: theme.colors.mint,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({
      ios: {
        shadowOpacity: 0.6,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  button: {
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.navy,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

